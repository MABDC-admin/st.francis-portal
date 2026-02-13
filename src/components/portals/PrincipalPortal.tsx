import { motion } from 'framer-motion';
import { useStudents } from '@/hooks/useStudents';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useDashboardLayout } from '@/contexts/DashboardLayoutContext';
import { cn } from '@/lib/utils';
import { Users, GraduationCap, BookOpen, BarChart3, Calendar, MessageSquare, Shield, FileText } from 'lucide-react';

interface PrincipalPortalProps {
  onNavigate: (tab: string) => void;
}

export const PrincipalPortal = ({ onNavigate }: PrincipalPortalProps) => {
  const { data: students = [] } = useStudents();
  const { layoutStyle } = useDashboardLayout();

  const { data: teachersCount = 0 } = useQuery({
    queryKey: ['teachers-count'],
    queryFn: async () => {
      const { count } = await supabase
        .from('teachers')
        .select('*', { count: 'exact', head: true });
      return count || 0;
    },
  });

  const { data: eventsCount = 0 } = useQuery({
    queryKey: ['events-count'],
    queryFn: async () => {
      const { count } = await supabase
        .from('exam_schedules')
        .select('*', { count: 'exact', head: true });
      return count || 0;
    },
  });

  const totalStudents = students.length;
  const levels = [...new Set(students.map(s => s.level))].length;

  const stats = [
    { label: 'Total Learners', value: totalStudents, icon: Users, color: 'from-blue-500 to-blue-600' },
    { label: 'Teachers', value: teachersCount, icon: GraduationCap, color: 'from-green-500 to-green-600' },
    { label: 'Grade Levels', value: levels, icon: BookOpen, color: 'from-purple-500 to-purple-600' },
    { label: 'Scheduled Exams', value: eventsCount, icon: Calendar, color: 'from-orange-500 to-orange-600' },
  ];

  const quickActions = [
    { label: 'View Learners', icon: Users, tab: 'students', description: 'Browse all student records' },
    { label: 'Grades Overview', icon: BarChart3, tab: 'grades', description: 'Review academic performance' },
    { label: 'Reports', icon: FileText, tab: 'reports', description: 'Generate and view reports' },
    { label: 'Teachers', icon: GraduationCap, tab: 'teachers', description: 'View teacher directory' },
    { label: 'Events', icon: Calendar, tab: 'events', description: 'School calendar and events' },
    { label: 'Messages', icon: MessageSquare, tab: 'messages', description: 'Communication hub' },
    { label: 'Library', icon: BookOpen, tab: 'library', description: 'Digital library resources' },
    { label: 'Helpdesk', icon: Shield, tab: 'helpdesk', description: 'IT support tickets' },
  ];

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Principal's Dashboard</h1>
        <p className="text-muted-foreground mt-1">Administrative oversight and school management</p>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-card rounded-2xl shadow-card p-4 lg:p-6"
          >
            <div className="flex items-center gap-3">
              <div className={cn("p-2 rounded-xl bg-gradient-to-br text-white", stat.color)}>
                <stat.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-card rounded-2xl shadow-card p-4 lg:p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {quickActions.map((action, i) => (
            <motion.button
              key={action.tab}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => onNavigate(action.tab)}
              className="flex flex-col items-center gap-2 p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors text-center group"
            >
              <action.icon className="h-6 w-6 text-primary group-hover:scale-110 transition-transform" />
              <span className="text-sm font-medium text-foreground">{action.label}</span>
              <span className="text-xs text-muted-foreground hidden lg:block">{action.description}</span>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
};
