import { motion } from 'framer-motion';
import { useState, useCallback, useMemo } from 'react';
import { Bell, Loader2, BookOpen, Award, User, Calendar, LogOut } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { StudentProfileCard } from '@/components/students/StudentProfileCard';
import { supabase } from '@/integrations/supabase/client';
import { Student } from '@/types/student';
import { useQuery } from '@tanstack/react-query';

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

// Custom hook for fetching announcements
const useAnnouncements = (school: string | null | undefined) => {
  return useQuery({
    queryKey: ['announcements', school],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      
      let query = supabase
        .from('school_events')
        .select('id, title, event_date, event_type, description')
        .gte('event_date', today)
        .order('event_date', { ascending: true })
        .limit(5);

      if (school) {
        query = query.or(`school.eq.${school},school.is.null`);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching announcements:', error);
        return [];
      }

      return data || [];
    },
    staleTime: 5 * 60 * 1000,
  });
};

export const StudentPortal = () => {
  // All hooks must be called at the top level, before any conditional returns
  const { user, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  
  // Use custom hooks for data fetching
  const { data: student, isLoading: isLoadingStudent } = useStudentData(user?.id);
  const { data: grades = [], isLoading: isLoadingGrades } = useStudentGrades(student?.id);
  const { data: subjects = [], isLoading: isLoadingSubjects } = useStudentSubjects(student?.id);
  const { data: announcements = [], isLoading: isLoadingAnnouncements } = useAnnouncements(student?.school);

  // Memoize student name for display
  const displayName = useMemo(() => {
    if (student?.student_name) return student.student_name;
    if (user?.email) return user.email.split('@')[0];
    return 'Student';
  }, [student?.student_name, user?.email]);

  // Handle tab navigation
  const handleTabChange = useCallback((tab: string) => {
    setActiveTab(tab);
  }, []);

  // Calculate GPA if grades exist
  const gpa = useMemo(() => {
    if (!grades || grades.length === 0) return null;
    const validGrades = grades.filter((g: any) => g.final_grade != null);
    if (validGrades.length === 0) return null;
    const sum = validGrades.reduce((acc: number, g: any) => acc + (g.final_grade || 0), 0);
    return (sum / validGrades.length).toFixed(2);
  }, [grades]);

  // Loading state
  if (isLoadingStudent) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Logout */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Student Portal</h1>
          <p className="text-muted-foreground mt-1">
            Welcome, {displayName}!
          </p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={signOut}
          className="text-destructive hover:text-destructive hover:bg-destructive/10"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Log out
        </Button>
      </motion.div>

      {/* Quick Stats */}
      {student && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-200/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-blue-500/20">
                  <User className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Level</p>
                  <p className="font-semibold">{student.level}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-200/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-green-500/20">
                  <BookOpen className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Subjects</p>
                  <p className="font-semibold">{subjects.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-200/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-purple-500/20">
                  <Award className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">GPA</p>
                  <p className="font-semibold">{gpa || 'N/A'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 border-orange-200/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-orange-500/20">
                  <Calendar className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Events</p>
                  <p className="font-semibold">{announcements.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="mb-6 flex-wrap">
          <TabsTrigger value="profile">My Profile</TabsTrigger>
          <TabsTrigger value="grades">My Grades</TabsTrigger>
          <TabsTrigger value="subjects">My Subjects</TabsTrigger>
          <TabsTrigger value="announcements">Announcements</TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile">
          {student ? (
            <StudentProfileCard student={student} showPhotoUpload={false} showEditButton={false} />
          ) : (
            <Card>
              <CardContent className="py-10 text-center">
                <p className="text-muted-foreground">
                  Student profile not found. Please contact your administrator.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Grades Tab */}
        <TabsContent value="grades">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  My Grades
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
                        </tr>
                      </thead>
                      <tbody>
                        {grades.map((grade: any) => (
                          <tr key={grade.id} className="border-b hover:bg-muted/50">
                            <td className="py-3 px-2">
                              <div>
                                <p className="font-medium">{grade.subjects?.name || 'Unknown'}</p>
                                <p className="text-xs text-muted-foreground">{grade.subjects?.code}</p>
                              </div>
                            </td>
                            <td className="text-center py-3 px-2">{grade.q1_grade ?? '-'}</td>
                            <td className="text-center py-3 px-2">{grade.q2_grade ?? '-'}</td>
                            <td className="text-center py-3 px-2">{grade.q3_grade ?? '-'}</td>
                            <td className="text-center py-3 px-2">{grade.q4_grade ?? '-'}</td>
                            <td className="text-center py-3 px-2 font-semibold">
                              {grade.final_grade ?? '-'}
                            </td>
                          </tr>
                        ))}
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
        </TabsContent>

        {/* Subjects Tab */}
        <TabsContent value="subjects">
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
        </TabsContent>

        {/* Announcements Tab */}
        <TabsContent value="announcements">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  School Announcements
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingAnnouncements ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : announcements.length > 0 ? (
                  <div className="space-y-3">
                    {announcements.map((item: any) => (
                      <motion.div 
                        key={item.id} 
                        className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
                        whileHover={{ scale: 1.01 }}
                      >
                        <div>
                          <p className="font-medium">{item.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(item.event_date).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </p>
                          {item.description && (
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                              {item.description}
                            </p>
                          )}
                        </div>
                        <Badge variant="outline">{item.event_type}</Badge>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    No upcoming announcements.
                  </p>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  );
};