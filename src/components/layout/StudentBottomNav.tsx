import { BookOpen, CalendarDays, ClipboardCheck, LayoutGrid, NotebookPen } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface StudentBottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const navItems = [
  { id: "portal", label: "Home", icon: LayoutGrid },
  { id: "student-schedule", label: "Schedule", icon: CalendarDays },
  { id: "student-assignments", label: "Tasks", icon: NotebookPen },
  { id: "student-grades", label: "Grades", icon: ClipboardCheck },
  { id: "student-library", label: "Library", icon: BookOpen },
];

export const StudentBottomNav = ({ activeTab, onTabChange }: StudentBottomNavProps) => {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border/80 bg-card/98 shadow-[0_-12px_40px_rgba(15,23,42,0.08)] backdrop-blur md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <div className="grid grid-cols-5 gap-1 px-2 py-2">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          const Icon = item.icon;

          return (
            <motion.button
              key={item.id}
              whileTap={{ scale: 0.96 }}
              onClick={() => onTabChange(item.id)}
              className={cn(
                "flex min-h-[62px] flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2 text-center transition-all",
                isActive ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-muted/70",
              )}
            >
              <div
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-full transition-all",
                  isActive ? "bg-primary text-primary-foreground shadow-glow" : "bg-muted text-muted-foreground",
                )}
              >
                <Icon className="h-[18px] w-[18px]" />
              </div>
              <span className={cn("text-[10px] font-semibold uppercase tracking-[0.16em]", isActive && "text-primary")}>
                {item.label}
              </span>
            </motion.button>
          );
        })}
      </div>
    </nav>
  );
};
