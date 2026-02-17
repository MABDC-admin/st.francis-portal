import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useMemo, useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
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
            {/* Search Bar */}
            <div className="relative mb-6">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <Input
                    type="text"
                    placeholder="Search subject or code..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-12 h-14 bg-white/80 backdrop-blur-md border-none shadow-sm rounded-2xl font-bold text-slate-700 placeholder:text-slate-400 focus-visible:ring-sky-500"
                />
            </div>

            {/* Subject list section */}
            <div className="space-y-2 mt-0">
                <AnimatePresence mode="popLayout">
                    {filteredGrades.length > 0 ? (
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
