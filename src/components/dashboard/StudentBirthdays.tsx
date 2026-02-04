import { useMemo } from 'react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { Cake, Gift } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useStudents } from '@/hooks/useStudents';
import { useSchool } from '@/contexts/SchoolContext';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export const StudentBirthdays = () => {
    const navigate = useNavigate();
    const { data: students = [] } = useStudents();
    const { selectedSchool } = useSchool();

    const birthdayStudents = useMemo(() => {
        const now = new Date();
        const currentYear = now.getFullYear();

        return students
            .filter(student => {
                if (student.school !== selectedSchool || !student.birth_date) return false;

                const dob = new Date(student.birth_date);
                // Create a date for this year's birthday
                const thisYearBirthday = new Date(currentYear, dob.getMonth(), dob.getDate());

                // Also consider next year's birthday if this year's has passed
                const nextYearBirthday = new Date(currentYear + 1, dob.getMonth(), dob.getDate());

                // Get difference in days from now
                const diffTime = thisYearBirthday.getTime() - now.getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                const nextDiffTime = nextYearBirthday.getTime() - now.getTime();
                const nextDiffDays = Math.ceil(nextDiffTime / (1000 * 60 * 60 * 24));

                // Return true if birthday is today or within next 60 days
                return (diffDays >= 0 && diffDays <= 60) || (nextDiffDays >= 0 && nextDiffDays <= 60);
            })
            .map(student => {
                const dob = new Date(student.birth_date);
                const thisYearBirthday = new Date(currentYear, dob.getMonth(), dob.getDate());

                let targetBirthday = thisYearBirthday;
                if (thisYearBirthday.getTime() < now.getTime() - (1000 * 60 * 60 * 24)) {
                    targetBirthday = new Date(currentYear + 1, dob.getMonth(), dob.getDate());
                }

                // Age they will BECOME on this birthday
                const age = targetBirthday.getFullYear() - dob.getFullYear();
                const isToday = targetBirthday.getDate() === now.getDate() && targetBirthday.getMonth() === now.getMonth();

                return {
                    ...student,
                    day: targetBirthday.getDate(),
                    month: targetBirthday.getMonth(),
                    turningAge: age,
                    isToday,
                    targetBirthday
                };
            })
            .sort((a, b) => a.targetBirthday.getTime() - b.targetBirthday.getTime());
    }, [students, selectedSchool]);

    const currentMonthName = format(new Date(), 'MMMM');

    return (
        <Card className="h-full border-none shadow-none bg-transparent">
            <CardHeader className="pb-3 flex flex-row items-center justify-between px-0">
                <div className="flex items-center gap-2">
                    <Cake className="h-5 w-5 text-pink-500 animate-bounce" />
                    <CardTitle className="text-base font-bold">Upcoming Birthdays</CardTitle>
                </div>
                <Badge variant="secondary" className="bg-pink-100 text-pink-700 hover:bg-pink-100 border-none px-2 py-0 text-[10px] font-bold uppercase tracking-wider">
                    Next 60 Days
                </Badge>
            </CardHeader>
            <CardContent className="px-0">
                {birthdayStudents.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-[320px] text-muted-foreground space-y-4 text-center bg-muted/20 rounded-2xl border-2 border-dashed">
                        <Gift className="h-16 w-16 opacity-10" />
                        <p className="text-sm max-w-[200px]">No upcoming birthdays found in the next 60 days.</p>
                    </div>
                ) : (
                    <ScrollArea className="h-[550px] pr-2">
                        <motion.div
                            className="space-y-1.5"
                            initial="hidden"
                            animate="visible"
                            variants={{
                                visible: {
                                    transition: {
                                        staggerChildren: 0.15
                                    }
                                }
                            }}
                        >
                            <AnimatePresence mode="popLayout">
                                {birthdayStudents.map((student) => (
                                    <motion.div
                                        key={student.id}
                                        variants={{
                                            hidden: { opacity: 0, height: 0, y: -20, filter: 'blur(4px)' },
                                            visible: {
                                                opacity: 1,
                                                height: 'auto',
                                                y: 0,
                                                filter: 'blur(0px)',
                                                transition: {
                                                    type: "spring",
                                                    stiffness: 70,
                                                    damping: 20,
                                                    height: { duration: 0.6 },
                                                    opacity: { duration: 1.0 }
                                                }
                                            }
                                        }}
                                        whileHover={{
                                            rotateX: 10,
                                            y: -2,
                                            scale: 1.01,
                                            boxShadow: "0 10px 20px -5px rgba(0,0,0,0.1)"
                                        }}
                                        transition={{ type: "spring", stiffness: 400, damping: 25 }}
                                        style={{ transformOrigin: "top", perspective: "1000px" }}
                                        className={cn(
                                            "flex items-center justify-between group p-2 rounded-xl transition-all border cursor-pointer relative z-0 hover:z-10",
                                            student.isToday
                                                ? "bg-gradient-to-r from-pink-50 to-rose-50 border-pink-100 shadow-sm"
                                                : "bg-white dark:bg-slate-900/40 hover:bg-muted/50 border-transparent hover:border-muted-foreground/10"
                                        )}
                                        onClick={() => navigate(`/student/${student.id}`)}
                                    >
                                        <div className="flex items-center gap-2.5">
                                            <div className="relative">
                                                <Avatar className="h-8 w-8 border-2 border-white shadow-sm shrink-0">
                                                    <AvatarImage src={student.photo_url || undefined} />
                                                    <AvatarFallback className={cn(
                                                        "text-[10px] font-bold",
                                                        student.isToday ? "bg-pink-500 text-white" : "bg-pink-100 text-pink-700"
                                                    )}>
                                                        {student.student_name.substring(0, 2).toUpperCase()}
                                                    </AvatarFallback>
                                                </Avatar>
                                                {student.isToday && (
                                                    <span className="absolute -top-0.5 -right-0.5 flex h-3 w-3">
                                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span>
                                                        <span className="relative inline-flex rounded-full h-3 w-3 bg-pink-500 items-center justify-center">
                                                            <Cake className="h-1.5 w-1.5 text-white" />
                                                        </span>
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex flex-col min-w-0">
                                                <span className="text-xs font-bold leading-tight group-hover:text-pink-600 transition-colors break-words">
                                                    {student.student_name}
                                                </span>
                                                <span className="text-[10px] text-muted-foreground mt-0.5 font-medium italic opacity-70">
                                                    {student.level}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end shrink-0">
                                            <span className={cn(
                                                "text-[10px] font-black px-2 py-0.5 rounded-full tabular-nums",
                                                student.isToday
                                                    ? "bg-pink-500 text-white"
                                                    : "bg-white text-pink-600 border border-pink-100"
                                            )}>
                                                {student.isToday ? "TODAY" : format(student.targetBirthday, 'MMM d')}
                                            </span>
                                            <span className="text-[9px] font-bold text-muted-foreground mt-0.5 uppercase tracking-tighter opacity-60">
                                                Turns {student.turningAge}
                                            </span>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </motion.div>
                    </ScrollArea>
                )}
            </CardContent>
        </Card>
    );
};
