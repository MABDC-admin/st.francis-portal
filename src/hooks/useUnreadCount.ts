import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function useUnreadCount() {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) { setUnreadCount(0); return; }

    const fetchUnread = async () => {
      // Get participant records
      const { data: participants } = await supabase
        .from('conversation_participants')
        .select('conversation_id, last_read_at')
        .eq('user_id', user.id);

      if (!participants?.length) { setUnreadCount(0); return; }

      let total = 0;
      for (const p of participants) {
        if (p.last_read_at) {
          const { count } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', p.conversation_id)
            .gt('created_at', p.last_read_at)
            .neq('sender_id', user.id);
          total += count || 0;
        }
      }
      setUnreadCount(total);
    };

    fetchUnread();

    // Refresh on new messages
    const channel = supabase
      .channel('unread-counter')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, () => {
        fetchUnread();
      })
      .subscribe();

    return () => { channel.unsubscribe(); };
  }, [user]);

  return unreadCount;
}
