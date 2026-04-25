import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Student, StudentFormData } from '@/types/student';
import { toast } from 'sonner';
import { useSchool } from '@/contexts/SchoolContext';
import { useAcademicYear } from '@/contexts/AcademicYearContext';
import { useSchoolId } from '@/hooks/useSchoolId';
import { studentSchema, formatValidationErrors } from '@/lib/validation';
import type { Database } from '@/integrations/supabase/types';

type StudentGradeQuarter = Pick<
  Database['public']['Tables']['student_grades']['Row'],
  'q1_grade' | 'q2_grade' | 'q3_grade' | 'q4_grade'
>;

type StudentWithGrades = Database['public']['Tables']['students']['Row'] & {
  student_grades: StudentGradeQuarter[] | null;
};

export const useStudents = () => {
  const { selectedSchool } = useSchool();
  const { selectedYearId } = useAcademicYear();
  const { data: schoolId } = useSchoolId();

  return useQuery({
    queryKey: ['students', schoolId, selectedYearId],
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

      return ((data || []) as StudentWithGrades[]).map((student) => {
        const grades = student.student_grades || [];
        const has_grades = grades.length > 0;

        const grade_quarters = {
          q1: grades.some((g) => g.q1_grade !== null),
          q2: grades.some((g) => g.q2_grade !== null),
          q3: grades.some((g) => g.q3_grade !== null),
          q4: grades.some((g) => g.q4_grade !== null),
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
  const { selectedSchool } = useSchool();
  const { selectedYearId } = useAcademicYear();
  const { data: schoolId } = useSchoolId();

  return useMutation({
    mutationFn: async (student: StudentFormData) => {
      if (!schoolId || !selectedYearId) {
        throw new Error('School and academic year must be selected before adding a learner.');
      }

      // Validate with Zod before sending to Supabase
      const validation = studentSchema.safeParse(student);
      if (!validation.success) {
        throw new Error(formatValidationErrors(validation.error));
      }

      const enriched: Database['public']['Tables']['students']['Insert'] = {
        ...student,
        school: student.school || selectedSchool,
        school_id: schoolId,
        academic_year_id: selectedYearId,
      };

      const { data, error } = await supabase
        .from('students')
        .insert([enriched])
        .select()
        .single();

      if (error) {throw error;}
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
  const { selectedSchool } = useSchool();
  const { selectedYearId } = useAcademicYear();
  const { data: schoolId } = useSchoolId();

  return useMutation({
    mutationFn: async ({ id, ...student }: StudentFormData & { id: string }) => {
      if (!schoolId || !selectedYearId) {
        throw new Error('School and academic year must be selected before updating a learner.');
      }

      const { data, error } = await supabase
        .from('students')
        .update({
          ...student,
          school: student.school || selectedSchool,
        })
        .eq('id', id)
        .eq('school_id', schoolId)
        .eq('academic_year_id', selectedYearId)
        .select()
        .single();

      if (error) {throw error;}
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
  const { selectedYearId } = useAcademicYear();
  const { data: schoolId } = useSchoolId();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!schoolId || !selectedYearId) {
        throw new Error('School and academic year must be selected before deleting a learner.');
      }

      const { error } = await supabase
        .from('students')
        .delete()
        .eq('id', id)
        .eq('school_id', schoolId)
        .eq('academic_year_id', selectedYearId);

      if (error) {throw error;}
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
  const { selectedSchool } = useSchool();
  const { selectedYearId } = useAcademicYear();
  const { data: schoolId } = useSchoolId();

  return useMutation({
    mutationFn: async (students: StudentFormData[]) => {
      if (!schoolId || !selectedYearId) {
        throw new Error('School and academic year must be selected before importing learners.');
      }

      const enrichedStudents = students.map((student) => ({
        ...student,
        school: student.school || selectedSchool,
        school_id: schoolId,
        academic_year_id: selectedYearId,
      }));

      const { data, error } = await supabase
        .from('students')
        .insert(enrichedStudents)
        .select();

      if (error) {throw error;}
      return data;
    },
    onSuccess: (data: Database['public']['Tables']['students']['Row'][]) => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      toast.success(`${data.length} learners imported successfully`);
    },
    onError: (error: Error) => {
      toast.error('Failed to import learners: ' + error.message);
    },
  });
};
