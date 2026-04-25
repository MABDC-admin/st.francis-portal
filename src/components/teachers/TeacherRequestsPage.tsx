import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { BadgeCheck, Clock3, FileText, Loader2, Plus, Send, TriangleAlert } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useTeacherProfile } from '@/hooks/useTeacherData';
import { useSchoolId } from '@/hooks/useSchoolId';
import { useAcademicYear } from '@/contexts/AcademicYearContext';
import { useYearGuard } from '@/hooks/useYearGuard';
import { YearLockedBanner } from '@/components/ui/YearLockedBanner';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';

type RequestStatus = 'pending' | 'in_review' | 'approved' | 'rejected' | 'completed';
type RequestPriority = 'low' | 'normal' | 'high' | 'urgent';
type RequestType =
  | 'grade_submission'
  | 'class_list_correction'
  | 'schedule_adjustment'
  | 'lesson_plan_submission'
  | 'report_submission'
  | 'document_request'
  | 'other';

interface RequestRow {
  id: string;
  request_type: RequestType;
  subject: string;
  details: string;
  priority: RequestPriority;
  status: RequestStatus;
  requested_for_date: string | null;
  resolution_notes: string | null;
  created_at: string;
}

const statusVariant: Record<RequestStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  pending: 'secondary',
  in_review: 'outline',
  approved: 'default',
  rejected: 'destructive',
  completed: 'default',
};

const statusLabel: Record<RequestStatus, string> = {
  pending: 'Pending',
  in_review: 'In Review',
  approved: 'Approved',
  rejected: 'Rejected',
  completed: 'Completed',
};

const priorityVariant: Record<RequestPriority, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  low: 'outline',
  normal: 'secondary',
  high: 'default',
  urgent: 'destructive',
};

const typeLabel: Record<RequestType, string> = {
  grade_submission: 'Grade Submission',
  class_list_correction: 'Class List Correction',
  schedule_adjustment: 'Schedule Adjustment',
  lesson_plan_submission: 'Lesson Plan Submission',
  report_submission: 'Report Submission',
  document_request: 'Document Request',
  other: 'Other',
};

const emptyForm = {
  request_type: 'other' as RequestType,
  subject: '',
  details: '',
  priority: 'normal' as RequestPriority,
  requested_for_date: '',
};

