import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { useEffect } from 'react';
import { cn } from '@/lib/utils';
import { StudentIcon3D, TeacherIcon3D, ClassesIcon3D, LibraryIcon3D } from '@/components/icons/ThreeDIcons';

const AnimatedCounter = ({ value, duration = 3 }: { value: number | string, duration?: number }) => {
  const numericValue = typeof value === 'string' ? parseFloat(value) : value;
  const isPercentage = typeof value === 'string' && value.includes('%');

  const count = useMotionValue(0);
  const displayValue = useTransform(count, (latest) => {
    const rounded = Math.round(latest);
    return isPercentage ? `${rounded}%` : rounded.toString();
  });

  useEffect(() => {
    const controls = animate(count, numericValue, {
      duration: duration,
      ease: "easeOut",
    });
    return controls.stop;
  }, [numericValue, count, duration]);

  return <motion.span>{displayValue}</motion.span>;
};

interface DashboardStatsRowProps {
  totalStudents: number;
  totalTeachers: number;
  totalClasses: number;
  libraryCount?: number;
  onLibraryClick?: () => void;
}

export const DashboardStatsRow = ({
  totalStudents,
  totalTeachers,
  totalClasses,
  libraryCount = 0,
  onLibraryClick
}: DashboardStatsRowProps) => {
  const stats = [
    {
      value: totalStudents,
      label: 'Total Students',
      bgClass: 'bg-success',
      icon: StudentIcon3D,
    },
    {
      value: totalTeachers,
      label: 'Teachers',
      bgClass: 'bg-info',
      icon: TeacherIcon3D,
    },
    {
      value: totalClasses,
      label: 'Classes',
      bgClass: 'bg-yellow-500',
      icon: ClassesIcon3D,
    },
    {
      value: libraryCount,
      label: 'Library',
      sublabel: 'Browse Flipbooks',
      bgClass: 'bg-purple-500',
      icon: LibraryIcon3D,
      onClick: onLibraryClick,
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6"
    >
      {stats.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.1 }}
          onClick={stat.onClick}
          className={cn(
            "rounded-xl p-4 text-white flex items-center justify-between gap-3 shadow-md overflow-hidden relative",
            stat.bgClass,
            stat.onClick && "cursor-pointer hover:scale-[1.02] transition-transform"
          )}
        >
          {/* Glassy background effect for icon container */}
          <div className="bg-white/20 p-2 rounded-lg shrink-0 w-12 h-12 flex items-center justify-center">
            <stat.icon className="w-full h-full drop-shadow-md" />
          </div>
          <div className="text-right">
            <p className="text-2xl lg:text-3xl font-bold">
              <AnimatedCounter value={stat.value} />
            </p>
            <p className="text-xs opacity-90">{stat.label}</p>
            {stat.sublabel && (
              <p className="text-[10px] opacity-75">{stat.sublabel}</p>
            )}
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
};
