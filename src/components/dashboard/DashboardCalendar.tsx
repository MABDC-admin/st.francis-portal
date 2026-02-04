import { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export const DashboardCalendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date(2023, 3, 1)); // April 2023

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const daysOfWeek = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

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
  const today = 6; // Highlighted day
  const events = [3, 4, 11, 23]; // Days with events

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
      transition={{ delay: 0.55 }}
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
            <span className="font-semibold">
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
            {daysOfWeek.map((day) => (
              <div 
                key={day} 
                className={cn(
                  "text-center text-xs font-medium py-1",
                  day === 'Tu' ? 'bg-white/20 rounded' : ''
                )}
              >
                {day}
              </div>
            ))}
          </div>
          
          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {days.map((dayObj, index) => (
              <div
                key={index}
                className={cn(
                  "text-center text-xs py-1 rounded transition-colors",
                  !dayObj.currentMonth && "opacity-40",
                  dayObj.day === today && dayObj.currentMonth && "bg-white text-info font-bold",
                  events.includes(dayObj.day) && dayObj.currentMonth && dayObj.day !== today && "bg-destructive",
                  dayObj.currentMonth && dayObj.day !== today && !events.includes(dayObj.day) && "hover:bg-white/20"
                )}
              >
                {dayObj.day}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
