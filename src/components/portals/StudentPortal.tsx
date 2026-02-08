import { motion } from 'framer-motion';
import { useMemo } from 'react';
import { Bell, Loader2, BookOpen, Award, User, Calendar, LogOut, LayoutDashboard, ClipboardList, GraduationCap, CheckCircle, BookMarked } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { StudentProfileCard } from '@/components/students/StudentProfileCard';
import { AnimatedStudentAvatar } from '@/components/students/AnimatedStudentAvatar';
import { supabase } from '@/integrations/supabase/client';
import { Student } from '@/types/student';
import { useQuery } from '@tanstack/react-query';
import {
  computeQuarterlyGeneralAverage,
  computeAnnualGeneralAverage,
  isPassing,
  getGradeDescriptor,
  getGradeColorClass,
  GradeRecord
} from '@/utils/gradeComputation';

// Import new tab components
import { StudentDashboard } from './student/StudentDashboard';
import { StudentScheduleTab } from './student/StudentScheduleTab';
import { StudentAttendanceTab } from './student/StudentAttendanceTab';
import { StudentAssignmentsTab } from './student/StudentAssignmentsTab';
import { StudentExamsTab } from './student/StudentExamsTab';
import { StudentAnnouncementsTab } from './student/StudentAnnouncementsTab';

