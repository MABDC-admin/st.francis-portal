import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, Clock, Loader2, FileEdit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useSchool } from '@/contexts/SchoolContext';
import { toast } from 'sonner';

interface PendingGrade {
  id: string;
  student_name: string;
  subject_name: string;
  academic_year: string;
  q1_grade: number | null;
  q2_grade: number | null;
  q3_grade: number | null;
  q4_grade: number | null;
  final_grade: number | null;
  status: string;
  submitted_at: string | null;
}

interface ChangeRequest {
  id: string;
  reason: string;
  old_values: any;
  new_values: any;
  status: string;
  review_notes: string | null;
  created_at: string;
  student_grade_id: string;
  student_name?: string;
  subject_name?: string;
}

export const GradeApprovalQueue = () => {
  const { selectedSchool } = useSchool();
  const [pendingGrades, setPendingGrades] = useState<PendingGrade[]>([]);
  const [changeRequests, setChangeRequests] = useState<ChangeRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [reviewDialog, setReviewDialog] = useState<{ open: boolean; requestId: string | null; action: 'approve' | 'reject' }>({ open: false, requestId: null, action: 'approve' });
  const [reviewNotes, setReviewNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    fetchData();
  }, [selectedSchool]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch grades pending approval (submitted status)
      const { data: gradesData } = await supabase
        .from('student_grades')
        .select(`
          id, q1_grade, q2_grade, q3_grade, q4_grade, final_grade, status, submitted_at,
          students:student_id (student_name),
          subjects:subject_id (name),
          academic_years:academic_year_id (name)
        `)
        .in('status', ['submitted', 'approved'])
        .order('submitted_at', { ascending: true });

      const formatted = (gradesData || []).map((g: any) => ({
        ...g,
        student_name: g.students?.student_name,
        subject_name: g.subjects?.name,
        academic_year: g.academic_years?.name,
      }));
      setPendingGrades(formatted);

      // Fetch pending change requests
      const { data: requestsData } = await supabase
        .from('grade_change_requests')
        .select(`
          *,
          student_grades:student_grade_id (
            students:student_id (student_name),
            subjects:subject_id (name)
          )
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: true });

      const formattedRequests = (requestsData || []).map((r: any) => ({
        ...r,
        student_name: r.student_grades?.students?.student_name,
        subject_name: r.student_grades?.subjects?.name,
      }));
      setChangeRequests(formattedRequests);
    } catch (error) {
      console.error('Error fetching approval data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGradeAction = async (gradeId: string, action: 'approve' | 'reject' | 'finalize') => {
    setIsProcessing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const now = new Date().toISOString();

      let updateData: any = {};
      if (action === 'approve') {
        updateData = { status: 'approved', approved_by: user?.id, approved_at: now };
      } else if (action === 'finalize') {
        updateData = { status: 'finalized', finalized_by: user?.id, finalized_at: now };
      } else {
        updateData = { status: 'draft' }; // Reject sends back to draft
      }

      const { error } = await supabase
        .from('student_grades')
        .update(updateData)
        .eq('id', gradeId);

      if (error) throw error;
      toast.success(`Grade ${action}${action === 'reject' ? 'ed' : 'd'} successfully`);
      fetchData();
    } catch (error: any) {
      toast.error(`Failed to ${action} grade`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleChangeRequestReview = async () => {
    if (!reviewDialog.requestId) return;
    setIsProcessing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const now = new Date().toISOString();

      // Update the change request
      const { error: reqError } = await supabase
        .from('grade_change_requests')
        .update({
          status: reviewDialog.action === 'approve' ? 'approved' : 'rejected',
          reviewed_by: user?.id,
          reviewed_at: now,
          review_notes: reviewNotes || null,
        })
        .eq('id', reviewDialog.requestId);

      if (reqError) throw reqError;

      // If approved, apply the changes to the grade
      if (reviewDialog.action === 'approve') {
        const request = changeRequests.find(r => r.id === reviewDialog.requestId);
        if (request) {
          const { error: gradeError } = await supabase
            .from('student_grades')
            .update(request.new_values)
            .eq('id', request.student_grade_id);

          if (gradeError) throw gradeError;
        }
      }

      toast.success(`Change request ${reviewDialog.action}d`);
      setReviewDialog({ open: false, requestId: null, action: 'approve' });
      setReviewNotes('');
      fetchData();
    } catch (error: any) {
      toast.error('Failed to process change request');
    } finally {
      setIsProcessing(false);
    }
  };

  const submittedGrades = pendingGrades.filter(g => g.status === 'submitted');
  const approvedGrades = pendingGrades.filter(g => g.status === 'approved');

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="text-xl font-bold text-foreground">Grade Approval Queue</h2>
        <p className="text-muted-foreground text-sm">Review and approve submitted grades and change requests</p>
      </motion.div>

      <Tabs defaultValue="pending" className="w-full">
        <TabsList>
          <TabsTrigger value="pending" className="gap-2">
            <Clock className="h-4 w-4" />
            Pending Approval
            {submittedGrades.length > 0 && <Badge variant="destructive" className="ml-1">{submittedGrades.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="finalize" className="gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Ready to Finalize
            {approvedGrades.length > 0 && <Badge className="ml-1 bg-amber-500">{approvedGrades.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="changes" className="gap-2">
            <FileEdit className="h-4 w-4" />
            Change Requests
            {changeRequests.length > 0 && <Badge variant="destructive" className="ml-1">{changeRequests.length}</Badge>}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Grades Awaiting Approval</CardTitle>
              <CardDescription>Submitted by teachers, awaiting department head approval</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
              ) : submittedGrades.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Year</TableHead>
                      <TableHead>Q1</TableHead>
                      <TableHead>Q2</TableHead>
                      <TableHead>Q3</TableHead>
                      <TableHead>Q4</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {submittedGrades.map(grade => (
                      <TableRow key={grade.id}>
                        <TableCell className="font-medium">{grade.student_name}</TableCell>
                        <TableCell>{grade.subject_name}</TableCell>
                        <TableCell>{grade.academic_year}</TableCell>
                        <TableCell>{grade.q1_grade ?? '-'}</TableCell>
                        <TableCell>{grade.q2_grade ?? '-'}</TableCell>
                        <TableCell>{grade.q3_grade ?? '-'}</TableCell>
                        <TableCell>{grade.q4_grade ?? '-'}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button size="sm" variant="default" onClick={() => handleGradeAction(grade.id, 'approve')} disabled={isProcessing}>
                              <CheckCircle2 className="h-3 w-3 mr-1" />Approve
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => handleGradeAction(grade.id, 'reject')} disabled={isProcessing}>
                              <XCircle className="h-3 w-3 mr-1" />Reject
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No grades pending approval</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="finalize" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Approved Grades — Ready to Finalize</CardTitle>
              <CardDescription>These grades have been approved and can now be finalized by admin</CardDescription>
            </CardHeader>
            <CardContent>
              {approvedGrades.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Year</TableHead>
                      <TableHead>Q1</TableHead>
                      <TableHead>Q2</TableHead>
                      <TableHead>Q3</TableHead>
                      <TableHead>Q4</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {approvedGrades.map(grade => (
                      <TableRow key={grade.id}>
                        <TableCell className="font-medium">{grade.student_name}</TableCell>
                        <TableCell>{grade.subject_name}</TableCell>
                        <TableCell>{grade.academic_year}</TableCell>
                        <TableCell>{grade.q1_grade ?? '-'}</TableCell>
                        <TableCell>{grade.q2_grade ?? '-'}</TableCell>
                        <TableCell>{grade.q3_grade ?? '-'}</TableCell>
                        <TableCell>{grade.q4_grade ?? '-'}</TableCell>
                        <TableCell>
                          <Button size="sm" onClick={() => handleGradeAction(grade.id, 'finalize')} disabled={isProcessing}>
                            <CheckCircle2 className="h-3 w-3 mr-1" />Finalize
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No grades ready to finalize</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="changes" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Pending Change Requests</CardTitle>
              <CardDescription>Requests to modify finalized grades</CardDescription>
            </CardHeader>
            <CardContent>
              {changeRequests.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Changes</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {changeRequests.map(req => (
                      <TableRow key={req.id}>
                        <TableCell className="font-medium">{req.student_name}</TableCell>
                        <TableCell>{req.subject_name}</TableCell>
                        <TableCell className="max-w-[200px] truncate">{req.reason}</TableCell>
                        <TableCell>
                          <div className="text-xs space-y-1">
                            {Object.entries(req.new_values || {}).map(([key, val]) => (
                              <div key={key}>
                                <span className="text-muted-foreground">{key}:</span>{' '}
                                <span className="line-through text-destructive">{(req.old_values as any)?.[key] ?? '-'}</span>{' → '}
                                <span className="text-green-600">{val as string ?? '-'}</span>
                              </div>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button size="sm" variant="default" onClick={() => setReviewDialog({ open: true, requestId: req.id, action: 'approve' })}>
                              Approve
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => setReviewDialog({ open: true, requestId: req.id, action: 'reject' })}>
                              Reject
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No pending change requests</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Review Dialog */}
      <Dialog open={reviewDialog.open} onOpenChange={(open) => { if (!open) setReviewDialog({ open: false, requestId: null, action: 'approve' }); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{reviewDialog.action === 'approve' ? 'Approve' : 'Reject'} Change Request</DialogTitle>
            <DialogDescription>Add optional notes for this decision</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label>Review Notes</Label>
            <Textarea
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
              placeholder="Optional notes..."
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReviewDialog({ open: false, requestId: null, action: 'approve' })}>Cancel</Button>
            <Button
              variant={reviewDialog.action === 'approve' ? 'default' : 'destructive'}
              onClick={handleChangeRequestReview}
              disabled={isProcessing}
            >
              {isProcessing && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {reviewDialog.action === 'approve' ? 'Approve & Apply' : 'Reject'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
