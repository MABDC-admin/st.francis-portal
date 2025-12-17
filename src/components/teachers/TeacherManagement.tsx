import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { UserPlus, Loader2, Search, Edit, Trash2, Mail, Phone, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Teacher {
  id: string;
  user_id: string | null;
  employee_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  department: string | null;
  grade_level: string | null;
  subjects: string[] | null;
  status: string;
  created_at: string;
}

const initialFormState = {
  employee_id: '',
  full_name: '',
  email: '',
  phone: '',
  department: '',
  grade_level: '',
  subjects: '',
};

export const TeacherManagement = () => {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [formData, setFormData] = useState(initialFormState);
  const [createAccount, setCreateAccount] = useState(true);

  const fetchTeachers = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('teachers')
      .select('*')
      .order('full_name');
    
    if (!error && data) {
      setTeachers(data as Teacher[]);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchTeachers();
  }, []);

  const handleOpenModal = (teacher?: Teacher) => {
    if (teacher) {
      setEditingTeacher(teacher);
      setFormData({
        employee_id: teacher.employee_id,
        full_name: teacher.full_name,
        email: teacher.email,
        phone: teacher.phone || '',
        department: teacher.department || '',
        grade_level: teacher.grade_level || '',
        subjects: teacher.subjects?.join(', ') || '',
      });
      setCreateAccount(false);
    } else {
      setEditingTeacher(null);
      setFormData(initialFormState);
      setCreateAccount(true);
    }
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.employee_id || !formData.full_name || !formData.email) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSaving(true);
    try {
      const subjectsArray = formData.subjects
        ? formData.subjects.split(',').map(s => s.trim()).filter(s => s)
        : null;

      if (editingTeacher) {
        // Update existing teacher
        const { error } = await supabase
          .from('teachers')
          .update({
            employee_id: formData.employee_id,
            full_name: formData.full_name,
            email: formData.email,
            phone: formData.phone || null,
            department: formData.department || null,
            grade_level: formData.grade_level || null,
            subjects: subjectsArray,
          })
          .eq('id', editingTeacher.id);

        if (error) throw error;
        toast.success('Teacher updated successfully');
      } else {
        // Create new teacher
        let userId = null;

        // Create user account if requested
        if (createAccount) {
          const { data: result, error: funcError } = await supabase.functions.invoke('create-users', {
            body: {
              action: 'create_teacher',
              email: formData.email,
              fullName: formData.full_name,
            },
          });

          if (funcError) {
            console.error('Error creating account:', funcError);
            toast.error('Failed to create user account, but teacher record will be saved');
          } else {
            userId = result?.userId;
            toast.success('Teacher account created - check User Management for credentials');
          }
        }

        // Insert teacher record
        const { error } = await supabase
          .from('teachers')
          .insert({
            employee_id: formData.employee_id,
            full_name: formData.full_name,
            email: formData.email,
            phone: formData.phone || null,
            department: formData.department || null,
            grade_level: formData.grade_level || null,
            subjects: subjectsArray,
            user_id: userId,
          });

        if (error) throw error;
        toast.success('Teacher added successfully');
      }

      setIsModalOpen(false);
      fetchTeachers();
    } catch (error: any) {
      console.error('Error:', error);
      toast.error(error.message || 'Failed to save teacher');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (teacher: Teacher) => {
    if (!confirm(`Are you sure you want to delete ${teacher.full_name}?`)) return;

    try {
      const { error } = await supabase
        .from('teachers')
        .delete()
        .eq('id', teacher.id);

      if (error) throw error;
      toast.success('Teacher deleted');
      fetchTeachers();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete teacher');
    }
  };

  const filteredTeachers = teachers.filter(t =>
    t.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.employee_id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Teachers</h1>
          <p className="text-muted-foreground mt-1">Manage teacher records and accounts</p>
        </div>
        <Button onClick={() => handleOpenModal()}>
          <UserPlus className="h-4 w-4 mr-2" />
          Add Teacher
        </Button>
      </motion.div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, or employee ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Teachers Table */}
      <Card>
        <CardHeader>
          <CardTitle>Teacher List</CardTitle>
          <CardDescription>{teachers.length} teachers registered</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredTeachers.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Grade Level</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTeachers.map((teacher) => (
                    <TableRow key={teacher.id}>
                      <TableCell className="font-mono text-sm">{teacher.employee_id}</TableCell>
                      <TableCell className="font-medium">{teacher.full_name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Mail className="h-3 w-3" />
                          {teacher.email}
                        </div>
                      </TableCell>
                      <TableCell>{teacher.grade_level || '-'}</TableCell>
                      <TableCell>{teacher.department || '-'}</TableCell>
                      <TableCell>
                        <Badge variant={teacher.status === 'active' ? 'default' : 'secondary'}>
                          {teacher.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" onClick={() => handleOpenModal(teacher)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(teacher)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No teachers found</p>
              <p className="text-sm">Add a teacher to get started</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingTeacher ? 'Edit Teacher' : 'Add New Teacher'}</DialogTitle>
            <DialogDescription>
              {editingTeacher ? 'Update teacher information' : 'Enter teacher details and create their account'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Employee ID *</Label>
                <Input
                  value={formData.employee_id}
                  onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                  placeholder="EMP-001"
                />
              </div>
              <div>
                <Label>Department</Label>
                <Input
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  placeholder="Mathematics"
                />
              </div>
            </div>
            <div>
              <Label>Full Name *</Label>
              <Input
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                placeholder="Juan Dela Cruz"
              />
            </div>
            <div>
              <Label>Email *</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="teacher@school.edu"
              />
            </div>
            <div>
              <Label>Phone</Label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+63 912 345 6789"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Grade Level</Label>
                <Input
                  value={formData.grade_level}
                  onChange={(e) => setFormData({ ...formData, grade_level: e.target.value })}
                  placeholder="Grade 6"
                />
              </div>
              <div>
                <Label>Subjects (comma-separated)</Label>
                <Input
                  value={formData.subjects}
                  onChange={(e) => setFormData({ ...formData, subjects: e.target.value })}
                  placeholder="Math, Science"
                />
              </div>
            </div>
            {!editingTeacher && (
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="createAccount"
                  checked={createAccount}
                  onChange={(e) => setCreateAccount(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor="createAccount" className="text-sm font-normal">
                  Create login account (password will be generated)
                </Label>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {editingTeacher ? 'Update' : 'Add Teacher'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
