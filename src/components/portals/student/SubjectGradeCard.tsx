import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { StudentPortalIcon, STUDENT_ICONS } from '@/components/icons/StudentPortalIcons';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface SubjectGradeCardProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    grade: any;
    index: number;
    globalSelectedQuarter: 'Q1' | 'Q2' | 'Q3' | 'Q4' | 'Annual';
}

export const SubjectGradeCard = ({ grade, index, globalSelectedQuarter }: SubjectGradeCardProps) => {
    const [isOpen, setIsOpen] = useState(false);

    const subjectName = grade.subjects?.name || 'Unknown';

    // Helper to get subject properties (Consistent with StudentScheduleTab)
    const getSubjectDetails = (name: string) => {
        const n = name.toLowerCase();

        if (n.includes('english')) return { icon: STUDENT_ICONS.english, color: 'from-rose-400 to-rose-600' };
        if (n.includes('math')) return { icon: STUDENT_ICONS.math, color: 'from-amber-400 to-amber-600' };
        if (n.includes('science')) return { icon: STUDENT_ICONS.science, color: 'from-emerald-400 to-emerald-600' };
        if (n.includes('social') || n.includes('araling')) return { icon: STUDENT_ICONS.socialStudies, color: 'from-sky-400 to-sky-600' };
        if (n.includes('filipino')) return { icon: STUDENT_ICONS.filipino, color: 'from-red-400 to-red-600' };
        if (n.includes('pe') || n.includes('mapeh')) return { icon: STUDENT_ICONS.mapeh, color: 'from-lime-400 to-lime-600' };
        if (n.includes('esp') || n.includes('values')) return { icon: STUDENT_ICONS.esp, color: 'from-pink-400 to-pink-600' };
        if (n.includes('tle') || n.includes('ict') || n.includes('computer')) return { icon: n.includes('ict') ? STUDENT_ICONS.ict : STUDENT_ICONS.tle, color: 'from-cyan-400 to-cyan-600' };
        if (n.includes('research')) return { icon: STUDENT_ICONS.research, color: 'from-violet-400 to-violet-600' };
        if (n.includes('mother') || n.includes('tongue')) return { icon: STUDENT_ICONS.motherTongue, color: 'from-indigo-400 to-indigo-600' };

        // Fallback rotating colors
        const colors = [
            'from-purple-400 to-purple-600',
            'from-orange-400 to-orange-600',
            'from-teal-400 to-teal-600',
            'from-fuchsia-400 to-fuchsia-600'
        ];
        return { icon: STUDENT_ICONS.english, color: colors[index % colors.length] };
    };

    const { icon: iconKey, color: gradientClass } = getSubjectDetails(subjectName);

    const currentGrade =
        globalSelectedQuarter === 'Q1' ? grade.q1_grade :
            globalSelectedQuarter === 'Q2' ? grade.q2_grade :
                globalSelectedQuarter === 'Q3' ? grade.q3_grade :
                    globalSelectedQuarter === 'Q4' ? grade.q4_grade :
                        grade.annual_grade || grade.final_grade;

    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="w-full"
        >
            <Collapsible open={isOpen} onOpenChange={setIsOpen}>
                <Card className={cn(
                    "border-none shadow-sm rounded-2xl overflow-hidden bg-gradient-to-r text-white transition-all duration-300",
                    isOpen ? "mb-2 shadow-lg ring-2 ring-white/20" : "h-16 sm:h-20 mb-0",
                    gradientClass, "relative"
                )}>
                    {/* Background Gradient Layer */}
                    <div className={cn("absolute inset-0 bg-gradient-to-r opacity-90 transition-colors duration-500", gradientClass)} />

                    <CollapsibleTrigger asChild>
                        <CardContent className="p-0 h-16 sm:h-20 flex items-center justify-between pr-4 sm:pr-6 pl-2 sm:pl-3 relative cursor-pointer group">
                            <div className="flex items-center gap-3 sm:gap-4">
                                {/* Freestanding Icon Container */}
                                <div className="w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center shrink-0 group-active:scale-95 transition-transform">
                                    <StudentPortalIcon
                                        icon={iconKey}
                                        size={32}
                                        className="sm:size-12 drop-shadow-md"
                                    />
                                </div>

                                <div className="min-w-0">
                                    <h4 className="font-bold text-sm sm:text-lg tracking-tight leading-tight uppercase truncate">
                                        {subjectName}
                                    </h4>
                                    <div className="flex items-center gap-2">
                                        <motion.div
                                            animate={{ rotate: isOpen ? 180 : 0 }}
                                            className="opacity-50"
                                        >
                                            <svg width="8" height="5" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                        </motion.div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col items-end shrink-0">
                                <span className="text-[9px] sm:text-[10px] font-bold opacity-70 uppercase tracking-widest mb-0.5">
                                    {globalSelectedQuarter === 'Annual' ? 'FINAL' : globalSelectedQuarter}
                                </span>
                                <div className="flex items-baseline gap-0.5">
                                    <span className="text-2xl sm:text-3xl font-black tracking-tighter">
                                        {currentGrade ? `${currentGrade}` : '-'}
                                    </span>
                                    <span className="text-sm sm:text-base font-bold opacity-60">%</span>
                                </div>
                            </div>
                        </CardContent>
                    </CollapsibleTrigger>

                    <CollapsibleContent asChild>
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3, ease: "easeInOut" }}
                        >
                            <div className="px-4 pb-4 sm:px-6 sm:pb-6 relative pt-2 border-t border-white/10">
                                <div className="grid grid-cols-4 gap-2 sm:gap-3">
                                    {(['Q1', 'Q2', 'Q3', 'Q4'] as const).map((q) => {
                                        const val = grade[`${q.toLowerCase()}_grade`];
                                        const isSelected = globalSelectedQuarter === q;
                                        return (
                                            <div
                                                key={q}
                                                className={cn(
                                                    "bg-white/10 backdrop-blur-md rounded-lg p-2 sm:p-3 border border-white/10 flex flex-col items-center justify-center transition-all",
                                                    isSelected ? "ring-2 ring-white bg-white/20" : ""
                                                )}
                                            >
                                                <span className="text-[8px] sm:text-[10px] font-black opacity-70 mb-0.5">{q}</span>
                                                <span className="text-lg sm:text-xl font-black">{val ?? '-'}%</span>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Annual Summary Box */}
                                <div className="mt-3 bg-white/20 backdrop-blur-md rounded-xl p-3 border border-white/20 flex items-center justify-between">
                                    <div className="flex flex-col">
                                        <span className="text-[9px] sm:text-[10px] font-black opacity-70">ANNUAL</span>
                                        <span className="text-xs sm:text-sm font-bold">Final Rating</span>
                                    </div>
                                    <div className="text-2xl sm:text-3xl font-black italic">
                                        {grade.annual_grade || grade.final_grade || '-'}%
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </CollapsibleContent>
                </Card>
            </Collapsible>
        </motion.div>
    );
};
