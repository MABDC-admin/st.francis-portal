import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Square, Bot, User, Sparkles, Image as ImageIcon } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ChatImage {
  type: string;
  image_url: { url: string };
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  images?: ChatImage[];
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/notebook-chat`;
const IMAGE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-ai-image`;

const IMAGE_TRIGGERS = [
  'generate an image', 'generate image', 'create an image', 'create image',
  'draw ', 'draw me', 'make an image', 'make image', 'generate a picture',
  'create a picture', 'make a picture', 'generate a photo', 'illustrate',
  'design an image', 'paint ', 'sketch ', 'render an image', 'render image',
];

const isImageRequest = (text: string): boolean => {
  const lower = text.toLowerCase();
  return IMAGE_TRIGGERS.some(t => lower.includes(t));
};

export const AIChatPage = () => {
  const { session } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const handleStop = () => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    setIsLoading(false);
  };

  const handleImageGeneration = async (prompt: string, allMessages: Message[]) => {
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const resp = await fetch(IMAGE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ prompt }),
        signal: controller.signal,
      });

      if (!resp.ok) {
        if (resp.status === 429) toast.error('Rate limit exceeded. Please wait and try again.');
        else if (resp.status === 402) toast.error('AI credits exhausted. Please upgrade your plan.');
        else {
          const err = await resp.json().catch(() => ({}));
          toast.error(err.error || `Error: ${resp.status}`);
        }
        return;
      }

      const data = await resp.json();
      const assistantMsg: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: data.text || 'Here\'s your generated image:',
        images: data.images || [],
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        toast.error('Failed to generate image. Please try again.');
        console.error('Image gen error:', err);
      }
    }
  };

  const handleTextChat = async (allMessages: Message[]) => {
    const controller = new AbortController();
    abortControllerRef.current = controller;
    let assistantContent = '';

    try {
      const resp = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          messages: allMessages.map(m => ({ role: m.role, content: m.content })),
          systemPrompt: 'You are a helpful AI assistant. Keep answers clear and concise. Use markdown formatting when appropriate.',
          model: 'google/gemini-3-flash-preview',
        }),
        signal: controller.signal,
      });

      if (!resp.ok) {
        if (resp.status === 429) toast.error('Rate limit exceeded. Please wait and try again.');
        else if (resp.status === 402) toast.error('AI credits exhausted. Please upgrade your plan.');
        else {
          const err = await resp.json().catch(() => ({}));
          toast.error(err.error || `Error: ${resp.status}`);
        }
        return;
      }

      const reader = resp.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let buffer = '';
      const assistantId = crypto.randomUUID();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
          let line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);
          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.content || parsed.choices?.[0]?.delta?.content || '';
            if (content) {
              assistantContent += content;
              setMessages(prev => {
                const last = prev[prev.length - 1];
                if (last?.role === 'assistant' && last.id === assistantId) {
                  return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantContent } : m);
                }
                return [...prev, { id: assistantId, role: 'assistant', content: assistantContent }];
              });
            }
          } catch { /* partial JSON */ }
        }
      }

      // flush remaining
      if (buffer.trim()) {
        for (let raw of buffer.split('\n')) {
          if (!raw || !raw.startsWith('data: ')) continue;
          const jsonStr = raw.slice(6).trim();
          if (jsonStr === '[DONE]') continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.content || parsed.choices?.[0]?.delta?.content || '';
            if (content) {
              assistantContent += content;
              setMessages(prev => prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantContent } : m));
            }
          } catch { /* ignore */ }
        }
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        toast.error('Failed to get AI response. Please try again.');
        console.error('AI Chat error:', err);
      }
    }
  };

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    const userMsg: Message = { id: crypto.randomUUID(), role: 'user', content: trimmed };
    const allMessages = [...messages, userMsg];
    setMessages(allMessages);
    setInput('');
    setIsLoading(true);

    try {
      if (isImageRequest(trimmed)) {
        await handleImageGeneration(trimmed, allMessages);
      } else {
        await handleTextChat(allMessages);
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] rounded-xl border bg-background shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b bg-muted/30">
        <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-primary/10">
          <Sparkles className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="font-semibold text-foreground text-sm">AI Chat</h2>
          <p className="text-xs text-muted-foreground">Chat & Image Generation · Gemini Flash</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center gap-4 opacity-60">
            <Bot className="h-12 w-12 text-muted-foreground" />
            <div>
              <p className="text-lg font-medium text-foreground">Start a conversation</p>
              <p className="text-sm text-muted-foreground">Ask me anything or say "generate an image of…"</p>
            </div>
            <div className="flex gap-2 flex-wrap justify-center">
              <span className="inline-flex items-center gap-1.5 text-xs bg-muted rounded-full px-3 py-1.5">
                <Sparkles className="h-3 w-3" /> Text Chat
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs bg-muted rounded-full px-3 py-1.5">
                <ImageIcon className="h-3 w-3" /> Image Generation
              </span>
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              'flex gap-3 max-w-3xl',
              msg.role === 'user' ? 'ml-auto flex-row-reverse' : ''
            )}
          >
            <div className={cn(
              'flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center',
              msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'
            )}>
              {msg.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
            </div>
            <div className={cn(
              'rounded-2xl px-4 py-2.5 text-sm max-w-[85%]',
              msg.role === 'user'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-foreground'
            )}>
              {msg.role === 'assistant' ? (
                <div className="space-y-3">
                  {msg.content && (
                    <div className="prose prose-sm dark:prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                    </div>
                  )}
                  {msg.images && msg.images.length > 0 && (
                    <div className="space-y-2">
                      {msg.images.map((img, idx) => (
                        <img
                          key={idx}
                          src={img.image_url.url}
                          alt="AI generated"
                          className="rounded-lg max-w-full h-auto border"
                          loading="lazy"
                        />
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <p className="whitespace-pre-wrap">{msg.content}</p>
              )}
            </div>
          </div>
        ))}

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

      {/* Input */}
      <div className="border-t p-3 bg-muted/20">
        <div className="flex gap-2 max-w-3xl mx-auto items-end">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message or 'generate an image of...' "
            className="min-h-[44px] max-h-[160px] resize-none rounded-xl bg-background"
            rows={1}
            disabled={isLoading}
          />
          {isLoading ? (
            <Button
              size="icon"
              variant="destructive"
              onClick={handleStop}
              className="h-11 w-11 rounded-xl flex-shrink-0"
            >
              <Square className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              size="icon"
              onClick={handleSend}
              disabled={!input.trim()}
              className="h-11 w-11 rounded-xl flex-shrink-0"
            >
              <Send className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
