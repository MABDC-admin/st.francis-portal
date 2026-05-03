import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Activity, GraduationCap, Sparkles, TrendingUp } from 'lucide-react';
import { StudentBirthdays } from '@/components/dashboard/StudentBirthdays';
import { DashboardStatsRow } from '@/components/dashboard/DashboardStatsRow';
import { StudentOverview } from '@/components/dashboard/StudentOverview';
import { DashboardCalendar } from '@/components/dashboard/DashboardCalendar';
import { BottomActions } from '@/components/dashboard/BottomActions';
import { useStudents } from '@/hooks/useStudents';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { cn } from '@/lib/utils';

interface RegistrarPortalProps {
  onNavigate: (tab: string) => void;
  stats: {
    totalStudents: number;
    pendingEnrollments: number;
  };
}

const gradePalette = [
  {
    bar: 'bg-[hsl(var(--getyn-teal))]',
    soft: 'bg-[hsl(var(--getyn-teal)/0.12)] text-[hsl(var(--getyn-teal))]',
    border: 'border-[hsl(var(--getyn-teal)/0.2)]',
  },
  {
    bar: 'bg-[hsl(var(--getyn-blue))]',
    soft: 'bg-[hsl(var(--getyn-blue)/0.12)] text-[hsl(var(--getyn-blue))]',
    border: 'border-[hsl(var(--getyn-blue)/0.2)]',
  },
  {
    bar: 'bg-[hsl(var(--getyn-orange))]',
    soft: 'bg-[hsl(var(--getyn-orange)/0.12)] text-[hsl(var(--getyn-orange))]',
    border: 'border-[hsl(var(--getyn-orange)/0.2)]',
  },
  {
    bar: 'bg-[hsl(var(--getyn-purple))]',
    soft: 'bg-[hsl(var(--getyn-purple)/0.12)] text-[hsl(var(--getyn-purple))]',
    border: 'border-[hsl(var(--getyn-purple)/0.2)]',
  },
];

const normalizeGradeLevel = (level?: string | null) => {
  if (!level) return 'Unassigned';
  return level.trim() || 'Unassigned';
};

const sortGradeLevels = (a: string, b: string) => {
  const getRank = (value: string) => {
    const lower = value.toLowerCase();
    if (lower.includes('kindergarten')) return 0;
    const gradeMatch = lower.match(/grade\s*(\d+)/);
    if (gradeMatch) return Number(gradeMatch[1]);
    return 99;
  };

  const rankA = getRank(a);
  const rankB = getRank(b);
  return rankA === rankB ? a.localeCompare(b) : rankA - rankB;
};

