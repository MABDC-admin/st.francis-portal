import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Calendar, Maximize2, Plus, Loader2, Trash2, Edit2 } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, isSameMonth, parseISO, startOfYear, endOfYear } from 'date-fns';
import { useToast } from "@/components/ui/use-toast";

interface SchoolEvent {
  id: string;
  title: string;
  event_date: string;
  event_type: string;
  school?: string | null;
}

import { useSchool } from '@/contexts/SchoolContext';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SchoolType } from '@/contexts/SchoolContext';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export const DashboardCalendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const { selectedSchool } = useSchool();
  const [calendarSchool, setCalendarSchool] = useState<SchoolType>(selectedSchool);
  const [isYearlyViewOpen, setIsYearlyViewOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Unified Event Dialog State
  const [isEventDialogOpen, setIsEventDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<SchoolEvent | null>(null);
  const [selectedDateStr, setSelectedDateStr] = useState<string>('');
  const [eventTitle, setEventTitle] = useState('');
  const [eventType, setEventType] = useState('event');

  // Update calendarSchool when selectedSchool changes, but allow manual override
  useMemo(() => {
    setCalendarSchool(selectedSchool);
  }, [selectedSchool]);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const daysOfWeek = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  // Fetch events from database
  const { data: events = [] } = useQuery({
    queryKey: ['school-events', currentDate.getFullYear(), isYearlyViewOpen ? 'year' : currentDate.getMonth(), calendarSchool],
    queryFn: async () => {
      const start = isYearlyViewOpen ? startOfYear(currentDate) : new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const end = isYearlyViewOpen ? endOfYear(currentDate) : new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

      const { data, error } = await supabase
        .from('school_events')
        .select('id, title, event_date, event_type, school')
        .or(`school.eq.${calendarSchool},school.is.null`)
        .gte('event_date', format(start, 'yyyy-MM-dd'))
        .lte('event_date', format(end, 'yyyy-MM-dd'))
        .order('event_date');

      if (error) throw error;
      return data as SchoolEvent[];
    },
  });

  const createEventMutation = useMutation({
    mutationFn: async (newEvent: any) => {
      const { error } = await supabase.from('school_events').insert([newEvent]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['school-events'] });
      toast({ title: "Success", description: "Event added to calendar!" });
      setIsEventDialogOpen(false);
      resetForm();
    },
  });

  const updateEventMutation = useMutation({
    mutationFn: async (updatedEvent: any) => {
      const { error } = await supabase
        .from('school_events')
        .update({ title: updatedEvent.title, event_type: updatedEvent.event_type })
        .eq('id', updatedEvent.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['school-events'] });
      toast({ title: "Updated", description: "Event updated successfully!" });
      setIsEventDialogOpen(false);
      resetForm();
    },
  });

  const deleteEventMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('school_events').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['school-events'] });
      toast({ title: "Deleted", description: "Event removed from calendar." });
      setIsEventDialogOpen(false);
      resetForm();
    },
  });

  const resetForm = () => {
    setSelectedEvent(null);
    setEventTitle('');
    setEventType('event');
  };

  const handleDayClick = (dateStr: string, existingEvent?: SchoolEvent) => {
    setSelectedDateStr(dateStr);
    if (existingEvent) {
      setSelectedEvent(existingEvent);
      setEventTitle(existingEvent.title);
      setEventType(existingEvent.event_type);
    } else {
      resetForm();
    }
    setIsEventDialogOpen(true);
  };

  const handleEventSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedEvent) {
      updateEventMutation.mutate({
        id: selectedEvent.id,
        title: eventTitle,
        event_type: eventType
      });
    } else {
      createEventMutation.mutate({
        title: eventTitle,
        event_date: selectedDateStr,
        event_type: eventType,
        school: calendarSchool
      });
    }
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days = [];
    const prevMonthDays = new Date(year, month, 0).getDate();
    for (let i = firstDay - 1; i >= 0; i--) {
      days.push({ day: prevMonthDays - i, currentMonth: false });
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({ day: i, currentMonth: true });
    }
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

  const miniMonthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const filmViewVariants = {
    hidden: {
      opacity: 0,
      scale: 0.8,
      filter: 'blur(10px)',
    },
    visible: {
      opacity: 1,
      scale: 1,
      filter: 'blur(0px)',
      transition: {
        duration: 0.6,
        ease: [0.25, 0.1, 0.25, 1] as const,
        staggerChildren: 0.05
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <Card className="h-full bg-white dark:bg-slate-900 text-foreground overflow-hidden border-border shadow-sm group/calendar">
        <CardHeader className="pb-3 border-b border-border/50 transition-colors duration-500 bg-gradient-to-r from-violet-600 via-indigo-500 to-blue-500 text-white">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Calendar className="h-5 w-5 text-white/90" />
              <Select value={calendarSchool} onValueChange={(val) => setCalendarSchool(val as SchoolType)}>
                <SelectTrigger className="h-7 w-[110px] bg-white/10 hover:bg-white/20 border-white/20 text-white text-xs backdrop-blur-sm transition-all">
                  <SelectValue placeholder="School" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SFXSAI">SFXSAI</SelectItem>
                </SelectContent>
              </Select>

              <Dialog open={isYearlyViewOpen} onOpenChange={setIsYearlyViewOpen}>
                <DialogTrigger asChild>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button variant="ghost" size="sm" className="h-7 px-2 text-xs gap-1 group text-white hover:bg-white/10">
                      <Maximize2 className="h-3 w-3 group-hover:rotate-12 transition-transform" />
                      Whole Year
                    </Button>
                  </motion.div>
                </DialogTrigger>
                <DialogContent className="max-w-[98vw] w-[1450px] max-h-[95vh] overflow-hidden flex flex-col p-0 border-none shadow-2xl">
                  <motion.div
                    variants={filmViewVariants}
                    initial="hidden"
                    animate="visible"
                    className="flex flex-col h-full overflow-hidden bg-background"
                  >
                    <DialogHeader className="p-4 py-3 border-b shrink-0">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pr-8 gap-4">
                        <div className="flex items-center gap-6">
                          <span className="text-xl font-bold">School Calendar</span>
                          <div className="flex items-center gap-3 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-2">Context:</span>
                            <Select value={calendarSchool} onValueChange={(val) => setCalendarSchool(val as SchoolType)}>
                              <SelectTrigger className="w-[110px] h-7 border-none bg-transparent shadow-none font-bold text-xs uppercase tracking-tight">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="SFXSAI">SFXSAI</SelectItem>
                              </SelectContent>
                            </Select>
                            <div className="h-4 w-px bg-slate-300 dark:bg-slate-700 mx-1" />
                            <Select
                              value={currentDate.getFullYear().toString()}
                              onValueChange={(val) => setCurrentDate(new Date(parseInt(val), currentDate.getMonth(), 1))}
                            >
                              <SelectTrigger className="w-[90px] h-7 border-none bg-transparent shadow-none font-bold text-xs uppercase tracking-tight">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {Array.from({ length: 15 }, (_, i) => 2020 + i).map(y => (
                                  <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-[10px] font-medium text-muted-foreground italic">
                          <div className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-full bg-red-500" /> Holidays</div>
                          <div className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-full bg-blue-500" /> School Events</div>
                          <div className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-full bg-success" /> Today</div>
                        </div>
                      </div>
                    </DialogHeader>

                    <div className="flex flex-1 overflow-hidden flex-col xl:flex-row">
                      {/* Expanded Calendar Grid (7/10) */}
                      <div className="flex-[7] overflow-y-auto p-4 border-r scrollbar-thin">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                          {miniMonthNames.map((name, monthIdx) => {
                            const monthDate = new Date(currentDate.getFullYear(), monthIdx, 1);
                            const monthDays = getDaysInMonth(monthDate);
                            const isCurrentYearMonth = isSameMonth(monthDate, new Date());
                            return (
                              <motion.div key={name} className="space-y-2" variants={itemVariants}>
                                <h3 className="font-bold text-sm text-primary border-b pb-1 flex justify-between items-center uppercase tracking-tight">
                                  {name}
                                  <span className="text-[9px] text-muted-foreground font-normal">
                                    {events.filter(e => {
                                      const d = parseISO(e.event_date);
                                      return d.getMonth() === monthIdx && d.getFullYear() === currentDate.getFullYear();
                                    }).length} events
                                  </span>
                                </h3>
                                <div className="grid grid-cols-7 gap-1 text-[10px]">
                                  {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                                    <div key={`${name}-${d}-${i}`} className="text-center font-bold opacity-30">{d}</div>
                                  ))}
                                  {monthDays.map((d, idx) => {
                                    const dDate = new Date(currentDate.getFullYear(), monthIdx, d.day);
                                    const dateStr = format(dDate, 'yyyy-MM-dd');
                                    const dayEvents = events.filter(e => e.event_date === dateStr && d.currentMonth);
                                    const hasHoliday = dayEvents.some(e => e.event_type === 'holiday');
                                    const hasEvent = dayEvents.some(e => e.event_type !== 'holiday');
                                    const isToday = isCurrentYearMonth && d.day === new Date().getDate() && d.currentMonth;

                                    return (
                                      <motion.button
                                        key={`${name}-day-${idx}`}
                                        className={cn(
                                          "text-center py-1.5 rounded-md transition-all relative w-full",
                                          !d.currentMonth && "opacity-5 cursor-default",
                                          (hasHoliday || hasEvent) && d.currentMonth && "text-white font-bold shadow-sm z-10",
                                          hasHoliday && d.currentMonth && "bg-red-500",
                                          !hasHoliday && hasEvent && d.currentMonth && "bg-blue-500",
                                          isToday && d.currentMonth && !hasHoliday && !hasEvent && "bg-success text-white font-bold",
                                          d.currentMonth && !hasHoliday && !hasEvent && !isToday && "hover:bg-slate-100 dark:hover:bg-slate-800"
                                        )}
                                        whileHover={d.currentMonth ? {
                                          scale: 1.15,
                                          rotateX: 10,
                                          y: -4,
                                          zIndex: 50,
                                          filter: 'brightness(1.05)',
                                          boxShadow: "0 10px 20px -5px rgba(0,0,0,0.1)"
                                        } : {}}
                                        transition={{ type: "spring", stiffness: 400, damping: 25 }}
                                        style={{ transformOrigin: "top", perspective: "1000px" }}
                                        whileTap={d.currentMonth ? { scale: 0.95 } : {}}
                                        onClick={() => d.currentMonth && handleDayClick(dateStr, dayEvents[0])}
                                      >
                                        {d.day}
                                        {hasHoliday && hasEvent && (
                                          <div className="absolute -top-1 -right-1 h-2.5 w-2.5 bg-blue-500 rounded-full border-2 border-red-500" />
                                        )}
                                      </motion.button>
                                    );
                                  })}
                                </div>
                              </motion.div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Compact Side Panel (3/10) */}
                      <div className="flex-[3] bg-slate-50/50 dark:bg-slate-900/50 overflow-hidden flex flex-col min-w-[380px]">
                        <div className="grid grid-cols-2 h-full">
                          {/* Holidays Column (Compact) */}
                          <div className="flex flex-col border-r overflow-hidden backdrop-blur-sm">
                            <div className="p-3 border-b bg-red-50/50 dark:bg-red-900/10 flex items-center justify-between shrink-0">
                              <div className="flex items-center gap-1.5">
                                <div className="h-1.5 w-1.5 rounded-full bg-red-500" />
                                <h3 className="font-bold text-[10px] uppercase tracking-widest text-red-600 dark:text-red-400">Holidays</h3>
                              </div>
                              <Badge variant="outline" className="text-[9px] h-4 px-1">{events.filter(e => e.event_type === 'holiday').length}</Badge>
                            </div>
                            <div className="flex-1 overflow-y-auto p-2 space-y-4 scrollbar-thin">
                              {monthNames.map((monthName, monthIdx) => {
                                const monthHolidays = events.filter(e => {
                                  const d = parseISO(e.event_date);
                                  return d.getMonth() === monthIdx && d.getFullYear() === currentDate.getFullYear() && e.event_type === 'holiday';
                                }).sort((a, b) => a.event_date.localeCompare(b.event_date));
                                if (monthHolidays.length === 0) return null;
                                return (
                                  <div key={`side-holidays-${monthName}`} className="space-y-1.5">
                                    <h4 className="text-[9px] font-bold text-muted-foreground/60 uppercase tracking-tighter border-l border-red-500/50 pl-1.5">{monthName}</h4>
                                    <div className="space-y-1">
                                      {monthHolidays.map(event => (
                                        <div
                                          key={event.id}
                                          onClick={() => handleDayClick(event.event_date, event)}
                                          className="p-1.5 bg-white dark:bg-slate-800 rounded border shadow-xs hover:shadow-sm transition-all group border-l-2 border-l-red-500 cursor-pointer"
                                        >
                                          <div className="flex items-center gap-2">
                                            <div className="h-7 w-7 rounded bg-red-50 dark:bg-red-900/20 flex flex-col items-center justify-center shrink-0 border border-red-100 dark:border-red-900/30 group-hover:bg-red-500 group-hover:text-white transition-colors">
                                              <span className="text-[7px] uppercase font-bold leading-none">{format(parseISO(event.event_date), 'MMM')}</span>
                                              <span className="text-xs font-black leading-none">{format(parseISO(event.event_date), 'd')}</span>
                                            </div>
                                            <div className="overflow-hidden">
                                              <p className="font-bold text-[11px] leading-tight truncate text-foreground group-hover:text-red-600">{event.title}</p>
                                              <p className="text-[8px] text-muted-foreground font-semibold uppercase">{format(parseISO(event.event_date), 'EEE')}</p>
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* School Events Column (Compact) */}
                          <div className="flex flex-col overflow-hidden backdrop-blur-sm">
                            <div className="p-3 border-b bg-blue-50/50 dark:bg-blue-900/10 flex items-center justify-between shrink-0">
                              <div className="flex items-center gap-1.5">
                                <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                                <h3 className="font-bold text-[10px] uppercase tracking-widest text-blue-600 dark:text-blue-400">Events</h3>
                              </div>
                              <Badge variant="outline" className="text-[9px] h-4 px-1">{events.filter(e => e.event_type !== 'holiday').length}</Badge>
                            </div>
                            <div className="flex-1 overflow-y-auto p-2 space-y-4 scrollbar-thin">
                              {monthNames.map((monthName, monthIdx) => {
                                const monthEvents = events.filter(e => {
                                  const d = parseISO(e.event_date);
                                  return d.getMonth() === monthIdx && d.getFullYear() === currentDate.getFullYear() && e.event_type !== 'holiday';
                                }).sort((a, b) => a.event_date.localeCompare(b.event_date));
                                if (monthEvents.length === 0) return null;
                                return (
                                  <div key={`side-events-${monthName}`} className="space-y-1.5">
                                    <h4 className="text-[9px] font-bold text-muted-foreground/60 uppercase tracking-tighter border-l border-blue-500/50 pl-1.5">{monthName}</h4>
                                    <div className="space-y-1">
                                      {monthEvents.map(event => (
                                        <div
                                          key={event.id}
                                          onClick={() => handleDayClick(event.event_date, event)}
                                          className="p-1.5 bg-white dark:bg-slate-800 rounded border shadow-xs hover:shadow-sm transition-all group border-l-2 border-l-blue-500 cursor-pointer"
                                        >
                                          <div className="flex items-center gap-2">
                                            <div className="h-7 w-7 rounded bg-blue-50 dark:bg-blue-900/20 flex flex-col items-center justify-center shrink-0 border border-blue-100 dark:border-blue-900/30 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                                              <span className="text-[7px] uppercase font-bold leading-none">{format(parseISO(event.event_date), 'MMM')}</span>
                                              <span className="text-xs font-black leading-none">{format(parseISO(event.event_date), 'd')}</span>
                                            </div>
                                            <div className="overflow-hidden">
                                              <p className="font-bold text-[11px] leading-tight truncate text-foreground group-hover:text-blue-600">{event.title}</p>
                                              <p className="text-[8px] text-muted-foreground font-semibold uppercase">{format(parseISO(event.event_date), 'EEE')}</p>
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="h-6 w-6 text-white/80 hover:bg-white/10 hover:text-white" onClick={prevMonth}><ChevronLeft className="h-4 w-4" /></Button>
              <span className="font-bold text-sm whitespace-nowrap tracking-tight">{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}</span>
              <Button variant="ghost" size="icon" className="h-6 w-6 text-white/80 hover:bg-white/10 hover:text-white" onClick={nextMonth}><ChevronRight className="h-4 w-4" /></Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-3">
          <div className="grid grid-cols-7 gap-1 mb-1">
            {daysOfWeek.map((day, idx) => (
              <div key={day} className={cn("text-center text-xs font-medium py-1", idx === new Date().getDay() && isCurrentMonth ? 'bg-slate-100 dark:bg-slate-800 rounded' : '')}>{day}</div>
            ))}
          </div>

          <TooltipProvider>
            <div className="grid grid-cols-7 gap-1">
              {days.map((dayObj, index) => {
                const dayDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), dayObj.day);
                const dateStr = format(dayDate, 'yyyy-MM-dd');
                const dayEvent = events.find(e => e.event_date === dateStr && dayObj.currentMonth);
                const isToday = dayObj.day === today && dayObj.currentMonth && isCurrentMonth;

                const dayCell = (
                  <motion.div
                    onClick={() => dayObj.currentMonth && handleDayClick(dateStr, dayEvent)}
                    whileHover={dayObj.currentMonth ? {
                      rotateX: 12,
                      y: -5,
                      scale: 1.02,
                      boxShadow: "0 15px 30px -10px rgba(0,0,0,0.15)"
                    } : {}}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    style={{ transformOrigin: "top", perspective: "1000px" }}
                    className={cn(
                      "text-center text-xs py-2 sm:py-3 rounded transition-all relative border border-transparent flex flex-col items-center justify-start h-full min-h-[60px] sm:min-h-[80px] cursor-pointer",
                      !dayObj.currentMonth && "opacity-40 cursor-default",
                      isToday && "bg-success text-white font-bold shadow-md",
                      dayEvent && !isToday && "bg-red-500 text-white shadow-md",
                      dayObj.currentMonth && !isToday && !dayEvent && "bg-white dark:bg-slate-900/40 hover:bg-slate-50 dark:hover:bg-slate-800/80 border-slate-100 dark:border-slate-800/50"
                    )}
                  >
                    <span className="text-sm sm:text-lg font-medium">{dayObj.day}</span>
                    {dayEvent && (
                      <span className="text-[10px] sm:text-xs mt-1 leading-tight px-1 line-clamp-2 w-full text-center font-normal">
                        {dayEvent.title}
                      </span>
                    )}
                  </motion.div>
                );

                if (dayEvent) {
                  return (
                    <Tooltip key={index}>
                      <TooltipTrigger asChild>{dayCell}</TooltipTrigger>
                      <TooltipContent side="top" className="text-xs bg-white text-black border-none shadow-lg">
                        <p className="font-semibold">{dayEvent.title}</p>
                        <p className="text-[10px] text-muted-foreground capitalize">{dayEvent.event_type}</p>
                      </TooltipContent>
                    </Tooltip>
                  );
                }
                return <div key={index}>{dayCell}</div>;
              })}
            </div>
          </TooltipProvider>

          {(events.length > 0 && !isYearlyViewOpen) && (
            <div className="mt-2 text-xs text-muted-foreground text-center">
              {events.length} event{events.length > 1 ? 's' : ''} this month
            </div>
          )}
        </CardContent>
      </Card>

      {/* Unified Event Management Dialog (CRUD) */}
      <Dialog open={isEventDialogOpen} onOpenChange={setIsEventDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedEvent ? <Edit2 className="h-5 w-5 text-primary" /> : <Plus className="h-5 w-5 text-primary" />}
              {selectedEvent ? 'Edit Event' : 'Add Event'}
            </DialogTitle>
            <DialogDescription>
              {selectedEvent ? 'Update details for this scheduled date.' : `Scheduling event for ${selectedDateStr && format(parseISO(selectedDateStr), 'MMMM d, yyyy')}`}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEventSubmit} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Event Title</Label>
              <Input
                id="title"
                placeholder="e.g. Science Fair, Exam Day"
                value={eventTitle}
                onChange={(e) => setEventTitle(e.target.value)}
                autoFocus
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Category</Label>
              <Select value={eventType} onValueChange={setEventType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="event">General Event</SelectItem>
                  <SelectItem value="holiday">Public Holiday</SelectItem>
                  <SelectItem value="exam">Examination</SelectItem>
                  <SelectItem value="meeting">Meeting</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter className="pt-4 flex justify-between sm:justify-between w-full">
              {selectedEvent && (
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="mr-auto"
                  disabled={deleteEventMutation.isPending}
                  onClick={() => deleteEventMutation.mutate(selectedEvent.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
              <div className="flex gap-2 ml-auto">
                <Button type="button" variant="ghost" onClick={() => setIsEventDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={createEventMutation.isPending || updateEventMutation.isPending}>
                  {(createEventMutation.isPending || updateEventMutation.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {selectedEvent ? 'Update' : 'Save'} Event
                </Button>
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};
