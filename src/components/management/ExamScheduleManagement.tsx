import { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Plus, Edit2, Trash2, Loader2, GraduationCap, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useSchoolId } from '@/hooks/useSchoolId';
import { useAcademicYear } from '@/contexts/AcademicYearContext';

interface ExamRecord {
  id: string;
  subject_id: string;
  grade_level: string;
  exam_type: string;
  exam_date: string;
  start_time?: string | null;
  end_time?: string | null;
  room?: string | null;
  quarter?: number | null;
  notes?: string | null;
  subjects?: { code: string; name: string } | null;
}

const GRADE_LEVELS = ['Kinder 1', 'Kinder 2', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'];
const EXAM_TYPES = ['quarterly', 'midterm', 'final', 'quiz', 'special'];
const QUARTERS = [1, 2, 3, 4];

const typeColors: Record<string, string> = {
  quarterly: 'bg-blue-100 text-blue-800',
  midterm: 'bg-purple-100 text-purple-800',
  final: 'bg-red-100 text-red-800',
  quiz: 'bg-green-100 text-green-800',
  special: 'bg-orange-100 text-orange-800',
};

export const ExamScheduleManagement = () => {
  const queryClient = useQueryClient();
  const { data: schoolId } = useSchoolId();
  const { selectedYearId } = useAcademicYear();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<ExamRecord | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedQuarter, setSelectedQuarter] = useState<string>('all');
  
  const [formData, setFormData] = useState({
    subject_id: '',
    grade_level: '',
    exam_type: 'quarterly',
    exam_date: format(new Date(), 'yyyy-MM-dd'),
    start_time: '08:00',
    end_time: '10:00',
    room: '',
    quarter: 1,
    notes: '',
  });

  // Fetch exams
  const { data: exams = [], isLoading } = useQuery({
    queryKey: ['exam-management', schoolId, selectedYearId, selectedLevel, selectedType, selectedQuarter],
    queryFn: async () => {
      if (!schoolId || !selectedYearId) return [];
      
      let query = supabase
        .from('exam_schedules')
        .select(`
          *,
          subjects:subject_id(code, name)
        `)
        .eq('school_id', schoolId)
        .eq('academic_year_id', selectedYearId)
        .order('exam_date', { ascending: true });
      
      if (selectedLevel !== 'all') {
        query = query.eq('grade_level', selectedLevel);
      }
      if (selectedType !== 'all') {
        query = query.eq('exam_type', selectedType);
      }
      if (selectedQuarter !== 'all') {
        query = query.eq('quarter', parseInt(selectedQuarter));
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: !!schoolId && !!selectedYearId,
  });

  // Fetch subjects
  const { data: subjects = [] } = useQuery({
    queryKey: ['subjects-for-exams'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subjects')
        .select('id, code, name')
        .eq('is_active', true)
        .order('name');
      if (error) throw error;
      return data || [];
    },
  });

  // Create/Update mutation
  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (!schoolId || !selectedYearId) throw new Error('Missing school or academic year');
      
      const payload = {
        ...data,
        school_id: schoolId,
        academic_year_id: selectedYearId,
      };
      
      if (editingRecord) {
        const { error } = await supabase
          .from('exam_schedules')
          .update(payload)
          .eq('id', editingRecord.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('exam_schedules')
          .insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exam-management'] });
      toast.success(editingRecord ? 'Exam updated' : 'Exam scheduled');
      handleCloseModal();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to save exam');
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('exam_schedules')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exam-management'] });
      toast.success('Exam deleted');
      setIsDeleteDialogOpen(false);
      setDeletingId(null);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete');
    },
  });

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingRecord(null);
    setFormData({
      subject_id: '',
      grade_level: '',
      exam_type: 'quarterly',
      exam_date: format(new Date(), 'yyyy-MM-dd'),
      start_time: '08:00',
      end_time: '10:00',
      room: '',
      quarter: 1,
      notes: '',
    });
  };

  const handleEdit = (record: ExamRecord) => {
    setEditingRecord(record);
    setFormData({
      subject_id: record.subject_id,
      grade_level: record.grade_level,
      exam_type: record.exam_type,
      exam_date: record.exam_date,
      start_time: record.start_time || '08:00',
      end_time: record.end_time || '10:00',
      room: record.room || '',
      quarter: record.quarter || 1,
      notes: record.notes || '',
    });
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    setDeletingId(id);
    setIsDeleteDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.subject_id || !formData.grade_level) {
      toast.error('Please fill in required fields');
      return;
    }
    saveMutation.mutate(formData);
  };

  const isPast = (date: string) => {
    return new Date(date) < new Date(new Date().setHours(0, 0, 0, 0));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Exam Schedule</h1>
          <p className="text-muted-foreground mt-1">Schedule and manage examinations</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Schedule Exam
        </Button>
      </motion.div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[150px]">
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
            <div className="flex-1 min-w-[150px]">
              <Label>Exam Type</Label>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger>
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {EXAM_TYPES.map((type) => (
                    <SelectItem key={type} value={type} className="capitalize">
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 min-w-[150px]">
              <Label>Quarter</Label>
              <Select value={selectedQuarter} onValueChange={setSelectedQuarter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Quarters" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Quarters</SelectItem>
                  {QUARTERS.map((q) => (
                    <SelectItem key={q} value={q.toString()}>Q{q}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5" />
            Exam Schedules
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : exams.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <GraduationCap className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No exams scheduled</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Grade Level</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Quarter</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Room</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {exams.map((record: ExamRecord) => (
                    <TableRow key={record.id} className={isPast(record.exam_date) ? 'opacity-60' : ''}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>{format(new Date(record.exam_date), 'MMM d, yyyy')}</span>
                          {isPast(record.exam_date) && (
                            <Badge variant="secondary" className="text-xs">Past</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {record.subjects?.name || 'Unknown'}
                        <span className="text-xs text-muted-foreground ml-2">
                          ({record.subjects?.code})
                        </span>
                      </TableCell>
                      <TableCell>{record.grade_level}</TableCell>
                      <TableCell>
                        <Badge className={typeColors[record.exam_type] || typeColors.special}>
                          {record.exam_type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {record.quarter ? `Q${record.quarter}` : '-'}
                      </TableCell>
                      <TableCell>
                        {record.start_time && record.end_time
                          ? `${record.start_time} - ${record.end_time}`
                          : '-'}
                      </TableCell>
                      <TableCell>{record.room || '-'}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(record)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
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

      {/* Create/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingRecord ? 'Edit Exam' : 'Schedule Exam'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Subject *</Label>
              <Select
                value={formData.subject_id}
                onValueChange={(value) => setFormData({ ...formData, subject_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select subject" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((subject: any) => (
                    <SelectItem key={subject.id} value={subject.id}>
                      {subject.name} ({subject.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Grade Level *</Label>
                <Select
                  value={formData.grade_level}
                  onValueChange={(value) => setFormData({ ...formData, grade_level: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select level" />
                  </SelectTrigger>
                  <SelectContent>
                    {GRADE_LEVELS.map((level) => (
                      <SelectItem key={level} value={level}>{level}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Exam Type *</Label>
                <Select
                  value={formData.exam_type}
                  onValueChange={(value) => setFormData({ ...formData, exam_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EXAM_TYPES.map((type) => (
                      <SelectItem key={type} value={type} className="capitalize">
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Date *</Label>
                <Input
                  type="date"
                  value={formData.exam_date}
                  onChange={(e) => setFormData({ ...formData, exam_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Quarter</Label>
                <Select
                  value={formData.quarter.toString()}
                  onValueChange={(value) => setFormData({ ...formData, quarter: parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {QUARTERS.map((q) => (
                      <SelectItem key={q} value={q.toString()}>Quarter {q}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Time</Label>
                <Input
                  type="time"
                  value={formData.start_time}
                  onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>End Time</Label>
                <Input
                  type="time"
                  value={formData.end_time}
                  onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Room</Label>
              <Input
                value={formData.room}
                onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                placeholder="Room number or location"
              />
            </div>

            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional notes..."
                rows={3}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseModal}>
                Cancel
              </Button>
              <Button type="submit" disabled={saveMutation.isPending}>
                {saveMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editingRecord ? 'Update' : 'Schedule'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Exam?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The exam schedule will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingId && deleteMutation.mutate(deletingId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
