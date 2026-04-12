import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CheckCircle2, Clock3, Plus, XCircle } from 'lucide-react';
import { useSchool } from '@/contexts/SchoolContext';
import { useAcademicYear } from '@/contexts/AcademicYearContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

type ApprovalRequest = Tables<'finance_approval_requests'>;
type Student = Tables<'students'>;

const REQUEST_TYPES = [
  { value: 'discount', label: 'Discount' },
  { value: 'void_payment', label: 'Void Payment' },
  { value: 'refund', label: 'Refund' },
  { value: 'billing_adjustment', label: 'Billing Adjustment' },
  { value: 'other', label: 'Other' },
] as const;

const STATUS_OPTIONS = ['all', 'pending', 'approved', 'rejected', 'cancelled'] as const;

const badgeForStatus = (status: string) => {
  if (status === 'approved') return 'default';
  if (status === 'rejected') return 'destructive';
  if (status === 'cancelled') return 'secondary';
  return 'outline';
};

const toMoney = (value: number | null) => (value == null ? '—' : `₱${Number(value).toLocaleString()}`);

export const FinanceApprovalQueue = () => {
  const { selectedSchool } = useSchool();
  const { selectedYearId } = useAcademicYear();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [statusFilter, setStatusFilter] = useState<(typeof STATUS_OPTIONS)[number]>('pending');
  const [dialogOpen, setDialogOpen] = useState(false);

  const [requestType, setRequestType] = useState<(typeof REQUEST_TYPES)[number]['value']>('discount');
  const [studentId, setStudentId] = useState<string>('none');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');

  const { data: schoolData } = useQuery({
    queryKey: ['school-id', selectedSchool],
    queryFn: async () => {
      const { data, error } = await supabase.from('schools').select('id').eq('code', selectedSchool).single();
      if (error) throw error;
      return data;
    },
    enabled: !!selectedSchool,
  });

  const { data: requests = [] } = useQuery({
    queryKey: ['finance-approval-requests', schoolData?.id, selectedYearId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('finance_approval_requests')
        .select('*')
        .eq('school_id', schoolData!.id)
        .eq('academic_year_id', selectedYearId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!schoolData?.id && !!selectedYearId,
  });

  const { data: students = [] } = useQuery({
    queryKey: ['finance-approval-students', schoolData?.id, selectedYearId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('students')
        .select('id, student_name, lrn, level')
        .eq('school_id', schoolData!.id)
        .eq('academic_year_id', selectedYearId!)
        .order('student_name')
        .limit(300);
      if (error) throw error;
      return data as Pick<Student, 'id' | 'student_name' | 'lrn' | 'level'>[];
    },
    enabled: !!schoolData?.id && !!selectedYearId,
  });

  const studentMap = useMemo(() => {
    const map = new Map<string, Pick<Student, 'id' | 'student_name' | 'lrn' | 'level'>>();
    students.forEach((student) => map.set(student.id, student));
    return map;
  }, [students]);

  const filteredRequests = useMemo(() => {
    if (statusFilter === 'all') return requests as ApprovalRequest[];
    return (requests as ApprovalRequest[]).filter((request) => request.status === statusFilter);
  }, [requests, statusFilter]);

  const createRequest = useMutation({
    mutationFn: async () => {
      if (!reason.trim()) throw new Error('Reason is required.');

      const payload: TablesInsert<'finance_approval_requests'> = {
        school_id: schoolData!.id,
        academic_year_id: selectedYearId!,
        request_type: requestType,
        student_id: studentId === 'none' ? null : studentId,
        amount: amount.trim() ? Number(amount) : null,
        reason: reason.trim(),
        details: details.trim() ? { notes: details.trim() } : null,
        status: 'pending',
        requested_by: user?.id ?? null,
      };

      const { error } = await supabase.from('finance_approval_requests').insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Approval request created');
      setDialogOpen(false);
      setRequestType('discount');
      setStudentId('none');
      setAmount('');
      setReason('');
      setDetails('');
      queryClient.invalidateQueries({ queryKey: ['finance-approval-requests'] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const updateStatus = useMutation({
    mutationFn: async ({ requestId, status, notes }: { requestId: string; status: 'approved' | 'rejected' | 'cancelled'; notes?: string }) => {
      const payload: TablesUpdate<'finance_approval_requests'> = {
        status,
        decided_by: user?.id ?? null,
        decided_at: new Date().toISOString(),
        decision_notes: notes || null,
      };

      const { error } = await supabase.from('finance_approval_requests').update(payload).eq('id', requestId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance-approval-requests'] });
      toast.success('Request status updated');
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Finance Approval Queue</h1>
          <p className="text-muted-foreground">Manage discount, void, refund, and billing adjustment approvals.</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Request
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Approval Request</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Request Type</Label>
                <Select value={requestType} onValueChange={(value) => setRequestType(value as (typeof REQUEST_TYPES)[number]['value'])}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {REQUEST_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Student (Optional)</Label>
                <Select value={studentId} onValueChange={setStudentId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select student" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No specific student</SelectItem>
                    {students.map((student) => (
                      <SelectItem key={student.id} value={student.id}>
                        {student.student_name} ({student.lrn})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Amount (Optional)</Label>
                <Input type="number" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="0.00" />
              </div>

              <div>
                <Label>Reason</Label>
                <Textarea value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Why is this approval needed?" />
              </div>

              <div>
                <Label>Additional Notes</Label>
                <Textarea value={details} onChange={(event) => setDetails(event.target.value)} placeholder="Supporting details or references" />
              </div>

              <Button
                className="w-full"
                onClick={() => createRequest.mutate()}
                disabled={createRequest.isPending || !schoolData?.id || !selectedYearId}
              >
                Submit Request
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </motion.div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Clock3 className="h-5 w-5 text-primary" />
            Approval Requests
          </CardTitle>
          <div className="w-44">
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as (typeof STATUS_OPTIONS)[number])}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status === 'all' ? 'All statuses' : status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Student</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[200px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRequests.map((request) => {
                const student = request.student_id ? studentMap.get(request.student_id) : null;
                const isPending = request.status === 'pending';
                return (
                  <TableRow key={request.id}>
                    <TableCell>{new Date(request.created_at).toLocaleString()}</TableCell>
                    <TableCell className="capitalize">{request.request_type.replace(/_/g, ' ')}</TableCell>
                    <TableCell>
                      {student ? (
                        <div>
                          <p className="font-medium">{student.student_name}</p>
                          <p className="text-xs text-muted-foreground">{student.lrn} | {student.level}</p>
                        </div>
                      ) : (
                        '—'
                      )}
                    </TableCell>
                    <TableCell>{toMoney(request.amount)}</TableCell>
                    <TableCell className="max-w-[320px] truncate">{request.reason}</TableCell>
                    <TableCell>
                      <Badge variant={badgeForStatus(request.status)}>{request.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={!isPending || updateStatus.isPending}
                          onClick={() => updateStatus.mutate({ requestId: request.id, status: 'approved' })}
                        >
                          <CheckCircle2 className="h-4 w-4 mr-1 text-emerald-600" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={!isPending || updateStatus.isPending}
                          onClick={() => updateStatus.mutate({ requestId: request.id, status: 'rejected' })}
                        >
                          <XCircle className="h-4 w-4 mr-1 text-red-600" />
                          Reject
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {filteredRequests.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    No approval requests found for this filter.
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
