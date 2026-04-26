import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { Users, CalendarDays, ClipboardCheck, FileText, Clock4, BookOpen, TriangleAlert } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';
import { useTeacherProfile } from '@/hooks/useTeacherData';
import { useSchoolId } from '@/hooks/useSchoolId';
import { useAcademicYear } from '@/contexts/AcademicYearContext';
import { supabase } from '@/integrations/supabase/client';
import { matchesTeacherClassSlot } from '@/utils/teacherClassScope';

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
  section: string | null;
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
type ScheduleSource =
  | 'direct_selected_year'
  | 'advisory_section'
  | 'grade_level'
  | 'none';

interface ScheduleQueryResult {
  rows: ScheduleRow[];
  source: ScheduleSource;
}

const buildGradeLevelVariants = (levels: string[]) => {
  const variants = new Set<string>();

  for (const level of levels) {
    const raw = level.trim();
    if (!raw) continue;

    variants.add(raw);
    variants.add(raw.replace(/\s+/g, ' ').trim());

    const lower = raw.toLowerCase().trim();
    if (!lower.includes('kinder')) {
      const stripped = lower.replace(/^grade\s*/i, '').replace(/^g\s*/i, '').trim();
      const digitMatch = stripped.match(/^(\d{1,2})$/);

      if (digitMatch) {
        const gradeNum = digitMatch[1];
        variants.add(gradeNum);
        variants.add(`G${gradeNum}`);
        variants.add(`Grade ${gradeNum}`);
      }
    }
  }

  return Array.from(variants);
};

