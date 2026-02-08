import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Square, Bot, User, Sparkles, Image as ImageIcon, Paperclip, FileText, Download, X, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { extractPdfText, type ExtractedPdfResult, type ExtractionProgress } from '@/utils/extractPdfText';
import { exportResponseToPdf } from '@/utils/aiChatPdfExport';

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

interface UploadedDoc {
  filename: string;
  text: string;
  pageCount: number;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/notebook-chat`;
const IMAGE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-ai-image`;

const SCHOOL_SYSTEM_PROMPT = `You are an elite AI educational assistant — a genius-level tutor, researcher, and study companion for students, teachers, and school administrators. You operate like Google NotebookLM but specifically optimized for Philippine K-12 and international school contexts.

## Core Capabilities
- **Deep Document Analysis**: When a document is uploaded, analyze it thoroughly — extract key concepts, create summaries, generate study guides, quizzes, and flashcard-style Q&A.
- **Curriculum Expert**: You understand DepEd (Philippines) curriculum standards, K-12 learning competencies, MELC, and international curricula (IB, Cambridge, AP).
- **Study Assistant**: Create comprehensive study notes, mind maps (in text form), mnemonics, analogies, and practice questions from any material.
- **Writing Coach**: Help draft essays, research papers, reports, lesson plans, and academic documents with proper citation formats (APA, MLA, Chicago).
- **Math & Science Solver**: Solve problems step-by-step with clear explanations. Show formulas, derivations, and worked examples.
- **Language Support**: Assist with Filipino, English, and other languages — grammar, translation, literary analysis.
- **Test Prep**: Generate practice exams, review questions, and mock assessments aligned to grade-level standards.
- **Lesson Planning**: Help teachers create lesson plans, learning objectives, rubrics, and assessment tools.
- **Data Analysis**: Interpret grades, attendance data, and academic performance trends.

## Response Style
- Use **markdown formatting** extensively: headers, bullet points, tables, code blocks, bold/italic
- Be thorough but organized — use sections and sub-sections
- Include examples, analogies, and real-world connections
- When analyzing documents, always provide a structured summary first, then allow follow-up questions
- For math/science, always show step-by-step solutions
- Use tables for comparisons, timelines, and data
- Be encouraging and supportive in tone

## When Documents Are Uploaded
1. First provide a **comprehensive summary** with key points
2. Identify the **subject area and grade level** if applicable
3. List **important terms and concepts**
4. Suggest **study questions** the student should be able to answer
5. Offer to create **quizzes, flashcards, or study guides** from the material`;

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
  const [uploadedDoc, setUploadedDoc] = useState<UploadedDoc | null>(null);
  const [isExtractingPdf, setIsExtractingPdf] = useState(false);
  const [extractionProgress, setExtractionProgress] = useState<ExtractionProgress | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = file.name.toLowerCase().split('.').pop();
    if (ext !== 'pdf') {
      toast.error('Only PDF files are supported for document upload.');
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      toast.error('File too large. Maximum 20MB.');
      return;
    }

    setIsExtractingPdf(true);
    setExtractionProgress(null);

    try {
      const result: ExtractedPdfResult = await extractPdfText(file, (progress) => {
        setExtractionProgress(progress);
      });

      setUploadedDoc({
        filename: result.filename,
        text: result.text,
        pageCount: result.pageCount,
      });

      toast.success(`"${result.filename}" loaded (${result.pageCount} pages). Ask anything about it!`);
    } catch (err) {
      console.error('PDF extraction error:', err);
      toast.error('Failed to read PDF. The file may be corrupted or protected.');
    } finally {
      setIsExtractingPdf(false);
      setExtractionProgress(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeDoc = () => {
    setUploadedDoc(null);
    toast.info('Document removed from context.');
  };

  const handleImageGeneration = async (prompt: string) => {
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
      const body: any = {
        messages: allMessages.map(m => ({ role: m.role, content: m.content })),
        systemPrompt: SCHOOL_SYSTEM_PROMPT,
        model: 'google/gemini-3-flash-preview',
      };

      // Inject PDF context if a document is uploaded
      if (uploadedDoc) {
        body.pdfText = uploadedDoc.text;
        body.pdfFilename = uploadedDoc.filename;
      }

      const resp = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify(body),
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
        await handleImageGeneration(trimmed);
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

  const handleSaveToPdf = (msg: Message) => {
    exportResponseToPdf(msg.content, uploadedDoc?.filename);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] rounded-xl border bg-background shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-primary/10">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="font-semibold text-foreground text-sm">AI Chat</h2>
            <p className="text-xs text-muted-foreground">
              {uploadedDoc ? `📄 ${uploadedDoc.filename}` : 'Chat · Documents · Images'}
            </p>
          </div>
        </div>

        {/* Document badge */}
        {uploadedDoc && (
          <div className="flex items-center gap-1.5 bg-primary/10 text-primary text-xs rounded-full px-3 py-1.5">
            <FileText className="h-3.5 w-3.5" />
            <span className="max-w-[120px] truncate">{uploadedDoc.filename}</span>
            <span className="text-muted-foreground">({uploadedDoc.pageCount}p)</span>
            <button onClick={removeDoc} className="ml-1 hover:text-destructive transition-colors">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center gap-4 opacity-60">
            <Bot className="h-12 w-12 text-muted-foreground" />
            <div>
              <p className="text-lg font-medium text-foreground">Your AI Study Companion</p>
              <p className="text-sm text-muted-foreground max-w-md">
                Upload a PDF to analyze it, ask any school question, or generate images. I can create study guides, solve problems, write essays, and more.
              </p>
            </div>
            <div className="flex gap-2 flex-wrap justify-center">
              <span className="inline-flex items-center gap-1.5 text-xs bg-muted rounded-full px-3 py-1.5">
                <FileText className="h-3 w-3" /> Document Analysis
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs bg-muted rounded-full px-3 py-1.5">
                <Sparkles className="h-3 w-3" /> Study Helper
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs bg-muted rounded-full px-3 py-1.5">
                <ImageIcon className="h-3 w-3" /> Image Generation
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs bg-muted rounded-full px-3 py-1.5">
                <Download className="h-3 w-3" /> Save to PDF
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
                  {/* Save to PDF button */}
                  {msg.content && !isLoading && (
                    <button
                      onClick={() => handleSaveToPdf(msg)}
                      className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mt-1"
                    >
                      <Download className="h-3.5 w-3.5" />
                      Save as PDF
                    </button>
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

      {/* PDF extraction progress */}
      {isExtractingPdf && (
        <div className="px-4 py-2 border-t bg-muted/30 flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          {extractionProgress
            ? `Extracting page ${extractionProgress.currentPage} of ${extractionProgress.totalPages}...`
            : 'Preparing document...'}
        </div>
      )}

      {/* Input */}
      <div className="border-t p-3 bg-muted/20">
        <div className="flex gap-2 max-w-3xl mx-auto items-end">
          {/* Upload button */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            onChange={handleFileUpload}
            className="hidden"
          />
          <Button
            size="icon"
            variant="ghost"
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading || isExtractingPdf}
            className="h-11 w-11 rounded-xl flex-shrink-0"
            title="Upload PDF"
          >
            <Paperclip className="h-4 w-4" />
          </Button>

          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={uploadedDoc ? `Ask about "${uploadedDoc.filename}"...` : "Ask anything or 'generate an image of...'"}
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
