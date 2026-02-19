import { motion } from 'framer-motion';
import { useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import { Bell, Loader2, BookOpen, Award, User, Calendar, LogOut, LayoutDashboard, ClipboardList, GraduationCap, CheckCircle, BookMarked, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { StudentProfileCard } from '@/components/students/StudentProfileCard';
import { AnimatedStudentAvatar } from '@/components/students/AnimatedStudentAvatar';
import { StudentIDCard } from '@/components/students/StudentIDCard';
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
import { StudentGradesTab } from './student/StudentGradesTab';
import { StudentScheduleTab } from './student/StudentScheduleTab';
import { StudentAttendanceTab } from './student/StudentAttendanceTab';
import { StudentAssignmentsTab } from './student/StudentAssignmentsTab';
import { StudentExamsTab } from './student/StudentExamsTab';
import { StudentAnnouncementsTab } from './student/StudentAnnouncementsTab';
import { StudentLibraryTab } from './student/StudentLibraryTab';
import { StudentCalendarTab } from './student/StudentCalendarTab';
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { IdCard } from 'lucide-react';

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
  activeSection?: 'dashboard' | 'profile' | 'grades' | 'subjects' | 'schedule' | 'attendance' | 'assignments' | 'exams' | 'announcements' | 'library' | 'calendar';
  onNavigate?: (section: string) => void;
}

export const StudentPortal = ({ activeSection = 'dashboard', onNavigate }: StudentPortalProps) => {
  const { user, signOut } = useAuth();
  const [isIDOpen, setIsIDOpen] = useState(false);
  const [subjectSearchQuery, setSubjectSearchQuery] = useState('');

  // Use custom hooks for data fetching
  const { data: student, isLoading: isLoadingStudent } = useStudentData(user?.id);
  const { data: grades = [], isLoading: isLoadingGrades } = useStudentGrades(student?.id);
  const { data: subjects = [], isLoading: isLoadingSubjects } = useStudentSubjects(student?.id);

  const filteredSubjects = useMemo(() => {
    if (!subjectSearchQuery) return subjects;
    return subjects.filter((s: any) =>
      s.subjects?.name?.toLowerCase().includes(subjectSearchQuery.toLowerCase()) ||
      s.subjects?.code?.toLowerCase().includes(subjectSearchQuery.toLowerCase())
    );
  }, [subjects, subjectSearchQuery]);

  // Memoize student name for display
  const displayName = useMemo(() => {
    if (student?.student_name) return student.student_name;
    if (user?.email) return user.email.split('@')[0];
    return 'Learner';
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
    calendar: 'School Calendar',
  };

  // Handle navigation with mapping to Index.tsx tab names
  const handleNavigation = (section: string) => {
    if (!onNavigate) return;

    const tabMapping: Record<string, string> = {
      'grades': 'student-grades',
      'attendance': 'student-attendance',
      'assignments': 'student-assignments',
      'calendar': 'student-calendar',
      'announcements': 'student-announcements',
      'exams': 'student-exams',
      'profile': 'student-profile',
      'subjects': 'student-subjects',
      'schedule': 'student-schedule',
      'library': 'student-library',
    };

    onNavigate(tabMapping[section] || section);
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
            onCardClick={handleNavigation}
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
        return student ? (
          <StudentGradesTab
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
                <div className="relative mb-6">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <Input
                    type="text"
                    placeholder="Search subjects..."
                    value={subjectSearchQuery}
                    onChange={(e) => setSubjectSearchQuery(e.target.value)}
                    className="pl-12 h-14 bg-slate-50 border-none shadow-sm rounded-2xl font-bold text-slate-700 placeholder:text-slate-400 focus-visible:ring-sky-500"
                  />
                </div>

                {isLoadingSubjects ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : filteredSubjects.length > 0 ? (
                  <div className="grid gap-3 md:grid-cols-2">
                    {filteredSubjects.map((enrollment: any) => (
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
                  <p className="text-center text-muted-foreground py-8 font-bold">
                    {subjectSearchQuery ? `No subjects matching "${subjectSearchQuery}"` : 'No subjects enrolled yet.'}
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

      case 'library':
        return <StudentLibraryTab />;

      case 'calendar':
        return student ? (
          <StudentCalendarTab
            schoolId={student.school_id}
            academicYearId={student.academic_year_id}
          />
        ) : null;

      default:
        return null;
    }
  };

  return (
    <div className="w-full">
      {/* Content */}
      <div className={cn(activeSection === 'dashboard' ? "" : "-mt-6")}>
        {renderContent()}
      </div>
    </div>
  );
};
