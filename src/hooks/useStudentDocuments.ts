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
        .order('created_at', { ascending: false });
      
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
      file,
      documentName,
      isPdfPage = false,
      parentDocumentId = null,
      pageNumber = null,
      thumbnailUrl = null,
    }: { 
      studentId: string; 
      file: File;
      documentName: string;
      isPdfPage?: boolean;
      parentDocumentId?: string | null;
      pageNumber?: number | null;
      thumbnailUrl?: string | null;
    }) => {
      // Upload file to storage
      const fileName = `${studentId}/${Date.now()}-${file.name}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('student-documents')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('student-documents')
        .getPublicUrl(fileName);

      // Get the next slot number
      const { data: existingDocs } = await supabase
        .from('student_documents')
        .select('slot_number')
        .eq('student_id', studentId)
        .order('slot_number', { ascending: false })
        .limit(1);

      const nextSlot = existingDocs && existingDocs.length > 0 ? existingDocs[0].slot_number + 1 : 1;

      // Insert document record
      const { data, error } = await supabase
        .from('student_documents')
        .insert({
          student_id: studentId,
          slot_number: nextSlot,
          document_name: documentName,
          document_type: file.type,
          file_url: urlData.publicUrl,
          uploaded_at: new Date().toISOString(),
          is_pdf_page: isPdfPage,
          parent_document_id: parentDocumentId,
          page_number: pageNumber,
          thumbnail_url: thumbnailUrl || urlData.publicUrl,
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

export const useUploadPdfParent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      studentId, 
      file,
      documentName,
      pageCount,
    }: { 
      studentId: string; 
      file: File;
      documentName: string;
      pageCount: number;
    }) => {
      // Upload original PDF to storage
      const fileName = `${studentId}/${Date.now()}-${file.name}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('student-documents')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('student-documents')
        .getPublicUrl(fileName);

      // Get the next slot number
      const { data: existingDocs } = await supabase
        .from('student_documents')
        .select('slot_number')
        .eq('student_id', studentId)
        .order('slot_number', { ascending: false })
        .limit(1);

      const nextSlot = existingDocs && existingDocs.length > 0 ? existingDocs[0].slot_number + 1 : 1;

      // Insert parent PDF document record
      const { data, error } = await supabase
        .from('student_documents')
        .insert({
          student_id: studentId,
          slot_number: nextSlot,
          document_name: documentName,
          document_type: 'application/pdf',
          file_url: urlData.publicUrl,
          uploaded_at: new Date().toISOString(),
          is_pdf_page: false,
          page_count: pageCount,
          analysis_status: 'processing',
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
