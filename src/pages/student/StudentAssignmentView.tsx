import { useParams, useNavigate } from 'react-router-dom';
import { useStudentAssignment } from '@/hooks/useStudentPortalData';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Clock, ClipboardList, FileText, AlertTriangle, CheckCircle, Paperclip, ImageIcon, VideoIcon, ExternalLink, Loader2, Upload, Camera, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ASSIGNMENT_TYPE_COLORS } from '@/types/studentPortal';
import { format } from 'date-fns';
import { StudentPortalIcon, STUDENT_ICONS } from '@/components/icons/StudentPortalIcons';
import { Skeleton } from '@/components/ui/skeleton';
import { useState, useEffect } from 'react';
import { Attachment } from '@/components/ui/MultiFileUploader';
import { BuiltInMediaViewer } from '@/components/ui/BuiltInMediaViewer';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';

export default function StudentAssignmentView() {
    const { studentId, assignmentId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth(); // We might need studentId from auth if param is not reliable, but param should be there.

    // Use the ID from params, fallback to auth if needed (though route has it)
    const effectiveStudentId = studentId;

    const { data: assignment, isLoading, error } = useStudentAssignment(assignmentId, effectiveStudentId || null);
    const [activeMedia, setActiveMedia] = useState<Attachment | null>(null);

    const [submissionFile, setSubmissionFile] = useState<File | null>(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const queryClient = useQueryClient();

    // Scroll to top on mount
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const submitMutation = useMutation({
        mutationFn: async (assignmentId: string) => {
            if (!submissionFile || !effectiveStudentId) throw new Error("Missing file or student ID");

            setIsSubmitting(true);
            setUploadProgress(10);

            // 1. Upload file to storage
            const fileExt = submissionFile.name.split('.').pop();
            const fileName = `${effectiveStudentId}/${assignmentId}/${Date.now()}.${fileExt}`;

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
                    student_id: effectiveStudentId,
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
            setSubmissionFile(null);
            queryClient.invalidateQueries({ queryKey: ['student-assignment', assignmentId] });
            queryClient.invalidateQueries({ queryKey: ['assignment-submissions'] });
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
            if (!effectiveStudentId) throw new Error("Missing student ID");
            setIsSubmitting(true);

            const { error } = await supabase
                .from('assignment_submissions')
                .upsert({
                    assignment_id: assignmentId,
                    student_id: effectiveStudentId,
                    status: 'submitted',
                    submitted_at: new Date().toISOString(),
                    attachments: {} // Empty attachments for non-submission tasks
                }, { onConflict: 'assignment_id,student_id' });

            if (error) throw error;
        },
        onSuccess: () => {
            toast.success("Task marked as done! 🎉");
            queryClient.invalidateQueries({ queryKey: ['student-assignment', assignmentId] });
            queryClient.invalidateQueries({ queryKey: ['assignment-submissions'] });
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

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#FDFCF8] p-4 space-y-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <Skeleton className="h-64 w-full rounded-[2.5rem]" />
                <Skeleton className="h-32 w-full rounded-3xl" />
            </div>
        );
    }

    if (error || !assignment) {
        return (
            <div className="min-h-screen bg-[#FDFCF8] flex flex-col items-center justify-center p-4">
                <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mb-4">
                    <AlertTriangle className="h-10 w-10 text-rose-500" />
                </div>
                <h2 className="text-xl font-black text-slate-800">Assignment Not Found</h2>
                <Button onClick={() => navigate(-1)} variant="ghost" className="mt-4">
                    Go Back
                </Button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#FDFCF8]">
            {/* Sticky Navigation Header - Minimal */}
            <div className="sticky top-0 z-50 bg-[#FDFCF8]/90 backdrop-blur-md border-b border-slate-100 px-4 py-3 flex items-center gap-4">
                <Button
                    onClick={() => navigate(-1)}
                    variant="ghost"
                    size="icon"
                    className="rounded-full hover:bg-slate-100 text-slate-500"
                >
                    <ChevronLeft className="h-6 w-6" />
                </Button>
                <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                        {assignment.subjects?.name || 'General'}
                    </p>
                    <h1 className="text-sm font-bold text-slate-800 truncate">
                        {assignment.title}
                    </h1>
                </div>
                <Badge className={cn("rounded-full px-2.5", ASSIGNMENT_TYPE_COLORS[assignment.assignment_type]?.bg || "bg-sky-100")}>
                    <span className={cn("text-[9px] font-black uppercase tracking-widest", ASSIGNMENT_TYPE_COLORS[assignment.assignment_type]?.text || "text-sky-700")}>
                        {assignment.assignment_type}
                    </span>
                </Badge>
            </div>

            <div className="p-4 max-w-3xl mx-auto space-y-6 pb-20">
                {/* Main Content Card */}
                <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100/50 overflow-hidden">

                    <div className="px-6 py-6 space-y-6">
                        <h2 className="text-2xl font-black text-slate-800 leading-tight">
                            {assignment.title}
                        </h2>

                        <div className="flex flex-wrap items-center gap-6">
                            <div className="flex flex-col">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Due Date</span>
                                <div className="flex items-center gap-1 text-slate-700 font-black">
                                    <Clock className="h-4 w-4" />
                                    {format(new Date(assignment.due_date), 'MMMM d, h:mm a')}
                                </div>
                            </div>
                            {assignment.max_score !== null && (
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Max Score</span>
                                    <div className="flex items-center gap-1 text-slate-700 font-black">
                                        <ClipboardList className="h-4 w-4" />
                                        {assignment.max_score} pts
                                    </div>
                                </div>
                            )}
                        </div>

                        {assignment.description && (
                            <div className="space-y-2">
                                <h4 className="text-[10px] font-black text-sky-500 uppercase tracking-widest flex items-center gap-2">
                                    <FileText className="h-3 w-3" />
                                    Description
                                </h4>
                                <p className="text-sm font-medium text-slate-600 leading-relaxed bg-slate-50/50 p-4 rounded-3xl border border-slate-100/50 whitespace-pre-wrap">
                                    {assignment.description}
                                </p>
                            </div>
                        )}

                        {assignment.instructions && (
                            <div className="space-y-2">
                                <h4 className="text-[10px] font-black text-rose-500 uppercase tracking-widest flex items-center gap-2">
                                    <AlertTriangle className="h-3 w-3" />
                                    Instructions
                                </h4>
                                <div className="text-sm font-medium text-slate-600 leading-relaxed bg-rose-50/30 p-4 rounded-3xl border border-rose-100/50 whitespace-pre-wrap">
                                    {assignment.instructions}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Media / Materials Section */}
                {assignment.attachments && Array.isArray(assignment.attachments) && assignment.attachments.length > 0 && (
                    <div className="space-y-4">
                        <h3 className="text-sm font-black text-slate-800 px-2 flex items-center gap-2">
                            <Paperclip className="h-4 w-4 text-amber-500" />
                            Attached Materials
                        </h3>

                        {/* Integrated Media Player for Active Item */}
                        {activeMedia && (
                            <div className="rounded-[2rem] overflow-hidden shadow-xl border border-slate-200 bg-black relative">
                                <div className="aspect-video w-full">
                                    <BuiltInMediaViewer
                                        url={activeMedia.url}
                                        name={activeMedia.name}
                                        type={activeMedia.type || 'application/octet-stream'}
                                        onClose={() => setActiveMedia(null)}
                                    />
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {(assignment.attachments as any[]).map((file, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setActiveMedia(file)}
                                    className={cn(
                                        "flex items-center gap-3 p-3 rounded-2xl border transition-all text-left outline-none group",
                                        activeMedia?.url === file.url ? "bg-sky-50 border-sky-300 ring-2 ring-sky-100" : "bg-white border-slate-100 hover:border-sky-300 shadow-sm"
                                    )}
                                >
                                    <div className={cn(
                                        "w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-colors",
                                        file.type?.startsWith('image/') ? "bg-purple-100 text-purple-600" :
                                            file.type?.startsWith('video/') ? "bg-rose-100 text-rose-600" :
                                                "bg-amber-100 text-amber-600"
                                    )}>
                                        {file.type?.startsWith('image/') ? <ImageIcon className="h-6 w-6" /> :
                                            file.type?.startsWith('video/') ? <VideoIcon className="h-6 w-6" /> :
                                                <FileText className="h-6 w-6" />}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-xs font-bold text-slate-800 truncate">{file.name}</p>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                                            Tap to View
                                        </p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Submission Status Section */}
                <div className="space-y-4">
                    <h3 className="text-sm font-black text-slate-800 px-2 flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-emerald-500" />
                        Your Work
                    </h3>

                    {!assignment.submission || assignment.submission.status === 'pending' || assignment.submission.status === 'returned' ? (
                        <div className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-slate-100 space-y-6">
                            {/* Submission Logic */}
                            {assignment.submission_required === false ? (
                                <div className="text-center space-y-4">
                                    <div className="w-16 h-16 bg-sky-50 rounded-full flex items-center justify-center mx-auto text-sky-500">
                                        <CheckCircle className="h-8 w-8" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-800">No File Required</p>
                                        <p className="text-xs text-slate-500">Just mark this as done when you're finished.</p>
                                    </div>
                                    <Button
                                        onClick={() => markAsDoneMutation.mutate(assignment.id)}
                                        disabled={isSubmitting}
                                        className="w-full bg-sky-500 hover:bg-sky-600 text-white font-black rounded-2xl py-6 shadow-lg shadow-sky-200"
                                    >
                                        {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...</> : 'Mark as Done'}
                                    </Button>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {submissionFile ? (
                                        <div className="bg-emerald-50 border border-emerald-100 rounded-3xl p-4 flex items-center justify-between">
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
                                                <Input type="file" className="hidden" onChange={handleFileChange} disabled={isSubmitting} />
                                                <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-200 rounded-[2rem] hover:border-sky-400 hover:bg-sky-50/30 transition-all gap-2 group aspect-square">
                                                    <div className="w-12 h-12 bg-sky-50 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                                                        <Upload className="h-6 w-6 text-sky-500" />
                                                    </div>
                                                    <span className="text-xs font-black text-slate-500">Upload File</span>
                                                </div>
                                            </Label>
                                            <Label className="cursor-pointer">
                                                <Input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileChange} disabled={isSubmitting} />
                                                <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-200 rounded-[2rem] hover:border-emerald-400 hover:bg-emerald-50/30 transition-all gap-2 group aspect-square">
                                                    <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                                                        <Camera className="h-6 w-6 text-emerald-500" />
                                                    </div>
                                                    <span className="text-xs font-black text-slate-500">Use Camera</span>
                                                </div>
                                            </Label>
                                        </div>
                                    )}

                                    {isSubmitting && (
                                        <div className="space-y-2">
                                            <div className="flex justify-between items-center text-[10px] font-black text-slate-400 uppercase">
                                                <span>Uploading...</span>
                                                <span>{uploadProgress}%</span>
                                            </div>
                                            <Progress value={uploadProgress} className="h-2 bg-slate-100" />
                                        </div>
                                    )}

                                    <Button
                                        onClick={() => submitMutation.mutate(assignment.id)}
                                        disabled={!submissionFile || isSubmitting}
                                        className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-2xl py-6 shadow-lg shadow-emerald-200 disabled:opacity-50"
                                    >
                                        {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...</> : 'Turn In Assignment'}
                                    </Button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="bg-sky-50 border border-sky-100 rounded-[2.5rem] p-8 text-center">
                            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm text-sky-500">
                                <CheckCircle className="h-8 w-8" />
                            </div>
                            <h4 className="font-black text-slate-800 text-lg mb-1">Turned In!</h4>
                            <p className="text-sm font-bold text-slate-500 mb-6">
                                {assignment.submission.status === 'graded'
                                    ? `You scored ${assignment.submission.score}/${assignment.max_score}`
                                    : "Waiting for grade"}
                            </p>
                            <Button variant="outline" className="rounded-full font-bold border-sky-200 text-sky-600 hover:bg-sky-100" onClick={() => navigate(-1)}>
                                Back to Assignments
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
