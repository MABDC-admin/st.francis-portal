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
import { useDashboardLayout } from '@/contexts/DashboardLayoutContext';
import { cn } from '@/lib/utils';

interface AdminPortalProps {
  onNavigate: (tab: string) => void;
}

export const AdminPortal = ({ onNavigate }: AdminPortalProps) => {
  const { data: students = [] } = useStudents();
  const { layoutStyle } = useDashboardLayout();
  const isClassic = layoutStyle === 'classicBlue';

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

  const isApple = layoutStyle === 'apple';

  return (
    <div className={cn(
      "space-y-6",
      isClassic && "dashboard-classic-blue dashboard-page-bg",
      isApple && "dashboard-apple apple-page-bg"
    )}>
      {/* Header */}
      <DashboardHeader onNavigateToMessages={() => onNavigate('messages')} />

      {/* Stats Row */}
      <DashboardStatsRow
        totalStudents={totalStudents}
        totalTeachers={totalTeachers}
        totalClasses={levels}
        libraryCount={flipbooksCount}
        onLibraryClick={() => onNavigate('library')}
        variant={layoutStyle}
      />

      {/* Quick Actions */}
      <QuickActions onNavigate={onNavigate} variant={layoutStyle} />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-4">
          {/* Calendar and Events Row */}
          <div className={cn(
            "grid grid-cols-1",
            isClassic && "classic-card p-4",
            isApple && "apple-card p-4"
          )}>
            <DashboardCalendar />
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-4">
          <div className={cn(
            isClassic && "classic-card p-4",
            isApple && "apple-card p-4"
          )}>
            <StudentBirthdays />
          </div>
          <div className={cn(
            isClassic && "classic-card p-4",
            isApple && "apple-card p-4"
          )}>
            <StudentOverview students={students} />
          </div>
        </div>
      </div>

      {/* Bottom Actions */}
      <BottomActions onNavigate={onNavigate} variant={layoutStyle} />
    </div>
  );
};
