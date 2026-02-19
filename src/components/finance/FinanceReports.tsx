import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend, AreaChart, Area
} from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { useSchool } from '@/contexts/SchoolContext';
import { useQuery } from '@tanstack/react-query';
import { Banknote, TrendingUp, TrendingDown, Users, CircleDollarSign, Percent, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#6366f1', '#8b5cf6', '#06b6d4', '#f97316'];

export const FinanceReports = () => {
  const { selectedSchool } = useSchool();

  const { data: schoolData } = useQuery({
    queryKey: ['school-id', selectedSchool],
    queryFn: async () => {
      const { data } = await supabase.from('schools').select('id, name').eq('code', selectedSchool).maybeSingle();
      return data;
    },
  });

  const { data: reportData } = useQuery({
    queryKey: ['finance-reports-detailed', schoolData?.id],
    queryFn: async () => {
      const [paymentsRes, assessmentsRes, allPaymentsRes] = await Promise.all([
        supabase.from('payments').select('amount, payment_method, payment_date, status, or_number').eq('school_id', schoolData!.id).eq('status', 'verified'),
        supabase.from('student_assessments').select('status, balance, total_amount, net_amount, total_paid, discount_amount, student_id, students(level)').eq('school_id', schoolData!.id),
        supabase.from('payments').select('amount, payment_date, status').eq('school_id', schoolData!.id),
      ]);

      const payments = paymentsRes.data || [];
      const assessments = assessmentsRes.data || [];
      const allPayments = allPaymentsRes.data || [];

      // --- Summary stats ---
      const totalCollected = payments.reduce((s: number, p: any) => s + Number(p.amount), 0);
      const totalOutstanding = assessments.reduce((s: number, a: any) => s + Number(a.balance || 0), 0);
      const totalAssessed = assessments.reduce((s: number, a: any) => s + Number(a.total_amount || 0), 0);
      const totalDiscounts = assessments.reduce((s: number, a: any) => s + Number(a.discount_amount || 0), 0);
      const collectionRate = totalAssessed > 0 ? ((totalCollected / totalAssessed) * 100).toFixed(1) : '0';
      const totalStudents = new Set(assessments.map((a: any) => a.student_id)).size;
      const paidStudents = assessments.filter((a: any) => a.status === 'paid').length;
      const overdueStudents = assessments.filter((a: any) => Number(a.balance || 0) > 0 && a.status !== 'paid').length;

      // --- Collections by method ---
      const byMethod: Record<string, number> = {};
      payments.forEach((p: any) => {
        const method = p.payment_method || 'cash';
        byMethod[method] = (byMethod[method] || 0) + Number(p.amount);
      });
      const methodChart = Object.entries(byMethod).map(([name, value]) => ({ name: name.replace(/_/g, ' '), value }));

      // --- Assessment status breakdown ---
      const statusCount: Record<string, number> = {};
      assessments.forEach((a: any) => {
        statusCount[a.status || 'pending'] = (statusCount[a.status || 'pending'] || 0) + 1;
      });
      const statusChart = Object.entries(statusCount).map(([name, value]) => ({ name, value }));

      // --- Daily collections trend (last 30 days) ---
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const dailyMap: Record<string, number> = {};
      payments.forEach((p: any) => {
        if (p.payment_date) {
          const day = p.payment_date.substring(0, 10);
          dailyMap[day] = (dailyMap[day] || 0) + Number(p.amount);
        }
      });
      const dailyTrend = Object.entries(dailyMap)
        .sort(([a], [b]) => a.localeCompare(b))
        .slice(-30)
        .map(([date, amount]) => ({ date: date.substring(5), amount }));

      // --- Collections by grade level ---
      const byGrade: Record<string, { assessed: number; collected: number; balance: number }> = {};
      assessments.forEach((a: any) => {
        const level = (a.students as any)?.level || 'Unknown';
        if (!byGrade[level]) byGrade[level] = { assessed: 0, collected: 0, balance: 0 };
        byGrade[level].assessed += Number(a.total_amount || 0);
        byGrade[level].collected += Number(a.total_paid || 0);
        byGrade[level].balance += Number(a.balance || 0);
      });
      const gradeChart = Object.entries(byGrade)
        .sort(([a], [b]) => {
          const numA = parseInt(a.replace(/\D/g, '')) || 0;
          const numB = parseInt(b.replace(/\D/g, '')) || 0;
          return numA - numB;
        })
        .map(([grade, data]) => ({ grade, ...data }));

      // --- Payment status breakdown (all payments including voided) ---
      const paymentStatusCount: Record<string, number> = {};
      allPayments.forEach((p: any) => {
        paymentStatusCount[p.status || 'pending'] = (paymentStatusCount[p.status || 'pending'] || 0) + 1;
      });
      const paymentStatusChart = Object.entries(paymentStatusCount).map(([name, value]) => ({ name, value }));

      // --- Cumulative collection over time ---
      let cumulative = 0;
      const cumulativeData = Object.entries(dailyMap)
        .sort(([a], [b]) => a.localeCompare(b))
        .slice(-30)
        .map(([date, amount]) => {
          cumulative += amount;
          return { date: date.substring(5), cumulative };
        });

      return {
        totalCollected, totalOutstanding, totalAssessed, totalDiscounts,
        collectionRate, totalStudents, paidStudents, overdueStudents,
        methodChart, statusChart, dailyTrend, gradeChart,
        paymentStatusChart, cumulativeData,
        transactionCount: payments.length,
      };
    },
    enabled: !!schoolData?.id,
  });

  const stats = [
    { label: 'Total Assessed', value: reportData?.totalAssessed || 0, icon: CircleDollarSign, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: 'Total Collected', value: reportData?.totalCollected || 0, icon: Banknote, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { label: 'Outstanding Balance', value: reportData?.totalOutstanding || 0, icon: TrendingDown, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    { label: 'Total Discounts', value: reportData?.totalDiscounts || 0, icon: Percent, color: 'text-purple-500', bg: 'bg-purple-500/10' },
  ];

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-2">
          <CircleDollarSign className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Finance Reports & Analytics</h1>
        </div>
        <p className="text-muted-foreground">Comprehensive financial overview and insights</p>
      </motion.div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <Card>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${stat.bg}`}>
                    <stat.icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                    <p className={`text-xl font-bold ${stat.color}`}>₱{stat.value.toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4 pb-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10">
              <TrendingUp className="h-5 w-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Collection Rate</p>
              <p className="text-xl font-bold text-foreground">{reportData?.collectionRate || 0}%</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <Users className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Assessed Students</p>
              <p className="text-xl font-bold text-foreground">{reportData?.totalStudents || 0}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10">
              <Banknote className="h-5 w-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Fully Paid</p>
              <p className="text-xl font-bold text-foreground">{reportData?.paidStudents || 0}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-500/10">
              <AlertTriangle className="h-5 w-5 text-red-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">With Balance</p>
              <p className="text-xl font-bold text-foreground">{reportData?.overdueStudents || 0}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1: Daily Trend + Cumulative */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-sm flex items-center gap-2"><TrendingUp className="h-4 w-4" /> Daily Collections Trend</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={reportData?.dailyTrend || []}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip formatter={(v: number) => [`₱${v.toLocaleString()}`, 'Amount']} />
                <Area type="monotone" dataKey="amount" stroke="#10b981" fill="#10b981" fillOpacity={0.15} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Banknote className="h-4 w-4" /> Cumulative Collections</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={reportData?.cumulativeData || []}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip formatter={(v: number) => [`₱${v.toLocaleString()}`, 'Cumulative']} />
                <Line type="monotone" dataKey="cumulative" stroke="#6366f1" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2: By Method + Assessment Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-sm flex items-center gap-2"><CircleDollarSign className="h-4 w-4" /> Collections by Payment Method</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={reportData?.methodChart || []}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip formatter={(v: number) => [`₱${v.toLocaleString()}`, 'Amount']} />
                <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm">Assessment Status Distribution</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={reportData?.statusChart || []} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} innerRadius={50} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {(reportData?.statusChart || []).map((_: any, i: number) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 3: Grade-level breakdown */}
      <Card>
        <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Users className="h-4 w-4" /> Collections vs Assessed by Grade Level</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={reportData?.gradeChart || []}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="grade" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip formatter={(v: number) => `₱${v.toLocaleString()}`} />
              <Legend />
              <Bar dataKey="assessed" name="Assessed" fill="#6366f1" radius={[4, 4, 0, 0]} />
              <Bar dataKey="collected" name="Collected" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="balance" name="Balance" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Payment Status Pie */}
      <Card>
        <CardHeader><CardTitle className="text-sm">All Payment Transactions by Status</CardTitle></CardHeader>
        <CardContent>
          <div className="flex items-center justify-center">
            <ResponsiveContainer width="50%" height={250}>
              <PieChart>
                <Pie data={reportData?.paymentStatusChart || []} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                  {(reportData?.paymentStatusChart || []).map((_: any, i: number) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-3 mt-2">
            <Badge variant="outline" className="text-xs">Total Transactions: {reportData?.transactionCount || 0}</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
