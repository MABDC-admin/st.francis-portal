import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DollarSign, Users, CheckCircle, Clock, CreditCard, Search, FileText } from 'lucide-react';
import { useSchool } from '@/contexts/SchoolContext';
import { useAcademicYear } from '@/contexts/AcademicYearContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

interface FinancePortalProps {
  onNavigate: (tab: string) => void;
}

export const FinancePortal = ({ onNavigate }: FinancePortalProps) => {
  const { selectedSchool } = useSchool();
  const { selectedYearId } = useAcademicYear();

  const { data: stats } = useQuery({
    queryKey: ['finance-stats', selectedSchool, selectedYearId],
    queryFn: async () => {
      const schoolQuery = supabase.from('schools').select('id').eq('code', selectedSchool).single();
      const { data: school } = await schoolQuery;
      if (!school) return { collections: 0, outstanding: 0, cleared: 0, pending: 0 };

      const [paymentsRes, assessmentsRes, clearanceRes] = await Promise.all([
        supabase.from('payments').select('amount').eq('school_id', school.id).eq('status', 'verified')
          .then(r => r.data || []),
        supabase.from('student_assessments').select('balance, status').eq('school_id', school.id),
        supabase.from('finance_clearance').select('is_cleared').eq('school_id', school.id),
      ]);

      const totalCollections = paymentsRes.reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0);
      const assessments = assessmentsRes.data || [];
      const outstanding = assessments.reduce((sum: number, a: any) => sum + Number(a.balance || 0), 0);
      const clearances = clearanceRes.data || [];
      const clearedCount = clearances.filter((c: any) => c.is_cleared).length;
      const pendingPayments = assessments.filter((a: any) => a.status === 'pending').length;

      return { collections: totalCollections, outstanding, cleared: clearedCount, pending: pendingPayments };
    },
    enabled: !!selectedSchool,
  });

  const statCards = [
    { title: 'Total Collections', value: `₱${(stats?.collections || 0).toLocaleString()}`, icon: DollarSign, color: 'text-emerald-500' },
    { title: 'Outstanding Balance', value: `₱${(stats?.outstanding || 0).toLocaleString()}`, icon: Clock, color: 'text-amber-500' },
    { title: 'Cleared Students', value: stats?.cleared || 0, icon: CheckCircle, color: 'text-green-500' },
    { title: 'Pending Assessments', value: stats?.pending || 0, icon: Users, color: 'text-blue-500' },
  ];

  const quickActions = [
    { label: 'Accept Payment', icon: CreditCard, tab: 'cashier' },
    { label: 'View Learners', icon: Users, tab: 'finance-learners' },
    { label: 'Fee Setup', icon: FileText, tab: 'fee-setup' },
    { label: 'Year-End Close', icon: Clock, tab: 'year-end-close' },
    { label: 'Reports', icon: FileText, tab: 'finance-reports' },
  ];

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Finance Portal</h1>
        <p className="text-muted-foreground mt-1">School finance management dashboard</p>
      </motion.div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, i) => (
          <motion.div key={stat.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <stat.icon className={`h-8 w-8 ${stat.color}`} />
                  <div>
                    <p className="text-xs text-muted-foreground">{stat.title}</p>
                    <p className="text-xl font-bold">{stat.value}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle>Quick Actions</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {quickActions.map(action => (
              <Button key={action.tab} variant="outline" className="h-20 flex-col gap-2" onClick={() => onNavigate(action.tab)}>
                <action.icon className="h-6 w-6" />
                <span className="text-xs">{action.label}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
