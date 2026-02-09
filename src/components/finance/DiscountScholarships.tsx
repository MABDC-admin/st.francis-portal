import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useSchool } from '@/contexts/SchoolContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export const DiscountScholarships = () => {
  const { selectedSchool } = useSchool();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [form, setForm] = useState({ name: '', type: 'percentage', value: '', applies_to: 'all', stackable: false, requires_approval: false });

  const { data: schoolData } = useQuery({
    queryKey: ['school-id', selectedSchool],
    queryFn: async () => {
      const { data } = await supabase.from('schools').select('id').eq('code', selectedSchool).single();
      return data;
    },
  });

  const { data: discounts = [] } = useQuery({
    queryKey: ['discounts', schoolData?.id],
    queryFn: async () => {
      const { data } = await supabase.from('discounts').select('*').eq('school_id', schoolData!.id).order('name');
      return data || [];
    },
    enabled: !!schoolData?.id,
  });

  const saveDiscount = useMutation({
    mutationFn: async (d: any) => {
      if (editingItem) {
        const { error } = await supabase.from('discounts').update(d).eq('id', editingItem.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('discounts').insert({ ...d, school_id: schoolData!.id });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discounts'] });
      toast.success(editingItem ? 'Discount updated' : 'Discount created');
      resetForm();
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteDiscount = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('discounts').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discounts'] });
      toast.success('Discount deleted');
    },
  });

  const resetForm = () => {
    setForm({ name: '', type: 'percentage', value: '', applies_to: 'all', stackable: false, requires_approval: false });
    setEditingItem(null);
    setIsOpen(false);
  };

  const handleEdit = (d: any) => {
    setEditingItem(d);
    setForm({ name: d.name, type: d.type, value: String(d.value), applies_to: d.applies_to, stackable: d.stackable, requires_approval: d.requires_approval });
    setIsOpen(true);
  };

  const handleSubmit = () => {
    if (!form.name || !form.value) return toast.error('Name and value are required');
    saveDiscount.mutate({ name: form.name, type: form.type, value: Number(form.value), applies_to: form.applies_to, stackable: form.stackable, requires_approval: form.requires_approval });
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Discounts & Scholarships</h1>
          <p className="text-muted-foreground">Manage discount and scholarship types</p>
        </div>
        <Dialog open={isOpen} onOpenChange={(v) => { if (!v) resetForm(); setIsOpen(v); }}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" />Add Discount</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editingItem ? 'Edit Discount' : 'Add Discount'}</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Name</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
              <div><Label>Type</Label>
                <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage</SelectItem>
                    <SelectItem value="fixed">Fixed Amount</SelectItem>
                    <SelectItem value="coverage">Coverage</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Value {form.type === 'percentage' ? '(%)' : '(₱)'}</Label><Input type="number" value={form.value} onChange={e => setForm(f => ({ ...f, value: e.target.value }))} /></div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2"><Switch checked={form.stackable} onCheckedChange={v => setForm(f => ({ ...f, stackable: v }))} /><Label>Stackable</Label></div>
                <div className="flex items-center gap-2"><Switch checked={form.requires_approval} onCheckedChange={v => setForm(f => ({ ...f, requires_approval: v }))} /><Label>Requires Approval</Label></div>
              </div>
              <Button onClick={handleSubmit} className="w-full" disabled={saveDiscount.isPending}>{editingItem ? 'Update' : 'Create'}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </motion.div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Applies To</TableHead>
                <TableHead>Stackable</TableHead>
                <TableHead>Approval</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {discounts.map((d: any) => (
                <TableRow key={d.id}>
                  <TableCell className="font-medium">{d.name}</TableCell>
                  <TableCell className="capitalize">{d.type}</TableCell>
                  <TableCell>{d.type === 'percentage' ? `${d.value}%` : `₱${Number(d.value).toLocaleString()}`}</TableCell>
                  <TableCell className="capitalize">{d.applies_to}</TableCell>
                  <TableCell>{d.stackable ? 'Yes' : 'No'}</TableCell>
                  <TableCell>{d.requires_approval ? 'Required' : 'No'}</TableCell>
                  <TableCell><Badge variant={d.is_active ? 'default' : 'secondary'}>{d.is_active ? 'Active' : 'Inactive'}</Badge></TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(d)}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => deleteDiscount.mutate(d.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {discounts.length === 0 && <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">No discounts configured</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
