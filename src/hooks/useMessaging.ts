import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { RealtimeChannel } from '@supabase/supabase-js';

export interface Conversation {
  id: string;
  type: 'private' | 'group';
  name: string | null;
  created_by: string;
  school_id: string | null;
  created_at: string;
  updated_at: string;
  participants?: Participant[];
  last_message?: Message | null;
  unread_count?: number;
}

export interface Participant {
  id: string;
  conversation_id: string;
  user_id: string;
  role: string;
  last_read_at: string | null;
  joined_at: string;
  profile?: { full_name: string | null; email: string | null; avatar_url: string | null };
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string | null;
  message_type: string;
  file_url: string | null;
  file_name: string | null;
  file_size: number | null;
  created_at: string;
  updated_at: string;
  sender_profile?: { full_name: string | null; avatar_url: string | null };
}

export function useMessaging() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const channelRef = useRef<RealtimeChannel | null>(null);
  const presenceRef = useRef<RealtimeChannel | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch conversations
  const fetchConversations = useCallback(async () => {
    if (!user) return;
    setLoadingConversations(true);
    try {
      // Get conversation IDs where user is a participant
      const { data: participantData } = await supabase
        .from('conversation_participants')
        .select('conversation_id, last_read_at')
        .eq('user_id', user.id);

      if (!participantData?.length) {
        setConversations([]);
        setLoadingConversations(false);
        return;
      }

      const convIds = participantData.map(p => p.conversation_id);
      const lastReadMap = Object.fromEntries(participantData.map(p => [p.conversation_id, p.last_read_at]));

      // Fetch conversations
      const { data: convData } = await supabase
        .from('conversations')
        .select('*')
        .in('id', convIds)
        .order('updated_at', { ascending: false });

      if (!convData) { setConversations([]); setLoadingConversations(false); return; }

      // Fetch all participants for these conversations
      const { data: allParticipants } = await supabase
        .from('conversation_participants')
        .select('*')
        .in('conversation_id', convIds);

      // Fetch profiles for participants
      const userIds = [...new Set((allParticipants || []).map(p => p.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, email, avatar_url')
        .in('id', userIds);

      const profileMap = Object.fromEntries((profiles || []).map(p => [p.id, p]));

      // Fetch latest message per conversation
      const enrichedConvs: Conversation[] = await Promise.all(convData.map(async (conv) => {
        const { data: lastMsg } = await supabase
          .from('messages')
          .select('*')
          .eq('conversation_id', conv.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        const convParticipants = (allParticipants || [])
          .filter(p => p.conversation_id === conv.id)
          .map(p => ({ ...p, profile: profileMap[p.user_id] }));

        // Calculate unread
        const lastRead = lastReadMap[conv.id];
        let unreadCount = 0;
        if (lastMsg && lastRead) {
          const { count } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', conv.id)
            .gt('created_at', lastRead)
            .neq('sender_id', user.id);
          unreadCount = count || 0;
        } else if (lastMsg && !lastRead) {
          unreadCount = 1;
        }

        return {
          ...conv,
          type: conv.type as 'private' | 'group',
          participants: convParticipants,
          last_message: lastMsg || null,
          unread_count: unreadCount,
        };
      }));

      setConversations(enrichedConvs);
    } catch (err) {
      console.error('Error fetching conversations:', err);
    } finally {
      setLoadingConversations(false);
    }
  }, [user]);

  // Fetch messages for active conversation
  const fetchMessages = useCallback(async (conversationId: string) => {
    setLoadingMessages(true);
    try {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (data) {
        // Enrich with sender profiles
        const senderIds = [...new Set(data.map(m => m.sender_id))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url')
          .in('id', senderIds);

        const profileMap = Object.fromEntries((profiles || []).map(p => [p.id, p]));
        setMessages(data.map(m => ({
          ...m,
          sender_profile: profileMap[m.sender_id] || null,
        })));
      }

      // Update last_read_at
      if (user) {
        await supabase
          .from('conversation_participants')
          .update({ last_read_at: new Date().toISOString() })
          .eq('conversation_id', conversationId)
          .eq('user_id', user.id);
      }
    } catch (err) {
      console.error('Error fetching messages:', err);
    } finally {
      setLoadingMessages(false);
    }
  }, [user]);

  // Send message
  const sendMessage = useCallback(async (
    conversationId: string,
    content: string,
    messageType: string = 'text',
    fileUrl?: string,
    fileName?: string,
    fileSize?: number
  ) => {
    if (!user) return;
    const { error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: user.id,
        content,
        message_type: messageType,
        file_url: fileUrl || null,
        file_name: fileName || null,
        file_size: fileSize || null,
      });

    if (error) {
      toast.error('Failed to send message');
      console.error(error);
    }

    // Update conversation updated_at
    await supabase
      .from('conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', conversationId);
  }, [user]);

  // Upload file
  const uploadFile = useCallback(async (file: File) => {
    if (!user) return null;
    const ext = file.name.split('.').pop();
    const path = `${user.id}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage
      .from('chat-attachments')
      .upload(path, file);

    if (error) {
      toast.error('Failed to upload file');
      return null;
    }

    const { data: urlData } = supabase.storage
      .from('chat-attachments')
      .getPublicUrl(path);

    return { url: urlData.publicUrl, name: file.name, size: file.size };
  }, [user]);

  // Create conversation
  const createConversation = useCallback(async (
    type: 'private' | 'group',
    participantIds: string[],
    name?: string
  ) => {
    if (!user) return null;

    // For private chats, check if one already exists
    if (type === 'private' && participantIds.length === 1) {
      const otherUserId = participantIds[0];
      const existing = conversations.find(c => {
        if (c.type !== 'private') return false;
        const pIds = c.participants?.map(p => p.user_id) || [];
        return pIds.includes(user.id) && pIds.includes(otherUserId);
      });
      if (existing) return existing;
    }

    const { data: conv, error } = await supabase
      .from('conversations')
      .insert({ type, name: name || null, created_by: user.id })
      .select()
      .single();

    if (error || !conv) {
      toast.error('Failed to create conversation');
      return null;
    }

    // Add participants
    const allParticipants = [user.id, ...participantIds];
    const { error: pError } = await supabase
      .from('conversation_participants')
      .insert(allParticipants.map(uid => ({
        conversation_id: conv.id,
        user_id: uid,
        role: uid === user.id ? 'admin' : 'member',
      })));

    if (pError) {
      console.error('Error adding participants:', pError);
    }

    await fetchConversations();
    return conv;
  }, [user, conversations, fetchConversations]);

  // Set active conversation
  const selectConversation = useCallback(async (conv: Conversation) => {
    setActiveConversation(conv);
    await fetchMessages(conv.id);
  }, [fetchMessages]);

  // Realtime subscriptions
  useEffect(() => {
    if (!user) return;
    fetchConversations();

    // Global presence channel
    const presenceChannel = supabase.channel('online-users');
    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState();
        const online = new Set<string>();
        Object.values(state).forEach((presences: any[]) => {
          presences.forEach(p => online.add(p.user_id));
        });
        setOnlineUsers(online);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await presenceChannel.track({ user_id: user.id, online_at: new Date().toISOString() });
        }
      });

    presenceRef.current = presenceChannel;

    return () => {
      presenceChannel.unsubscribe();
    };
  }, [user, fetchConversations]);

  // Subscribe to messages for active conversation
  useEffect(() => {
    if (!activeConversation || !user) return;

    // Cleanup previous
    if (channelRef.current) {
      channelRef.current.unsubscribe();
    }

    const channel = supabase
      .channel(`conv-${activeConversation.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${activeConversation.id}`,
      }, async (payload) => {
        const newMsg = payload.new as Message;
        // Fetch sender profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url')
          .eq('id', newMsg.sender_id)
          .single();

        setMessages(prev => [...prev, { ...newMsg, sender_profile: profile || undefined }]);

        // Update last_read_at
        await supabase
          .from('conversation_participants')
          .update({ last_read_at: new Date().toISOString() })
          .eq('conversation_id', activeConversation.id)
          .eq('user_id', user.id);

        // Refresh conversation list for unread counts
        fetchConversations();
      })
      .subscribe();

    // Typing presence
    const typingChannel = supabase.channel(`typing-${activeConversation.id}`);
    typingChannel
      .on('presence', { event: 'sync' }, () => {
        const state = typingChannel.presenceState();
        const typing: string[] = [];
        Object.values(state).forEach((presences: any[]) => {
          presences.forEach(p => {
            if (p.user_id !== user.id && p.is_typing) typing.push(p.user_name || 'Someone');
          });
        });
        setTypingUsers(typing);
      })
      .subscribe();

    channelRef.current = channel;

    return () => {
      channel.unsubscribe();
      typingChannel.unsubscribe();
    };
  }, [activeConversation, user, fetchConversations]);

  // Broadcast typing
  const broadcastTyping = useCallback(async () => {
    if (!activeConversation || !user) return;
    const typingChannel = supabase.channel(`typing-${activeConversation.id}`);
    
    // Track typing state
    try {
      await typingChannel.subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await typingChannel.track({
            user_id: user.id,
            user_name: user.user_metadata?.full_name || user.email,
            is_typing: true,
          });
        }
      });
    } catch {
      // ignore
    }

    // Clear after 3s
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(async () => {
      try {
        await typingChannel.untrack();
      } catch {
        // ignore
      }
    }, 3000);
  }, [activeConversation, user]);

  return {
    conversations,
    activeConversation,
    messages,
    loadingConversations,
    loadingMessages,
    typingUsers,
    onlineUsers,
    fetchConversations,
    selectConversation,
    sendMessage,
    uploadFile,
    createConversation,
    broadcastTyping,
    setActiveConversation,
  };
}
