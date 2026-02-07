import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { FileText, Image, Download, Check, CheckCheck } from 'lucide-react';
import type { Message } from '@/hooks/useMessaging';

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  showAvatar?: boolean;
}

export const MessageBubble = ({ message, isOwn, showAvatar = true }: MessageBubbleProps) => {
  const time = new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const senderName = message.sender_profile?.full_name || 'Unknown';
  const initials = senderName.substring(0, 2).toUpperCase();

  const isFile = message.message_type === 'file';
  const isImage = message.message_type === 'image';

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className={cn('flex gap-2 mb-3 max-w-[85%]', isOwn ? 'ml-auto flex-row-reverse' : 'mr-auto')}>
      {showAvatar && !isOwn ? (
        <Avatar className="h-8 w-8 shrink-0 mt-1">
          <AvatarFallback className="text-xs bg-primary/10 text-primary">{initials}</AvatarFallback>
        </Avatar>
      ) : !isOwn ? <div className="w-8" /> : null}

      <div className={cn('flex flex-col', isOwn ? 'items-end' : 'items-start')}>
        {!isOwn && showAvatar && (
          <span className="text-xs text-muted-foreground mb-1 px-1">{senderName}</span>
        )}
        <div className={cn(
          'rounded-2xl px-4 py-2.5 shadow-sm',
          isOwn
            ? 'bg-primary text-primary-foreground rounded-br-md'
            : 'bg-secondary text-secondary-foreground rounded-bl-md'
        )}>
          {isImage && message.file_url && (
            <img src={message.file_url} alt={message.file_name || 'Image'} className="rounded-lg max-w-[280px] max-h-[200px] object-cover mb-1" />
          )}
          {isFile && (
            <a href={message.file_url || '#'} target="_blank" rel="noopener noreferrer"
              className={cn('flex items-center gap-2 py-1', isOwn ? 'text-primary-foreground/90 hover:text-primary-foreground' : 'text-foreground/80 hover:text-foreground')}>
              <FileText className="h-4 w-4 shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{message.file_name || 'File'}</p>
                <p className="text-xs opacity-70">{formatFileSize(message.file_size)}</p>
              </div>
              <Download className="h-4 w-4 shrink-0" />
            </a>
          )}
          {message.content && (
            <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
          )}
        </div>
        <div className={cn('flex items-center gap-1 mt-0.5 px-1', isOwn ? 'flex-row-reverse' : '')}>
          <span className="text-[10px] text-muted-foreground">{time}</span>
          {isOwn && <CheckCheck className="h-3 w-3 text-muted-foreground" />}
        </div>
      </div>
    </div>
  );
};
