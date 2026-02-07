import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, Calendar, User } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';

interface LISIncidentsProps {
  studentId: string;
}

const categoryColors: Record<string, string> = {
  behavioral: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  academic: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  attendance: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  bullying: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  positive: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
};

export const LISIncidents = ({ studentId }: LISIncidentsProps) => {
  const { data: incidents = [], isLoading } = useQuery({
    queryKey: ['lis-incidents', studentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('student_incidents')
        .select('*')
        .eq('student_id', studentId)
        .order('incident_date', { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2].map(i => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
    );
  }

  if (incidents.length === 0) {
    return (
      <Card className="rounded-xl border-border">
        <CardContent className="p-8 text-center">
          <AlertTriangle className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">No incidents recorded.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {incidents.map((incident: any) => (
        <Card key={incident.id} className="rounded-xl border-border">
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold text-sm text-foreground">{incident.title}</h4>
                  <Badge className={`text-[10px] ${categoryColors[incident.category] || 'bg-muted text-muted-foreground'}`}>
                    {incident.category}
                  </Badge>
                  {incident.status && (
                    <Badge variant="outline" className="text-[10px]">{incident.status}</Badge>
                  )}
                </div>
                {incident.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2">{incident.description}</p>
                )}
                {incident.action_taken && (
                  <p className="text-xs text-muted-foreground mt-1">
                    <span className="font-medium">Action:</span> {incident.action_taken}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                <Calendar className="h-3 w-3" />
                {new Date(incident.incident_date).toLocaleDateString()}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
