import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
  AlertCircle,
  BookOpenCheck,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Edit2,
  Eye,
  FileCheck2,
  Layers3,
  Loader2,
  NotebookPen,
  Plus,
  Send,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useTeacherProfile, useTeacherSchedule } from '@/hooks/useTeacherData';
import { useSchoolId } from '@/hooks/useSchoolId';
import { useAcademicYear } from '@/contexts/AcademicYearContext';
import { useYearGuard } from '@/hooks/useYearGuard';
import { YearLockedBanner } from '@/components/ui/YearLockedBanner';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';

type LessonPlanStatus = 'draft' | 'submitted' | 'approved' | 'rejected';

interface AssignedClassOption {
  class_schedule_id: string;
  subject_id: string;
  subject_name: string;
  subject_code: string;
  grade_level: string;
  section: string | null;
}

interface LessonPlanRow {
  id: string;
  class_schedule_id: string | null;
  subject_id: string;
  title: string;
  plan_date: string;
  status: LessonPlanStatus;
  objectives: string | null;
  competencies: string | null;
  materials: string | null;
  procedures: string | null;
  assessment: string | null;
  homework: string | null;
  notes: string | null;
  review_notes?: string | null;
  updated_at: string | null;
  subjects: { name: string; code: string } | null;
  class_schedules: { grade_level: string; section: string | null } | null;
}

const statusVariant: Record<LessonPlanStatus, 'secondary' | 'default' | 'destructive' | 'outline'> = {
  draft: 'secondary',
  submitted: 'outline',
  approved: 'default',
  rejected: 'destructive',
};

const statusLabel: Record<LessonPlanStatus, string> = {
  draft: 'Draft',
  submitted: 'Submitted',
  approved: 'Approved',
  rejected: 'Rejected',
};

const statusTone: Record<LessonPlanStatus, string> = {
  draft: 'border-slate-200 bg-slate-50 text-slate-700',
  submitted: 'border-indigo-200 bg-indigo-50 text-indigo-700',
  approved: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  rejected: 'border-red-200 bg-red-50 text-red-700',
};

const emptyForm = {
  title: '',
  class_schedule_id: '',
  plan_date: format(new Date(), 'yyyy-MM-dd'),
  objectives: '',
  competencies: '',
  materials: '',
  procedures: '',
  assessment: '',
  homework: '',
  notes: '',
};

const countWords = (value: string) => value.trim().split(/\s+/).filter(Boolean).length;

