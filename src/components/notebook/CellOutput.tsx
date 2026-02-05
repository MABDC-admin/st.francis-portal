import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '@/lib/utils';

interface CellOutputProps {
  content: string;
  isStreaming?: boolean;
}

export function CellOutput({ content, isStreaming }: CellOutputProps) {
  return (
    <div
      className={cn(
        'prose prose-sm dark:prose-invert max-w-none',
        'prose-headings:font-semibold prose-headings:text-foreground',
        'prose-p:text-foreground/90 prose-p:leading-relaxed',
        'prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:font-mono',
        'prose-pre:bg-muted prose-pre:border prose-pre:border-border',
        'prose-ul:text-foreground/90 prose-ol:text-foreground/90',
        'prose-li:marker:text-muted-foreground',
        'prose-table:border prose-table:border-border',
        'prose-th:bg-muted prose-th:px-3 prose-th:py-2 prose-th:text-left prose-th:font-semibold',
        'prose-td:px-3 prose-td:py-2 prose-td:border-t prose-td:border-border',
        'prose-blockquote:border-l-primary prose-blockquote:text-muted-foreground',
        'prose-a:text-primary prose-a:no-underline hover:prose-a:underline',
        isStreaming && 'animate-pulse'
      )}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]}>
        {content}
      </ReactMarkdown>
      {isStreaming && (
        <span className="inline-block w-2 h-4 bg-primary animate-pulse ml-0.5" />
      )}
    </div>
  );
}
