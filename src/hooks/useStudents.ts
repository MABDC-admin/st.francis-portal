import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Student, StudentFormData } from '@/types/student';
import { toast } from 'sonner';
import { useSchool, SchoolType } from '@/contexts/SchoolContext';

export const useStudents = (schoolOverride?: SchoolType) => {
  const { selectedSchool } = useSchool();
  const school = schoolOverride || selectedSchool;
  
  return useQuery({
    queryKey: ['students', school],
    queryFn: async (): Promise<Student[]> => {
      let query = supabase
        .from('students')
        .select('*')
        .order('student_name', { ascending: true });
      
      // Filter by school
      if (school === 'STFXSA') {
        query = query.or('school.ilike.%stfxsa%,school.ilike.%st. francis%');
      } else {
        // MABDC - includes MABDC or null/empty school values
        query = query.or('school.ilike.%mabdc%,school.is.null,school.eq.');
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    },
  });
};

export const useCreateStudent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (student: StudentFormData) => {
      const { data, error } = await supabase
        .from('students')
        .insert([student])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      toast.success('Student added successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to add student: ' + error.message);
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
      toast.success('Student updated successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to update student: ' + error.message);
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
      toast.success('Student deleted successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to delete student: ' + error.message);
    },
  });
};

export const useBulkCreateStudents = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (students: StudentFormData[]) => {
      const { data, error } = await supabase
        .from('students')
        .insert(students)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      toast.success(`${data.length} students imported successfully`);
    },
    onError: (error: Error) => {
      toast.error('Failed to import students: ' + error.message);
    },
  });
};
