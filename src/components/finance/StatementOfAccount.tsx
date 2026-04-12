import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, FileText, Printer } from 'lucide-react';
import { useSchool } from '@/contexts/SchoolContext';
import { useAcademicYear } from '@/contexts/AcademicYearContext';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

type Student = Tables<'students'>;
type StudentAssessment = Tables<'student_assessments'>;
type Payment = Tables<'payments'>;

const toMoney = (value: number) =>
  `₱${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const statusBadgeVariant = (value: string) => {
  if (value === 'paid') return 'default';
  if (value === 'partial') return 'secondary';
  return 'outline';
};

export const StatementOfAccount = () => {
  const { selectedSchool } = useSchool();
  const { selectedYearId } = useAcademicYear();

  const [studentSearch, setStudentSearch] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  const { data: schoolData } = useQuery({
    queryKey: ['school-id', selectedSchool],
    queryFn: async () => {
      const { data, error } = await supabase.from('schools').select('id, name').eq('code', selectedSchool).single();
      if (error) throw error;
      return data;
    },
    enabled: !!selectedSchool,
  });

  const { data: studentResults = [] } = useQuery({
    queryKey: ['soa-student-search', schoolData?.id, selectedYearId, studentSearch],
    queryFn: async () => {
      if (!studentSearch || studentSearch.trim().length < 2) return [];

      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('school_id', schoolData!.id)
        .eq('academic_year_id', selectedYearId!)
        .or(`student_name.ilike.%${studentSearch}%,lrn.ilike.%${studentSearch}%`)
        .order('student_name')
        .limit(20);

      if (error) throw error;
      return data;
    },
    enabled: !!schoolData?.id && !!selectedYearId && studentSearch.trim().length >= 2,
  });

  const { data: assessment } = useQuery({
    queryKey: ['soa-assessment', schoolData?.id, selectedYearId, selectedStudent?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('student_assessments')
        .select('*')
        .eq('school_id', schoolData!.id)
        .eq('academic_year_id', selectedYearId!)
        .eq('student_id', selectedStudent!.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!schoolData?.id && !!selectedYearId && !!selectedStudent?.id,
  });

  const { data: payments = [] } = useQuery({
    queryKey: ['soa-payments', schoolData?.id, selectedYearId, selectedStudent?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('school_id', schoolData!.id)
        .eq('academic_year_id', selectedYearId!)
        .eq('student_id', selectedStudent!.id)
        .order('payment_date', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!schoolData?.id && !!selectedYearId && !!selectedStudent?.id,
  });

  const typedAssessment = assessment as StudentAssessment | null;
  const typedPayments = payments as Payment[];

  const totals = useMemo(() => {
    const totalPaid = typedPayments
      .filter((payment) => payment.status !== 'voided')
      .reduce((sum, payment) => sum + Number(payment.amount || 0), 0);

    const totalVoided = typedPayments
      .filter((payment) => payment.status === 'voided')
      .reduce((sum, payment) => sum + Number(payment.amount || 0), 0);

    const totalAssessed = Number(typedAssessment?.total_amount || 0);
    const totalDiscount = Number(typedAssessment?.discount_amount || 0);
    const netAmount = Number(typedAssessment?.net_amount || 0);
    const balance = Number(typedAssessment?.balance ?? netAmount - totalPaid);

    return { totalPaid, totalVoided, totalAssessed, totalDiscount, netAmount, balance };
  }, [typedAssessment, typedPayments]);

  const handlePrint = () => {
    if (!selectedStudent) {
      toast.error('Select a student first.');
      return;
    }

    if (!typedAssessment) {
      toast.error('No active assessment found for this student.');
      return;
    }

    const schoolName = schoolData?.name || 'School';
    const today = new Date().toLocaleDateString();

    const paymentsRows = typedPayments
      .map((payment) => {
        const paidDate = payment.payment_date ? new Date(payment.payment_date).toLocaleDateString() : '—';
        const status = payment.status || 'pending';
        return `<tr>
          <td>${paidDate}</td>
          <td>${payment.or_number || '—'}</td>
          <td>${String(payment.payment_method || '—').replace(/_/g, ' ')}</td>
          <td style="text-align:right;">${toMoney(Number(payment.amount || 0))}</td>
          <td>${status}</td>
        </tr>`;
      })
      .join('');

    const popup = window.open('', '_blank', 'width=900,height=700');
    if (!popup) {
      toast.error('Popup blocked. Please allow popups to print SOA.');
      return;
    }

    popup.document.write(`
      <html>
        <head>
          <title>Statement of Account - ${selectedStudent.student_name}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 24px; color: #111; }
            h1, h2, h3 { margin: 0; }
            .muted { color: #666; font-size: 12px; }
            .header { margin-bottom: 20px; }
            .summary { display: grid; grid-template-columns: repeat(2, minmax(180px, 1fr)); gap: 12px; margin: 16px 0; }
            .card { border: 1px solid #ddd; border-radius: 8px; padding: 12px; }
            .label { font-size: 12px; color: #555; }
            .value { font-size: 18px; font-weight: 700; margin-top: 4px; }
            table { width: 100%; border-collapse: collapse; margin-top: 12px; }
            th, td { border: 1px solid #ddd; padding: 8px; font-size: 12px; }
            th { background: #f7f7f7; text-align: left; }
            .right { text-align: right; }
            @media print { body { margin: 0; padding: 16px; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>${schoolName}</h2>
            <h1>Statement of Account</h1>
            <p class="muted">Generated on ${today}</p>
          </div>

          <div>
            <p><strong>Student:</strong> ${selectedStudent.student_name}</p>
            <p><strong>LRN:</strong> ${selectedStudent.lrn}</p>
            <p><strong>Grade/Section:</strong> ${selectedStudent.level}${selectedStudent.strand ? ` / ${selectedStudent.strand}` : ''}</p>
            <p><strong>Parent Contact:</strong> ${selectedStudent.mother_contact || selectedStudent.father_contact || '—'}</p>
          </div>

          <div class="summary">
            <div class="card"><div class="label">Total Assessed</div><div class="value">${toMoney(totals.totalAssessed)}</div></div>
            <div class="card"><div class="label">Discounts</div><div class="value">${toMoney(totals.totalDiscount)}</div></div>
            <div class="card"><div class="label">Net Amount</div><div class="value">${toMoney(totals.netAmount)}</div></div>
            <div class="card"><div class="label">Total Paid</div><div class="value">${toMoney(totals.totalPaid)}</div></div>
            <div class="card"><div class="label">Voided Payments</div><div class="value">${toMoney(totals.totalVoided)}</div></div>
            <div class="card"><div class="label">Remaining Balance</div><div class="value">${toMoney(totals.balance)}</div></div>
          </div>

          <h3>Payment History</h3>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>OR #</th>
                <th>Method</th>
                <th class="right">Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${paymentsRows || '<tr><td colspan="5">No payments recorded</td></tr>'}
            </tbody>
          </table>

          <script>window.onload = function(){window.print();}</script>
        </body>
      </html>
    `);
    popup.document.close();
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-foreground">Statement of Account</h1>
        <p className="text-muted-foreground">Generate learner account statements with payment breakdown.</p>
      </motion.div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5 text-primary" />
            Student Lookup
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="soa-student-search">Search by Student Name or LRN</Label>
            <Input
              id="soa-student-search"
              placeholder="Type at least 2 characters..."
              value={studentSearch}
              onChange={(event) => setStudentSearch(event.target.value)}
            />
          </div>
          {studentSearch.trim().length >= 2 && (
            <div className="border rounded-md divide-y max-h-72 overflow-y-auto">
              {studentResults.length > 0 ? (
                studentResults.map((student) => (
                  <button
                    key={student.id}
                    type="button"
                    className="w-full text-left px-3 py-2 hover:bg-muted transition-colors"
                    onClick={() => {
                      setSelectedStudent(student as Student);
                      setStudentSearch(student.student_name);
                    }}
                  >
                    <p className="font-medium">{student.student_name}</p>
                    <p className="text-xs text-muted-foreground">
                      LRN: {student.lrn} | {student.level}
                    </p>
                  </button>
                ))
              ) : (
                <div className="px-3 py-4 text-sm text-muted-foreground">No matching students found.</div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {selectedStudent && (
        <>
          <Card>
            <CardHeader className="flex flex-row items-start justify-between gap-3">
              <div>
                <CardTitle className="text-xl">{selectedStudent.student_name}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  LRN: {selectedStudent.lrn} | {selectedStudent.level}
                </p>
              </div>
              <Button onClick={handlePrint}>
                <Printer className="h-4 w-4 mr-2" />
                Print / Download SOA
              </Button>
            </CardHeader>
            <CardContent>
              {typedAssessment ? (
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                  <Card><CardContent className="p-3"><p className="text-xs text-muted-foreground">Total Assessed</p><p className="text-sm font-bold">{toMoney(totals.totalAssessed)}</p></CardContent></Card>
                  <Card><CardContent className="p-3"><p className="text-xs text-muted-foreground">Discounts</p><p className="text-sm font-bold">{toMoney(totals.totalDiscount)}</p></CardContent></Card>
                  <Card><CardContent className="p-3"><p className="text-xs text-muted-foreground">Net Amount</p><p className="text-sm font-bold">{toMoney(totals.netAmount)}</p></CardContent></Card>
                  <Card><CardContent className="p-3"><p className="text-xs text-muted-foreground">Total Paid</p><p className="text-sm font-bold text-emerald-600">{toMoney(totals.totalPaid)}</p></CardContent></Card>
                  <Card><CardContent className="p-3"><p className="text-xs text-muted-foreground">Balance</p><p className="text-sm font-bold text-amber-600">{toMoney(totals.balance)}</p></CardContent></Card>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">No assessment found for the selected school year.</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Payment History
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>OR #</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {typedPayments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell>{payment.payment_date ? new Date(payment.payment_date).toLocaleDateString() : '—'}</TableCell>
                      <TableCell>{payment.or_number || '—'}</TableCell>
                      <TableCell>{String(payment.payment_method || '—').replace(/_/g, ' ')}</TableCell>
                      <TableCell>{payment.reference_number || '—'}</TableCell>
                      <TableCell className="text-right font-medium">{toMoney(Number(payment.amount || 0))}</TableCell>
                      <TableCell>
                        <Badge variant={statusBadgeVariant(payment.status || 'pending')}>
                          {payment.status || 'pending'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                  {typedPayments.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        No payments recorded yet.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};
