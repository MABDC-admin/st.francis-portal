import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { matchesTeacherClassSlot } from '@/utils/teacherClassScope';

export interface TeacherRecord {
  id: string;
  user_id: string | null;
  employee_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  department: string | null;
  subjects: string[] | null;
  status: string | null;
  grade_level: string | null;
  school: string | null;
  created_at: string | null;
  updated_at: string | null;
}

interface TeacherScheduleFallbackOptions {
  schoolId?: string | null;
  academicYearId?: string | null;
  gradeLevel?: string | null;
}

interface ScheduleLookupRow {
  id: string;
  grade_level: string;
  section: string | null;
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

const fetchTeacherSchedulesWithFallback = async <T extends ScheduleLookupRow>({
  teacherId,
  selectClause,
  schoolId,
  academicYearId,
  gradeLevel,
}: {
  teacherId: string;
  selectClause: string;
} & TeacherScheduleFallbackOptions): Promise<T[]> => {
  if (!schoolId || !academicYearId) {
    return [];
  }

  const runDirectLookup = async () => {
    let query = supabase
      .from('class_schedules')
      .select(selectClause)
      .eq('teacher_id', teacherId)
      .eq('school_id', schoolId)
      .eq('academic_year_id', academicYearId);

    const { data, error } = await query
      .order('day_of_week', { ascending: true })
      .order('start_time', { ascending: true });

    if (error) {
      throw error;
    }

    return (data || []) as unknown as T[];
  };

  const selectedYearSchedules = await runDirectLookup();
  if (selectedYearSchedules.length > 0) {
    return selectedYearSchedules;
  }

  if (!gradeLevel) {
    return [];
  }

  const { data: advisorySections } = await supabase
    .from('sections')
    .select('name, grade_level')
    .eq('advisor_teacher_id', teacherId)
    .eq('school_id', schoolId)
    .eq('academic_year_id', academicYearId)
    .eq('is_active', true);

  const sectionNames = [...new Set((advisorySections || []).map((row) => row.name).filter((name): name is string => !!name))];
  const advisoryLevels = [...new Set((advisorySections || []).map((row) => row.grade_level).filter((level): level is string => !!level))];

  if (sectionNames.length > 0 && advisoryLevels.length > 0) {
    let advisoryQuery = supabase
      .from('class_schedules')
      .select(selectClause)
      .eq('school_id', schoolId)
      .eq('academic_year_id', academicYearId);

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
      return (advisorySchedules || []) as unknown as T[];
    }
  }

  const { data: gradeSchedules, error: gradeError } = await supabase
    .from('class_schedules')
    .select(selectClause)
    .eq('school_id', schoolId)
    .eq('academic_year_id', academicYearId)
    .eq('grade_level', gradeLevel)
    .order('day_of_week', { ascending: true })
    .order('start_time', { ascending: true });

  if (gradeError) {
    throw gradeError;
  }

  return (gradeSchedules || []) as unknown as T[];
};

// Fetch teacher profile by matching user_id, linked credentials, or email fallback
export const useTeacherProfile = (userId: string | undefined, userEmail?: string | null) => {
  return useQuery({
    queryKey: ['teacher-profile', userId, userEmail ?? null],
    queryFn: async () => {
      if (!userId && !userEmail) return null;

      const candidateMap = new Map<string, TeacherRecord>();

      const appendCandidates = (records: TeacherRecord[] | null | undefined) => {
        for (const record of records || []) {
          if (record?.id) {
            candidateMap.set(record.id, record);
          }
        }
      };

      const fetchTeachersByField = async (
        column: 'id' | 'user_id' | 'email',
        value: string,
        useCaseInsensitiveEmail = false,
      ) => {
        let query = supabase.from('teachers').select('*');
        query = column === 'email' && useCaseInsensitiveEmail
          ? query.ilike(column, value)
          : query.eq(column, value);

        const { data, error } = await query.limit(10);
        if (error) {
          console.error(`Error fetching teachers by ${column}:`, error);
          return [] as TeacherRecord[];
        }

        return (data || []) as TeacherRecord[];
      };

      let linkedTeacherId: string | null = null;
      if (userId) {
        appendCandidates(await fetchTeachersByField('user_id', userId));

        const { data: creds, error: credError } = await supabase
          .from('user_credentials')
          .select('teacher_id')
          .eq('user_id', userId)
          .maybeSingle();

        if (credError) {
          console.error('Error fetching teacher credential link by user ID:', credError);
        } else if (creds?.teacher_id) {
          linkedTeacherId = creds.teacher_id;
          appendCandidates(await fetchTeachersByField('id', creds.teacher_id));
        }
      }

      let resolvedEmail = userEmail?.trim().toLowerCase() || null;
      if (!resolvedEmail && userId) {
        const { data: authData } = await supabase.auth.getUser();
        resolvedEmail = authData.user?.email?.trim().toLowerCase() || null;
      }

      if (!resolvedEmail) {
        const fallbackCandidate = Array.from(candidateMap.values())[0] || null;
        return fallbackCandidate;
      }

      const { data: credsByEmail, error: credsByEmailError } = await supabase
        .from('user_credentials')
        .select('teacher_id')
        .ilike('email', resolvedEmail)
        .maybeSingle();

      if (credsByEmailError) {
        console.error('Error fetching teacher credential link by email:', credsByEmailError);
      } else if (credsByEmail?.teacher_id) {
        linkedTeacherId = linkedTeacherId || credsByEmail.teacher_id;
        appendCandidates(await fetchTeachersByField('id', credsByEmail.teacher_id));
      }

      appendCandidates(await fetchTeachersByField('email', resolvedEmail, true));

      const candidates = Array.from(candidateMap.values());
      if (candidates.length === 0) {
        return null;
      }

      const scoreCandidate = (candidate: TeacherRecord) => {
        let score = 0;

        if (userId && candidate.user_id === userId) score += 6;
        if (linkedTeacherId && candidate.id === linkedTeacherId) score += 10;
        if (resolvedEmail && candidate.email?.trim().toLowerCase() === resolvedEmail) score += 4;
        if (candidate.grade_level) score += 3;
        if (candidate.subjects && candidate.subjects.length > 0) score += 1;
        if (candidate.school) score += 1;

        return score;
      };

      const bestCandidate = candidates
        .sort((left, right) => scoreCandidate(right) - scoreCandidate(left))[0];

      return bestCandidate || null;
    },
    enabled: !!userId || !!userEmail,
    staleTime: 5 * 60 * 1000,
  });
};

