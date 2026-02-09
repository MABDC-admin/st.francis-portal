import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useSchool } from '@/contexts/SchoolContext';
import { useQuery } from '@tanstack/react-query';

export const PaymentPlans = () => {
  const { selectedSchool } = useSchool();

  const { data: schoolData } = useQuery({
    queryKey: ['school-id', selectedSchool],
    queryFn: async () => {
      const { data } = await supabase.from('schools').select('id').eq('code', selectedSchool).single();
      return data;
    },
  });

  const { data: plans = [] } = useQuery({
    queryKey: ['payment-plans', schoolData?.id],
    queryFn: async () => {
      const { data } = await supabase.from('payment_plans').select('*, students(student_name, lrn)').eq('school_id', schoolData!.id).order('created_at', { ascending: false });
      return data || [];
    },
    enabled: !!schoolData?.id,
  });

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-foreground">Payment Plans</h1>
        <p className="text-muted-foreground">Manage installment schedules</p>
      </motion.div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Plan Type</TableHead>
                <TableHead>Installments</TableHead>
                <TableHead>Grace Period</TableHead>
                <TableHead>Late Fee</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {plans.map((p: any) => (
                <TableRow key={p.id}>
                  <TableCell>{p.students?.student_name || 'N/A'}</TableCell>
                  <TableCell className="capitalize">{p.plan_type}</TableCell>
                  <TableCell>{p.total_installments}</TableCell>
                  <TableCell>{p.grace_period_days} days</TableCell>
                  <TableCell>₱{Number(p.late_fee_amount).toLocaleString()} ({p.late_fee_type})</TableCell>
                </TableRow>
              ))}
              {plans.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No payment plans found</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
