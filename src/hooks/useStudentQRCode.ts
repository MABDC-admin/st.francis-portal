import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useStudentQRCode = (studentId: string | undefined) => {
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchQRCode = useCallback(async () => {
    if (!studentId) return;
    setIsLoading(true);
    setError(null);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('generate-student-qr', {
        body: { student_id: studentId },
      });
      if (fnError) throw fnError;
      if (data?.error) throw new Error(data.error);
      setQrCodeUrl(data.qr_data_url);
    } catch (err: any) {
      console.error('QR fetch error:', err);
      setError(err.message || 'Failed to generate QR code');
    } finally {
      setIsLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    fetchQRCode();
  }, [fetchQRCode]);

  // Realtime subscription for password changes
  useEffect(() => {
    if (!studentId) return;

    const channel = supabase
      .channel(`qr-creds-${studentId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'user_credentials',
          filter: `student_id=eq.${studentId}`,
        },
        () => {
          console.log('Credentials changed, regenerating QR...');
          fetchQRCode();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [studentId, fetchQRCode]);

  return { qrCodeUrl, isLoading, error, refetch: fetchQRCode };
};