// Fetch class schedules assigned to a teacher
export const useTeacherSchedule = (
  teacherId: string | undefined,
  schoolId?: string | null,
  academicYearId?: string | null,
  gradeLevel?: string | null,
) => {
  return useQuery({
    queryKey: ['teacher-schedule', teacherId, schoolId, academicYearId, gradeLevel],
    queryFn: async () => {
      if (!teacherId) return [];

      try {
        const rows = await fetchTeacherSchedulesWithFallback<ScheduleLookupRow & Record<string, unknown>>({
          teacherId,
          selectClause: `
            *,
            subjects:subject_id(id, name, code),
            academic_years:academic_year_id(name, is_current)
          `,
          schoolId,
          academicYearId,
          gradeLevel,
        });

        return rows;
      } catch (error) {
        console.error('Error fetching teacher schedule:', error);
        return [];
      }
    },
    enabled: !!teacherId,
    staleTime: 5 * 60 * 1000,
  });
};

// Fetch students in classes taught by this teacher (via class_schedules grade_level + section)
export const useTeacherStudentCount = (
  teacherId: string | undefined,
  schoolId?: string | null,
  academicYearId?: string | null,
  gradeLevel?: string | null,
) => {
  return useQuery({
    queryKey: ['teacher-student-count', teacherId, schoolId, academicYearId, gradeLevel],
    queryFn: async () => {
      if (!teacherId) return 0;

      try {
        const schedules = await fetchTeacherSchedulesWithFallback<ScheduleLookupRow>({
          teacherId,
          selectClause: 'id, grade_level, section, day_of_week, start_time',
          schoolId,
          academicYearId,
          gradeLevel,
        });

        const gradeLevels = schedules.length > 0
          ? [...new Set(schedules.map((schedule) => schedule.grade_level))]
          : (gradeLevel ? [gradeLevel] : []);
        const gradeLevelVariants = buildGradeLevelVariants(gradeLevels);

        if (!gradeLevels.length) return 0;

        const fetchStudents = async (withSchoolFilter: boolean, withYearFilter: boolean) => {
          let studentsQuery = supabase
            .from('students')
            .select('id, level, section')
            .in('level', gradeLevelVariants);

          if (withSchoolFilter && schoolId) {
            studentsQuery = studentsQuery.eq('school_id', schoolId);
          }

          if (withYearFilter && academicYearId) {
            studentsQuery = studentsQuery.eq('academic_year_id', academicYearId);
          }

          const { data, error } = await studentsQuery;
          if (error) {
            throw error;
          }
          return data || [];
        };

        if (!schoolId || !academicYearId) {
          return 0;
        }

        const students = await fetchStudents(true, true);

        if (!students.length) {
          return 0;
        }

        const classSlots = schedules.length > 0
          ? schedules.map((schedule) => ({
              level: schedule.grade_level,
              section: schedule.section,
            }))
          : gradeLevels.map((level) => ({
              level,
              section: null,
            }));

        const matchedLearnerIds = new Set<string>();
        for (const student of students) {
          const isMatch = matchesTeacherClassSlot(student.level, student.section, classSlots);

          if (isMatch) {
            matchedLearnerIds.add(student.id);
          }
        }

        return matchedLearnerIds.size;
      } catch (error) {
        console.error('Error fetching teacher learner count:', error);
        return 0;
      }
    },
    enabled: !!teacherId,
    staleTime: 5 * 60 * 1000,
  });
};

// Update teacher profile
export const useUpdateTeacherProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<TeacherRecord> }) => {
      const { data, error } = await supabase
        .from('teachers')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['teacher-profile'] });
      if (data.user_id) {
        queryClient.invalidateQueries({ queryKey: ['teacher-profile', data.user_id] });
      }
      toast.success('Profile updated successfully');
    },
    onError: (error: any) => {
      console.error('Error updating teacher profile:', error);
      toast.error(error.message || 'Failed to update profile');
    },
  });
};
