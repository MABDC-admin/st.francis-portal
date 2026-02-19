import { Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';

interface NewRegistration {
  id: string;
  student_name: string;
  level: string;
  created_at: string;
}

interface NotificationBellProps {
  unreadCount: number;
  newRegistrations: NewRegistration[];
  onViewAll: () => void;
  onMarkRead: () => void;
}

export const NotificationBell = ({ unreadCount, newRegistrations, onViewAll, onMarkRead }: NotificationBellProps) => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="relative p-1.5 rounded-lg hover:bg-white/10 transition-colors">
          <Bell className="h-4 w-4" />
          <AnimatePresence>
            {unreadCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center"
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0" align="start">
        <div className="p-3 border-b border-border">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-sm">New Registrations</h4>
            {unreadCount > 0 && (
              <button onClick={onMarkRead} className="text-xs text-primary hover:underline">
                Mark all read
              </button>
            )}
          </div>
        </div>
        <div className="max-h-64 overflow-y-auto">
          {newRegistrations.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No new registrations</p>
          ) : (
            newRegistrations.map((reg) => (
              <div key={reg.id} className="px-3 py-2.5 border-b border-border/50 last:border-0 hover:bg-muted/50">
                <p className="text-sm font-medium">{reg.student_name}</p>
                <p className="text-xs text-muted-foreground">{reg.level} • {formatDistanceToNow(new Date(reg.created_at), { addSuffix: true })}</p>
              </div>
            ))
          )}
        </div>
        <div className="p-2 border-t border-border">
          <Button variant="ghost" size="sm" className="w-full text-xs" onClick={onViewAll}>
            View All Registrations
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};
