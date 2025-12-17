import { useState, useEffect, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import { Users, UserPlus, Key, Loader2, Eye, EyeOff, Copy, Check, RefreshCcw, Trash2, AlertTriangle, Filter, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { PrintableCredentialSlips } from './PrintableCredentialSlips';

interface UserCredential {
  id: string;
  email: string;
  temp_password: string;
  role: string;
  created_at: string;
  password_changed: boolean;
  student_id: string | null;
  student_name?: string;
  student_level?: string;
}

export const UserManagement = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [credentials, setCredentials] = useState<UserCredential[]>([]);
  const [showPasswords, setShowPasswords] = useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [showPrintDialog, setShowPrintDialog] = useState(false);
  const [selectedSchool, setSelectedSchool] = useState('M.A Brain Development Center');
  const printRef = useRef<HTMLDivElement>(null);
  
  const schoolOptions = [
    { value: 'M.A Brain Development Center', label: 'M.A Brain Development Center (MABDC)' },
    { value: 'St. Francis Xavier Smart Academy Inc', label: 'St. Francis Xavier Smart Academy Inc (STFXSA)' },
  ];
  
  // Form states for creating accounts
  const [adminForm, setAdminForm] = useState({ email: 'denskie@edutrack.local', password: 'Denskie123', fullName: 'Admin User' });
  const [registrarForm, setRegistrarForm] = useState({ email: 'registrar@edutrack.local', password: 'registrar123', fullName: 'Registrar User' });

  const fetchCredentials = async () => {
    // Fetch credentials with student info
    const { data, error } = await supabase
      .from('user_credentials')
      .select(`
        *,
        students:student_id (
          student_name,
          level
        )
      `)
      .order('created_at', { ascending: false });
    
    if (!error && data) {
      const mappedData = data.map((cred: any) => ({
        ...cred,
        student_name: cred.students?.student_name || null,
        student_level: cred.students?.level || null,
      }));
      setCredentials(mappedData as UserCredential[]);
    }
  };

  useEffect(() => {
    fetchCredentials();
  }, []);

  // Get unique levels for filter
  const uniqueLevels = useMemo(() => {
    const levels = new Set<string>();
    credentials.forEach(cred => {
      if (cred.student_level) {
        levels.add(cred.student_level);
      }
    });
    return Array.from(levels).sort((a, b) => {
      // Custom sort for levels
      const order = ['Kinder 1', 'Kinder 2', 'Level 1', 'Level 2', 'Level 3', 'Level 4', 'Level 5', 'Level 6', 'Level 7', 'Level 8', 'Level 9', 'Level 10', 'Level 11', 'Level 12'];
      return order.indexOf(a) - order.indexOf(b);
    });
  }, [credentials]);

  // Filtered credentials
  const filteredCredentials = useMemo(() => {
    return credentials.filter(cred => {
      const matchesLevel = levelFilter === 'all' || cred.student_level === levelFilter;
      const matchesRole = roleFilter === 'all' || cred.role === roleFilter;
      return matchesLevel && matchesRole;
    });
  }, [credentials, levelFilter, roleFilter]);

  // Student credentials only for printing
  const studentCredentials = useMemo(() => {
    return filteredCredentials.filter(cred => cred.role === 'student');
  }, [filteredCredentials]);

  const handlePrint = () => {
    if (studentCredentials.length === 0) {
      toast.error('No student credentials to print');
      return;
    }
    setShowPrintDialog(true);
  };

  const executePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow && printRef.current) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Student Credentials</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
              .credential-slip {
                border: 2px dashed #666;
                padding: 16px;
                margin-bottom: 8px;
                page-break-inside: avoid;
                background: white;
              }
              .slip-header {
                text-align: center;
                border-bottom: 1px solid #ccc;
                padding-bottom: 8px;
                margin-bottom: 12px;
              }
              .slip-header h3 {
                font-size: 14px;
                font-weight: bold;
                margin: 0;
                color: #333;
              }
              .slip-header p {
                font-size: 10px;
                color: #666;
                margin: 4px 0 0 0;
              }
              .slip-content {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 8px;
              }
              .slip-field {
                font-size: 11px;
              }
              .slip-field label {
                font-weight: 600;
                color: #444;
                display: block;
                margin-bottom: 2px;
              }
              .slip-field .value {
                font-family: monospace;
                font-size: 12px;
                background: #f5f5f5;
                padding: 4px 8px;
                border-radius: 4px;
                border: 1px solid #ddd;
              }
              .slip-footer {
                margin-top: 12px;
                padding-top: 8px;
                border-top: 1px dashed #ccc;
                font-size: 9px;
                color: #888;
                text-align: center;
              }
              .slips-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 12px;
              }
              @media print {
                @page { size: A4; margin: 10mm; }
              }
            </style>
          </head>
          <body>
            ${printRef.current.innerHTML}
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
    setShowPrintDialog(false);
  };


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

  const handleResetStudentAccounts = async () => {
    if (confirmText !== 'RESET') {
      toast.error('Please type RESET to confirm');
      return;
    }
    
    setIsResetting(true);
    try {
      const { data: result, error } = await supabase.functions.invoke('create-users', {
        body: { action: 'reset_student_accounts' },
      });

      if (error) throw error;
      
      toast.success(result.message || 'Student accounts reset successfully');
      setShowResetDialog(false);
      setConfirmText('');
      fetchCredentials();
    } catch (error: any) {
      console.error('Error:', error);
      toast.error(error.message || 'Failed to reset student accounts');
    } finally {
      setIsResetting(false);
    }
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
              This will create login accounts for all students. Username will be their LRN.
            </p>
            <div className="flex gap-2">
              <Button onClick={handleBulkCreateStudents} disabled={isLoading} className="flex-1" variant="secondary">
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <UserPlus className="h-4 w-4 mr-2" />}
                Create All
              </Button>
              <Button onClick={() => setShowResetDialog(true)} variant="destructive" size="icon" title="Reset all student accounts">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Credentials Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                Generated Credentials
              </CardTitle>
              <CardDescription>View and manage temporary passwords</CardDescription>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="w-[130px]">
                    <SelectValue placeholder="Role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="registrar">Registrar</SelectItem>
                    <SelectItem value="teacher">Teacher</SelectItem>
                    <SelectItem value="student">Student</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={levelFilter} onValueChange={setLevelFilter}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Grade Level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Levels</SelectItem>
                    {uniqueLevels.map(level => (
                      <SelectItem key={level} value={level}>{level}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="h-4 w-4 mr-2" />
                Print Slips
              </Button>
              <Button variant="outline" size="sm" onClick={fetchCredentials}>
                <RefreshCcw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredCredentials.length > 0 ? (
            <div className="overflow-x-auto">
              <div className="mb-2 text-sm text-muted-foreground">
                Showing {filteredCredentials.length} of {credentials.length} credentials
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Username (LRN)</TableHead>
                    <TableHead>Student Name</TableHead>
                    <TableHead>Level</TableHead>
                    <TableHead>Password</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCredentials.map((cred) => (
                    <TableRow key={cred.id}>
                      <TableCell className="font-mono font-medium">{cred.email}</TableCell>
                      <TableCell className="text-sm">{cred.student_name || '-'}</TableCell>
                      <TableCell>
                        {cred.student_level ? (
                          <Badge variant="outline">{cred.student_level}</Badge>
                        ) : '-'}
                      </TableCell>
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
                          onClick={() => copyToClipboard(`Username: ${cred.email}\nPassword: ${cred.temp_password}`, cred.id)}
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
              <p>No credentials found</p>
              <p className="text-sm">
                {credentials.length > 0 
                  ? 'Try adjusting your filters' 
                  : 'Create user accounts to see their credentials here'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reset Student Accounts Dialog */}
      <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Reset All Student Accounts
            </DialogTitle>
            <DialogDescription>
              This will permanently delete all student user accounts and their credentials. 
              The student records will remain, but their login accounts will be removed.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm font-medium mb-2">
              Type <span className="font-bold text-destructive">RESET</span> to confirm:
            </p>
            <Input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="RESET"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowResetDialog(false); setConfirmText(''); }}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleResetStudentAccounts}
              disabled={isResetting || confirmText !== 'RESET'}
            >
              {isResetting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
              Reset All
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Print Dialog */}
      <Dialog open={showPrintDialog} onOpenChange={setShowPrintDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Printer className="h-5 w-5" />
              Print Credential Slips
            </DialogTitle>
            <DialogDescription>
              Preview and print {studentCredentials.length} student credential slips. Each slip can be cut along the dotted lines.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Label className="whitespace-nowrap">School Name:</Label>
              <Select value={selectedSchool} onValueChange={setSelectedSchool}>
                <SelectTrigger className="flex-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {schoolOptions.map(school => (
                    <SelectItem key={school.value} value={school.value}>
                      {school.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="border rounded-lg p-4 bg-muted/30 max-h-[400px] overflow-y-auto">
              <PrintableCredentialSlips 
                ref={printRef}
                credentials={studentCredentials}
                schoolName={selectedSchool}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPrintDialog(false)}>
              Cancel
            </Button>
            <Button onClick={executePrint}>
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
