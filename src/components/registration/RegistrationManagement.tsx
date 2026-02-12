import { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSchool } from '@/contexts/SchoolContext';
import { useAcademicYear } from '@/contexts/AcademicYearContext';
import { useAuth } from '@/contexts/AuthContext';
import { getSchoolId } from '@/utils/schoolIdMap';
import { toast } from 'sonner';
import { ClipboardList, Search, CheckCircle2, XCircle, Clock, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
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

interface RegistrationRecord {
  id: string;
  student_name: string;
  lrn: string | null;
  level: string;
  strand: string | null;
  birth_date: string | null;
  gender: string | null;
  religion: string | null;
  mother_maiden_name: string | null;
  mother_contact: string | null;
  father_name: string | null;
  father_contact: string | null;
  phil_address: string | null;
  current_address: string | null;
  previous_school: string | null;
  parent_email: string | null;
  mother_tongue: string | null;
  dialects: string | null;
  signature_data: string | null;
  agreements_accepted: Record<string, any> | null;
  school_id: string;
  academic_year_id: string;
  status: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
}

export const RegistrationManagement = () => {
  const { selectedSchool } = useSchool();
  const { selectedYearId } = useAcademicYear();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const schoolId = getSchoolId(selectedSchool);

  const [searchQuery, setSearchQuery] = useState('');
  const [showApproveDialog, setShowApproveDialog] = useState<RegistrationRecord | null>(null);
  const [showRejectDialog, setShowRejectDialog] = useState<RegistrationRecord | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showDetailDialog, setShowDetailDialog] = useState<RegistrationRecord | null>(null);

  const { data: registrations = [], isLoading } = useQuery({
    queryKey: ['online_registrations', schoolId, selectedYearId],
    queryFn: async () => {
      if (!schoolId || !selectedYearId) return [];
      const { data, error } = await (supabase.from('online_registrations') as any)
        .select('*')
        .eq('school_id', schoolId)
        .eq('academic_year_id', selectedYearId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as RegistrationRecord[];
    },
    enabled: !!schoolId && !!selectedYearId,
  });

  const filterByStatus = (status: string) =>
    registrations.filter((r: RegistrationRecord) =>
      r.status === status &&
      (r.student_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.lrn && r.lrn.toLowerCase().includes(searchQuery.toLowerCase())))
    );

  const pendingList = filterByStatus('pending');
  const approvedList = filterByStatus('approved');
  const rejectedList = filterByStatus('rejected');

  const approveRegistration = useMutation({
    mutationFn: async (reg: RegistrationRecord) => {
      const { error: updateError } = await (supabase.from('online_registrations') as any)
        .update({ status: 'approved', reviewed_by: user?.id, reviewed_at: new Date().toISOString() })
        .eq('id', reg.id);
      if (updateError) throw updateError;

      // Create student record
      const { error: studentError } = await (supabase.from('students') as any).insert([{
        student_name: reg.student_name,
        lrn: reg.lrn || `TEMP-${Date.now()}`,
        level: reg.level,
        school: selectedSchool,
        school_id: reg.school_id,
        academic_year_id: reg.academic_year_id,
        birth_date: reg.birth_date,
        gender: reg.gender,
        mother_maiden_name: reg.mother_maiden_name,
        mother_contact: reg.mother_contact,
        father_name: reg.father_name,
        father_contact: reg.father_contact,
        phil_address: reg.current_address || reg.phil_address,
        previous_school: reg.previous_school,
        mother_tongue: reg.mother_tongue,
        dialects: reg.dialects,
      }]);
      if (studentError) throw studentError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['online_registrations'] });
      queryClient.invalidateQueries({ queryKey: ['students'] });
      toast.success('Registration approved and student record created');
      setShowApproveDialog(null);
    },
    onError: (e: Error) => toast.error('Approval failed: ' + e.message),
  });

  const rejectRegistration = useMutation({
    mutationFn: async ({ reg, reason }: { reg: RegistrationRecord; reason: string }) => {
      const { error } = await (supabase.from('online_registrations') as any)
        .update({ status: 'rejected', reviewed_by: user?.id, reviewed_at: new Date().toISOString(), rejection_reason: reason })
        .eq('id', reg.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['online_registrations'] });
      toast.success('Registration rejected');
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

  const renderTable = (list: RegistrationRecord[], showActions: boolean) => {
    if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
    if (list.length === 0) return (
      <div className="text-center py-12 text-muted-foreground">
        <ClipboardList className="h-12 w-12 mx-auto mb-3 opacity-30" />
        <p>No records found</p>
      </div>
    );

    return (
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
              {showActions && <TableHead className="text-right">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.map((reg) => (
              <TableRow key={reg.id} className="cursor-pointer" onClick={() => setShowDetailDialog(reg)}>
                <TableCell className="font-medium">{reg.student_name}</TableCell>
                <TableCell className="text-muted-foreground">{reg.lrn || '—'}</TableCell>
                <TableCell>{reg.level}</TableCell>
                <TableCell className="text-muted-foreground">{reg.parent_email || '—'}</TableCell>
                <TableCell>{statusBadge(reg.status)}</TableCell>
                <TableCell className="text-muted-foreground text-sm">{new Date(reg.created_at).toLocaleDateString()}</TableCell>
                {showActions && (
                  <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex gap-2 justify-end">
                      <Button size="sm" variant="outline" className="text-green-600 border-green-300 hover:bg-green-50" onClick={() => setShowApproveDialog(reg)}>
                        <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Approve
                      </Button>
                      <Button size="sm" variant="outline" className="text-red-600 border-red-300 hover:bg-red-50" onClick={() => setShowRejectDialog(reg)}>
                        <XCircle className="h-3.5 w-3.5 mr-1" /> Reject
                      </Button>
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl lg:text-3xl font-bold text-foreground flex items-center gap-2">
          <ClipboardList className="h-7 w-7 text-stat-purple" /> Online Registrations
        </h1>
        <p className="text-muted-foreground mt-1">
          Manage online registration applications {pendingList.length > 0 && <span className="text-yellow-600 font-medium">• {pendingList.length} pending</span>}
        </p>
      </motion.div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search by name or LRN..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
      </div>

      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pending"><Clock className="h-3.5 w-3.5 mr-1" /> Pending ({pendingList.length})</TabsTrigger>
          <TabsTrigger value="approved"><CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Approved ({approvedList.length})</TabsTrigger>
          <TabsTrigger value="rejected"><XCircle className="h-3.5 w-3.5 mr-1" /> Rejected ({rejectedList.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="pending">{renderTable(pendingList, true)}</TabsContent>
        <TabsContent value="approved">{renderTable(approvedList, false)}</TabsContent>
        <TabsContent value="rejected">{renderTable(rejectedList, false)}</TabsContent>
      </Tabs>

      {/* Approve Confirmation */}
      <AlertDialog open={!!showApproveDialog} onOpenChange={() => setShowApproveDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approve Registration</AlertDialogTitle>
            <AlertDialogDescription>
              This will approve <strong>{showApproveDialog?.student_name}</strong>'s registration and create a student record.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-green-600 hover:bg-green-700" onClick={() => showApproveDialog && approveRegistration.mutate(showApproveDialog)} disabled={approveRegistration.isPending}>
              {approveRegistration.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Approve & Create Record
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject Dialog */}
      <Dialog open={!!showRejectDialog} onOpenChange={() => { setShowRejectDialog(null); setRejectionReason(''); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Registration</DialogTitle>
            <DialogDescription>Provide a reason for rejecting <strong>{showRejectDialog?.student_name}</strong>'s registration.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-4">
            <Label>Rejection Reason <span className="text-destructive">*</span></Label>
            <Textarea placeholder="Enter reason..." value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} rows={3} />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => { setShowRejectDialog(null); setRejectionReason(''); }}>Cancel</Button>
            <Button variant="destructive" onClick={() => {
              if (!rejectionReason.trim()) { toast.error('Please provide a reason'); return; }
              if (showRejectDialog) rejectRegistration.mutate({ reg: showRejectDialog, reason: rejectionReason });
            }} disabled={rejectRegistration.isPending}>
              {rejectRegistration.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={!!showDetailDialog} onOpenChange={() => setShowDetailDialog(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Registration Details</DialogTitle></DialogHeader>
          {showDetailDialog && (
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Name</span><span className="font-medium">{showDetailDialog.student_name}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">LRN</span><span>{showDetailDialog.lrn || '—'}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Level</span><span>{showDetailDialog.level}</span></div>
              {showDetailDialog.strand && <div className="flex justify-between"><span className="text-muted-foreground">Strand</span><span>{showDetailDialog.strand}</span></div>}
              <div className="flex justify-between"><span className="text-muted-foreground">Status</span>{statusBadge(showDetailDialog.status)}</div>
              <div className="flex justify-between"><span className="text-muted-foreground">Gender</span><span>{showDetailDialog.gender || '—'}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Religion</span><span>{showDetailDialog.religion || '—'}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Birth Date</span><span>{showDetailDialog.birth_date || '—'}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Email</span><span>{showDetailDialog.parent_email || '—'}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Mother</span><span>{showDetailDialog.mother_maiden_name || '—'}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Father</span><span>{showDetailDialog.father_name || '—'}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Current Address</span><span>{showDetailDialog.current_address || showDetailDialog.phil_address || '—'}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Mother Tongue</span><span>{showDetailDialog.mother_tongue || '—'}</span></div>
              {showDetailDialog.signature_data && (
                <div className="space-y-1">
                  <span className="text-muted-foreground">Signature</span>
                  <img src={showDetailDialog.signature_data} alt="Signature" className="border rounded h-16 bg-white" />
                </div>
              )}
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