export const TeacherRequestsPage = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { data: teacherProfile } = useTeacherProfile(user?.id, user?.email);
  const { data: schoolId } = useSchoolId();
  const { selectedYearId } = useAcademicYear();
  const { isReadOnly, guardMutation } = useYearGuard();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRequest, setEditingRequest] = useState<RequestRow | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | RequestStatus>('all');
  const [formData, setFormData] = useState(emptyForm);

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['teacher-requests', teacherProfile?.id, schoolId, selectedYearId, filterStatus],
    queryFn: async () => {
      if (!teacherProfile?.id || !schoolId || !selectedYearId) {
        return [] as RequestRow[];
      }

      let query = supabase
        .from('teacher_requests')
        .select('id, request_type, subject, details, priority, status, requested_for_date, resolution_notes, created_at')
        .eq('teacher_id', teacherProfile.id)
        .eq('school_id', schoolId)
        .eq('academic_year_id', selectedYearId)
        .order('created_at', { ascending: false });

      if (filterStatus !== 'all') {
        query = query.eq('status', filterStatus);
      }

      const { data, error } = await query;
      if (error) {
        throw error;
      }

      return (data || []) as RequestRow[];
    },
    enabled: !!teacherProfile?.id && !!schoolId && !!selectedYearId,
  });

  const requestStats = useMemo(() => {
    const counts = { total: requests.length, pending: 0, inReview: 0, approved: 0, urgent: 0 };
    for (const request of requests) {
      if (request.status === 'pending') {
        counts.pending += 1;
      }
      if (request.status === 'in_review') {
        counts.inReview += 1;
      }
      if (request.status === 'approved' || request.status === 'completed') {
        counts.approved += 1;
      }
      if (request.priority === 'urgent') {
        counts.urgent += 1;
      }
    }
    return counts;
  }, [requests]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!teacherProfile?.id || !schoolId || !selectedYearId) {
        throw new Error('Teacher profile or school context is missing');
      }

      const payload = {
        school_id: schoolId,
        academic_year_id: selectedYearId,
        teacher_id: teacherProfile.id,
        request_type: formData.request_type,
        subject: formData.subject.trim(),
        details: formData.details.trim(),
        priority: formData.priority,
        requested_for_date: formData.requested_for_date || null,
      };

      if (editingRequest) {
        const { error } = await supabase
          .from('teacher_requests')
          .update(payload)
          .eq('id', editingRequest.id);
        if (error) {
          throw error;
        }
        return;
      }

      const { error } = await supabase.from('teacher_requests').insert(payload);
      if (error) {
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher-requests'] });
      toast.success(editingRequest ? 'Request updated' : 'Request submitted');
      handleCloseModal();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to save request');
    },
  });

  const handleOpenCreate = () => {
    setEditingRequest(null);
    setFormData(emptyForm);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (request: RequestRow) => {
    setEditingRequest(request);
    setFormData({
      request_type: request.request_type,
      subject: request.subject,
      details: request.details,
      priority: request.priority,
      requested_for_date: request.requested_for_date || '',
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingRequest(null);
    setFormData(emptyForm);
  };

  const handleSave = (event: React.FormEvent) => {
    event.preventDefault();
    if (!guardMutation()) {
      return;
    }
    if (!formData.subject.trim()) {
      toast.error('Subject is required');
      return;
    }
    if (!formData.details.trim()) {
      toast.error('Please add request details');
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
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Requests</h1>
          <p className="text-muted-foreground mt-1">Submit and track teacher requests to admin and registrar.</p>
        </div>
        <Button onClick={handleOpenCreate} disabled={isReadOnly}>
          <Plus className="h-4 w-4 mr-2" />
          New Request
        </Button>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <FileText className="h-7 w-7 text-sky-600" />
              <div>
                <p className="text-2xl font-bold">{requestStats.total}</p>
                <p className="text-xs text-muted-foreground">Total Requests</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Clock3 className="h-7 w-7 text-amber-600" />
              <div>
                <p className="text-2xl font-bold">{requestStats.pending + requestStats.inReview}</p>
                <p className="text-xs text-muted-foreground">Open Requests</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <BadgeCheck className="h-7 w-7 text-emerald-600" />
              <div>
                <p className="text-2xl font-bold">{requestStats.approved}</p>
                <p className="text-xs text-muted-foreground">Approved / Done</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <TriangleAlert className="h-7 w-7 text-red-600" />
              <div>
                <p className="text-2xl font-bold">{requestStats.urgent}</p>
                <p className="text-xs text-muted-foreground">Urgent</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="max-w-xs">
            <Label>Filter Status</Label>
            <Select value={filterStatus} onValueChange={(value) => setFilterStatus(value as 'all' | RequestStatus)}>
              <SelectTrigger>
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in_review">In Review</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Request Tracker</CardTitle>
          <CardDescription>Follow up on submitted requests and admin decisions.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
            </div>
          ) : requests.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">No requests submitted yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Resolution Notes</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell>{format(new Date(request.created_at), 'MMM d, yyyy')}</TableCell>
                      <TableCell>{typeLabel[request.request_type]}</TableCell>
                      <TableCell className="font-medium">{request.subject}</TableCell>
                      <TableCell>
                        <Badge variant={priorityVariant[request.priority]}>{request.priority}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusVariant[request.status]}>{statusLabel[request.status]}</Badge>
                      </TableCell>
                      <TableCell className="max-w-[240px] truncate">
                        {request.resolution_notes || '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        {(request.status === 'pending' || request.status === 'rejected') && (
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleOpenEdit(request)}
                            disabled={isReadOnly}
                          >
                            <Send className="h-4 w-4" />
                          </Button>
                        )}
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
            <DialogTitle>{editingRequest ? 'Edit Request' : 'Submit Request'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Request Type *</Label>
                <Select
                  value={formData.request_type}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, request_type: value as RequestType }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="grade_submission">Grade Submission</SelectItem>
                    <SelectItem value="class_list_correction">Class List Correction</SelectItem>
                    <SelectItem value="schedule_adjustment">Schedule Adjustment</SelectItem>
                    <SelectItem value="lesson_plan_submission">Lesson Plan Submission</SelectItem>
                    <SelectItem value="report_submission">Report Submission</SelectItem>
                    <SelectItem value="document_request">Document Request</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, priority: value as RequestPriority }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Subject *</Label>
              <Input
                value={formData.subject}
                onChange={(event) => setFormData((prev) => ({ ...prev, subject: event.target.value }))}
                placeholder="Short summary of the request"
              />
            </div>

            <div className="space-y-2">
              <Label>Details *</Label>
              <Textarea
                value={formData.details}
                onChange={(event) => setFormData((prev) => ({ ...prev, details: event.target.value }))}
                rows={5}
                placeholder="Describe what you need and include the context for admin/registrar."
              />
            </div>

            <div className="space-y-2">
              <Label>Needed By (optional)</Label>
              <Input
                type="date"
                value={formData.requested_for_date}
                onChange={(event) => setFormData((prev) => ({ ...prev, requested_for_date: event.target.value }))}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseModal}>
                Cancel
              </Button>
              <Button type="submit" disabled={saveMutation.isPending}>
                {saveMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editingRequest ? 'Update Request' : 'Submit Request'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
