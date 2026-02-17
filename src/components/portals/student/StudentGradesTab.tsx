import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { useMemo, useState, useEffect } from 'react';
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
        <div className="space-y-6 pb-20 lg:pb-8">
            {/* Subject list section */}
            <div className="space-y-3 mt-4">
                {grades.length > 0 ? (
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    grades.map((grade: any, idx: number) => (
                        <SubjectGradeCard
                            key={grade.id}
                            grade={grade}
                            index={idx}
                            globalSelectedQuarter={selectedQuarter}
                        />
                    ))
                ) : (
                    <Card className="bg-muted/30 border-dashed rounded-3xl">
                        <CardContent className="py-10 text-center">
                            <p className="text-muted-foreground">No grades available yet.</p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
};
