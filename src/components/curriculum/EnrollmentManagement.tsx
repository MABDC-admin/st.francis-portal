import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Loader2, Users, BookOpen, GraduationCap, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Subject {
  id: string;
  code: string;
  name: string;
  grade_levels: string[];
}

interface AcademicYear {
  id: string;
  name: string;
  is_current: boolean;
}

interface EnrollmentStat {
  grade_level: string;
  student_count: number;
  subject_count: number;
}

export const EnrollmentManagement = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [enrollmentStats, setEnrollmentStats] = useState<EnrollmentStat[]>([]);

  const GRADE_LEVELS = [
    'Kinder 1', 'Kinder 2',
    'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6',
    'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'
  ];

  const fetchData = async () => {
    setIsLoading(true);
    
    const [subjectsRes, yearsRes] = await Promise.all([
      supabase.from('subjects').select('id, code, name, grade_levels').eq('is_active', true),
      supabase.from('academic_years').select('*').order('start_date', { ascending: false }),
    ]);

    if (subjectsRes.data) setSubjects(subjectsRes.data as Subject[]);
    if (yearsRes.data) {
      setAcademicYears(yearsRes.data as AcademicYear[]);
      const currentYear = yearsRes.data.find((y: AcademicYear) => y.is_current);
      if (currentYear) setSelectedYear(currentYear.id);
    }

    setIsLoading(false);
  };

  const fetchEnrollmentStats = async () => {
    if (!selectedYear) return;

    const stats: EnrollmentStat[] = [];
    
    for (const level of GRADE_LEVELS) {
      // Get student count for this grade level
      const { count: studentCount } = await supabase
        .from('students')
        .select('*', { count: 'exact', head: true })
        .eq('level', level);

      // Get subject count for this grade level
      const subjectCount = subjects.filter(s => s.grade_levels.includes(level)).length;

      if ((studentCount || 0) > 0 || subjectCount > 0) {
        stats.push({
          grade_level: level,
          student_count: studentCount || 0,
          subject_count: subjectCount,
        });
      }
    }

    setEnrollmentStats(stats);
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedYear && subjects.length > 0) {
      fetchEnrollmentStats();
    }
  }, [selectedYear, subjects]);

  const handleAutoEnroll = async () => {
    if (!selectedYear) {
      toast.error('Please select an academic year');
      return;
    }

    setIsEnrolling(true);
    try {
      let enrolled = 0;
      let skipped = 0;

      // Get all students
      const { data: students } = await supabase.from('students').select('id, level');

      for (const student of students || []) {
        // Get subjects for this student's grade level
        const studentSubjects = subjects.filter(s => s.grade_levels.includes(student.level));

        for (const subject of studentSubjects) {
          // Check if already enrolled
          const { data: existing } = await supabase
            .from('student_subjects')
            .select('id')
            .eq('student_id', student.id)
            .eq('subject_id', subject.id)
            .eq('academic_year_id', selectedYear)
            .maybeSingle();

          if (!existing) {
            const { error } = await supabase.from('student_subjects').insert({
              student_id: student.id,
              subject_id: subject.id,
              academic_year_id: selectedYear,
              status: 'enrolled',
            });

            if (!error) enrolled++;
          } else {
            skipped++;
          }
        }
      }

      toast.success(`Auto-enrollment complete: ${enrolled} new enrollments, ${skipped} already enrolled`);
      fetchEnrollmentStats();
    } catch (error: any) {
      console.error('Error:', error);
      toast.error(error.message || 'Failed to auto-enroll');
    } finally {
      setIsEnrolling(false);
    }
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Enrollment</h1>
          <p className="text-muted-foreground mt-1">Auto-enroll students to subjects by grade level</p>
        </div>
      </motion.div>

      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Auto-Enrollment</CardTitle>
          <CardDescription>
            Automatically enroll all students to their grade-level subjects
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Academic Year" />
                </SelectTrigger>
                <SelectContent>
                  {academicYears.map((year) => (
                    <SelectItem key={year.id} value={year.id}>
                      {year.name} {year.is_current && '(Current)'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleAutoEnroll} disabled={isEnrolling || !selectedYear}>
              {isEnrolling ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <GraduationCap className="h-4 w-4 mr-2" />
              )}
              Auto-Enroll All Students
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Enrollment Overview
              </CardTitle>
              <CardDescription>Students and subjects by grade level</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={fetchEnrollmentStats}>
              <RefreshCcw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : enrollmentStats.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Grade Level</TableHead>
                    <TableHead>Students</TableHead>
                    <TableHead>Subjects</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {enrollmentStats.map((stat) => (
                    <TableRow key={stat.grade_level}>
                      <TableCell className="font-medium">{stat.grade_level}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{stat.student_count} students</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{stat.subject_count} subjects</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No enrollment data</p>
              <p className="text-sm">Add subjects and students to see enrollment stats</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
