import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, startOfMonth, endOfMonth, isSameDay, parseISO } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Loader2, Calendar as CalendarIcon, Info, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface StudentCalendarTabProps {
    schoolId: string;
    academicYearId: string;
}

interface SchoolEvent {
    id: string;
    title: string;
    description: string | null;
    event_date: string;
    event_type: 'holiday' | 'exam' | 'event' | 'meeting' | 'assembly' | 'general';
    school: string | null;
}

export const StudentCalendarTab = ({ schoolId, academicYearId }: StudentCalendarTabProps) => {
    const [date, setDate] = useState<Date | undefined>(new Date());
    const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
    const queryClient = useQueryClient();

    // Fetch events for the current month
    const { data: events = [], isLoading, isFetching } = useQuery({
        queryKey: ['student-school-events', schoolId, format(currentMonth, 'yyyy-MM')],
        queryFn: async () => {
            const start = format(startOfMonth(currentMonth), 'yyyy-MM-dd');
            const end = format(endOfMonth(currentMonth), 'yyyy-MM-dd');

            const { data, error } = await supabase
                .from('school_events')
                .select('*')
                .gte('event_date', start)
                .lte('event_date', end)
                .or(`school.eq.${schoolId},school.is.null`)
                .order('event_date', { ascending: true });

            if (error) throw error;
            return data as SchoolEvent[];
        },
    });

    // Auto-sync holidays if none found for the current year
    useEffect(() => {
        const checkAndSync = async () => {
            const year = currentMonth.getFullYear();
            const { count, error } = await supabase
                .from('school_events')
                .select('*', { count: 'exact', head: true })
                .eq('event_type', 'holiday')
                .gte('event_date', `${year}-01-01`)
                .lte('event_date', `${year}-12-31`);

            if (!error && count === 0) {
                console.log(`No holidays found for ${year}, syncing...`);
                try {
                    await supabase.functions.invoke('sync-holidays', {
                        body: { year }
                    });
                    queryClient.invalidateQueries({ queryKey: ['student-school-events'] });
                } catch (e) {
                    console.error('Holiday sync failed:', e);
                }
            }
        };

        if (!isLoading) {
            checkAndSync();
        }
    }, [currentMonth.getFullYear(), queryClient, isLoading]);

    const selectedDayEvents = events.filter(event =>
        date && isSameDay(parseISO(event.event_date), date)
    );

    const monthEvents = events.filter(event =>
        parseISO(event.event_date).getMonth() === currentMonth.getMonth()
    );

    const getEventBadgeColor = (type: string) => {
        switch (type) {
            case 'holiday': return 'bg-rose-100 text-rose-600 border-rose-200';
            case 'exam': return 'bg-amber-100 text-amber-600 border-amber-200';
            case 'event': return 'bg-sky-100 text-sky-600 border-sky-200';
            default: return 'bg-slate-100 text-slate-600 border-slate-200';
        }
    };

    return (
        <div className="flex flex-col gap-6 p-4 bg-[#FDFCF8] min-h-screen rounded-t-[3rem] -m-4 sm:-m-0 pt-8 pb-24">
            <div className="flex items-center justify-between px-2">
                <div>
                    <h2 className="text-2xl font-black text-sky-950">School Calendar</h2>
                    <p className="text-sm font-bold text-sky-600/60 uppercase tracking-widest mt-0.5">Holidays & Events</p>
                </div>
                <div className="w-12 h-12 bg-sky-100 rounded-2xl flex items-center justify-center">
                    <CalendarIcon className="text-sky-600" size={24} />
                </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
                <Card className="rounded-[2.5rem] border-none shadow-xl bg-white/80 backdrop-blur-md overflow-hidden">
                    <CardContent className="p-4 pt-6">
                        <Calendar
                            mode="single"
                            selected={date}
                            onSelect={setDate}
                            onMonthChange={setCurrentMonth}
                            className="rounded-md"
                            modifiers={{
                                event: (date) => events.some(e => isSameDay(parseISO(e.event_date), date)),
                                holiday: (date) => events.some(e => isSameDay(parseISO(e.event_date), date) && e.event_type === 'holiday'),
                            }}
                            modifiersClassNames={{
                                event: "font-black underline decoration-sky-400 decoration-2 underline-offset-4",
                                holiday: "bg-rose-50 text-rose-600 font-black",
                            }}
                        />
                    </CardContent>
                </Card>

                <div className="space-y-4">
                    <h3 className="text-lg font-black text-sky-950 px-2 flex items-center gap-2">
                        Events for {date ? format(date, 'MMMM d') : 'Selected Day'}
                    </h3>

                    <div className="space-y-3">
                        <AnimatePresence mode="popLayout">
                            {isLoading ? (
                                <div className="flex flex-col items-center justify-center py-12 gap-3 opacity-50">
                                    <Loader2 className="h-8 w-8 animate-spin text-sky-500" />
                                    <span className="text-xs font-bold text-sky-800">Updating calendar...</span>
                                </div>
                            ) : selectedDayEvents.length > 0 ? (
                                selectedDayEvents.map((event, idx) => (
                                    <motion.div
                                        key={event.id}
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        transition={{ delay: idx * 0.05 }}
                                    >
                                        <Card className="rounded-3xl border-none shadow-md bg-white hover:shadow-lg transition-all group overflow-hidden">
                                            <div className={cn("w-1.5 absolute left-0 top-0 bottom-0",
                                                event.event_type === 'holiday' ? 'bg-rose-400' :
                                                    event.event_type === 'exam' ? 'bg-amber-400' : 'bg-sky-400'
                                            )} />
                                            <CardContent className="p-5 flex items-start gap-4">
                                                <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shrink-0", getEventBadgeColor(event.event_type))}>
                                                    {event.event_type === 'holiday' ? '🇵🇭' : <Info size={20} />}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <h4 className="font-black text-sky-950 truncate pr-2">{event.title}</h4>
                                                        <Badge variant="outline" className={cn("text-[10px] font-black tracking-widest uppercase", getEventBadgeColor(event.event_type))}>
                                                            {event.event_type}
                                                        </Badge>
                                                    </div>
                                                    <p className="text-sm font-medium text-sky-800/60 leading-relaxed">
                                                        {event.description || 'No additional details provided.'}
                                                    </p>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </motion.div>
                                ))
                            ) : (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="py-12 flex flex-col items-center justify-center text-center opacity-40 bg-sky-50/50 rounded-[2.5rem] border-2 border-dashed border-sky-200"
                                >
                                    <CalendarIcon size={48} className="text-sky-300 mb-4" />
                                    <p className="font-bold text-sky-800">No scheduled activities</p>
                                    <p className="text-xs font-medium">Enjoy your day!</p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Monthly Overview */}
                    {monthEvents.length > 0 && (
                        <div className="mt-8 pt-6 border-t border-sky-100">
                            <h3 className="text-sm font-black text-sky-900/40 uppercase tracking-[0.2em] mb-4 px-2">
                                This Month's Highlights
                            </h3>
                            <div className="flex flex-wrap gap-2 px-2">
                                {monthEvents.slice(0, 5).map(event => (
                                    <Badge
                                        key={event.id}
                                        variant="secondary"
                                        className="bg-sky-50 text-sky-600 border-none rounded-full px-3 py-1 text-[10px] font-black"
                                    >
                                        {format(parseISO(event.event_date), 'MMM d')}: {event.title}
                                    </Badge>
                                ))}
                                {monthEvents.length > 5 && (
                                    <Badge variant="secondary" className="bg-slate-50 text-slate-400 border-none rounded-full px-3 py-1 text-[10px] font-black">
                                        +{monthEvents.length - 5} more
                                    </Badge>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
