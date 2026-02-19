import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Search, MessageSquarePlus, Users } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface UserOption {
  id: string;
  full_name: string | null;
  email: string | null;
  role: string;
}

interface NewChatDialogProps {
  open: boolean;
  onClose: () => void;
  onCreateChat: (type: 'private' | 'group', userIds: string[], name?: string) => void;
}

export const NewChatDialog = ({ open, onClose, onCreateChat }: NewChatDialogProps) => {
  const { user } = useAuth();
  const [users, setUsers] = useState<UserOption[]>([]);
  const [search, setSearch] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [groupName, setGroupName] = useState('');
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState('private');

  useEffect(() => {
    if (!open || !user) return;
    const fetchUsers = async () => {
      setLoading(true);
      // Fetch admin and teacher users
      const { data: roles } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .in('role', ['admin', 'teacher', 'registrar']);

      if (!roles?.length) { setLoading(false); return; }

      const userIds = roles.filter(r => r.user_id !== user.id).map(r => r.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', userIds);

      const roleMap = Object.fromEntries(roles.map(r => [r.user_id, r.role]));
      setUsers((profiles || []).map(p => ({
        id: p.id,
        full_name: p.full_name,
        email: p.email,
        role: roleMap[p.id] || 'unknown',
      })));
      setLoading(false);
    };
    fetchUsers();
  }, [open, user]);

  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    return (u.full_name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q));
  });

  const toggleUser = (id: string) => {
    setSelectedUsers(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleCreate = () => {
    if (tab === 'private' && selectedUsers.length === 1) {
      onCreateChat('private', selectedUsers);
    } else if (tab === 'group' && selectedUsers.length >= 1) {
      onCreateChat('group', selectedUsers, groupName || undefined);
    }
    setSelectedUsers([]);
    setGroupName('');
    setSearch('');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>New Conversation</DialogTitle>
        </DialogHeader>
        <Tabs value={tab} onValueChange={(v) => { setTab(v); setSelectedUsers([]); }}>
          <TabsList className="w-full">
            <TabsTrigger value="private" className="flex-1 gap-1"><MessageSquarePlus className="h-4 w-4" />Private</TabsTrigger>
            <TabsTrigger value="group" className="flex-1 gap-1"><Users className="h-4 w-4" />Group</TabsTrigger>
          </TabsList>
          <div className="relative mt-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search users..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
          {tab === 'group' && (
            <Input placeholder="Group name (optional)" value={groupName} onChange={e => setGroupName(e.target.value)} className="mt-2" />
          )}
          <ScrollArea className="h-[280px] mt-3">
            {loading ? (
              <p className="text-center text-muted-foreground py-8">Loading...</p>
            ) : filtered.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No users found</p>
            ) : (
              <div className="space-y-1">
                {filtered.map(u => {
                  const isSelected = selectedUsers.includes(u.id);
                  const initials = (u.full_name || u.email || '??').substring(0, 2).toUpperCase();
                  return (
                    <button
                      key={u.id}
                      onClick={() => {
                        if (tab === 'private') { setSelectedUsers([u.id]); }
                        else { toggleUser(u.id); }
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${isSelected ? 'bg-primary/10' : 'hover:bg-secondary'}`}
                    >
                      {tab === 'group' && <Checkbox checked={isSelected} className="pointer-events-none" />}
                      <Avatar className="h-9 w-9">
                        <AvatarFallback className="text-xs bg-primary/10 text-primary">{initials}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 text-left min-w-0">
                        <p className="text-sm font-medium truncate">{u.full_name || u.email}</p>
                        <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                      </div>
                      <Badge variant="outline" className="text-[10px] capitalize shrink-0">{u.role}</Badge>
                    </button>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </Tabs>
        <Button
          onClick={handleCreate}
          disabled={selectedUsers.length === 0}
          className="w-full"
        >
          {tab === 'private' ? 'Start Chat' : `Create Group (${selectedUsers.length})`}
        </Button>
      </DialogContent>
    </Dialog>
  );
};
