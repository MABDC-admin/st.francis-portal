import { useState, useRef, useEffect } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Paperclip, Image, FileText, MessageSquare } from 'lucide-react';
import { ChatHeader } from './ChatHeader';
import { MessageBubble } from './MessageBubble';
import type { Conversation, Message } from '@/hooks/useMessaging';

interface ChatPanelProps {
  conversation: Conversation | null;
  messages: Message[];
  currentUserId: string;
  onlineUsers: Set<string>;
  typingUsers: string[];
  loadingMessages: boolean;
  onSendMessage: (content: string, type?: string, fileUrl?: string, fileName?: string, fileSize?: number) => void;
  onUploadFile: (file: File) => Promise<{ url: string; name: string; size: number } | null>;
  onTyping: () => void;
  onBack?: () => void;
}

export const ChatPanel = ({
  conversation, messages, currentUserId, onlineUsers, typingUsers, loadingMessages,
  onSendMessage, onUploadFile, onTyping, onBack
}: ChatPanelProps) => {
  const [input, setInput] = useState('');
  const [uploading, setUploading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    onSendMessage(input.trim());
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    } else {
      onTyping();
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const result = await onUploadFile(file);
    if (result) {
      const isImage = file.type.startsWith('image/');
      onSendMessage(
        '',
        isImage ? 'image' : 'file',
        result.url,
        result.name,
        result.size
      );
    }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  if (!conversation) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background/50">
        <div className="text-center">
          <MessageSquare className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
          <h3 className="text-lg font-medium text-muted-foreground">Select a conversation</h3>
          <p className="text-sm text-muted-foreground/70 mt-1">Choose a chat from the sidebar or start a new one</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <ChatHeader conversation={conversation} currentUserId={currentUserId} onlineUsers={onlineUsers} onBack={onBack} />

      {/* Messages area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4">
        {loadingMessages ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-sm">No messages yet. Say hello! 👋</p>
          </div>
        ) : (
          messages.map((msg, i) => {
            const isOwn = msg.sender_id === currentUserId;
            const prevMsg = messages[i - 1];
            const showAvatar = !prevMsg || prevMsg.sender_id !== msg.sender_id;
            return <MessageBubble key={msg.id} message={msg} isOwn={isOwn} showAvatar={showAvatar} />;
          })
        )}
        {typingUsers.length > 0 && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground px-2 py-1">
            <div className="flex gap-1">
              <span className="animate-bounce delay-0 h-1.5 w-1.5 rounded-full bg-muted-foreground" />
              <span className="animate-bounce delay-100 h-1.5 w-1.5 rounded-full bg-muted-foreground" style={{ animationDelay: '0.1s' }} />
              <span className="animate-bounce h-1.5 w-1.5 rounded-full bg-muted-foreground" style={{ animationDelay: '0.2s' }} />
            </div>
            <span>{typingUsers.join(', ')} typing...</span>
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="border-t bg-card/80 backdrop-blur-sm px-4 py-3">
        <div className="flex items-end gap-2">
          <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx" />
          <Button variant="ghost" size="icon" className="shrink-0 h-10 w-10" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
            <Paperclip className="h-5 w-5 text-muted-foreground" />
          </Button>
          <Textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="min-h-[40px] max-h-[120px] resize-none rounded-xl"
            rows={1}
          />
          <Button size="icon" className="shrink-0 h-10 w-10 rounded-xl" onClick={handleSend} disabled={!input.trim() || uploading}>
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
};
