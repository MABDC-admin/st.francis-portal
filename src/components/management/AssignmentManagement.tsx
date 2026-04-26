import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Plus, Edit2, Trash2, Loader2, FileText, Eye, Calendar, BookOpen, Paperclip, ShieldCheck } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
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
import { MultiFileUploader, Attachment } from '@/components/ui/MultiFileUploader';
import { useAuth } from '@/contexts/AuthContext';
import { useTeacherProfile, useTeacherSchedule } from '@/hooks/useTeacherData';

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
  submission_required: boolean;
  attachments?: Attachment[] | null;
  subjects?: { code: string; name: string } | null;
}

const GRADE_LEVELS = ['Kindergarten', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'];
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
  const { user, role } = useAuth();
  const { data: schoolId } = useSchoolId();
  const { selectedYearId } = useAcademicYear();
  const isTeacher = role === 'teacher';

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
    submission_required: true,
    has_max_score: true,
    attachments: [] as Attachment[],
  });

  const { data: teacherProfile } = useTeacherProfile(
    isTeacher ? user?.id : undefined,
    isTeacher ? user?.email : undefined,
  );
  const { data: teacherSchedules = [] } = useTeacherSchedule(
    isTeacher ? teacherProfile?.id : undefined,
    isTeacher ? schoolId : undefined,
    isTeacher ? selectedYearId : undefined,
    isTeacher ? teacherProfile?.grade_level : undefined,
  );

  const teacherScope = useMemo(() => {
    if (!isTeacher) {
      return {
        gradeLevels: GRADE_LEVELS,
        subjectIds: new Set<string>(),
        hasExplicitSubjectScope: false,
      };
    }

    const gradeLevels = new Set<string>();
    const subjectIds = new Set<string>();

    teacherSchedules.forEach((schedule: any) => {
      if (schedule.grade_level) gradeLevels.add(schedule.grade_level);
      if (schedule.subject_id) subjectIds.add(schedule.subject_id);
    });

    if (teacherProfile?.grade_level) {
      gradeLevels.add(teacherProfile.grade_level);
    }

    return {
      gradeLevels: Array.from(gradeLevels),
      subjectIds,
      hasExplicitSubjectScope: subjectIds.size > 0,
    };
  }, [isTeacher, teacherProfile?.grade_level, teacherSchedules]);

  const availableGradeLevels = useMemo(() => {
    if (!isTeacher) return GRADE_LEVELS;
    return GRADE_LEVELS.filter((level) => teacherScope.gradeLevels.includes(level));
  }, [isTeacher, teacherScope.gradeLevels]);

  // Fetch assignments
  const { data: assignments = [], isLoading } = useQuery({
    queryKey: [
      'assignment-management',
      schoolId,
      selectedYearId,
      selectedLevel,
      selectedType,
      isTeacher,
      teacherScope.gradeLevels.join('|'),
      Array.from(teacherScope.subjectIds).join('|'),
    ],
    queryFn: async () => {
      if (!schoolId || !selectedYearId) return [];
      if (isTeacher && teacherScope.gradeLevels.length === 0) return [];

      let query = supabase
        .from('student_assignments')
        .select(`
          *,
          subjects:subject_id(code, name)
        `)
        .eq('school_id', schoolId)
        .eq('academic_year_id', selectedYearId)
        .order('due_date', { ascending: false });

      if (isTeacher) {
        query = teacherScope.gradeLevels.length === 1
          ? query.eq('grade_level', teacherScope.gradeLevels[0])
          : query.in('grade_level', teacherScope.gradeLevels);

        const scopedSubjectIds = Array.from(teacherScope.subjectIds);
        if (teacherScope.hasExplicitSubjectScope && scopedSubjectIds.length > 0) {
          query = scopedSubjectIds.length === 1
            ? query.eq('subject_id', scopedSubjectIds[0])
            : query.in('subject_id', scopedSubjectIds);
        }
      }

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
    enabled: !!schoolId && !!selectedYearId && (!isTeacher || !!teacherProfile?.id),
  });

  // Fetch subjects
  const { data: subjects = [] } = useQuery({
    queryKey: ['subjects-for-assignments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subjects')
        .select('id, code, name, grade_levels')
        .eq('is_active', true)
        .order('name');
      if (error) throw error;
      return data || [];
    },
  });

  // Filter subjects based on selected grade level in form
  const scopedSubjects = useMemo(() => {
    if (!isTeacher) return subjects;

    if (teacherScope.hasExplicitSubjectScope) {
      return subjects.filter((subject: any) => teacherScope.subjectIds.has(subject.id));
    }

    return subjects.filter((subject: any) =>
      subject.grade_levels?.some((level: string) => teacherScope.gradeLevels.includes(level)),
    );
  }, [isTeacher, subjects, teacherScope.gradeLevels, teacherScope.hasExplicitSubjectScope, teacherScope.subjectIds]);

  const filteredSubjects = scopedSubjects.filter((subject: any) => {
    if (!formData.grade_level) return true;
    return subject.grade_levels?.includes(formData.grade_level);
  });

  // Create/Update mutation
  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (!schoolId || !selectedYearId) throw new Error('Missing school or academic year');
      if (isTeacher && !teacherScope.gradeLevels.includes(data.grade_level)) {
        throw new Error('This grade level is outside your assigned classes.');
      }
      if (isTeacher && teacherScope.hasExplicitSubjectScope && !teacherScope.subjectIds.has(data.subject_id)) {
        throw new Error('This subject is outside your assigned classes.');
      }

      const { has_max_score, ...dbFields } = data;
      const payload = {
        ...dbFields,
        max_score: has_max_score ? dbFields.max_score : 0,
        attachments: data.attachments as any,
        school_id: schoolId,
        academic_year_id: selectedYearId,
        created_by: user?.id || null,
      };

      if (editingRecord) {
        const { error } = await supabase
          .from('student_assignments')
          .update(payload as any)
          .eq('id', editingRecord.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('student_assignments')
          .insert(payload as any);
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
      submission_required: true,
      has_max_score: true,
      attachments: [],
    });
  };

  const getDefaultFormData = () => {
    const defaultGradeLevel = isTeacher && availableGradeLevels.length === 1 ? availableGradeLevels[0] : '';
    const defaultSubject = defaultGradeLevel
      ? scopedSubjects.find((subject: any) => subject.grade_levels?.includes(defaultGradeLevel))?.id || ''
      : '';

    return {
      subject_id: defaultSubject,
      grade_level: defaultGradeLevel,
      title: '',
      description: '',
      instructions: '',
      due_date: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
      max_score: 100,
      assignment_type: 'homework',
      submission_required: true,
      has_max_score: true,
      attachments: [] as Attachment[],
    };
  };

  const handleOpenCreate = () => {
    setEditingRecord(null);
    setFormData(getDefaultFormData());
    setIsModalOpen(true);
  };

  const handleGradeLevelChange = (gradeLevel: string) => {
    const nextSubjectStillValid = scopedSubjects.some((subject: any) =>
      subject.id === formData.subject_id && subject.grade_levels?.includes(gradeLevel),
    );

    setFormData({
      ...formData,
      grade_level: gradeLevel,
      subject_id: nextSubjectStillValid
        ? formData.subject_id
        : scopedSubjects.find((subject: any) => subject.grade_levels?.includes(gradeLevel))?.id || '',
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
      submission_required: record.submission_required,
      has_max_score: (record.max_score || 0) > 0,
      attachments: (record.attachments as unknown as Attachment[]) || [],
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
    if (!formData.subject_id || !formData.grade_level || !formData.title || !formData.due_date) {
      toast.error('Please fill in required fields');
      return;
    }
    if (isTeacher && !teacherScope.gradeLevels.includes(formData.grade_level)) {
      toast.error('This grade level is outside your assigned classes');
      return;
    }
    if (isTeacher && teacherScope.hasExplicitSubjectScope && !teacherScope.subjectIds.has(formData.subject_id)) {
      toast.error('This subject is outside your assigned classes');
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
        <Button onClick={handleOpenCreate} disabled={isTeacher && availableGradeLevels.length === 0}>
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
                  {(isTeacher ? availableGradeLevels : GRADE_LEVELS).map((level) => (
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
                  {assignments.map((record: any) => (
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
        <DialogContent className="max-w-lg p-0 overflow-hidden">
          <DialogHeader className="p-6 pb-2">
            <DialogTitle>{viewingRecord?.title}</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[80vh]">
            {viewingRecord && (
              <div className="px-6 pb-6 space-y-4">
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

                {viewingRecord.attachments && viewingRecord.attachments.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Attachments</Label>
                    <div className="grid grid-cols-1 gap-2">
                      {viewingRecord.attachments.map((file, i) => (
                        <a
                          key={i}
                          href={file.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 p-2 border rounded bg-muted/50 hover:bg-muted transition-colors"
                        >
                          <FileText className="h-4 w-4 text-primary" />
                          <span className="text-sm truncate flex-1">{file.name}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <Label className="text-muted-foreground">Max Score</Label>
                  <p className="font-medium">{viewingRecord.max_score || 'Not specified'}</p>
                </div>
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Create/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-[96vw] lg:max-w-5xl p-0 overflow-hidden">
          <DialogHeader className="border-b bg-gradient-to-r from-slate-50 to-cyan-50 p-6 pb-4">
            <DialogTitle>
              {editingRecord ? 'Edit Assignment' : 'Create Assignment'}
            </DialogTitle>
            <p className="text-sm text-muted-foreground">
              Build a complete task with subject scope, scoring, instructions, and bulk learning materials.
            </p>
          </DialogHeader>
          <ScrollArea className="max-h-[78vh]">
            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid gap-6 lg:grid-cols-[1.7fr_1fr]">
                <div className="space-y-5">
                  <Card className="border-cyan-100 shadow-sm">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <BookOpen className="h-4 w-4 text-cyan-700" />
                        Assignment Details
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label>Title *</Label>
                        <Input
                          value={formData.title}
                          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                          placeholder="Example: Read and answer pages 12-15"
                          className="h-11"
                        />
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label>Grade Level *</Label>
                          <Select value={formData.grade_level} onValueChange={handleGradeLevelChange}>
                            <SelectTrigger className="h-11">
                              <SelectValue placeholder="Select level" />
                            </SelectTrigger>
                            <SelectContent>
                              {availableGradeLevels.map((level) => (
                                <SelectItem key={level} value={level}>{level}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Subject *</Label>
                          <Select
                            value={formData.subject_id}
                            onValueChange={(value) => setFormData({ ...formData, subject_id: value })}
                            disabled={!formData.grade_level}
                          >
                            <SelectTrigger className="h-11">
                              <SelectValue placeholder={formData.grade_level ? "Select subject" : "Select Grade Level first"} />
                            </SelectTrigger>
                            <SelectContent>
                              {filteredSubjects.map((subject: any) => (
                                <SelectItem key={subject.id} value={subject.id}>
                                  {subject.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid gap-4 md:grid-cols-3">
                        <div className="space-y-2">
                          <Label>Type</Label>
                          <Select
                            value={formData.assignment_type}
                            onValueChange={(value) => setFormData({ ...formData, assignment_type: value })}
                          >
                            <SelectTrigger className="h-11">
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
                          <Label>Due Date *</Label>
                          <Input
                            type="datetime-local"
                            value={formData.due_date}
                            onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                            className="h-11"
                          />
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label>Max Score</Label>
                            <div className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                id="has_max_score"
                                checked={formData.has_max_score}
                                onChange={(e) => setFormData({ ...formData, has_max_score: e.target.checked })}
                                className="h-3 w-3 rounded border-gray-300 text-primary"
                              />
                              <Label htmlFor="has_max_score" className="text-xs text-muted-foreground font-normal cursor-pointer">
                                Graded
                              </Label>
                            </div>
                          </div>
                          <Input
                            type="number"
                            min={0}
                            value={formData.max_score}
                            onChange={(e) => setFormData({ ...formData, max_score: parseInt(e.target.value) || 0 })}
                            disabled={!formData.has_max_score}
                            className={`h-11 ${!formData.has_max_score ? 'opacity-50' : ''}`}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="shadow-sm">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <FileText className="h-4 w-4 text-slate-700" />
                        Learner Instructions
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label>Description</Label>
                        <Textarea
                          value={formData.description}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                          placeholder="Short summary students will see first"
                          rows={4}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Instructions</Label>
                        <Textarea
                          value={formData.instructions}
                          onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                          placeholder="Detailed steps, page numbers, output format, rubrics, reminders"
                          rows={7}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="shadow-sm">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <Paperclip className="h-4 w-4 text-emerald-700" />
                        Documents & Media
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <MultiFileUploader
                        attachments={formData.attachments}
                        onChange={(attachments) => setFormData({ ...formData, attachments })}
                        folder={`assignments/${schoolId || 'school'}/${selectedYearId || 'year'}`}
                      />
                    </CardContent>
                  </Card>
                </div>

                <div className="space-y-4">
                  <Card className="border-emerald-100 bg-emerald-50/60 shadow-sm">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <ShieldCheck className="h-4 w-4 text-emerald-700" />
                        Teacher Scope
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                      <div>
                        <p className="font-medium">Allowed Grade Levels</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {availableGradeLevels.length > 0 ? availableGradeLevels.map((level) => (
                            <Badge key={level} variant="outline" className="bg-white">{level}</Badge>
                          )) : (
                            <span className="text-muted-foreground">No grade assignment detected</span>
                          )}
                        </div>
                      </div>
                      <div>
                        <p className="font-medium">Allowed Subjects</p>
                        <p className="text-muted-foreground">
                          {isTeacher
                            ? `${scopedSubjects.length} subject${scopedSubjects.length === 1 ? '' : 's'} available from your class schedule`
                            : 'Admin/registrar full subject access'}
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="shadow-sm">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Submission Rules</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-start space-x-3 rounded-2xl border bg-muted/20 p-4">
                        <input
                          type="checkbox"
                          id="submission_required"
                          checked={formData.submission_required}
                          onChange={(e) => setFormData({ ...formData, submission_required: e.target.checked })}
                          className="mt-1 h-4 w-4 rounded border-primary text-primary focus:ring-primary"
                        />
                        <div className="space-y-1">
                          <Label htmlFor="submission_required" className="text-sm font-medium leading-none cursor-pointer">
                            Submission Required
                          </Label>
                          <p className="text-xs text-muted-foreground">
                            If unchecked, students only mark the task as done. Keep checked for file/text submissions.
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="shadow-sm">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Quick Preview</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                      <div>
                        <p className="text-muted-foreground">Title</p>
                        <p className="font-medium">{formData.title || 'Untitled assignment'}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-muted-foreground">Grade</p>
                          <p className="font-medium">{formData.grade_level || '-'}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Files</p>
                          <p className="font-medium">{formData.attachments.length}</p>
                        </div>
                      </div>
                      <Badge className={typeColors[formData.assignment_type] || typeColors.other}>
                        {formData.assignment_type}
                      </Badge>
                    </CardContent>
                  </Card>
                </div>
              </div>

              <DialogFooter className="sticky bottom-0 -mx-6 mt-6 border-t bg-background/95 px-6 py-4 backdrop-blur">
                <Button type="button" variant="outline" onClick={handleCloseModal}>
                  Cancel
                </Button>
                <Button type="submit" disabled={saveMutation.isPending}>
                  {saveMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {editingRecord ? 'Update' : 'Create'}
                </Button>
              </DialogFooter>
            </form>
          </ScrollArea>
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
