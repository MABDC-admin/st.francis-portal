import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Plus, Pencil, Trash2, Package } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useSchool } from '@/contexts/SchoolContext';
import { useAcademicYear } from '@/contexts/AcademicYearContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

const GRADE_LEVELS = [
  'Kinder', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6',
  'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12',
];

interface TemplateFormItem {
  fee_catalog_id: string;
  name: string;
  amount: number;
  is_mandatory: boolean;
  selected: boolean;
}

export const FeeTemplateManager = () => {
  const { selectedSchool } = useSchool();
  const { selectedYearId } = useAcademicYear();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<any>(null);
  const [form, setForm] = useState({ name: '', grade_level: '', strand: '' });
  const [templateItems, setTemplateItems] = useState<TemplateFormItem[]>([]);

  const { data: schoolData } = useQuery({
    queryKey: ['school-id', selectedSchool],
    queryFn: async () => {
      const { data } = await supabase.from('schools').select('id').eq('code', selectedSchool).single();
      return data;
    },
  });

  const { data: fees = [] } = useQuery({
    queryKey: ['fee-catalog', schoolData?.id],
    queryFn: async () => {
      const { data } = await supabase.from('fee_catalog').select('*').eq('school_id', schoolData!.id).eq('is_active', true).order('category');
      return data || [];
    },
    enabled: !!schoolData?.id,
  });

  const { data: templates = [] } = useQuery({
    queryKey: ['fee-templates', schoolData?.id, selectedYearId],
    queryFn: async () => {
      let query = supabase.from('fee_templates').select('*').eq('school_id', schoolData!.id);
      if (selectedYearId) query = query.eq('academic_year_id', selectedYearId);
      const { data } = await query.order('grade_level');
      return data || [];
    },
    enabled: !!schoolData?.id,
  });

  const { data: allTemplateItems = [] } = useQuery({
    queryKey: ['fee-template-items', templates.map((t: any) => t.id)],
    queryFn: async () => {
      const ids = templates.map((t: any) => t.id);
      if (ids.length === 0) return [];
      const { data } = await supabase.from('fee_template_items').select('*, fee_catalog(name)').in('template_id', ids);
      return data || [];
    },
    enabled: templates.length > 0,
  });

  const getTemplateItemCount = (templateId: string) =>
    allTemplateItems.filter((i: any) => i.template_id === templateId).length;

  const getTemplateTotal = (templateId: string) =>
    allTemplateItems.filter((i: any) => i.template_id === templateId).reduce((sum: number, i: any) => sum + Number(i.amount), 0);

  const resetForm = () => {
    setForm({ name: '', grade_level: '', strand: '' });
    setTemplateItems([]);
    setEditingTemplate(null);
    setIsOpen(false);
  };

  const openCreate = () => {
    setEditingTemplate(null);
    setForm({ name: '', grade_level: '', strand: '' });
    setTemplateItems(fees.map((f: any) => ({
      fee_catalog_id: f.id,
      name: f.name,
      amount: Number(f.amount),
      is_mandatory: f.is_mandatory,
      selected: false,
    })));
    setIsOpen(true);
  };

  const openEdit = async (template: any) => {
    setEditingTemplate(template);
    setForm({ name: template.name, grade_level: template.grade_level || '', strand: template.strand || '' });
    const existingItems = allTemplateItems.filter((i: any) => i.template_id === template.id);
    setTemplateItems(fees.map((f: any) => {
      const existing = existingItems.find((ei: any) => ei.fee_catalog_id === f.id);
      return {
        fee_catalog_id: f.id,
        name: f.name,
        amount: existing ? Number(existing.amount) : Number(f.amount),
        is_mandatory: existing ? existing.is_mandatory : f.is_mandatory,
        selected: !!existing,
      };
    }));
    setIsOpen(true);
  };

  const saveTemplate = useMutation({
    mutationFn: async () => {
      if (!form.name || !form.grade_level) throw new Error('Name and grade level are required');
      if (!selectedYearId) throw new Error('Please select an academic year');
      const selectedItems = templateItems.filter(i => i.selected);
      if (selectedItems.length === 0) throw new Error('Select at least one fee item');

      let templateId: string;

      if (editingTemplate) {
        const { error } = await supabase.from('fee_templates').update({
          name: form.name, grade_level: form.grade_level, strand: form.strand || null,
        }).eq('id', editingTemplate.id);
        if (error) throw error;
        templateId = editingTemplate.id;

        // Delete old items and re-insert
        const { error: delError } = await supabase.from('fee_template_items').delete().eq('template_id', templateId);
        if (delError) throw delError;
      } else {
        const { data, error } = await supabase.from('fee_templates').insert({
          name: form.name, grade_level: form.grade_level, strand: form.strand || null,
          school_id: schoolData!.id, academic_year_id: selectedYearId,
        }).select('id').single();
        if (error) throw error;
        templateId = data.id;
      }

      const items = selectedItems.map(i => ({
        template_id: templateId,
        fee_catalog_id: i.fee_catalog_id,
        amount: i.amount,
        is_mandatory: i.is_mandatory,
      }));
      const { error: insertError } = await supabase.from('fee_template_items').insert(items);
      if (insertError) throw insertError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fee-templates'] });
      queryClient.invalidateQueries({ queryKey: ['fee-template-items'] });
      toast.success(editingTemplate ? 'Template updated' : 'Template created');
      resetForm();
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteTemplate = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from('fee_template_items').delete().eq('template_id', id);
      const { error } = await supabase.from('fee_templates').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fee-templates'] });
      queryClient.invalidateQueries({ queryKey: ['fee-template-items'] });
      toast.success('Template deleted');
    },
  });

  const toggleItem = (idx: number) => {
    setTemplateItems(prev => prev.map((item, i) => i === idx ? { ...item, selected: !item.selected } : item));
  };

  const updateItemAmount = (idx: number, amount: number) => {
    setTemplateItems(prev => prev.map((item, i) => i === idx ? { ...item, amount } : item));
  };

  const selectedTotal = templateItems.filter(i => i.selected).reduce((sum, i) => sum + i.amount, 0);

  return (
    <div className="space-y-4">
      <Separator />
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Package className="h-5 w-5" /> Fee Templates
          </h2>
          <p className="text-sm text-muted-foreground">Bundle fee items into grade-level packages for student assessments</p>
        </div>
        <Dialog open={isOpen} onOpenChange={(v) => { if (!v) resetForm(); setIsOpen(v); }}>
          <DialogTrigger asChild>
            <Button onClick={openCreate} disabled={fees.length === 0}>
              <Plus className="h-4 w-4 mr-2" />Add Template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingTemplate ? 'Edit Template' : 'Create Fee Template'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Template Name</Label>
                  <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Grade 7 - Full" />
                </div>
                <div>
                  <Label>Grade Level</Label>
                  <Select value={form.grade_level} onValueChange={v => setForm(f => ({ ...f, grade_level: v }))}>
                    <SelectTrigger><SelectValue placeholder="Select grade" /></SelectTrigger>
                    <SelectContent>{GRADE_LEVELS.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Strand (optional, for SHS)</Label>
                <Input value={form.strand} onChange={e => setForm(f => ({ ...f, strand: e.target.value }))} placeholder="e.g. STEM, ABM, HUMSS" />
              </div>

              <Separator />

              <div>
                <Label className="text-base font-semibold">Fee Items</Label>
                {fees.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4">No fee catalog items. Create fee items first.</p>
                ) : (
                  <div className="space-y-2 mt-2">
                    {templateItems.map((item, idx) => (
                      <div key={item.fee_catalog_id} className="flex items-center gap-3 p-2 rounded-md border bg-card">
                        <Checkbox checked={item.selected} onCheckedChange={() => toggleItem(idx)} />
                        <span className="flex-1 text-sm font-medium">{item.name}</span>
                        <Input
                          type="number"
                          className="w-28"
                          value={item.amount}
                          onChange={e => updateItemAmount(idx, Number(e.target.value))}
                          disabled={!item.selected}
                        />
                        <Badge variant={item.is_mandatory ? 'default' : 'secondary'} className="text-xs">
                          {item.is_mandatory ? 'Mandatory' : 'Optional'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-sm text-muted-foreground">
                  {templateItems.filter(i => i.selected).length} item(s) selected
                </span>
                <span className="font-semibold">Total: ₱{selectedTotal.toLocaleString()}</span>
              </div>

              <Button onClick={() => saveTemplate.mutate()} className="w-full" disabled={saveTemplate.isPending}>
                {editingTemplate ? 'Update Template' : 'Create Template'}
              </Button>
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
                <TableHead>Grade Level</TableHead>
                <TableHead>Strand</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {templates.map((t: any) => (
                <TableRow key={t.id}>
                  <TableCell className="font-medium">{t.name}</TableCell>
                  <TableCell>{t.grade_level || '—'}</TableCell>
                  <TableCell>{t.strand || '—'}</TableCell>
                  <TableCell>{getTemplateItemCount(t.id)}</TableCell>
                  <TableCell>₱{getTemplateTotal(t.id).toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge variant={t.is_active ? 'default' : 'secondary'}>
                      {t.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(t)}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => deleteTemplate.mutate(t.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {templates.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    No fee templates yet. Create one to bundle fee items by grade level.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
