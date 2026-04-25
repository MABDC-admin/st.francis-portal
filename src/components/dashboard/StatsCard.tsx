import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: { value: number; isPositive: boolean };
  variant?: "purple" | "pink" | "yellow" | "green";
  delay?: number;
}

const variantStyles = {
  purple: {
    shell: "from-primary/12 via-background to-background",
    icon: "bg-primary/12 text-primary",
  },
  pink: {
    shell: "from-info/12 via-background to-background",
    icon: "bg-info/12 text-info",
  },
  yellow: {
    shell: "from-warning/14 via-background to-background",
    icon: "bg-warning/14 text-warning",
  },
  green: {
    shell: "from-hrms-success/12 via-background to-background",
    icon: "bg-hrms-success/12 text-hrms-success",
  },
};

export const StatsCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  variant = "purple",
  delay = 0,
}: StatsCardProps) => {
  const styles = variantStyles[variant];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
      className={cn("rounded-lg border bg-gradient-to-br p-5 shadow-card", styles.shell)}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="micro-label">{title}</p>
          <p className="tabular mt-3 text-3xl font-bold tracking-tight text-foreground">{value}</p>
          {subtitle && <p className="mt-2 text-xs text-muted-foreground">{subtitle}</p>}
          {trend && (
            <p className={cn("mt-3 text-xs font-semibold", trend.isPositive ? "text-hrms-success" : "text-destructive")}>
              {trend.isPositive ? "Up" : "Down"} {Math.abs(trend.value)}%
            </p>
          )}
        </div>
        <div className={cn("rounded-2xl p-2.5", styles.icon)}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </motion.div>
  );
};
