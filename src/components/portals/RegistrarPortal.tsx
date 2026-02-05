import { motion } from 'framer-motion';
import { StudentBirthdays } from '@/components/dashboard/StudentBirthdays';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { DashboardStatsRow } from '@/components/dashboard/DashboardStatsRow';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { StudentOverview } from '@/components/dashboard/StudentOverview';
import { DashboardCalendar } from '@/components/dashboard/DashboardCalendar';
import { BottomActions } from '@/components/dashboard/BottomActions';
import { useStudents } from '@/hooks/useStudents';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

interface RegistrarPortalProps {
  onNavigate: (tab: string) => void;
  stats: {
    totalStudents: number;
    pendingEnrollments: number;
  };
}

export const RegistrarPortal = ({ onNavigate, stats }: RegistrarPortalProps) => {
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

  // Fetch flipbooks count
  const { data: flipbooksCount = 0 } = useQuery({
    queryKey: ['flipbooks-count'],
    queryFn: async () => {
      const { count } = await supabase
        .from('flipbooks')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);
      return count || 0;
    },
  });

  // Calculate stats
  const totalStudents = students.length;
  const totalTeachers = teachersData || 0;
  const levels = [...new Set(students.map(s => s.level))].length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <DashboardHeader />

      {/* Stats Row */}
      <DashboardStatsRow
        totalStudents={totalStudents}
        totalTeachers={totalTeachers}
        totalClasses={levels}
        libraryCount={flipbooksCount}
        onLibraryClick={() => onNavigate('library')}
      />

      {/* Quick Actions */}
      <QuickActions onNavigate={onNavigate} />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-4">
          {/* Calendar and Events Row */}
          <div className="grid grid-cols-1">
            <DashboardCalendar />
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-4">
          <StudentBirthdays />
          <StudentOverview students={students} />
        </div>
      </div>

      {/* Bottom Actions */}
      <BottomActions onNavigate={onNavigate} />
    </div>
  );
};