const GradeLevelAnalytics = ({ students }: { students: Array<{ level?: string | null }> }) => {
  const gradeRows = useMemo(() => {
    const counts = students.reduce<Record<string, number>>((accumulator, student) => {
      const level = normalizeGradeLevel(student.level);
      accumulator[level] = (accumulator[level] || 0) + 1;
      return accumulator;
    }, {});

    const total = students.length || 1;

    return Object.entries(counts)
      .sort(([a], [b]) => sortGradeLevels(a, b))
      .map(([level, count], index) => ({
        level,
        count,
        percent: Math.round((count / total) * 100),
        height: Math.max(12, Math.round((count / Math.max(...Object.values(counts), 1)) * 100)),
        tone: gradePalette[index % gradePalette.length],
      }));
  }, [students]);

  const strongestGrade = gradeRows.reduce(
    (current, row) => (row.count > current.count ? row : current),
    { level: 'No learners', count: 0, percent: 0, tone: gradePalette[0] },
  );

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="page-surface overflow-hidden p-5"
    >
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
            </span>
            Live analytics
          </div>
          <h2 className="mt-3 text-lg font-semibold tracking-tight text-foreground">Grade Level Distribution</h2>
          <p className="mt-1 text-xs text-muted-foreground">Current academic-year learner count by grade.</p>
        </div>
        <div className="rounded-2xl border border-border/70 bg-card px-3 py-2 text-right shadow-sm">
          <p className="micro-label">Total</p>
          <p className="text-2xl font-bold tracking-tight text-foreground">{students.length}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Levels', value: gradeRows.length, icon: GraduationCap, tone: 'text-[hsl(var(--getyn-blue))]' },
          { label: 'Largest', value: strongestGrade.count, icon: TrendingUp, tone: 'text-[hsl(var(--getyn-teal))]' },
          { label: 'Live', value: 'On', icon: Activity, tone: 'text-primary' },
        ].map((item, index) => {
          const Icon = item.icon;
          return (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.08 * index }}
              className="rounded-2xl border border-border/70 bg-secondary/45 p-3"
            >
              <Icon className={cn("h-4 w-4", item.tone)} />
              <p className="mt-2 text-lg font-bold leading-none text-foreground">{item.value}</p>
              <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{item.label}</p>
            </motion.div>
          );
        })}
      </div>

      <div className="mt-5">
        {gradeRows.length > 0 ? (
          <div className="rounded-2xl border border-border/70 bg-secondary/35 p-4">
            <div className="flex h-56 items-end gap-3 overflow-x-auto pb-1">
              {gradeRows.map((row, index) => (
                <motion.div
                  key={row.level}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.12 + index * 0.06 }}
                  className="flex h-full min-w-[76px] flex-1 flex-col justify-end"
                >
                  <div className="mb-2 text-center">
                    <motion.p
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.35 + index * 0.06 }}
                      className="tabular text-lg font-bold leading-none text-foreground"
                    >
                      {row.count}
                    </motion.p>
                    <p className="mt-1 text-[10px] font-semibold text-muted-foreground">{row.percent}%</p>
                  </div>
                  <div className="flex h-36 items-end rounded-2xl bg-card/90 p-2 shadow-inner">
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${row.height}%` }}
                      transition={{ duration: 0.8, delay: 0.18 + index * 0.08, ease: 'easeOut' }}
                      className={cn("relative w-full overflow-hidden rounded-xl", row.tone.bar)}
                    >
                      <motion.span
                        animate={{ y: ['-35%', '135%'] }}
                        transition={{ duration: 1.8, repeat: Infinity, ease: 'linear', delay: index * 0.2 }}
                        className="absolute inset-x-0 top-0 h-1/2 bg-white/22 blur-sm"
                      />
                    </motion.div>
                  </div>
                  <div className="mt-3 min-h-[34px] text-center">
                    <p className="line-clamp-2 text-xs font-semibold leading-tight text-foreground">{row.level}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {gradeRows.map((row, index) => (
                <motion.div
                  key={`${row.level}-legend`}
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.32 + index * 0.04 }}
                  className={cn("flex items-center justify-between gap-2 rounded-xl border bg-card/80 px-3 py-2", row.tone.border)}
                >
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold text-foreground">{row.level}</p>
                    <p className="text-[10px] text-muted-foreground">{row.percent}% share</p>
                  </div>
                  <span className={cn("rounded-full px-2 py-1 text-xs font-bold", row.tone.soft)}>{row.count}</span>
                </motion.div>
              ))}
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-border/80 p-5 text-center">
            <Sparkles className="mx-auto h-5 w-5 text-muted-foreground" />
            <p className="mt-2 text-sm font-semibold text-foreground">No learner distribution yet</p>
            <p className="mt-1 text-xs text-muted-foreground">Grade analytics will appear once records are available.</p>
          </div>
        )}
      </div>
    </motion.section>
  );
};

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

  // Fetch pending teacher applications count
  const { data: pendingApplicants = 0 } = useQuery({
    queryKey: ['teacher-applications-pending'],
    queryFn: async () => {
      const { count } = await supabase
        .from('teacher_applications')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'submitted');
      return count || 0;
    },
  });

  // Calculate stats
  const totalStudents = students.length;
  const totalTeachers = teachersData || 0;
  const levels = [...new Set(students.map(s => s.level))].length;

  return (
    <div className="space-y-6">
      {/* Stats Row */}
      <DashboardStatsRow
        totalStudents={totalStudents}
        totalTeachers={totalTeachers}
        totalClasses={levels}
        libraryCount={flipbooksCount}
        onLibraryClick={() => onNavigate('library')}
        palette="registrar"
      />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        {/* Left Column */}
        <div className="space-y-4">
          <DashboardCalendar compact />
          <GradeLevelAnalytics students={students} />
        </div>

        {/* Right Column */}
        <div className="space-y-4">
          <StudentBirthdays />
          <StudentOverview students={students} />
        </div>
      </div>

      {/* Bottom Actions */}
      <BottomActions onNavigate={onNavigate} palette="registrar" />
    </div>
  );
};
