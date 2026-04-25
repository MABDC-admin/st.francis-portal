import { useState, type FormEvent } from 'react';
import { motion } from 'framer-motion';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit2, Trash2, Loader2, Layers3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useSchoolId } from '@/hooks/useSchoolId';
import { useAcademicYear } from '@/contexts/AcademicYearContext';
import { useYearGuard } from '@/hooks/useYearGuard';
import { YearLockedBanner } from '@/components/ui/YearLockedBanner';
import { GRADE_LEVELS } from '@/components/enrollment/constants';

interface SectionRecord {
  id: string;
  school_id: string;
  academic_year_id: string;
  grade_level: string;
  name: string;
  advisor_teacher_id: string | null;
  capacity: number | null;
  is_active: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
  teachers?: { full_name: string } | null;
}

const defaultForm = {
  name: '',
  grade_level: '',
  advisor_teacher_id: 'none',
  capacity: '',
  is_active: 'true',
  notes: '',
};

export const SectionsManagement = () => {
  const queryClient = useQueryClient();
  const { data: schoolId } = useSchoolId();
  const { selectedYearId } = useAcademicYear();
  const { isReadOnly, guardMutation } = useYearGuard();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<SectionRecord | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [formData, setFormData] = useState(defaultForm);

  const { data: sections = [], isLoading } = useQuery({
    queryKey: ['sections-management', schoolId, selectedYearId, selectedLevel, selectedStatus],
    queryFn: async () => {
      if (!schoolId || !selectedYearId) {
        return [];
      }

      let query = supabase
        .from('sections')
        .select('*, teachers:advisor_teacher_id(full_name)')
        .eq('school_id', schoolId)
        .eq('academic_year_id', selectedYearId)
        .order('grade_level', { ascending: true })
        .order('name', { ascending: true });

      if (selectedLevel !== 'all') {
        query = query.eq('grade_level', selectedLevel);
      }
      if (selectedStatus !== 'all') {
        query = query.eq('is_active', selectedStatus === 'active');
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as SectionRecord[];
    },
    enabled: !!schoolId && !!selectedYearId,
  });

  const { data: teachers = [] } = useQuery({
    queryKey: ['teachers-for-sections', schoolId],
    queryFn: async () => {
      if (!schoolId) {
        return [];
      }

      const { data, error } = await supabase
        .from('teachers')
        .select('id, full_name')
        .eq('status', 'active')
        .order('full_name', { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!schoolId,
  });

  const saveMutation = useMutation({
    mutationFn: async (payload: typeof defaultForm) => {
      if (!schoolId || !selectedYearId) {
        throw new Error('Missing school or academic year');
      }

      const trimmedName = payload.name.trim();
      if (!trimmedName || !payload.grade_level) {
        throw new Error('Section name and grade level are required');
      }

      let parsedCapacity: number | null = null;
      if (payload.capacity.trim()) {
        parsedCapacity = Number(payload.capacity.trim());
        if (!Number.isFinite(parsedCapacity) || parsedCapacity <= 0) {
          throw new Error('Capacity must be a positive number');
        }
      }

      const cleanPayload = {
        school_id: schoolId,
        academic_year_id: selectedYearId,
        name: trimmedName,
        grade_level: payload.grade_level,
        advisor_teacher_id: payload.advisor_teacher_id && payload.advisor_teacher_id !== 'none'
          ? payload.advisor_teacher_id
          : null,
        capacity: parsedCapacity,
        is_active: payload.is_active === 'true',
        notes: payload.notes.trim() ? payload.notes.trim() : null,
      };

      if (editingRecord) {
        const { error } = await supabase
          .from('sections')
          .update(cleanPayload)
          .eq('id', editingRecord.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('sections')
          .insert(cleanPayload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sections-management'] });
      toast.success(editingRecord ? 'Section updated' : 'Section created');
      handleCloseModal();
    },
    onError: (error: any) => {
      if (error?.code === '23505') {
        toast.error('A section with the same name and grade level already exists.');
        return;
      }
      toast.error(error?.message || 'Failed to save section');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('sections')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sections-management'] });
      toast.success('Section deleted');
      setIsDeleteDialogOpen(false);
      setDeletingId(null);
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to delete section');
    },
  });

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingRecord(null);
    setFormData(defaultForm);
  };

  const handleEdit = (record: SectionRecord) => {
    setEditingRecord(record);
    setFormData({
      name: record.name,
      grade_level: record.grade_level,
      advisor_teacher_id: record.advisor_teacher_id || 'none',
      capacity: record.capacity ? String(record.capacity) : '',
      is_active: record.is_active ? 'true' : 'false',
      notes: record.notes || '',
    });
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    setDeletingId(id);
    setIsDeleteDialogOpen(true);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!guardMutation()) return;
    saveMutation.mutate(formData);
  };

  const handleConfirmDelete = () => {
    if (!deletingId) return;
    if (!guardMutation()) return;
    deleteMutation.mutate(deletingId);
  };

  const formatDate = (value: string) => {
    return new Date(value).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      <YearLockedBanner />

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Sections Management</h1>
          <p className="text-muted-foreground mt-1">Create and manage sections by grade level</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} disabled={isReadOnly}>
          <Plus className="h-4 w-4 mr-2" />
          Add Section
        </Button>
      </motion.div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <Label>Grade Level</Label>
              <Select value={selectedLevel} onValueChange={setSelectedLevel}>
                <SelectTrigger>
                  <SelectValue placeholder="All Levels" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  {GRADE_LEVELS.map((level) => (
                    <SelectItem key={level} value={level}>{level}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1 min-w-[200px]">
              <Label>Status</Label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layers3 className="h-5 w-5" />
            Section List
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : sections.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No sections found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Section</TableHead>
                    <TableHead>Grade Level</TableHead>
                    <TableHead>Adviser</TableHead>
                    <TableHead>Capacity</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Updated</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sections.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="font-medium">{record.name}</TableCell>
                      <TableCell>{record.grade_level}</TableCell>
                      <TableCell>{record.teachers?.full_name || '-'}</TableCell>
                      <TableCell>{record.capacity ?? '-'}</TableCell>
                      <TableCell>
                        <Badge variant={record.is_active ? 'default' : 'secondary'}>
                          {record.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(record.updated_at || record.created_at)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            disabled={isReadOnly}
                            onClick={() => handleEdit(record)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            disabled={isReadOnly}
                            onClick={() => handleDelete(record.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={isModalOpen}
        onOpenChange={(open) => {
          if (!open) {
            handleCloseModal();
            return;
          }
          setIsModalOpen(true);
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingRecord ? 'Edit Section' : 'Add Section'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Section Name *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData((previous) => ({ ...previous, name: e.target.value }))}
                  placeholder="e.g., Section A"
                  maxLength={60}
                />
              </div>
              <div className="space-y-2">
                <Label>Grade Level *</Label>
                <Select
                  value={formData.grade_level}
                  onValueChange={(value) => setFormData((previous) => ({ ...previous, grade_level: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select grade level" />
                  </SelectTrigger>
                  <SelectContent>
                    {GRADE_LEVELS.map((level) => (
                      <SelectItem key={level} value={level}>{level}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Adviser (Optional)</Label>
                <Select
                  value={formData.advisor_teacher_id}
                  onValueChange={(value) => setFormData((previous) => ({ ...previous, advisor_teacher_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="No adviser assigned" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No adviser assigned</SelectItem>
                    {teachers.map((teacher) => (
                      <SelectItem key={teacher.id} value={teacher.id}>
                        {teacher.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Capacity</Label>
                <Input
                  type="number"
                  min={1}
                  value={formData.capacity}
                  onChange={(e) => setFormData((previous) => ({ ...previous, capacity: e.target.value }))}
                  placeholder="e.g., 35"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={formData.is_active}
                onValueChange={(value) => setFormData((previous) => ({ ...previous, is_active: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Active</SelectItem>
                  <SelectItem value="false">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData((previous) => ({ ...previous, notes: e.target.value }))}
                placeholder="Optional notes"
                rows={3}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseModal}>
                Cancel
              </Button>
              <Button type="submit" disabled={saveMutation.isPending || isReadOnly}>
                {saveMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editingRecord ? 'Update Section' : 'Create Section'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete section?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The section record will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeletingId(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={deleteMutation.isPending || isReadOnly}
              className="bg-destructive hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
