import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, isSameMonth, parseISO } from 'date-fns';

interface SchoolEvent {
  id: string;
  title: string;
  event_date: string;
  event_type: string;
}

export const DashboardCalendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const daysOfWeek = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  // Fetch events from database
  const { data: events = [] } = useQuery({
    queryKey: ['school-events', currentDate.getFullYear(), currentDate.getMonth()],
    queryFn: async () => {
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      
      const { data, error } = await supabase
        .from('school_events')
        .select('id, title, event_date, event_type')
        .gte('event_date', format(startOfMonth, 'yyyy-MM-dd'))
        .lte('event_date', format(endOfMonth, 'yyyy-MM-dd'))
        .order('event_date');
      
      if (error) throw error;
      return data as SchoolEvent[];
    },
  });

  // Get days with events
  const eventDays = useMemo(() => {
    return events.map(e => parseISO(e.event_date).getDate());
  }, [events]);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const days = [];
    // Previous month days
    const prevMonthDays = new Date(year, month, 0).getDate();
    for (let i = firstDay - 1; i >= 0; i--) {
      days.push({ day: prevMonthDays - i, currentMonth: false });
    }
    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({ day: i, currentMonth: true });
    }
    // Next month days
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      days.push({ day: i, currentMonth: false });
    }
    return days;
  };

  const days = getDaysInMonth(currentDate);
  const today = new Date().getDate();
  const isCurrentMonth = isSameMonth(currentDate, new Date());

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <Card className="h-full bg-gradient-to-b from-info to-info/80 text-white overflow-hidden">
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <Calendar className="h-5 w-5" />
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6 text-white hover:bg-white/20"
              onClick={prevMonth}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="font-semibold text-sm">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </span>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6 text-white hover:bg-white/20"
              onClick={nextMonth}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-3">
          {/* Days of week header */}
          <div className="grid grid-cols-7 gap-1 mb-1">
            {daysOfWeek.map((day, idx) => (
              <div 
                key={day} 
                className={cn(
                  "text-center text-xs font-medium py-1",
                  idx === new Date().getDay() && isCurrentMonth ? 'bg-white/20 rounded' : ''
                )}
              >
                {day}
              </div>
            ))}
          </div>
          
          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {days.map((dayObj, index) => {
              const hasEvent = eventDays.includes(dayObj.day) && dayObj.currentMonth;
              const isToday = dayObj.day === today && dayObj.currentMonth && isCurrentMonth;
              
              return (
                <div
                  key={index}
                  className={cn(
                    "text-center text-xs py-1 rounded transition-colors relative",
                    !dayObj.currentMonth && "opacity-40",
                    isToday && "bg-white text-info font-bold",
                    hasEvent && !isToday && "bg-destructive",
                    dayObj.currentMonth && !isToday && !hasEvent && "hover:bg-white/20"
                  )}
                >
                  {dayObj.day}
                  {hasEvent && !isToday && (
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 bg-white rounded-full" />
                  )}
                </div>
              );
            })}
          </div>

          {/* Event count */}
          {events.length > 0 && (
            <div className="mt-2 text-xs text-white/80 text-center">
              {events.length} event{events.length > 1 ? 's' : ''} this month
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};
