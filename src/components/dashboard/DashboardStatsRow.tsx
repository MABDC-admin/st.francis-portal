import { motion } from 'framer-motion';
import { Users, BookOpen, Building, ClipboardCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DashboardStatsRowProps {
  totalStudents: number;
  totalTeachers: number;
  totalClasses: number;
  attendanceRate: number;
}

export const DashboardStatsRow = ({ 
  totalStudents, 
  totalTeachers, 
  totalClasses, 
  attendanceRate 
}: DashboardStatsRowProps) => {
  const stats = [
    {
      value: totalStudents,
      label: 'Total Students',
      bgClass: 'bg-success',
      icon: Users,
    },
    {
      value: totalTeachers,
      label: 'Teachers',
      bgClass: 'bg-info',
      icon: BookOpen,
    },
    {
      value: totalClasses,
      label: 'Classes',
      bgClass: 'bg-muted-foreground/50',
      icon: Building,
    },
    {
      value: `${attendanceRate}%`,
      label: 'Attendance',
      sublabel: 'Gen 00%',
      bgClass: 'bg-destructive',
      icon: ClipboardCheck,
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
          className={cn(
            "rounded-xl p-4 text-white flex items-center gap-3 shadow-md",
            stat.bgClass
          )}
        >
          <div className="bg-white/20 p-2 rounded-lg">
            <stat.icon className="h-6 w-6" />
          </div>
          <div>
            <p className="text-2xl lg:text-3xl font-bold">{stat.value}</p>
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
