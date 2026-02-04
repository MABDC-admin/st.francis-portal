import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { AdmitStudentIcon3D, AddTeacherIcon3D, ScheduleIcon3D, EnterGradeIcon3D } from '@/components/icons/ThreeDIcons';

interface QuickActionsProps {
  onNavigate: (tab: string) => void;
}

export const QuickActions = ({ onNavigate }: QuickActionsProps) => {
  const actions = [
    {
      icon: AdmitStudentIcon3D,
      label: 'Admit Student',
      onClick: () => onNavigate('enrollment'),
      bgClass: 'bg-card hover:bg-muted',
      iconBg: 'bg-info/10',
      iconColor: 'text-info',
    },
    {
      icon: AddTeacherIcon3D,
      label: 'Add Teacher',
      onClick: () => onNavigate('teachers'),
      bgClass: 'bg-card hover:bg-muted',
      iconBg: 'bg-success/10',
      iconColor: 'text-success',
    },
    {
      icon: ScheduleIcon3D,
      label: 'Schedule',
      onClick: () => onNavigate('academic-years'),
      bgClass: 'bg-card hover:bg-muted',
      iconBg: 'bg-warning/10',
      iconColor: 'text-warning',
    },
    {
      icon: EnterGradeIcon3D,
      label: 'Enter Grades',
      onClick: () => onNavigate('grades'),
      bgClass: 'bg-card hover:bg-muted',
      iconBg: 'bg-stat-purple/10',
      iconColor: 'text-stat-purple',
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6"
    >
      {actions.map((action, index) => (
        <motion.button
          key={action.label}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: 0.2 + index * 0.05,
            type: "spring",
            stiffness: 260,
            damping: 20
          }}
          whileHover={{
            rotateX: -15,
            y: -8,
            scale: 1.02,
            boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)"
          }}
          whileTap={{ scale: 0.98 }}
          onClick={action.onClick}
          style={{
            transformOrigin: "top",
            perspective: "1000px"
          }}
          className={cn(
            "rounded-xl p-4 flex flex-col items-center gap-2 transition-all border border-border",
            action.bgClass
          )}
        >
          <div className={cn("p-2 rounded-full h-12 w-12 flex items-center justify-center", action.iconBg)}>
            <action.icon className="h-full w-full drop-shadow-sm" />
          </div>
          <span className="text-sm font-medium text-foreground">{action.label}</span>
        </motion.button>
      ))}
    </motion.div>
  );
};
