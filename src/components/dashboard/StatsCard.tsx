import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: { value: number; isPositive: boolean };
  variant?: 'purple' | 'pink' | 'yellow' | 'green';
  delay?: number;
}

const variantStyles = {
  purple: {
    card: 'bg-stat-purple-light',
    icon: 'bg-stat-purple text-white',
    title: 'text-stat-purple',
    value: 'text-foreground',
  },
  pink: {
    card: 'bg-stat-pink-light',
    icon: 'bg-stat-pink text-white',
    title: 'text-stat-pink',
    value: 'text-foreground',
  },
  yellow: {
    card: 'bg-stat-yellow-light',
    icon: 'bg-stat-yellow text-white',
    title: 'text-stat-yellow',
    value: 'text-foreground',
  },
  green: {
    card: 'bg-stat-green-light',
    icon: 'bg-stat-green text-white',
    title: 'text-stat-green',
    value: 'text-foreground',
  },
};

export const StatsCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  variant = 'purple',
  delay = 0
}: StatsCardProps) => {
  const styles = variantStyles[variant];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
      className={cn(
        "relative overflow-hidden rounded-xl p-4 shadow-card",
        styles.card
      )}
    >
      <div className="flex flex-col items-center text-center gap-2">
        <div className={cn(
          "rounded-xl p-2.5",
          styles.icon
        )}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className={cn(
            "text-sm font-medium",
            styles.title
          )}>
            {title}
          </p>
          <p className={cn(
            "mt-1 text-3xl font-bold tracking-tight",
            styles.value
          )}>
            {value}
          </p>
          {subtitle && (
            <p className="mt-1 text-xs text-muted-foreground">
              {subtitle}
            </p>
          )}
          {trend && (
            <div className={cn(
              "mt-2 flex items-center justify-center gap-1 text-sm font-medium",
              trend.isPositive ? 'text-success' : 'text-destructive'
            )}>
              <span>{trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%</span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};
