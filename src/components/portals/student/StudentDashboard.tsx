import { STUDENT_ICONS, StudentPortalIcon } from '@/components/icons/StudentPortalIcons';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { useMemo, useState, useEffect } from 'react';
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
import { PromotionalSlider } from '@/components/portals/student/widgets/PromotionalSlider';

interface StudentDashboardProps {
  studentId: string;
  gradeLevel: string;
  schoolId: string;
  academicYearId: string;
  grades: any[];
  schedule?: any[];
  studentName?: string;
  studentPhotoUrl?: string | null;
}
import { useZoomSession } from '@/hooks/useZoomSession';
import { Video, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const StudentDashboard = ({
  studentId,
  gradeLevel,
  schoolId,
  academicYearId,
  grades,
  studentName,
  studentPhotoUrl,
}: StudentDashboardProps) => {
  const { attendance, assignments, exams, announcements, isLoading } = useStudentDashboardStats(
    studentId,
    gradeLevel,
    schoolId,
    academicYearId
  );

  const { settings, inSession, countdown } = useZoomSession(schoolId);

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
    <div className="flex flex-col min-h-screen bg-white -m-4 sm:-m-0 rounded-t-[3rem] overflow-hidden space-y-6 pb-20">

      {/* Top Greeting Section */}
      <div className="relative w-full overflow-hidden shrink-0 pt-8 pb-4">
        {/* Profile Overlay */}
        <div className="flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full border-4 border-white shadow-lg overflow-hidden bg-rose-100">
              <AnimatedStudentAvatar name={studentName || "Student"} photoUrl={studentPhotoUrl || null} />
            </div>
            <div className="flex flex-col">
              <span className="text-sky-800 font-bold text-sm leading-tight">Good Morning!</span>
              <h1 className="text-2xl font-black text-sky-950 leading-tight">
                {studentName?.split(' ')[0] || "Student"} {studentName?.split(' ').slice(1).join(' ') || ""}
              </h1>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid (2x2) */}
      <div className="px-5 grid grid-cols-2 gap-4 -mt-8 relative z-10">
        <motion.div whileTap={{ scale: 0.95 }} className="cursor-pointer">
          <Card className="border-none shadow-xl bg-gradient-to-br from-[#FF6B6B] to-[#FF8E8E] text-white rounded-[2rem] overflow-hidden group">
            <CardContent className="p-5 flex flex-col justify-between h-36">
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

        <motion.div whileTap={{ scale: 0.95 }} className="cursor-pointer">
          <Card className="border-none shadow-xl bg-gradient-to-br from-[#6BCB77] to-[#4FB35C] text-white rounded-[2rem] overflow-hidden group">
            <CardContent className="p-5 flex flex-col justify-between h-36">
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

        <motion.div whileTap={{ scale: 0.95 }} className="cursor-pointer">
          <Card className="border-none shadow-xl bg-gradient-to-br from-[#FFA931] to-[#FF8C32] text-white rounded-[2rem] overflow-hidden group">
            <CardContent className="p-5 flex flex-col justify-between h-36">
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

        <motion.div whileTap={{ scale: 0.95 }} className="cursor-pointer">
          <Card className="border-none shadow-xl bg-gradient-to-br from-[#4D96FF] to-[#006E7F] text-white rounded-[2rem] overflow-hidden group">
            <CardContent className="p-5 flex flex-col justify-between h-36">
              <span className="text-sm font-black opacity-90">Schedule</span>
              <div className="flex items-center justify-end">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm group-hover:scale-110 transition-transform">
                  <StudentPortalIcon icon="fluent-emoji-flat:calendar" size={32} />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Promotional Banner Placeholder / Event Banner */}
      <div className="px-5">
        <PromotionalSlider schoolId={schoolId} />
      </div>

      {/* Activity Feed: What's New */}
      <div className="px-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-black text-sky-950 text-lg">What's New</h3>
        </div>

        <div className="space-y-4">
          {/* Today Group */}
          <div className="rounded-[2rem] bg-sky-50/50 border border-sky-100/50 overflow-hidden backdrop-blur-sm">
            <div className="bg-sky-500 px-6 py-2 flex items-center justify-between">
              <span className="text-white font-black text-sm tracking-tight">{format(new Date(), 'MMMM d')}</span>
              <button className="text-[10px] text-white/80 font-black uppercase tracking-widest flex items-center gap-1">
                View all <StudentPortalIcon icon="fluent:chevron-right-24-filled" size={12} />
              </button>
            </div>

            <div className="p-2 space-y-1">
              {assignments.pending.slice(0, 3).map((a) => (
                <div key={a.id} className="bg-white/60 p-4 rounded-2xl flex items-center justify-between">
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
                    <span className="text-[10px] font-bold text-gray-400">9:00 AM</span>
                  </div>
                </div>
              ))}

              {announcements.regular.slice(0, 1).map((a) => (
                <div key={a.id} className="bg-white/60 p-4 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                      <StudentPortalIcon icon={STUDENT_ICONS.events} className="text-amber-600" size={24} />
                    </div>
                    <div className="flex flex-col text-left">
                      <span className="text-sm font-black text-sky-950 leading-tight">{a.title}</span>
                      <span className="text-[10px] font-bold text-gray-400">General Announcement</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-gray-400">Just now</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};
