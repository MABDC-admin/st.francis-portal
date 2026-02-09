import { motion } from 'framer-motion';
import { Users, ClipboardCheck, BookOpen, FileText, MessageSquare, Calendar, LogOut, Loader2, GraduationCap, Award } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useTeacherProfile, useTeacherSchedule, useTeacherStudentCount } from '@/hooks/useTeacherData';
import { TeacherProfileCard } from '@/components/teachers/TeacherProfileCard';
import { GradesManagement } from '@/components/grades/GradesManagement';
import { AttendanceManagement } from '@/components/management/AttendanceManagement';
import { AssignmentManagement } from '@/components/management/AssignmentManagement';
import { ScheduleManagement } from '@/components/management/ScheduleManagement';

interface TeacherPortalProps {
  activeSection?: 'dashboard' | 'profile' | 'grades' | 'attendance' | 'schedule' | 'assignments';
  onNavigate?: (tab: string) => void;
}

export const TeacherPortal = ({ activeSection = 'dashboard', onNavigate }: TeacherPortalProps) => {
  const { user, signOut } = useAuth();
  const { data: teacher, isLoading } = useTeacherProfile(user?.id);
  const { data: schedules = [] } = useTeacherSchedule(teacher?.id);
  const { data: studentCount = 0 } = useTeacherStudentCount(teacher?.id);

  const displayName = teacher?.full_name || user?.email?.split('@')[0] || 'Teacher';

  const quickActions = [
    { id: 'attendance-mgmt', title: 'Take Attendance', icon: ClipboardCheck, color: 'bg-green-500' },
    { id: 'grades', title: 'Enter Grades', icon: FileText, color: 'bg-blue-500' },
    { id: 'schedule-mgmt', title: 'Class Schedule', icon: Calendar, color: 'bg-purple-500' },
    { id: 'messages', title: 'Messages', icon: MessageSquare, color: 'bg-orange-500' },
  ];

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Section titles
  const sectionTitles: Record<string, string> = {
    dashboard: 'Dashboard',
    profile: 'My Profile',
    grades: 'Grades',
    attendance: 'Attendance',
    schedule: 'Schedule',
    assignments: 'Assignments',
  };

  const renderContent = () => {
    switch (activeSection) {
      case 'profile':
        return teacher ? (
          <TeacherProfileCard teacher={teacher} />
        ) : (
          <Card>
            <CardContent className="py-10 text-center">
              <p className="text-muted-foreground">
                Teacher profile not found. Please contact your administrator.
              </p>
            </CardContent>
          </Card>
        );

      case 'grades':
        return <GradesManagement />;

      case 'attendance':
        return <AttendanceManagement />;

      case 'schedule':
        return <ScheduleManagement />;

      case 'assignments':
        return <AssignmentManagement />;

      case 'dashboard':
      default:
        return (
          <div className="space-y-6">
            {/* Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}>
                <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950/40 dark:to-emerald-900/20 border-emerald-200 dark:border-emerald-800">
                  <CardContent className="pt-6 text-center">
                    <Users className="h-8 w-8 text-emerald-600 dark:text-emerald-400 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">{studentCount}</p>
                    <p className="text-xs text-emerald-600 dark:text-emerald-400">My Learners</p>
                  </CardContent>
                </Card>
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/40 dark:to-blue-900/20 border-blue-200 dark:border-blue-800">
                  <CardContent className="pt-6 text-center">
                    <BookOpen className="h-8 w-8 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{teacher?.subjects?.length || 0}</p>
                    <p className="text-xs text-blue-600 dark:text-blue-400">Subjects</p>
                  </CardContent>
                </Card>
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/40 dark:to-purple-900/20 border-purple-200 dark:border-purple-800">
                  <CardContent className="pt-6 text-center">
                    <Calendar className="h-8 w-8 text-purple-600 dark:text-purple-400 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">{schedules.length}</p>
                    <p className="text-xs text-purple-600 dark:text-purple-400">Classes Today</p>
                  </CardContent>
                </Card>
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                <Card className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950/40 dark:to-amber-900/20 border-amber-200 dark:border-amber-800">
                  <CardContent className="pt-6 text-center">
                    <GraduationCap className="h-8 w-8 text-amber-600 dark:text-amber-400 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-amber-700 dark:text-amber-300">{teacher?.grade_level || '-'}</p>
                    <p className="text-xs text-amber-600 dark:text-amber-400">Grade Level</p>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {quickActions.map((action, index) => (
                <motion.div
                  key={action.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 + 0.4 }}
                >
                  <Card
                    className="hover:shadow-lg transition-all cursor-pointer hover:scale-105"
                    onClick={() => onNavigate?.(action.id)}
                  >
                    <CardContent className="pt-6 text-center">
                      <div className={`w-12 h-12 ${action.color} rounded-full flex items-center justify-center mx-auto mb-3`}>
                        <action.icon className="h-6 w-6 text-white" />
                      </div>
                      <p className="font-medium text-sm">{action.title}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* My Subjects */}
            {teacher?.subjects && teacher.subjects.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    My Subjects
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {teacher.subjects.map((subject, idx) => (
                      <Badge key={idx} variant="secondary" className="text-sm py-1 px-3">
                        {subject}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Today's Schedule */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Today's Schedule
                </CardTitle>
                <CardDescription>Your classes for today</CardDescription>
              </CardHeader>
              <CardContent>
                {schedules.length > 0 ? (
                  <div className="space-y-3">
                    {schedules
                      .filter((s: any) => s.day_of_week === new Date().getDay())
                      .map((schedule: any, index: number) => (
                        <motion.div
                          key={schedule.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                        >
                          <div>
                            <p className="font-medium">{schedule.subjects?.name || 'Unknown'}</p>
                            <p className="text-sm text-muted-foreground">
                              {schedule.grade_level} • {schedule.room || 'No room'}
                            </p>
                          </div>
                          <div className="text-right">
                            <Badge variant="outline">
                              {schedule.start_time?.slice(0, 5)} - {schedule.end_time?.slice(0, 5)}
                            </Badge>
                          </div>
                        </motion.div>
                      ))}
                    {schedules.filter((s: any) => s.day_of_week === new Date().getDay()).length === 0 && (
                      <p className="text-muted-foreground text-center py-4">No classes scheduled for today.</p>
                    )}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">
                    No schedule data available. Contact your administrator.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
            {activeSection === 'dashboard' ? 'Teacher Portal' : sectionTitles[activeSection]}
          </h1>
          <p className="text-muted-foreground mt-1">
            {activeSection === 'dashboard' ? `Welcome back, ${displayName}!` : ''}
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

      {renderContent()}
    </div>
  );
};
