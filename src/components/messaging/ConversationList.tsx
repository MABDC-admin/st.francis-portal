import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Plus, Users, MessageSquarePlus } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Conversation } from '@/hooks/useMessaging';
import { formatDistanceToNow } from 'date-fns';

interface ConversationListProps {
  conversations: Conversation[];
  activeConversationId: string | null;
  currentUserId: string;
  onlineUsers: Set<string>;
  loading: boolean;
  onSelect: (conv: Conversation) => void;
  onNewChat: () => void;
}

export const ConversationList = ({
  conversations, activeConversationId, currentUserId, onlineUsers, loading, onSelect, onNewChat
}: ConversationListProps) => {
  const [search, setSearch] = useState('');

  const getDisplayName = (conv: Conversation) => {
    if (conv.type === 'group') return conv.name || 'Group Chat';
    const other = conv.participants?.find(p => p.user_id !== currentUserId);
    return other?.profile?.full_name || other?.profile?.email || 'Unknown';
  };

  const getInitials = (name: string) => name.substring(0, 2).toUpperCase();

  const getLastMessagePreview = (conv: Conversation) => {
    if (!conv.last_message) return 'No messages yet';
    if (conv.last_message.message_type === 'image') return '📷 Image';
    if (conv.last_message.message_type === 'file') return `📎 ${conv.last_message.file_name || 'File'}`;
    return conv.last_message.content || '';
  };

  const filtered = conversations.filter(c => {
    if (!search) return true;
    const name = getDisplayName(c).toLowerCase();
    return name.includes(search.toLowerCase());
  });

  return (
    <div className="flex flex-col h-full border-r bg-card">
      {/* Header */}
      <div className="px-4 py-4 border-b">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-foreground">Messages</h2>
          <Button variant="ghost" size="icon" onClick={onNewChat} className="h-9 w-9">
            <Plus className="h-5 w-5" />
          </Button>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search conversations..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 h-9 rounded-xl"
          />
        </div>
      </div>

      {/* List */}
      <ScrollArea className="flex-1">
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 px-4">
            <MessageSquarePlus className="h-10 w-10 mx-auto text-muted-foreground/30 mb-2" />
            <p className="text-sm text-muted-foreground">
              {search ? 'No conversations found' : 'No conversations yet'}
            </p>
            {!search && (
              <Button variant="outline" size="sm" className="mt-3" onClick={onNewChat}>
                Start a conversation
              </Button>
            )}
          </div>
        ) : (
          <div className="p-2 space-y-0.5">
            {filtered.map(conv => {
              const name = getDisplayName(conv);
              const isActive = conv.id === activeConversationId;
              const isGroup = conv.type === 'group';
              const otherUser = conv.participants?.find(p => p.user_id !== currentUserId);
              const isOnline = !isGroup && otherUser ? onlineUsers.has(otherUser.user_id) : false;
              const lastMessageTime = conv.last_message
                ? formatDistanceToNow(new Date(conv.last_message.created_at), { addSuffix: false })
                : '';

              return (
                <button
                  key={conv.id}
                  onClick={() => onSelect(conv)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all',
                    isActive ? 'bg-primary/10' : 'hover:bg-secondary'
                  )}
                >
                  <div className="relative shrink-0">
                    <Avatar className="h-11 w-11">
                      <AvatarFallback className={cn(
                        'text-sm font-semibold',
                        isGroup ? 'bg-accent text-accent-foreground' : 'bg-primary/10 text-primary'
                      )}>
                        {isGroup ? <Users className="h-5 w-5" /> : getInitials(name)}
                      </AvatarFallback>
                    </Avatar>
                    {!isGroup && (
                      <span className={cn(
                        'absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-card',
                        isOnline ? 'bg-green-500' : 'bg-muted'
                      )} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-sm text-foreground truncate">{name}</span>
                      {lastMessageTime && (
                        <span className="text-[10px] text-muted-foreground shrink-0 ml-1">{lastMessageTime}</span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">{getLastMessagePreview(conv)}</p>
                  </div>
                  {(conv.unread_count || 0) > 0 && (
                    <Badge className="bg-primary text-primary-foreground h-5 min-w-[20px] flex items-center justify-center text-[10px] px-1.5 rounded-full shrink-0">
                      {conv.unread_count}
                    </Badge>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </ScrollArea>
    </div>
  );
};
