import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, ArrowRight, CheckCircle, Lock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useSchool } from '@/contexts/SchoolContext';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export const YearEndClose = () => {
  const { selectedSchool } = useSchool();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [fromYearId, setFromYearId] = useState('');
  const [toYearId, setToYearId] = useState('');
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
  const [isProcessing, setIsProcessing] = useState(false);

  const { data: schoolData } = useQuery({
    queryKey: ['school-id', selectedSchool],
    queryFn: async () => {
      const { data } = await supabase.from('schools').select('id').eq('code', selectedSchool).single();
      return data;
    },
  });

  const { data: academicYears = [] } = useQuery({
    queryKey: ['academic-years', schoolData?.id],
    queryFn: async () => {
      const { data } = await supabase.from('academic_years').select('*').eq('school_id', schoolData!.id).order('start_date', { ascending: true });
      return data || [];
    },
    enabled: !!schoolData?.id,
  });

  const { data: outstandingAssessments = [], isLoading } = useQuery({
    queryKey: ['outstanding-assessments', schoolData?.id, fromYearId],
    queryFn: async () => {
      const { data } = await supabase
        .from('student_assessments')
        .select('*, students(student_name, lrn, level)')
        .eq('school_id', schoolData!.id)
        .eq('academic_year_id', fromYearId)
        .eq('is_closed', false)
        .gt('balance', 0)
        .order('balance', { ascending: false });
      return data || [];
    },
    enabled: !!schoolData?.id && !!fromYearId,
  });

  const { data: existingCarries = [] } = useQuery({
    queryKey: ['existing-carries', schoolData?.id, fromYearId, toYearId],
    queryFn: async () => {
      const { data } = await supabase
        .from('balance_carry_forwards')
        .select('student_id')
        .eq('school_id', schoolData!.id)
        .eq('from_academic_year_id', fromYearId)
        .eq('to_academic_year_id', toYearId);
      return data || [];
    },
    enabled: !!schoolData?.id && !!fromYearId && !!toYearId,
  });

  const alreadyCarriedIds = new Set(existingCarries.map((c: any) => c.student_id));
  const eligibleAssessments = outstandingAssessments.filter(
    (a: any) => !alreadyCarriedIds.has(a.student_id)
  );

  const totalCarryAmount = eligibleAssessments
    .filter((a: any) => selectedStudents.has(a.id))
    .reduce((sum: number, a: any) => sum + Number(a.balance), 0);

  const fromYear = academicYears.find((y: any) => y.id === fromYearId);
  const toYear = academicYears.find((y: any) => y.id === toYearId);

  const toggleAll = () => {
    if (selectedStudents.size === eligibleAssessments.length) {
      setSelectedStudents(new Set());
    } else {
      setSelectedStudents(new Set(eligibleAssessments.map((a: any) => a.id)));
    }
  };

  const toggleStudent = (id: string) => {
    const next = new Set(selectedStudents);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedStudents(next);
  };

  const executeCarryForward = async () => {
    if (!fromYearId || !toYearId || selectedStudents.size === 0 || !schoolData?.id) return;
    if (fromYearId === toYearId) {
      toast.error('Source and target academic years must be different');
      return;
    }

    setIsProcessing(true);
    let successCount = 0;
    let errorCount = 0;

    try {
      const selectedAssessments = eligibleAssessments.filter((a: any) => selectedStudents.has(a.id));

      for (const assessment of selectedAssessments) {
        try {
          // 1. Check if student already has an assessment in target year
          const { data: existingAssessment } = await supabase
            .from('student_assessments')
            .select('id, total_amount, net_amount, balance')
            .eq('student_id', assessment.student_id)
            .eq('school_id', schoolData.id)
            .eq('academic_year_id', toYearId)
            .maybeSingle();

          let targetAssessmentId: string;

          if (existingAssessment) {
            targetAssessmentId = existingAssessment.id;
          } else {
            // Create new assessment in target year
            const { data: newAssessment, error: createErr } = await supabase
              .from('student_assessments')
              .insert({
                student_id: assessment.student_id,
                school_id: schoolData.id,
                academic_year_id: toYearId,
                total_amount: 0,
                discount_amount: 0,
                net_amount: 0,
                total_paid: 0,
                balance: 0,
                status: 'pending',
                assessed_by: user?.id,
                assessed_at: new Date().toISOString(),
              })
              .select('id')
              .single();
            if (createErr) throw createErr;
            targetAssessmentId = newAssessment.id;
          }

          // 2. Add "Prior Year Balance" line item
          const carryAmount = Number(assessment.balance);
          const { error: itemErr } = await supabase.from('assessment_items').insert({
            assessment_id: targetAssessmentId,
            name: `Prior Year Balance (${fromYear?.name || 'Previous Year'})`,
            amount: carryAmount,
            is_mandatory: true,
            fee_catalog_id: null,
          });
          if (itemErr) throw itemErr;

          // 3. Update target assessment totals
          const { data: currentTarget } = await supabase
            .from('student_assessments')
            .select('total_amount, net_amount, balance')
            .eq('id', targetAssessmentId)
            .single();

          if (currentTarget) {
            await supabase.from('student_assessments').update({
              total_amount: Number(currentTarget.total_amount) + carryAmount,
              net_amount: Number(currentTarget.net_amount) + carryAmount,
              balance: Number(currentTarget.balance) + carryAmount,
            }).eq('id', targetAssessmentId);
          }

          // 4. Close the source assessment
          await supabase.from('student_assessments').update({ is_closed: true }).eq('id', assessment.id);

          // 5. Record carry-forward
          await supabase.from('balance_carry_forwards').insert({
            student_id: assessment.student_id,
            school_id: schoolData.id,
            from_academic_year_id: fromYearId,
            to_academic_year_id: toYearId,
            from_assessment_id: assessment.id,
            to_assessment_id: targetAssessmentId,
            carried_amount: carryAmount,
            carried_by: user?.id,
            notes: `Carried ₱${carryAmount.toLocaleString()} from ${fromYear?.name} to ${toYear?.name}`,
          });

          // 6. Audit log
          await supabase.from('finance_audit_logs').insert({
            school_id: schoolData.id,
            user_id: user?.id,
            action: 'carry_forward',
            table_name: 'balance_carry_forwards',
            record_id: assessment.id,
            new_values: {
              student_id: assessment.student_id,
              from_year: fromYear?.name,
              to_year: toYear?.name,
              amount: carryAmount,
            },
          });

          successCount++;
        } catch (err: any) {
          console.error(`Failed to carry forward for assessment ${assessment.id}:`, err);
          errorCount++;
        }
      }

      if (successCount > 0) {
        toast.success(`Successfully carried forward ${successCount} student balance(s) to ${toYear?.name}`);
        queryClient.invalidateQueries({ queryKey: ['outstanding-assessments'] });
        queryClient.invalidateQueries({ queryKey: ['existing-carries'] });
        queryClient.invalidateQueries({ queryKey: ['student-assessments'] });
        setSelectedStudents(new Set());
      }
      if (errorCount > 0) {
        toast.error(`Failed to process ${errorCount} student(s). Check audit logs.`);
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-foreground">Year-End Close & Carry Forward</h1>
        <p className="text-muted-foreground">Close academic year financials and carry outstanding balances forward</p>
      </motion.div>

      <Card>
        <CardHeader>
          <CardTitle>Select Academic Years</CardTitle>
          <CardDescription>Choose the source year to close and the target year for carried balances</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1 space-y-2">
              <label className="text-sm font-medium">Source Year (to close)</label>
              <Select value={fromYearId} onValueChange={v => { setFromYearId(v); setSelectedStudents(new Set()); }}>
                <SelectTrigger><SelectValue placeholder="Select source year" /></SelectTrigger>
                <SelectContent>
                  {academicYears.map((y: any) => (
                    <SelectItem key={y.id} value={y.id}>{y.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <ArrowRight className="h-5 w-5 text-muted-foreground hidden sm:block" />
            <div className="flex-1 space-y-2">
              <label className="text-sm font-medium">Target Year (carry to)</label>
              <Select value={toYearId} onValueChange={v => { setToYearId(v); setSelectedStudents(new Set()); }}>
                <SelectTrigger><SelectValue placeholder="Select target year" /></SelectTrigger>
                <SelectContent>
                  {academicYears.filter((y: any) => y.id !== fromYearId).map((y: any) => (
                    <SelectItem key={y.id} value={y.id}>{y.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {fromYearId && toYearId && (
        <>
          {alreadyCarriedIds.size > 0 && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertTitle>Some balances already carried</AlertTitle>
              <AlertDescription>
                {alreadyCarriedIds.size} student(s) have already had balances carried from {fromYear?.name} to {toYear?.name}. They are excluded below.
              </AlertDescription>
            </Alert>
          )}

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Outstanding Balances — {fromYear?.name}</CardTitle>
                  <CardDescription>
                    {eligibleAssessments.length} student(s) with outstanding balances
                  </CardDescription>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Selected total</p>
                  <p className="text-2xl font-bold text-foreground">₱{totalCarryAmount.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">{selectedStudents.size} student(s)</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">
                      <Checkbox
                        checked={eligibleAssessments.length > 0 && selectedStudents.size === eligibleAssessments.length}
                        onCheckedChange={toggleAll}
                      />
                    </TableHead>
                    <TableHead>Student</TableHead>
                    <TableHead>Grade</TableHead>
                    <TableHead>Total Assessed</TableHead>
                    <TableHead>Total Paid</TableHead>
                    <TableHead>Balance to Carry</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {eligibleAssessments.map((a: any) => (
                    <TableRow key={a.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedStudents.has(a.id)}
                          onCheckedChange={() => toggleStudent(a.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <div>
                          <span className="font-medium">{a.students?.student_name}</span>
                          <br />
                          <span className="text-xs text-muted-foreground">{a.students?.lrn}</span>
                        </div>
                      </TableCell>
                      <TableCell>{a.students?.level}</TableCell>
                      <TableCell>₱{Number(a.net_amount).toLocaleString()}</TableCell>
                      <TableCell>₱{Number(a.total_paid).toLocaleString()}</TableCell>
                      <TableCell className="font-semibold text-destructive">₱{Number(a.balance).toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                  {eligibleAssessments.length === 0 && !isLoading && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        No outstanding balances for this academic year
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {selectedStudents.size > 0 && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Confirm Carry Forward</AlertTitle>
              <AlertDescription className="space-y-3">
                <p>
                  This will close {selectedStudents.size} assessment(s) from <strong>{fromYear?.name}</strong> and carry
                  a total of <strong>₱{totalCarryAmount.toLocaleString()}</strong> to <strong>{toYear?.name}</strong>.
                </p>
                <p className="text-sm">Closed assessments will no longer accept payments. This action is logged but cannot be automatically reversed.</p>
                <Button
                  onClick={executeCarryForward}
                  disabled={isProcessing}
                  className="mt-2"
                  variant="destructive"
                >
                  <Lock className="h-4 w-4 mr-2" />
                  {isProcessing ? 'Processing...' : `Close & Carry Forward ₱${totalCarryAmount.toLocaleString()}`}
                </Button>
              </AlertDescription>
            </Alert>
          )}
        </>
      )}
    </div>
  );
};
