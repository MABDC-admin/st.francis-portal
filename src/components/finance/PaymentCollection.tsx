import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Search, CreditCard } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useSchool } from '@/contexts/SchoolContext';
import { useAcademicYear } from '@/contexts/AcademicYearContext';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

const PAYMENT_METHODS = ['cash', 'bank_deposit', 'online_transfer', 'e_wallet', 'card'];

export const PaymentCollection = () => {
  const { selectedSchool } = useSchool();
  const { selectedYearId } = useAcademicYear();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ student_id: '', assessment_id: '', amount: '', payment_method: 'cash', reference_number: '', notes: '' });

  const { data: schoolData } = useQuery({
    queryKey: ['school-id', selectedSchool],
    queryFn: async () => {
      const { data } = await supabase.from('schools').select('id').eq('code', selectedSchool).single();
      return data;
    },
  });

  const { data: recentPayments = [] } = useQuery({
    queryKey: ['recent-payments', schoolData?.id],
    queryFn: async () => {
      const { data } = await supabase.from('payments').select('*, students(student_name, lrn)').eq('school_id', schoolData!.id).order('created_at', { ascending: false }).limit(20);
      return data || [];
    },
    enabled: !!schoolData?.id,
  });

  const recordPayment = useMutation({
    mutationFn: async (payment: any) => {
      const { error } = await supabase.from('payments').insert({
        ...payment,
        school_id: schoolData!.id,
        academic_year_id: selectedYearId,
        received_by: user?.id,
        status: 'verified',
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recent-payments'] });
      toast.success('Payment recorded');
      setForm({ student_id: '', assessment_id: '', amount: '', payment_method: 'cash', reference_number: '', notes: '' });
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-foreground">Cashier Dashboard</h1>
        <p className="text-muted-foreground">Accept and record payments</p>
      </motion.div>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><CreditCard className="h-5 w-5" />Recent Payments</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentPayments.map((p: any) => (
                <TableRow key={p.id}>
                  <TableCell>{p.students?.student_name || 'N/A'}</TableCell>
                  <TableCell>₱{Number(p.amount).toLocaleString()}</TableCell>
                  <TableCell className="capitalize">{p.payment_method?.replace('_', ' ')}</TableCell>
                  <TableCell>{p.reference_number || '—'}</TableCell>
                  <TableCell><Badge variant={p.status === 'verified' ? 'default' : 'secondary'}>{p.status}</Badge></TableCell>
                  <TableCell>{new Date(p.payment_date).toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
              {recentPayments.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No recent payments</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
