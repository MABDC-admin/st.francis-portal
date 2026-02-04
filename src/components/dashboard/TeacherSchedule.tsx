import { motion } from 'framer-motion';
import { Menu } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface Teacher {
  id: string;
  name: string;
  subject: string;
  time: string;
  duration: string;
  avatar?: string;
}

const mockTeachers: Teacher[] = [
  { id: '1', name: 'Mrs Davis', subject: 'English', time: '10:30AM', duration: '1h 0m' },
  { id: '2', name: 'Mr. Smith', subject: 'Math', time: '12:00M', duration: '1h 0m' },
  { id: '3', name: 'Miss Lee', subject: 'Science', time: '2:00PM', duration: '1h 0m' },
];

export const TeacherSchedule = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.45 }}
    >
      <Card className="h-full">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-base font-semibold">Teacher Schedule</CardTitle>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Menu className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {mockTeachers.map((teacher) => (
            <div
              key={teacher.id}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors"
            >
              <Avatar className="h-10 w-10 border-2 border-muted">
                <AvatarImage src={teacher.avatar} />
                <AvatarFallback className="bg-info/10 text-info text-sm">
                  {teacher.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">{teacher.name}</p>
                <p className="text-xs text-muted-foreground">{teacher.subject}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-foreground">{teacher.time} ▼</p>
                <p className="text-xs text-muted-foreground">{teacher.duration}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </motion.div>
  );
};
