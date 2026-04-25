import { motion } from "framer-motion";
import { CalendarDays, ClipboardCheck, MessageSquare, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LayoutStyle } from "@/contexts/DashboardLayoutContext";

interface QuickActionsProps {
  onNavigate: (tab: string) => void;
  variant?: LayoutStyle;
}

const actions = [
  { label: "Admit Learner", icon: UserPlus, tab: "enrollment" },
  { label: "Messages", icon: MessageSquare, tab: "messages" },
  { label: "Academic Years", icon: CalendarDays, tab: "academic-years" },
  { label: "Enter Grades", icon: ClipboardCheck, tab: "grades" },
];

export const QuickActions = ({ onNavigate }: QuickActionsProps) => {
  return (
    <div className="page-surface p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="micro-label">Quick Actions</p>
          <h2 className="text-lg font-semibold text-foreground">Move the day forward</h2>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {actions.map((action, index) => {
          const Icon = action.icon;

          return (
            <motion.div
              key={action.tab}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.08 }}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <Button
                variant="outline"
                className="h-auto w-full justify-start gap-3 rounded-lg px-4 py-4 text-left"
                onClick={() => onNavigate(action.tab)}
              >
                <span className="rounded-2xl bg-accent p-2 text-accent-foreground">
                  <Icon className="h-4 w-4" />
                </span>
                <span className="text-sm font-medium">{action.label}</span>
              </Button>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
