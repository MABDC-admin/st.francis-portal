import { motion } from 'framer-motion';
import { BookOpen, Calendar, FileText, Bell, User, Clock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';

export const StudentPortal = () => {
  const { user } = useAuth();

  // Placeholder data - will be connected to real student data
  const studentInfo = {
    name: user?.email?.split('@')[0] || 'Student',
    grade: 'Grade 10',
    section: 'Section A',
    lrn: '123456789012',
  };

  const upcomingClasses = [
    { subject: 'Mathematics', time: '8:00 AM', room: 'Room 101' },
    { subject: 'Science', time: '9:00 AM', room: 'Room 203' },
    { subject: 'English', time: '10:00 AM', room: 'Room 105' },
  ];

  const recentGrades = [
    { subject: 'Mathematics', grade: 92, period: 'Q1' },
    { subject: 'Science', grade: 88, period: 'Q1' },
    { subject: 'English', grade: 95, period: 'Q1' },
  ];

  const announcements = [
    { id: 1, title: 'Midterm Exams Schedule', date: 'Dec 15, 2024', type: 'exam' },
    { id: 2, title: 'Christmas Break Announcement', date: 'Dec 10, 2024', type: 'announcement' },
  ];

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Student Portal</h1>
        <p className="text-muted-foreground mt-1">Welcome, {studentInfo.name}!</p>
      </motion.div>

      {/* Student Info Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border-purple-200 dark:border-purple-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center">
                <User className="h-8 w-8 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold">{studentInfo.name}</h2>
                <p className="text-muted-foreground">{studentInfo.grade} - {studentInfo.section}</p>
                <p className="text-sm text-muted-foreground">LRN: {studentInfo.lrn}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Schedule */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Today's Schedule
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {upcomingClasses.map((cls, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div>
                      <p className="font-medium">{cls.subject}</p>
                      <p className="text-sm text-muted-foreground">{cls.room}</p>
                    </div>
                    <Badge variant="outline">{cls.time}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Grades */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Recent Grades
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentGrades.map((grade, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div>
                      <p className="font-medium">{grade.subject}</p>
                      <p className="text-sm text-muted-foreground">{grade.period}</p>
                    </div>
                    <Badge 
                      variant={grade.grade >= 90 ? 'default' : grade.grade >= 75 ? 'secondary' : 'destructive'}
                      className={grade.grade >= 90 ? 'bg-green-500' : ''}
                    >
                      {grade.grade}%
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Announcements */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Announcements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {announcements.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer">
                  <div>
                    <p className="font-medium">{item.title}</p>
                    <p className="text-sm text-muted-foreground">{item.date}</p>
                  </div>
                  <Badge variant="outline">{item.type}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};
