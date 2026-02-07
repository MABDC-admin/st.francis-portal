import { useState } from 'react';
import { Printer, FileDown, ChevronDown } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Student } from '@/types/student';
import { LISStudentOverview } from './LISStudentOverview';
import { LISAcademicHistory } from './LISAcademicHistory';
import { DocumentsManager } from '@/components/students/DocumentsManager';
import { LISIncidents } from './LISIncidents';
import { AnimatedStudentAvatar } from '@/components/students/AnimatedStudentAvatar';
import { Badge } from '@/components/ui/badge';

interface LISStudentDetailProps {
  student: Student;
}

export const LISStudentDetail = ({ student }: LISStudentDetailProps) => {
  const [activeTab, setActiveTab] = useState('overview');

  const handlePrint = () => window.print();

  return (
    <div className="space-y-4">
      {/* Header Card */}
      <div className="rounded-2xl overflow-hidden border border-border bg-card shadow-card">
        <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-accent/10 p-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <AnimatedStudentAvatar
              photoUrl={student.photo_url}
              name={student.student_name}
              size="xl"
              enableAnimation
            />
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold text-foreground">{student.student_name}</h2>
              <p className="text-sm text-muted-foreground mt-0.5">LRN: {student.lrn}</p>
              <div className="flex flex-wrap gap-2 mt-2">
                <Badge variant="secondary">{student.level}</Badge>
                {student.school && <Badge variant="outline">{student.school}</Badge>}
                {student.gender && (
                  <Badge variant="outline" className="capitalize">
                    {student.gender}
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex gap-2 self-start">
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="h-4 w-4 mr-1.5" />
                Print
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <FileDown className="h-4 w-4 mr-1.5" />
                    Export
                    <ChevronDown className="h-3 w-3 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>SF1 - School Form 1</DropdownMenuItem>
                  <DropdownMenuItem>SF9 - Report Card</DropdownMenuItem>
                  <DropdownMenuItem>Annex 1</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full justify-start rounded-xl bg-muted/50 p-1 h-auto flex-wrap">
          <TabsTrigger value="overview" className="rounded-lg text-sm">Overview</TabsTrigger>
          <TabsTrigger value="academic" className="rounded-lg text-sm">Academic History</TabsTrigger>
          <TabsTrigger value="documents" className="rounded-lg text-sm">Documents</TabsTrigger>
          <TabsTrigger value="incidents" className="rounded-lg text-sm">Incidents</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <LISStudentOverview student={student} />
        </TabsContent>
        <TabsContent value="academic">
          <LISAcademicHistory studentId={student.id} />
        </TabsContent>
        <TabsContent value="documents">
          <DocumentsManager studentId={student.id} />
        </TabsContent>
        <TabsContent value="incidents">
          <LISIncidents studentId={student.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
};
