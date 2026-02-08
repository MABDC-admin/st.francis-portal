import { useState } from 'react';
import { Student } from '@/types/student';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Calendar, User, Heart, MapPin, Phone, BookOpen, Bus, TrendingUp, ClipboardCheck } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface StudentDetailPanelProps {
  student: Student;
}

type DetailTab = 'progress' | 'attendance' | 'fees' | 'bus';

const tabs: { id: DetailTab; label: string; icon: React.ElementType }[] = [
  { id: 'progress', label: 'Progress', icon: TrendingUp },
  { id: 'attendance', label: 'Attendance', icon: ClipboardCheck },
  { id: 'fees', label: 'Fees History', icon: BookOpen },
  { id: 'bus', label: 'School Bus', icon: Bus },
];

export const StudentDetailPanel = ({ student }: StudentDetailPanelProps) => {
  const [activeTab, setActiveTab] = useState<DetailTab>('progress');

  const address = student.uae_address || student.phil_address || '-';
  const birthDate = student.birth_date
    ? format(new Date(student.birth_date), 'MMM dd, yyyy')
    : '-';

  // Mock progress data from quarter grades if available
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
            <div className="min-w-0">
              <h2 className="text-xl font-bold truncate">{student.student_name}</h2>
              <div className="flex flex-wrap items-center gap-3 mt-1.5 text-sm text-white/70">
                <span className="bg-white/10 px-2.5 py-0.5 rounded-full text-xs font-medium">
                  {student.level}
                </span>
                <span className="font-mono text-xs">ID: {student.lrn}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Basic Details Card */}
        <Card className="border shadow-sm">
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

        {/* Tabs */}
        <div>
          <div className="flex border-b border-border">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors',
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
            {activeTab === 'progress' && (
              progressData.length > 0 ? (
                <div className="h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={progressData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="quarter" className="text-xs" />
                      <YAxis domain={[70, 100]} className="text-xs" />
                      <Tooltip />
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
                <div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground">
                  <TrendingUp className="h-10 w-10 mb-2 opacity-30" />
                  <p className="text-sm">No grade data available yet</p>
                </div>
              )
            )}

            {activeTab === 'attendance' && (
              <div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground">
                <ClipboardCheck className="h-10 w-10 mb-2 opacity-30" />
                <p className="text-sm">Attendance records will appear here</p>
              </div>
            )}

            {activeTab === 'fees' && (
              <div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground">
                <BookOpen className="h-10 w-10 mb-2 opacity-30" />
                <p className="text-sm">Fees history will appear here</p>
              </div>
            )}

            {activeTab === 'bus' && (
              <div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground">
                <Bus className="h-10 w-10 mb-2 opacity-30" />
                <p className="text-sm">School bus information will appear here</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </ScrollArea>
  );
};
