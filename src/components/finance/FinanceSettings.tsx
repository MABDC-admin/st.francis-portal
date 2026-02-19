import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Save } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useSchool } from '@/contexts/SchoolContext';
import { useAcademicYear } from '@/contexts/AcademicYearContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export const FinanceSettings = () => {
  const { selectedSchool } = useSchool();
  const { selectedYearId } = useAcademicYear();
  const queryClient = useQueryClient();

  const { data: schoolData } = useQuery({
    queryKey: ['school-id', selectedSchool],
    queryFn: async () => {
      const { data } = await supabase.from('schools').select('id').eq('code', selectedSchool).single();
      return data;
    },
  });

  const { data: settings } = useQuery({
    queryKey: ['finance-settings', schoolData?.id, selectedYearId],
    queryFn: async () => {
      const { data } = await supabase.from('finance_settings').select('*').eq('school_id', schoolData!.id).maybeSingle();
      return data;
    },
    enabled: !!schoolData?.id,
  });

  const [form, setForm] = useState({
    default_payment_terms: 'cash',
    late_fee_enabled: false,
    late_fee_type: 'fixed',
    late_fee_amount: '0',
    or_number_format: 'OR-{YYYY}-{SEQ}',
    or_next_number: '1',
    ar_number_format: 'AR-{YYYY}-{SEQ}',
    ar_next_number: '1',
    convenience_fee_mode: 'absorb',
    convenience_fee_amount: '0',
    clearance_threshold: '0',
    auto_clearance: false,
  });

  useEffect(() => {
    if (settings) {
      setForm({
        default_payment_terms: settings.default_payment_terms || 'cash',
        late_fee_enabled: settings.late_fee_enabled || false,
        late_fee_type: settings.late_fee_type || 'fixed',
        late_fee_amount: String(settings.late_fee_amount || 0),
        or_number_format: settings.or_number_format || 'OR-{YYYY}-{SEQ}',
        or_next_number: String(settings.or_next_number || 1),
        ar_number_format: settings.ar_number_format || 'AR-{YYYY}-{SEQ}',
        ar_next_number: String(settings.ar_next_number || 1),
        convenience_fee_mode: settings.convenience_fee_mode || 'absorb',
        convenience_fee_amount: String(settings.convenience_fee_amount || 0),
        clearance_threshold: String(settings.clearance_threshold || 0),
        auto_clearance: settings.auto_clearance || false,
      });
    }
  }, [settings]);

  const saveSettings = useMutation({
    mutationFn: async () => {
      const payload = {
        school_id: schoolData!.id,
        academic_year_id: selectedYearId,
        default_payment_terms: form.default_payment_terms,
        late_fee_enabled: form.late_fee_enabled,
        late_fee_type: form.late_fee_type,
        late_fee_amount: Number(form.late_fee_amount),
        or_number_format: form.or_number_format,
        or_next_number: Number(form.or_next_number),
        ar_number_format: form.ar_number_format,
        ar_next_number: Number(form.ar_next_number),
        convenience_fee_mode: form.convenience_fee_mode,
        convenience_fee_amount: Number(form.convenience_fee_amount),
        clearance_threshold: Number(form.clearance_threshold),
        auto_clearance: form.auto_clearance,
      };

      if (settings?.id) {
        const { error } = await supabase.from('finance_settings').update(payload).eq('id', settings.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('finance_settings').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance-settings'] });
      toast.success('Settings saved');
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Finance Settings</h1>
          <p className="text-muted-foreground">Configure payment terms and policies</p>
        </div>
        <Button onClick={() => saveSettings.mutate()} disabled={saveSettings.isPending}><Save className="h-4 w-4 mr-2" />Save Settings</Button>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Payment Terms</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div><Label>Default Terms</Label>
              <Select value={form.default_payment_terms} onValueChange={v => setForm(f => ({ ...f, default_payment_terms: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="installment">Installment</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2"><Switch checked={form.late_fee_enabled} onCheckedChange={v => setForm(f => ({ ...f, late_fee_enabled: v }))} /><Label>Enable Late Fees</Label></div>
            {form.late_fee_enabled && (
              <>
                <div><Label>Late Fee Type</Label>
                  <Select value={form.late_fee_type} onValueChange={v => setForm(f => ({ ...f, late_fee_type: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fixed">Fixed</SelectItem>
                      <SelectItem value="percentage">Percentage</SelectItem>
                      <SelectItem value="per_day">Per Day</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Late Fee Amount</Label><Input type="number" value={form.late_fee_amount} onChange={e => setForm(f => ({ ...f, late_fee_amount: e.target.value }))} /></div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Receipt Numbering</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div><Label>OR Format</Label><Input value={form.or_number_format} onChange={e => setForm(f => ({ ...f, or_number_format: e.target.value }))} /></div>
            <div><Label>Next OR Number</Label><Input type="number" value={form.or_next_number} onChange={e => setForm(f => ({ ...f, or_next_number: e.target.value }))} /></div>
            <div><Label>AR Format</Label><Input value={form.ar_number_format} onChange={e => setForm(f => ({ ...f, ar_number_format: e.target.value }))} /></div>
            <div><Label>Next AR Number</Label><Input type="number" value={form.ar_next_number} onChange={e => setForm(f => ({ ...f, ar_next_number: e.target.value }))} /></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Convenience Fees</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div><Label>Fee Mode</Label>
              <Select value={form.convenience_fee_mode} onValueChange={v => setForm(f => ({ ...f, convenience_fee_mode: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="absorb">Absorb</SelectItem>
                  <SelectItem value="pass">Pass to Payer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Fee Amount (₱)</Label><Input type="number" value={form.convenience_fee_amount} onChange={e => setForm(f => ({ ...f, convenience_fee_amount: e.target.value }))} /></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Clearance</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div><Label>Clearance Threshold (₱)</Label><Input type="number" value={form.clearance_threshold} onChange={e => setForm(f => ({ ...f, clearance_threshold: e.target.value }))} /></div>
            <div className="flex items-center gap-2"><Switch checked={form.auto_clearance} onCheckedChange={v => setForm(f => ({ ...f, auto_clearance: v }))} /><Label>Auto-clear when below threshold</Label></div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