export const TeacherLessonPlansPage = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { data: teacherProfile } = useTeacherProfile(user?.id, user?.email);
  const { data: schoolId } = useSchoolId();
  const { selectedYearId } = useAcademicYear();
  const { isReadOnly, guardMutation } = useYearGuard();

  const { data: teacherSchedules = [], isLoading: loadingSchedules } = useTeacherSchedule(
    teacherProfile?.id,
    schoolId,
    selectedYearId,
    teacherProfile?.grade_level,
  );

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<LessonPlanRow | null>(null);
  const [viewingPlan, setViewingPlan] = useState<LessonPlanRow | null>(null);
  const [deletingPlan, setDeletingPlan] = useState<LessonPlanRow | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | LessonPlanStatus>('all');
  const [formData, setFormData] = useState(emptyForm);

  const assignedClasses = useMemo(() => {
    const unique = new Map<string, AssignedClassOption>();

    for (const row of teacherSchedules as any[]) {
      if (!row.id || !row.subject_id) continue;
      const key = `${row.id}-${row.subject_id}-${row.grade_level}-${row.section ?? 'n-a'}`;
      if (!unique.has(key)) {
        unique.set(key, {
          class_schedule_id: row.id,
          subject_id: row.subject_id,
          subject_name: row.subjects?.name || 'Unknown Subject',
          subject_code: row.subjects?.code || 'N/A',
          grade_level: row.grade_level,
          section: row.section,
        });
      }
    }

    return Array.from(unique.values());
  }, [teacherSchedules]);

  const selectedClass = useMemo(
    () => assignedClasses.find((entry) => entry.class_schedule_id === formData.class_schedule_id) || null,
    [assignedClasses, formData.class_schedule_id],
  );

  const formWordCount = useMemo(() => {
    return countWords([
      formData.objectives,
      formData.competencies,
      formData.materials,
      formData.procedures,
      formData.assessment,
      formData.homework,
      formData.notes,
    ].join(' '));
  }, [formData]);

  const { data: lessonPlans = [], isLoading } = useQuery({
    queryKey: ['teacher-lesson-plans', teacherProfile?.id, schoolId, selectedYearId, filterStatus],
    queryFn: async () => {
      if (!teacherProfile?.id || !schoolId || !selectedYearId) {
        return [] as LessonPlanRow[];
      }

      let query = supabase
        .from('teacher_lesson_plans')
        .select(`
          id,
          class_schedule_id,
          subject_id,
          title,
          plan_date,
          status,
          objectives,
          competencies,
          materials,
          procedures,
          assessment,
          homework,
          notes,
          review_notes,
          updated_at,
          subjects:subject_id(name, code),
          class_schedules:class_schedule_id(grade_level, section)
        `)
        .eq('teacher_id', teacherProfile.id)
        .eq('school_id', schoolId)
        .eq('academic_year_id', selectedYearId)
        .order('plan_date', { ascending: false })
        .order('created_at', { ascending: false });

      if (filterStatus !== 'all') {
        query = query.eq('status', filterStatus);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as unknown as LessonPlanRow[];
    },
    enabled: !!teacherProfile?.id && !!schoolId && !!selectedYearId,
  });

  const planStats = useMemo(() => {
    const counts = { total: lessonPlans.length, draft: 0, submitted: 0, approved: 0, rejected: 0 };
    for (const plan of lessonPlans) {
      counts[plan.status] += 1;
    }
    return counts;
  }, [lessonPlans]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!teacherProfile?.id || !schoolId || !selectedYearId) {
        throw new Error('Teacher profile or school context is missing');
      }

      const selected = assignedClasses.find((entry) => entry.class_schedule_id === formData.class_schedule_id);
      if (!selected) {
        throw new Error('Please select one of your assigned classes');
      }

      const payload = {
        school_id: schoolId,
        academic_year_id: selectedYearId,
        teacher_id: teacherProfile.id,
        class_schedule_id: selected.class_schedule_id,
        subject_id: selected.subject_id,
        title: formData.title.trim(),
        plan_date: formData.plan_date,
        objectives: formData.objectives.trim() || null,
        competencies: formData.competencies.trim() || null,
        materials: formData.materials.trim() || null,
        procedures: formData.procedures.trim() || null,
        assessment: formData.assessment.trim() || null,
        homework: formData.homework.trim() || null,
        notes: formData.notes.trim() || null,
      };

      if (editingPlan) {
        const { error } = await supabase
          .from('teacher_lesson_plans')
          .update(payload)
          .eq('id', editingPlan.id);
        if (error) throw error;
        return;
      }

      const { error } = await supabase.from('teacher_lesson_plans').insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher-lesson-plans'] });
      toast.success(editingPlan ? 'Lesson plan updated' : 'Lesson plan saved');
      handleCloseModal();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to save lesson plan');
    },
  });

  const submitMutation = useMutation({
    mutationFn: async (planId: string) => {
      const { error } = await supabase
        .from('teacher_lesson_plans')
        .update({ status: 'submitted' })
        .eq('id', planId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher-lesson-plans'] });
      toast.success('Lesson plan submitted for review');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to submit lesson plan');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (planId: string) => {
      const { error } = await supabase
        .from('teacher_lesson_plans')
        .delete()
        .eq('id', planId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher-lesson-plans'] });
      toast.success('Lesson plan deleted');
      setIsDeleteDialogOpen(false);
      setDeletingPlan(null);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete lesson plan');
    },
  });

  const buildDefaultForm = () => ({
    ...emptyForm,
    class_schedule_id: assignedClasses.length === 1 ? assignedClasses[0].class_schedule_id : '',
  });

  const handleOpenCreate = () => {
    setEditingPlan(null);
    setFormData(buildDefaultForm());
    setIsModalOpen(true);
  };

  const handleOpenEdit = (plan: LessonPlanRow) => {
    setEditingPlan(plan);
    setFormData({
      title: plan.title,
      class_schedule_id: plan.class_schedule_id || '',
      plan_date: plan.plan_date,
      objectives: plan.objectives || '',
      competencies: plan.competencies || '',
      materials: plan.materials || '',
      procedures: plan.procedures || '',
      assessment: plan.assessment || '',
      homework: plan.homework || '',
      notes: plan.notes || '',
    });
    setIsModalOpen(true);
  };

  const handleOpenView = (plan: LessonPlanRow) => {
    setViewingPlan(plan);
    setIsViewModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingPlan(null);
    setFormData(emptyForm);
  };

  const handleSave = (event: React.FormEvent) => {
    event.preventDefault();
    if (!guardMutation()) return;
    if (!formData.title.trim()) {
      toast.error('Title is required');
      return;
    }
    if (!formData.plan_date) {
      toast.error('Plan date is required');
      return;
    }
    if (!formData.class_schedule_id) {
      toast.error('Please select a class');
      return;
    }
    saveMutation.mutate();
  };

  const handleConfirmDelete = () => {
    if (!guardMutation() || !deletingPlan) return;
    deleteMutation.mutate(deletingPlan.id);
  };

  if (!teacherProfile) {
    return (
      <div className="space-y-6">
        <YearLockedBanner />
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            Teacher profile is missing. Please ask an administrator to link your account.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <YearLockedBanner />

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="overflow-hidden rounded-3xl border bg-gradient-to-br from-sky-50 via-white to-emerald-50 p-6 shadow-sm"
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <Badge variant="outline" className="mb-3 bg-white/80">
              Teacher Planning Workspace
            </Badge>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Lesson Plans</h1>
            <p className="text-muted-foreground mt-1">
              Build DepEd-style daily plans, submit for review, and keep your teaching flow organized.
            </p>
          </div>
          <Button onClick={handleOpenCreate} disabled={isReadOnly || assignedClasses.length === 0 || loadingSchedules}>
            <Plus className="h-4 w-4 mr-2" />
            New Lesson Plan
          </Button>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-sky-100">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <NotebookPen className="h-7 w-7 text-sky-600" />
              <div>
                <p className="text-2xl font-bold">{planStats.total}</p>
                <p className="text-xs text-muted-foreground">Total Plans</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-amber-100">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Clock3 className="h-7 w-7 text-amber-600" />
              <div>
                <p className="text-2xl font-bold">{planStats.draft}</p>
                <p className="text-xs text-muted-foreground">Drafts</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-indigo-100">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Send className="h-7 w-7 text-indigo-600" />
              <div>
                <p className="text-2xl font-bold">{planStats.submitted}</p>
                <p className="text-xs text-muted-foreground">Submitted</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-emerald-100">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-7 w-7 text-emerald-600" />
              <div>
                <p className="text-2xl font-bold">{planStats.approved}</p>
                <p className="text-xs text-muted-foreground">Approved</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="max-w-xs">
              <Label>Filter Status</Label>
              <Select value={filterStatus} onValueChange={(value) => setFilterStatus(value as 'all' | LessonPlanStatus)}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="submitted">Submitted</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="text-sm text-muted-foreground">
              {assignedClasses.length} assigned class{assignedClasses.length === 1 ? '' : 'es'} available for planning
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileCheck2 className="h-5 w-5" />
            My Lesson Plans
          </CardTitle>
          <CardDescription>Click a row to view the full plan. Drafts and rejected plans can be edited, submitted, or deleted.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
            </div>
          ) : lessonPlans.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              <BookOpenCheck className="mx-auto mb-3 h-10 w-10 opacity-40" />
              No lesson plans found in this school year.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Updated</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lessonPlans.map((plan) => (
                    <TableRow
                      key={plan.id}
                      className="cursor-pointer hover:bg-muted/60"
                      onClick={() => handleOpenView(plan)}
                    >
                      <TableCell>{format(new Date(plan.plan_date), 'MMM d, yyyy')}</TableCell>
                      <TableCell className="font-medium max-w-[260px] truncate">{plan.title}</TableCell>
                      <TableCell>
                        {plan.subjects?.name || 'Subject'}
                        <span className="text-muted-foreground ml-2 text-xs">
                          {plan.class_schedules?.grade_level || '-'}
                          {plan.class_schedules?.section ? ` - ${plan.class_schedules.section}` : ''}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusVariant[plan.status]}>{statusLabel[plan.status]}</Badge>
                      </TableCell>
                      <TableCell>{plan.updated_at ? format(new Date(plan.updated_at), 'MMM d, h:mm a') : '-'}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={(event) => {
                              event.stopPropagation();
                              handleOpenView(plan);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={(event) => {
                              event.stopPropagation();
                              handleOpenEdit(plan);
                            }}
                            disabled={isReadOnly}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          {(plan.status === 'draft' || plan.status === 'rejected') && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(event) => {
                                event.stopPropagation();
                                if (!guardMutation()) return;
                                submitMutation.mutate(plan.id);
                              }}
                              disabled={submitMutation.isPending || isReadOnly}
                            >
                              <Send className="h-4 w-4 mr-1" />
                              Submit
                            </Button>
                          )}
                          {(plan.status === 'draft' || plan.status === 'rejected') && (
                            <Button
                              size="icon"
                              variant="ghost"
                              className="text-destructive hover:text-destructive"
                              onClick={(event) => {
                                event.stopPropagation();
                                setDeletingPlan(plan);
                                setIsDeleteDialogOpen(true);
                              }}
                              disabled={isReadOnly}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
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

      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-[94vw] lg:max-w-4xl p-0 overflow-hidden">
          <DialogHeader className="border-b bg-gradient-to-r from-slate-50 to-sky-50 p-6">
            <DialogTitle>{viewingPlan?.title || 'Lesson Plan'}</DialogTitle>
            <div className="flex flex-wrap gap-2 pt-2">
              {viewingPlan && (
                <>
                  <Badge variant={statusVariant[viewingPlan.status]}>{statusLabel[viewingPlan.status]}</Badge>
                  <Badge variant="outline">{format(new Date(viewingPlan.plan_date), 'MMMM d, yyyy')}</Badge>
                  <Badge variant="outline">{viewingPlan.subjects?.name || 'Subject'}</Badge>
                </>
              )}
            </div>
          </DialogHeader>
          <ScrollArea className="max-h-[78vh]">
            {viewingPlan && (
              <div className="grid gap-4 p-6 md:grid-cols-2">
                {[
                  ['Objectives', viewingPlan.objectives],
                  ['Competencies', viewingPlan.competencies],
                  ['Materials', viewingPlan.materials],
                  ['Procedures', viewingPlan.procedures],
                  ['Assessment', viewingPlan.assessment],
                  ['Homework / Follow-up', viewingPlan.homework],
                  ['Teacher Notes', viewingPlan.notes],
                  ['Reviewer Notes', viewingPlan.review_notes],
                ].map(([label, value]) => (
                  <Card key={label} className={label === 'Procedures' ? 'md:col-span-2' : ''}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">{label}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                        {value || 'Not provided'}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <Dialog open={isModalOpen} onOpenChange={(open) => (open ? setIsModalOpen(true) : handleCloseModal())}>
        <DialogContent className="max-w-[96vw] lg:max-w-6xl p-0 overflow-hidden">
          <DialogHeader className="border-b bg-gradient-to-r from-sky-50 via-white to-emerald-50 p-6 pb-4">
            <DialogTitle>{editingPlan ? 'Edit Lesson Plan' : 'Create Lesson Plan'}</DialogTitle>
            <p className="text-sm text-muted-foreground">
              A structured workspace for objectives, competencies, materials, procedures, assessment, and follow-up.
            </p>
          </DialogHeader>
          <ScrollArea className="max-h-[78vh]">
            <form onSubmit={handleSave} className="p-6">
              <div className="grid gap-6 lg:grid-cols-[1.7fr_1fr]">
                <div className="space-y-5">
                  <Card className="border-sky-100 shadow-sm">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <CalendarDays className="h-4 w-4 text-sky-700" />
                        Lesson Setup
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Plan Date *</Label>
                          <Input
                            type="date"
                            value={formData.plan_date}
                            onChange={(event) => setFormData((prev) => ({ ...prev, plan_date: event.target.value }))}
                            className="h-11"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Class *</Label>
                          <Select
                            value={formData.class_schedule_id}
                            onValueChange={(value) => setFormData((prev) => ({ ...prev, class_schedule_id: value }))}
                          >
                            <SelectTrigger className="h-11">
                              <SelectValue placeholder={loadingSchedules ? 'Loading classes...' : 'Select class'} />
                            </SelectTrigger>
                            <SelectContent>
                              {assignedClasses.map((item) => (
                                <SelectItem key={item.class_schedule_id} value={item.class_schedule_id}>
                                  {item.subject_name} ({item.subject_code}) - {item.grade_level}
                                  {item.section ? ` ${item.section}` : ''}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Title *</Label>
                        <Input
                          value={formData.title}
                          onChange={(event) => setFormData((prev) => ({ ...prev, title: event.target.value }))}
                          placeholder="Example: Daily lesson plan - Addition with regrouping"
                          className="h-11"
                        />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="shadow-sm">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <Layers3 className="h-4 w-4 text-cyan-700" />
                        Curriculum Map
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Objectives</Label>
                        <Textarea
                          value={formData.objectives}
                          onChange={(event) => setFormData((prev) => ({ ...prev, objectives: event.target.value }))}
                          placeholder="What learners should achieve by the end of the lesson"
                          rows={6}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Competencies</Label>
                        <Textarea
                          value={formData.competencies}
                          onChange={(event) => setFormData((prev) => ({ ...prev, competencies: event.target.value }))}
                          placeholder="Curriculum competencies covered"
                          rows={6}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="shadow-sm">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <BookOpenCheck className="h-4 w-4 text-emerald-700" />
                        Teaching Flow
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label>Materials</Label>
                        <Textarea
                          value={formData.materials}
                          onChange={(event) => setFormData((prev) => ({ ...prev, materials: event.target.value }))}
                          placeholder="Books, worksheets, videos, manipulatives, and other materials"
                          rows={3}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Procedures</Label>
                        <Textarea
                          value={formData.procedures}
                          onChange={(event) => setFormData((prev) => ({ ...prev, procedures: event.target.value }))}
                          placeholder="Step-by-step lesson flow: motivation, discussion, activity, guided practice, independent work, closure"
                          rows={9}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="shadow-sm">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <FileCheck2 className="h-4 w-4 text-slate-700" />
                        Assessment & Follow-up
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Assessment</Label>
                        <Textarea
                          value={formData.assessment}
                          onChange={(event) => setFormData((prev) => ({ ...prev, assessment: event.target.value }))}
                          placeholder="How learner understanding will be checked"
                          rows={5}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Homework / Follow-up</Label>
                        <Textarea
                          value={formData.homework}
                          onChange={(event) => setFormData((prev) => ({ ...prev, homework: event.target.value }))}
                          placeholder="Post-class activities or homework"
                          rows={5}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="space-y-4">
                  <Card className={`shadow-sm ${editingPlan ? statusTone[editingPlan.status] : 'border-sky-100 bg-sky-50/60 text-sky-800'}`}>
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <Sparkles className="h-4 w-4" />
                        Plan Preview
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                      <div>
                        <p className="font-medium">Title</p>
                        <p className="text-muted-foreground">{formData.title || 'Untitled lesson plan'}</p>
                      </div>
                      <div>
                        <p className="font-medium">Class</p>
                        <p className="text-muted-foreground">
                          {selectedClass
                            ? `${selectedClass.subject_name} - ${selectedClass.grade_level}${selectedClass.section ? ` ${selectedClass.section}` : ''}`
                            : 'No class selected'}
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className="font-medium">Date</p>
                          <p className="text-muted-foreground">{formData.plan_date || '-'}</p>
                        </div>
                        <div>
                          <p className="font-medium">Words</p>
                          <p className="text-muted-foreground">{formWordCount}</p>
                        </div>
                      </div>
                      {editingPlan && (
                        <Badge variant={statusVariant[editingPlan.status]}>
                          {statusLabel[editingPlan.status]}
                        </Badge>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="shadow-sm">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Teacher Notes</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Textarea
                        value={formData.notes}
                        onChange={(event) => setFormData((prev) => ({ ...prev, notes: event.target.value }))}
                        placeholder="Private notes or reviewer context"
                        rows={8}
                      />
                    </CardContent>
                  </Card>

                  <Card className="border-amber-100 bg-amber-50/60 shadow-sm">
                    <CardContent className="pt-6 text-sm text-amber-900">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="mt-0.5 h-4 w-4" />
                        <p>
                          Drafts can be edited before submission. Once submitted, reviewers can approve or reject the plan.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              <DialogFooter className="sticky bottom-0 -mx-6 mt-6 border-t bg-background/95 px-6 py-4 backdrop-blur">
                <Button type="button" variant="outline" onClick={handleCloseModal}>
                  Cancel
                </Button>
                <Button type="submit" disabled={saveMutation.isPending || isReadOnly}>
                  {saveMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {editingPlan ? 'Update Plan' : 'Save Plan'}
                </Button>
              </DialogFooter>
            </form>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete lesson plan?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove "{deletingPlan?.title}". This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeletingPlan(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={deleteMutation.isPending || isReadOnly}
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
