import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Building2, 
  Search, 
  Plus, 
  Trash2,
  CheckCircle2,
  XCircle 
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { GrantAccessDialog } from './GrantAccessDialog';

interface SchoolAccess {
  id: string;
  user_id: string;
  school_id: string;
  role: string;
  is_active: boolean;
  granted_at: string;
  user_email?: string;
  user_name?: string;
  school_name?: string;
  school_code?: string;
}

interface School {
  id: string;
  name: string;
  code: string;
}

interface Profile {
  id: string;
  email: string;
  full_name: string | null;
}

export const SchoolAccessManager = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  // Fetch school access records with user and school details
  const { data: accessRecords = [], isLoading } = useQuery({
    queryKey: ['school-access-records'],
    queryFn: async (): Promise<SchoolAccess[]> => {
      const { data: access, error } = await supabase
        .from('user_school_access')
        .select(`
          *,
          schools:school_id (name, code)
        `)
        .order('granted_at', { ascending: false });

      if (error) {
        console.error('Error fetching school access:', error);
        return [];
      }

      // Get profile info for users
      const userIds = [...new Set(access.map(a => a.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .in('id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      return access.map(a => ({
        ...a,
        user_email: profileMap.get(a.user_id)?.email,
        user_name: profileMap.get(a.user_id)?.full_name,
        school_name: (a.schools as any)?.name,
        school_code: (a.schools as any)?.code,
      }));
    },
  });

  // Fetch schools for dropdown
  const { data: schools = [] } = useQuery({
    queryKey: ['schools-list'],
    queryFn: async (): Promise<School[]> => {
      const { data, error } = await supabase
        .from('schools')
        .select('id, name, code')
        .eq('is_active', true)
        .order('name');

      if (error) {
        console.error('Error fetching schools:', error);
        return [];
      }

      return data;
    },
  });

  // Fetch profiles for dropdown
  const { data: profiles = [] } = useQuery({
    queryKey: ['profiles-list'],
    queryFn: async (): Promise<Profile[]> => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .order('email');

      if (error) {
        console.error('Error fetching profiles:', error);
        return [];
      }

      return data;
    },
  });

  const filteredRecords = accessRecords.filter(record => {
    if (!searchQuery) return true;
    const search = searchQuery.toLowerCase();
    return (
      record.user_email?.toLowerCase().includes(search) ||
      record.user_name?.toLowerCase().includes(search) ||
      record.school_name?.toLowerCase().includes(search)
    );
  });

  const addAccessMutation = useMutation({
    mutationFn: async ({ userIds, schoolId, role }: { userIds: string[]; schoolId: string; role: string }) => {
      // Check which users already have access
      const { data: existing } = await supabase
        .from('user_school_access')
        .select('user_id')
        .eq('school_id', schoolId)
        .in('user_id', userIds);

      const existingSet = new Set(existing?.map((e) => e.user_id) || []);
      const newUserIds = userIds.filter((id) => !existingSet.has(id));

      if (newUserIds.length === 0) {
        throw new Error('All selected users already have access to this school');
      }

      const records = newUserIds.map((uid) => ({
        user_id: uid,
        school_id: schoolId,
        role,
        granted_by: user?.id,
        is_active: true,
      }));

      const { error } = await supabase.from('user_school_access').insert(records);
      if (error) throw error;

      return { granted: newUserIds.length, skipped: existingSet.size };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['school-access-records'] });
      const msg = data.skipped > 0
        ? `Access granted to ${data.granted} users (${data.skipped} already had access)`
        : `Access granted to ${data.granted} user${data.granted > 1 ? 's' : ''}`;
      toast.success(msg);
      setIsAddDialogOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to grant access');
    },
  });

  const toggleAccessMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { error } = await supabase
        .from('user_school_access')
        .update({ is_active: isActive })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['school-access-records'] });
      toast.success('Access updated successfully');
    },
    onError: (error: any) => {
      toast.error('Failed to update access: ' + error.message);
    },
  });

  const revokeAccessMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('user_school_access')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['school-access-records'] });
      toast.success('Access revoked successfully');
    },
    onError: (error: any) => {
      toast.error('Failed to revoke access: ' + error.message);
    },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by user or school..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Grant Access
        </Button>
      </div>

      {/* Access Table */}
      <div className="bg-card rounded-2xl shadow-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>School</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-10 w-40" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-24 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : filteredRecords.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  <Building2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No school access records found</p>
                </TableCell>
              </TableRow>
            ) : (
              filteredRecords.map((record) => (
                <TableRow key={record.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{record.user_name || 'No name set'}</p>
                      <p className="text-sm text-muted-foreground">{record.user_email}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${record.school_code === 'MABDC' ? 'bg-emerald-500' : 'bg-blue-500'}`} />
                      <span>{record.school_name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{record.role}</Badge>
                  </TableCell>
                  <TableCell>
                    {record.is_active ? (
                      <Badge className="bg-green-100 text-green-800">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Active
                      </Badge>
                    ) : (
                      <Badge className="bg-red-100 text-red-800">
                        <XCircle className="h-3 w-3 mr-1" />
                        Inactive
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleAccessMutation.mutate({ 
                          id: record.id, 
                          isActive: !record.is_active 
                        })}
                      >
                        {record.is_active ? 'Disable' : 'Enable'}
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => revokeAccessMutation.mutate(record.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <GrantAccessDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        profiles={profiles}
        schools={schools}
        isPending={addAccessMutation.isPending}
        onGrant={(userIds, schoolId, role) =>
          addAccessMutation.mutate({ userIds, schoolId, role })
        }
      />
    </div>
  );
};
