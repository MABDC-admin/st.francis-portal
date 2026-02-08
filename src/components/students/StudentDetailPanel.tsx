import { useState, useEffect } from 'react';
import { Student } from '@/types/student';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Calendar, User, Heart, MapPin, Phone, BookOpen, TrendingUp, ClipboardCheck, GraduationCap, FolderOpen, Calculator, AlertTriangle, Loader2 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { useStudentQRCode } from '@/hooks/useStudentQRCode';
import { StudentSubjectsManager } from './StudentSubjectsManager';
import { DocumentsManager } from './DocumentsManager';
import { TransmutationManager } from './TransmutationManager';
import { AnecdotalBehaviorTab } from './AnecdotalBehaviorTab';
import { AcademicHistoryTab } from './AcademicHistoryTab';
import { supabase } from '@/integrations/supabase/client';

interface StudentDetailPanelProps {
  student: Student;
}

type DetailTab = 'overview' | 'academic' | 'subjects' | 'documents' | 'anecdotal' | 'grades';

const tabs: { id: DetailTab; label: string; icon: React.ElementType }[] = [
  { id: 'overview', label: 'Overview', icon: TrendingUp },
  { id: 'academic', label: 'Academic', icon: BookOpen },
  { id: 'subjects', label: 'Subjects', icon: GraduationCap },
  { id: 'documents', label: 'Documents', icon: FolderOpen },
  { id: 'anecdotal', label: 'Anecdotal', icon: AlertTriangle },
  { id: 'grades', label: 'Grades', icon: Calculator },
];

export const StudentDetailPanel = ({ student }: StudentDetailPanelProps) => {
  const [activeTab, setActiveTab] = useState<DetailTab>('overview');
  const { qrCodeUrl, isLoading: qrLoading } = useStudentQRCode(student.id);
  const [currentAcademicYearId, setCurrentAcademicYearId] = useState<string>('');

  useEffect(() => {
    const fetchCurrentYear = async () => {
      const { data } = await supabase
        .from('academic_years')
        .select('id')
        .eq('is_current', true)
        .single();
      if (data) setCurrentAcademicYearId(data.id);
    };
    fetchCurrentYear();
  }, []);

  // Reset tab when student changes
  useEffect(() => {
    setActiveTab('overview');
  }, [student.id]);

  const address = student.uae_address || student.phil_address || '-';
  const birthDate = student.birth_date
    ? format(new Date(student.birth_date), 'MMM dd, yyyy')
    : '-';

  const progressData = student.grade_quarters
    ? [
        { quarter: 'Q1', grade: student.grade_quarters.q1 ? 88 : null },
        { quarter: 'Q2', grade: student.grade_quarters.q2 ? 85 : null },
        { quarter: 'Q3', grade: student.grade_quarters.q3 ? 90 : null },
        { quarter: 'Q4', grade: student.grade_quarters.q4 ? 87 : null },
      ].filter(d => d.grade !== null)
    : [];

  const detailItems = [
    { label: 'Gender', value: student.gender || '-', icon: User },
    { label: 'Date of Birth', value: birthDate, icon: Calendar },
    { label: 'Religion', value: '-', icon: Heart },
    { label: 'Blood Group', value: '-', icon: Heart },
    { label: 'Address', value: address, icon: MapPin, span: true },
    {
      label: 'Father',
      value: student.father_name
        ? `${student.father_name}${student.father_contact ? ' • ' + student.father_contact : ''}`
        : '-',
      icon: Phone,
    },
    {
      label: 'Mother',
      value: student.mother_maiden_name
        ? `${student.mother_maiden_name}${student.mother_contact ? ' • ' + student.mother_contact : ''}`
        : '-',
      icon: Phone,
    },
  ];

  return (
    <ScrollArea className="h-full">
      <div className="space-y-4 pb-6">
        {/* Dark Header Banner */}
        <div className="bg-gradient-to-r from-foreground/90 via-foreground/80 to-foreground/90 rounded-xl p-6 text-primary-foreground">
          <div className="flex items-center gap-5">
            <Avatar className="h-20 w-20 border-2 border-white/20">
              <AvatarImage src={student.photo_url || undefined} alt={student.student_name} />
              <AvatarFallback className="bg-white/10 text-white text-2xl font-bold">
                {student.student_name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <h2 className="text-xl font-bold truncate">{student.student_name}</h2>
              <div className="flex flex-wrap items-center gap-3 mt-1.5 text-sm text-white/70">
                <span className="bg-white/10 px-2.5 py-0.5 rounded-full text-xs font-medium">
                  {student.level}
                </span>
                <span className="font-mono text-xs">ID: {student.lrn}</span>
              </div>
            </div>
            {/* QR Code */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="shrink-0">
                    {qrLoading ? (
                      <Skeleton className="h-20 w-20 rounded-lg bg-white/10" />
                    ) : qrCodeUrl ? (
                      <img
                        src={qrCodeUrl}
                        alt="Student QR Code"
                        className="h-20 w-20 rounded-lg border-2 border-white/20"
                      />
                    ) : (
                      <div className="h-20 w-20 rounded-lg border-2 border-white/10 flex items-center justify-center text-white/30 text-[10px] text-center">
                        No QR
                      </div>
                    )}
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Scan for student credentials</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        {/* Tabs */}
        <div>
          <div className="flex border-b border-border overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium border-b-2 transition-colors whitespace-nowrap',
                  activeTab === tab.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                )}
              >
                <tab.icon className="h-3.5 w-3.5" />
                {tab.label}
              </button>
            ))}
          </div>

          <div className="pt-4 min-h-[200px]">
            {activeTab === 'overview' && (
              <>
                {/* Basic Details Card */}
                <Card className="border shadow-sm mb-4">
                  <CardContent className="p-5">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                      Basic Details
                    </h3>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                      {detailItems.map((item) => (
                        <div key={item.label} className={cn(item.span && 'col-span-2')}>
                          <p className="text-xs text-muted-foreground mb-0.5 flex items-center gap-1.5">
                            <item.icon className="h-3 w-3" />
                            {item.label}
                          </p>
                          <p className="text-sm font-medium truncate">{item.value}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Progress Chart */}
                {progressData.length > 0 ? (
                  <div className="h-[220px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={progressData}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                        <XAxis dataKey="quarter" className="text-xs" />
                        <YAxis domain={[70, 100]} className="text-xs" />
                        <RechartsTooltip />
                        <Line
                          type="monotone"
                          dataKey="grade"
                          stroke="hsl(var(--primary))"
                          strokeWidth={2}
                          dot={{ fill: 'hsl(var(--primary))', r: 4 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-[120px] text-muted-foreground">
                    <TrendingUp className="h-10 w-10 mb-2 opacity-30" />
                    <p className="text-sm">No grade data available yet</p>
                  </div>
                )}
              </>
            )}

            {activeTab === 'academic' && (
              <AcademicHistoryTab student={student} />
            )}

            {activeTab === 'subjects' && (
              <StudentSubjectsManager studentId={student.id} gradeLevel={student.level} />
            )}

            {activeTab === 'documents' && (
              <DocumentsManager studentId={student.id} />
            )}

            {activeTab === 'anecdotal' && (
              <AnecdotalBehaviorTab studentId={student.id} />
            )}

            {activeTab === 'grades' && (
              currentAcademicYearId ? (
                <TransmutationManager student={student} academicYearId={currentAcademicYearId} />
              ) : (
                <div className="flex items-center justify-center h-64">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </ScrollArea>
  );
};
