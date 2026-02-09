import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { FeeTemplateManager } from './FeeTemplateManager';
import { supabase } from '@/integrations/supabase/client';
import { useSchool } from '@/contexts/SchoolContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

const CATEGORIES = ['tuition', 'misc', 'books', 'uniform', 'lab', 'id', 'other'];

export const FeeSetup = () => {
  const { selectedSchool } = useSchool();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [form, setForm] = useState({ name: '', description: '', category: 'other', amount: '', is_mandatory: true, is_recurring: false });

  const { data: schoolData } = useQuery({
    queryKey: ['school-id', selectedSchool],
    queryFn: async () => {
      const { data } = await supabase.from('schools').select('id').eq('code', selectedSchool).single();
      return data;
    },
  });

  const { data: fees = [], isLoading } = useQuery({
    queryKey: ['fee-catalog', schoolData?.id],
    queryFn: async () => {
      const { data } = await supabase.from('fee_catalog').select('*').eq('school_id', schoolData!.id).order('category');
      return data || [];
    },
    enabled: !!schoolData?.id,
  });

  const saveFee = useMutation({
    mutationFn: async (fee: any) => {
      if (editingItem) {
        const { error } = await supabase.from('fee_catalog').update(fee).eq('id', editingItem.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('fee_catalog').insert({ ...fee, school_id: schoolData!.id });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fee-catalog'] });
      toast.success(editingItem ? 'Fee updated' : 'Fee created');
      resetForm();
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteFee = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('fee_catalog').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fee-catalog'] });
      toast.success('Fee deleted');
    },
  });

  const resetForm = () => {
    setForm({ name: '', description: '', category: 'other', amount: '', is_mandatory: true, is_recurring: false });
    setEditingItem(null);
    setIsOpen(false);
  };

  const handleEdit = (fee: any) => {
    setEditingItem(fee);
    setForm({ name: fee.name, description: fee.description || '', category: fee.category, amount: String(fee.amount), is_mandatory: fee.is_mandatory, is_recurring: fee.is_recurring });
    setIsOpen(true);
  };

  const handleSubmit = () => {
    if (!form.name || !form.amount) return toast.error('Name and amount are required');
    saveFee.mutate({ name: form.name, description: form.description, category: form.category, amount: Number(form.amount), is_mandatory: form.is_mandatory, is_recurring: form.is_recurring });
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Fee Setup</h1>
          <p className="text-muted-foreground">Manage fee catalog items</p>
        </div>
        <Dialog open={isOpen} onOpenChange={(v) => { if (!v) resetForm(); setIsOpen(v); }}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Add Fee</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editingItem ? 'Edit Fee' : 'Add Fee'}</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Name</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
              <div><Label>Description</Label><Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></div>
              <div><Label>Category</Label>
                <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Amount (₱)</Label><Input type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} /></div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2"><Switch checked={form.is_mandatory} onCheckedChange={v => setForm(f => ({ ...f, is_mandatory: v }))} /><Label>Mandatory</Label></div>
                <div className="flex items-center gap-2"><Switch checked={form.is_recurring} onCheckedChange={v => setForm(f => ({ ...f, is_recurring: v }))} /><Label>Recurring</Label></div>
              </div>
              <Button onClick={handleSubmit} className="w-full" disabled={saveFee.isPending}>{editingItem ? 'Update' : 'Create'}</Button>
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
                <TableHead>Category</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Mandatory</TableHead>
                <TableHead>Recurring</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fees.map((fee: any) => (
                <TableRow key={fee.id}>
                  <TableCell className="font-medium">{fee.name}</TableCell>
                  <TableCell className="capitalize">{fee.category}</TableCell>
                  <TableCell>₱{Number(fee.amount).toLocaleString()}</TableCell>
                  <TableCell>{fee.is_mandatory ? 'Yes' : 'No'}</TableCell>
                  <TableCell>{fee.is_recurring ? 'Yes' : 'No'}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(fee)}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => deleteFee.mutate(fee.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {fees.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No fee items yet. Click "Add Fee" to create one.</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <FeeTemplateManager />
    </div>
  );
};
