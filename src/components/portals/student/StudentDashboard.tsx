import { STUDENT_ICONS, StudentPortalIcon } from '@/components/icons/StudentPortalIcons';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { BlurredPlaygroundBackground } from './BlurredPlaygroundBackground';
import { RabbitButterflyBackground } from './widgets/RabbitButterflyBackground';
import { useMemo, useState, useEffect, useCallback } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import {
  isPassing,
  getGradeDescriptor,
  computeQuarterlyGeneralAverage,
  computeAnnualGeneralAverage,
} from '@/utils/gradeComputation';
import { format } from 'date-fns';
import { AnimatedStudentAvatar } from '@/components/students/AnimatedStudentAvatar';
import { SubjectGradeCard } from './SubjectGradeCard';
import { StudentAcademicInsights } from './widgets/StudentAcademicInsights';
import { useStudentDashboardStats } from '@/hooks/useStudentPortalData';
import { PromotionalSlider } from './widgets/PromotionalSlider';
import WeatherBackground from '@/components/weather/WeatherBackground';
import { useZoomSession } from '@/hooks/useZoomSession';
import { Video, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface StudentDashboardProps {
  studentId: string;
  gradeLevel: string;
  schoolId: string;
  academicYearId: string;
  grades: any[];
  schedule?: any[];
  studentName?: string;
  studentPhotoUrl?: string | null;
  onCardClick?: (section: string) => void;
}

export const StudentDashboard = ({
  studentId,
  gradeLevel,
  schoolId,
  academicYearId,
  grades,
  studentName,
  studentPhotoUrl,
  onCardClick,
}: StudentDashboardProps) => {
  const { attendance, assignments, exams, announcements, isLoading } = useStudentDashboardStats(
    studentId,
    gradeLevel,
    schoolId,
    academicYearId
  );

  const { settings, inSession, countdown } = useZoomSession(schoolId);



  // Check for weather-related announcements (Override API weather)
  const overrideTheme = useMemo(() => {
    const allAnnouncements = [...announcements.pinned, ...announcements.regular];
    const weatherKeywords = ['rain', 'typhoon', 'storm', 'habagat', 'monsoon', 'suspension', 'weather', 'heavy rain', 'cancel', 'no class', 'cancelled'];

    const hasBadWeather = allAnnouncements.some(a => {
      const text = (a.title + a.content).toLowerCase();
      return weatherKeywords.some(keyword => text.includes(keyword));
    });

    return hasBadWeather ? 'rainy' : null;
  }, [announcements]);

  // Embla Carousel Setup for Module Grid
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: 'start',
    containScroll: 'trimSnaps',
    dragFree: false
  });
  const [selectedIndex, setSelectedIndex] = useState(0);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on('select', onSelect);
    return () => {
      emblaApi.off('select', onSelect);
    };
  }, [emblaApi, onSelect]);

  // Compute General Averages
  const generalAverages = useMemo(() => {
    if (!grades || grades.length === 0) return null;
    return {
      q1: computeQuarterlyGeneralAverage(grades, 'q1'),
      q2: computeQuarterlyGeneralAverage(grades, 'q2'),
      q3: computeQuarterlyGeneralAverage(grades, 'q3'),
      q4: computeQuarterlyGeneralAverage(grades, 'q4'),
      annual: computeAnnualGeneralAverage(grades),
    };
  }, [grades]);

  const [selectedQuarter, setSelectedQuarter] = useState<'Q1' | 'Q2' | 'Q3' | 'Q4' | 'Annual'>('Annual');

  // Auto-select Q1 if grades are available
  useEffect(() => {
    if (generalAverages?.q1 && generalAverages.q1 > 0) {
      setSelectedQuarter('Q1');
    }
  }, [generalAverages]);

  const displayedAverage = useMemo(() => {
    switch (selectedQuarter) {
      case 'Q1': return generalAverages?.q1 || 0;
      case 'Q2': return generalAverages?.q2 || 0;
      case 'Q3': return generalAverages?.q3 || 0;
      case 'Q4': return generalAverages?.q4 || 0;
      default: return generalAverages?.annual || 0;
    }
  }, [selectedQuarter, generalAverages]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-40 w-full rounded-[2.5rem]" />
        <div className="grid grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 rounded-3xl" />
          ))}
        </div>
        <Skeleton className="h-48 w-full rounded-3xl" />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-[url('/assets/student-mobile-bg.webp')] bg-cover bg-center bg-fixed bg-no-repeat sm:bg-none sm:bg-white -m-4 sm:-m-0 rounded-t-[3rem] overflow-hidden space-y-4 pb-20">

      {/* Header Container with Background */}
      <div className="relative overflow-hidden rounded-b-[3rem] pb-2">
        <BlurredPlaygroundBackground />

        {/* Animated Background Elements */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <RabbitButterflyBackground />
        </div>

        {/* Real-time Weather Background */}
        <div className="absolute inset-0 z-0">
          <WeatherBackground forcedTheme={overrideTheme as any} />
        </div>

        {/* Top Greeting Section */}
        {/* INCREASED PADDING TOP HERE (pt-6 -> pt-12) */}
        <div className="relative w-full shrink-0 pt-12 pb-0 z-10">
          {/* Profile Overlay */}
          <div className="flex items-center justify-between px-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full border-4 border-white shadow-lg overflow-hidden bg-rose-100 flex items-center justify-center">
                {studentPhotoUrl ? (
                  <img src={studentPhotoUrl} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-sky-100 flex items-center justify-center text-sky-500 font-bold text-xl">
                    {(studentName || "S")[0]}
                  </div>
                )}
              </div>
              <div className="flex flex-col">
                <span className="text-sky-800 font-bold text-sm leading-tight">
                  {(() => {
                    const hour = new Date().getHours();
                    if (hour >= 5 && hour < 12) return 'Good Morning!';
                    if (hour >= 12 && hour < 18) return 'Good Afternoon!';
                    return 'Good Evening!';
                  })()}
                </span>
                <h1 className="text-2xl font-black text-sky-950 leading-tight">
                  {studentName?.split(' ')[0] || "Student"} {studentName?.split(' ').slice(1).join(' ') || ""}
                </h1>
              </div>
            </div>

            {/* Digital Clock/Date Widget */}
            <div className="flex flex-col items-end">
              <span className="text-3xl font-black text-sky-950 leading-none tracking-tight">
                {format(new Date(), 'h:mm')}
                <span className="text-sm font-bold ml-1 text-sky-700">{format(new Date(), 'a')}</span>
              </span>
              <span className="text-xs font-bold text-sky-600 uppercase tracking-widest mt-0.5">
                {format(new Date(), 'EEEE, MMM d')}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* PROMOTIONAL SLIDER RESTORED */}
      <div className="px-5 mb-4 relative z-10">
        <PromotionalSlider schoolId={schoolId} />
      </div>

      {/* Activity Feed: What's New - Moved Top */}
      <div className="px-5 space-y-2 -mt-2 relative z-10">
        <div className="space-y-2">
          {/* Today Group */}
          <div className="rounded-[2rem] bg-white/40 border border-white/50 overflow-hidden backdrop-blur-md shadow-lg">
            <div className="bg-sky-500/90 px-6 py-2 flex items-center justify-between backdrop-blur-sm">
              <span className="text-white font-black text-sm tracking-tight">{format(new Date(), 'MMMM d')}</span>
              <div className="text-[10px] text-white/80 font-black uppercase tracking-widest flex items-center gap-1">
                What's New <StudentPortalIcon icon="fluent:sparkle-24-filled" size={12} />
              </div>
            </div>

            <div className="p-1.5 space-y-1.5">
              {/* Pinned Announcements (Registrar/Admin) */}
              {announcements.pinned.map((a) => (
                <div
                  key={a.id}
                  onClick={() => onCardClick?.('announcements')}
                  className="bg-amber-50/90 border border-amber-100 p-3 rounded-xl flex items-center justify-between cursor-pointer hover:bg-amber-100 transition-all active:scale-[0.98] shadow-sm relative overflow-hidden group"
                >
                  <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-amber-400/20 to-transparent rounded-bl-full pointer-events-none" />

                  <div className="flex items-center gap-4 relative z-10">
                    <div className="w-10 h-10 bg-amber-100/80 rounded-xl flex items-center justify-center border border-amber-200 shadow-inner">
                      <StudentPortalIcon icon="fluent:megaphone-loud-24-filled" className="text-amber-600 animate-pulse" size={24} />
                    </div>
                    <div className="flex flex-col text-left">
                      <span className="text-sm font-black text-amber-900 leading-tight line-clamp-1">{a.title}</span>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <Badge className="bg-amber-500 text-white border-none px-1.5 py-0 text-[9px] font-black tracking-wider uppercase rounded-md shadow-sm">
                          IMPORTANT
                        </Badge>
                        <span className="text-[10px] font-bold text-amber-700/60">Registrar's Office</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {assignments.pending.slice(0, 3).map((a) => (
                <div
                  key={a.id}
                  onClick={() => onCardClick?.('assignments')}
                  className="bg-white/60 p-3 rounded-xl flex items-center justify-between cursor-pointer hover:bg-white transition-all active:scale-[0.98]"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-sky-100 rounded-xl flex items-center justify-center">
                      <StudentPortalIcon icon={STUDENT_ICONS.homework} className="text-sky-600" size={24} />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-black text-sky-950 leading-tight">{a.title}</span>
                      <span className="text-[10px] font-bold text-sky-600/70">{a.subjects?.name}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge className="bg-emerald-50 text-emerald-600 border-none px-2 py-0.5 text-[10px] font-black rounded-full shadow-sm">
                      NEW
                    </Badge>
                    <span className="text-[10px] font-bold text-gray-400">Assignment</span>
                  </div>
                </div>
              ))}

              {announcements.regular.slice(0, 1).map((a) => (
                <div
                  key={a.id}
                  onClick={() => onCardClick?.('announcements')}
                  className="bg-white/60 p-3 rounded-xl flex items-center justify-between cursor-pointer hover:bg-white transition-all active:scale-[0.98]"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
                      <StudentPortalIcon icon={STUDENT_ICONS.events} className="text-indigo-600" size={24} />
                    </div>
                    <div className="flex flex-col text-left">
                      <span className="text-sm font-black text-sky-950 leading-tight">{a.title}</span>
                      <span className="text-[10px] font-bold text-gray-400">Announcement</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-gray-400">Just now</span>
                </div>
              ))}

              {assignments.pending.length === 0 && announcements.regular.length === 0 && announcements.pinned.length === 0 && (
                <div className="py-4 text-center">
                  <p className="text-sm font-bold text-sky-900/30">No new updates for today</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Swipeable Module Grid Container */}
      <div className="px-5 relative z-10">
        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex touch-pan-y">

            {/* Slide 1: Primary Stats */}
            <div className="flex-[0_0_100%] min-w-0 grid grid-cols-2 gap-3">
              <motion.div whileTap={{ scale: 0.95 }} onClick={() => onCardClick?.('grades')} className="cursor-pointer">
                <Card className="border-none shadow-xl bg-gradient-to-br from-[#FF6B6B] to-[#FF8E8E] text-white rounded-[2rem] overflow-hidden group">
                  <CardContent className="p-4 flex flex-col justify-between h-32">
                    <span className="text-sm font-black opacity-90">Grades</span>
                    <div className="flex items-end justify-between">
                      <div className="text-5xl font-black tracking-tighter">{displayedAverage?.toFixed(0) || 0}</div>
                      <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm group-hover:scale-110 transition-transform">
                        <img src="/assets/grades.png" className="w-8 h-8 object-contain" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div whileTap={{ scale: 0.95 }} onClick={() => onCardClick?.('attendance')} className="cursor-pointer">
                <Card className="border-none shadow-xl bg-gradient-to-br from-[#6BCB77] to-[#4FB35C] text-white rounded-[2rem] overflow-hidden group">
                  <CardContent className="p-4 flex flex-col justify-between h-32">
                    <span className="text-sm font-black opacity-90">Attendance</span>
                    <div className="flex items-end justify-between">
                      <div className="text-5xl font-black tracking-tighter">{attendance?.summary?.percentage.toFixed(0) || 0}%</div>
                      <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm group-hover:scale-110 transition-transform">
                        <StudentPortalIcon icon="fluent-emoji-flat:check-mark-button" size={32} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div whileTap={{ scale: 0.95 }} onClick={() => onCardClick?.('assignments')} className="cursor-pointer">
                <Card className="border-none shadow-xl bg-gradient-to-br from-[#FFA931] to-[#FF8C32] text-white rounded-[2rem] overflow-hidden group">
                  <CardContent className="p-4 flex flex-col justify-between h-32">
                    <div className="flex flex-col">
                      <span className="text-sm font-black opacity-90 leading-tight">Assignments</span>
                      <div className="text-2xl font-black tracking-tighter mt-1">{assignments?.pending.length} <span className="text-[10px] opacity-80 uppercase tracking-widest pl-1 font-black">due soon</span></div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="w-8 h-8 flex items-center justify-center opacity-0" /> {/* Spacer */}
                      <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm group-hover:scale-110 transition-transform">
                        <img src="/assets/timetable.png" className="w-8 h-8 object-contain grayscale brightness-200" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div whileTap={{ scale: 0.95 }} onClick={() => onCardClick?.('calendar')} className="cursor-pointer">
                <Card className="border-none shadow-xl bg-gradient-to-br from-[#4D96FF] to-[#006E7F] text-white rounded-[2rem] overflow-hidden group">
                  <CardContent className="p-4 flex flex-col justify-between h-32">
                    <span className="text-sm font-black opacity-90">School Calendar</span>
                    <div className="flex items-end justify-between">
                      <div className="text-2xl font-black tracking-tighter mt-1">12 <span className="text-[10px] opacity-80 uppercase tracking-widest pl-1 font-black">Events</span></div>
                      <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm group-hover:scale-110 transition-transform">
                        <StudentPortalIcon icon="fluent-emoji-flat:calendar" size={32} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Slide 2: Additional Modules */}
            <div className="flex-[0_0_100%] min-w-0 grid grid-cols-2 gap-3">
              <motion.div whileTap={{ scale: 0.95 }} onClick={() => onCardClick?.('exams')} className="cursor-pointer">
                <Card className="border-none shadow-xl bg-gradient-to-br from-[#A78BFA] to-[#8B5CF6] text-white rounded-[2rem] overflow-hidden group">
                  <CardContent className="p-4 flex flex-col justify-between h-32">
                    <span className="text-sm font-black opacity-90">Exams</span>
                    <div className="flex items-end justify-between">
                      <div className="text-3xl font-black tracking-tighter">{exams?.upcoming?.length || 0} <span className="text-[10px] opacity-80 uppercase tracking-widest pl-1 font-black">Upcoming</span></div>
                      <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm group-hover:scale-110 transition-transform">
                        <StudentPortalIcon icon="fluent-emoji-flat:pencil" size={32} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div whileTap={{ scale: 0.95 }} onClick={() => onCardClick?.('announcements')} className="cursor-pointer">
                <Card className="border-none shadow-xl bg-gradient-to-br from-[#F472B6] to-[#EC4899] text-white rounded-[2rem] overflow-hidden group">
                  <CardContent className="p-4 flex flex-col justify-between h-32">
                    <span className="text-sm font-black opacity-90">Announcements</span>
                    <div className="flex items-end justify-between">
                      <div className="text-3xl font-black tracking-tighter">{announcements?.count || 0} <span className="text-[10px] opacity-80 uppercase tracking-widest pl-1 font-black">Active</span></div>
                      <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm group-hover:scale-110 transition-transform">
                        <StudentPortalIcon icon="fluent-emoji-flat:megaphone" size={32} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div whileTap={{ scale: 0.95 }} onClick={() => onCardClick?.('schedule')} className="cursor-pointer">
                <Card className="border-none shadow-xl bg-gradient-to-br from-[#38BDF8] to-[#0EA5E9] text-white rounded-[2rem] overflow-hidden group">
                  <CardContent className="p-4 flex flex-col justify-between h-32">
                    <span className="text-sm font-black opacity-90">Teachers</span>
                    <div className="flex items-center justify-end">
                      <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm group-hover:scale-110 transition-transform">
                        <StudentPortalIcon icon="fluent-emoji-flat:teacher" size={32} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div whileTap={{ scale: 0.95 }} onClick={() => onCardClick?.('calendar')} className="cursor-pointer">
                <Card className="border-none shadow-xl bg-gradient-to-br from-[#FB923C] to-[#F97316] text-white rounded-[2rem] overflow-hidden group">
                  <CardContent className="p-4 flex flex-col justify-between h-32">
                    <span className="text-sm font-black opacity-90">Events</span>
                    <div className="flex items-center justify-end">
                      <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm group-hover:scale-110 transition-transform">
                        <StudentPortalIcon icon="fluent-emoji-flat:calendar" size={32} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

          </div>
        </div>

        {/* Pagination Indicators */}
        <div className="flex justify-center gap-2 mt-4">
          {[0, 1].map((index) => (
            <div
              key={index}
              className={cn(
                "h-2 rounded-full transition-all duration-300",
                selectedIndex === index ? "w-8 bg-sky-500" : "w-2 bg-slate-200"
              )}
            />
          ))}
        </div>
      </div>


    </div >
  );
};
