import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface NewRegistration {
  id: string;
  student_name: string;
  level: string;
  created_at: string;
}

export function useRegistrationNotifications() {
  const { user, role } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [newRegistrations, setNewRegistrations] = useState<NewRegistration[]>([]);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const playNotificationSound = useCallback(() => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioContext();
      }
      const ctx = audioCtxRef.current;
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      oscillator.connect(gain);
      gain.connect(ctx.destination);
      oscillator.frequency.setValueAtTime(880, ctx.currentTime);
      oscillator.type = 'sine';
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.3);
    } catch {
      // Silently fail if audio not supported
    }
  }, []);

  const markAllRead = useCallback(() => {
    setUnreadCount(0);
    setNewRegistrations([]);
  }, []);

  useEffect(() => {
    if (!user || !['admin', 'registrar'].includes(role || '')) return;

    const channel = supabase
      .channel('registration-notifications')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'online_registrations' },
        (payload) => {
          const newReg = payload.new as any;
          setUnreadCount(prev => prev + 1);
          setNewRegistrations(prev => [{
            id: newReg.id,
            student_name: newReg.student_name,
            level: newReg.level,
            created_at: newReg.created_at,
          }, ...prev].slice(0, 10));
          playNotificationSound();
        }
      )
      .subscribe();

    return () => { channel.unsubscribe(); };
  }, [user, role, playNotificationSound]);

  return { unreadCount, newRegistrations, markAllRead };
}
