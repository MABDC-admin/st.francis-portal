import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useStudentAssignments } from '@/hooks/useStudentPortalData';
import { ASSIGNMENT_TYPE_COLORS, type Assignment } from '@/types/studentPortal';
import { ClipboardList, Clock, CheckCircle, AlertTriangle, FileText } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { format, formatDistanceToNow, isPast } from 'date-fns';
import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { StudentPortalIcon, STUDENT_ICONS } from '@/components/icons/StudentPortalIcons';
import { Button } from '@/components/ui/button';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Upload, Camera, X, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ExternalLink, Paperclip, ImageIcon, VideoIcon, ChevronLeft } from 'lucide-react';
import { BuiltInMediaViewer } from '@/components/ui/BuiltInMediaViewer';
import { Attachment } from '@/components/ui/MultiFileUploader';

interface StudentAssignmentsTabProps {
  studentId: string;
  gradeLevel: string;
  schoolId: string;
  academicYearId: string;
}

const AssignmentCard = ({
  assignment,
  index,
  onClick
}: {
  assignment: Assignment;
  index: number;
  onClick: (assignment: Assignment) => void;
}) => {
  const dueDate = new Date(assignment.due_date);
  const isOverdue = isPast(dueDate) && (!assignment.submission || assignment.submission.status === 'pending');
  // Use subject icon mapping if available, else default
  const subjectName = assignment.subjects?.name || '';
  const icon = subjectName.toLowerCase().includes('math') ? STUDENT_ICONS.math :
    subjectName.toLowerCase().includes('science') ? STUDENT_ICONS.science :
      subjectName.toLowerCase().includes('english') ? STUDENT_ICONS.english :
        STUDENT_ICONS.assignments;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Card
        onClick={() => onClick(assignment)}
        className={cn(
          "group overflow-hidden rounded-[2rem] border-none shadow-sm transition-all hover:shadow-md hover:scale-[1.01] cursor-pointer active:scale-95",
          isOverdue ? 'bg-rose-50/50 border-rose-100 ring-1 ring-rose-200' : 'bg-white/80 backdrop-blur-sm'
        )}
      >
        <CardContent className="p-4 flex items-center gap-4">
          {/* Subject Icon Box */}
          <div className={cn(
            "w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-inner group-hover:scale-110 transition-transform",
            isOverdue ? "bg-rose-100" : "bg-sky-50"
          )}>
            <StudentPortalIcon
              icon={icon}
              size={32}
              className={cn(isOverdue ? "text-rose-500" : "text-sky-500")}
            />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                {assignment.subjects?.code || 'GEN'}
              </span>
              <Badge variant="outline" className="text-[9px] font-bold py-0 leading-none h-4 border-slate-200 text-slate-500">
                {assignment.assignment_type}
              </Badge>
            </div>
            <h3 className="font-black text-slate-800 text-base leading-tight truncate">
              {assignment.title}
            </h3>
            <div className="flex items-center gap-3 mt-1.5 font-bold text-[10px]">
              <div className={cn(
                "flex items-center gap-1",
                isOverdue ? "text-rose-600" : "text-slate-400"
              )}>
                <Clock className="h-3 w-3" />
                {isOverdue ? 'OVERDUE' : 'DUE'}: {format(dueDate, 'MMM d')}
              </div>
              {assignment.max_score && (
                <span className="text-slate-400">• {assignment.max_score} pts</span>
              )}
            </div>
          </div>

          {assignment.submission ? (
            <div className="text-right shrink-0">
              <div className={cn(
                "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter",
                assignment.submission.status === 'graded' ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
              )}>
                {assignment.submission.status}
              </div>
              {assignment.submission.score !== null && (
                <p className="text-base font-black text-slate-800 mt-1">
                  {assignment.submission.score}<span className="text-xs text-slate-400">/{assignment.max_score}</span>
                </p>
              )}
            </div>
          ) : (
            <div className="p-2 opacity-20 group-hover:opacity-100 transition-opacity">
              <StudentPortalIcon icon="fluent:chevron-right-24-filled" size={20} className="text-slate-400" />
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export const StudentAssignmentsTab = ({
  studentId,
  gradeLevel,
  schoolId,
  academicYearId,
}: StudentAssignmentsTabProps) => {
  const { pending, submitted, graded, overdue, isLoading } = useStudentAssignments(
    studentId,
    gradeLevel,
    schoolId,
    academicYearId
  );

  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionFile, setSubmissionFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewFile, setPreviewFile] = useState<Attachment | null>(null);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | 'all'>('all');
  const queryClient = useQueryClient();

  const handleOpenDetail = (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    setIsDetailOpen(true);
    setSubmissionFile(null);
    setUploadProgress(0);
  };

  const submitMutation = useMutation({
    mutationFn: async (assignmentId: string) => {
      if (!submissionFile) throw new Error("Please select a file to submit");

      setIsSubmitting(true);
      setUploadProgress(10);

      // 1. Upload file to storage
      const fileExt = submissionFile.name.split('.').pop();
      const fileName = `${studentId}/${assignmentId}/${Date.now()}.${fileExt}`;

      const { data: uploadData, error: uploadError } = await (supabase.storage
        .from('student-documents') as any) // Fallback and cast to any for progress support
        .upload(fileName, submissionFile, {
          upsert: true,
          onUploadProgress: (progress: any) => {
            setUploadProgress(Math.round((progress.loaded / progress.total) * 90));
          }
        });

      if (uploadError) throw uploadError;

      // 2. Get public URL
      const { data: urlData } = supabase.storage
        .from('student-documents')
        .getPublicUrl(fileName);

      // 3. Create or Update submission record
      const { error: submissionError } = await supabase
        .from('assignment_submissions')
        .upsert({
          assignment_id: assignmentId,
          student_id: studentId,
          status: 'submitted',
          submitted_at: new Date().toISOString(),
          attachments: {
            files: [{ name: submissionFile.name, url: urlData.publicUrl }]
          }
        }, { onConflict: 'assignment_id,student_id' });

      if (submissionError) throw submissionError;

      setUploadProgress(100);
      return urlData.publicUrl;
    },
    onSuccess: () => {
      toast.success("Assignment submitted successfully! 🎉");
      setIsDetailOpen(false);
      queryClient.invalidateQueries({ queryKey: ['assignment-submissions', studentId] });
      queryClient.invalidateQueries({ queryKey: ['assignments', gradeLevel, schoolId, academicYearId] });
    },
    onError: (error: any) => {
      console.error("Submission error:", error);
      toast.error(`Submission failed: ${error.message || "Unknown error"}`);
    },
    onSettled: () => {
      setIsSubmitting(false);
    }
  });

  const markAsDoneMutation = useMutation({
    mutationFn: async (assignmentId: string) => {
      setIsSubmitting(true);

      const { error } = await supabase
        .from('assignment_submissions')
        .upsert({
          assignment_id: assignmentId,
          student_id: studentId,
          status: 'submitted',
          submitted_at: new Date().toISOString(),
          attachments: {} // Empty attachments for non-submission tasks
        }, { onConflict: 'assignment_id,student_id' });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Task marked as done! 🎉");
      setIsDetailOpen(false);
      queryClient.invalidateQueries({ queryKey: ['assignment-submissions', studentId] });
      queryClient.invalidateQueries({ queryKey: ['assignments', gradeLevel, schoolId, academicYearId] });
    },
    onError: (error: any) => {
      toast.error(`Failed to mark as done: ${error.message}`);
    },
    onSettled: () => {
      setIsSubmitting(false);
    }
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSubmissionFile(e.target.files[0]);
    }
  };

  // Extract unique subjects from all assignments
  const subjectsList = useMemo(() => {
    const allAssignments = [...pending, ...overdue, ...submitted, ...graded];
    const uniqueSubjects = new Map();

    allAssignments.forEach(a => {
      if (a.subjects && !uniqueSubjects.has(a.subjects.id)) {
        uniqueSubjects.set(a.subjects.id, a.subjects);
      }
    });

    return Array.from(uniqueSubjects.values());
  }, [pending, overdue, submitted, graded]);

  // Filter assignments by subject
  const filterBySubject = (list: Assignment[]) => {
    if (selectedSubjectId === 'all') return list;
    return list.filter(a => a.subject_id === selectedSubjectId);
  };

  const filteredPending = useMemo(() => filterBySubject(pending), [pending, selectedSubjectId]);
  const filteredOverdue = useMemo(() => filterBySubject(overdue), [overdue, selectedSubjectId]);
  const filteredSubmissions = useMemo(() => filterBySubject([...submitted, ...graded]), [submitted, graded, selectedSubjectId]);

  if (isLoading) {
    return (
      <div className="space-y-4 p-4">
        <Skeleton className="h-64 w-full rounded-[3rem]" />
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 w-full rounded-[2rem]" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#FDFCF8] -m-4 sm:-m-0 rounded-t-[3rem] overflow-hidden">
      {/* Illustrative Header Img - Fully Flexible, No Cutting */}
      <div className="relative w-full overflow-hidden shrink-0">
        <img
          src="/assets/assignment-header.png"
          alt="Assignments"
          className="w-full h-auto block"
        />
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#FDFCF8] to-transparent" />
      </div>

      <div className="px-4 -mt-10 relative z-10 space-y-8">
        {/* Summary Bubbles */}
        <div className="grid grid-cols-4 gap-2 sm:gap-4 p-1 rounded-[2.5rem] bg-white/50 backdrop-blur-md shadow-lg border border-white/40">
          <div className="flex flex-col items-center py-4 bg-white/80 rounded-[2rem] shadow-sm">
            <span className="text-2xl font-black text-sky-500 leading-none">{pending.length}</span>
            <span className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-tighter">Tasks</span>
          </div>
          <div className="flex flex-col items-center py-4 bg-rose-50 rounded-[2rem] shadow-sm border border-rose-100">
            <span className="text-2xl font-black text-rose-500 leading-none">{overdue.length}</span>
            <span className="text-[10px] font-bold text-rose-400 mt-1 uppercase tracking-tighter">Late</span>
          </div>
          <div className="flex flex-col items-center py-4">
            <span className="text-2xl font-black text-slate-300 leading-none">{submitted.length}</span>
            <span className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-tighter">Done</span>
          </div>
          <div className="flex flex-col items-center py-4">
            <span className="text-2xl font-black text-emerald-400 leading-none">{graded.length}</span>
            <span className="text-[10px] font-bold text-emerald-500 mt-1 uppercase tracking-tighter">Score</span>
          </div>
        </div>

        {/* Subject Filter Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4">
          <button
            onClick={() => setSelectedSubjectId('all')}
            className={cn(
              "px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shrink-0 border-2",
              selectedSubjectId === 'all'
                ? "bg-sky-500 border-sky-500 text-white shadow-lg shadow-sky-200"
                : "bg-white border-slate-100 text-slate-400 hover:border-slate-200"
            )}
          >
            All Subjects
          </button>
          {subjectsList.map((subject) => (
            <button
              key={subject.id}
              onClick={() => setSelectedSubjectId(subject.id)}
              className={cn(
                "px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shrink-0 border-2",
                selectedSubjectId === subject.id
                  ? "bg-sky-500 border-sky-500 text-white shadow-lg shadow-sky-200"
                  : "bg-white border-slate-100 text-slate-400 hover:border-slate-200"
              )}
            >
              {subject.name}
            </button>
          ))}
        </div>

        {/* Categories Tabs */}
        <Tabs defaultValue="pending" className="w-full">
          <TabsList className="flex bg-transparent p-0 h-auto gap-4 mb-6 border-b border-slate-100 overflow-x-auto pb-2 scrollbar-hide">
            {[
              { val: 'pending', label: 'Waitlist', count: pending.length, color: 'sky' },
              { val: 'overdue', label: 'Overdue', count: overdue.length, color: 'rose' },
              { val: 'submitted', label: 'Finalized', count: submitted.length, color: 'slate' },
            ].map(t => (
              <TabsTrigger
                key={t.val}
                value={t.val}
                className={cn(
                  "p-0 bg-transparent shadow-none border-b-4 border-transparent rounded-none h-12 transition-all font-black text-sm px-1 shrink-0",
                  "data-[state=active]:border-sky-500 data-[state=active]:text-sky-600 text-slate-400"
                )}
              >
                {t.label} ({t.count})
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="pending" className="space-y-4 m-0">
            {filteredPending.length === 0 ? (
              <div className="py-20 text-center text-slate-400 font-bold opacity-30">
                <StudentPortalIcon icon={STUDENT_ICONS.completed} size={48} className="mx-auto mb-2" />
                No pending work!
              </div>
            ) : (
              filteredPending.map((a, i) => <AssignmentCard key={a.id} assignment={a} index={i} onClick={handleOpenDetail} />)
            )}
          </TabsContent>

          <TabsContent value="overdue" className="space-y-4 m-0">
            {filteredOverdue.length === 0 ? (
              <div className="py-20 text-center text-slate-400 font-bold opacity-30">
                All caught up! 🎉
              </div>
            ) : (
              filteredOverdue.map((a, i) => <AssignmentCard key={a.id} assignment={a} index={i} onClick={handleOpenDetail} />)
            )}
          </TabsContent>

          <TabsContent value="submitted" className="space-y-4 m-0">
            {filteredSubmissions.length === 0 ? (
              <div className="py-20 text-center text-slate-400 font-bold opacity-30">
                No submissions yet.
              </div>
            ) : (
              filteredSubmissions.map((a, i) => <AssignmentCard key={a.id} assignment={a} index={i} onClick={handleOpenDetail} />)
            )}
          </TabsContent>
        </Tabs>

        {/* Assignment Detail Dialog */}
        <Dialog open={isDetailOpen} onOpenChange={(open) => {
          setIsDetailOpen(open);
          if (!open) setPreviewFile(null);
        }}>
          <DialogContent className="max-w-[95vw] sm:max-w-xl rounded-[2.5rem] border-none shadow-2xl overflow-hidden p-0 bg-[#FDFCF8]">
            {previewFile ? (
              <div className="h-[80vh]">
                <BuiltInMediaViewer
                  url={previewFile.url}
                  name={previewFile.name}
                  type={previewFile.type}
                  onClose={() => setPreviewFile(null)}
                />
              </div>
            ) : selectedAssignment && (
              <div className="flex flex-col">
                <div className="relative h-32 bg-sky-50 overflow-hidden flex items-center justify-center">
                  <div className="absolute inset-0 bg-gradient-to-br from-sky-400/20 to-transparent" />
                  <StudentPortalIcon
                    icon={selectedAssignment.subjects?.name?.toLowerCase().includes('math') ? STUDENT_ICONS.math : STUDENT_ICONS.assignments}
                    size={64}
                    className="text-sky-500/30"
                  />
                </div>

                <ScrollArea className="max-h-[70vh]">
                  <div className="px-6 py-4 -mt-8 relative z-10 bg-[#FDFCF8] rounded-t-[2.5rem] flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={cn("rounded-full px-3", ASSIGNMENT_TYPE_COLORS[selectedAssignment.assignment_type]?.bg || "bg-sky-100")}>
                        <span className={cn("text-[10px] font-black uppercase tracking-widest", ASSIGNMENT_TYPE_COLORS[selectedAssignment.assignment_type]?.text || "text-sky-700")}>
                          {selectedAssignment.assignment_type}
                        </span>
                      </Badge>
                      <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
                        {selectedAssignment.subjects?.name}
                      </span>
                    </div>

                    <h2 className="text-2xl font-black text-slate-800 leading-tight mb-4">
                      {selectedAssignment.title}
                    </h2>

                    <div className="flex items-center gap-6 mb-6">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Due Date</span>
                        <div className="flex items-center gap-1 text-slate-700 font-black">
                          <Clock className="h-4 w-4" />
                          {format(new Date(selectedAssignment.due_date), 'MMMM d, h:mm a')}
                        </div>
                      </div>
                      {selectedAssignment.max_score !== null && (
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Max Score</span>
                          <div className="flex items-center gap-1 text-slate-700 font-black">
                            <ClipboardList className="h-4 w-4" />
                            {selectedAssignment.max_score} pts
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="space-y-6">
                      {selectedAssignment.description && (
                        <div>
                          <h4 className="text-[10px] font-black text-sky-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                            <FileText className="h-3 w-3" />
                            Description
                          </h4>
                          <p className="text-sm font-bold text-slate-600 leading-relaxed bg-white/50 p-4 rounded-3xl border border-slate-100">
                            {selectedAssignment.description}
                          </p>
                        </div>
                      )}

                      {selectedAssignment.instructions && (
                        <div>
                          <h4 className="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                            <AlertTriangle className="h-3 w-3" />
                            Instructions
                          </h4>
                          <div className="text-sm font-bold text-slate-600 leading-relaxed bg-rose-50/30 p-4 rounded-3xl border border-rose-100/50">
                            {selectedAssignment.instructions}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Submission Section */}
                    {!selectedAssignment.submission || selectedAssignment.submission.status === 'pending' || selectedAssignment.submission.status === 'returned' ? (
                      <div className="mt-8 space-y-4">
                        <div className="flex items-center justify-between border-t border-slate-100 pt-6 mb-2">
                          <h4 className="text-[10px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-2">
                            <CheckCircle className="h-4 w-4" />
                            Submit Your Work
                          </h4>
                        </div>

                        {/* Materials from Teacher section */}
                        {selectedAssignment.attachments && Array.isArray(selectedAssignment.attachments) && selectedAssignment.attachments.length > 0 && (
                          <div className="mb-6 space-y-3">
                            <h4 className="text-[10px] font-black text-amber-500 uppercase tracking-widest flex items-center gap-2">
                              <Paperclip className="h-3.5 w-3.5" />
                              Materials from Teacher
                            </h4>
                            <div className="grid grid-cols-1 gap-2">
                              {(selectedAssignment.attachments as any[]).map((file, idx) => (
                                <button
                                  key={idx}
                                  onClick={() => setPreviewFile(file)}
                                  className="flex items-center gap-3 p-3 bg-white/50 border border-slate-100 rounded-2xl hover:bg-white hover:border-sky-200 transition-all group w-full text-left"
                                >
                                  <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-sky-50 transition-colors">
                                    {file.type?.startsWith('image/') ? (
                                      <ImageIcon className="h-5 w-5 text-slate-500 group-hover:text-sky-500" />
                                    ) : file.type?.startsWith('video/') ? (
                                      <VideoIcon className="h-5 w-5 text-slate-500 group-hover:text-sky-500" />
                                    ) : (
                                      <FileText className="h-5 w-5 text-slate-500 group-hover:text-sky-500" />
                                    )}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <p className="text-xs font-bold text-slate-800 truncate">{file.name}</p>
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
                                      {file.type?.split('/')[1] || 'File'} • {file.size ? (file.size / 1024 / 1024).toFixed(2) + ' MB' : 'View'}
                                    </p>
                                  </div>
                                  <ExternalLink className="h-4 w-4 text-slate-300 group-hover:text-sky-500 transition-colors shrink-0" />
                                </button>
                              ))}
                            </div>
                          </div>
                        )}



                        {/* Non-Submission Task Interface */}
                        {selectedAssignment.submission_required === false && (
                          <div className="bg-sky-50/50 border border-sky-100 rounded-3xl p-6 text-center">
                            <div className="w-12 h-12 bg-sky-100 rounded-full flex items-center justify-center mx-auto mb-3 text-sky-600">
                              <CheckCircle className="h-6 w-6" />
                            </div>
                            <h4 className="font-bold text-slate-800 mb-1">No File Upload Required</h4>
                            <p className="text-xs text-slate-500 mb-4">
                              This task does not require a file submission. Simply mark it as done when you have completed it.
                            </p>
                            <Button
                              onClick={() => markAsDoneMutation.mutate(selectedAssignment.id)}
                              disabled={isSubmitting}
                              className="bg-sky-500 hover:bg-sky-600 text-white font-black rounded-xl w-full py-6 shadow-lg shadow-sky-200 transition-all active:scale-95"
                            >
                              {isSubmitting ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Marking as Done...
                                </>
                              ) : (
                                'Mark as Done'
                              )}
                            </Button>
                          </div>
                        )}

                        {/* File Upload Interface (Only if submission required) */}
                        {selectedAssignment.submission_required !== false && (
                          submissionFile ? (
                            <div className="bg-emerald-50/50 border border-emerald-100 rounded-3xl p-4 flex items-center justify-between">
                              <div className="flex items-center gap-3 overflow-hidden">
                                <div className="w-10 h-10 bg-emerald-100 rounded-2xl flex items-center justify-center shrink-0">
                                  <FileText className="h-5 w-5 text-emerald-600" />
                                </div>
                                <div className="min-w-0">
                                  <p className="text-sm font-bold text-slate-700 truncate">{submissionFile.name}</p>
                                  <p className="text-[10px] text-slate-400 font-bold">{(submissionFile.size / 1024 / 1024).toFixed(2)} MB</p>
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-slate-400 hover:text-rose-500 rounded-full"
                                onClick={() => setSubmissionFile(null)}
                                disabled={isSubmitting}
                              >
                                <X className="h-5 w-5" />
                              </Button>
                            </div>
                          ) : (
                            <div className="grid grid-cols-2 gap-3">
                              <Label className="cursor-pointer">
                                <Input
                                  type="file"
                                  className="hidden"
                                  onChange={handleFileChange}
                                  disabled={isSubmitting}
                                />
                                <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-200 rounded-[2rem] hover:border-sky-400 hover:bg-sky-50/30 transition-all gap-2 group">
                                  <div className="w-12 h-12 bg-sky-50 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <Upload className="h-6 w-6 text-sky-500" />
                                  </div>
                                  <span className="text-xs font-black text-slate-500">Upload File</span>
                                </div>
                              </Label>

                              <Label className="cursor-pointer">
                                <Input
                                  type="file"
                                  accept="image/*"
                                  capture="environment"
                                  className="hidden"
                                  onChange={handleFileChange}
                                  disabled={isSubmitting}
                                />
                                <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-200 rounded-[2rem] hover:border-emerald-400 hover:bg-emerald-50/30 transition-all gap-2 group">
                                  <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <Camera className="h-6 w-6 text-emerald-500" />
                                  </div>
                                  <span className="text-xs font-black text-slate-500">Use Camera</span>
                                </div>
                              </Label>
                            </div>
                          ))}

                        {isSubmitting && (
                          <div className="space-y-2">
                            <div className="flex justify-between items-center text-[10px] font-black text-slate-400 uppercase">
                              <span>{selectedAssignment.submission_required === false ? 'Processing...' : 'Uploading...'}</span>
                              <span>{uploadProgress}%</span>
                            </div>
                            <Progress value={uploadProgress} className="h-1.5 bg-slate-100" />
                          </div>
                        )}

                        <div className="mt-8 pt-6 border-t border-slate-100 flex gap-3">
                          <Button
                            variant="ghost"
                            onClick={() => setIsDetailOpen(false)}
                            className="font-black text-slate-400"
                            disabled={isSubmitting}
                          >
                            Later
                          </Button>
                          {selectedAssignment.submission_required !== false && (
                            <Button
                              onClick={() => submitMutation.mutate(selectedAssignment.id)}
                              disabled={!submissionFile || isSubmitting}
                              className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-2xl shadow-lg shadow-emerald-200 transition-all active:scale-95 disabled:opacity-50"
                            >
                              {isSubmitting ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Submitting...
                                </>
                              ) : (
                                'Turn In Assignment'
                              )}
                            </Button>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="mt-8 pt-6 border-t border-slate-100">
                        <div className="bg-sky-50/50 border border-sky-100 rounded-[2rem] p-6 text-center">
                          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                            <CheckCircle className="h-8 w-8 text-sky-500" />
                          </div>
                          <h4 className="font-black text-slate-800 text-lg mb-1">Assignment Turned In!</h4>
                          <p className="text-sm font-bold text-slate-500">
                            {selectedAssignment.submission.status === 'graded'
                              ? `You scored ${selectedAssignment.submission.score}/${selectedAssignment.max_score}!`
                              : "Your teacher is currently reviewing your work."}
                          </p>

                          <div className="mt-6 flex justify-center">
                            <Button
                              onClick={() => setIsDetailOpen(false)}
                              className="bg-sky-500 hover:bg-sky-600 text-white font-black rounded-2xl px-8 shadow-lg shadow-sky-200 transition-all active:scale-95"
                            >
                              Awesome!
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </div>
            )}
          </DialogContent>
        </Dialog>

        <div className="pb-32" />
      </div>
    </div>
  );
};
