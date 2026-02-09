import { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface Profile {
  id: string;
  email: string;
  full_name: string | null;
}

interface School {
  id: string;
  name: string;
  code: string;
}

interface GrantAccessDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profiles: Profile[];
  schools: School[];
  isPending: boolean;
  onGrant: (userIds: string[], schoolId: string, role: string) => void;
}

export const GrantAccessDialog = ({
  open,
  onOpenChange,
  profiles,
  schools,
  isPending,
  onGrant,
}: GrantAccessDialogProps) => {
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [selectedSchoolId, setSelectedSchoolId] = useState('');
  const [selectedRole, setSelectedRole] = useState('teacher');
  const [userSearch, setUserSearch] = useState('');

  const filteredProfiles = useMemo(() => {
    if (!userSearch) return profiles;
    const q = userSearch.toLowerCase();
    return profiles.filter(
      (p) =>
        p.full_name?.toLowerCase().includes(q) ||
        p.email?.toLowerCase().includes(q)
    );
  }, [profiles, userSearch]);

  const toggleUser = (id: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    setSelectedUserIds(filteredProfiles.map((p) => p.id));
  };

  const deselectAll = () => {
    setSelectedUserIds([]);
  };

  const handleClose = (val: boolean) => {
    if (!val) {
      setSelectedUserIds([]);
      setUserSearch('');
      setSelectedSchoolId('');
      setSelectedRole('teacher');
    }
    onOpenChange(val);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Grant School Access</DialogTitle>
          <DialogDescription>
            Select users to grant access to a school's data
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* User multi-select */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Users</Label>
              {selectedUserIds.length > 0 && (
                <Badge variant="secondary">{selectedUserIds.length} selected</Badge>
              )}
            </div>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="pl-8 h-8 text-sm"
              />
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" size="sm" onClick={selectAll}>
                Select All
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={deselectAll}>
                Deselect All
              </Button>
            </div>
            <ScrollArea className="h-[200px] rounded-md border p-2">
              {filteredProfiles.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No users found</p>
              ) : (
                <div className="space-y-1">
                  {filteredProfiles.map((profile) => (
                    <label
                      key={profile.id}
                      className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted cursor-pointer text-sm"
                    >
                      <Checkbox
                        checked={selectedUserIds.includes(profile.id)}
                        onCheckedChange={() => toggleUser(profile.id)}
                      />
                      <span className="truncate">
                        {profile.full_name || profile.email}
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* School select */}
          <div className="space-y-2">
            <Label>School</Label>
            <Select value={selectedSchoolId} onValueChange={setSelectedSchoolId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a school" />
              </SelectTrigger>
              <SelectContent>
                {schools.map((school) => (
                  <SelectItem key={school.id} value={school.id}>
                    {school.name} ({school.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Role select */}
          <div className="space-y-2">
            <Label>Role at School</Label>
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="registrar">Registrar</SelectItem>
                <SelectItem value="teacher">Teacher</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleClose(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => onGrant(selectedUserIds, selectedSchoolId, selectedRole)}
            disabled={selectedUserIds.length === 0 || !selectedSchoolId || isPending}
          >
            {isPending
              ? 'Granting...'
              : `Grant Access${selectedUserIds.length > 1 ? ` (${selectedUserIds.length})` : ''}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
