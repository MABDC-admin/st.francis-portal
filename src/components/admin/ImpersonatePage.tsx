import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, UserCheck, ShieldAlert, Eye, XCircle, Users } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface UserProfile {
  id: string;
  full_name: string | null;
  email: string | null;
  role: string | null;
}

const roleBadgeVariant: Record<string, string> = {
  admin: 'bg-destructive/10 text-destructive border-destructive/20',
  registrar: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  teacher: 'bg-green-500/10 text-green-600 border-green-500/20',
  student: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
  parent: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
};

export const ImpersonatePage = () => {
  const { user, role, impersonate, stopImpersonating, isImpersonating, actualRole, actualUser } = useAuth();
  const isAdmin = actualRole === 'admin';

  const [users, setUsers] = useState<UserProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  // Fetch users for admin
  useEffect(() => {
    if (!isAdmin) return;

    const fetchUsers = async () => {
      setLoading(true);
      try {
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .order('full_name');

        if (profilesError) throw profilesError;

        const { data: roles, error: rolesError } = await supabase
          .from('user_roles')
          .select('user_id, role');

        if (rolesError) throw rolesError;

        const roleMap = new Map(roles?.map(r => [r.user_id, r.role]) || []);

        const merged: UserProfile[] = (profiles || []).map(p => ({
          ...p,
          role: roleMap.get(p.id) || 'unknown',
        }));

        setUsers(merged);
      } catch (err) {
        console.error('Failed to fetch users:', err);
        toast.error('Failed to load users');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [isAdmin]);

  const filteredUsers = users.filter(u => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      u.full_name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.role?.toLowerCase().includes(q)
    );
  });

  const handleImpersonate = (target: UserProfile) => {
    impersonate({
      id: target.id,
      role: (target.role as any) || 'student',
      full_name: target.full_name
    });
    toast.success(`Now viewing as ${target.full_name || target.email}`);
  };

  const handleStopImpersonating = () => {
    stopImpersonating();
    toast.info('Stopped impersonating. Returned to admin view.');
  };

  return (
    <div className="space-y-6">
      {/* Impersonation Banner */}
      {isImpersonating && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between gap-4 rounded-lg border border-warning/50 bg-warning/10 px-4 py-3"
        >
          <div className="flex items-center gap-3">
            <Eye className="h-5 w-5 text-warning" />
            <span className="text-sm font-medium">
              Viewing as <strong>{user?.id}</strong>
              <Badge className={`ml-2 ${roleBadgeVariant[role || ''] || ''}`} variant="outline">
                {role}
              </Badge>
            </span>
          </div>
          <Button size="sm" variant="outline" onClick={handleStopImpersonating}>
            <XCircle className="h-4 w-4 mr-1" />
            Stop Impersonating
          </Button>
        </motion.div>
      )}

      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Impersonate</h1>
        <p className="text-muted-foreground mt-1">
          {isAdmin ? 'View the system as another user' : 'Admin-only feature for viewing the system as another user'}
        </p>
      </motion.div>

      {isAdmin ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              User List
            </CardTitle>
            <CardDescription>Select a user to view the system from their perspective</CardDescription>
            <div className="relative mt-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, or role..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                        No users found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map(u => (
                      <TableRow key={u.id}>
                        <TableCell className="font-medium">{u.full_name || '—'}</TableCell>
                        <TableCell>{u.email || '—'}</TableCell>
                        <TableCell>
                          <Badge className={roleBadgeVariant[u.role || ''] || ''} variant="outline">
                            {u.role || 'unknown'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {u.id === actualUser?.id ? (
                            <span className="text-xs text-muted-foreground">You</span>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleImpersonate(u)}
                              disabled={isImpersonating && user?.id === u.id}
                            >
                              <UserCheck className="h-4 w-4 mr-1" />
                              {isImpersonating && user?.id === u.id ? 'Active' : 'Impersonate'}
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-muted-foreground" />
              Admin-Only Feature
            </CardTitle>
            <CardDescription>
              The impersonation feature allows administrators to view the system as another user for troubleshooting and support purposes.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border bg-muted/50 p-4 space-y-2">
              <p className="text-sm font-medium">Your Current Session</p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <span className="text-muted-foreground">Email:</span>
                <span>{user?.email || '—'}</span>
                <span className="text-muted-foreground">Role:</span>
                <Badge className={roleBadgeVariant[role || ''] || ''} variant="outline">
                  {role || 'unknown'}
                </Badge>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              If you need an admin to view the system as your account, please contact your system administrator.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
