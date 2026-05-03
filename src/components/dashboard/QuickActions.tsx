import { motion } from "framer-motion";
import { CalendarDays, ClipboardCheck, MessageSquare, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LayoutStyle } from "@/contexts/DashboardLayoutContext";
import { cn } from "@/lib/utils";

interface QuickActionsProps {
  onNavigate: (tab: string) => void;
  variant?: LayoutStyle;
  palette?: "default" | "registrar";
}

const actions = [
  {
    label: "Admit Learner",
    icon: UserPlus,
    tab: "enrollment",
    registrarTone: "border-[hsl(var(--getyn-teal)/0.18)] bg-[hsl(var(--getyn-teal)/0.08)] text-[hsl(var(--getyn-teal))]",
  },
  {
    label: "Messages",
    icon: MessageSquare,
    tab: "messages",
    registrarTone: "border-[hsl(var(--getyn-blue)/0.18)] bg-[hsl(var(--getyn-blue)/0.08)] text-[hsl(var(--getyn-blue))]",
  },
  {
    label: "Academic Years",
    icon: CalendarDays,
    tab: "academic-years",
    registrarTone: "border-[hsl(var(--getyn-orange)/0.18)] bg-[hsl(var(--getyn-orange)/0.08)] text-[hsl(var(--getyn-orange))]",
  },
  {
    label: "Enter Grades",
    icon: ClipboardCheck,
    tab: "grades",
    registrarTone: "border-[hsl(var(--getyn-purple)/0.18)] bg-[hsl(var(--getyn-purple)/0.08)] text-[hsl(var(--getyn-purple))]",
  },
];

export const QuickActions = ({ onNavigate, palette = "default" }: QuickActionsProps) => {
  const isRegistrarPalette = palette === "registrar";

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
                className={cn(
                  "h-auto w-full justify-start gap-3 rounded-lg px-4 py-4 text-left",
                  isRegistrarPalette && "border-border/80 bg-card/90 hover:-translate-y-0.5 hover:bg-card",
                )}
                onClick={() => onNavigate(action.tab)}
              >
                <span
                  className={cn(
                    "rounded-2xl border p-2",
                    isRegistrarPalette ? action.registrarTone : "border-transparent bg-accent text-accent-foreground",
                  )}
                >
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
