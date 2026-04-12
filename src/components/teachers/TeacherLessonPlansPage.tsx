import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { CheckCircle2, Clock3, Edit2, FileCheck2, Loader2, NotebookPen, Plus, Send } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useTeacherProfile } from '@/hooks/useTeacherData';
import { useSchoolId } from '@/hooks/useSchoolId';
import { useAcademicYear } from '@/contexts/AcademicYearContext';
import { useYearGuard } from '@/hooks/useYearGuard';
import { YearLockedBanner } from '@/components/ui/YearLockedBanner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';

type LessonPlanStatus = 'draft' | 'submitted' | 'approved' | 'rejected';

interface AssignedClassOption {
  class_schedule_id: string;
  subject_id: string;
  subject_name: string;
  subject_code: string;
  grade_level: string;
  section: string | null;
}

interface AssignedClassRow {
  id: string;
  subject_id: string;
  grade_level: string;
  section: string | null;
  subjects: {
    name: string | null;
    code: string | null;
  } | null;
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

export const TeacherLessonPlansPage = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { data: teacherProfile } = useTeacherProfile(user?.id);
  const { data: schoolId } = useSchoolId();
  const { selectedYearId } = useAcademicYear();
  const { isReadOnly, guardMutation } = useYearGuard();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<LessonPlanRow | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | LessonPlanStatus>('all');
  const [formData, setFormData] = useState(emptyForm);

  const { data: assignedClasses = [] } = useQuery({
    queryKey: ['teacher-assigned-classes-for-plans', teacherProfile?.id, schoolId, selectedYearId],
    queryFn: async () => {
      if (!teacherProfile?.id || !schoolId || !selectedYearId) {
        return [] as AssignedClassOption[];
      }

      const { data, error } = await supabase
        .from('class_schedules')
        .select('id, subject_id, grade_level, section, subjects:subject_id(name, code)')
        .eq('teacher_id', teacherProfile.id)
        .eq('school_id', schoolId)
        .eq('academic_year_id', selectedYearId)
        .order('grade_level', { ascending: true })
        .order('section', { ascending: true });

      if (error) {
        throw error;
      }

      const unique = new Map<string, AssignedClassOption>();
      for (const row of (data || []) as AssignedClassRow[]) {
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
    },
    enabled: !!teacherProfile?.id && !!schoolId && !!selectedYearId,
  });

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
      if (error) {
        throw error;
      }

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

      const selectedClass = assignedClasses.find((entry) => entry.class_schedule_id === formData.class_schedule_id);
      if (!selectedClass) {
        throw new Error('Please select an assigned class');
      }

      const payload = {
        school_id: schoolId,
        academic_year_id: selectedYearId,
        teacher_id: teacherProfile.id,
        class_schedule_id: selectedClass.class_schedule_id,
        subject_id: selectedClass.subject_id,
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

        if (error) {
          throw error;
        }
        return;
      }

      const { error } = await supabase.from('teacher_lesson_plans').insert(payload);
      if (error) {
        throw error;
      }
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

      if (error) {
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher-lesson-plans'] });
      toast.success('Lesson plan submitted for review');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to submit lesson plan');
    },
  });

  const handleOpenCreate = () => {
    setEditingPlan(null);
    setFormData(emptyForm);
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

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingPlan(null);
    setFormData(emptyForm);
  };

  const handleSave = (event: React.FormEvent) => {
    event.preventDefault();
    if (!guardMutation()) {
      return;
    }
    if (!formData.title.trim()) {
      toast.error('Title is required');
      return;
    }
    if (!formData.class_schedule_id) {
      toast.error('Please select a class');
      return;
    }
    saveMutation.mutate();
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
        className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Lesson Plans</h1>
          <p className="text-muted-foreground mt-1">Plan, submit, and monitor your daily or weekly lessons.</p>
        </div>
        <Button onClick={handleOpenCreate} disabled={isReadOnly}>
          <Plus className="h-4 w-4 mr-2" />
          New Lesson Plan
        </Button>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
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
        <Card>
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
        <Card>
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
        <Card>
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
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileCheck2 className="h-5 w-5" />
            My Lesson Plans
          </CardTitle>
          <CardDescription>Track draft plans, submissions, and review status.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
            </div>
          ) : lessonPlans.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">No lesson plans found in this school year.</p>
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
                    <TableRow key={plan.id}>
                      <TableCell>{format(new Date(plan.plan_date), 'MMM d, yyyy')}</TableCell>
                      <TableCell className="font-medium">{plan.title}</TableCell>
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
                            onClick={() => handleOpenEdit(plan)}
                            disabled={isReadOnly}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          {(plan.status === 'draft' || plan.status === 'rejected') && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                if (!guardMutation()) {
                                  return;
                                }
                                submitMutation.mutate(plan.id);
                              }}
                              disabled={submitMutation.isPending || isReadOnly}
                            >
                              <Send className="h-4 w-4 mr-1" />
                              Submit
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

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingPlan ? 'Edit Lesson Plan' : 'Create Lesson Plan'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Plan Date *</Label>
                <Input
                  type="date"
                  value={formData.plan_date}
                  onChange={(event) => setFormData((prev) => ({ ...prev, plan_date: event.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Class *</Label>
                <Select
                  value={formData.class_schedule_id}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, class_schedule_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select class" />
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
                placeholder="Daily lesson plan - Fractions"
              />
            </div>

            <div className="space-y-2">
              <Label>Objectives</Label>
              <Textarea
                value={formData.objectives}
                onChange={(event) => setFormData((prev) => ({ ...prev, objectives: event.target.value }))}
                placeholder="What learners should achieve by the end of the lesson"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Competencies</Label>
              <Textarea
                value={formData.competencies}
                onChange={(event) => setFormData((prev) => ({ ...prev, competencies: event.target.value }))}
                placeholder="Curriculum competencies covered"
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label>Materials</Label>
              <Textarea
                value={formData.materials}
                onChange={(event) => setFormData((prev) => ({ ...prev, materials: event.target.value }))}
                placeholder="Books, worksheets, videos, manipulatives, and other materials"
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label>Procedures</Label>
              <Textarea
                value={formData.procedures}
                onChange={(event) => setFormData((prev) => ({ ...prev, procedures: event.target.value }))}
                placeholder="Step-by-step lesson flow"
                rows={4}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Assessment</Label>
                <Textarea
                  value={formData.assessment}
                  onChange={(event) => setFormData((prev) => ({ ...prev, assessment: event.target.value }))}
                  placeholder="How learner understanding will be checked"
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label>Homework / Follow-up</Label>
                <Textarea
                  value={formData.homework}
                  onChange={(event) => setFormData((prev) => ({ ...prev, homework: event.target.value }))}
                  placeholder="Post-class activities or homework"
                  rows={2}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Teacher Notes</Label>
              <Textarea
                value={formData.notes}
                onChange={(event) => setFormData((prev) => ({ ...prev, notes: event.target.value }))}
                placeholder="Additional notes for the reviewer"
                rows={2}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseModal}>
                Cancel
              </Button>
              <Button type="submit" disabled={saveMutation.isPending}>
                {saveMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editingPlan ? 'Update Plan' : 'Save Plan'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
