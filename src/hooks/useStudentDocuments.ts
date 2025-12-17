import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { StudentDocument } from '@/types/student';

export const useStudentDocuments = (studentId: string) => {
  return useQuery({
    queryKey: ['student-documents', studentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('student_documents')
        .select('*')
        .eq('student_id', studentId)
        .order('slot_number');
      
      if (error) throw error;
      return data as StudentDocument[];
    },
    enabled: !!studentId,
  });
};

export const useUploadDocument = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      studentId, 
      slotNumber, 
      file 
    }: { 
      studentId: string; 
      slotNumber: number; 
      file: File;
    }) => {
      // Upload file to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${studentId}/${slotNumber}-${Date.now()}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('student-documents')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('student-documents')
        .getPublicUrl(fileName);

      // Upsert document record
      const { data, error } = await supabase
        .from('student_documents')
        .upsert({
          student_id: studentId,
          slot_number: slotNumber,
          document_name: file.name,
          document_type: file.type,
          file_url: urlData.publicUrl,
          uploaded_at: new Date().toISOString(),
        }, {
          onConflict: 'student_id,slot_number'
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['student-documents', variables.studentId] });
    },
  });
};

export const useDeleteDocument = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      documentId, 
      studentId,
      fileUrl 
    }: { 
      documentId: string; 
      studentId: string;
      fileUrl: string | null;
    }) => {
      // Delete from storage if file exists
      if (fileUrl) {
        const path = fileUrl.split('/student-documents/')[1];
        if (path) {
          await supabase.storage.from('student-documents').remove([path]);
        }
      }

      // Delete document record
      const { error } = await supabase
        .from('student_documents')
        .delete()
        .eq('id', documentId);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['student-documents', variables.studentId] });
    },
  });
};

export const useUploadStudentPhoto = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ studentId, file }: { studentId: string; file: File }) => {
      // Upload file to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${studentId}/photo.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('student-photos')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('student-photos')
        .getPublicUrl(fileName);

      // Update student record
      const { data, error } = await supabase
        .from('students')
        .update({ photo_url: urlData.publicUrl + '?t=' + Date.now() })
        .eq('id', studentId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
    },
  });
};
