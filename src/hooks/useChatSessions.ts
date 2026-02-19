import { useState, useCallback, useEffect } from 'react';
import type { ChatSession, Message, UploadedDoc } from '@/components/aichat/types';

const STORAGE_KEY = 'schoolai-chat-sessions';
const ACTIVE_KEY = 'schoolai-active-session';

function loadSessions(): ChatSession[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveSessions(sessions: ChatSession[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  } catch {
    // Storage full — silently fail
  }
}

function loadActiveId(): string | null {
  return localStorage.getItem(ACTIVE_KEY);
}

function saveActiveId(id: string) {
  localStorage.setItem(ACTIVE_KEY, id);
}

function createNewSession(): ChatSession {
  return {
    id: crypto.randomUUID(),
    title: 'New Chat',
    messages: [],
    uploadedDoc: null,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

function deriveTitle(messages: Message[]): string {
  const first = messages.find(m => m.role === 'user');
  if (!first) return 'New Chat';
  const text = first.content.slice(0, 40);
  return text.length < first.content.length ? text + '…' : text;
}

export function useChatSessions() {
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    const loaded = loadSessions();
    return loaded.length > 0 ? loaded : [createNewSession()];
  });

  const [activeId, setActiveId] = useState<string>(() => {
    const loaded = loadSessions();
    const savedId = loadActiveId();
    if (savedId && loaded.some(s => s.id === savedId)) return savedId;
    return loaded.length > 0 ? loaded[0].id : createNewSession().id;
  });

  // Persist on change
  useEffect(() => {
    saveSessions(sessions);
  }, [sessions]);

  useEffect(() => {
    saveActiveId(activeId);
  }, [activeId]);

  const activeSession = sessions.find(s => s.id === activeId) || sessions[0];

  const updateSession = useCallback((id: string, updates: Partial<ChatSession>) => {
    setSessions(prev =>
      prev.map(s => s.id === id ? { ...s, ...updates, updatedAt: Date.now() } : s)
    );
  }, []);

  const setMessages = useCallback((id: string, messages: Message[]) => {
    setSessions(prev =>
      prev.map(s => {
        if (s.id !== id) return s;
        const title = s.messages.length === 0 && messages.length > 0 ? deriveTitle(messages) : s.title;
        return { ...s, messages, title, updatedAt: Date.now() };
      })
    );
  }, []);

  const setUploadedDoc = useCallback((id: string, doc: UploadedDoc | null) => {
    updateSession(id, { uploadedDoc: doc });
  }, [updateSession]);

  const createSession = useCallback(() => {
    const newSession = createNewSession();
    setSessions(prev => [newSession, ...prev]);
    setActiveId(newSession.id);
    return newSession;
  }, []);

  const deleteSession = useCallback((id: string) => {
    setSessions(prev => {
      const filtered = prev.filter(s => s.id !== id);
      if (filtered.length === 0) {
        const fresh = createNewSession();
        setActiveId(fresh.id);
        return [fresh];
      }
      if (activeId === id) {
        setActiveId(filtered[0].id);
      }
      return filtered;
    });
  }, [activeId]);

  const clearSession = useCallback((id: string) => {
    updateSession(id, { messages: [], uploadedDoc: null, title: 'New Chat' });
  }, [updateSession]);

  return {
    sessions: sessions.sort((a, b) => b.updatedAt - a.updatedAt),
    activeSession,
    activeId,
    setActiveId,
    setMessages,
    setUploadedDoc,
    createSession,
    deleteSession,
    clearSession,
  };
}
