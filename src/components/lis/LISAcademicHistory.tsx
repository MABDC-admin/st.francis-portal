import { useQuery } from '@tanstack/react-query';
import { Loader2, GraduationCap } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';

interface LISAcademicHistoryProps {
  studentId: string;
}

interface GradeRecord {
  id: string;
  subject_name: string;
  subject_code: string;
  q1_grade: number | null;
  q2_grade: number | null;
  q3_grade: number | null;
  q4_grade: number | null;
  final_grade: number | null;
  remarks: string | null;
}

interface AcademicYearGroup {
  year_id: string;
  year_name: string;
  school_name: string;
  level: string;
  grades: GradeRecord[];
}

export const LISAcademicHistory = ({ studentId }: LISAcademicHistoryProps) => {
  const { data: history = [], isLoading } = useQuery({
    queryKey: ['lis-academic-history', studentId],
    queryFn: async (): Promise<AcademicYearGroup[]> => {
      // Fetch all grades for this student across all years
      const { data: grades, error } = await supabase
        .from('student_grades')
        .select(`
          id, q1_grade, q2_grade, q3_grade, q4_grade, final_grade, remarks,
          academic_year_id,
          subjects ( name, code ),
          academic_years ( name, school_id ),
          school_id
        `)
        .eq('student_id', studentId)
        .order('academic_year_id', { ascending: false });

      if (error) throw error;

      // Also get the student's records across years for level info
      const { data: studentRecords } = await supabase
        .from('students')
        .select('level, school, academic_year_id')
        .eq('lrn', (await supabase.from('students').select('lrn').eq('id', studentId).maybeSingle()).data?.lrn || '')
        .order('created_at', { ascending: false });

      // Fetch school names
      const { data: schools } = await supabase.from('schools').select('id, name');
      const schoolMap = new Map((schools || []).map(s => [s.id, s.name]));

      // Group by academic year
      const grouped = new Map<string, AcademicYearGroup>();

      for (const g of (grades || []) as any[]) {
        const yearId = g.academic_year_id;
        const yearName = g.academic_years?.name || 'Unknown Year';
        const schoolName = schoolMap.get(g.school_id) || 'Unknown School';
        const studentRecord = (studentRecords || []).find(
          (r: any) => r.academic_year_id === yearId
        );

        if (!grouped.has(yearId)) {
          grouped.set(yearId, {
            year_id: yearId,
            year_name: yearName,
            school_name: schoolName,
            level: studentRecord?.level || '',
            grades: [],
          });
        }

        grouped.get(yearId)!.grades.push({
          id: g.id,
          subject_name: g.subjects?.name || 'Unknown',
          subject_code: g.subjects?.code || '',
          q1_grade: g.q1_grade,
          q2_grade: g.q2_grade,
          q3_grade: g.q3_grade,
          q4_grade: g.q4_grade,
          final_grade: g.final_grade,
          remarks: g.remarks,
        });
      }

      return Array.from(grouped.values());
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2].map(i => (
          <Card key={i} className="rounded-xl">
            <CardContent className="p-5">
              <Skeleton className="h-6 w-48 mb-4" />
              <Skeleton className="h-32 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <Card className="rounded-xl border-border">
        <CardContent className="p-8 text-center">
          <GraduationCap className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">No academic history found.</p>
        </CardContent>
      </Card>
    );
  }

  const gradeColor = (grade: number | null) => {
    if (grade === null) return 'text-muted-foreground';
    if (grade >= 90) return 'text-green-600 dark:text-green-400 font-semibold';
    if (grade >= 80) return 'text-foreground';
    if (grade >= 75) return 'text-amber-600 dark:text-amber-400';
    return 'text-destructive font-semibold';
  };

  return (
    <div className="space-y-4">
      {history.map((yearGroup) => (
        <Card key={yearGroup.year_id} className="rounded-xl border-border overflow-hidden">
          <div className="bg-muted/40 px-5 py-3 flex items-center justify-between border-b border-border">
            <div className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-primary" />
              <span className="font-semibold text-sm text-foreground">{yearGroup.year_name}</span>
            </div>
            <div className="flex gap-2">
              <Badge variant="secondary" className="text-xs">{yearGroup.level}</Badge>
              <Badge variant="outline" className="text-xs">{yearGroup.school_name}</Badge>
            </div>
          </div>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-xs">Subject</TableHead>
                  <TableHead className="text-xs text-center w-16">Q1</TableHead>
                  <TableHead className="text-xs text-center w-16">Q2</TableHead>
                  <TableHead className="text-xs text-center w-16">Q3</TableHead>
                  <TableHead className="text-xs text-center w-16">Q4</TableHead>
                  <TableHead className="text-xs text-center w-20">Final</TableHead>
                  <TableHead className="text-xs w-24">Remarks</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {yearGroup.grades.map((g) => (
                  <TableRow key={g.id}>
                    <TableCell className="text-sm font-medium">{g.subject_name}</TableCell>
                    <TableCell className={`text-center text-sm ${gradeColor(g.q1_grade)}`}>
                      {g.q1_grade ?? '—'}
                    </TableCell>
                    <TableCell className={`text-center text-sm ${gradeColor(g.q2_grade)}`}>
                      {g.q2_grade ?? '—'}
                    </TableCell>
                    <TableCell className={`text-center text-sm ${gradeColor(g.q3_grade)}`}>
                      {g.q3_grade ?? '—'}
                    </TableCell>
                    <TableCell className={`text-center text-sm ${gradeColor(g.q4_grade)}`}>
                      {g.q4_grade ?? '—'}
                    </TableCell>
                    <TableCell className={`text-center text-sm font-bold ${gradeColor(g.final_grade)}`}>
                      {g.final_grade ?? '—'}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {g.remarks || '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