export const TeacherClassesPage = ({ onNavigate }: TeacherClassesPageProps) => {
  const { user } = useAuth();
  const { data: teacherProfile } = useTeacherProfile(user?.id, user?.email);
  const { data: schoolId } = useSchoolId();
  const { selectedYearId } = useAcademicYear();

  const { data: scheduleData, isLoading: loadingSchedules } = useQuery({
    queryKey: ['teacher-classes-schedules', teacherProfile?.id, schoolId, selectedYearId],
    queryFn: async () => {
      if (!teacherProfile?.id) {
        return { rows: [], source: 'none' } as ScheduleQueryResult;
      }

      const selectClause = 'id, subject_id, grade_level, section, day_of_week, start_time, end_time, room, subjects:subject_id(code, name)';

      if (!schoolId || !selectedYearId) {
        return { rows: [], source: 'none' } as ScheduleQueryResult;
      }

      const getDirectSchedules = async () => {
        let query = supabase
          .from('class_schedules')
          .select(selectClause)
          .eq('teacher_id', teacherProfile.id)
          .eq('school_id', schoolId)
          .eq('academic_year_id', selectedYearId);

        const { data, error } = await query
          .order('day_of_week', { ascending: true })
          .order('start_time', { ascending: true });

        if (error) {
          throw error;
        }

        return (data || []) as ScheduleRow[];
      };

      const directSelectedYear = await getDirectSchedules();
      if (directSelectedYear.length > 0) {
        return { rows: directSelectedYear, source: 'direct_selected_year' } as ScheduleQueryResult;
      }

      if (!teacherProfile.grade_level) {
        return { rows: [], source: 'none' } as ScheduleQueryResult;
      }

      const { data: advisorySections } = await supabase
        .from('sections')
        .select('name, grade_level')
        .eq('advisor_teacher_id', teacherProfile.id)
        .eq('school_id', schoolId)
        .eq('academic_year_id', selectedYearId)
        .eq('is_active', true);

      const sectionNames = [...new Set((advisorySections || []).map((row) => row.name).filter((name): name is string => !!name))];
      const advisoryLevels = [...new Set((advisorySections || []).map((row) => row.grade_level).filter((level): level is string => !!level))];

      if (sectionNames.length > 0 && advisoryLevels.length > 0) {
        let advisoryQuery = supabase
          .from('class_schedules')
          .select(selectClause)
          .eq('school_id', schoolId)
          .eq('academic_year_id', selectedYearId);

        advisoryQuery = advisoryLevels.length === 1
          ? advisoryQuery.eq('grade_level', advisoryLevels[0])
          : advisoryQuery.in('grade_level', advisoryLevels);

        advisoryQuery = sectionNames.length === 1
          ? advisoryQuery.eq('section', sectionNames[0])
          : advisoryQuery.in('section', sectionNames);

        const { data: advisorySchedules, error: advisoryError } = await advisoryQuery
          .order('day_of_week', { ascending: true })
          .order('start_time', { ascending: true });

        if (advisoryError) {
          throw advisoryError;
        }

        if ((advisorySchedules || []).length > 0) {
          return { rows: (advisorySchedules || []) as ScheduleRow[], source: 'advisory_section' } as ScheduleQueryResult;
        }
      }

      const { data: gradeSchedules, error: gradeError } = await supabase
        .from('class_schedules')
        .select(selectClause)
        .eq('school_id', schoolId)
        .eq('academic_year_id', selectedYearId)
        .eq('grade_level', teacherProfile.grade_level)
        .order('day_of_week', { ascending: true })
        .order('start_time', { ascending: true });

      if (gradeError) {
        throw gradeError;
      }

      if ((gradeSchedules || []).length > 0) {
        return { rows: (gradeSchedules || []) as ScheduleRow[], source: 'grade_level' } as ScheduleQueryResult;
      }

      return { rows: [], source: 'none' } as ScheduleQueryResult;
    },
    enabled: !!teacherProfile?.id,
  });

  const schedules = scheduleData?.rows || [];
  const scheduleSource = scheduleData?.source || 'none';

  const { data: students = [], isLoading: loadingStudents } = useQuery({
    queryKey: [
      'teacher-classes-students',
      schoolId,
      selectedYearId,
      scheduleSource,
      schedules.map((s) => `${s.grade_level}:${s.section ?? '-'}`).join('|'),
      teacherProfile?.grade_level || '-',
    ],
    queryFn: async () => {
      const levels = schedules.length > 0
        ? [...new Set(schedules.map((s) => s.grade_level))]
        : (teacherProfile?.grade_level ? [teacherProfile.grade_level] : []);
      const levelVariants = buildGradeLevelVariants(levels);

      if (levels.length === 0) {
        return [] as StudentSummary[];
      }

      const fetchStudents = async (withSchoolFilter: boolean, withYearFilter: boolean) => {
        let query = supabase
          .from('students')
          .select('id, level, section')
          .in('level', levelVariants);

        if (withSchoolFilter && schoolId) {
          query = query.eq('school_id', schoolId);
        }

        if (withYearFilter && selectedYearId) {
          query = query.eq('academic_year_id', selectedYearId);
        }

        const { data, error } = await query;

        if (error) {
          throw error;
        }

        return (data || []) as StudentSummary[];
      };

      if (!schoolId || !selectedYearId) {
        return [] as StudentSummary[];
      }

      return fetchStudents(true, true);
    },
    enabled: !!schoolId && (schedules.length > 0 || !!teacherProfile?.grade_level),
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
      const learnerCount = students.filter((student) => {
        return matchesTeacherClassSlot(student.level, student.section, [{
          level: schedule.grade_level,
          section: schedule.section,
        }]);
      }).length;

      return {
        ...schedule,
        sessionsPerWeek,
        learnerCount,
      };
    });
  }, [schedules, students]);

  const visibleStudents = useMemo(() => {
    if (schedules.length === 0) {
      return [] as StudentSummary[];
    }

    const classSlots = schedules.map((schedule) => ({
      level: schedule.grade_level,
      section: schedule.section,
    }));

    return students.filter((student) =>
      matchesTeacherClassSlot(student.level, student.section, classSlots),
    );
  }, [schedules, students]);

  const todayClasses = useMemo(
    () => schedules.filter((schedule) => schedule.day_of_week === new Date().getDay()),
    [schedules],
  );

  const totalLearners = useMemo(() => visibleStudents.length, [visibleStudents]);
  const isLoading = loadingSchedules || loadingStudents;

  const fallbackNotice = useMemo(() => {
    switch (scheduleSource) {
      case 'advisory_section':
        return 'No direct class schedule was linked to your account for the current academic year, so advisory section schedules are shown.';
      case 'grade_level':
        return `No direct teacher schedule was found for the current academic year, so grade-level schedules for ${teacherProfile?.grade_level} are shown.`;
      default:
        return null;
    }
  }, [scheduleSource, teacherProfile?.grade_level]);

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

      {fallbackNotice && (
        <Alert className="border-amber-300 bg-amber-50 text-amber-900">
          <TriangleAlert className="h-4 w-4 text-amber-700" />
          <AlertDescription>{fallbackNotice}</AlertDescription>
        </Alert>
      )}

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
