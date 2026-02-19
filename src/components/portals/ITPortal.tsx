import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { Users, Shield, Server, HardDrive, Settings, FileText, Monitor, UserCog } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface ITPortalProps {
  onNavigate: (tab: string) => void;
}

export const ITPortal = ({ onNavigate }: ITPortalProps) => {
  const { data: userCount = 0 } = useQuery({
    queryKey: ['it-total-users'],
    queryFn: async () => {
      const { count } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
      return count || 0;
    },
  });

  const { data: ticketCount = 0 } = useQuery({
    queryKey: ['it-open-tickets'],
    queryFn: async () => {
      const { count } = await supabase.from('helpdesk_tickets').select('*', { count: 'exact', head: true }).in('status', ['open', 'in_progress']);
      return count || 0;
    },
  });

  const statsCards = [
    { title: 'Total Users', value: userCount, icon: Users, color: 'from-cyan-500 to-blue-500' },
    { title: 'Open Tickets', value: ticketCount, icon: Shield, color: 'from-amber-500 to-orange-500' },
    { title: 'System Health', value: 'Online', icon: Server, color: 'from-green-500 to-emerald-500' },
    { title: 'Storage', value: 'Active', icon: HardDrive, color: 'from-purple-500 to-violet-500' },
  ];

  const quickActions = [
    { title: 'User Management', description: 'Manage user roles and permissions', icon: UserCog, tab: 'admin', color: 'bg-cyan-50 dark:bg-cyan-950 border-cyan-200 dark:border-cyan-800' },
    { title: 'Audit Logs', description: 'View system activity logs', icon: FileText, tab: 'admin', color: 'bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800' },
    { title: 'System Tools', description: 'NocoDB, Omada, Tactical RMM', icon: Settings, tab: 'integrations', color: 'bg-purple-50 dark:bg-purple-950 border-purple-200 dark:border-purple-800' },
    { title: 'Helpdesk', description: 'IT support tickets', icon: Monitor, tab: 'helpdesk', color: 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800' },
  ];

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl lg:text-3xl font-bold text-foreground">IT Portal</h1>
        <p className="text-muted-foreground mt-1">System administration and infrastructure management</p>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((card, i) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-card rounded-2xl shadow-card p-4 lg:p-6"
          >
            <div className={`inline-flex p-2 rounded-xl bg-gradient-to-br ${card.color} text-white mb-3`}>
              <card.icon className="h-5 w-5" />
            </div>
            <p className="text-sm text-muted-foreground">{card.title}</p>
            <p className="text-2xl font-bold text-foreground">{card.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {quickActions.map((action, i) => (
          <motion.button
            key={action.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 + i * 0.1 }}
            onClick={() => onNavigate(action.tab)}
            className={`flex items-start gap-4 p-5 rounded-2xl border ${action.color} text-left transition-all hover:scale-[1.02] hover:shadow-md`}
          >
            <action.icon className="h-6 w-6 text-foreground mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-foreground">{action.title}</h3>
              <p className="text-sm text-muted-foreground">{action.description}</p>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
};
