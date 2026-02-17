import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useStudentSchedule } from '@/hooks/useStudentPortalData';
import { DAY_NAMES, WEEKDAY_NAMES } from '@/types/studentPortal';
import { Calendar, Clock, MapPin, User } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { StudentPortalIcon, STUDENT_ICONS } from '@/components/icons/StudentPortalIcons';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface StudentScheduleTabProps {
  gradeLevel: string;
  schoolId: string;
  academicYearId: string;
}

export const StudentScheduleTab = ({
  gradeLevel,
  schoolId,
  academicYearId,
}: StudentScheduleTabProps) => {
  const [selectedDay, setSelectedDay] = useState(new Date().getDay() === 0 || new Date().getDay() === 6 ? 1 : new Date().getDay());

  const { data: schedules, byDay, isLoading } = useStudentSchedule(
    gradeLevel,
    schoolId,
    academicYearId
  );

  const daySchedules = byDay.get(selectedDay) || [];

  if (isLoading) {
    return (
      <div className="space-y-4 p-4">
        <Skeleton className="h-40 w-full rounded-[2rem]" />
        <div className="flex gap-2 overflow-x-auto pb-2">
          {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-10 w-20 shrink-0 rounded-full" />)}
        </div>
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-32 w-full rounded-[2rem]" />
        ))}
      </div>
    );
  }

  const days = [
    { num: 1, label: 'Mon' },
    { num: 2, label: 'Tue' },
    { num: 3, label: 'Wed' },
    { num: 4, label: 'Thu' },
    { num: 5, label: 'Fri' },
  ];

  const getSubjectColor = (name: string, index: number) => {
    const n = name.toLowerCase();
    if (n.includes('english')) return 'from-rose-400 to-rose-500';
    if (n.includes('math')) return 'from-amber-400 to-amber-500';
    if (n.includes('science')) return 'from-emerald-400 to-emerald-500';
    if (n.includes('social') || n.includes('araling')) return 'from-sky-400 to-sky-500';
    if (n.includes('filipino')) return 'from-red-400 to-red-500';
    if (n.includes('pe') || n.includes('mapeh')) return 'from-lime-400 to-lime-500';
    if (n.includes('esp') || n.includes('values')) return 'from-pink-400 to-pink-500';
    if (n.includes('tle') || n.includes('ict')) return 'from-cyan-400 to-cyan-500';
    if (n.includes('research')) return 'from-violet-400 to-violet-500';
    if (n.includes('mother') || n.includes('tongue')) return 'from-indigo-400 to-indigo-500';
    if (n.includes('break')) return 'from-blue-300 to-blue-400';

    const colors = [
      'from-purple-400 to-purple-500',
      'from-orange-400 to-orange-500',
      'from-teal-400 to-teal-500',
      'from-fuchsia-400 to-fuchsia-500'
    ];
    return colors[index % colors.length];
  };

  const getSubjectIcon = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes('english')) return STUDENT_ICONS.english;
    if (n.includes('math')) return STUDENT_ICONS.math;
    if (n.includes('science')) return STUDENT_ICONS.science;
    if (n.includes('social') || n.includes('araling')) return STUDENT_ICONS.socialStudies;
    if (n.includes('filipino')) return STUDENT_ICONS.filipino;
    if (n.includes('pe')) return STUDENT_ICONS.pe;
    if (n.includes('mapeh')) return STUDENT_ICONS.mapeh;
    if (n.includes('esp') || n.includes('values')) return STUDENT_ICONS.esp;
    if (n.includes('tle')) return STUDENT_ICONS.tle;
    if (n.includes('ict')) return STUDENT_ICONS.ict;
    if (n.includes('research')) return STUDENT_ICONS.research;
    if (n.includes('mother') || n.includes('tongue')) return STUDENT_ICONS.motherTongue;
    if (n.includes('break')) return 'fluent-emoji-flat:sun-with-face';
    return STUDENT_ICONS.english;
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#FDFCF8] -m-4 sm:-m-0 rounded-t-[3rem] overflow-hidden">
      {/* Illustrative Header Img - Fully Flexible, No Cutting */}
      <div className="relative w-full overflow-hidden shrink-0">
        <img
          src="/assets/timetable-header.png"
          alt="School Header"
          className="w-full h-auto block"
        />
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#FDFCF8] to-transparent" />
      </div>

      {/* Control Section */}
      <div className="px-4 -mt-10 relative z-10 flex flex-col gap-6">

        {/* Day Selector */}
        <div className="flex items-center justify-between bg-white/50 backdrop-blur-sm p-1.5 rounded-[2rem] shadow-inner border border-white/50">
          {days.map((day) => (
            <button
              key={day.num}
              onClick={() => setSelectedDay(day.num)}
              className={cn(
                "flex-1 py-3 px-2 rounded-[1.5rem] font-black text-sm transition-all duration-300",
                selectedDay === day.num
                  ? "bg-[#3D7A5E] text-white shadow-lg scale-105"
                  : "text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              )}
            >
              {day.label}
            </button>
          ))}
        </div>
      </div>

      {/* Schedule Content */}
      <div className="px-4 py-8 space-y-8">
        <div className="text-center">
          <h3 className="text-slate-500 font-black tracking-widest text-xs uppercase opacity-70 mb-1">
            • {days.find(d => d.num === selectedDay)?.label}day, {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} •
          </h3>
        </div>

        <div className="space-y-4">
          {daySchedules.length === 0 ? (
            <div className="py-12 text-center text-slate-400 font-bold opacity-50">
              No classes for this day
            </div>
          ) : (
            daySchedules.map((schedule, idx) => {
              const subjectName = schedule.subjects?.name || 'Unknown';
              const colorClass = getSubjectColor(subjectName, idx);
              const icon = getSubjectIcon(subjectName);

              return (
                <div key={schedule.id} className="flex gap-4 items-center">
                  {/* Time Sidebar */}
                  <div className="w-16 flex flex-col items-center justify-center shrink-0">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">
                      {schedule.start_time?.slice(0, 5)}
                    </span>
                    <div className="h-8 w-px bg-slate-200 my-1" />
                  </div>

                  {/* Card content */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className={cn(
                      "flex-1 rounded-[2rem] p-4 flex items-center gap-4 relative overflow-hidden shadow-md group transition-all hover:scale-[1.02]",
                      `bg-gradient-to-r ${colorClass} text-white`
                    )}
                  >
                    {/* Subject Icon */}
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white/20 backdrop-blur-md rounded-[1.5rem] flex items-center justify-center shrink-0 shadow-inner group-hover:scale-110 transition-transform">
                      <StudentPortalIcon
                        icon={icon}
                        size={48}
                        className="drop-shadow-lg"
                      />
                    </div>

                    {/* Text content */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-black text-lg sm:text-xl leading-tight truncate">
                        {subjectName}
                      </h4>
                      <p className="text-xs sm:text-sm font-bold opacity-80 truncate">
                        {schedule.teachers?.full_name || 'TBA'}
                      </p>
                    </div>

                    {/* Decorative Floating Icons (Matching Ref) */}
                    <div className="absolute right-4 flex gap-2 opacity-60">
                      <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center backdrop-blur-sm">
                        <div className="w-4 h-4 rounded-full bg-white/40" />
                      </div>
                      <div className="w-12 h-6 rounded-lg bg-white/20 flex items-center justify-center backdrop-blur-sm">
                        <div className="w-8 h-2 rounded-full bg-white/40" />
                      </div>
                    </div>
                  </motion.div>
                </div>
              );
            })
          )}
        </div>

        {/* Bottom Nav Cards Section */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-12 pb-24">
          <div className="bg-white p-4 rounded-[2rem] shadow-md border border-slate-100 flex items-center gap-4 group hover:bg-slate-50 transition-all cursor-pointer">
            <div className="w-14 h-14 bg-amber-100 rounded-[1.5rem] flex items-center justify-center shrink-0">
              <StudentPortalIcon icon={STUDENT_ICONS.homework} size={32} className="text-amber-500" />
            </div>
            <div>
              <h5 className="font-black text-slate-800 text-sm">Homework</h5>
              <p className="text-[10px] font-bold text-slate-400 uppercase">2 remaining</p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-[2rem] shadow-md border border-slate-100 flex items-center gap-4 group hover:bg-slate-50 transition-all cursor-pointer">
            <div className="w-14 h-14 bg-blue-100 rounded-[1.5rem] flex items-center justify-center shrink-0">
              <StudentPortalIcon icon={(STUDENT_ICONS as any).upcomingTests} size={32} className="text-blue-500" />
            </div>
            <div>
              <h5 className="font-black text-slate-800 text-sm">Upcoming Tests</h5>
              <p className="text-[10px] font-bold text-slate-400 uppercase">View Schedule</p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-[2rem] shadow-md border border-slate-100 flex items-center gap-4 group hover:bg-slate-50 transition-all cursor-pointer">
            <div className="w-14 h-14 bg-rose-100 rounded-[1.5rem] flex items-center justify-center shrink-0">
              <StudentPortalIcon icon={(STUDENT_ICONS as any).events} size={32} className="text-rose-500" />
            </div>
            <div>
              <h5 className="font-black text-slate-800 text-sm">Events</h5>
              <p className="text-[10px] font-bold text-slate-400 uppercase">April 2026</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
