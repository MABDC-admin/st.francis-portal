import { motion } from "framer-motion";
import { ArrowRight, ClipboardCheck, LayoutGrid, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { LayoutStyle } from "@/contexts/DashboardLayoutContext";

interface BottomActionsProps {
  onNavigate: (tab: string) => void;
  variant?: LayoutStyle;
  palette?: "default" | "registrar";
}

const actions = [
  {
    label: "Manage Learners",
    description: "Open records, profiles, and status tracking.",
    icon: Users,
    tab: "students",
    accent: "bg-primary/12 text-primary",
    registrarAccent: "bg-[hsl(var(--getyn-teal)/0.14)] text-[hsl(var(--getyn-teal))]",
    registrarBorder: "border-[hsl(var(--getyn-teal)/0.22)]",
  },
  {
    label: "Organize Classes",
    description: "Keep sections, subjects, and schedules aligned.",
    icon: LayoutGrid,
    tab: "subjects",
    accent: "bg-warning/14 text-warning",
    registrarAccent: "bg-[hsl(var(--getyn-orange)/0.14)] text-[hsl(var(--getyn-orange))]",
    registrarBorder: "border-[hsl(var(--getyn-orange)/0.22)]",
  },
  {
    label: "Track Attendance",
    description: "Review attendance and update grade-linked progress.",
    icon: ClipboardCheck,
    tab: "grades",
    accent: "bg-hrms-success/12 text-hrms-success",
    registrarAccent: "bg-[hsl(var(--getyn-blue)/0.14)] text-[hsl(var(--getyn-blue))]",
    registrarBorder: "border-[hsl(var(--getyn-blue)/0.22)]",
  },
];

export const BottomActions = ({ onNavigate, palette = "default" }: BottomActionsProps) => {
  const isRegistrarPalette = palette === "registrar";

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
            className={cn(
              "page-surface interactive-card flex items-center gap-4 p-5 text-left",
              isRegistrarPalette && action.registrarBorder,
            )}
          >
            <div className={cn("rounded-2xl p-2.5", isRegistrarPalette ? action.registrarAccent : action.accent)}>
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
