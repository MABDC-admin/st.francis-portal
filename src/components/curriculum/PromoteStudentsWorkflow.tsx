import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Users,
    ArrowRight,
    Check,
    AlertTriangle,
    Loader2,
    CalendarCheck,
    ChevronRight,
    ShieldAlert,
    GraduationCap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useSchool } from '@/contexts/SchoolContext';
import { useAcademicYear, AcademicYear } from '@/contexts/AcademicYearContext';
import { Student } from '@/types/student';

interface PromoteStudentsWorkflowProps {
    onClose: () => void;
    onSuccess: () => void;
}

interface PromotionEntry {
    studentId: string;
    studentName: string;
    currentLevel: string;
    nextLevel: string; // The proposed next level
    status: 'promote' | 'retain' | 'graduated';
    selected: boolean;
}

const GRADE_ORDER = [
    'Kinder 1', 'Kinder 2',
    'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6',
    'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'
];

const getNextLevel = (current: string): string => {
    // Normalize input
    const normalized = current.replace('Level ', 'Grade ');

    const index = GRADE_ORDER.indexOf(normalized);
    if (index === -1) return current; // Keep same if unknown
    if (index === GRADE_ORDER.length - 1) return 'Graduated'; // Last level
    return GRADE_ORDER[index + 1];
};

