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
    const iconKey = subjectName.toLowerCase().includes('english') ? STUDENT_ICONS.english :
        subjectName.toLowerCase().includes('math') ? STUDENT_ICONS.math :
            subjectName.toLowerCase().includes('science') ? STUDENT_ICONS.science :
                subjectName.toLowerCase().includes('social') || subjectName.toLowerCase().includes('araling') ? STUDENT_ICONS.socialStudies :
                    subjectName.toLowerCase().includes('filipino') ? STUDENT_ICONS.filipino :
                        subjectName.toLowerCase().includes('pe') ? STUDENT_ICONS.pe :
                            subjectName.toLowerCase().includes('art') || subjectName.toLowerCase().includes('music') || subjectName.toLowerCase().includes('mapeh') || subjectName.toLowerCase().includes('p.e') || subjectName.toLowerCase().includes('pe') || subjectName.toLowerCase().includes('m.a.p.e.h') ? STUDENT_ICONS.mapeh :
                                subjectName.toLowerCase().includes('ict') || subjectName.toLowerCase().includes('computer') ? STUDENT_ICONS.ict :
                                    subjectName.toLowerCase().includes('tle') || subjectName.toLowerCase().includes('livelihood') ? (STUDENT_ICONS as any).tle :
                                        subjectName.toLowerCase().includes('esp') || subjectName.toLowerCase().includes('values') || subjectName.toLowerCase().includes('edukasyong') || subjectName.toLowerCase().includes('pagpapakatao') || subjectName.toLowerCase().includes('pagpapahalaga') || subjectName.toLowerCase().includes('pag papahalag') || subjectName.toLowerCase().includes('e.s.p') ? (STUDENT_ICONS as any).esp :
                                            subjectName.toLowerCase().includes('research') ? (STUDENT_ICONS as any).research :
                                                subjectName.toLowerCase().includes('mother tongue') ? (STUDENT_ICONS as any).motherTongue : STUDENT_ICONS.english;

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
                    "border-none shadow-md rounded-[2rem] sm:rounded-[2.5rem] overflow-hidden bg-gradient-to-r text-white transition-all duration-300",
                    isOpen ? "mb-4 shadow-xl ring-2 ring-white/20" : "h-28 sm:h-32 mb-0",
                    "from-rose-400 to-rose-500 relative"
                )}>
                    {/* Background Gradient Layer */}
                    <div className={cn("absolute inset-0 bg-gradient-to-r opacity-90 transition-colors duration-500",
                        index % 4 === 0 ? "from-rose-400 to-rose-600" :
                            index % 4 === 1 ? "from-amber-400 to-amber-600" :
                                index % 4 === 2 ? "from-emerald-400 to-emerald-600" :
                                    "from-sky-400 to-sky-600"
                    )} />

                    <CollapsibleTrigger asChild>
                        <CardContent className="p-0 h-28 sm:h-32 flex items-center justify-between pr-8 sm:pr-10 pl-4 sm:pl-6 relative cursor-pointer group">
                            <div className="flex items-center gap-4 sm:gap-6">
                                {/* Freestanding Icon Container */}
                                <div className="w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center shrink-0 group-active:scale-95 transition-transform">
                                    <StudentPortalIcon
                                        icon={iconKey}
                                        size={64}
                                        className="sm:size-20 drop-shadow-[0_10px_10px_rgba(0,0,0,0.3)]"
                                    />
                                </div>

                                <div className="min-w-0">
                                    <h4 className="font-black text-lg sm:text-2xl tracking-tight leading-tight uppercase truncate">
                                        {subjectName}
                                    </h4>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <p className="text-[10px] sm:text-xs font-bold opacity-70 tracking-widest uppercase">Academics</p>
                                        <motion.div
                                            animate={{ rotate: isOpen ? 180 : 0 }}
                                            className="opacity-50"
                                        >
                                            <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                        </motion.div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col items-end shrink-0">
                                <span className="text-[10px] sm:text-xs font-black opacity-70 uppercase tracking-widest bg-black/10 px-2 py-0.5 rounded-full mb-1">
                                    {globalSelectedQuarter === 'Annual' ? 'YEARLY' : globalSelectedQuarter}
                                </span>
                                <div className="flex items-baseline gap-0.5">
                                    <span className="text-3xl sm:text-5xl font-black tracking-tighter">
                                        {currentGrade ? `${currentGrade}` : '-'}
                                    </span>
                                    <span className="text-xl sm:text-2xl font-black opacity-60">%</span>
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
                            <div className="px-6 pb-6 sm:px-8 sm:pb-8 relative pt-2 border-t border-white/10">
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                                    {(['Q1', 'Q2', 'Q3', 'Q4'] as const).map((q) => {
                                        const val = grade[`${q.toLowerCase()}_grade`];
                                        const isSelected = globalSelectedQuarter === q;
                                        return (
                                            <div
                                                key={q}
                                                className={cn(
                                                    "bg-white/10 backdrop-blur-md rounded-2xl p-3 sm:p-4 border border-white/10 flex flex-col items-center justify-center transition-all",
                                                    isSelected ? "ring-2 ring-white bg-white/20" : ""
                                                )}
                                            >
                                                <span className="text-[10px] sm:text-xs font-black opacity-70 mb-1">{q} GRADE</span>
                                                <span className="text-2xl sm:text-3xl font-black">{val ?? '-'}%</span>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Annual Summary Box */}
                                <div className="mt-4 bg-white/20 backdrop-blur-md rounded-[1.5rem] p-4 border border-white/20 flex items-center justify-between">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] sm:text-xs font-black opacity-70">ANNUAL SUMMARY</span>
                                        <span className="text-sm sm:text-base font-bold">Final Academic Rating</span>
                                    </div>
                                    <div className="text-3xl sm:text-4xl font-black italic">
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
