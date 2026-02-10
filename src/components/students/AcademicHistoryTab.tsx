import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { Student } from '@/types/student';

interface StudentGrade {
  id: string;
  subject_code: string;
  subject_name: string;
  q1_grade: number | null;
  q2_grade: number | null;
  q3_grade: number | null;
  q4_grade: number | null;
  final_grade: number | null;
  academic_year: string;
}

interface AcademicHistoryTabProps {
  student: Student;
}

const getGradeColor = (grade: number | null) => {
  if (grade === null) return 'text-muted-foreground';
  if (grade >= 90) return 'text-green-600';
  if (grade >= 80) return 'text-blue-600';
  if (grade >= 75) return 'text-yellow-600';
  return 'text-red-600';
};

const formatDate = (dateStr: string | null) => {
  if (!dateStr) return 'N/A';
  return new Date(dateStr).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
};

export const AcademicHistoryTab = ({ student }: AcademicHistoryTabProps) => {
  const [grades, setGrades] = useState<StudentGrade[]>([]);

  useEffect(() => {
    const fetchGrades = async () => {
      const { data, error } = await supabase
        .from('student_grades')
        .select(`
          id,
          q1_grade,
          q2_grade,
          q3_grade,
          q4_grade,
          final_grade,
          subjects:subject_id (code, name),
          academic_years:academic_year_id (name)
        `)
        .eq('student_id', student.id)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setGrades(data.map((g: any) => ({
          id: g.id,
          subject_code: g.subjects?.code || '',
          subject_name: g.subjects?.name || '',
          q1_grade: g.q1_grade,
          q2_grade: g.q2_grade,
          q3_grade: g.q3_grade,
          q4_grade: g.q4_grade,
          final_grade: g.final_grade,
          academic_year: g.academic_years?.name || 'N/A'
        })));
      }
    };
    fetchGrades();
  }, [student.id]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Academic Background Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900 shadow-lg border-t-4"
          style={{ borderTopColor: '#3b82f6' }}
        >
          <div
            className="px-5 py-3 flex items-center gap-2"
            style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)' }}
          >
            <BookOpen className="h-4 w-4 text-white" />
            <h3 className="font-semibold text-white">Academic Background</h3>
          </div>
          <div className="p-5 space-y-4 bg-gradient-to-br from-blue-50/50 to-white dark:from-slate-800/50 dark:to-slate-900">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">Current Level</p>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{student.level}</p>
              </div>
              <div>
                <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">School</p>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{student.school || 'SFXSAI'}</p>
              </div>
              <div>
                <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">Previous School</p>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{student.previous_school || 'N/A'}</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Enrollment History Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900 shadow-lg border-t-4"
          style={{ borderTopColor: '#22c55e' }}
        >
          <div
            className="px-5 py-3 flex items-center gap-2"
            style={{ background: 'linear-gradient(135deg, #22c55e 0%, #4ade80 100%)' }}
          >
            <Calendar className="h-4 w-4 text-white" />
            <h3 className="font-semibold text-white">Enrollment History</h3>
          </div>
          <div className="p-5 space-y-4 bg-gradient-to-br from-green-50/50 to-white dark:from-slate-800/50 dark:to-slate-900">
            <div>
              <p className="text-xs text-green-600 dark:text-green-400 font-medium">Enrollment Date</p>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{formatDate(student.created_at)}</p>
            </div>
            <div>
              <p className="text-xs text-green-600 dark:text-green-400 font-medium">Status</p>
              <Badge className="bg-green-100 text-green-700 mt-1">Active Student</Badge>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Grades Table */}
      {grades.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900 shadow-lg border-t-4"
          style={{ borderTopColor: '#ec4899' }}
        >
          <div
            className="px-5 py-3 flex items-center justify-between"
            style={{ background: 'linear-gradient(135deg, #ec4899 0%, #f472b6 100%)' }}
          >
            <h3 className="font-semibold text-white">Grade Records</h3>
            <Badge className="bg-white/20 text-white border-0">{grades.length} records</Badge>
          </div>
          <div className="p-5 bg-gradient-to-br from-pink-50/50 to-white dark:from-slate-800/50 dark:to-slate-900">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-pink-200 dark:border-slate-700">
                    <TableHead className="text-pink-600 dark:text-pink-400">Subject</TableHead>
                    <TableHead className="text-pink-600 dark:text-pink-400">Year</TableHead>
                    <TableHead className="text-center text-pink-600 dark:text-pink-400">Q1</TableHead>
                    <TableHead className="text-center text-pink-600 dark:text-pink-400">Q2</TableHead>
                    <TableHead className="text-center text-pink-600 dark:text-pink-400">Q3</TableHead>
                    <TableHead className="text-center text-pink-600 dark:text-pink-400">Q4</TableHead>
                    <TableHead className="text-center text-pink-600 dark:text-pink-400">Final</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {grades.map(grade => (
                    <TableRow key={grade.id} className="border-pink-100 dark:border-slate-700">
                      <TableCell>
                        <Badge className="bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-300">{grade.subject_code}</Badge>
                        <p className="text-xs text-slate-500 mt-1">{grade.subject_name}</p>
                      </TableCell>
                      <TableCell className="text-slate-700 dark:text-slate-300">{grade.academic_year}</TableCell>
                      <TableCell className={`text-center font-medium ${getGradeColor(grade.q1_grade)}`}>{grade.q1_grade ?? '-'}</TableCell>
                      <TableCell className={`text-center font-medium ${getGradeColor(grade.q2_grade)}`}>{grade.q2_grade ?? '-'}</TableCell>
                      <TableCell className={`text-center font-medium ${getGradeColor(grade.q3_grade)}`}>{grade.q3_grade ?? '-'}</TableCell>
                      <TableCell className={`text-center font-medium ${getGradeColor(grade.q4_grade)}`}>{grade.q4_grade ?? '-'}</TableCell>
                      <TableCell className={`text-center font-bold ${getGradeColor(grade.final_grade)}`}>{grade.final_grade ?? '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};
