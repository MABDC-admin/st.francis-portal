import { motion } from 'framer-motion';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { DashboardStatsRow } from '@/components/dashboard/DashboardStatsRow';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { UpcomingEvents } from '@/components/dashboard/UpcomingEvents';
import { RecentActivities } from '@/components/dashboard/RecentActivities';
import { StudentOverview } from '@/components/dashboard/StudentOverview';
import { TeacherSchedule } from '@/components/dashboard/TeacherSchedule';
import { GenderChart } from '@/components/dashboard/GenderChart';
import { DashboardCalendar } from '@/components/dashboard/DashboardCalendar';
import { BottomActions } from '@/components/dashboard/BottomActions';
import { useStudents } from '@/hooks/useStudents';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

interface AdminPortalProps {
  onNavigate: (tab: string) => void;
}

export const AdminPortal = ({ onNavigate }: AdminPortalProps) => {
  const { data: students = [] } = useStudents();
  
  // Fetch teachers count
  const { data: teachersData } = useQuery({
    queryKey: ['teachers-count'],
    queryFn: async () => {
      const { count } = await supabase
        .from('teachers')
        .select('*', { count: 'exact', head: true });
      return count || 0;
    },
  });

  // Calculate stats
  const totalStudents = students.length;
  const totalTeachers = teachersData || 38;
  const levels = [...new Set(students.map(s => s.level))].length;
  const attendanceRate = 86; // Mock attendance rate

  return (
    <div className="space-y-0">
      {/* Header */}
      <DashboardHeader />

      {/* Stats Row */}
      <DashboardStatsRow
        totalStudents={totalStudents}
        totalTeachers={totalTeachers}
        totalClasses={levels}
        attendanceRate={attendanceRate}
      />

      {/* Quick Actions */}
      <QuickActions onNavigate={onNavigate} />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-4">
          {/* Events and Activities Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <UpcomingEvents />
            <RecentActivities />
          </div>

          {/* Teacher Schedule and Gender Chart Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TeacherSchedule />
            <GenderChart students={students} />
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-4">
          <StudentOverview students={students} />
          <DashboardCalendar />
        </div>
      </div>

      {/* Bottom Actions */}
      <BottomActions onNavigate={onNavigate} />
    </div>
  );
};
