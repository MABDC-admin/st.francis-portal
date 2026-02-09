import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { useEffect } from 'react';
import { cn } from '@/lib/utils';
import { StudentIcon3D, TeacherIcon3D, ClassesIcon3D, LibraryIcon3D } from '@/components/icons/ThreeDIcons';
import { AppleStudentIcon, AppleTeacherIcon, AppleClassesIcon, AppleLibraryIcon } from '@/components/icons/AppleStyleIcons';
import { LayoutStyle } from '@/contexts/DashboardLayoutContext';

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
  variant?: LayoutStyle;
}

export const DashboardStatsRow = ({
  totalStudents,
  totalTeachers,
  totalClasses,
  libraryCount = 0,
  onLibraryClick,
  variant = 'modern'
}: DashboardStatsRowProps) => {
  const isClassic = variant === 'classicBlue';
  const isApple = variant === 'apple';
  
  const stats = [
    {
      value: totalStudents,
      label: 'Total Learners',
      bgClass: isApple ? 'apple-stat-green' : isClassic ? 'classic-stat-green' : 'bg-success',
      icon: isApple ? AppleStudentIcon : StudentIcon3D,
    },
    {
      value: totalTeachers,
      label: 'Teachers',
      bgClass: isApple ? 'apple-stat-blue' : isClassic ? 'classic-stat-blue' : 'bg-info',
      icon: isApple ? AppleTeacherIcon : TeacherIcon3D,
    },
    {
      value: totalClasses,
      label: 'Classes',
      bgClass: isApple ? 'apple-stat-orange' : isClassic ? 'classic-stat-yellow' : 'bg-yellow-500',
      icon: isApple ? AppleClassesIcon : ClassesIcon3D,
    },
    {
      value: libraryCount,
      label: 'Library',
      sublabel: 'Browse Flipbooks',
      bgClass: isApple ? 'apple-stat-red' : isClassic ? 'classic-stat-red' : 'bg-purple-500',
      icon: isApple ? AppleLibraryIcon : LibraryIcon3D,
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
            "rounded-xl p-4 text-white flex items-center justify-between gap-3 overflow-hidden relative",
            stat.bgClass,
            isApple ? "rounded-[20px] shadow-[0_2px_12px_rgba(0,0,0,0.08)]" : isClassic ? "rounded-2xl shadow-lg" : "shadow-md",
            stat.onClick && "cursor-pointer hover:scale-[1.02] transition-transform"
          )}
        >
          {/* Icon container */}
          <div className={cn(
            "p-2 rounded-lg shrink-0 w-12 h-12 flex items-center justify-center",
            isApple ? "bg-white/25 rounded-xl" : "bg-white/20"
          )}>
            <stat.icon className={cn(
              "w-full h-full",
              isApple ? "stroke-white" : "drop-shadow-md"
            )} />
          </div>
          <div className="text-right">
            <p className={cn(
              "font-bold",
              isApple ? "text-2xl lg:text-3xl font-semibold" : isClassic ? "text-3xl lg:text-4xl" : "text-2xl lg:text-3xl"
            )}>
              <AnimatedCounter value={stat.value} />
            </p>
            <p className={cn(
              "opacity-90",
              isApple ? "text-[11px] font-medium tracking-wide" : "text-xs"
            )}>{stat.label}</p>
            {stat.sublabel && (
              <p className={cn(
                "opacity-75",
                isApple ? "text-[9px] font-medium" : "text-[10px]"
              )}>{stat.sublabel}</p>
            )}
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
};