// Custom hook for fetching student data
const useStudentData = (userId: string | undefined) => {
  return useQuery({
    queryKey: ['student-portal-data', userId],
    queryFn: async () => {
      if (!userId) return null;

      // First get the student_id from user_credentials
      const { data: credentials, error: credError } = await supabase
        .from('user_credentials')
        .select('student_id')
        .eq('user_id', userId)
        .maybeSingle();

      if (credError) {
        console.error('Error fetching credentials:', credError);
        return null;
      }

      if (!credentials?.student_id) {
        console.log('No student credentials found for user');
        return null;
      }

      // Then fetch the student data
      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .select('*')
        .eq('id', credentials.student_id)
        .maybeSingle();

      if (studentError) {
        console.error('Error fetching student:', studentError);
        return null;
      }

      return studentData as Student | null;
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Custom hook for fetching student grades
const useStudentGrades = (studentId: string | undefined) => {
  return useQuery({
    queryKey: ['student-grades', studentId],
    queryFn: async () => {
      if (!studentId) return [];

      const { data, error } = await supabase
        .from('student_grades')
        .select(`
          id,
          q1_grade,
          q2_grade,
          q3_grade,
          q4_grade,
          final_grade,
          subjects:subject_id(code, name),
          academic_years:academic_year_id(name)
        `)
        .eq('student_id', studentId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching grades:', error);
        return [];
      }

      return data || [];
    },
    enabled: !!studentId,
    staleTime: 5 * 60 * 1000,
  });
};

// Custom hook for fetching student subjects
const useStudentSubjects = (studentId: string | undefined) => {
  return useQuery({
    queryKey: ['student-subjects', studentId],
    queryFn: async () => {
      if (!studentId) return [];

      const { data, error } = await supabase
        .from('student_subjects')
        .select(`
          id,
          status,
          subjects:subject_id(id, code, name)
        `)
        .eq('student_id', studentId);

      if (error) {
        console.error('Error fetching subjects:', error);
        return [];
      }

      return data || [];
    },
    enabled: !!studentId,
    staleTime: 5 * 60 * 1000,
  });
};

interface StudentPortalProps {
  activeSection?: 'dashboard' | 'profile' | 'grades' | 'subjects' | 'schedule' | 'attendance' | 'assignments' | 'exams' | 'announcements';
}

export const StudentPortal = ({ activeSection = 'dashboard' }: StudentPortalProps) => {
  const { user, signOut } = useAuth();
  
  // Use custom hooks for data fetching
  const { data: student, isLoading: isLoadingStudent } = useStudentData(user?.id);
  const { data: grades = [], isLoading: isLoadingGrades } = useStudentGrades(student?.id);
  const { data: subjects = [], isLoading: isLoadingSubjects } = useStudentSubjects(student?.id);

  // Memoize student name for display
  const displayName = useMemo(() => {
    if (student?.student_name) return student.student_name;
    if (user?.email) return user.email.split('@')[0];
    return 'Student';
  }, [student?.student_name, user?.email]);

  // Compute General Averages per quarter and annual (DepEd Compliant)
  const generalAverages = useMemo(() => {
    if (!grades || grades.length === 0) return null;
    
    const gradeRecords: GradeRecord[] = grades.map((g: any) => ({
      q1_grade: g.q1_grade,
      q2_grade: g.q2_grade,
      q3_grade: g.q3_grade,
      q4_grade: g.q4_grade,
      final_grade: g.final_grade,
    }));

    return {
      q1: computeQuarterlyGeneralAverage(gradeRecords, 'q1'),
      q2: computeQuarterlyGeneralAverage(gradeRecords, 'q2'),
      q3: computeQuarterlyGeneralAverage(gradeRecords, 'q3'),
      q4: computeQuarterlyGeneralAverage(gradeRecords, 'q4'),
      annual: computeAnnualGeneralAverage(gradeRecords)
    };
  }, [grades]);

  // Loading state
  if (isLoadingStudent) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Section title mapping
  const sectionTitles: Record<string, string> = {
    dashboard: 'Dashboard',
    profile: 'My Profile',
    grades: 'My Grades',
    subjects: 'My Subjects',
    schedule: 'Class Schedule',
    attendance: 'Attendance Record',
    assignments: 'Assignments',
    exams: 'Exam Schedule',
    announcements: 'Announcements',
  };

  // Render the content based on activeSection
  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return student ? (
          <StudentDashboard
            studentId={student.id}
            gradeLevel={student.level}
            schoolId={student.school_id}
            academicYearId={student.academic_year_id}
            grades={grades}
            studentName={student.student_name}
            studentPhotoUrl={student.photo_url}
          />
        ) : (
          <Card>
            <CardContent className="py-10 text-center">
              <p className="text-muted-foreground">
                Student profile not found. Please contact your administrator.
              </p>
            </CardContent>
          </Card>
        );

      case 'profile':
        return student ? (
          <StudentProfileCard student={student} showPhotoUpload={false} showEditButton={false} />
        ) : (
          <Card>
            <CardContent className="py-10 text-center">
              <p className="text-muted-foreground">
                Student profile not found. Please contact your administrator.
              </p>
            </CardContent>
          </Card>
        );

      case 'grades':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Quarterly General Averages */}
            {generalAverages && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Award className="h-5 w-5" />
                    Quarterly General Averages
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                    {(['q1', 'q2', 'q3', 'q4'] as const).map((quarter) => {
                      const avg = generalAverages[quarter];
                      const passing = isPassing(avg);
                      return (
                        <div
                          key={quarter}
                          className={`p-4 rounded-lg text-center transition-colors ${
                            avg === null
                              ? 'bg-muted/50'
                              : passing
                                ? 'bg-green-50 border border-green-200 dark:bg-green-950/30 dark:border-green-800'
                                : 'bg-red-50 border border-red-200 dark:bg-red-950/30 dark:border-red-800'
                          }`}
                        >
                          <p className="text-xs text-muted-foreground uppercase font-medium">
                            {quarter.toUpperCase()}
                          </p>
                          <p className={`text-xl font-bold ${
                            avg === null
                              ? 'text-muted-foreground'
                              : passing
                                ? 'text-green-600 dark:text-green-400'
                                : 'text-red-600 dark:text-red-400'
                          }`}>
                            {avg?.toFixed(2) || '-'}
                          </p>
                          {avg !== null && (
                            <Badge 
                              variant={passing ? 'default' : 'destructive'} 
                              className="mt-1 text-xs"
                            >
                              {passing ? 'Passed' : 'Failed'}
                            </Badge>
                          )}
                        </div>
                      );
                    })}
                    {/* Annual/Final Average */}
                    <div
                      className={`p-4 rounded-lg text-center transition-colors ${
                        generalAverages.annual === null
                          ? 'bg-muted/50'
                          : isPassing(generalAverages.annual)
                            ? 'bg-purple-50 border-2 border-purple-300 dark:bg-purple-950/30 dark:border-purple-700'
                            : 'bg-red-50 border-2 border-red-300 dark:bg-red-950/30 dark:border-red-700'
                      }`}
                    >
                      <p className="text-xs text-muted-foreground uppercase font-medium">
                        Final
                      </p>
                      <p className={`text-xl font-bold ${
                        generalAverages.annual === null
                          ? 'text-muted-foreground'
                          : isPassing(generalAverages.annual)
                            ? 'text-purple-600 dark:text-purple-400'
                            : 'text-red-600 dark:text-red-400'
                      }`}>
                        {generalAverages.annual?.toFixed(2) || '-'}
                      </p>
                      {generalAverages.annual !== null && (
                        <Badge 
                          variant={isPassing(generalAverages.annual) ? 'default' : 'destructive'} 
                          className="mt-1 text-xs"
                        >
                          {getGradeDescriptor(generalAverages.annual)}
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Subject Grades Table */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  Subject Grades
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingGrades ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : grades.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-2 font-medium">Subject</th>
                          <th className="text-center py-3 px-2 font-medium">Q1</th>
                          <th className="text-center py-3 px-2 font-medium">Q2</th>
                          <th className="text-center py-3 px-2 font-medium">Q3</th>
                          <th className="text-center py-3 px-2 font-medium">Q4</th>
                          <th className="text-center py-3 px-2 font-medium">Final</th>
                          <th className="text-center py-3 px-2 font-medium">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {grades.map((grade: any) => {
                          const finalGrade = grade.final_grade;
                          const passing = isPassing(finalGrade);
                          return (
                            <tr key={grade.id} className="border-b hover:bg-muted/50">
                              <td className="py-3 px-2">
                                <div>
                                  <p className="font-medium">{grade.subjects?.name || 'Unknown'}</p>
                                  <p className="text-xs text-muted-foreground">{grade.subjects?.code}</p>
                                </div>
                              </td>
                              <td className={`text-center py-3 px-2 ${getGradeColorClass(grade.q1_grade)}`}>
                                {grade.q1_grade ?? '-'}
                              </td>
                              <td className={`text-center py-3 px-2 ${getGradeColorClass(grade.q2_grade)}`}>
                                {grade.q2_grade ?? '-'}
                              </td>
                              <td className={`text-center py-3 px-2 ${getGradeColorClass(grade.q3_grade)}`}>
                                {grade.q3_grade ?? '-'}
                              </td>
                              <td className={`text-center py-3 px-2 ${getGradeColorClass(grade.q4_grade)}`}>
                                {grade.q4_grade ?? '-'}
                              </td>
                              <td className={`text-center py-3 px-2 font-semibold ${getGradeColorClass(finalGrade)}`}>
                                {finalGrade ?? '-'}
                              </td>
                              <td className="text-center py-3 px-2">
                                {finalGrade !== null && (
                                  <Badge variant={passing ? 'default' : 'destructive'}>
                                    {passing ? 'PASSED' : 'FAILED'}
                                  </Badge>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    No grades available yet.
                  </p>
                )}
              </CardContent>
            </Card>
          </motion.div>
        );

      case 'subjects':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  My Subjects
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingSubjects ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : subjects.length > 0 ? (
                  <div className="grid gap-3 md:grid-cols-2">
                    {subjects.map((enrollment: any) => (
                      <Card key={enrollment.id} className="bg-muted/30">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">{enrollment.subjects?.name || 'Unknown'}</p>
                              <p className="text-sm text-muted-foreground">{enrollment.subjects?.code}</p>
                            </div>
                            <Badge variant={enrollment.status === 'enrolled' ? 'default' : 'secondary'}>
                              {enrollment.status || 'enrolled'}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    No subjects enrolled yet.
                  </p>
                )}
              </CardContent>
            </Card>
          </motion.div>
        );

      case 'schedule':
        return student ? (
          <StudentScheduleTab
            gradeLevel={student.level}
            schoolId={student.school_id}
            academicYearId={student.academic_year_id}
          />
        ) : (
          <Card>
            <CardContent className="py-10 text-center">
              <p className="text-muted-foreground">
                Schedule data not available.
              </p>
            </CardContent>
          </Card>
        );

      case 'attendance':
        return student ? (
          <StudentAttendanceTab
            studentId={student.id}
            schoolId={student.school_id}
            academicYearId={student.academic_year_id}
          />
        ) : (
          <Card>
            <CardContent className="py-10 text-center">
              <p className="text-muted-foreground">
                Attendance data not available.
              </p>
            </CardContent>
          </Card>
        );

      case 'assignments':
        return student ? (
          <StudentAssignmentsTab
            studentId={student.id}
            gradeLevel={student.level}
            schoolId={student.school_id}
            academicYearId={student.academic_year_id}
          />
        ) : (
          <Card>
            <CardContent className="py-10 text-center">
              <p className="text-muted-foreground">
                Assignment data not available.
              </p>
            </CardContent>
          </Card>
        );

      case 'exams':
        return student ? (
          <StudentExamsTab
            gradeLevel={student.level}
            schoolId={student.school_id}
            academicYearId={student.academic_year_id}
          />
        ) : (
          <Card>
            <CardContent className="py-10 text-center">
              <p className="text-muted-foreground">
                Exam schedule not available.
              </p>
            </CardContent>
          </Card>
        );

      case 'announcements':
        return student ? (
          <StudentAnnouncementsTab
            schoolId={student.school_id}
            gradeLevel={student.level}
          />
        ) : (
          <Card>
            <CardContent className="py-10 text-center">
              <p className="text-muted-foreground">
                Announcements not available.
              </p>
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Avatar and Logout */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
              {sectionTitles[activeSection] || 'Student Portal'}
            </h1>
            <p className="text-muted-foreground mt-1">
              Welcome, {displayName}!
              {student && (
                <span className="ml-2 text-sm">
                  • {student.level} • {student.school}
                </span>
              )}
            </p>
          </div>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={signOut}
          className="hidden lg:flex text-destructive hover:text-destructive hover:bg-destructive/10"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Log out
        </Button>
      </motion.div>

      {/* Content */}
      {renderContent()}
    </div>
  );
};
