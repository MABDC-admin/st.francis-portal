import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { Users, CalendarDays, ClipboardCheck, FileText, Clock4, BookOpen } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAuth } from '@/contexts/AuthContext';
import { useTeacherProfile } from '@/hooks/useTeacherData';
import { useSchoolId } from '@/hooks/useSchoolId';
import { useAcademicYear } from '@/contexts/AcademicYearContext';
import { supabase } from '@/integrations/supabase/client';

interface TeacherClassesPageProps {
  onNavigate?: (tab: string) => void;
}

interface ScheduleRow {
  id: string;
  subject_id: string;
  grade_level: string;
  section: string | null;
  day_of_week: number;
  start_time: string;
  end_time: string;
  room: string | null;
  subjects: {
    code: string;
    name: string;
  } | null;
}

interface StudentSummary {
  id: string;
  level: string;
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const TeacherClassesPage = ({ onNavigate }: TeacherClassesPageProps) => {
  const { user } = useAuth();
  const { data: teacherProfile } = useTeacherProfile(user?.id);
  const { data: schoolId } = useSchoolId();
  const { selectedYearId } = useAcademicYear();

  const { data: schedules = [], isLoading: loadingSchedules } = useQuery({
    queryKey: ['teacher-classes-schedules', teacherProfile?.id, schoolId, selectedYearId],
    queryFn: async () => {
      if (!teacherProfile?.id || !schoolId || !selectedYearId) {
        return [] as ScheduleRow[];
      }

      const { data, error } = await supabase
        .from('class_schedules')
        .select('id, subject_id, grade_level, section, day_of_week, start_time, end_time, room, subjects:subject_id(code, name)')
        .eq('teacher_id', teacherProfile.id)
        .eq('school_id', schoolId)
        .eq('academic_year_id', selectedYearId)
        .order('day_of_week', { ascending: true })
        .order('start_time', { ascending: true });

      if (error) {
        throw error;
      }

      return (data || []) as ScheduleRow[];
    },
    enabled: !!teacherProfile?.id && !!schoolId && !!selectedYearId,
  });

  const { data: students = [], isLoading: loadingStudents } = useQuery({
    queryKey: ['teacher-classes-students', schoolId, selectedYearId, schedules.map((s) => s.grade_level).join('|')],
    queryFn: async () => {
      if (!schoolId || !selectedYearId || schedules.length === 0) {
        return [] as StudentSummary[];
      }

      const levels = [...new Set(schedules.map((s) => s.grade_level))];
      const { data, error } = await supabase
        .from('students')
        .select('id, level')
        .eq('school_id', schoolId)
        .eq('academic_year_id', selectedYearId)
        .in('level', levels);

      if (error) {
        throw error;
      }

      return (data || []) as StudentSummary[];
    },
    enabled: !!schoolId && !!selectedYearId && schedules.length > 0,
  });

  const classGroups = useMemo(() => {
    const grouped = new Map<string, { schedule: ScheduleRow; sessionsPerWeek: number }>();

    for (const schedule of schedules) {
      const key = `${schedule.subject_id}-${schedule.grade_level}-${schedule.section ?? 'n-a'}`;
      const existing = grouped.get(key);
      if (existing) {
        grouped.set(key, { ...existing, sessionsPerWeek: existing.sessionsPerWeek + 1 });
      } else {
        grouped.set(key, { schedule, sessionsPerWeek: 1 });
      }
    }

    return Array.from(grouped.values()).map(({ schedule, sessionsPerWeek }) => {
      const learnerCount = students.filter((student) => student.level === schedule.grade_level).length;
      return {
        ...schedule,
        sessionsPerWeek,
        learnerCount,
      };
    });
  }, [schedules, students]);

  const todayClasses = useMemo(
    () => schedules.filter((schedule) => schedule.day_of_week === new Date().getDay()),
    [schedules],
  );

  const totalLearners = useMemo(() => students.length, [students]);
  const isLoading = loadingSchedules || loadingStudents;

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">My Classes</h1>
          <p className="text-muted-foreground mt-1">View your assigned classes, schedules, and learner load.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => onNavigate?.('attendance-mgmt')}>
            <ClipboardCheck className="h-4 w-4 mr-2" />
            Take Attendance
          </Button>
          <Button onClick={() => onNavigate?.('grades')}>
            <FileText className="h-4 w-4 mr-2" />
            Open Gradebook
          </Button>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <BookOpen className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{classGroups.length}</p>
                <p className="text-xs text-muted-foreground">Assigned Classes</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-emerald-600" />
              <div>
                <p className="text-2xl font-bold">{totalLearners}</p>
                <p className="text-xs text-muted-foreground">Learners Covered</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <CalendarDays className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-2xl font-bold">{todayClasses.length}</p>
                <p className="text-xs text-muted-foreground">Classes Today</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock4 className="h-5 w-5" />
            Today&apos;s Schedule
          </CardTitle>
          <CardDescription>
            {DAYS[new Date().getDay()]} class sessions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {todayClasses.length === 0 ? (
            <p className="text-sm text-muted-foreground">No class sessions scheduled for today.</p>
          ) : (
            <div className="space-y-2">
              {todayClasses.map((session) => (
                <div key={session.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/40">
                  <div>
                    <p className="font-medium">{session.subjects?.name || 'Subject'}</p>
                    <p className="text-sm text-muted-foreground">
                      {session.grade_level}
                      {session.section ? ` - ${session.section}` : ''}
                      {session.room ? ` - ${session.room}` : ''}
                    </p>
                  </div>
                  <Badge variant="outline">
                    {session.start_time.slice(0, 5)} - {session.end_time.slice(0, 5)}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Assigned Class List</CardTitle>
          <CardDescription>Class profile, schedule density, and learner count.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading class assignments...</p>
          ) : classGroups.length === 0 ? (
            <p className="text-sm text-muted-foreground">No class assignments found for your account.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Subject</TableHead>
                  <TableHead>Level / Section</TableHead>
                  <TableHead>Sessions / Week</TableHead>
                  <TableHead>Learner Count</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {classGroups.map((entry) => (
                  <TableRow key={`${entry.subject_id}-${entry.grade_level}-${entry.section ?? 'n-a'}`}>
                    <TableCell className="font-medium">
                      {entry.subjects?.name || 'Unknown Subject'}
                      <span className="text-xs text-muted-foreground ml-2">({entry.subjects?.code || 'N/A'})</span>
                    </TableCell>
                    <TableCell>
                      {entry.grade_level}
                      {entry.section ? ` - ${entry.section}` : ''}
                    </TableCell>
                    <TableCell>{entry.sessionsPerWeek}</TableCell>
                    <TableCell>{entry.learnerCount}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
