import { motion } from 'framer-motion';
import { Calendar, BookOpen, Beaker, Maximize2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface Event {
  id: string;
  title: string;
  date: string;
  icon: 'calendar' | 'book' | 'science';
  color: string;
}

const mockEvents: Event[] = [
  { id: '1', title: 'School Assembly', date: 'Apr 24', icon: 'calendar', color: 'bg-destructive' },
  { id: '2', title: 'Math Exam', date: 'Apr 25', icon: 'book', color: 'bg-info' },
  { id: '3', title: 'Science Fair', date: 'Apr 30', icon: 'science', color: 'bg-success' },
];

const iconMap = {
  calendar: Calendar,
  book: BookOpen,
  science: Beaker,
};

export const UpcomingEvents = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <Card className="h-full">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-base font-semibold">Upcoming Events</CardTitle>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Maximize2 className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {mockEvents.map((event) => {
            const Icon = iconMap[event.icon];
            return (
              <div
                key={event.id}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors"
              >
                <div className={`p-2 rounded-lg ${event.color}`}>
                  <Icon className="h-4 w-4 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{event.title}</p>
                </div>
                <span className="text-xs text-muted-foreground">{event.date} ▼</span>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </motion.div>
  );
};
