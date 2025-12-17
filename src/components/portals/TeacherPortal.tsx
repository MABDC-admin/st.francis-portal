import { motion } from 'framer-motion';
import { Users, ClipboardCheck, BookOpen, FileText, MessageSquare, Calendar } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface TeacherPortalProps {
  teacherName?: string;
}

export const TeacherPortal = ({ teacherName = 'Teacher' }: TeacherPortalProps) => {
  // Placeholder data - will be connected to real data later
  const myClasses = [
    { id: '1', name: 'Grade 6 - Section A', students: 35, subject: 'Mathematics' },
    { id: '2', name: 'Grade 6 - Section B', students: 32, subject: 'Mathematics' },
    { id: '3', name: 'Grade 7 - Section A', students: 38, subject: 'Science' },
  ];

  const quickActions = [
    { id: 'attendance', title: 'Take Attendance', icon: ClipboardCheck, color: 'bg-green-500' },
    { id: 'grades', title: 'Enter Grades', icon: FileText, color: 'bg-blue-500' },
    { id: 'lessons', title: 'Lesson Plans', icon: BookOpen, color: 'bg-purple-500' },
    { id: 'messages', title: 'Messages', icon: MessageSquare, color: 'bg-orange-500' },
  ];

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Teacher Portal</h1>
        <p className="text-muted-foreground mt-1">Welcome back! Manage your classes and students.</p>
      </motion.div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {quickActions.map((action, index) => (
          <motion.div
            key={action.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="hover:shadow-lg transition-all cursor-pointer hover:scale-105">
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

      {/* My Classes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            My Classes
          </CardTitle>
          <CardDescription>Classes assigned to you this school year</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {myClasses.length > 0 ? (
              myClasses.map((cls, index) => (
                <motion.div
                  key={cls.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
                >
                  <div>
                    <p className="font-medium">{cls.name}</p>
                    <p className="text-sm text-muted-foreground">{cls.subject}</p>
                  </div>
                  <div className="text-right">
                    <Badge variant="secondary">{cls.students} students</Badge>
                  </div>
                </motion.div>
              ))
            ) : (
              <p className="text-muted-foreground text-center py-8">
                No classes assigned yet. Contact your administrator.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Today's Schedule Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Today's Schedule
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            Schedule feature coming soon. Classes and time slots will appear here.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
