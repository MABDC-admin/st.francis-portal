import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { 
  Shield, 
  Search, 
  Users, 
  Building2,
  ChevronRight,
  
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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

import { RoleAssignmentDialog } from './RoleAssignmentDialog';
import { SchoolAccessManager } from './SchoolAccessManager';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface UserWithRole {
  id: string;
  email: string;
  full_name: string | null;
  role: string | null;
  created_at: string;
}

const roleColors: Record<string, string> = {
  admin: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  registrar: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  teacher: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  student: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  parent: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
};

const roleDescriptions: Record<string, string> = {
  admin: 'Full system access, can manage all users and settings',
  registrar: 'Manage student records, enrollment, and reports',
  teacher: 'View assigned classes and manage grades',
  student: 'View own profile and grades',
  parent: 'View linked children\'s information',
};

export const PermissionManagement = () => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<UserWithRole | null>(null);
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users-with-roles'],
    queryFn: async (): Promise<UserWithRole[]> => {
      // Get profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email, full_name, created_at');

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        return [];
      }

      // Get roles
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) {
        console.error('Error fetching roles:', rolesError);
        return [];
      }

      // Combine profiles with roles
      const roleMap = new Map(roles.map(r => [r.user_id, r.role]));
      
      return profiles.map(profile => ({
        id: profile.id,
        email: profile.email || '',
        full_name: profile.full_name,
        role: roleMap.get(profile.id) || 'student',
        created_at: profile.created_at,
      }));
    },
  });

  const filteredUsers = users.filter(u => {
    const matchesSearch = !searchQuery || 
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.full_name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    
    return matchesSearch && matchesRole;
  });

  const handleRoleChange = (userToChange: UserWithRole) => {
    setSelectedUser(userToChange);
    setIsRoleDialogOpen(true);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Permission Management</h1>
        <p className="text-muted-foreground mt-1">Manage user roles and school access</p>
      </div>

      <Tabs defaultValue="users" className="w-full">
        <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
          <TabsTrigger value="users" className="gap-2">
            <Users className="h-4 w-4" />
            User Roles
          </TabsTrigger>
          <TabsTrigger value="school-access" className="gap-2">
            <Building2 className="h-4 w-4" />
            School Access
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="mt-6 space-y-6">
          {/* Role Reference */}
          <div className="bg-card rounded-2xl shadow-card p-4 lg:p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Role Permissions Reference
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(roleDescriptions).map(([role, description]) => (
                <div key={role} className="p-3 rounded-lg bg-muted/50">
                  <Badge className={roleColors[role] || 'bg-gray-100'}>
                    {role.charAt(0).toUpperCase() + role.slice(1)}
                  </Badge>
                  <p className="text-sm text-muted-foreground mt-2">{description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Filters */}
          <div className="bg-card rounded-2xl shadow-card p-4 lg:p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-full lg:w-[180px]">
                  <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="registrar">Registrar</SelectItem>
                  <SelectItem value="teacher">Teacher</SelectItem>
                  <SelectItem value="student">Student</SelectItem>
                  <SelectItem value="parent">Parent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Users Table */}
          <div className="bg-card rounded-2xl shadow-card overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-10 w-48" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-24 ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                      <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No users found</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{u.full_name || 'No name set'}</p>
                          <p className="text-sm text-muted-foreground">{u.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={roleColors[u.role || 'student']}>
                          {(u.role || 'student').charAt(0).toUpperCase() + (u.role || 'student').slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRoleChange(u)}
                          disabled={u.id === user?.id}
                        >
                          Change Role
                          <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>

            {filteredUsers.length > 0 && (
              <div className="px-4 py-3 border-t border-border text-sm text-muted-foreground">
                Showing {filteredUsers.length} of {users.length} users
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="school-access" className="mt-6">
          <SchoolAccessManager />
        </TabsContent>
      </Tabs>

      {/* Role Assignment Dialog */}
      {selectedUser && (
        <RoleAssignmentDialog
          user={selectedUser}
          isOpen={isRoleDialogOpen}
          onClose={() => {
            setIsRoleDialogOpen(false);
            setSelectedUser(null);
          }}
        />
      )}
    </motion.div>
  );
};
