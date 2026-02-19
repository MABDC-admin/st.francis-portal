import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useStudentAssignments } from '@/hooks/useStudentPortalData';
import { ASSIGNMENT_TYPE_COLORS, type Assignment } from '@/types/studentPortal';
import { ClipboardList, Clock, CheckCircle, AlertTriangle, FileText } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { format, formatDistanceToNow, isPast } from 'date-fns';
import { useState, useMemo } from 'react';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { StudentPortalIcon, STUDENT_ICONS } from '@/components/icons/StudentPortalIcons';
import { Button } from '@/components/ui/button';
import { ExternalLink, Paperclip, ImageIcon, VideoIcon, ChevronLeft } from 'lucide-react';
import { Attachment } from '@/components/ui/MultiFileUploader';
import { useNavigate } from 'react-router-dom';

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

  const [selectedSubjectId, setSelectedSubjectId] = useState<string | 'all'>('all');
  const navigate = useNavigate();

  const handleOpenDetail = (assignment: Assignment) => {
    navigate(`/student/${studentId}/assignment/${assignment.id}`);
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


        <div className="pb-32" />
      </div>
    </div>
  );
};
