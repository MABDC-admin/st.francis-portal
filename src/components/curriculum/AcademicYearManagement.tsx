import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Loader2, Calendar, Edit, Trash2, Check, CalendarCheck, Archive, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface AcademicYear {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
  is_archived: boolean;
  archived_at: string | null;
  created_at: string;
}

const initialFormState = {
  name: '',
  start_date: '',
  end_date: '',
  is_current: false,
};

import { PromoteStudentsWorkflow } from './PromoteStudentsWorkflow';

// ... existing imports

export const AcademicYearManagement = () => {
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPromoteModalOpen, setIsPromoteModalOpen] = useState(false);
  const [archiveConfirm, setArchiveConfirm] = useState<AcademicYear | null>(null);
  const [isArchiving, setIsArchiving] = useState(false);
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
        const { error: unsetError } = await supabase
          .from('academic_years')
          .update({ is_current: false })
          .eq('is_current', true);

        if (unsetError) throw unsetError;
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
        const { error } = await (supabase
          .from('academic_years') as any)
          .insert({
            name: formData.name,
            start_date: formData.start_date,
            end_date: formData.end_date,
            is_current: formData.is_current,
            school_id: '00000000-0000-0000-0000-000000000000', // Placeholder - needs proper school_id
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
      const { error: unsetError } = await supabase
        .from('academic_years')
        .update({ is_current: false })
        .eq('is_current', true);

      if (unsetError) throw unsetError;

      const { error: setError } = await supabase
        .from('academic_years')
        .update({ is_current: true })
        .eq('id', year.id);

      if (setError) throw setError;

      toast.success(`${year.name} set as current academic year`);
      fetchYears();
    } catch (error: any) {
      toast.error(error.message || 'Failed to set current academic year');
    }
  };

  const handleDelete = async (year: AcademicYear) => {
    if (year.is_archived) {
      toast.error('Cannot delete an archived academic year');
      return;
    }
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

  const handleArchive = async () => {
    if (!archiveConfirm) return;
    setIsArchiving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      // 1. Copy all grades for this year into grade_snapshots
      const { data: grades, error: gradesError } = await supabase
        .from('student_grades')
        .select('*')
        .eq('academic_year_id', archiveConfirm.id);

      if (gradesError) throw gradesError;

      if (grades && grades.length > 0) {
        const snapshots = grades.map(g => ({
          student_id: g.student_id,
          subject_id: g.subject_id,
          academic_year_id: g.academic_year_id,
          school_id: g.school_id,
          q1_grade: g.q1_grade,
          q2_grade: g.q2_grade,
          q3_grade: g.q3_grade,
          q4_grade: g.q4_grade,
          final_grade: g.final_grade,
          remarks: g.remarks,
          snapshot_data: g,
        }));

        const { error: snapError } = await (supabase.from('grade_snapshots') as any).insert(snapshots);
        if (snapError) throw snapError;
      }

      // 2. Mark year as archived
      const { error: archiveError } = await supabase
        .from('academic_years')
        .update({
          is_archived: true,
          archived_at: new Date().toISOString(),
          archived_by: user?.id,
        })
        .eq('id', archiveConfirm.id);

      if (archiveError) throw archiveError;

      toast.success(`${archiveConfirm.name} archived successfully. ${grades?.length || 0} grade snapshots created.`);
      setArchiveConfirm(null);
      fetchYears();
    } catch (error: any) {
      console.error('Archive error:', error);
      toast.error('Failed to archive: ' + error.message);
    } finally {
      setIsArchiving(false);
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
        <div className="flex gap-2">
          <Button onClick={() => handleOpenModal()} variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Add Year
          </Button>
          <Button onClick={async () => {
            const { error } = await supabase.functions.invoke('sync-holidays', {
              body: { year: 2025 }
            });
            if (error) toast.error('Failed to sync holidays');
            else toast.success('Holidays synced successfully');
          }} variant="outline" className="text-amber-600 border-amber-600 hover:bg-amber-50">
            <CalendarCheck className="h-4 w-4 mr-2" />
            Sync Holidays (2025)
          </Button>
          <Button onClick={() => setIsPromoteModalOpen(true)} className="bg-amber-600 hover:bg-amber-700 text-white">
            <Calendar className="h-4 w-4 mr-2" />
            Start New School Year
          </Button>
        </div>
      </motion.div>

      <Card>
        {/* ... existing card content for table */}
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
                        {year.is_archived ? (
                          <Badge variant="outline" className="border-muted-foreground">
                            <Lock className="h-3 w-3 mr-1" />Archived
                          </Badge>
                        ) : year.is_current ? (
                          <Badge className="bg-green-500">Current</Badge>
                        ) : (
                          <Badge variant="secondary">Inactive</Badge>
                        )}
                        {year.archived_at && (
                          <span className="text-xs text-muted-foreground ml-2">
                            {format(new Date(year.archived_at), 'MMM d, yyyy')}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {!year.is_archived && !year.is_current && (
                            <>
                              <Button variant="ghost" size="icon" onClick={() => handleSetCurrent(year)} title="Set as current">
                                <Check className="h-4 w-4 text-green-500" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => setArchiveConfirm(year)} title="Archive this year">
                                <Archive className="h-4 w-4 text-amber-600" />
                              </Button>
                            </>
                          )}
                          {!year.is_archived && (
                            <>
                              <Button variant="ghost" size="icon" onClick={() => handleOpenModal(year)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => handleDelete(year)}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </>
                          )}
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

      {/* Promotion Workflow Modal */}
      <Dialog open={isPromoteModalOpen} onOpenChange={setIsPromoteModalOpen}>
        <DialogContent className="max-w-4xl p-0 border-0 bg-transparent shadow-none">
          <PromoteStudentsWorkflow
            onClose={() => setIsPromoteModalOpen(false)}
            onSuccess={() => {
              fetchYears();
              // Optionally trigger other refreshes via context if needed
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Archive Confirmation */}
      <AlertDialog open={!!archiveConfirm} onOpenChange={(open) => { if (!open) setArchiveConfirm(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive {archiveConfirm?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will:
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>Create immutable snapshots of all grades for this year</li>
                <li>Lock grade editing for this academic year</li>
                <li>Mark this year as archived</li>
              </ul>
              <p className="mt-2 font-medium text-destructive">This action cannot be undone.</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleArchive} disabled={isArchiving} className="bg-amber-600 hover:bg-amber-700">
              {isArchiving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              <Archive className="h-4 w-4 mr-2" />
              Archive Year
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
