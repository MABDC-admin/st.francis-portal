import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Student, StudentFormData } from '@/types/student';
import { toast } from 'sonner';
import { useSchool } from '@/contexts/SchoolContext';
import { useAcademicYear } from '@/contexts/AcademicYearContext';
import { getSchoolId } from '@/utils/schoolIdMap';

export const useStudents = () => {
  const { selectedSchool } = useSchool();
  const { selectedYearId } = useAcademicYear();
  const schoolId = getSchoolId(selectedSchool);

  return useQuery({
    queryKey: ['students', selectedSchool, selectedYearId],
    queryFn: async (): Promise<Student[]> => {
      if (!schoolId || !selectedYearId) {
        return [];
      }

      const { data, error } = await supabase
        .from('students')
        .select('*, student_grades(q1_grade, q2_grade, q3_grade, q4_grade)')
        .eq('school_id', schoolId)
        .eq('academic_year_id', selectedYearId)
        .order('student_name', { ascending: true });

      if (error) {
        console.error('Error fetching students:', error);
        throw error;
      }

      return (data || []).map((student: any) => {
        const grades = student.student_grades || [];
        const has_grades = grades.length > 0;

        const grade_quarters = {
          q1: grades.some((g: any) => g.q1_grade !== null),
          q2: grades.some((g: any) => g.q2_grade !== null),
          q3: grades.some((g: any) => g.q3_grade !== null),
          q4: grades.some((g: any) => g.q4_grade !== null),
        };

        return {
          ...student,
          has_grades,
          grade_quarters
        };
      }) as Student[];
    },
    retry: 2,
    staleTime: 30000, // Consider data fresh for 30 seconds
    enabled: !!schoolId && !!selectedYearId,
  });
};

export const useCreateStudent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (student: StudentFormData) => {
      const enriched: any = { ...student };
      if (student.school && !enriched.school_id) {
        const schoolId = getSchoolId(student.school);
        if (schoolId) {
          enriched.school_id = schoolId;
        }
      }

      const { data, error } = await (supabase
        .from('students') as any)
        .insert([enriched])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      toast.success('Learner added successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to add learner: ' + error.message);
    },
  });
};

export const useUpdateStudent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...student }: StudentFormData & { id: string }) => {
      const { data, error } = await supabase
        .from('students')
        .update(student)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      toast.success('Learner updated successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to update learner: ' + error.message);
    },
  });
};

export const useDeleteStudent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('students')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      toast.success('Learner deleted successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to delete learner: ' + error.message);
    },
  });
};

export const useBulkCreateStudents = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (students: StudentFormData[]) => {
      const { data, error } = await (supabase
        .from('students') as any)
        .insert(students)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      toast.success(`${data.length} learners imported successfully`);
    },
    onError: (error: Error) => {
      toast.error('Failed to import learners: ' + error.message);
    },
  });
};
