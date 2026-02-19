import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useMemo, useState, useEffect } from 'react';
import { Search, LayoutGrid, List } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
    computeQuarterlyGeneralAverage,
    computeAnnualGeneralAverage,
} from '@/utils/gradeComputation';
import { Card, CardContent } from '@/components/ui/card';
import { AnimatedStudentAvatar } from '@/components/students/AnimatedStudentAvatar';
import { SubjectGradeCard } from './SubjectGradeCard';
import { useStudentDashboardStats } from '@/hooks/useStudentPortalData';

interface StudentGradesTabProps {
    studentId: string;
    gradeLevel: string;
    schoolId: string;
    academicYearId: string;
    grades: any[];
    studentName?: string;
    studentPhotoUrl?: string | null;
}

export const StudentGradesTab = ({
    studentId,
    gradeLevel,
    schoolId,
    academicYearId,
    grades,
    studentName,
    studentPhotoUrl,
}: StudentGradesTabProps) => {
    const { isLoading } = useStudentDashboardStats(
        studentId,
        gradeLevel,
        schoolId,
        academicYearId
    );

    const [searchQuery, setSearchQuery] = useState('');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    // Compute General Averages
    const generalAverages = useMemo(() => {
        if (!grades || grades.length === 0) return null;
        return {
            q1: computeQuarterlyGeneralAverage(grades, 'q1'),
            q2: computeQuarterlyGeneralAverage(grades, 'q2'),
            q3: computeQuarterlyGeneralAverage(grades, 'q3'),
            q4: computeQuarterlyGeneralAverage(grades, 'q4'),
            annual: computeAnnualGeneralAverage(grades),
        };
    }, [grades]);

    const [selectedQuarter, setSelectedQuarter] = useState<'Q1' | 'Q2' | 'Q3' | 'Q4' | 'Annual'>('Annual');

    // Auto-select Q1 if grades are available
    useEffect(() => {
        if (generalAverages?.q1 && generalAverages.q1 > 0) {
            setSelectedQuarter('Q1');
        }
    }, [generalAverages]);

    const displayedAverage = useMemo(() => {
        switch (selectedQuarter) {
            case 'Q1': return generalAverages?.q1 || 0;
            case 'Q2': return generalAverages?.q2 || 0;
            case 'Q3': return generalAverages?.q3 || 0;
            case 'Q4': return generalAverages?.q4 || 0;
            default: return generalAverages?.annual || 0;
        }
    }, [selectedQuarter, generalAverages]);

    const filteredGrades = useMemo(() => {
        if (!searchQuery) return grades;
        return grades.filter((g: any) =>
            g.subjects?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            g.subjects?.code?.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [grades, searchQuery]);

    if (isLoading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-32 rounded-[2.5rem]" />
                <Skeleton className="h-48 rounded-[2.5rem]" />
                <div className="space-y-3">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <Skeleton key={i} className="h-20 rounded-3xl" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4 pb-16 lg:pb-8">
            {/* Controls Header */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-6">
                {/* Search Bar */}
                <div className="relative w-full sm:flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <Input
                        type="text"
                        placeholder="Search subject or code..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-12 h-12 bg-white/80 backdrop-blur-md border-none shadow-sm rounded-2xl font-bold text-slate-700 placeholder:text-slate-400 focus-visible:ring-sky-500"
                    />
                </div>

                {/* View Toggles */}
                <div className="flex items-center gap-1 bg-white/50 p-1 rounded-xl backdrop-blur-sm self-end sm:self-auto">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setViewMode('grid')}
                        className={cn(
                            "h-10 w-10 p-0 rounded-lg transition-all",
                            viewMode === 'grid' ? "bg-white shadow-sm text-sky-600" : "text-slate-400 hover:text-slate-600"
                        )}
                    >
                        <LayoutGrid className="h-5 w-5" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setViewMode('list')}
                        className={cn(
                            "h-10 w-10 p-0 rounded-lg transition-all",
                            viewMode === 'list' ? "bg-white shadow-sm text-sky-600" : "text-slate-400 hover:text-slate-600"
                        )}
                    >
                        <List className="h-5 w-5" />
                    </Button>
                </div>
            </div>

            {/* Content Area */}
            <div className="space-y-2 mt-0">
                <AnimatePresence mode="popLayout">
                    {filteredGrades.length > 0 ? (
                        viewMode === 'grid' ? (
                            filteredGrades.map((grade: any, idx: number) => (
                                <motion.div
                                    key={grade.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <SubjectGradeCard
                                        grade={grade}
                                        index={idx}
                                        globalSelectedQuarter={selectedQuarter}
                                    />
                                </motion.div>
                            ))
                        ) : (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="bg-white/80 backdrop-blur-xl rounded-[2rem] overflow-hidden shadow-sm border border-white/50"
                            >
                                <div className="grid grid-cols-1 divide-y divide-slate-100">
                                    {/* Header Row (Desktop) */}
                                    <div className="hidden sm:grid grid-cols-12 gap-4 p-4 bg-slate-50/50 text-xs font-black text-slate-400 uppercase tracking-wider">
                                        <div className="col-span-4">Subject</div>
                                        <div className="col-span-6 grid grid-cols-4 text-center">
                                            <div>Q1</div>
                                            <div>Q2</div>
                                            <div>Q3</div>
                                            <div>Q4</div>
                                        </div>
                                        <div className="col-span-2 text-right">Final</div>
                                    </div>

                                    {filteredGrades.map((grade: any) => (
                                        <div key={grade.id} className="p-4 hover:bg-slate-50 transition-colors">
                                            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
                                                {/* Subject Name */}
                                                <div className="col-span-12 sm:col-span-4">
                                                    <span className="font-bold text-slate-700 block">{grade.subjects?.name}</span>
                                                    <span className="text-xs text-slate-400 font-medium">{grade.subjects?.code}</span>
                                                </div>

                                                {/* Grades Grid */}
                                                <div className="col-span-12 sm:col-span-6 grid grid-cols-4 gap-2 text-center text-sm">
                                                    <div className="flex flex-col sm:block">
                                                        <span className="sm:hidden text-[9px] text-slate-400 uppercase font-black">Q1</span>
                                                        <span className={cn("font-bold", !grade.q1_grade && "text-slate-300")}>{grade.q1_grade || '-'}</span>
                                                    </div>
                                                    <div className="flex flex-col sm:block">
                                                        <span className="sm:hidden text-[9px] text-slate-400 uppercase font-black">Q2</span>
                                                        <span className={cn("font-bold", !grade.q2_grade && "text-slate-300")}>{grade.q2_grade || '-'}</span>
                                                    </div>
                                                    <div className="flex flex-col sm:block">
                                                        <span className="sm:hidden text-[9px] text-slate-400 uppercase font-black">Q3</span>
                                                        <span className={cn("font-bold", !grade.q3_grade && "text-slate-300")}>{grade.q3_grade || '-'}</span>
                                                    </div>
                                                    <div className="flex flex-col sm:block">
                                                        <span className="sm:hidden text-[9px] text-slate-400 uppercase font-black">Q4</span>
                                                        <span className={cn("font-bold", !grade.q4_grade && "text-slate-300")}>{grade.q4_grade || '-'}</span>
                                                    </div>
                                                </div>

                                                {/* Final Grade */}
                                                <div className="col-span-12 sm:col-span-2 flex justify-between sm:justify-end items-center sm:text-right border-t sm:border-t-0 pt-3 sm:pt-0 mt-1 sm:mt-0 border-slate-100">
                                                    <span className="sm:hidden text-xs font-black text-slate-400 uppercase tracking-widest">Final Grade</span>
                                                    <span className={cn("text-lg font-black", (grade.annual_grade || grade.final_grade) ? "text-sky-600" : "text-slate-300")}>
                                                        {grade.annual_grade || grade.final_grade || '-'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )
                    ) : (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="bg-white/50 backdrop-blur-sm border-dashed border-2 border-slate-100 rounded-[2.5rem] p-10 text-center"
                        >
                            <p className="text-slate-400 font-bold">No subjects found matching "{searchQuery}"</p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};
