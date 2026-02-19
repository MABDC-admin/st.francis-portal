import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useSchool } from '@/contexts/SchoolContext';
import { useAcademicYear } from '@/contexts/AcademicYearContext';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export const FinanceClearance = () => {
  const { selectedSchool } = useSchool();
  const { selectedYearId } = useAcademicYear();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');

  const { data: schoolData } = useQuery({
    queryKey: ['school-id', selectedSchool],
    queryFn: async () => {
      const { data } = await supabase.from('schools').select('id').eq('code', selectedSchool).single();
      return data;
    },
  });

  const { data: clearances = [] } = useQuery({
    queryKey: ['finance-clearance', schoolData?.id, selectedYearId],
    queryFn: async () => {
      let query = supabase.from('finance_clearance').select('*, students(student_name, lrn, level)').eq('school_id', schoolData!.id);
      if (selectedYearId) query = query.eq('academic_year_id', selectedYearId);
      const { data } = await query.order('created_at', { ascending: false });
      return data || [];
    },
    enabled: !!schoolData?.id,
  });

  const toggleClearance = useMutation({
    mutationFn: async ({ id, is_cleared }: { id: string; is_cleared: boolean }) => {
      const { error } = await supabase.from('finance_clearance').update({
        is_cleared,
        cleared_at: is_cleared ? new Date().toISOString() : null,
        cleared_by: is_cleared ? user?.id : null,
      }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance-clearance'] });
      toast.success('Clearance updated');
    },
  });

  const filtered = clearances.filter((c: any) => {
    const name = c.students?.student_name?.toLowerCase() || '';
    return name.includes(search.toLowerCase());
  });

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-foreground">Finance Clearance</h1>
        <p className="text-muted-foreground">Manage student finance clearance status</p>
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
                <TableHead>Student</TableHead>
                <TableHead>Grade</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Blocks Exams</TableHead>
                <TableHead>Blocks Grades</TableHead>
                <TableHead>Blocks Enrollment</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((c: any) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.students?.student_name}</TableCell>
                  <TableCell>{c.students?.level}</TableCell>
                  <TableCell>
                    <Badge variant={c.is_cleared ? 'default' : 'destructive'} className="flex items-center gap-1 w-fit">
                      {c.is_cleared ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                      {c.is_cleared ? 'Cleared' : 'Not Cleared'}
                    </Badge>
                  </TableCell>
                  <TableCell>{c.blocks_exams ? 'Yes' : 'No'}</TableCell>
                  <TableCell>{c.blocks_grades ? 'Yes' : 'No'}</TableCell>
                  <TableCell>{c.blocks_enrollment ? 'Yes' : 'No'}</TableCell>
                  <TableCell>
                    <Button size="sm" variant={c.is_cleared ? 'outline' : 'default'} onClick={() => toggleClearance.mutate({ id: c.id, is_cleared: !c.is_cleared })}>
                      {c.is_cleared ? 'Revoke' : 'Clear'}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No clearance records found</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
