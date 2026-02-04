import { motion } from 'framer-motion';
import { Calendar, BookOpen, Beaker, Users, Maximize2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, parseISO } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';

interface SchoolEvent {
  id: string;
  title: string;
  event_date: string;
  event_type: string;
  description: string | null;
}

const eventTypeConfig: Record<string, { icon: typeof Calendar; color: string }> = {
  assembly: { icon: Users, color: 'bg-destructive' },
  exam: { icon: BookOpen, color: 'bg-info' },
  event: { icon: Beaker, color: 'bg-success' },
  meeting: { icon: Users, color: 'bg-warning' },
  general: { icon: Calendar, color: 'bg-stat-purple' },
};

export const UpcomingEvents = () => {
  const { data: events = [], isLoading } = useQuery({
    queryKey: ['upcoming-events'],
    queryFn: async () => {
      const today = format(new Date(), 'yyyy-MM-dd');
      
      const { data, error } = await supabase
        .from('school_events')
        .select('id, title, event_date, event_type, description')
        .gte('event_date', today)
        .order('event_date')
        .limit(4);
      
      if (error) throw error;
      return data as SchoolEvent[];
    },
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35 }}
    >
      <Card className="h-full">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-base font-semibold">Upcoming Events</CardTitle>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Maximize2 className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoading ? (
            <>
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3 p-2">
                  <Skeleton className="h-8 w-8 rounded-lg" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-24 mb-1" />
                  </div>
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
            </>
          ) : events.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground text-sm">
              No upcoming events
            </div>
          ) : (
            events.map((event) => {
              const config = eventTypeConfig[event.event_type] || eventTypeConfig.general;
              const Icon = config.icon;
              const eventDate = parseISO(event.event_date);
              
              return (
                <div
                  key={event.id}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors"
                >
                  <div className={`p-2 rounded-lg ${config.color}`}>
                    <Icon className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{event.title}</p>
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {format(eventDate, 'MMM d')} ▼
                  </span>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};
