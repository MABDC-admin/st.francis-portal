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
import { Search, CreditCard, Plus, User, Receipt, Banknote, Wallet, DollarSign, Printer, Pencil, CalendarIcon } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useSchool } from '@/contexts/SchoolContext';
import { useAcademicYear } from '@/contexts/AcademicYearContext';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

const PAYMENT_METHODS = ['cash', 'bank_deposit', 'online_transfer', 'e_wallet', 'card'];

const methodLabel = (m: string) => m.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

const paymentStatusColors: Record<string, string> = {
  verified: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  voided: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
};

const numberToWords = (num: number): string => {
  if (num === 0) return 'Zero';
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const convert = (n: number): string => {
    if (n < 20) return ones[n];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
    if (n < 1000) return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + convert(n % 100) : '');
    if (n < 1000000) return convert(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 ? ' ' + convert(n % 1000) : '');
    return convert(Math.floor(n / 1000000)) + ' Million' + (n % 1000000 ? ' ' + convert(n % 1000000) : '');
  };
  const whole = Math.floor(num);
  const cents = Math.round((num - whole) * 100);
  let result = convert(whole) + ' Pesos';
  if (cents > 0) result += ' and ' + cents + '/100';
  return result;
};

const printReceipt = (payment: any, schoolName: string) => {
  const win = window.open('', '_blank', 'width=400,height=600');
  if (!win) return;
  win.document.write(`
    <!DOCTYPE html>
    <html><head><title>Receipt - ${payment.or_number || 'N/A'}</title>
    <style>
      body { font-family: 'Courier New', monospace; padding: 20px; max-width: 350px; margin: 0 auto; font-size: 12px; }
      .center { text-align: center; }
      .bold { font-weight: bold; }
      .divider { border-top: 1px dashed #000; margin: 8px 0; }
      .row { display: flex; justify-content: space-between; margin: 4px 0; }
      h2 { margin: 4px 0; font-size: 16px; }
      h3 { margin: 4px 0; font-size: 13px; }
      @media print { body { padding: 0; } }
    </style></head><body>
      <div class="center">
        <h2>${schoolName}</h2>
        <h3>OFFICIAL RECEIPT</h3>
      </div>
      <div class="divider"></div>
      <div class="row"><span>OR No:</span><span class="bold">${payment.or_number || payment.reference_number || '—'}</span></div>
      <div class="row"><span>Date:</span><span>${new Date(payment.payment_date).toLocaleDateString()}</span></div>
      <div class="divider"></div>
      <div class="row"><span>Student:</span><span class="bold">${payment.students?.student_name || 'N/A'}</span></div>
      <div class="row"><span>LRN:</span><span>${payment.students?.lrn || 'N/A'}</span></div>
      <div class="row"><span>Grade:</span><span>${payment.students?.level || 'N/A'}</span></div>
      <div class="divider"></div>
      <div class="row"><span>Method:</span><span>${payment.payment_method?.replace(/_/g, ' ').toUpperCase()}</span></div>
      ${payment.reference_number ? `<div class="row"><span>Ref #:</span><span>${payment.reference_number}</span></div>` : ''}
      <div class="divider"></div>
      <div class="row bold" style="font-size:14px;"><span>Amount:</span><span>₱${Number(payment.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></div>
      <div style="margin-top:4px;font-size:11px;font-style:italic;">${numberToWords(Number(payment.amount))}</div>
      ${payment.notes ? `<div class="divider"></div><div><span>Notes: </span><span>${payment.notes}</span></div>` : ''}
      <div class="divider"></div>
      <div class="center" style="margin-top:12px;font-size:10px;">Thank you for your payment!</div>
      <script>window.onload=function(){window.print();}</script>
    </body></html>
  `);
  win.document.close();
};

export const PaymentCollection = () => {
  const { selectedSchool } = useSchool();
  const { selectedYearId } = useAcademicYear();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [studentSearch, setStudentSearch] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [selectedAssessment, setSelectedAssessment] = useState<any>(null);
  const [gradeFilter, setGradeFilter] = useState('all');
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<any>(null);
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    payment_method: 'cash',
    reference_number: '',
    notes: '',
    payment_date: new Date(),
  });
  const [editForm, setEditForm] = useState({
    amount: '',
    payment_method: 'cash',
    reference_number: '',
    notes: '',
    payment_date: new Date(),
  });

  const { data: schoolData } = useQuery({
    queryKey: ['school-id', selectedSchool],
    queryFn: async () => {
      const { data } = await supabase.from('schools').select('id, code, name').eq('code', selectedSchool).single();
      return data;
    },
  });

  const { data: recentPayments = [] } = useQuery({
    queryKey: ['recent-payments', schoolData?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('payments')
        .select('*, students(student_name, lrn, level)')
        .eq('school_id', schoolData!.id)
        .order('created_at', { ascending: false })
        .limit(50);
      return data || [];
    },
    enabled: !!schoolData?.id,
  });

  const gradeLevels = [...new Set(recentPayments.map((p: any) => p.students?.level).filter(Boolean))].sort();

  const filteredPayments = gradeFilter === 'all'
    ? recentPayments
    : recentPayments.filter((p: any) => p.students?.level === gradeFilter);

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
        payment_date: paymentForm.payment_date.toISOString(),
      });
      if (payErr) throw payErr;

      const newTotalPaid = Number(selectedAssessment.total_paid) + amount;
      const newBalance = Number(selectedAssessment.net_amount) - newTotalPaid;
      const newStatus = newBalance <= 0 ? 'paid' : newTotalPaid > 0 ? 'partial' : 'pending';

      const { error: updErr } = await supabase
        .from('student_assessments')
        .update({ total_paid: newTotalPaid, balance: Math.max(0, newBalance), status: newStatus })
        .eq('id', selectedAssessment.id);
      if (updErr) throw updErr;

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

  const editPayment = useMutation({
    mutationFn: async () => {
      if (!editingPayment) throw new Error('No payment selected');
      const newAmount = parseFloat(editForm.amount);
      if (!newAmount || newAmount <= 0) throw new Error('Invalid amount');
      if (editForm.payment_method !== 'cash' && !editForm.reference_number.trim()) {
        throw new Error('Reference number is required for non-cash payments');
      }

      const oldAmount = Number(editingPayment.amount);

      // 1. Void original payment
      const { error: voidErr } = await supabase.from('payments').update({
        status: 'voided',
        voided_by: user?.id,
        voided_at: new Date().toISOString(),
        void_reason: 'Corrected/Edited',
      }).eq('id', editingPayment.id);
      if (voidErr) throw voidErr;

      // 2. Get new OR number
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

      // 3. Insert corrected payment
      const { error: payErr } = await supabase.from('payments').insert({
        student_id: editingPayment.student_id,
        assessment_id: editingPayment.assessment_id,
        school_id: editingPayment.school_id,
        academic_year_id: editingPayment.academic_year_id,
        amount: newAmount,
        payment_method: editForm.payment_method,
        reference_number: editForm.reference_number || null,
        notes: editForm.notes ? `[Corrected from ${editingPayment.or_number}] ${editForm.notes}` : `[Corrected from ${editingPayment.or_number}]`,
        received_by: user?.id,
        status: 'verified',
        or_number: orNumber,
        receipt_type: 'OR',
        payment_date: editForm.payment_date.toISOString(),
      });
      if (payErr) throw payErr;

      // 4. Recalculate assessment totals
      if (editingPayment.assessment_id) {
        const { data: assessmentData } = await supabase
          .from('student_assessments')
          .select('*')
          .eq('id', editingPayment.assessment_id)
          .single();

        if (assessmentData) {
          const newTotalPaid = Number(assessmentData.total_paid) - oldAmount + newAmount;
          const newBalance = Number(assessmentData.net_amount) - newTotalPaid;
          const newStatus = newBalance <= 0 ? 'paid' : newTotalPaid > 0 ? 'partial' : 'pending';

          await supabase.from('student_assessments').update({
            total_paid: Math.max(0, newTotalPaid),
            balance: Math.max(0, newBalance),
            status: newStatus,
          }).eq('id', editingPayment.assessment_id);
        }
      }

      // 5. Increment OR number
      if (settings?.id) {
        await supabase.from('finance_settings').update({ or_next_number: orSeq + 1 }).eq('id', settings.id);
      }

      return orNumber;
    },
    onSuccess: (orNumber) => {
      queryClient.invalidateQueries({ queryKey: ['recent-payments'] });
      queryClient.invalidateQueries({ queryKey: ['student-assessment-payment'] });
      toast.success(`Payment corrected — new ${orNumber}`);
      setEditDialogOpen(false);
      setEditingPayment(null);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const resetDialog = () => {
    setDialogOpen(false);
    setStudentSearch('');
    setSelectedStudent(null);
    setSelectedAssessment(null);
    setPaymentForm({ amount: '', payment_method: 'cash', reference_number: '', notes: '', payment_date: new Date() });
  };

  const openEditDialog = (payment: any) => {
    setEditingPayment(payment);
    setEditForm({
      amount: String(payment.amount),
      payment_method: payment.payment_method || 'cash',
      reference_number: payment.reference_number || '',
      notes: '',
      payment_date: payment.payment_date ? new Date(payment.payment_date) : new Date(),
    });
    setEditDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <DollarSign className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Cashier Dashboard</h1>
            <p className="text-muted-foreground">Accept and record payments</p>
          </div>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" /> Collect Payment
        </Button>
      </motion.div>

      {/* Grade Filter */}
      <div className="flex gap-3 items-center">
        <Label className="text-sm text-muted-foreground">Filter by Grade:</Label>
        <Select value={gradeFilter} onValueChange={setGradeFilter}>
          <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Grades</SelectItem>
            {gradeLevels.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Recent Payments Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><CreditCard className="h-5 w-5" />Recent Payments</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Student</TableHead>
                <TableHead>Grade</TableHead>
                <TableHead><span className="flex items-center gap-1"><Banknote className="h-3.5 w-3.5" />Amount</span></TableHead>
                <TableHead><span className="flex items-center gap-1"><Wallet className="h-3.5 w-3.5" />Method</span></TableHead>
                <TableHead>OR #</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPayments.map((p: any) => (
                <TableRow key={p.id} className={p.status === 'voided' ? 'opacity-50' : ''}>
                  <TableCell>
                    <div><span className="font-medium">{p.students?.student_name || 'N/A'}</span><br /><span className="text-xs text-muted-foreground">{p.students?.lrn}</span></div>
                  </TableCell>
                  <TableCell>{p.students?.level || '—'}</TableCell>
                  <TableCell className="font-medium">₱{Number(p.amount).toLocaleString()}</TableCell>
                  <TableCell className="capitalize">{p.payment_method?.replace(/_/g, ' ')}</TableCell>
                  <TableCell className="font-mono text-xs">{p.or_number || p.reference_number || '—'}</TableCell>
                  <TableCell>
                    <Badge className={paymentStatusColors[p.status] || ''}>{p.status}</Badge>
                  </TableCell>
                  <TableCell>{new Date(p.payment_date).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {p.status === 'verified' && (
                        <Button variant="ghost" size="icon" className="h-7 w-7" title="Edit Payment" onClick={() => openEditDialog(p)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" className="h-7 w-7" title="Print Receipt" onClick={() => printReceipt(p, schoolData?.name || selectedSchool || 'School')}>
                        <Printer className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredPayments.length === 0 && (
                <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">No recent payments</TableCell></TableRow>
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

          {!selectedStudent && (
            <div className="space-y-3">
              <Label>Search Student (Name or LRN)</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Type at least 2 characters..." value={studentSearch} onChange={(e) => setStudentSearch(e.target.value)} className="pl-9" />
              </div>
              {searchResults.length > 0 && (
                <div className="border rounded-md divide-y max-h-48 overflow-y-auto">
                  {searchResults.map((s: any) => (
                    <button key={s.id} onClick={() => { setSelectedStudent(s); setStudentSearch(''); }} className="w-full text-left px-3 py-2 hover:bg-accent flex items-center gap-2">
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

          {selectedStudent && (
            <div className="space-y-4">
              <div className="bg-muted/50 rounded-md p-3 flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">{selectedStudent.student_name}</p>
                  <p className="text-xs text-muted-foreground">LRN: {selectedStudent.lrn} • {selectedStudent.level}</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => { setSelectedStudent(null); setSelectedAssessment(null); }}>Change</Button>
              </div>

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
                    <Input type="number" min="0" step="0.01" value={paymentForm.amount} onChange={(e) => setPaymentForm(f => ({ ...f, amount: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Payment Method</Label>
                    <Select value={paymentForm.payment_method} onValueChange={(v) => setPaymentForm(f => ({ ...f, payment_method: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {PAYMENT_METHODS.map(m => <SelectItem key={m} value={m}>{methodLabel(m)}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  {paymentForm.payment_method !== 'cash' && (
                    <div className="space-y-2">
                      <Label>Reference Number <span className="text-destructive">*</span></Label>
                      <Input value={paymentForm.reference_number} onChange={(e) => setPaymentForm(f => ({ ...f, reference_number: e.target.value }))} placeholder="Transaction / deposit reference" />
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label>Payment Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !paymentForm.payment_date && "text-muted-foreground")}>
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {paymentForm.payment_date ? format(paymentForm.payment_date, 'PPP') : <span>Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={paymentForm.payment_date}
                          onSelect={(date) => date && setPaymentForm(f => ({ ...f, payment_date: date }))}
                          disabled={(date) => date > new Date()}
                          initialFocus
                          className={cn("p-3 pointer-events-auto")}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="space-y-2">
                    <Label>Notes (optional)</Label>
                    <Textarea value={paymentForm.notes} onChange={(e) => setPaymentForm(f => ({ ...f, notes: e.target.value }))} placeholder="Additional remarks..." rows={2} />
                  </div>
                </>
              )}
            </div>
          )}

          {selectedStudent && selectedAssessment && (
            <DialogFooter>
              <Button variant="outline" onClick={resetDialog}>Cancel</Button>
              <Button onClick={() => recordPayment.mutate()} disabled={recordPayment.isPending || !paymentForm.amount || parseFloat(paymentForm.amount) <= 0}>
                {recordPayment.isPending ? 'Recording...' : 'Record Payment'}
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Payment Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={(open) => { if (!open) { setEditDialogOpen(false); setEditingPayment(null); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Pencil className="h-5 w-5" />Edit Payment</DialogTitle>
          </DialogHeader>
          {editingPayment && (
            <div className="space-y-4">
              <div className="bg-muted/50 rounded-md p-3">
                <p className="text-sm"><strong>{editingPayment.students?.student_name}</strong></p>
                <p className="text-xs text-muted-foreground">Original OR: {editingPayment.or_number} • Original Amount: ₱{Number(editingPayment.amount).toLocaleString()}</p>
              </div>
              <p className="text-xs text-muted-foreground">The original payment will be voided and a new corrected payment will be created to preserve the audit trail.</p>

              <div className="space-y-2">
                <Label>Corrected Amount (₱)</Label>
                <Input type="number" min="0" step="0.01" value={editForm.amount} onChange={(e) => setEditForm(f => ({ ...f, amount: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Payment Method</Label>
                <Select value={editForm.payment_method} onValueChange={(v) => setEditForm(f => ({ ...f, payment_method: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PAYMENT_METHODS.map(m => <SelectItem key={m} value={m}>{methodLabel(m)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              {editForm.payment_method !== 'cash' && (
                <div className="space-y-2">
                  <Label>Reference Number <span className="text-destructive">*</span></Label>
                  <Input value={editForm.reference_number} onChange={(e) => setEditForm(f => ({ ...f, reference_number: e.target.value }))} />
                </div>
              )}
              <div className="space-y-2">
                <Label>Payment Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !editForm.payment_date && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {editForm.payment_date ? format(editForm.payment_date, 'PPP') : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={editForm.payment_date}
                      onSelect={(date) => date && setEditForm(f => ({ ...f, payment_date: date }))}
                      disabled={(date) => date > new Date()}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label>Notes (optional)</Label>
                <Textarea value={editForm.notes} onChange={(e) => setEditForm(f => ({ ...f, notes: e.target.value }))} placeholder="Reason for correction..." rows={2} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setEditDialogOpen(false); setEditingPayment(null); }}>Cancel</Button>
            <Button variant="destructive" onClick={() => editPayment.mutate()} disabled={editPayment.isPending || !editForm.amount || parseFloat(editForm.amount) <= 0}>
              {editPayment.isPending ? 'Correcting...' : 'Void & Re-record'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
