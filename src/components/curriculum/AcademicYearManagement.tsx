import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Loader2, Calendar, Edit, Trash2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface AcademicYear {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
  created_at: string;
}

const initialFormState = {
  name: '',
  start_date: '',
  end_date: '',
  is_current: false,
};

export const AcademicYearManagement = () => {
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingYear, setEditingYear] = useState<AcademicYear | null>(null);
  const [formData, setFormData] = useState(initialFormState);

  const fetchYears = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('academic_years')
      .select('*')
      .order('start_date', { ascending: false });
    
    if (!error && data) {
      setYears(data as AcademicYear[]);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchYears();
  }, []);

  const handleOpenModal = (year?: AcademicYear) => {
    if (year) {
      setEditingYear(year);
      setFormData({
        name: year.name,
        start_date: year.start_date,
        end_date: year.end_date,
        is_current: year.is_current,
      });
    } else {
      setEditingYear(null);
      setFormData(initialFormState);
    }
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.start_date || !formData.end_date) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSaving(true);
    try {
      // If setting as current, unset others first
      if (formData.is_current) {
        await supabase
          .from('academic_years')
          .update({ is_current: false })
          .eq('is_current', true);
      }

      if (editingYear) {
        const { error } = await supabase
          .from('academic_years')
          .update({
            name: formData.name,
            start_date: formData.start_date,
            end_date: formData.end_date,
            is_current: formData.is_current,
          })
          .eq('id', editingYear.id);

        if (error) throw error;
        toast.success('Academic year updated');
      } else {
        const { error } = await supabase
          .from('academic_years')
          .insert({
            name: formData.name,
            start_date: formData.start_date,
            end_date: formData.end_date,
            is_current: formData.is_current,
          });

        if (error) throw error;
        toast.success('Academic year added');
      }

      setIsModalOpen(false);
      fetchYears();
    } catch (error: any) {
      console.error('Error:', error);
      toast.error(error.message || 'Failed to save');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSetCurrent = async (year: AcademicYear) => {
    try {
      await supabase
        .from('academic_years')
        .update({ is_current: false })
        .eq('is_current', true);

      await supabase
        .from('academic_years')
        .update({ is_current: true })
        .eq('id', year.id);

      toast.success(`${year.name} set as current academic year`);
      fetchYears();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDelete = async (year: AcademicYear) => {
    if (!confirm(`Are you sure you want to delete "${year.name}"?`)) return;

    try {
      const { error } = await supabase
        .from('academic_years')
        .delete()
        .eq('id', year.id);

      if (error) throw error;
      toast.success('Academic year deleted');
      fetchYears();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete');
    }
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Academic Years</h1>
          <p className="text-muted-foreground mt-1">Manage school years and terms</p>
        </div>
        <Button onClick={() => handleOpenModal()}>
          <Plus className="h-4 w-4 mr-2" />
          Add Academic Year
        </Button>
      </motion.div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Academic Years
          </CardTitle>
          <CardDescription>{years.length} academic years configured</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : years.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>End Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {years.map((year) => (
                    <TableRow key={year.id}>
                      <TableCell className="font-medium">{year.name}</TableCell>
                      <TableCell>{format(new Date(year.start_date), 'MMM d, yyyy')}</TableCell>
                      <TableCell>{format(new Date(year.end_date), 'MMM d, yyyy')}</TableCell>
                      <TableCell>
                        {year.is_current ? (
                          <Badge className="bg-green-500">Current</Badge>
                        ) : (
                          <Badge variant="secondary">Inactive</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {!year.is_current && (
                            <Button variant="ghost" size="icon" onClick={() => handleSetCurrent(year)} title="Set as current">
                              <Check className="h-4 w-4 text-green-500" />
                            </Button>
                          )}
                          <Button variant="ghost" size="icon" onClick={() => handleOpenModal(year)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(year)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No academic years configured</p>
              <p className="text-sm">Add an academic year to get started</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingYear ? 'Edit Academic Year' : 'Add Academic Year'}</DialogTitle>
            <DialogDescription>
              Configure the academic year period
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <Label>Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="2024-2025"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Start Date *</Label>
                <Input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                />
              </div>
              <div>
                <Label>End Date *</Label>
                <Input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_current"
                checked={formData.is_current}
                onChange={(e) => setFormData({ ...formData, is_current: e.target.checked })}
                className="h-4 w-4"
              />
              <Label htmlFor="is_current">Set as current academic year</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {editingYear ? 'Update' : 'Add'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
