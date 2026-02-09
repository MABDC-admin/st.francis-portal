import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, ChevronDown, ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useSchool } from '@/contexts/SchoolContext';
import { useAcademicYear } from '@/contexts/AcademicYearContext';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';

const PaymentHistoryRow = ({ assessmentId, schoolId, isOpen }: { assessmentId: string; schoolId: string; isOpen: boolean }) => {
  const { data: payments, isLoading } = useQuery({
    queryKey: ['payment-history', assessmentId, schoolId],
    queryFn: async () => {
      const { data } = await supabase
        .from('payments')
        .select('*')
        .eq('assessment_id', assessmentId)
        .eq('school_id', schoolId)
        .order('payment_date', { ascending: false });
      return data || [];
    },
    enabled: isOpen,
  });

  if (!isOpen) return null;

  return (
    <TableRow className="bg-muted/30 hover:bg-muted/30">
      <TableCell colSpan={9} className="p-0">
        <div className="px-8 py-3">
          <p className="text-xs font-semibold text-muted-foreground mb-2">Payment History</p>
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
            </div>
          ) : payments && payments.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow className="text-xs">
                  <TableHead className="h-8 text-xs">Date</TableHead>
                  <TableHead className="h-8 text-xs">OR #</TableHead>
                  <TableHead className="h-8 text-xs">Amount</TableHead>
                  <TableHead className="h-8 text-xs">Method</TableHead>
                  <TableHead className="h-8 text-xs">Ref #</TableHead>
                  <TableHead className="h-8 text-xs">Status</TableHead>
                  <TableHead className="h-8 text-xs">Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((p: any) => {
                  const isVoided = p.status === 'voided';
                  return (
                    <TableRow key={p.id} className={isVoided ? 'opacity-50' : ''}>
                      <TableCell className={`text-xs ${isVoided ? 'line-through' : ''}`}>
                        {p.payment_date ? format(new Date(p.payment_date), 'MMM dd, yyyy') : '—'}
                      </TableCell>
                      <TableCell className={`text-xs ${isVoided ? 'line-through' : ''}`}>{p.or_number || '—'}</TableCell>
                      <TableCell className={`text-xs ${isVoided ? 'line-through' : ''}`}>₱{Number(p.amount).toLocaleString()}</TableCell>
                      <TableCell className="text-xs">{p.payment_method || '—'}</TableCell>
                      <TableCell className="text-xs">{p.reference_number || '—'}</TableCell>
                      <TableCell className="text-xs">
                        <Badge variant={p.status === 'verified' ? 'default' : p.status === 'voided' ? 'destructive' : 'secondary'} className="text-[10px]">
                          {p.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs max-w-[200px] truncate">
                        {isVoided && p.void_reason ? `[Voided: ${p.void_reason}]` : p.notes || '—'}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <p className="text-xs text-muted-foreground py-2">No payments recorded</p>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
};

export const StudentLedger = () => {
  const { selectedSchool } = useSchool();
  const { selectedYearId } = useAcademicYear();
  const [search, setSearch] = useState('');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const { data: schoolData } = useQuery({
    queryKey: ['school-id', selectedSchool],
    queryFn: async () => {
      const { data } = await supabase.from('schools').select('id').eq('code', selectedSchool).single();
      return data;
    },
  });

  const { data: ledger = [] } = useQuery({
    queryKey: ['student-ledger', schoolData?.id, selectedYearId],
    queryFn: async () => {
      let query = supabase.from('student_assessments').select('*, students(student_name, lrn, level)').eq('school_id', schoolData!.id);
      if (selectedYearId) query = query.eq('academic_year_id', selectedYearId);
      const { data } = await query.order('created_at', { ascending: false });
      return data || [];
    },
    enabled: !!schoolData?.id,
  });

  const filtered = ledger.filter((a: any) => {
    const name = a.students?.student_name?.toLowerCase() || '';
    const lrn = a.students?.lrn?.toLowerCase() || '';
    return name.includes(search.toLowerCase()) || lrn.includes(search.toLowerCase());
  });

  const toggleRow = (id: string) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-foreground">Student Ledger</h1>
        <p className="text-muted-foreground">Complete student account view</p>
      </motion.div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search student..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10" />
                <TableHead>Student</TableHead>
                <TableHead>LRN</TableHead>
                <TableHead>Grade</TableHead>
                <TableHead>Total Charges</TableHead>
                <TableHead>Discounts</TableHead>
                <TableHead>Total Paid</TableHead>
                <TableHead>Balance</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((a: any) => {
                const isExpanded = expandedRows.has(a.id);
                return (
                  <>
                    <TableRow key={a.id} className="cursor-pointer" onClick={() => toggleRow(a.id)}>
                      <TableCell>
                        <Button variant="ghost" size="icon" className="h-6 w-6">
                          {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        </Button>
                      </TableCell>
                      <TableCell className="font-medium">{a.students?.student_name}</TableCell>
                      <TableCell>{a.students?.lrn}</TableCell>
                      <TableCell>{a.students?.level}</TableCell>
                      <TableCell>₱{Number(a.total_amount).toLocaleString()}</TableCell>
                      <TableCell>₱{Number(a.discount_amount).toLocaleString()}</TableCell>
                      <TableCell>₱{Number(a.total_paid).toLocaleString()}</TableCell>
                      <TableCell className="font-bold">₱{Number(a.balance).toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge variant={a.status === 'paid' ? 'default' : a.status === 'partial' ? 'secondary' : 'outline'}>{a.status}</Badge>
                      </TableCell>
                    </TableRow>
                    <PaymentHistoryRow key={`${a.id}-history`} assessmentId={a.id} schoolId={schoolData?.id || ''} isOpen={isExpanded} />
                  </>
                );
              })}
              {filtered.length === 0 && (
                <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground py-8">No records found</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
