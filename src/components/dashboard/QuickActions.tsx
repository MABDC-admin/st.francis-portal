import { motion } from 'framer-motion';
import { UserPlus, Users, Calendar, FileSpreadsheet } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuickActionsProps {
  onNavigate: (tab: string) => void;
}

export const QuickActions = ({ onNavigate }: QuickActionsProps) => {
  const actions = [
    {
      icon: UserPlus,
      label: 'Admit Student',
      onClick: () => onNavigate('enrollment'),
      bgClass: 'bg-card hover:bg-muted',
      iconBg: 'bg-info/10',
      iconColor: 'text-info',
    },
    {
      icon: Users,
      label: 'Add Teacher',
      onClick: () => onNavigate('teachers'),
      bgClass: 'bg-card hover:bg-muted',
      iconBg: 'bg-success/10',
      iconColor: 'text-success',
    },
    {
      icon: Calendar,
      label: 'Schedule',
      onClick: () => onNavigate('academic-years'),
      bgClass: 'bg-card hover:bg-muted',
      iconBg: 'bg-warning/10',
      iconColor: 'text-warning',
    },
    {
      icon: FileSpreadsheet,
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
          transition={{ delay: 0.2 + index * 0.05 }}
          onClick={action.onClick}
          className={cn(
            "rounded-xl p-4 flex flex-col items-center gap-2 transition-all shadow-sm border border-border",
            action.bgClass
          )}
        >
          <div className={cn("p-3 rounded-full", action.iconBg)}>
            <action.icon className={cn("h-6 w-6", action.iconColor)} />
          </div>
          <span className="text-sm font-medium text-foreground">{action.label}</span>
        </motion.button>
      ))}
    </motion.div>
  );
};
