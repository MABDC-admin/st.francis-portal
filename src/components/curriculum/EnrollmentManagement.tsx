import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Users, BookOpen, GraduationCap, RefreshCcw, ChevronDown, ChevronRight, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useSchool } from '@/contexts/SchoolContext';

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

interface StudentEnrollment {
  id: string;
  student_name: string;
  lrn: string;
  subjects: { id: string; code: string; name: string; status: string }[];
}

export const EnrollmentManagement = () => {
  const { selectedSchool } = useSchool();
  const [isLoading, setIsLoading] = useState(false);
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [enrollmentStats, setEnrollmentStats] = useState<EnrollmentStat[]>([]);
  const [expandedLevels, setExpandedLevels] = useState<Set<string>>(new Set());
  const [detailedEnrollments, setDetailedEnrollments] = useState<Record<string, StudentEnrollment[]>>({});
  const [loadingLevel, setLoadingLevel] = useState<string | null>(null);
  const GRADE_LEVELS = [
    'Kinder 1', 'Kinder 2',
    'Level 1', 'Level 2', 'Level 3', 'Level 4', 'Level 5', 'Level 6',
    'Level 7', 'Level 8', 'Level 9', 'Level 10', 'Level 11', 'Level 12'
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
      // Get student count for this grade level filtered by school
      const { count: studentCount } = await supabase
        .from('students')
        .select('*', { count: 'exact', head: true })
        .eq('level', level)
        .eq('school', selectedSchool);

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

  const fetchDetailedEnrollments = async (gradeLevel: string) => {
    if (!selectedYear) return;
    
    setLoadingLevel(gradeLevel);
    
    try {
      // Get students for this grade level filtered by school
      const { data: students } = await supabase
        .from('students')
        .select('id, student_name, lrn')
        .eq('level', gradeLevel)
        .eq('school', selectedSchool)
        .order('student_name');

      if (!students) {
        setDetailedEnrollments(prev => ({ ...prev, [gradeLevel]: [] }));
        return;
      }

      const enrollments: StudentEnrollment[] = [];

      for (const student of students) {
        // Get enrolled subjects for this student
        const { data: enrolledSubjects } = await supabase
          .from('student_subjects')
          .select(`
            status,
            subjects:subject_id (
              id,
              code,
              name
            )
          `)
          .eq('student_id', student.id)
          .eq('academic_year_id', selectedYear);

        const subjectsList = (enrolledSubjects || [])
          .filter((e: any) => e.subjects)
          .map((e: any) => ({
            id: e.subjects.id,
            code: e.subjects.code,
            name: e.subjects.name,
            status: e.status || 'enrolled',
          }));

        enrollments.push({
          id: student.id,
          student_name: student.student_name,
          lrn: student.lrn,
          subjects: subjectsList,
        });
      }

      setDetailedEnrollments(prev => ({ ...prev, [gradeLevel]: enrollments }));
    } catch (error) {
      console.error('Error fetching detailed enrollments:', error);
    } finally {
      setLoadingLevel(null);
    }
  };

  const toggleLevel = async (gradeLevel: string) => {
    const newExpanded = new Set(expandedLevels);
    
    if (newExpanded.has(gradeLevel)) {
      newExpanded.delete(gradeLevel);
    } else {
      newExpanded.add(gradeLevel);
      // Fetch detailed data if not already loaded
      if (!detailedEnrollments[gradeLevel]) {
        await fetchDetailedEnrollments(gradeLevel);
      }
    }
    
    setExpandedLevels(newExpanded);
  };
  useEffect(() => {
    fetchData();
    // Clear expanded levels and detailed enrollments when school changes
    setExpandedLevels(new Set());
    setDetailedEnrollments({});
  }, [selectedSchool]);

  useEffect(() => {
    if (selectedYear && subjects.length > 0) {
      fetchEnrollmentStats();
    }
  }, [selectedYear, subjects, selectedSchool]);

  const handleAutoEnroll = async () => {
    if (!selectedYear) {
      toast.error('Please select an academic year');
      return;
    }

    setIsEnrolling(true);
    try {
      let enrolled = 0;
      let skipped = 0;

      // Get all students filtered by school
      const { data: students } = await supabase
        .from('students')
        .select('id, level')
        .eq('school', selectedSchool);

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
                    <Collapsible key={stat.grade_level} open={expandedLevels.has(stat.grade_level)}>
                      <TableRow 
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => toggleLevel(stat.grade_level)}
                      >
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {loadingLevel === stat.grade_level ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : expandedLevels.has(stat.grade_level) ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                            {stat.grade_level}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{stat.student_count} students</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{stat.subject_count} subjects</Badge>
                        </TableCell>
                      </TableRow>
                      
                      <CollapsibleContent asChild>
                        <tr>
                          <td colSpan={3} className="p-0">
                            <AnimatePresence>
                              {expandedLevels.has(stat.grade_level) && (
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: 'auto' }}
                                  exit={{ opacity: 0, height: 0 }}
                                  className="bg-muted/30 border-t border-b"
                                >
                                  <div className="p-4">
                                    {detailedEnrollments[stat.grade_level]?.length > 0 ? (
                                      <div className="space-y-3">
                                        {detailedEnrollments[stat.grade_level].map((student) => (
                                          <div 
                                            key={student.id} 
                                            className="bg-card rounded-lg p-3 border shadow-sm"
                                          >
                                            <div className="flex items-center gap-2 mb-2">
                                              <User className="h-4 w-4 text-muted-foreground" />
                                              <span className="font-medium">{student.student_name}</span>
                                              <Badge variant="outline" className="text-xs font-mono">
                                                {student.lrn}
                                              </Badge>
                                            </div>
                                            {student.subjects.length > 0 ? (
                                              <div className="flex flex-wrap gap-1.5 ml-6">
                                                {student.subjects.map((subject) => (
                                                  <Badge 
                                                    key={subject.id} 
                                                    variant={subject.status === 'enrolled' ? 'default' : 'secondary'}
                                                    className="text-xs"
                                                  >
                                                    {subject.code}
                                                  </Badge>
                                                ))}
                                              </div>
                                            ) : (
                                              <p className="text-sm text-muted-foreground ml-6">
                                                No subjects enrolled
                                              </p>
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                    ) : loadingLevel === stat.grade_level ? (
                                      <div className="flex items-center justify-center py-4">
                                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                                      </div>
                                    ) : (
                                      <p className="text-sm text-muted-foreground text-center py-4">
                                        No students in this grade level
                                      </p>
                                    )}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </td>
                        </tr>
                      </CollapsibleContent>
                    </Collapsible>
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
