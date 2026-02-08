import { Bot, User, Download, BookOpen, ExternalLink, Play, Lightbulb } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '@/lib/utils';
import type { Message } from './types';
import { exportResponseToPdf } from '@/utils/aiChatPdfExport';

interface ChatMessageBubbleProps {
  message: Message;
  isStreaming: boolean;
  docFilename?: string;
  showSuggestions?: boolean;
}

const parseSuggestion = (content: string) => {
  const suggestionRegex = /\n?💡 \*\*Suggestion:\*\*\s*.+$/s;
  const match = content.match(suggestionRegex);
  const mainContent = match ? content.slice(0, match.index) : content;
  const suggestionText = match ? match[0].replace('💡 **Suggestion:**', '').trim() : null;
  return { mainContent, suggestionText };
};

export const ChatMessageBubble = ({ message, isStreaming, docFilename, showSuggestions = true }: ChatMessageBubbleProps) => {
  const isUser = message.role === 'user';

  const { mainContent, suggestionText } = !isUser && message.content
    ? parseSuggestion(message.content)
    : { mainContent: message.content, suggestionText: null };

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
            {mainContent && (
              <div className="prose prose-sm dark:prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    a: ({ node, children, href, ...props }) => {
                      const isBookLink = href?.includes('/library/book/');
                      const isYouTube = href?.includes('youtube.com') || href?.includes('youtu.be');
                      
                      let videoId: string | null = null;
                      if (isYouTube && href) {
                        const watchMatch = href.match(/[?&]v=([0-9A-Za-z_-]{11})/);
                        const shortMatch = href.match(/youtu\.be\/([0-9A-Za-z_-]{11})/);
                        videoId = watchMatch?.[1] || shortMatch?.[1] || null;
                      }

                      if (videoId) {
                        return (
                          <div className="my-2 w-full max-w-md">
                            <div className="relative w-full aspect-video rounded-lg overflow-hidden border border-border">
                              <iframe
                                src={`https://www.youtube-nocookie.com/embed/${videoId}`}
                                title={typeof children === 'string' ? children : 'YouTube video'}
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                                className="absolute inset-0 w-full h-full"
                              />
                            </div>
                          </div>
                        );
                      }

                      return (
                        <a
                          {...props}
                          href={href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={cn(
                            'inline-flex items-center gap-1 no-underline rounded-md px-2 py-0.5 text-xs font-medium transition-colors',
                            isYouTube
                              ? 'bg-red-500/10 text-red-600 hover:bg-red-500/20 border border-red-500/20 dark:text-red-400'
                              : isBookLink
                                ? 'bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20'
                                : 'text-primary underline hover:text-primary/80'
                          )}
                        >
                          {isYouTube && <Play className="h-3 w-3 flex-shrink-0 fill-current" />}
                          {isBookLink && <BookOpen className="h-3 w-3 flex-shrink-0" />}
                          {children}
                          {(isBookLink || isYouTube) && <ExternalLink className="h-3 w-3 flex-shrink-0 opacity-60" />}
                        </a>
                      );
                    },
                  }}
                >
                  {mainContent}
                </ReactMarkdown>
              </div>
            )}

            {suggestionText && showSuggestions && !isStreaming && (
              <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg px-3 py-2 mt-2">
                <p className="text-sm text-amber-800 dark:text-amber-200 flex items-start gap-1.5">
                  <Lightbulb className="h-4 w-4 mt-0.5 flex-shrink-0 text-amber-500" />
                  <span>{suggestionText}</span>
                </p>
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
                onClick={() => exportResponseToPdf(message.content, docFilename, message.images)}
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
