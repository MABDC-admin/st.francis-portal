import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Conversation } from '@/hooks/useMessaging';

interface ChatHeaderProps {
  conversation: Conversation;
  currentUserId: string;
  onlineUsers: Set<string>;
  onBack?: () => void;
}

export const ChatHeader = ({ conversation, currentUserId, onlineUsers, onBack }: ChatHeaderProps) => {
  const otherParticipants = conversation.participants?.filter(p => p.user_id !== currentUserId) || [];
  const isGroup = conversation.type === 'group';

  const displayName = isGroup
    ? conversation.name || 'Group Chat'
    : otherParticipants[0]?.profile?.full_name || otherParticipants[0]?.profile?.email || 'Unknown';

  const initials = displayName.substring(0, 2).toUpperCase();
  const isOnline = !isGroup && otherParticipants[0] ? onlineUsers.has(otherParticipants[0].user_id) : false;

  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b bg-card/80 backdrop-blur-sm">
      {onBack && (
        <Button variant="ghost" size="icon" className="lg:hidden h-8 w-8" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
      )}
      <div className="relative">
        <Avatar className="h-10 w-10">
          <AvatarFallback className={isGroup ? 'bg-accent text-accent-foreground' : 'bg-primary/10 text-primary'}>
            {isGroup ? <Users className="h-5 w-5" /> : initials}
          </AvatarFallback>
        </Avatar>
        {!isGroup && (
          <span className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-card ${isOnline ? 'bg-green-500' : 'bg-muted'}`} />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-foreground truncate">{displayName}</h3>
        <p className="text-xs text-muted-foreground">
          {isGroup
            ? `${otherParticipants.length + 1} members`
            : isOnline ? 'Online' : 'Offline'}
        </p>
      </div>
    </div>
  );
};
