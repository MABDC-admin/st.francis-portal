import { motion } from "framer-motion";
import { BookOpen, GraduationCap, Library, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { LayoutStyle } from "@/contexts/DashboardLayoutContext";

interface DashboardStatsRowProps {
  totalStudents: number;
  totalTeachers: number;
  totalClasses: number;
  libraryCount?: number;
  onLibraryClick?: () => void;
  variant?: LayoutStyle;
  palette?: "default" | "registrar";
}

const defaultStats = [
  {
    key: "students",
    label: "Total Learners",
    tint: "text-primary",
    shell: "from-primary/12 via-background to-background",
    iconBg: "bg-primary/12 text-primary",
    icon: Users,
  },
  {
    key: "teachers",
    label: "Teachers",
    tint: "text-hrms-success",
    shell: "from-hrms-success/12 via-background to-background",
    iconBg: "bg-hrms-success/12 text-hrms-success",
    icon: GraduationCap,
  },
  {
    key: "classes",
    label: "Grade Levels",
    tint: "text-warning",
    shell: "from-warning/14 via-background to-background",
    iconBg: "bg-warning/14 text-warning",
    icon: BookOpen,
  },
  {
    key: "library",
    label: "Library Items",
    tint: "text-info",
    shell: "from-info/12 via-background to-background",
    iconBg: "bg-info/12 text-info",
    icon: Library,
  },
];

const registrarStats = [
  {
    key: "students",
    label: "Total Learners",
    tint: "text-[hsl(var(--getyn-teal))]",
    shell: "from-[hsl(var(--getyn-teal)/0.18)] via-card to-card",
    iconBg: "bg-[hsl(var(--getyn-teal)/0.14)] text-[hsl(var(--getyn-teal))]",
    accent: "bg-[hsl(var(--getyn-teal))]",
    icon: Users,
  },
  {
    key: "teachers",
    label: "Teachers",
    tint: "text-[hsl(var(--getyn-blue))]",
    shell: "from-[hsl(var(--getyn-blue)/0.16)] via-card to-card",
    iconBg: "bg-[hsl(var(--getyn-blue)/0.13)] text-[hsl(var(--getyn-blue))]",
    accent: "bg-[hsl(var(--getyn-blue))]",
    icon: GraduationCap,
  },
  {
    key: "classes",
    label: "Grade Levels",
    tint: "text-[hsl(var(--getyn-orange))]",
    shell: "from-[hsl(var(--getyn-orange)/0.16)] via-card to-card",
    iconBg: "bg-[hsl(var(--getyn-orange)/0.13)] text-[hsl(var(--getyn-orange))]",
    accent: "bg-[hsl(var(--getyn-orange))]",
    icon: BookOpen,
  },
  {
    key: "library",
    label: "Library Items",
    tint: "text-[hsl(var(--getyn-purple))]",
    shell: "from-[hsl(var(--getyn-purple)/0.16)] via-card to-card",
    iconBg: "bg-[hsl(var(--getyn-purple)/0.13)] text-[hsl(var(--getyn-purple))]",
    accent: "bg-[hsl(var(--getyn-purple))]",
    icon: Library,
  },
];

export const DashboardStatsRow = ({
  totalStudents,
  totalTeachers,
  totalClasses,
  libraryCount = 0,
  onLibraryClick,
  palette = "default",
}: DashboardStatsRowProps) => {
  const values: Record<string, number> = {
    students: totalStudents,
    teachers: totalTeachers,
    classes: totalClasses,
    library: libraryCount,
  };
  const stats = palette === "registrar" ? registrarStats : defaultStats;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        const isInteractive = stat.key === "library" && onLibraryClick;

        return (
          <motion.button
            key={stat.key}
            type="button"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            onClick={isInteractive ? onLibraryClick : undefined}
            className={cn(
              "relative overflow-hidden rounded-lg border bg-gradient-to-br p-5 text-left shadow-card transition-all duration-500",
              stat.shell,
              palette === "registrar" && "border-border/70 hover:-translate-y-1",
              isInteractive ? "hover:scale-[1.02] hover:shadow-lg" : "cursor-default",
            )}
          >
            {"accent" in stat && (
              <span className={cn("absolute inset-x-0 top-0 h-1", stat.accent)} />
            )}
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="micro-label">{stat.label}</p>
                <p className="tabular mt-3 text-3xl font-bold tracking-tight text-foreground">{values[stat.key]}</p>
              </div>
              <div className={cn("rounded-2xl p-2.5", stat.iconBg)}>
                <Icon className="h-5 w-5" />
              </div>
            </div>
            <p className={cn("mt-4 text-xs font-medium", stat.tint)}>
              {stat.key === "library" ? "Browse learning resources" : "Updated from live records"}
            </p>
          </motion.button>
        );
      })}
    </div>
  );
};
