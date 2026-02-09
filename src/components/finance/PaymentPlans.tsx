import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { supabase } from '@/integrations/supabase/client';
import { useSchool } from '@/contexts/SchoolContext';
import { useAcademicYear } from '@/contexts/AcademicYearContext';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Plus, Search, User, ChevronDown, CalendarDays } from 'lucide-react';

const PLAN_TYPES = ['monthly', 'quarterly', 'semestral', 'custom'];

const planLabel = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);

const generateInstallments = (
  planType: string,
  totalAmount: number,
  numInstallments: number,
  startDate: string
) => {
  const installments: { installment_number: number; due_date: string; amount: number }[] = [];
  const perInstallment = Math.floor((totalAmount / numInstallments) * 100) / 100;
  const remainder = Math.round((totalAmount - perInstallment * numInstallments) * 100) / 100;

  const monthGap = planType === 'quarterly' ? 3 : planType === 'semestral' ? 6 : 1;

  for (let i = 0; i < numInstallments; i++) {
    const date = new Date(startDate);
    date.setMonth(date.getMonth() + i * monthGap);
    installments.push({
      installment_number: i + 1,
      due_date: date.toISOString().split('T')[0],
      amount: i === numInstallments - 1 ? perInstallment + remainder : perInstallment,
    });
  }
  return installments;
};

