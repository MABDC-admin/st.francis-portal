import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    BookOpen,
    Plus,
    Trash2,
    Loader2,
    Clock,
    ChevronDown
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { useAcademicYear } from '@/contexts/AcademicYearContext';
import { cn } from '@/lib/utils';

interface Subject {
    id: string;
    code: string;
    name: string;
}

interface EnrolledSubject {
    enrollmentId: string;
    id: string;
    code: string;
    name: string;
    status: string;
}

interface StudentSubjectsManagerProps {
    studentId: string;
    gradeLevel: string;
}

const STATUS_OPTIONS = [
    { value: 'enrolled', label: 'Enrolled', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' },
    { value: 'completed', label: 'Completed', color: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' },
    { value: 'dropped', label: 'Dropped', color: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' },
    { value: 'incomplete', label: 'Incomplete', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' },
];

export const StudentSubjectsManager = ({ studentId, gradeLevel }: StudentSubjectsManagerProps) => {
    const { selectedYearId } = useAcademicYear();
    const [enrolledSubjects, setEnrolledSubjects] = useState<EnrolledSubject[]>([]);
    const [availableSubjects, setAvailableSubjects] = useState<Subject[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        fetchData();
    }, [studentId, selectedYearId]);

    const fetchData = async () => {
        if (!studentId || !selectedYearId) return;
        setIsLoading(true);
        try {
            // 1. Fetch currently enrolled subjects
            const { data: enrolledData, error: enrolledError } = await supabase
                .from('student_subjects')
                .select(`
          id,
          status,
          subjects:subject_id (id, code, name)
        `)
                .eq('student_id', studentId)
                .eq('academic_year_id', selectedYearId);

            if (enrolledError) throw enrolledError;

            const formattedEnrolled = (enrolledData || [])
                .filter((item: any) => item.subjects)
                .map((item: any) => ({
                    enrollmentId: item.id,
                    id: item.subjects.id,
                    code: item.subjects.code,
                    name: item.subjects.name,
                    status: item.status || 'enrolled',
                }));
            setEnrolledSubjects(formattedEnrolled);

            // 2. Fetch all subjects for this grade level to find "available" ones
            const { data: allSubjectsData, error: subjectsError } = await supabase
                .from('subjects')
                .select('id, code, name, grade_levels')
                .eq('is_active', true)
                .contains('grade_levels', [gradeLevel]);

            if (subjectsError) throw subjectsError;

            const enrolledIds = new Set(formattedEnrolled.map(s => s.id));
            const available = (allSubjectsData || []).filter(s => !enrolledIds.has(s.id));
            setAvailableSubjects(available);

        } catch (error) {
            console.error('Error fetching subjects:', error);
            toast.error('Failed to load subjects');
        } finally {
            setIsLoading(false);
        }
    };

    const handleEnroll = async () => {
        if (!selectedSubjectId || !selectedYearId) return;
        setIsProcessing(true);
        try {
            const { error } = await (supabase
                .from('student_subjects') as any)
                .insert({
                    student_id: studentId,
                    subject_id: selectedSubjectId,
                    academic_year_id: selectedYearId,
                    school_id: '00000000-0000-0000-0000-000000000000', // Placeholder
                    status: 'enrolled'
                });

            if (error) throw error;
            toast.success('Subject enrolled successfully');
            setIsAddModalOpen(false);
            setSelectedSubjectId('');
            fetchData();
        } catch (error) {
            console.error('Error enrolling subject:', error);
            toast.error('Failed to enroll subject');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleUnenroll = async (enrollmentId: string) => {
        try {
            const { error } = await supabase
                .from('student_subjects')
                .delete()
                .eq('id', enrollmentId);

            if (error) throw error;
            toast.success('Subject removed');
            fetchData();
        } catch (error) {
            console.error('Error removing subject:', error);
            toast.error('Failed to remove subject');
        }
    };

    const handleStatusUpdate = async (enrollmentId: string, newStatus: string) => {
        try {
            const { error } = await supabase
                .from('student_subjects')
                .update({ status: newStatus })
                .eq('id', enrollmentId);

            if (error) throw error;
            toast.success('Status updated');
            fetchData();
        } catch (error) {
            console.error('Error updating status:', error);
            toast.error('Failed to update status');
        }
    };

    const getStatusBadge = (status: string) => {
        const option = STATUS_OPTIONS.find(o => o.value === status) || STATUS_OPTIONS[0];
        return (
            <Badge className={cn("border-0 font-medium whitespace-nowrap", option.color)}>
                {option.label}
            </Badge>
        );
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-violet-500" />
                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Subject Management</h3>
                </div>
                <Button
                    size="sm"
                    onClick={() => setIsAddModalOpen(true)}
                    className="bg-violet-600 hover:bg-violet-700 text-white gap-2 shadow-md hover:shadow-lg transition-all"
                >
                    <Plus className="h-4 w-4" />
                    Add Subject
                </Button>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-12 gap-3">
                        <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
                        <p className="text-sm text-muted-foreground animate-pulse">Loading subjects...</p>
                    </div>
                ) : enrolledSubjects.length > 0 ? (
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader className="bg-slate-50 dark:bg-slate-800/50">
                                <TableRow>
                                    <TableHead className="font-bold">Code</TableHead>
                                    <TableHead className="font-bold">Subject Name</TableHead>
                                    <TableHead className="font-bold text-center">Status</TableHead>
                                    <TableHead className="font-bold text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                <AnimatePresence mode="popLayout">
                                    {enrolledSubjects.map((subject) => (
                                        <motion.tr
                                            key={subject.enrollmentId}
                                            layout
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            className="group hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                                        >
                                            <TableCell className="font-mono text-xs">
                                                <Badge variant="outline" className="text-violet-600 dark:text-violet-400 border-violet-200 dark:border-violet-900/50 bg-violet-50/30 dark:bg-violet-900/10">
                                                    {subject.code}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-sm font-medium">{subject.name}</TableCell>
                                            <TableCell className="text-center">
                                                <Select
                                                    value={subject.status}
                                                    onValueChange={(v) => handleStatusUpdate(subject.enrollmentId, v)}
                                                >
                                                    <SelectTrigger className="mx-auto w-auto min-w-[120px] h-8 text-xs border-0 bg-transparent focus:ring-0 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all rounded-lg p-0 px-2 justify-center gap-1 group">
                                                        {getStatusBadge(subject.status)}
                                                        <ChevronDown className="h-3 w-3 opacity-0 group-hover:opacity-50 transition-opacity" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {STATUS_OPTIONS.map(opt => (
                                                            <SelectItem key={opt.value} value={opt.value} className="text-xs">
                                                                {opt.label}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleUnenroll(subject.enrollmentId)}
                                                    className="h-8 w-8 text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </motion.tr>
                                    ))}
                                </AnimatePresence>
                            </TableBody>
                        </Table>
                    </div>
                ) : (
                    <div className="text-center py-16 px-4">
                        <div className="h-16 w-16 bg-violet-50 dark:bg-violet-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <BookOpen className="h-8 w-8 text-violet-400" />
                        </div>
                        <h4 className="font-bold text-slate-800 dark:text-slate-200">No subjects enrolled</h4>
                        <p className="text-sm text-muted-foreground mt-1 max-w-xs mx-auto">
                            This student isn't enrolled in any subjects for the current academic year yet.
                        </p>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setIsAddModalOpen(true)}
                            className="mt-6 border-violet-200 dark:border-violet-900 hover:bg-violet-50 dark:hover:bg-violet-900/20"
                        >
                            Start Enrollment
                        </Button>
                    </div>
                )}
            </div>

            <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Enroll Student in Subject</DialogTitle>
                        <DialogDescription>
                            Select a subject available for {gradeLevel} to enroll this student.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        {availableSubjects.length > 0 ? (
                            <Select value={selectedSubjectId} onValueChange={setSelectedSubjectId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a subject..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {availableSubjects.map(sub => (
                                        <SelectItem key={sub.id} value={sub.id}>
                                            {sub.code} - {sub.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        ) : (
                            <div className="text-center py-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-dashed">
                                <p className="text-sm text-muted-foreground">No more subjects available for this grade level.</p>
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
                        <Button
                            onClick={handleEnroll}
                            disabled={!selectedSubjectId || isProcessing}
                            className="bg-violet-600 hover:bg-violet-700 text-white"
                        >
                            {isProcessing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            Enroll Subject
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};
