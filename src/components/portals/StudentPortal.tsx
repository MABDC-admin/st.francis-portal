import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Bell, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { StudentProfileCard } from '@/components/students/StudentProfileCard';
import { supabase } from '@/integrations/supabase/client';
import { Student } from '@/types/student';

export const StudentPortal = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [student, setStudent] = useState<Student | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch student data based on logged-in user
  useEffect(() => {
    const fetchStudentData = async () => {
      if (!user?.id) {
        setIsLoading(false);
        return;
      }

      try {
        // First get the student_id from user_credentials
        const { data: credentials, error: credError } = await supabase
          .from('user_credentials')
          .select('student_id')
          .eq('user_id', user.id)
          .single();

        if (credError || !credentials?.student_id) {
          console.log('No student credentials found');
          setIsLoading(false);
          return;
        }

        // Then fetch the student data
        const { data: studentData, error: studentError } = await supabase
          .from('students')
          .select('*')
          .eq('id', credentials.student_id)
          .single();

        if (!studentError && studentData) {
          setStudent(studentData as Student);
        }
      } catch (error) {
        console.error('Error fetching student data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStudentData();
  }, [user?.id]);

  const announcements = [
    { id: 1, title: 'Midterm Exams Schedule', date: 'Dec 15, 2024', type: 'exam' },
    { id: 2, title: 'Christmas Break Announcement', date: 'Dec 10, 2024', type: 'announcement' },
    { id: 3, title: 'Report Card Distribution', date: 'Dec 20, 2024', type: 'notice' },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Student Portal</h1>
        <p className="text-muted-foreground mt-1">
          Welcome, {student?.student_name || user?.email?.split('@')[0] || 'Student'}!
        </p>
      </motion.div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="profile">My Profile</TabsTrigger>
          <TabsTrigger value="announcements">Announcements</TabsTrigger>
        </TabsList>

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
                <div className="space-y-3">
                  {announcements.map((item) => (
                    <motion.div 
                      key={item.id} 
                      className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
                      whileHover={{ scale: 1.01 }}
                    >
                      <div>
                        <p className="font-medium">{item.title}</p>
                        <p className="text-sm text-muted-foreground">{item.date}</p>
                      </div>
                      <Badge variant="outline">{item.type}</Badge>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  );
};