import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Calculator, Save, AlertCircle, CheckCircle2, Loader2, FileDown, FileSpreadsheet } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import {
    computeQuarterlyGrade,
    getSubjectCategory,
    SubjectCategory,
    CATEGORY_WEIGHTS,
} from '@/utils/gradeComputation';
import { cn } from '@/lib/utils';
import { Student } from '@/types/student';

interface RawScoreEntry {
    raw: string;
    max: string;
}

interface TransmutationManagerProps {
    student: Student;
    academicYearId: string;
}

export const TransmutationManager = ({ student, academicYearId }: TransmutationManagerProps) => {
    const [selectedSubject, setSelectedSubject] = useState<string>('');
    const [quarter, setQuarter] = useState<string>('1');
    const [subjects, setSubjects] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // Scoring State
    const [wwEntries, setWwEntries] = useState<RawScoreEntry[]>([{ raw: '', max: '' }]);
    const [ptEntries, setPtEntries] = useState<RawScoreEntry[]>([{ raw: '', max: '' }]);
    const [qaEntry, setQaEntry] = useState<RawScoreEntry>({ raw: '', max: '100' });

    const [isSaving, setIsSaving] = useState(false);

    // Fetch student's enrolled subjects
    useEffect(() => {
        const fetchSubjects = async () => {
            const { data } = await supabase
                .from('student_subjects')
                .select(`subject_id, subjects (id, code, name)`)
                .eq('student_id', student.id);

            if (data) {
                setSubjects(data.map(d => d.subjects));
            }
        };
        fetchSubjects();
    }, [student.id]);

    // Fetch existing raw scores when subject or quarter changes
    useEffect(() => {
        if (!selectedSubject || !quarter) return;

        const fetchRawScores = async () => {
            setIsLoading(true);
            try {
                const { data } = await (supabase
                    .from('raw_scores' as any)
                    .select('*')
                    .eq('student_id', student.id)
                    .eq('subject_id', selectedSubject)
                    .eq('academic_year_id', academicYearId)
                    .eq('quarter', parseInt(quarter))
                    .maybeSingle() as any);

                if (data) {
                    setWwEntries(data.ww_scores.map((s: number, i: number) => ({
                        raw: s.toString(),
                        max: data.ww_max_scores[i]?.toString() || ''
                    })));
                    setPtEntries(data.pt_scores.map((s: number, i: number) => ({
                        raw: s.toString(),
                        max: data.pt_max_scores[i]?.toString() || ''
                    })));
                    setQaEntry({
                        raw: data.qa_score?.toString() || '',
                        max: data.qa_max?.toString() || '100'
                    });
                } else {
                    setWwEntries([{ raw: '', max: '' }]);
                    setPtEntries([{ raw: '', max: '' }]);
                    setQaEntry({ raw: '', max: '100' });
                }
            } catch (err) {
                console.error('Error fetching raw scores:', err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchRawScores();
    }, [selectedSubject, quarter, student.id, academicYearId]);

    const currentCategory = useMemo(() => {
        if (!selectedSubject) return 'Languages/AP/EsP' as SubjectCategory;
        const subject = subjects.find(s => s.id === selectedSubject);
        return getSubjectCategory(subject?.code || '', student.level);
    }, [selectedSubject, subjects, student.level]);

    const computedGrades = useMemo(() => {
        const wwRaw = wwEntries.map(e => parseFloat(e.raw)).filter(v => !isNaN(v));
        const wwMax = wwEntries.map(e => parseFloat(e.max)).filter(v => !isNaN(v));
        const ptRaw = ptEntries.map(e => parseFloat(e.raw)).filter(v => !isNaN(v));
        const ptMax = ptEntries.map(e => parseFloat(e.max)).filter(v => !isNaN(v));
        const qaRaw = parseFloat(qaEntry.raw) || 0;
        const qaMax = parseFloat(qaEntry.max) || 100;

        return computeQuarterlyGrade(currentCategory, { wwRaw, wwMax, ptRaw, ptMax, qaRaw, qaMax });
    }, [currentCategory, wwEntries, ptEntries, qaEntry]);

    const handleAddEntry = (type: 'ww' | 'pt') => {
        if (type === 'ww') setWwEntries([...wwEntries, { raw: '', max: '' }]);
        else setPtEntries([...ptEntries, { raw: '', max: '' }]);
    };

    const handleRemoveEntry = (type: 'ww' | 'pt', index: number) => {
        if (type === 'ww') {
            const newEntries = wwEntries.filter((_, i) => i !== index);
            setWwEntries(newEntries.length ? newEntries : [{ raw: '', max: '' }]);
        } else {
            const newEntries = ptEntries.filter((_, i) => i !== index);
            setPtEntries(newEntries.length ? newEntries : [{ raw: '', max: '' }]);
        }
    };

    const handleUpdateEntry = (type: 'ww' | 'pt', index: number, field: 'raw' | 'max', value: string) => {
        if (type === 'ww') {
            const newEntries = [...wwEntries];
            newEntries[index] = { ...newEntries[index], [field]: value };
            setWwEntries(newEntries);
        } else {
            const newEntries = [...ptEntries];
            newEntries[index] = { ...newEntries[index], [field]: value };
            setPtEntries(newEntries);
        }
    };

    const handleSave = async () => {
        if (!selectedSubject) {
            toast.error('Please select a subject');
            return;
        }

        setIsSaving(true);
        try {
            const wwRaw = wwEntries.map(e => parseFloat(e.raw)).filter(v => !isNaN(v));
            const wwMax = wwEntries.map(e => parseFloat(e.max)).filter(v => !isNaN(v));
            const ptRaw = ptEntries.map(e => parseFloat(e.raw)).filter(v => !isNaN(v));
            const ptMax = ptEntries.map(e => parseFloat(e.max)).filter(v => !isNaN(v));

            const { error: rawError } = await (supabase
                .from('raw_scores' as any)
                .upsert({
                    student_id: student.id,
                    subject_id: selectedSubject,
                    academic_year_id: academicYearId,
                    school_id: student.school_id,
                    quarter: parseInt(quarter),
                    ww_scores: wwRaw,
                    ww_max_scores: wwMax,
                    pt_scores: ptRaw,
                    pt_max_scores: ptMax,
                    qa_score: parseFloat(qaEntry.raw) || 0,
                    qa_max: parseFloat(qaEntry.max) || 100,
                    initial_grade: computedGrades.initialGrade,
                    transmuted_grade: computedGrades.transmutedGrade,
                    updated_at: new Date().toISOString()
                }, {
                    onConflict: 'student_id,subject_id,academic_year_id,quarter'
                }) as any);

            if (rawError) throw rawError;

            const gradeField = `q${quarter}_grade`;
            const { error: gradeError } = await (supabase
                .from('student_grades') as any)
                .upsert({
                    student_id: student.id,
                    subject_id: selectedSubject,
                    academic_year_id: academicYearId,
                    school_id: student.school_id,
                    [gradeField]: computedGrades.transmutedGrade,
                    updated_at: new Date().toISOString()
                }, {
                    onConflict: 'student_id,subject_id,academic_year_id'
                });

            if (gradeError) throw gradeError;

            toast.success(`Quarter ${quarter} grade saved successfully!`);
        } catch (error) {
            console.error('Error saving grade:', error);
            toast.error('Failed to save grade');
        } finally {
            setIsSaving(false);
        }
    };

    const handleExportPDF = () => {
        const subjectName = subjects.find(s => s.id === selectedSubject)?.name || 'Unknown Subject';
        const subjectCode = subjects.find(s => s.id === selectedSubject)?.code || '';

        const doc = new jsPDF();
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('Grade Transmutation Report', 14, 20);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`Student: ${student.student_name}`, 14, 30);
        doc.text(`LRN: ${student.lrn}`, 14, 36);
        doc.text(`Level: ${student.level}`, 14, 42);
        doc.text(`Subject: ${subjectName} (${subjectCode})`, 14, 48);
        doc.text(`Quarter: ${quarter}`, 14, 54);
        doc.text(`Category: ${currentCategory}`, 14, 60);

        autoTable(doc, {
            startY: 70,
            head: [['Component', 'Weight', 'Weighted Score']],
            body: [
                ['Written Work (WW)', `${(CATEGORY_WEIGHTS[currentCategory].ww * 100)}%`, computedGrades.wwWS.toFixed(2)],
                ['Performance Tasks (PT)', `${(CATEGORY_WEIGHTS[currentCategory].pt * 100)}%`, computedGrades.ptWS.toFixed(2)],
                ['Quarterly Assessment (QA)', `${(CATEGORY_WEIGHTS[currentCategory].qa * 100)}%`, computedGrades.qaWS.toFixed(2)],
            ],
            theme: 'striped',
            headStyles: { fillColor: [8, 145, 178] },
        });

        const finalY = (doc as any).lastAutoTable.finalY + 10;
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text(`Initial Grade: ${computedGrades.initialGrade.toFixed(2)}`, 14, finalY);
        doc.setFontSize(14);
        doc.text(`Transmuted Grade: ${computedGrades.transmutedGrade}`, 14, finalY + 8);

        doc.save(`transmutation_${student.lrn}_Q${quarter}.pdf`);
        toast.success('PDF exported successfully!');
    };

    const handleExportCSV = () => {
        const subjectName = subjects.find(s => s.id === selectedSubject)?.name || 'Unknown Subject';
        const subjectCode = subjects.find(s => s.id === selectedSubject)?.code || '';

        const csvRows = [
            ['Grade Transmutation Report'],
            [],
            ['Student Name', student.student_name],
            ['LRN', student.lrn],
            ['Grade Level', student.level],
            ['Subject', `${subjectName} (${subjectCode})`],
            ['Quarter', quarter],
            ['Category', currentCategory],
            [],
            ['Component', 'Weight', 'Weighted Score'],
            ['Written Work (WW)', `${(CATEGORY_WEIGHTS[currentCategory].ww * 100)}%`, computedGrades.wwWS.toFixed(2)],
            ['Performance Tasks (PT)', `${(CATEGORY_WEIGHTS[currentCategory].pt * 100)}%`, computedGrades.ptWS.toFixed(2)],
            ['Quarterly Assessment (QA)', `${(CATEGORY_WEIGHTS[currentCategory].qa * 100)}%`, computedGrades.qaWS.toFixed(2)],
            [],
            ['Initial Grade', computedGrades.initialGrade.toFixed(2)],
            ['Transmuted Grade', computedGrades.transmutedGrade],
        ];

        const csvContent = csvRows.map(row => row.join(',')).join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `transmutation_${student.lrn}_Q${quarter}.csv`;
        link.click();
        toast.success('CSV exported successfully!');
    };

    return (
        <div className="flex flex-col bg-background/50 backdrop-blur-sm rounded-xl border border-border/50 overflow-hidden">
            {/* Configuration Header */}
            <div className="p-3 bg-card/30 border-b border-border/50 space-y-3">
                <div className="flex flex-wrap items-end gap-3">
                    <div className="flex-1 min-w-[140px]">
                        <Label className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 block">Subject</Label>
                        <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                            <SelectTrigger className="h-8 text-xs bg-background/50 border-stat-cyan/20">
                                <SelectValue placeholder="Select Subject" />
                            </SelectTrigger>
                            <SelectContent>
                                {subjects.map(s => (
                                    <SelectItem key={s.id} value={s.id}>{s.name} ({s.code})</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="w-28">
                        <Label className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 block">Quarter</Label>
                        <Select value={quarter} onValueChange={setQuarter}>
                            <SelectTrigger className="h-8 text-xs bg-background/50 border-stat-cyan/20">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {[1, 2, 3, 4].map(q => (
                                    <SelectItem key={q} value={q.toString()}>Q{q}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <Badge variant="outline" className="h-8 text-[10px] bg-stat-cyan/10 border-stat-cyan/20 text-stat-cyan whitespace-nowrap">
                        {currentCategory}
                    </Badge>
                </div>
            </div>

            {/* Score Input Area */}
            <div className="flex-1 p-3 overflow-y-auto space-y-4 relative">
                {isLoading && (
                    <div className="absolute inset-0 bg-background/50 backdrop-blur-[2px] z-20 flex items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-stat-cyan" />
                    </div>
                )}

                {/* Written Work */}
                <section className="space-y-2">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                            <div className="h-6 w-6 rounded-md bg-stat-purple/10 flex items-center justify-center text-stat-purple">
                                <Calculator className="h-3 w-3" />
                            </div>
                            <h4 className="font-bold text-xs">Written Work</h4>
                            <Badge variant="outline" className="text-[9px] h-4 bg-stat-purple/5 border-stat-purple/20 text-stat-purple">
                                {(CATEGORY_WEIGHTS[currentCategory].ww * 100)}%
                            </Badge>
                        </div>
                        <Button size="sm" variant="ghost" className="h-6 px-1.5 text-[10px] text-stat-purple hover:bg-stat-purple/10" onClick={() => handleAddEntry('ww')}>
                            <Plus className="h-3 w-3 mr-0.5" /> Add
                        </Button>
                    </div>
                    <div className="space-y-1.5">
                        {wwEntries.map((entry, idx) => (
                            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} key={idx} className="flex items-center gap-1.5 group">
                                <span className="text-[9px] font-bold text-muted-foreground w-5">#{idx + 1}</span>
                                <Input placeholder="Score" className="h-7 text-xs bg-background/50" value={entry.raw} onChange={(e) => handleUpdateEntry('ww', idx, 'raw', e.target.value)} />
                                <span className="text-muted-foreground text-xs">/</span>
                                <Input placeholder="Max" className="h-7 text-xs bg-background/50" value={entry.max} onChange={(e) => handleUpdateEntry('ww', idx, 'max', e.target.value)} />
                                <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 text-destructive hover:bg-destructive/10" onClick={() => handleRemoveEntry('ww', idx)}>
                                    <Trash2 className="h-3 w-3" />
                                </Button>
                            </motion.div>
                        ))}
                    </div>
                </section>

                <Separator className="opacity-50" />

                {/* Performance Tasks */}
                <section className="space-y-2">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                            <div className="h-6 w-6 rounded-md bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                                <CheckCircle2 className="h-3 w-3" />
                            </div>
                            <h4 className="font-bold text-xs">Performance Tasks</h4>
                            <Badge variant="outline" className="text-[9px] h-4 bg-emerald-500/5 border-emerald-500/20 text-emerald-600">
                                {(CATEGORY_WEIGHTS[currentCategory].pt * 100)}%
                            </Badge>
                        </div>
                        <Button size="sm" variant="ghost" className="h-6 px-1.5 text-[10px] text-emerald-600 hover:bg-emerald-500/10" onClick={() => handleAddEntry('pt')}>
                            <Plus className="h-3 w-3 mr-0.5" /> Add
                        </Button>
                    </div>
                    <div className="space-y-1.5">
                        {ptEntries.map((entry, idx) => (
                            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} key={idx} className="flex items-center gap-1.5 group">
                                <span className="text-[9px] font-bold text-muted-foreground w-5">#{idx + 1}</span>
                                <Input placeholder="Score" className="h-7 text-xs bg-background/50" value={entry.raw} onChange={(e) => handleUpdateEntry('pt', idx, 'raw', e.target.value)} />
                                <span className="text-muted-foreground text-xs">/</span>
                                <Input placeholder="Max" className="h-7 text-xs bg-background/50" value={entry.max} onChange={(e) => handleUpdateEntry('pt', idx, 'max', e.target.value)} />
                                <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 text-destructive hover:bg-destructive/10" onClick={() => handleRemoveEntry('pt', idx)}>
                                    <Trash2 className="h-3 w-3" />
                                </Button>
                            </motion.div>
                        ))}
                    </div>
                </section>

                <Separator className="opacity-50" />

                {/* Quarterly Assessment */}
                <section className="space-y-2">
                    <div className="flex items-center gap-1.5">
                        <div className="h-6 w-6 rounded-md bg-stat-cyan/10 flex items-center justify-center text-stat-cyan">
                            <AlertCircle className="h-3 w-3" />
                        </div>
                        <h4 className="font-bold text-xs">Quarterly Assessment</h4>
                        <Badge variant="outline" className="text-[9px] h-4 bg-stat-cyan/5 border-stat-cyan/20 text-stat-cyan">
                            {(CATEGORY_WEIGHTS[currentCategory].qa * 100)}%
                        </Badge>
                    </div>
                    <div className="flex items-center gap-1.5 pl-7">
                        <Input placeholder="Score" className="h-7 text-xs bg-background/50 max-w-[100px]" value={qaEntry.raw} onChange={(e) => setQaEntry({ ...qaEntry, raw: e.target.value })} />
                        <span className="text-muted-foreground text-xs">/</span>
                        <Input placeholder="Max" className="h-7 text-xs bg-background/50 max-w-[100px]" value={qaEntry.max} onChange={(e) => setQaEntry({ ...qaEntry, max: e.target.value })} />
                    </div>
                </section>

                <Separator className="opacity-50" />

                {/* Result Summary */}
                <Card className="bg-background/80 border border-stat-cyan/20 shadow-sm">
                    <CardContent className="p-3 space-y-2">
                        <div className="flex items-center gap-1.5 mb-1">
                            <Calculator className="h-3.5 w-3.5 text-stat-cyan" />
                            <span className="text-[10px] uppercase tracking-widest text-stat-cyan font-bold">Result Summary</span>
                        </div>

                        <div className="grid grid-cols-3 gap-2 text-center">
                            <div className="bg-stat-purple/5 rounded-md p-1.5 border border-stat-purple/10">
                                <div className="text-[8px] text-stat-purple font-bold uppercase">WW</div>
                                <div className="text-sm font-mono font-bold">{computedGrades.wwWS.toFixed(1)}</div>
                            </div>
                            <div className="bg-emerald-500/5 rounded-md p-1.5 border border-emerald-500/10">
                                <div className="text-[8px] text-emerald-600 font-bold uppercase">PT</div>
                                <div className="text-sm font-mono font-bold">{computedGrades.ptWS.toFixed(1)}</div>
                            </div>
                            <div className="bg-stat-cyan/5 rounded-md p-1.5 border border-stat-cyan/10">
                                <div className="text-[8px] text-stat-cyan font-bold uppercase">QA</div>
                                <div className="text-sm font-mono font-bold">{computedGrades.qaWS.toFixed(1)}</div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 pt-1">
                            <div className="flex-1 bg-secondary/50 rounded-md p-2 text-center border border-border/50">
                                <div className="text-[8px] uppercase text-muted-foreground font-bold">Initial</div>
                                <div className="text-lg font-black font-mono">{computedGrades.initialGrade.toFixed(1)}</div>
                            </div>
                            <div className="flex-1 bg-stat-cyan rounded-md p-2 text-center shadow-md relative overflow-hidden">
                                <div className="text-[8px] uppercase text-orange-600 font-bold">Transmuted</div>
                                <div className="text-2xl font-black text-orange-500 drop-shadow-sm">{computedGrades.transmutedGrade}</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Sticky Save Bar */}
            <div className="p-3 bg-card/50 border-t border-border/50 flex items-center gap-2">
                <Button
                    className="flex-1 h-9 bg-stat-purple hover:bg-stat-purple-dark text-white shadow-md gap-1.5 text-xs"
                    onClick={handleSave}
                    disabled={isSaving || !selectedSubject}
                >
                    {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                    {isSaving ? 'Saving...' : 'Save Q' + quarter}
                </Button>
                <Button variant="outline" size="sm" className="h-9 gap-1 text-[10px]" onClick={handleExportPDF} disabled={!selectedSubject}>
                    <FileDown className="h-3 w-3" /> PDF
                </Button>
                <Button variant="outline" size="sm" className="h-9 gap-1 text-[10px]" onClick={handleExportCSV} disabled={!selectedSubject}>
                    <FileSpreadsheet className="h-3 w-3" /> CSV
                </Button>
            </div>
        </div>
    );
};
