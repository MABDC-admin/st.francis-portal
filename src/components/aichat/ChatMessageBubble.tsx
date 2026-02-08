import { Bot, User, Download } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '@/lib/utils';
import type { Message } from './types';
import { exportResponseToPdf } from '@/utils/aiChatPdfExport';

interface ChatMessageBubbleProps {
  message: Message;
  isStreaming: boolean;
  docFilename?: string;
}

export const ChatMessageBubble = ({ message, isStreaming, docFilename }: ChatMessageBubbleProps) => {
  const isUser = message.role === 'user';

  return (
    <div className={cn('flex gap-3 max-w-3xl', isUser && 'ml-auto flex-row-reverse')}>
      <div className={cn(
        'flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center',
        isUser ? 'bg-primary text-primary-foreground' : 'bg-muted'
      )}>
        {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
      </div>
      <div className={cn(
        'rounded-2xl px-4 py-2.5 text-sm max-w-[85%]',
        isUser ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'
      )}>
        {isUser ? (
          <p className="whitespace-pre-wrap">{message.content}</p>
        ) : (
          <div className="space-y-3">
            {message.content && (
              <div className="prose prose-sm dark:prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
              </div>
            )}
            {message.images && message.images.length > 0 && (
              <div className="space-y-2">
                {message.images.map((img, idx) => (
                  <img key={idx} src={img.image_url.url} alt="AI generated" className="rounded-lg max-w-full h-auto border" loading="lazy" />
                ))}
              </div>
            )}
            {message.content && !isStreaming && (
              <button
                onClick={() => exportResponseToPdf(message.content, docFilename)}
                className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mt-1"
              >
                <Download className="h-3.5 w-3.5" />
                Save as PDF
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