export const PromoteStudentsWorkflow = ({ onClose, onSuccess }: PromoteStudentsWorkflowProps) => {
    const { selectedSchool } = useSchool();
    const { academicYears, refetch: refetchYears } = useAcademicYear();

    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [targetYearId, setTargetYearId] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);
    const [promotions, setPromotions] = useState<PromotionEntry[]>([]);

    // Step 1: Select Target Year
    // Filter years to only show future years or non-current years
    const availableYears = academicYears.filter(y => !y.is_current);

    const fetchStudentsForPromotion = async () => {
        setIsLoading(true);
        try {
            // CRITICAL: Filter by selectedSchool
            const { data: students, error } = await supabase
                .from('students')
                .select('id, student_name, level')
                .eq('school', selectedSchool)
                .order('level', { ascending: true })
                .order('student_name', { ascending: true });

            if (error) throw error;

            const entries: PromotionEntry[] = (students || []).map(s => {
                // Normalize level name just in case
                let currentLevel = s.level;
                if (currentLevel.startsWith('Level ')) {
                    currentLevel = currentLevel.replace('Level ', 'Grade ');
                } else if (currentLevel === '1' || currentLevel === '2') {
                    // Handle raw numbers if old data exists
                    currentLevel = `Grade ${currentLevel}`;
                }

                const nextLevel = getNextLevel(currentLevel);
                const isGraduating = nextLevel === 'Graduated';

                return {
                    studentId: s.id,
                    studentName: s.student_name,
                    currentLevel: s.level, // Keep original from DB for display
                    nextLevel: nextLevel,
                    status: isGraduating ? 'graduated' : 'promote',
                    selected: true
                };
            });

            setPromotions(entries);
            setStep(2);
        } catch (err: any) {
            toast.error('Failed to load students: ' + err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const executePromotion = async () => {
        setIsLoading(true);
        try {
            // 1. Update Student Levels
            const updates = promotions
                .filter(p => p.selected && p.status !== 'retain')
                .map(p => ({
                    id: p.studentId,
                    level: p.status === 'graduated' ? 'Alumni' : p.nextLevel,
                    // If graduated, maybe update a status flag too? For now just level 'Alumni' or 'Graduated'
                }));

            // Supabase doesn't support bulk update with different values easily in one call 
            // without a custom function or multiple calls.
            // For safety, we will do parallel requests in chunks or a loop.
            // Given ~500 students, a loop might be slow but safe.

            // Optimization: Group by target level
            const updatesByLevel: Record<string, string[]> = {};
            promotions.forEach(p => {
                if (!p.selected) return; // Skip

                // Determine new level value
                let newLevelVal = p.currentLevel; // default retain
                if (p.status === 'promote') newLevelVal = p.nextLevel;
                if (p.status === 'graduated') newLevelVal = '1st Year College'; // Or just mark alumni via status? keeping it simple for now as 'Graduated'

                if (newLevelVal !== p.currentLevel) {
                    if (!updatesByLevel[newLevelVal]) updatesByLevel[newLevelVal] = [];
                    updatesByLevel[newLevelVal].push(p.studentId);
                }
            });

            const promises = Object.entries(updatesByLevel).map(([lvl, ids]) =>
                supabase.from('students').update({ level: lvl }).in('id', ids)
            );

            await Promise.all(promises);

            // 2. Set Active Year
            // Unset current
            await supabase.from('academic_years').update({ is_current: false }).eq('is_current', true);
            // Set new
            await supabase.from('academic_years').update({ is_current: true }).eq('id', targetYearId);

            await refetchYears();
            onSuccess();
            toast.success('School Year Promoted Successfully!');
            onClose();

        } catch (err: any) {
            toast.error('Failed to execute promotion: ' + err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const stats = useMemo(() => {
        const total = promotions.filter(p => p.selected).length;
        const promoted = promotions.filter(p => p.selected && p.status === 'promote').length;
        const graduated = promotions.filter(p => p.selected && p.status === 'graduated').length;
        const retained = promotions.filter(p => p.selected && p.status === 'retain').length;
        return { total, promoted, graduated, retained };
    }, [promotions]);

    // Handle individual override
    const handleStatusChange = (id: string, newStatus: 'promote' | 'retain' | 'graduated') => {
        setPromotions(prev => prev.map(p =>
            p.studentId === id ? { ...p, status: newStatus } : p
        ));
    };

    return (
        <Card className="w-full max-w-4xl mx-auto shadow-xl border-t-4 border-t-amber-500">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <CalendarCheck className="h-6 w-6 text-amber-500" />
                    Start New School Year ({selectedSchool})
                </CardTitle>
                <CardDescription>
                    Promote students to the next grade level and activate the new academic year.
                </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
                {/* Progress Stepper */}
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
                    <div className={`px-2 py-1 rounded ${step === 1 ? 'bg-primary/10 text-primary font-bold' : ''}`}>
                        1. Select Year
                    </div>
                    <ChevronRight className="h-4 w-4" />
                    <div className={`px-2 py-1 rounded ${step === 2 ? 'bg-primary/10 text-primary font-bold' : ''}`}>
                        2. Review Promotions
                    </div>
                    <ChevronRight className="h-4 w-4" />
                    <div className={`px-2 py-1 rounded ${step === 3 ? 'bg-primary/10 text-primary font-bold' : ''}`}>
                        3. Confirm
                    </div>
                </div>

                {step === 1 && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                        <div className="bg-amber-50 dark:bg-amber-950/20 p-4 rounded-lg border border-amber-200 dark:border-amber-900">
                            <h3 className="flex items-center gap-2 font-semibold text-amber-700 dark:text-amber-400">
                                <ShieldAlert className="h-5 w-5" />
                                Important Note
                            </h3>
                            <p className="text-sm mt-1 text-amber-800 dark:text-amber-300">
                                This process will promote active students of <strong>{selectedSchool}</strong> to their next grade level (e.g., Grade 1 → Grade 2).
                                Students in the highest grade will be marked as graduated.
                            </p>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Select Target Academic Year</label>
                            <Select value={targetYearId} onValueChange={setTargetYearId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Choose year..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {availableYears.map(y => (
                                        <SelectItem key={y.id} value={y.id}>{y.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex justify-end pt-4">
                            <Button onClick={fetchStudentsForPromotion} disabled={!targetYearId || isLoading}>
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Next: Review Promotions
                            </Button>
                        </div>
                    </motion.div>
                )}

                {step === 2 && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="font-semibold text-lg">Student Promotion Preview</h3>
                            <div className="flex gap-2">
                                <Badge variant="outline">Total: {promotions.length}</Badge>
                            </div>
                        </div>

                        <div className="border rounded-md h-[400px] overflow-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[50px]">
                                            <Checkbox
                                                checked={promotions.every(p => p.selected)}
                                                onCheckedChange={(c) => setPromotions(prev => prev.map(p => ({ ...p, selected: !!c })))}
                                            />
                                        </TableHead>
                                        <TableHead>Student Name</TableHead>
                                        <TableHead>Current Level</TableHead>
                                        <TableHead>Action</TableHead>
                                        <TableHead>Next Level</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {promotions.map(p => (
                                        <TableRow key={p.studentId} className={!p.selected ? 'opacity-50' : ''}>
                                            <TableCell>
                                                <Checkbox
                                                    checked={p.selected}
                                                    onCheckedChange={(c) => setPromotions(prev => prev.map(item => item.studentId === p.studentId ? { ...item, selected: !!c } : item))}
                                                />
                                            </TableCell>
                                            <TableCell className="font-medium">{p.studentName}</TableCell>
                                            <TableCell>{p.currentLevel}</TableCell>
                                            <TableCell>
                                                <Select
                                                    value={p.status}
                                                    onValueChange={(v: any) => handleStatusChange(p.studentId, v)}
                                                    disabled={!p.selected}
                                                >
                                                    <SelectTrigger className="h-8 w-[130px]">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="promote">Promote</SelectItem>
                                                        <SelectItem value="retain">Retain</SelectItem>
                                                        <SelectItem value="graduated">Graduate</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </TableCell>
                                            <TableCell>
                                                {p.status === 'promote' && <span className="text-green-600 flex items-center gap-1 font-medium">{p.nextLevel} <ArrowRight className="h-3 w-3" /></span>}
                                                {p.status === 'retain' && <span className="text-amber-600 font-medium">Same Level</span>}
                                                {p.status === 'graduated' && <span className="text-purple-600 font-bold flex items-center gap-1"><GraduationCap className="h-3 w-3" /> Graduated</span>}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>

                        <div className="flex justify-between pt-4">
                            <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
                            <Button onClick={() => setStep(3)}>Next: Confirm Changes</Button>
                        </div>
                    </motion.div>
                )}

                {step === 3 && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                        <div className="text-center space-y-2 py-4">
                            <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Check className="h-8 w-8" />
                            </div>
                            <h3 className="text-xl font-bold">Ready to Start New School Year?</h3>
                            <p className="text-muted-foreground">
                                This action is irreversible. Please confirm the summary below.
                            </p>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-secondary/30 p-4 rounded-lg text-center">
                                <div className="text-2xl font-bold">{stats.total}</div>
                                <div className="text-xs text-muted-foreground uppercase">Total Processed</div>
                            </div>
                            <div className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 p-4 rounded-lg text-center">
                                <div className="text-2xl font-bold">{stats.promoted}</div>
                                <div className="text-xs uppercase">Promoted</div>
                            </div>
                            <div className="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 p-4 rounded-lg text-center">
                                <div className="text-2xl font-bold">{stats.retained}</div>
                                <div className="text-xs uppercase">Retained</div>
                            </div>
                            <div className="bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 p-4 rounded-lg text-center">
                                <div className="text-2xl font-bold">{stats.graduated}</div>
                                <div className="text-xs uppercase">Graduated</div>
                            </div>
                        </div>

                        <div className="bg-destructive/10 text-destructive p-3 rounded-md text-sm flex gap-2">
                            <AlertTriangle className="h-5 w-5 flex-shrink-0" />
                            <p>
                                <strong>Warning:</strong> Clicking "Execute" will update student records directly in the database.
                                Ensure all overrides are correct before proceeding.
                            </p>
                        </div>

                        <div className="flex justify-between pt-4">
                            <Button variant="outline" onClick={() => setStep(2)}>Back</Button>
                            <Button variant="destructive" onClick={executePromotion} disabled={isLoading}>
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Execute & Start Year
                            </Button>
                        </div>
                    </motion.div>
                )}
            </CardContent>
        </Card>
    );
};
