import { format } from "date-fns";
import { Mail, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useSchool } from "@/contexts/SchoolContext";
import { useSchoolSettings } from "@/hooks/useSchoolSettings";

interface DashboardHeaderProps {
  onNavigateToMessages?: () => void;
}

export const DashboardHeader = ({ onNavigateToMessages }: DashboardHeaderProps) => {
  const { selectedSchool } = useSchool();
  const { data: schoolSettings } = useSchoolSettings(selectedSchool);

  return (
    <div className="page-surface overflow-hidden">
      <div className="flex flex-col gap-5 p-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-3">
          <Badge variant="outline" className="border-primary/12 bg-accent text-accent-foreground">
            <Sparkles className="mr-1 h-3.5 w-3.5" />
            Live school operations
          </Badge>
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              {schoolSettings?.name || "School Operations Dashboard"}
            </h1>
            <p className="text-sm text-muted-foreground">
              Monitor learner records, academic activity, and the next actions across the portal.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="rounded-full border border-border bg-muted/50 px-4 py-2 text-xs text-muted-foreground">
            <span className="micro-label mr-2">Today</span>
            <span className="tabular text-foreground">{format(new Date(), "EEEE, MMMM d")}</span>
          </div>
          {onNavigateToMessages && (
            <Button variant="outline" onClick={onNavigateToMessages}>
              <Mail className="h-4 w-4" />
              Messages
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
