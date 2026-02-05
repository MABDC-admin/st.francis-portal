import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Building2, 
  Search, 
  Plus, 
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  Loader2,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

interface School {
  id: string;
  name: string;
  code: string;
  address: string | null;
  contact_number: string | null;
  email: string | null;
  principal_name: string | null;
  is_active: boolean;
  created_at: string;
}

const emptySchool = {
  name: '',
  code: '',
  address: '',
  contact_number: '',
  email: '',
  principal_name: '',
};

export const SchoolManagement = () => {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [showInactive, setShowInactive] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSchool, setEditingSchool] = useState<School | null>(null);
  const [deletingSchool, setDeletingSchool] = useState<School | null>(null);
  const [formData, setFormData] = useState(emptySchool);

  // Fetch schools
  const { data: schools = [], isLoading } = useQuery({
    queryKey: ['schools-management', showInactive],
    queryFn: async (): Promise<School[]> => {
      let query = supabase.from('schools').select('*').order('name');
      
      if (!showInactive) {
        query = query.eq('is_active', true);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const filteredSchools = schools.filter(school => {
    if (!searchQuery) return true;
    const search = searchQuery.toLowerCase();
    return (
      school.name.toLowerCase().includes(search) ||
      school.code.toLowerCase().includes(search) ||
      school.email?.toLowerCase().includes(search)
    );
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (editingSchool) {
        const { error } = await supabase
          .from('schools')
          .update({
            name: formData.name,
            code: formData.code.toUpperCase(),
            address: formData.address || null,
            contact_number: formData.contact_number || null,
            email: formData.email || null,
            principal_name: formData.principal_name || null,
          })
          .eq('id', editingSchool.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('schools')
          .insert({
            name: formData.name,
            code: formData.code.toUpperCase(),
            address: formData.address || null,
            contact_number: formData.contact_number || null,
            email: formData.email || null,
            principal_name: formData.principal_name || null,
            is_active: true,
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schools-management'] });
      queryClient.invalidateQueries({ queryKey: ['schools-list'] });
      toast.success(editingSchool ? 'School updated' : 'School created');
      handleCloseDialog();
    },
    onError: (error: any) => {
      toast.error('Failed to save: ' + error.message);
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { error } = await supabase
        .from('schools')
        .update({ is_active: isActive })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schools-management'] });
      queryClient.invalidateQueries({ queryKey: ['schools-list'] });
      toast.success('School status updated');
    },
    onError: (error: any) => {
      toast.error('Failed to update: ' + error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('schools').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schools-management'] });
      queryClient.invalidateQueries({ queryKey: ['schools-list'] });
      toast.success('School deleted');
      setDeletingSchool(null);
    },
    onError: (error: any) => {
      toast.error('Failed to delete: ' + error.message);
    },
  });

  const handleOpenCreate = () => {
    setEditingSchool(null);
    setFormData(emptySchool);
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (school: School) => {
    setEditingSchool(school);
    setFormData({
      name: school.name,
      code: school.code,
      address: school.address || '',
      contact_number: school.contact_number || '',
      email: school.email || '',
      principal_name: school.principal_name || '',
    });
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingSchool(null);
    setFormData(emptySchool);
  };

  const handleSave = () => {
    if (!formData.name.trim() || !formData.code.trim()) {
      toast.error('Name and code are required');
      return;
    }
    saveMutation.mutate();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search schools..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Switch
              id="show-inactive-schools"
              checked={showInactive}
              onCheckedChange={setShowInactive}
            />
            <Label htmlFor="show-inactive-schools" className="text-sm text-muted-foreground">
              Show inactive
            </Label>
          </div>
          <Button onClick={handleOpenCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Add School
          </Button>
        </div>
      </div>

      {/* Schools Table */}
      <div className="bg-card rounded-2xl shadow-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>School</TableHead>
              <TableHead>Code</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Principal</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-10 w-40" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-28" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-24 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : filteredSchools.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  <Building2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No schools found</p>
                </TableCell>
              </TableRow>
            ) : (
              filteredSchools.map((school) => (
                <TableRow key={school.id} className={!school.is_active ? 'opacity-60' : ''}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{school.name}</p>
                      {school.address && (
                        <p className="text-sm text-muted-foreground truncate max-w-[200px]">
                          {school.address}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{school.code}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {school.email && <p>{school.email}</p>}
                      {school.contact_number && (
                        <p className="text-muted-foreground">{school.contact_number}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{school.principal_name || '-'}</TableCell>
                  <TableCell>
                    {school.is_active ? (
                      <Badge className="bg-success/10 text-success border-success/20">
                        <Eye className="h-3 w-3 mr-1" />
                        Active
                      </Badge>
                    ) : (
                      <Badge variant="secondary">
                        <EyeOff className="h-3 w-3 mr-1" />
                        Inactive
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenEdit(school)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleActiveMutation.mutate({ 
                          id: school.id, 
                          isActive: !school.is_active 
                        })}
                      >
                        {school.is_active ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setDeletingSchool(school)}
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

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingSchool ? 'Edit School' : 'Add School'}</DialogTitle>
            <DialogDescription>
              {editingSchool
                ? 'Update the school information below.'
                : 'Fill in the details to create a new school.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>School Name *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Full school name"
                />
              </div>
              <div className="space-y-2">
                <Label>Code *</Label>
                <Input
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="e.g., MABDC"
                  maxLength={10}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Address</Label>
              <Textarea
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Full address"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="school@email.com"
                />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input
                  value={formData.contact_number}
                  onChange={(e) => setFormData({ ...formData, contact_number: e.target.value })}
                  placeholder="+971 XX XXX XXXX"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Principal Name</Label>
              <Input
                value={formData.principal_name}
                onChange={(e) => setFormData({ ...formData, principal_name: e.target.value })}
                placeholder="Dr. John Doe"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saveMutation.isPending}>
              {saveMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingSchool ? 'Save Changes' : 'Create School'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingSchool} onOpenChange={(open) => !open && setDeletingSchool(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete School</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingSchool?.name}"? This action cannot be
              undone. Consider deactivating the school instead if you want to preserve data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingSchool && deleteMutation.mutate(deletingSchool.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Delete School
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
