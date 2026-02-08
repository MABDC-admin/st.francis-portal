import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Square, Bot, FileText, X, Loader2, Eraser } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { extractPdfText, type ExtractedPdfResult, type ExtractionProgress } from '@/utils/extractPdfText';
import { useChatSessions } from '@/hooks/useChatSessions';
import { ChatSidebar } from './ChatSidebar';
import { ChatMessageBubble } from './ChatMessageBubble';
import { ChatEmptyState } from './ChatEmptyState';
import { ChatActionMenu, type ModeInfo } from './ChatActionMenu';
import { ChatSuggestionChips } from './ChatSuggestionChips';
import { CHAT_URL, IMAGE_URL, SCHOOL_SYSTEM_PROMPT, isImageRequest, isFindRequest, extractFindQuery } from './constants';
import type { Message } from './types';
import { supabase } from '@/integrations/supabase/client';

export const AIChatPage = () => {
  const { session } = useAuth();
  const {
    sessions, activeSession, activeId, setActiveId,
    setMessages: persistMessages, setUploadedDoc: persistDoc,
    createSession, deleteSession, clearSession,
  } = useChatSessions();

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isExtractingPdf, setIsExtractingPdf] = useState(false);
  const [activeMode, setActiveMode] = useState<ModeInfo | null>(null);
  const [extractionProgress, setExtractionProgress] = useState<ExtractionProgress | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const messages = activeSession.messages;
  const uploadedDoc = activeSession.uploadedDoc;

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);

  // Stop loading when switching sessions
  useEffect(() => {
    setIsLoading(false);
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
  }, [activeId]);

  const handleStop = () => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    setIsLoading(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.name.toLowerCase().split('.').pop() !== 'pdf') {
      toast.error('Only PDF files are supported.');
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      toast.error('File too large. Maximum 20MB.');
      return;
    }
    setIsExtractingPdf(true);
    setExtractionProgress(null);
    try {
      const result: ExtractedPdfResult = await extractPdfText(file, (p) => setExtractionProgress(p));
      persistDoc(activeId, { filename: result.filename, text: result.text, pageCount: result.pageCount });
      toast.success(`"${result.filename}" loaded (${result.pageCount} pages).`);
    } catch {
      toast.error('Failed to read PDF.');
    } finally {
      setIsExtractingPdf(false);
      setExtractionProgress(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeDoc = () => {
    persistDoc(activeId, null);
    toast.info('Document removed.');
  };

  const handleImageGeneration = async (prompt: string) => {
    const controller = new AbortController();
    abortControllerRef.current = controller;
    try {
      const resp = await fetch(IMAGE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
        body: JSON.stringify({ prompt }),
        signal: controller.signal,
      });
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        toast.error(err.error || `Error: ${resp.status}`);
        return null;
      }
      const data = await resp.json();
      return { id: crypto.randomUUID(), role: 'assistant' as const, content: data.text || 'Here\'s your generated image:', images: data.images || [] };
    } catch (err: any) {
      if (err.name !== 'AbortError') toast.error('Failed to generate image.');
      return null;
    }
  };

  const handleFindRequest = async (query: string, allMessages: Message[]) => {
    try {
      const { data, error } = await supabase.functions.invoke('search-books', {
        body: { query, limit: 20 },
      });

      if (error) console.error('Library search error:', error);

      const results = data?.results || [];
      const totalMatches = data?.total_matches || 0;

      let contextPrompt: string;
      if (results.length === 0 || totalMatches === 0) {
        contextPrompt = `The user searched the school library for "${query}" but no results were found in any indexed books. Let them know no library results were found, then provide a helpful academic explanation of the topic "${query}" instead. Be educational and thorough.`;
      } else {
        const baseUrl = window.location.origin;
        let context = `The user searched the school library for "${query}". Here are the matching results from indexed books (${totalMatches} matches in ${results.length} books):\n\n`;
        for (const book of results) {
          context += `📚 **${book.book_title}**${book.subject ? ` (${book.subject})` : ''}${book.grade_level ? ` — Grade ${book.grade_level}` : ''}\n`;
          for (const match of book.matches.slice(0, 5)) {
            const bookLink = `${baseUrl}/library/book/${book.book_id}?page=${match.page_number}`;
            context += `  - Page ${match.page_number}`;
            if (match.chapter_title) context += ` | Chapter: ${match.chapter_title}`;
            if (match.topics?.length) context += ` | Topics: ${match.topics.join(', ')}`;
            if (match.snippet) context += `\n    Snippet: "${match.snippet}"`;
            context += `\n    [📖 Open "${book.book_title}" — Page ${match.page_number}](${bookLink})`;
            context += '\n';
          }
          context += '\n';
        }
        contextPrompt = `${context}\nFormat these library search results beautifully for the user. Present each book with its page numbers, chapters, topics, and snippets. IMPORTANT: You MUST include the markdown links exactly as provided above (the [📖 Open "..." — Page N](url) links) so users can click to open the book directly. Do not modify or omit these links. Add a brief summary of what the topic is about at the end.`;
      }

      await handleTextChat([
        ...allMessages.slice(0, -1),
        { id: allMessages[allMessages.length - 1].id, role: 'user', content: contextPrompt },
      ]);
    } catch (err) {
      console.error('Find request failed:', err);
      toast.error('Library search failed.');
    }
  };

  const handleTextChat = async (allMessages: Message[]): Promise<void> => {
    const controller = new AbortController();
    abortControllerRef.current = controller;
    let assistantContent = '';
    const assistantId = crypto.randomUUID();

    try {
      const body: any = {
        messages: allMessages.map(m => ({ role: m.role, content: m.content })),
        systemPrompt: SCHOOL_SYSTEM_PROMPT,
        model: 'google/gemini-3-flash-preview',
      };
      if (uploadedDoc) {
        body.pdfText = uploadedDoc.text;
        body.pdfFilename = uploadedDoc.filename;
      }

      const resp = await fetch(CHAT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        toast.error(err.error || `Error: ${resp.status}`);
        return;
      }

      const reader = resp.body?.getReader();
      if (!reader) throw new Error('No response body');
      const decoder = new TextDecoder();
      let buffer = '';

      const updateMessages = (content: string) => {
        persistMessages(activeId, [
          ...allMessages,
          { id: assistantId, role: 'assistant', content },
        ]);
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let idx: number;
        while ((idx = buffer.indexOf('\n')) !== -1) {
          let line = buffer.slice(0, idx);
          buffer = buffer.slice(idx + 1);
          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (!line.startsWith('data: ')) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;
          try {
            const parsed = JSON.parse(jsonStr);
            const c = parsed.content || parsed.choices?.[0]?.delta?.content || '';
            if (c) { assistantContent += c; updateMessages(assistantContent); }
          } catch { /* partial */ }
        }
      }
      // flush
      if (buffer.trim()) {
        for (const raw of buffer.split('\n')) {
          if (!raw.startsWith('data: ')) continue;
          const jsonStr = raw.slice(6).trim();
          if (jsonStr === '[DONE]') continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const c = parsed.content || parsed.choices?.[0]?.delta?.content || '';
            if (c) { assistantContent += c; updateMessages(assistantContent); }
          } catch { /* ignore */ }
        }
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        toast.error('Failed to get response.');
      }
    }
  };

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;
    const userMsg: Message = { id: crypto.randomUUID(), role: 'user', content: trimmed };
    const allMessages = [...messages, userMsg];
    persistMessages(activeId, allMessages);
    setInput('');
    setActiveMode(null);
    setIsLoading(true);

    try {
      if (isFindRequest(trimmed)) {
        const query = extractFindQuery(trimmed);
        await handleFindRequest(query, allMessages);
      } else if (isImageRequest(trimmed)) {
        const result = await handleImageGeneration(trimmed);
        if (result) persistMessages(activeId, [...allMessages, result]);
      } else {
        await handleTextChat(allMessages);
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  return (
    <div className="flex h-[calc(100vh-120px)] rounded-xl border bg-background shadow-sm overflow-hidden">
      {/* Sidebar */}
      <ChatSidebar
        sessions={sessions}
        activeId={activeId}
        onSelect={setActiveId}
        onCreate={createSession}
        onDelete={deleteSession}
      />

      {/* Main chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <Bot className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold text-foreground text-sm">SchoolAI</h2>
              <p className="text-xs text-muted-foreground">
                {uploadedDoc ? `📄 ${uploadedDoc.filename}` : 'Genius Academic Assistant'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {uploadedDoc && (
              <div className="flex items-center gap-1.5 bg-primary/10 text-primary text-xs rounded-full px-3 py-1.5">
                <FileText className="h-3.5 w-3.5" />
                <span className="max-w-[100px] truncate">{uploadedDoc.filename}</span>
                <span className="text-muted-foreground">({uploadedDoc.pageCount}p)</span>
                <button onClick={removeDoc} className="ml-1 hover:text-destructive transition-colors"><X className="h-3.5 w-3.5" /></button>
              </div>
            )}
            <Button variant="ghost" size="sm" onClick={() => clearSession(activeId)} disabled={messages.length === 0} className="gap-1.5 text-xs">
              <Eraser className="h-3.5 w-3.5" /> Clear
            </Button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {messages.length === 0 ? (
            <ChatEmptyState />
          ) : (
            messages.map((msg) => (
              <ChatMessageBubble
                key={msg.id}
                message={msg}
                isStreaming={isLoading && msg === messages[messages.length - 1] && msg.role === 'assistant'}
                docFilename={uploadedDoc?.filename}
              />
            ))
          )}

          {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
            <div className="flex gap-3 max-w-3xl">
              <div className="flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center bg-muted">
                <Bot className="h-4 w-4" />
              </div>
              <div className="rounded-2xl px-4 py-3 bg-muted">
                <div className="flex gap-1">
                  <span className="h-2 w-2 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:0ms]" />
                  <span className="h-2 w-2 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:150ms]" />
                  <span className="h-2 w-2 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:300ms]" />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* PDF progress */}
        {isExtractingPdf && (
          <div className="px-4 py-2 border-t bg-muted/30 flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            {extractionProgress ? `Extracting page ${extractionProgress.currentPage} of ${extractionProgress.totalPages}...` : 'Preparing document...'}
          </div>
        )}

        {/* Input */}
        {messages.length === 0 && (
          <ChatSuggestionChips
            sessions={sessions}
            onSelect={(text) => { setInput(text); setActiveMode({ label: 'Quick Start', icon: '⚡' }); textareaRef.current?.focus(); }}
          />
        )}
        <div className="border-t p-3 bg-muted/20">
          <div className="flex gap-2 max-w-3xl mx-auto items-end">
            <input ref={fileInputRef} type="file" accept=".pdf" onChange={handleFileUpload} className="hidden" />
            <ChatActionMenu
              onSelect={(text, mode) => { setInput(text); setActiveMode(mode); textareaRef.current?.focus(); }}
              onFileUpload={() => fileInputRef.current?.click()}
              disabled={isLoading || isExtractingPdf}
              sessions={sessions}
            />
            <div className="flex-1 relative">
              {activeMode && (
                <div className="absolute left-2 top-1/2 -translate-y-1/2 z-10">
                  <Badge variant="secondary" className="gap-1 pr-1 text-xs cursor-default">
                    <span>{activeMode.icon}</span>
                    <span>{activeMode.label}</span>
                    <button
                      onClick={() => { setActiveMode(null); setInput(''); }}
                      className="ml-0.5 rounded-full hover:bg-muted-foreground/20 p-0.5 transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                </div>
              )}
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  if (!activeMode && e.target.value.length > 0) {
                    setActiveMode({ label: 'Chat', icon: '💬' });
                  }
                }}
                onKeyDown={handleKeyDown}
                placeholder={activeMode
                  ? `Type your ${activeMode.label.toLowerCase()} query...`
                  : 'Tap + to get started...'}
                className={`min-h-[44px] max-h-[160px] resize-none rounded-xl bg-background transition-opacity ${activeMode ? (activeMode ? 'pl-2' : '') : 'opacity-60'}`}
                style={activeMode ? { paddingLeft: `${activeMode.label.length * 7 + 56}px` } : undefined}
                rows={1}
                disabled={isLoading}
              />
            </div>
            {isLoading ? (
              <Button size="icon" variant="destructive" onClick={handleStop} className="h-11 w-11 rounded-xl flex-shrink-0">
                <Square className="h-4 w-4" />
              </Button>
            ) : (
              <Button size="icon" onClick={handleSend} disabled={!input.trim()} className="h-11 w-11 rounded-xl flex-shrink-0">
                <Send className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