export const PaymentPlans = () => {
  const { selectedSchool } = useSchool();
  const { selectedYearId } = useAcademicYear();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [studentSearch, setStudentSearch] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [selectedAssessment, setSelectedAssessment] = useState<any>(null);
  const [expandedPlan, setExpandedPlan] = useState<string | null>(null);
  const [form, setForm] = useState({
    plan_type: 'monthly',
    total_installments: '4',
    grace_period_days: '7',
    late_fee_amount: '0',
    late_fee_type: 'fixed',
    start_date: new Date().toISOString().split('T')[0],
  });

  const { data: schoolData } = useQuery({
    queryKey: ['school-id', selectedSchool],
    queryFn: async () => {
      const { data } = await supabase.from('schools').select('id').eq('code', selectedSchool).single();
      return data;
    },
  });

  const { data: plans = [] } = useQuery({
    queryKey: ['payment-plans', schoolData?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('payment_plans')
        .select('*, students(student_name, lrn), student_assessments(net_amount, balance)')
        .eq('school_id', schoolData!.id)
        .order('created_at', { ascending: false });
      return data || [];
    },
    enabled: !!schoolData?.id,
  });

  // Fetch installments for expanded plan
  const { data: installments = [] } = useQuery({
    queryKey: ['plan-installments', expandedPlan],
    queryFn: async () => {
      const { data } = await supabase
        .from('payment_plan_installments')
        .select('*')
        .eq('plan_id', expandedPlan!)
        .order('installment_number');
      return data || [];
    },
    enabled: !!expandedPlan,
  });

  // Student search
  const { data: searchResults = [] } = useQuery({
    queryKey: ['student-search-plans', schoolData?.id, studentSearch],
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

  // Assessment for selected student
  const { data: assessment } = useQuery({
    queryKey: ['student-assessment-plans', selectedStudent?.id, selectedYearId],
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
    setSelectedAssessment(assessment || null);
  }, [assessment]);

  const previewInstallments = selectedAssessment
    ? generateInstallments(
        form.plan_type,
        Number(selectedAssessment.balance),
        parseInt(form.total_installments) || 1,
        form.start_date
      )
    : [];

  const createPlan = useMutation({
    mutationFn: async () => {
      if (!selectedStudent || !selectedAssessment) throw new Error('Student and assessment required');
      const numInstallments = parseInt(form.total_installments);
      if (!numInstallments || numInstallments < 1) throw new Error('Invalid number of installments');

      // Insert plan
      const { data: plan, error: planErr } = await supabase
        .from('payment_plans')
        .insert({
          student_id: selectedStudent.id,
          assessment_id: selectedAssessment.id,
          school_id: schoolData!.id,
          plan_type: form.plan_type,
          total_installments: numInstallments,
          grace_period_days: parseInt(form.grace_period_days) || 0,
          late_fee_amount: parseFloat(form.late_fee_amount) || 0,
          late_fee_type: form.late_fee_type,
          created_by: user?.id,
        })
        .select('id')
        .single();
      if (planErr) throw planErr;

      // Insert installments
      const rows = previewInstallments.map((inst) => ({
        plan_id: plan.id,
        installment_number: inst.installment_number,
        due_date: inst.due_date,
        amount: inst.amount,
      }));

      const { error: instErr } = await supabase.from('payment_plan_installments').insert(rows);
      if (instErr) throw instErr;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-plans'] });
      toast.success('Payment plan created');
      resetDialog();
    },
    onError: (e: any) => toast.error(e.message),
  });

  const resetDialog = () => {
    setDialogOpen(false);
    setStudentSearch('');
    setSelectedStudent(null);
    setSelectedAssessment(null);
    setForm({
      plan_type: 'monthly',
      total_installments: '4',
      grace_period_days: '7',
      late_fee_amount: '0',
      late_fee_type: 'fixed',
      start_date: new Date().toISOString().split('T')[0],
    });
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Payment Plans</h1>
          <p className="text-muted-foreground">Manage installment schedules</p>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" /> Create Plan
        </Button>
      </motion.div>

      {/* Plans list */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Plan Type</TableHead>
                <TableHead>Installments</TableHead>
                <TableHead>Grace Period</TableHead>
                <TableHead>Late Fee</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {plans.map((p: any) => (
                <Collapsible key={p.id} asChild open={expandedPlan === p.id} onOpenChange={(open) => setExpandedPlan(open ? p.id : null)}>
                  <>
                    <TableRow className="cursor-pointer">
                      <TableCell>{p.students?.student_name || 'N/A'}</TableCell>
                      <TableCell className="capitalize">{p.plan_type}</TableCell>
                      <TableCell>{p.total_installments}</TableCell>
                      <TableCell>{p.grace_period_days} days</TableCell>
                      <TableCell>₱{Number(p.late_fee_amount || 0).toLocaleString()} ({p.late_fee_type})</TableCell>
                      <TableCell>
                        <CollapsibleTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <ChevronDown className={`h-4 w-4 transition-transform ${expandedPlan === p.id ? 'rotate-180' : ''}`} />
                          </Button>
                        </CollapsibleTrigger>
                      </TableCell>
                    </TableRow>
                    <CollapsibleContent asChild>
                      <TableRow>
                        <TableCell colSpan={6} className="bg-muted/30 p-4">
                          {expandedPlan === p.id && (
                            <div className="space-y-2">
                              <p className="text-sm font-medium flex items-center gap-1"><CalendarDays className="h-4 w-4" /> Installment Schedule</p>
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>#</TableHead>
                                    <TableHead>Due Date</TableHead>
                                    <TableHead>Amount</TableHead>
                                    <TableHead>Paid</TableHead>
                                    <TableHead>Status</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {installments.map((inst: any) => (
                                    <TableRow key={inst.id}>
                                      <TableCell>{inst.installment_number}</TableCell>
                                      <TableCell>{new Date(inst.due_date).toLocaleDateString()}</TableCell>
                                      <TableCell>₱{Number(inst.amount).toLocaleString()}</TableCell>
                                      <TableCell>₱{Number(inst.paid_amount || 0).toLocaleString()}</TableCell>
                                      <TableCell>
                                        <Badge variant={inst.status === 'paid' ? 'default' : inst.status === 'overdue' ? 'destructive' : 'secondary'}>
                                          {inst.status}
                                        </Badge>
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                  {installments.length === 0 && (
                                    <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-4">No installments</TableCell></TableRow>
                                  )}
                                </TableBody>
                              </Table>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    </CollapsibleContent>
                  </>
                </Collapsible>
              ))}
              {plans.length === 0 && (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No payment plans found</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create Plan Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) resetDialog(); else setDialogOpen(true); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><CalendarDays className="h-5 w-5" /> Create Payment Plan</DialogTitle>
          </DialogHeader>

          {/* Student search */}
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

          {/* Plan form */}
          {selectedStudent && (
            <div className="space-y-4">
              <div className="bg-muted/50 rounded-md p-3 flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">{selectedStudent.student_name}</p>
                  <p className="text-xs text-muted-foreground">LRN: {selectedStudent.lrn} • {selectedStudent.level}</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => { setSelectedStudent(null); setSelectedAssessment(null); }}>
                  Change
                </Button>
              </div>

              {selectedAssessment ? (
                <>
                  <div className="grid grid-cols-2 gap-2 text-center">
                    <div className="bg-muted/30 rounded-md p-2">
                      <p className="text-xs text-muted-foreground">Assessment Total</p>
                      <p className="font-semibold text-sm">₱{Number(selectedAssessment.net_amount).toLocaleString()}</p>
                    </div>
                    <div className="bg-muted/30 rounded-md p-2">
                      <p className="text-xs text-muted-foreground">Remaining Balance</p>
                      <p className="font-semibold text-sm text-destructive">₱{Number(selectedAssessment.balance).toLocaleString()}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Plan Type</Label>
                      <Select value={form.plan_type} onValueChange={(v) => setForm(f => ({ ...f, plan_type: v }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {PLAN_TYPES.map(t => <SelectItem key={t} value={t}>{planLabel(t)}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Installments</Label>
                      <Input type="number" min="1" max="24" value={form.total_installments} onChange={(e) => setForm(f => ({ ...f, total_installments: e.target.value }))} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Start Date</Label>
                    <Input type="date" value={form.start_date} onChange={(e) => setForm(f => ({ ...f, start_date: e.target.value }))} />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Grace Period (days)</Label>
                      <Input type="number" min="0" value={form.grace_period_days} onChange={(e) => setForm(f => ({ ...f, grace_period_days: e.target.value }))} />
                    </div>
                    <div className="space-y-2">
                      <Label>Late Fee (₱)</Label>
                      <Input type="number" min="0" step="0.01" value={form.late_fee_amount} onChange={(e) => setForm(f => ({ ...f, late_fee_amount: e.target.value }))} />
                    </div>
                  </div>

                  {/* Preview */}
                  {previewInstallments.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Installment Preview</Label>
                      <div className="border rounded-md divide-y text-sm max-h-40 overflow-y-auto">
                        {previewInstallments.map((inst) => (
                          <div key={inst.installment_number} className="flex justify-between px-3 py-1.5">
                            <span>#{inst.installment_number} — {new Date(inst.due_date).toLocaleDateString()}</span>
                            <span className="font-medium">₱{inst.amount.toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-2">No active assessment found for this student.</p>
              )}
            </div>
          )}

          {selectedStudent && selectedAssessment && (
            <DialogFooter>
              <Button variant="outline" onClick={resetDialog}>Cancel</Button>
              <Button onClick={() => createPlan.mutate()} disabled={createPlan.isPending}>
                {createPlan.isPending ? 'Creating...' : 'Create Plan'}
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
