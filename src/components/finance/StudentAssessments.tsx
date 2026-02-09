import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useSchool } from '@/contexts/SchoolContext';
import { useAcademicYear } from '@/contexts/AcademicYearContext';
import { useQuery } from '@tanstack/react-query';

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  partial: 'bg-blue-100 text-blue-800',
  paid: 'bg-green-100 text-green-800',
  overpaid: 'bg-purple-100 text-purple-800',
};

export const StudentAssessments = () => {
  const { selectedSchool } = useSchool();
  const { selectedYearId } = useAcademicYear();
  const [search, setSearch] = useState('');

  const { data: schoolData } = useQuery({
    queryKey: ['school-id', selectedSchool],
    queryFn: async () => {
      const { data } = await supabase.from('schools').select('id').eq('code', selectedSchool).single();
      return data;
    },
  });

  const { data: assessments = [], isLoading } = useQuery({
    queryKey: ['student-assessments', schoolData?.id, selectedYearId],
    queryFn: async () => {
      let query = supabase.from('student_assessments').select('*, students(student_name, lrn, level)').eq('school_id', schoolData!.id);
      if (selectedYearId) query = query.eq('academic_year_id', selectedYearId);
      const { data } = await query.order('created_at', { ascending: false });
      return data || [];
    },
    enabled: !!schoolData?.id,
  });

  const filtered = assessments.filter((a: any) => {
    const name = a.students?.student_name?.toLowerCase() || '';
    const lrn = a.students?.lrn?.toLowerCase() || '';
    return name.includes(search.toLowerCase()) || lrn.includes(search.toLowerCase());
  });

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-foreground">Student Assessments</h1>
        <p className="text-muted-foreground">View and manage student fee assessments</p>
      </motion.div>

      <div className="flex gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by name or LRN..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Grade</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Discount</TableHead>
                <TableHead>Net</TableHead>
                <TableHead>Paid</TableHead>
                <TableHead>Balance</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((a: any) => (
                <TableRow key={a.id}>
                  <TableCell>
                    <div><span className="font-medium">{a.students?.student_name}</span><br /><span className="text-xs text-muted-foreground">{a.students?.lrn}</span></div>
                  </TableCell>
                  <TableCell>{a.students?.level}</TableCell>
                  <TableCell>₱{Number(a.total_amount).toLocaleString()}</TableCell>
                  <TableCell>₱{Number(a.discount_amount).toLocaleString()}</TableCell>
                  <TableCell>₱{Number(a.net_amount).toLocaleString()}</TableCell>
                  <TableCell>₱{Number(a.total_paid).toLocaleString()}</TableCell>
                  <TableCell className="font-semibold">₱{Number(a.balance).toLocaleString()}</TableCell>
                  <TableCell><Badge className={statusColors[a.status] || ''}>{a.status}</Badge></TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">No assessments found</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
