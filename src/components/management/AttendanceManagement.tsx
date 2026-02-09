import { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Plus, Edit2, Trash2, Loader2, Calendar, Users, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';
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
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useSchoolId } from '@/hooks/useSchoolId';
import { useAcademicYear } from '@/contexts/AcademicYearContext';

interface AttendanceRecord {
  id: string;
  student_id: string;
  date: string;
  status: string;
  time_in?: string | null;
  time_out?: string | null;
  remarks?: string | null;
  students?: {
    student_name: string;
    level: string;
    lrn: string;
  } | null;
}

const GRADE_LEVELS = ['Kinder 1', 'Kinder 2', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'];

const statusConfig: Record<string, { label: string; icon: typeof CheckCircle; color: string }> = {
  present: { label: 'Present', icon: CheckCircle, color: 'bg-green-100 text-green-800' },
  absent: { label: 'Absent', icon: XCircle, color: 'bg-red-100 text-red-800' },
  late: { label: 'Late', icon: Clock, color: 'bg-yellow-100 text-yellow-800' },
  excused: { label: 'Excused', icon: AlertCircle, color: 'bg-blue-100 text-blue-800' },
};

export const AttendanceManagement = () => {
  const queryClient = useQueryClient();
  const { data: schoolId } = useSchoolId();
  const { selectedYearId } = useAcademicYear();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<AttendanceRecord | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  
  // Filters
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  
  // Form state
  const [formData, setFormData] = useState({
    student_id: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    status: 'present',
    time_in: '',
    time_out: '',
    remarks: '',
  });

  // Fetch attendance records
  const { data: attendance = [], isLoading } = useQuery({
    queryKey: ['attendance-management', schoolId, selectedYearId, selectedDate, selectedLevel],
    queryFn: async () => {
      if (!schoolId || !selectedYearId) return [];
      
      let query = supabase
        .from('student_attendance')
        .select(`
          *,
          students:student_id(student_name, level, lrn)
        `)
        .eq('school_id', schoolId)
        .eq('academic_year_id', selectedYearId)
        .eq('date', selectedDate)
        .order('created_at', { ascending: false });
      
      const { data, error } = await query;
      if (error) throw error;
      
      // Filter by level if selected
      if (selectedLevel !== 'all') {
        return (data || []).filter((r: any) => r.students?.level === selectedLevel);
      }
      
      return data || [];
    },
    enabled: !!schoolId && !!selectedYearId,
  });

  // Fetch students for dropdown
  const { data: students = [] } = useQuery({
    queryKey: ['students-for-attendance', schoolId, selectedYearId, selectedLevel],
    queryFn: async () => {
      if (!schoolId || !selectedYearId) return [];
      
      let query = supabase
        .from('students')
        .select('id, student_name, level, lrn')
        .eq('school_id', schoolId)
        .eq('academic_year_id', selectedYearId)
        .order('student_name');
      
      if (selectedLevel !== 'all') {
        query = query.eq('level', selectedLevel);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: !!schoolId && !!selectedYearId,
  });

  // Create/Update mutation
  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (!schoolId || !selectedYearId) throw new Error('Missing school or academic year');
      
      const payload = {
        ...data,
        school_id: schoolId,
        academic_year_id: selectedYearId,
      };
      
      if (editingRecord) {
        const { error } = await supabase
          .from('student_attendance')
          .update(payload)
          .eq('id', editingRecord.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('student_attendance')
          .insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance-management'] });
      toast.success(editingRecord ? 'Attendance updated' : 'Attendance recorded');
      handleCloseModal();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to save attendance');
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('student_attendance')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance-management'] });
      toast.success('Attendance record deleted');
      setIsDeleteDialogOpen(false);
      setDeletingId(null);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete');
    },
  });

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingRecord(null);
    setFormData({
      student_id: '',
      date: selectedDate,
      status: 'present',
      time_in: '',
      time_out: '',
      remarks: '',
    });
  };

  const handleEdit = (record: AttendanceRecord) => {
    setEditingRecord(record);
    setFormData({
      student_id: record.student_id,
      date: record.date,
      status: record.status,
      time_in: record.time_in || '',
      time_out: record.time_out || '',
      remarks: record.remarks || '',
    });
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    setDeletingId(id);
    setIsDeleteDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.student_id) {
      toast.error('Please select a learner');
      return;
    }
    saveMutation.mutate(formData);
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
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Attendance Management</h1>
          <p className="text-muted-foreground mt-1">Record and manage learner attendance</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Record Attendance
        </Button>
      </motion.div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <Label>Date</Label>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>
            <div className="flex-1 min-w-[200px]">
              <Label>Grade Level</Label>
              <Select value={selectedLevel} onValueChange={setSelectedLevel}>
                <SelectTrigger>
                  <SelectValue placeholder="All Levels" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  {GRADE_LEVELS.map((level) => (
                    <SelectItem key={level} value={level}>{level}</SelectItem>
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
            <Calendar className="h-5 w-5" />
            Attendance Records for {format(new Date(selectedDate), 'MMMM d, yyyy')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : attendance.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No attendance records for this date</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Learner</TableHead>
                    <TableHead>LRN</TableHead>
                    <TableHead>Level</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Time In</TableHead>
                    <TableHead>Time Out</TableHead>
                    <TableHead>Remarks</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {attendance.map((record: any) => {
                    const config = statusConfig[record.status] || statusConfig.present;
                    const StatusIcon = config.icon;
                    return (
                      <TableRow key={record.id}>
                        <TableCell className="font-medium">
                          {record.students?.student_name || 'Unknown'}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {record.students?.lrn || '-'}
                        </TableCell>
                        <TableCell>{record.students?.level || '-'}</TableCell>
                        <TableCell>
                          <Badge className={config.color}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {config.label}
                          </Badge>
                        </TableCell>
                        <TableCell>{record.time_in || '-'}</TableCell>
                        <TableCell>{record.time_out || '-'}</TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {record.remarks || '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
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
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingRecord ? 'Edit Attendance' : 'Record Attendance'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Student</Label>
              <Select
                value={formData.student_id}
                onValueChange={(value) => setFormData({ ...formData, student_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select student" />
                </SelectTrigger>
                <SelectContent>
                  {students.map((student: any) => (
                    <SelectItem key={student.id} value={student.id}>
                      {student.student_name} ({student.level})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Date</Label>
              <Input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value: any) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="present">Present</SelectItem>
                  <SelectItem value="absent">Absent</SelectItem>
                  <SelectItem value="late">Late</SelectItem>
                  <SelectItem value="excused">Excused</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Time In</Label>
                <Input
                  type="time"
                  value={formData.time_in}
                  onChange={(e) => setFormData({ ...formData, time_in: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Time Out</Label>
                <Input
                  type="time"
                  value={formData.time_out}
                  onChange={(e) => setFormData({ ...formData, time_out: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Remarks</Label>
              <Textarea
                value={formData.remarks}
                onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                placeholder="Optional notes..."
                rows={3}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseModal}>
                Cancel
              </Button>
              <Button type="submit" disabled={saveMutation.isPending}>
                {saveMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editingRecord ? 'Update' : 'Save'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Attendance Record?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The attendance record will be permanently deleted.
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
