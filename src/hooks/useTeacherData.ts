import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

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

// Fetch teacher profile by matching user_id
export const useTeacherProfile = (userId: string | undefined) => {
  return useQuery({
    queryKey: ['teacher-profile', userId],
    queryFn: async () => {
      if (!userId) return null;

      // First try direct user_id match on teachers table
      const { data: teacher, error } = await supabase
        .from('teachers')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching teacher profile:', error);
        return null;
      }

      if (teacher) return teacher as TeacherRecord;

      // Fallback: check user_credentials for teacher_id link
      const { data: creds, error: credError } = await supabase
        .from('user_credentials')
        .select('teacher_id')
        .eq('user_id', userId)
        .maybeSingle();

      if (credError || !creds?.teacher_id) return null;

      const { data: teacherByCred, error: teacherError } = await supabase
        .from('teachers')
        .select('*')
        .eq('id', creds.teacher_id)
        .maybeSingle();

      if (teacherError) {
        console.error('Error fetching teacher by credential:', teacherError);
        return null;
      }

      return teacherByCred as TeacherRecord | null;
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });
};

// Fetch class schedules assigned to a teacher
export const useTeacherSchedule = (teacherId: string | undefined, schoolId?: string | null) => {
  return useQuery({
    queryKey: ['teacher-schedule', teacherId, schoolId],
    queryFn: async () => {
      if (!teacherId) return [];

      let query = supabase
        .from('class_schedules')
        .select(`
          *,
          subjects:subject_id(id, name, code),
          academic_years:academic_year_id(name, is_current)
        `)
        .eq('teacher_id', teacherId)
        .order('day_of_week', { ascending: true })
        .order('start_time', { ascending: true });

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching teacher schedule:', error);
        return [];
      }

      return data || [];
    },
    enabled: !!teacherId,
    staleTime: 5 * 60 * 1000,
  });
};

// Fetch students in classes taught by this teacher (via class_schedules grade_level + section)
export const useTeacherStudentCount = (teacherId: string | undefined) => {
  return useQuery({
    queryKey: ['teacher-student-count', teacherId],
    queryFn: async () => {
      if (!teacherId) return 0;

      // Get the grade levels this teacher teaches
      const { data: schedules, error: schedError } = await supabase
        .from('class_schedules')
        .select('grade_level')
        .eq('teacher_id', teacherId);

      if (schedError || !schedules?.length) return 0;

      const gradeLevels = [...new Set(schedules.map(s => s.grade_level))];

      const { count, error } = await supabase
        .from('students')
        .select('id', { count: 'exact', head: true })
        .in('level', gradeLevels);

      if (error) return 0;
      return count || 0;
    },
    enabled: !!teacherId,
    staleTime: 5 * 60 * 1000,
  });
};
