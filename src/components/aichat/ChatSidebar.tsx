import { Plus, Trash2, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { ChatSession } from './types';

interface ChatSidebarProps {
  sessions: ChatSession[];
  activeId: string;
  onSelect: (id: string) => void;
  onCreate: () => void;
  onDelete: (id: string) => void;
}

export const ChatSidebar = ({ sessions, activeId, onSelect, onCreate, onDelete }: ChatSidebarProps) => {
  return (
    <div className="w-64 border-r bg-muted/20 flex flex-col h-full">
      <div className="p-3 border-b">
        <Button onClick={onCreate} className="w-full gap-2 rounded-xl" size="sm">
          <Plus className="h-4 w-4" />
          New Chat
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {sessions.map((s) => (
          <button
            key={s.id}
            onClick={() => onSelect(s.id)}
            className={cn(
              'w-full text-left px-3 py-2.5 rounded-lg text-sm flex items-center gap-2 group transition-colors',
              s.id === activeId
                ? 'bg-primary/10 text-primary font-medium'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            <MessageSquare className="h-4 w-4 shrink-0" />
            <span className="truncate flex-1">{s.title}</span>
            {sessions.length > 1 && (
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(s.id); }}
                className="opacity-0 group-hover:opacity-100 hover:text-destructive transition-all shrink-0"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};
