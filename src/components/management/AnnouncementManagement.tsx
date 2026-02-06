import { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Plus, Edit2, Trash2, Loader2, Bell, Pin, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useSchoolId } from '@/hooks/useSchoolId';
import { useAcademicYear } from '@/contexts/AcademicYearContext';

interface AnnouncementRecord {
  id: string;
  title: string;
  content: string;
  target_audience: string[] | null;
  target_grade_levels?: string[] | null;
  priority: string;
  is_pinned: boolean;
  published_at: string;
  expires_at?: string | null;
}

const GRADE_LEVELS = ['Kinder 1', 'Kinder 2', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'];
const AUDIENCES = ['all', 'students', 'teachers', 'parents', 'admin', 'registrar'];
const PRIORITIES = ['low', 'normal', 'high', 'urgent'];

const priorityColors: Record<string, string> = {
  low: 'bg-gray-100 text-gray-800',
  normal: 'bg-blue-100 text-blue-800',
  high: 'bg-orange-100 text-orange-800',
  urgent: 'bg-red-100 text-red-800',
};

export const AnnouncementManagement = () => {
  const queryClient = useQueryClient();
  const { data: schoolId } = useSchoolId();
  const { selectedYearId } = useAcademicYear();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<AnnouncementRecord | null>(null);
  const [viewingRecord, setViewingRecord] = useState<AnnouncementRecord | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    target_audience: ['all'] as string[],
    target_grade_levels: [] as string[],
    priority: 'normal',
    is_pinned: false,
    expires_at: '',
  });

  // Fetch announcements
  const { data: announcements = [], isLoading } = useQuery({
    queryKey: ['announcement-management', schoolId, selectedYearId, selectedPriority],
    queryFn: async () => {
      if (!schoolId) return [];
      
      let query = supabase
        .from('announcements')
        .select('*')
        .eq('school_id', schoolId)
        .order('is_pinned', { ascending: false })
        .order('published_at', { ascending: false });
      
      if (selectedPriority !== 'all') {
        query = query.eq('priority', selectedPriority);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: !!schoolId,
  });

  // Create/Update mutation
  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (!schoolId) throw new Error('Missing school');
      
      const payload = {
        ...data,
        school_id: schoolId,
        academic_year_id: selectedYearId,
        expires_at: data.expires_at || null,
        published_at: new Date().toISOString(),
      };
      
      if (editingRecord) {
        const { error } = await supabase
          .from('announcements')
          .update(payload)
          .eq('id', editingRecord.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('announcements')
          .insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcement-management'] });
      toast.success(editingRecord ? 'Announcement updated' : 'Announcement published');
      handleCloseModal();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to save announcement');
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('announcements')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcement-management'] });
      toast.success('Announcement deleted');
      setIsDeleteDialogOpen(false);
      setDeletingId(null);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete');
    },
  });

  // Toggle pin mutation
  const togglePinMutation = useMutation({
    mutationFn: async ({ id, is_pinned }: { id: string; is_pinned: boolean }) => {
      const { error } = await supabase
        .from('announcements')
        .update({ is_pinned })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcement-management'] });
    },
  });

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingRecord(null);
    setFormData({
      title: '',
      content: '',
      target_audience: ['all'],
      target_grade_levels: [],
      priority: 'normal',
      is_pinned: false,
      expires_at: '',
    });
  };

  const handleEdit = (record: AnnouncementRecord) => {
    setEditingRecord(record);
    setFormData({
      title: record.title,
      content: record.content,
      target_audience: record.target_audience || ['all'],
      target_grade_levels: record.target_grade_levels || [],
      priority: record.priority,
      is_pinned: record.is_pinned,
      expires_at: record.expires_at?.slice(0, 16) || '',
    });
    setIsModalOpen(true);
  };

  const handleView = (record: AnnouncementRecord) => {
    setViewingRecord(record);
    setIsViewModalOpen(true);
  };

  const handleDelete = (id: string) => {
    setDeletingId(id);
    setIsDeleteDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.content) {
      toast.error('Please fill in title and content');
      return;
    }
    saveMutation.mutate(formData);
  };

  const toggleAudience = (audience: string) => {
    const current = formData.target_audience;
    if (audience === 'all') {
      setFormData({ ...formData, target_audience: ['all'] });
    } else {
      const withoutAll = current.filter(a => a !== 'all');
      if (current.includes(audience)) {
        const updated = withoutAll.filter(a => a !== audience);
        setFormData({ ...formData, target_audience: updated.length ? updated : ['all'] });
      } else {
        setFormData({ ...formData, target_audience: [...withoutAll, audience] });
      }
    }
  };

  const toggleGradeLevel = (level: string) => {
    const current = formData.target_grade_levels;
    if (current.includes(level)) {
      setFormData({ ...formData, target_grade_levels: current.filter(l => l !== level) });
    } else {
      setFormData({ ...formData, target_grade_levels: [...current, level] });
    }
  };

  const isExpired = (expiresAt?: string) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Announcements</h1>
          <p className="text-muted-foreground mt-1">Create and manage school announcements</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Announcement
        </Button>
      </motion.div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <Label>Priority</Label>
              <Select value={selectedPriority} onValueChange={setSelectedPriority}>
                <SelectTrigger>
                  <SelectValue placeholder="All Priorities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  {PRIORITIES.map((priority) => (
                    <SelectItem key={priority} value={priority} className="capitalize">
                      {priority}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            All Announcements
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : announcements.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No announcements yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[40px]">Pin</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Audience</TableHead>
                    <TableHead>Published</TableHead>
                    <TableHead>Expires</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {announcements.map((record: AnnouncementRecord) => (
                    <TableRow key={record.id} className={isExpired(record.expires_at) ? 'opacity-50' : ''}>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className={record.is_pinned ? 'text-primary' : 'text-muted-foreground'}
                          onClick={() => togglePinMutation.mutate({ id: record.id, is_pinned: !record.is_pinned })}
                        >
                          <Pin className="h-4 w-4" fill={record.is_pinned ? 'currentColor' : 'none'} />
                        </Button>
                      </TableCell>
                      <TableCell className="font-medium max-w-[250px] truncate">
                        {record.title}
                      </TableCell>
                      <TableCell>
                        <Badge className={priorityColors[record.priority]}>
                          {record.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {record.target_audience.slice(0, 2).map((audience) => (
                            <Badge key={audience} variant="outline" className="text-xs">
                              {audience}
                            </Badge>
                          ))}
                          {record.target_audience.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{record.target_audience.length - 2}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {format(new Date(record.published_at), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell>
                        {record.expires_at ? (
                          <span className={isExpired(record.expires_at) ? 'text-destructive' : ''}>
                            {format(new Date(record.expires_at), 'MMM d, yyyy')}
                            {isExpired(record.expires_at) && (
                              <Badge variant="destructive" className="ml-2 text-xs">Expired</Badge>
                            )}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">Never</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleView(record)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(record)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(record.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {viewingRecord?.is_pinned && <Pin className="h-4 w-4 text-primary" />}
              {viewingRecord?.title}
            </DialogTitle>
          </DialogHeader>
          {viewingRecord && (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Badge className={priorityColors[viewingRecord.priority]}>
                  {viewingRecord.priority}
                </Badge>
                {viewingRecord.target_audience.map((audience) => (
                  <Badge key={audience} variant="outline">{audience}</Badge>
                ))}
              </div>
              
              <div className="prose dark:prose-invert max-w-none">
                <p className="whitespace-pre-wrap">{viewingRecord.content}</p>
              </div>
              
              <div className="text-sm text-muted-foreground">
                Published: {format(new Date(viewingRecord.published_at), 'MMMM d, yyyy h:mm a')}
                {viewingRecord.expires_at && (
                  <span className="ml-4">
                    Expires: {format(new Date(viewingRecord.expires_at), 'MMMM d, yyyy')}
                  </span>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingRecord ? 'Edit Announcement' : 'New Announcement'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Announcement title"
              />
            </div>

            <div className="space-y-2">
              <Label>Content *</Label>
              <Textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Announcement content..."
                rows={5}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) => setFormData({ ...formData, priority: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIORITIES.map((priority) => (
                      <SelectItem key={priority} value={priority} className="capitalize">
                        {priority}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Expires At</Label>
                <Input
                  type="datetime-local"
                  value={formData.expires_at}
                  onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Target Audience</Label>
              <div className="flex flex-wrap gap-2">
                {AUDIENCES.map((audience) => (
                  <label key={audience} className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={formData.target_audience.includes(audience)}
                      onCheckedChange={() => toggleAudience(audience)}
                    />
                    <span className="text-sm capitalize">{audience}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Target Grade Levels (optional)</Label>
              <div className="flex flex-wrap gap-2 max-h-[120px] overflow-y-auto">
                {GRADE_LEVELS.map((level) => (
                  <label key={level} className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={formData.target_grade_levels.includes(level)}
                      onCheckedChange={() => toggleGradeLevel(level)}
                    />
                    <span className="text-sm">{level}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                checked={formData.is_pinned}
                onCheckedChange={(checked) => setFormData({ ...formData, is_pinned: checked })}
              />
              <Label>Pin this announcement</Label>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseModal}>
                Cancel
              </Button>
              <Button type="submit" disabled={saveMutation.isPending}>
                {saveMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editingRecord ? 'Update' : 'Publish'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Announcement?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The announcement will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingId && deleteMutation.mutate(deletingId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
