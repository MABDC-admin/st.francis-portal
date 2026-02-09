import { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Plus, Edit2, Trash2, Loader2, FileText, Eye, Calendar } from 'lucide-react';
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

interface AssignmentRecord {
  id: string;
  subject_id: string;
  grade_level: string;
  title: string;
  description?: string | null;
  instructions?: string | null;
  due_date: string;
  max_score?: number | null;
  assignment_type: string;
  subjects?: { code: string; name: string } | null;
}

const GRADE_LEVELS = ['Kinder 1', 'Kinder 2', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'];
const ASSIGNMENT_TYPES = ['homework', 'project', 'quiz', 'essay', 'other'];

const typeColors: Record<string, string> = {
  homework: 'bg-blue-100 text-blue-800',
  project: 'bg-purple-100 text-purple-800',
  quiz: 'bg-green-100 text-green-800',
  essay: 'bg-orange-100 text-orange-800',
  other: 'bg-gray-100 text-gray-800',
};

export const AssignmentManagement = () => {
  const queryClient = useQueryClient();
  const { data: schoolId } = useSchoolId();
  const { selectedYearId } = useAcademicYear();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<AssignmentRecord | null>(null);
  const [viewingRecord, setViewingRecord] = useState<AssignmentRecord | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  
  const [formData, setFormData] = useState({
    subject_id: '',
    grade_level: '',
    title: '',
    description: '',
    instructions: '',
    due_date: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    max_score: 100,
    assignment_type: 'homework',
  });

  // Fetch assignments
  const { data: assignments = [], isLoading } = useQuery({
    queryKey: ['assignment-management', schoolId, selectedYearId, selectedLevel, selectedType],
    queryFn: async () => {
      if (!schoolId || !selectedYearId) return [];
      
      let query = supabase
        .from('student_assignments')
        .select(`
          *,
          subjects:subject_id(code, name)
        `)
        .eq('school_id', schoolId)
        .eq('academic_year_id', selectedYearId)
        .order('due_date', { ascending: false });
      
      if (selectedLevel !== 'all') {
        query = query.eq('grade_level', selectedLevel);
      }
      if (selectedType !== 'all') {
        query = query.eq('assignment_type', selectedType);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: !!schoolId && !!selectedYearId,
  });

  // Fetch subjects
  const { data: subjects = [] } = useQuery({
    queryKey: ['subjects-for-assignments'],
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
          .from('student_assignments')
          .update(payload)
          .eq('id', editingRecord.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('student_assignments')
          .insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignment-management'] });
      toast.success(editingRecord ? 'Assignment updated' : 'Assignment created');
      handleCloseModal();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to save assignment');
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('student_assignments')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignment-management'] });
      toast.success('Assignment deleted');
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
      title: '',
      description: '',
      instructions: '',
      due_date: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
      max_score: 100,
      assignment_type: 'homework',
    });
  };

  const handleEdit = (record: AssignmentRecord) => {
    setEditingRecord(record);
    setFormData({
      subject_id: record.subject_id,
      grade_level: record.grade_level,
      title: record.title,
      description: record.description || '',
      instructions: record.instructions || '',
      due_date: record.due_date.slice(0, 16), // Format for datetime-local input
      max_score: record.max_score || 100,
      assignment_type: record.assignment_type,
    });
    setIsModalOpen(true);
  };

  const handleView = (record: AssignmentRecord) => {
    setViewingRecord(record);
    setIsViewModalOpen(true);
  };

  const handleDelete = (id: string) => {
    setDeletingId(id);
    setIsDeleteDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.subject_id || !formData.grade_level || !formData.title) {
      toast.error('Please fill in required fields');
      return;
    }
    saveMutation.mutate(formData);
  };

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date();
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
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Assignment Management</h1>
          <p className="text-muted-foreground mt-1">Create and manage learner assignments</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Assignment
        </Button>
      </motion.div>

      {/* Filters */}
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
              <Label>Type</Label>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger>
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {ASSIGNMENT_TYPES.map((type) => (
                    <SelectItem key={type} value={type} className="capitalize">
                      {type}
                    </SelectItem>
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
            <FileText className="h-5 w-5" />
            Assignments
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : assignments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No assignments found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Grade Level</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Max Score</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assignments.map((record: AssignmentRecord) => (
                    <TableRow key={record.id}>
                      <TableCell className="font-medium max-w-[200px] truncate">
                        {record.title}
                      </TableCell>
                      <TableCell>
                        {record.subjects?.name || 'Unknown'}
                      </TableCell>
                      <TableCell>{record.grade_level}</TableCell>
                      <TableCell>
                        <Badge className={typeColors[record.assignment_type] || typeColors.other}>
                          {record.assignment_type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className={isOverdue(record.due_date) ? 'text-destructive' : ''}>
                            {format(new Date(record.due_date), 'MMM d, yyyy h:mm a')}
                          </span>
                          {isOverdue(record.due_date) && (
                            <Badge variant="destructive" className="text-xs">Overdue</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{record.max_score || '-'}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleView(record)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
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

      {/* View Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{viewingRecord?.title}</DialogTitle>
          </DialogHeader>
          {viewingRecord && (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Badge className={typeColors[viewingRecord.assignment_type]}>
                  {viewingRecord.assignment_type}
                </Badge>
                <Badge variant="outline">{viewingRecord.grade_level}</Badge>
                <Badge variant="outline">{viewingRecord.subjects?.name}</Badge>
              </div>
              
              <div>
                <Label className="text-muted-foreground">Due Date</Label>
                <p className="font-medium">
                  {format(new Date(viewingRecord.due_date), 'MMMM d, yyyy h:mm a')}
                </p>
              </div>
              
              {viewingRecord.description && (
                <div>
                  <Label className="text-muted-foreground">Description</Label>
                  <p className="whitespace-pre-wrap">{viewingRecord.description}</p>
                </div>
              )}
              
              {viewingRecord.instructions && (
                <div>
                  <Label className="text-muted-foreground">Instructions</Label>
                  <p className="whitespace-pre-wrap">{viewingRecord.instructions}</p>
                </div>
              )}
              
              <div>
                <Label className="text-muted-foreground">Max Score</Label>
                <p className="font-medium">{viewingRecord.max_score || 'Not specified'}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingRecord ? 'Edit Assignment' : 'Create Assignment'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Assignment title"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
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
                        {subject.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
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
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select
                  value={formData.assignment_type}
                  onValueChange={(value) => setFormData({ ...formData, assignment_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ASSIGNMENT_TYPES.map((type) => (
                      <SelectItem key={type} value={type} className="capitalize">
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Max Score</Label>
                <Input
                  type="number"
                  value={formData.max_score}
                  onChange={(e) => setFormData({ ...formData, max_score: parseInt(e.target.value) || 100 })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Due Date *</Label>
              <Input
                type="datetime-local"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of the assignment"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Instructions</Label>
              <Textarea
                value={formData.instructions}
                onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                placeholder="Detailed instructions for learners"
                rows={4}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseModal}>
                Cancel
              </Button>
              <Button type="submit" disabled={saveMutation.isPending}>
                {saveMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editingRecord ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Assignment?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the assignment and all related submissions. This action cannot be undone.
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
