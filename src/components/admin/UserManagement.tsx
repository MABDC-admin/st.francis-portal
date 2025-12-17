import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, UserPlus, Key, Loader2, Eye, EyeOff, Copy, Check, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface UserCredential {
  id: string;
  email: string;
  temp_password: string;
  role: string;
  created_at: string;
  password_changed: boolean;
  student_id: string | null;
}

export const UserManagement = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [credentials, setCredentials] = useState<UserCredential[]>([]);
  const [showPasswords, setShowPasswords] = useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  // Form states for creating accounts
  const [adminForm, setAdminForm] = useState({ email: 'denskie@edutrack.local', password: 'Denskie123', fullName: 'Admin User' });
  const [registrarForm, setRegistrarForm] = useState({ email: 'registrar@edutrack.local', password: 'registrar123', fullName: 'Registrar User' });

  const fetchCredentials = async () => {
    const { data, error } = await supabase
      .from('user_credentials')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (!error && data) {
      setCredentials(data as UserCredential[]);
    }
  };

  useEffect(() => {
    fetchCredentials();
  }, []);

  const createUser = async (action: string, data: any) => {
    setIsLoading(true);
    try {
      const { data: result, error } = await supabase.functions.invoke('create-users', {
        body: { action, ...data },
      });

      if (error) throw error;
      
      toast.success(result.message);
      fetchCredentials();
    } catch (error: any) {
      console.error('Error:', error);
      toast.error(error.message || 'Failed to create user');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateAdmin = () => {
    createUser('create_admin', {
      email: adminForm.email,
      password: adminForm.password,
      fullName: adminForm.fullName,
    });
  };

  const handleCreateRegistrar = () => {
    createUser('create_registrar', {
      email: registrarForm.email,
      password: registrarForm.password,
      fullName: registrarForm.fullName,
    });
  };

  const handleBulkCreateStudents = () => {
    createUser('bulk_create_students', {});
  };

  const togglePasswordVisibility = (id: string) => {
    const newSet = new Set(showPasswords);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setShowPasswords(newSet);
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const roleColors: Record<string, string> = {
    admin: 'bg-red-500',
    registrar: 'bg-blue-500',
    teacher: 'bg-green-500',
    student: 'bg-purple-500',
    parent: 'bg-orange-500',
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl lg:text-3xl font-bold text-foreground">User Management</h1>
        <p className="text-muted-foreground mt-1">Create and manage user accounts</p>
      </motion.div>

      {/* Quick Create Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Admin Account */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center">
                <Users className="h-4 w-4 text-white" />
              </div>
              Admin Account
            </CardTitle>
            <CardDescription>Create administrator account</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label>Email</Label>
              <Input 
                value={adminForm.email} 
                onChange={(e) => setAdminForm({ ...adminForm, email: e.target.value })}
              />
            </div>
            <div>
              <Label>Password</Label>
              <Input 
                value={adminForm.password}
                onChange={(e) => setAdminForm({ ...adminForm, password: e.target.value })}
              />
            </div>
            <div>
              <Label>Full Name</Label>
              <Input 
                value={adminForm.fullName}
                onChange={(e) => setAdminForm({ ...adminForm, fullName: e.target.value })}
              />
            </div>
            <Button onClick={handleCreateAdmin} disabled={isLoading} className="w-full">
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <UserPlus className="h-4 w-4 mr-2" />}
              Create Admin
            </Button>
          </CardContent>
        </Card>

        {/* Registrar Account */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                <Users className="h-4 w-4 text-white" />
              </div>
              Registrar Account
            </CardTitle>
            <CardDescription>Create registrar account</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label>Email</Label>
              <Input 
                value={registrarForm.email}
                onChange={(e) => setRegistrarForm({ ...registrarForm, email: e.target.value })}
              />
            </div>
            <div>
              <Label>Password</Label>
              <Input 
                value={registrarForm.password}
                onChange={(e) => setRegistrarForm({ ...registrarForm, password: e.target.value })}
              />
            </div>
            <div>
              <Label>Full Name</Label>
              <Input 
                value={registrarForm.fullName}
                onChange={(e) => setRegistrarForm({ ...registrarForm, fullName: e.target.value })}
              />
            </div>
            <Button onClick={handleCreateRegistrar} disabled={isLoading} className="w-full">
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <UserPlus className="h-4 w-4 mr-2" />}
              Create Registrar
            </Button>
          </CardContent>
        </Card>

        {/* Bulk Student Accounts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                <Users className="h-4 w-4 text-white" />
              </div>
              Student Accounts
            </CardTitle>
            <CardDescription>Bulk create from existing students</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              This will create login accounts for all students in the database who don't have accounts yet. 
              Random passwords will be generated.
            </p>
            <Button onClick={handleBulkCreateStudents} disabled={isLoading} className="w-full" variant="secondary">
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <UserPlus className="h-4 w-4 mr-2" />}
              Create All Student Accounts
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Credentials Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                Generated Credentials
              </CardTitle>
              <CardDescription>View and manage temporary passwords</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={fetchCredentials}>
              <RefreshCcw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {credentials.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Password</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {credentials.map((cred) => (
                    <TableRow key={cred.id}>
                      <TableCell className="font-medium">{cred.email}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm">
                            {showPasswords.has(cred.id) ? cred.temp_password : '••••••••'}
                          </span>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6"
                            onClick={() => togglePasswordVisibility(cred.id)}
                          >
                            {showPasswords.has(cred.id) ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${roleColors[cred.role]} text-white capitalize`}>
                          {cred.role}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(cred.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(`Email: ${cred.email}\nPassword: ${cred.temp_password}`, cred.id)}
                        >
                          {copiedId === cred.id ? (
                            <Check className="h-4 w-4 text-green-500" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Key className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No credentials generated yet</p>
              <p className="text-sm">Create user accounts to see their credentials here</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
