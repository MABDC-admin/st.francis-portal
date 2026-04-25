import { motion } from "framer-motion";
import { ArrowRight, ClipboardCheck, LayoutGrid, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { LayoutStyle } from "@/contexts/DashboardLayoutContext";

interface BottomActionsProps {
  onNavigate: (tab: string) => void;
  variant?: LayoutStyle;
}

const actions = [
  {
    label: "Manage Learners",
    description: "Open records, profiles, and status tracking.",
    icon: Users,
    tab: "students",
    accent: "bg-primary/12 text-primary",
  },
  {
    label: "Organize Classes",
    description: "Keep sections, subjects, and schedules aligned.",
    icon: LayoutGrid,
    tab: "subjects",
    accent: "bg-warning/14 text-warning",
  },
  {
    label: "Track Attendance",
    description: "Review attendance and update grade-linked progress.",
    icon: ClipboardCheck,
    tab: "grades",
    accent: "bg-hrms-success/12 text-hrms-success",
  },
];

export const BottomActions = ({ onNavigate }: BottomActionsProps) => {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {actions.map((action, index) => {
        const Icon = action.icon;

        return (
          <motion.button
            key={action.tab}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + index * 0.08 }}
            onClick={() => onNavigate(action.tab)}
            className="page-surface interactive-card flex items-center gap-4 p-5 text-left"
          >
            <div className={cn("rounded-2xl p-2.5", action.accent)}>
              <Icon className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-foreground">{action.label}</p>
              <p className="mt-1 text-xs text-muted-foreground">{action.description}</p>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
          </motion.button>
        );
      })}
    </div>
  );
};
