import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Search, CreditCard, Plus, User, Receipt } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useSchool } from '@/contexts/SchoolContext';
import { useAcademicYear } from '@/contexts/AcademicYearContext';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

const PAYMENT_METHODS = ['cash', 'bank_deposit', 'online_transfer', 'e_wallet', 'card'];

const methodLabel = (m: string) => m.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

export const PaymentCollection = () => {
  const { selectedSchool } = useSchool();
  const { selectedYearId } = useAcademicYear();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [studentSearch, setStudentSearch] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [selectedAssessment, setSelectedAssessment] = useState<any>(null);
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    payment_method: 'cash',
    reference_number: '',
    notes: '',
  });

  const { data: schoolData } = useQuery({
    queryKey: ['school-id', selectedSchool],
    queryFn: async () => {
      const { data } = await supabase.from('schools').select('id, code').eq('code', selectedSchool).single();
      return data;
    },
  });

  const { data: recentPayments = [] } = useQuery({
    queryKey: ['recent-payments', schoolData?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('payments')
        .select('*, students(student_name, lrn)')
        .eq('school_id', schoolData!.id)
        .order('created_at', { ascending: false })
        .limit(20);
      return data || [];
    },
    enabled: !!schoolData?.id,
  });

  // Student search query
  const { data: searchResults = [] } = useQuery({
    queryKey: ['student-search-payment', schoolData?.id, studentSearch],
    queryFn: async () => {
      if (!studentSearch || studentSearch.length < 2) return [];
      const { data } = await supabase
        .from('students')
        .select('id, student_name, lrn, level')
        .eq('school_id', schoolData!.id)
        .or(`student_name.ilike.%${studentSearch}%,lrn.ilike.%${studentSearch}%`)
        .limit(10);
      return data || [];
    },
    enabled: !!schoolData?.id && studentSearch.length >= 2,
  });

  // Active assessment for selected student
  const { data: assessment } = useQuery({
    queryKey: ['student-assessment-payment', selectedStudent?.id, selectedYearId],
    queryFn: async () => {
      const { data } = await supabase
        .from('student_assessments')
        .select('*')
        .eq('student_id', selectedStudent!.id)
        .eq('school_id', schoolData!.id)
        .eq('academic_year_id', selectedYearId!)
        .eq('is_closed', false)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      return data;
    },
    enabled: !!selectedStudent?.id && !!schoolData?.id && !!selectedYearId,
  });

  // Pre-fill amount when assessment loads
  useEffect(() => {
    if (assessment) {
      setSelectedAssessment(assessment);
      setPaymentForm(f => ({ ...f, amount: String(assessment.balance) }));
    } else {
      setSelectedAssessment(null);
    }
  }, [assessment]);

  const recordPayment = useMutation({
    mutationFn: async () => {
      const amount = parseFloat(paymentForm.amount);
      if (!amount || amount <= 0) throw new Error('Invalid amount');
      if (!selectedStudent) throw new Error('No student selected');
      if (!selectedAssessment) throw new Error('No active assessment found');
      if (paymentForm.payment_method !== 'cash' && !paymentForm.reference_number.trim()) {
        throw new Error('Reference number is required for non-cash payments');
      }

      // Get OR number
      const { data: settings } = await supabase
        .from('finance_settings')
        .select('id, or_next_number, or_number_format')
        .eq('school_id', schoolData!.id)
        .maybeSingle();

      const orSeq = settings?.or_next_number || 1;
      const orFormat = settings?.or_number_format || 'OR-{YYYY}-{SEQ}';
      const orNumber = orFormat
        .replace('{YYYY}', new Date().getFullYear().toString())
        .replace('{SEQ}', String(orSeq).padStart(6, '0'));

      // Insert payment
      const { error: payErr } = await supabase.from('payments').insert({
        student_id: selectedStudent.id,
        assessment_id: selectedAssessment.id,
        school_id: schoolData!.id,
        academic_year_id: selectedYearId!,
        amount,
        payment_method: paymentForm.payment_method,
        reference_number: paymentForm.reference_number || null,
        notes: paymentForm.notes || null,
        received_by: user?.id,
        status: 'verified',
        or_number: orNumber,
        receipt_type: 'OR',
      });
      if (payErr) throw payErr;

      // Update assessment totals
      const newTotalPaid = Number(selectedAssessment.total_paid) + amount;
      const newBalance = Number(selectedAssessment.net_amount) - newTotalPaid;
      const newStatus = newBalance <= 0 ? 'paid' : newTotalPaid > 0 ? 'partial' : 'pending';

      const { error: updErr } = await supabase
        .from('student_assessments')
        .update({ total_paid: newTotalPaid, balance: Math.max(0, newBalance), status: newStatus })
        .eq('id', selectedAssessment.id);
      if (updErr) throw updErr;

      // Increment OR number
      if (settings?.id) {
        await supabase
          .from('finance_settings')
          .update({ or_next_number: orSeq + 1 })
          .eq('id', settings.id);
      }

      return orNumber;
    },
    onSuccess: (orNumber) => {
      queryClient.invalidateQueries({ queryKey: ['recent-payments'] });
      queryClient.invalidateQueries({ queryKey: ['student-assessment-payment'] });
      toast.success(`Payment recorded — ${orNumber}`);
      resetDialog();
    },
    onError: (e: any) => toast.error(e.message),
  });

  const resetDialog = () => {
    setDialogOpen(false);
    setStudentSearch('');
    setSelectedStudent(null);
    setSelectedAssessment(null);
    setPaymentForm({ amount: '', payment_method: 'cash', reference_number: '', notes: '' });
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Cashier Dashboard</h1>
          <p className="text-muted-foreground">Accept and record payments</p>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" /> Collect Payment
        </Button>
      </motion.div>

      {/* Recent Payments Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><CreditCard className="h-5 w-5" />Recent Payments</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>OR #</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentPayments.map((p: any) => (
                <TableRow key={p.id}>
                  <TableCell>{p.students?.student_name || 'N/A'}</TableCell>
                  <TableCell>₱{Number(p.amount).toLocaleString()}</TableCell>
                  <TableCell className="capitalize">{p.payment_method?.replace(/_/g, ' ')}</TableCell>
                  <TableCell>{p.or_number || p.reference_number || '—'}</TableCell>
                  <TableCell><Badge variant={p.status === 'verified' ? 'default' : 'secondary'}>{p.status}</Badge></TableCell>
                  <TableCell>{new Date(p.payment_date).toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
              {recentPayments.length === 0 && (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No recent payments</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Collect Payment Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) resetDialog(); else setDialogOpen(true); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Receipt className="h-5 w-5" />Collect Payment</DialogTitle>
          </DialogHeader>

          {/* Step 1: Student Search */}
          {!selectedStudent && (
            <div className="space-y-3">
              <Label>Search Student (Name or LRN)</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Type at least 2 characters..."
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              {searchResults.length > 0 && (
                <div className="border rounded-md divide-y max-h-48 overflow-y-auto">
                  {searchResults.map((s: any) => (
                    <button
                      key={s.id}
                      onClick={() => { setSelectedStudent(s); setStudentSearch(''); }}
                      className="w-full text-left px-3 py-2 hover:bg-accent flex items-center gap-2"
                    >
                      <User className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div>
                        <p className="text-sm font-medium">{s.student_name}</p>
                        <p className="text-xs text-muted-foreground">LRN: {s.lrn} • {s.level}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              {studentSearch.length >= 2 && searchResults.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-2">No students found</p>
              )}
            </div>
          )}

          {/* Step 2: Assessment + Payment Form */}
          {selectedStudent && (
            <div className="space-y-4">
              {/* Selected student info */}
              <div className="bg-muted/50 rounded-md p-3 flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">{selectedStudent.student_name}</p>
                  <p className="text-xs text-muted-foreground">LRN: {selectedStudent.lrn} • {selectedStudent.level}</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => { setSelectedStudent(null); setSelectedAssessment(null); }}>
                  Change
                </Button>
              </div>

              {/* Assessment info */}
              {selectedAssessment ? (
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-muted/30 rounded-md p-2">
                    <p className="text-xs text-muted-foreground">Total</p>
                    <p className="font-semibold text-sm">₱{Number(selectedAssessment.net_amount).toLocaleString()}</p>
                  </div>
                  <div className="bg-muted/30 rounded-md p-2">
                    <p className="text-xs text-muted-foreground">Paid</p>
                    <p className="font-semibold text-sm text-green-600">₱{Number(selectedAssessment.total_paid).toLocaleString()}</p>
                  </div>
                  <div className="bg-muted/30 rounded-md p-2">
                    <p className="text-xs text-muted-foreground">Balance</p>
                    <p className="font-semibold text-sm text-destructive">₱{Number(selectedAssessment.balance).toLocaleString()}</p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-2">No active assessment found for this student.</p>
              )}

              {selectedAssessment && (
                <>
                  <div className="space-y-2">
                    <Label>Amount (₱)</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={paymentForm.amount}
                      onChange={(e) => setPaymentForm(f => ({ ...f, amount: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Payment Method</Label>
                    <Select value={paymentForm.payment_method} onValueChange={(v) => setPaymentForm(f => ({ ...f, payment_method: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {PAYMENT_METHODS.map(m => (
                          <SelectItem key={m} value={m}>{methodLabel(m)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {paymentForm.payment_method !== 'cash' && (
                    <div className="space-y-2">
                      <Label>Reference Number <span className="text-destructive">*</span></Label>
                      <Input
                        value={paymentForm.reference_number}
                        onChange={(e) => setPaymentForm(f => ({ ...f, reference_number: e.target.value }))}
                        placeholder="Transaction / deposit reference"
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>Notes (optional)</Label>
                    <Textarea
                      value={paymentForm.notes}
                      onChange={(e) => setPaymentForm(f => ({ ...f, notes: e.target.value }))}
                      placeholder="Additional remarks..."
                      rows={2}
                    />
                  </div>
                </>
              )}
            </div>
          )}

          {selectedStudent && selectedAssessment && (
            <DialogFooter>
              <Button variant="outline" onClick={resetDialog}>Cancel</Button>
              <Button
                onClick={() => recordPayment.mutate()}
                disabled={recordPayment.isPending || !paymentForm.amount || parseFloat(paymentForm.amount) <= 0}
              >
                {recordPayment.isPending ? 'Recording...' : 'Record Payment'}
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
