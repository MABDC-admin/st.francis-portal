import { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSchool } from '@/contexts/SchoolContext';
import { useAcademicYear } from '@/contexts/AcademicYearContext';
import { useAuth } from '@/contexts/AuthContext';
import { getSchoolId } from '@/utils/schoolIdMap';
import { toast } from 'sonner';
import { ClipboardList, Search, CheckCircle2, XCircle, Clock, Loader2, UserPlus, AlertCircle, X } from 'lucide-react';
import { EnrollmentWizard } from '@/components/enrollment/EnrollmentWizard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const GRADE_LEVELS = [
  'Kinder 1', 'Kinder 2',
  'Level 1', 'Level 2', 'Level 3', 'Level 4', 'Level 5',
  'Level 6', 'Level 7', 'Level 8', 'Level 9', 'Level 10',
  'Level 11', 'Level 12'
];

interface AdmissionRecord {
  id: string;
  student_name: string;
  lrn: string | null;
  level: string;
  school: string | null;
  school_id: string;
  academic_year_id: string;
  birth_date: string | null;
  gender: string | null;
  mother_maiden_name: string | null;
  mother_contact: string | null;
  father_name: string | null;
  father_contact: string | null;
  phil_address: string | null;
  uae_address: string | null;
  previous_school: string | null;
  parent_email: string | null;
  status: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  rejection_reason: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export const AdmissionsPage = () => {
  const { selectedSchool } = useSchool();
  const { selectedYearId } = useAcademicYear();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const schoolId = getSchoolId(selectedSchool);

  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showWizard, setShowWizard] = useState(false);
  const [showApproveDialog, setShowApproveDialog] = useState<AdmissionRecord | null>(null);
  const [showRejectDialog, setShowRejectDialog] = useState<AdmissionRecord | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showDetailDialog, setShowDetailDialog] = useState<AdmissionRecord | null>(null);

  // Note: newAdmission state and createAdmission mutation are no longer used
  // since we now use the EnrollmentWizard in admission mode

  // Fetch admissions
  const { data: admissions = [], isLoading } = useQuery({
    queryKey: ['admissions', schoolId, selectedYearId, statusFilter],
    queryFn: async () => {
      if (!schoolId || !selectedYearId) return [];
      let query = (supabase.from('admissions') as any)
        .select('*')
        .eq('school_id', schoolId)
        .eq('academic_year_id', selectedYearId)
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }
      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as AdmissionRecord[];
    },
    enabled: !!schoolId && !!selectedYearId,
  });

  const filtered = admissions.filter((a: AdmissionRecord) =>
    a.student_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (a.lrn && a.lrn.toLowerCase().includes(searchQuery.toLowerCase()))
  );


  // Approve admission
  const approveAdmission = useMutation({
    mutationFn: async (admission: AdmissionRecord) => {
      // 1. Update admission status
      const { error: updateError } = await (supabase.from('admissions') as any)
        .update({ status: 'approved', reviewed_by: user?.id, reviewed_at: new Date().toISOString() })
        .eq('id', admission.id);
      if (updateError) throw updateError;

      // 2. Create student record
      const { error: studentError } = await (supabase.from('students') as any).insert([{
        student_name: admission.student_name,
        lrn: admission.lrn || `TEMP-${Date.now()}`,
        level: admission.level,
        school: admission.school,
        school_id: admission.school_id,
        academic_year_id: admission.academic_year_id,
        birth_date: admission.birth_date,
        gender: admission.gender,
        mother_maiden_name: admission.mother_maiden_name,
        mother_contact: admission.mother_contact,
        father_name: admission.father_name,
        father_contact: admission.father_contact,
        phil_address: admission.phil_address,
        uae_address: admission.uae_address,
        previous_school: admission.previous_school,
      }]);
      if (studentError) throw studentError;

      // 3. Audit log
      await (supabase.from('admission_audit_logs') as any).insert([{
        admission_id: admission.id,
        action: 'approved',
        performed_by: user?.id,
        details: { student_name: admission.student_name },
      }]);

      // 4. Send emails (non-blocking)
      try {
        if (admission.parent_email) {
          await supabase.functions.invoke('send-admission-email', {
            body: {
              type: 'approval',
              to: admission.parent_email,
              studentName: admission.student_name,
              school: admission.school || selectedSchool,
              level: admission.level,
            },
          });
        }
      } catch (e) { console.error('Email send failed:', e); }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admissions'] });
      queryClient.invalidateQueries({ queryKey: ['students'] });
      toast.success('Admission approved and student record created');
      setShowApproveDialog(null);
    },
    onError: (e: Error) => toast.error('Approval failed: ' + e.message),
  });

  // Reject admission
  const rejectAdmission = useMutation({
    mutationFn: async ({ admission, reason }: { admission: AdmissionRecord; reason: string }) => {
      const { error } = await (supabase.from('admissions') as any)
        .update({ status: 'rejected', reviewed_by: user?.id, reviewed_at: new Date().toISOString(), rejection_reason: reason })
        .eq('id', admission.id);
      if (error) throw error;

      // Audit log
      await (supabase.from('admission_audit_logs') as any).insert([{
        admission_id: admission.id,
        action: 'rejected',
        performed_by: user?.id,
        details: { student_name: admission.student_name, reason },
      }]);

      // Send rejection email (non-blocking)
      try {
        if (admission.parent_email) {
          await supabase.functions.invoke('send-admission-email', {
            body: {
              type: 'rejection',
              to: admission.parent_email,
              studentName: admission.student_name,
              school: admission.school || selectedSchool,
              level: admission.level,
              rejectionReason: reason,
            },
          });
        }
      } catch (e) { console.error('Rejection email failed:', e); }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admissions'] });
      toast.success('Admission rejected');
      setShowRejectDialog(null);
      setRejectionReason('');
    },
    onError: (e: Error) => toast.error('Rejection failed: ' + e.message),
  });

  const statusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case 'approved': return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300"><CheckCircle2 className="h-3 w-3 mr-1" />Approved</Badge>;
      case 'rejected': return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const pendingCount = admissions.filter((a: AdmissionRecord) => a.status === 'pending').length;

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground flex items-center gap-2">
            <ClipboardList className="h-7 w-7 text-stat-purple" /> Admissions
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage enrollment applications {pendingCount > 0 && <span className="text-yellow-600 font-medium">• {pendingCount} pending</span>}
          </p>
        </div>
        <Button onClick={() => setShowWizard(true)} className="bg-stat-purple hover:bg-stat-purple/90 text-white gap-2">
          <UserPlus className="h-4 w-4" /> New Application
        </Button>
      </motion.div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by name or LRN..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <ClipboardList className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>No admission applications found</p>
        </div>
      ) : (
        <div className="rounded-lg border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student Name</TableHead>
                <TableHead>LRN</TableHead>
                <TableHead>Level</TableHead>
                <TableHead>Parent Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((admission: AdmissionRecord) => (
                <TableRow key={admission.id} className="cursor-pointer" onClick={() => setShowDetailDialog(admission)}>
                  <TableCell className="font-medium">{admission.student_name}</TableCell>
                  <TableCell className="text-muted-foreground">{admission.lrn || '—'}</TableCell>
                  <TableCell>{admission.level}</TableCell>
                  <TableCell className="text-muted-foreground">{admission.parent_email || '—'}</TableCell>
                  <TableCell>{statusBadge(admission.status)}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{new Date(admission.created_at).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                    {admission.status === 'pending' && (
                      <div className="flex gap-2 justify-end">
                        <Button size="sm" variant="outline" className="text-green-600 border-green-300 hover:bg-green-50" onClick={() => setShowApproveDialog(admission)}>
                          <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Approve
                        </Button>
                        <Button size="sm" variant="outline" className="text-red-600 border-red-300 hover:bg-red-50" onClick={() => setShowRejectDialog(admission)}>
                          <XCircle className="h-3.5 w-3.5 mr-1" /> Reject
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* New Application Wizard Dialog */}
      <Dialog open={showWizard} onOpenChange={setShowWizard}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>New Admission Application</DialogTitle>
            <DialogDescription>Submit a new enrollment application for review using the multi-step form.</DialogDescription>
          </DialogHeader>
          <EnrollmentWizard
            mode="admission"
            onComplete={() => {
              setShowWizard(false);
              queryClient.invalidateQueries({ queryKey: ['admissions'] });
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Approve Confirmation */}
      <AlertDialog open={!!showApproveDialog} onOpenChange={() => setShowApproveDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approve Admission</AlertDialogTitle>
            <AlertDialogDescription>
              This will approve <strong>{showApproveDialog?.student_name}</strong>'s admission and automatically create a student record. An email notification will be sent to the parent if an email is provided.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-green-600 hover:bg-green-700"
              onClick={() => showApproveDialog && approveAdmission.mutate(showApproveDialog)}
              disabled={approveAdmission.isPending}
            >
              {approveAdmission.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Approve & Create Record
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject Dialog */}
      <Dialog open={!!showRejectDialog} onOpenChange={() => { setShowRejectDialog(null); setRejectionReason(''); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Admission</DialogTitle>
            <DialogDescription>Provide a reason for rejecting <strong>{showRejectDialog?.student_name}</strong>'s admission.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-4">
            <Label>Rejection Reason <span className="text-destructive">*</span></Label>
            <Textarea placeholder="Enter reason for rejection..." value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} rows={3} />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => { setShowRejectDialog(null); setRejectionReason(''); }}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (!rejectionReason.trim()) { toast.error('Please provide a rejection reason'); return; }
                if (showRejectDialog) rejectAdmission.mutate({ admission: showRejectDialog, reason: rejectionReason });
              }}
              disabled={rejectAdmission.isPending}
            >
              {rejectAdmission.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={!!showDetailDialog} onOpenChange={() => setShowDetailDialog(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Admission Details</DialogTitle>
          </DialogHeader>
          {showDetailDialog && (
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Name</span><span className="font-medium">{showDetailDialog.student_name}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">LRN</span><span>{showDetailDialog.lrn || '—'}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Level</span><span>{showDetailDialog.level}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Status</span>{statusBadge(showDetailDialog.status)}</div>
              <div className="flex justify-between"><span className="text-muted-foreground">Gender</span><span>{showDetailDialog.gender || '—'}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Birth Date</span><span>{showDetailDialog.birth_date || '—'}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Parent Email</span><span>{showDetailDialog.parent_email || '—'}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Mother</span><span>{showDetailDialog.mother_maiden_name || '—'}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Father</span><span>{showDetailDialog.father_name || '—'}</span></div>
              {showDetailDialog.rejection_reason && (
                <div className="bg-red-50 p-3 rounded-lg border border-red-200">
                  <p className="text-red-700 font-medium text-xs mb-1">Rejection Reason</p>
                  <p className="text-red-600">{showDetailDialog.rejection_reason}</p>
                </div>
              )}
              <div className="flex justify-between"><span className="text-muted-foreground">Submitted</span><span>{new Date(showDetailDialog.created_at).toLocaleString()}</span></div>
              {showDetailDialog.reviewed_at && (
                <div className="flex justify-between"><span className="text-muted-foreground">Reviewed</span><span>{new Date(showDetailDialog.reviewed_at).toLocaleString()}</span></div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
