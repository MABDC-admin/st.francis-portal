import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { useSchool } from '@/contexts/SchoolContext';
import { useQuery } from '@tanstack/react-query';

const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#6366f1', '#8b5cf6'];

export const FinanceReports = () => {
  const { selectedSchool } = useSchool();

  const { data: schoolData } = useQuery({
    queryKey: ['school-id', selectedSchool],
    queryFn: async () => {
      const { data } = await supabase.from('schools').select('id').eq('code', selectedSchool).single();
      return data;
    },
  });

  const { data: reportData } = useQuery({
    queryKey: ['finance-reports', schoolData?.id],
    queryFn: async () => {
      const [paymentsRes, assessmentsRes] = await Promise.all([
        supabase.from('payments').select('amount, payment_method, payment_date, status').eq('school_id', schoolData!.id).eq('status', 'verified'),
        supabase.from('student_assessments').select('status, balance').eq('school_id', schoolData!.id),
      ]);

      const payments = paymentsRes.data || [];
      const assessments = assessmentsRes.data || [];

      // Collections by method
      const byMethod: Record<string, number> = {};
      payments.forEach((p: any) => {
        const method = p.payment_method || 'cash';
        byMethod[method] = (byMethod[method] || 0) + Number(p.amount);
      });

      const methodChart = Object.entries(byMethod).map(([name, value]) => ({ name: name.replace('_', ' '), value }));

      // Status breakdown
      const statusCount: Record<string, number> = {};
      assessments.forEach((a: any) => {
        statusCount[a.status] = (statusCount[a.status] || 0) + 1;
      });
      const statusChart = Object.entries(statusCount).map(([name, value]) => ({ name, value }));

      const totalCollected = payments.reduce((s: number, p: any) => s + Number(p.amount), 0);
      const totalOutstanding = assessments.reduce((s: number, a: any) => s + Number(a.balance || 0), 0);

      return { methodChart, statusChart, totalCollected, totalOutstanding };
    },
    enabled: !!schoolData?.id,
  });

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-foreground">Finance Reports</h1>
        <p className="text-muted-foreground">Collections and analytics overview</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle>Total Collected</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold text-emerald-500">₱{(reportData?.totalCollected || 0).toLocaleString()}</p></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Total Outstanding</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold text-amber-500">₱{(reportData?.totalOutstanding || 0).toLocaleString()}</p></CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Collections by Payment Method</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={reportData?.methodChart || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(v: number) => `₱${v.toLocaleString()}`} />
                <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Assessment Status</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={reportData?.statusChart || []} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                  {(reportData?.statusChart || []).map((_: any, i: number) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
