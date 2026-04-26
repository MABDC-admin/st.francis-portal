import { useEffect, useMemo, useState } from 'react';
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
import { useAuth } from '@/contexts/AuthContext';
import { useSchoolId } from '@/hooks/useSchoolId';
import { useAcademicYear } from '@/contexts/AcademicYearContext';
import { useYearGuard } from '@/hooks/useYearGuard';
import { useTeacherProfile, useTeacherSchedule } from '@/hooks/useTeacherData';
import { YearLockedBanner } from '@/components/ui/YearLockedBanner';
import { GRADE_LEVELS } from '@/components/enrollment/constants';

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
    section?: string | null;
  } | null;
}

interface StudentOption {
  id: string;
  student_name: string;
  level: string;
  lrn: string;
  section?: string | null;
}

interface TeacherClassSlot {
  level: string | null;
  section: string | null;
}

type AttendanceStatus = 'present' | 'late' | 'absent';

const normalizeGradeLevel = (value: string | null | undefined) => {
  if (!value) return '';

  const normalized = value.toLowerCase().replace(/\s+/g, ' ').trim();
  if (normalized.includes('kinder')) {
    return normalized.replace(/\s+/g, '');
  }

  const stripped = normalized.replace(/^grade\s*/i, '').replace(/^g\s*/i, '').trim();
  if (/^\d{1,2}$/.test(stripped)) {
    return `grade-${stripped}`;
  }

  return stripped.replace(/\s+/g, '');
};

const matchesTeacherClassSlot = (
  level: string | null | undefined,
  section: string | null | undefined,
  classSlots: TeacherClassSlot[],
) => {
  return classSlots.some((slot) => {
    const sameLevel = normalizeGradeLevel(level) === normalizeGradeLevel(slot.level);
    if (!sameLevel) return false;
    if (!slot.section) return true;
    if (!section) return true;
    return slot.section === section;
  });
};

const resolveGradeLevelOption = (level: string | null | undefined) => {
  if (!level) return null;
  return GRADE_LEVELS.find((option) => normalizeGradeLevel(option) === normalizeGradeLevel(level)) ?? level;
};

const statusConfig: Record<string, { label: string; icon: typeof CheckCircle; color: string }> = {
  present: { label: 'Present', icon: CheckCircle, color: 'bg-green-100 text-green-800' },
  absent: { label: 'Absent', icon: XCircle, color: 'bg-red-100 text-red-800' },
  late: { label: 'Late', icon: Clock, color: 'bg-yellow-100 text-yellow-800' },
  excused: { label: 'Excused', icon: AlertCircle, color: 'bg-blue-100 text-blue-800' },
};

const teacherAttendanceOptions: Array<{
  value: AttendanceStatus;
  label: string;
  icon: typeof CheckCircle;
  activeClass: string;
}> = [
  { value: 'present', label: 'Present', icon: CheckCircle, activeClass: 'border-green-500 bg-green-50 text-green-700' },
  { value: 'late', label: 'Late', icon: Clock, activeClass: 'border-yellow-500 bg-yellow-50 text-yellow-700' },
  { value: 'absent', label: 'Absent', icon: XCircle, activeClass: 'border-red-500 bg-red-50 text-red-700' },
];

export const AttendanceManagement = () => {
  const queryClient = useQueryClient();
  const { user, role } = useAuth();
  const { data: schoolId } = useSchoolId();
  const { selectedYearId } = useAcademicYear();
  const { isReadOnly, guardMutation } = useYearGuard();
  const isTeacher = role === 'teacher';
  
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
  const [teacherRosterStatuses, setTeacherRosterStatuses] = useState<Record<string, AttendanceStatus | ''>>({});

  const { data: teacherProfile } = useTeacherProfile(
    isTeacher ? user?.id : undefined,
    isTeacher ? user?.email : undefined,
  );
  const { data: teacherSchedules = [] } = useTeacherSchedule(
    isTeacher ? teacherProfile?.id : undefined,
    isTeacher ? schoolId : undefined,
    isTeacher ? selectedYearId : undefined,
    isTeacher ? teacherProfile?.grade_level : undefined,
  );

  const teacherClassSlots = useMemo(() => {
    if (!isTeacher) {
      return null;
    }

    if (teacherSchedules.length > 0) {
      return teacherSchedules.map((schedule: any) => ({
        level: schedule.grade_level ?? null,
        section: schedule.section ?? null,
      }));
    }

    if (teacherProfile?.grade_level) {
      return [{
        level: teacherProfile.grade_level,
        section: null,
      }];
    }

    return [];
  }, [isTeacher, teacherProfile?.grade_level, teacherSchedules]);

  const teacherGradeLevelOptions = useMemo(() => {
    if (!teacherClassSlots) return [];

    return Array.from(
      new Set(
        teacherClassSlots
          .map((slot) => resolveGradeLevelOption(slot.level))
          .filter((level): level is string => !!level),
      ),
    );
  }, [teacherClassSlots]);

  const gradeLevelOptions = isTeacher ? teacherGradeLevelOptions : GRADE_LEVELS;

  useEffect(() => {
    if (!isTeacher || selectedLevel === 'all') return;

    const canUseSelectedLevel = teacherGradeLevelOptions.some(
      (level) => normalizeGradeLevel(level) === normalizeGradeLevel(selectedLevel),
    );

    if (!canUseSelectedLevel) {
      setSelectedLevel('all');
    }
  }, [isTeacher, selectedLevel, teacherGradeLevelOptions]);

  // Fetch attendance records
  const { data: attendance = [], isLoading } = useQuery<AttendanceRecord[]>({
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
      
      return data || [];
    },
    enabled: !!schoolId && !!selectedYearId,
  });

  // Fetch students for dropdown
  const { data: students = [] } = useQuery<StudentOption[]>({
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

  const visibleStudents = useMemo(() => {
    if (!teacherClassSlots) {
      return students;
    }

    if (teacherClassSlots.length === 0) {
      return [];
    }

    return students.filter((student) =>
      matchesTeacherClassSlot(student.level, student.section, teacherClassSlots),
    );
  }, [students, teacherClassSlots]);

  const visibleAttendance = useMemo(() => {
    let filtered = attendance;

    if (teacherClassSlots) {
      if (teacherClassSlots.length === 0) {
        return [];
      }

      filtered = filtered.filter((record) =>
        matchesTeacherClassSlot(record.students?.level, record.students?.section, teacherClassSlots),
      );
    }

    if (selectedLevel !== 'all') {
      filtered = filtered.filter((record) => record.students?.level === selectedLevel);
    }

    return filtered;
  }, [attendance, selectedLevel, teacherClassSlots]);

  const attendanceByStudentId = useMemo(() => {
    return new Map(visibleAttendance.map((record) => [record.student_id, record]));
  }, [visibleAttendance]);

  useEffect(() => {
    if (!isTeacher) return;

    setTeacherRosterStatuses(() => {
      const next: Record<string, AttendanceStatus | ''> = {};

      visibleStudents.forEach((student) => {
        const existingStatus = attendanceByStudentId.get(student.id)?.status;
        next[student.id] =
          existingStatus === 'present' || existingStatus === 'late' || existingStatus === 'absent'
            ? existingStatus
            : '';
      });

      return next;
    });
  }, [attendanceByStudentId, isTeacher, selectedDate, visibleStudents]);

  const rosterStatusCounts = useMemo(() => {
    return visibleStudents.reduce(
      (counts, student) => {
        const status = teacherRosterStatuses[student.id];
        if (status === 'present' || status === 'late' || status === 'absent') {
          counts[status] += 1;
        } else {
          counts.unmarked += 1;
        }

        return counts;
      },
      { present: 0, late: 0, absent: 0, unmarked: 0 },
    );
  }, [teacherRosterStatuses, visibleStudents]);

  const updateRosterStatus = (studentId: string, status: AttendanceStatus) => {
    setTeacherRosterStatuses((current) => ({
      ...current,
      [studentId]: status,
    }));
  };

  const markAllRoster = (status: AttendanceStatus) => {
    const nextStatuses = visibleStudents.reduce<Record<string, AttendanceStatus>>((next, student) => {
      next[student.id] = status;
      return next;
    }, {});

    setTeacherRosterStatuses(nextStatuses);
  };

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

  const bulkSaveMutation = useMutation({
    mutationFn: async () => {
      if (!schoolId || !selectedYearId) throw new Error('Missing school or academic year');

      const missingStatuses = visibleStudents.filter((student) => !teacherRosterStatuses[student.id]);
      if (missingStatuses.length > 0) {
        throw new Error('Please mark every learner before saving attendance');
      }

      const payload = visibleStudents.map((student) => ({
        student_id: student.id,
        school_id: schoolId,
        academic_year_id: selectedYearId,
        date: selectedDate,
        status: teacherRosterStatuses[student.id] as AttendanceStatus,
        time_in: null,
        time_out: null,
        remarks: null,
        recorded_by: user?.id ?? null,
      }));

      const { error } = await supabase
        .from('student_attendance')
        .upsert(payload, { onConflict: 'student_id,date,academic_year_id' });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance-management'] });
      toast.success(`Attendance saved for ${visibleStudents.length} learner${visibleStudents.length === 1 ? '' : 's'}`);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to save class attendance');
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
    if (!guardMutation()) return;
    if (!formData.student_id) {
      toast.error('Please select a learner');
      return;
    }
    saveMutation.mutate(formData);
  };

  const handleBulkSave = () => {
    if (!guardMutation()) return;
    if (visibleStudents.length === 0) {
      toast.error('No learners found for this class and date');
      return;
    }
    if (rosterStatusCounts.unmarked > 0) {
      toast.error(`Please mark ${rosterStatusCounts.unmarked} learner${rosterStatusCounts.unmarked === 1 ? '' : 's'} before saving`);
      return;
    }

    bulkSaveMutation.mutate();
  };

  return (
    <div className="space-y-6">
      <YearLockedBanner />
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
        {!isTeacher && (
          <Button onClick={() => setIsModalOpen(true)} disabled={isReadOnly}>
            <Plus className="h-4 w-4 mr-2" />
            Record Attendance
          </Button>
        )}
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
              <Label>{isTeacher ? 'Assigned Grade Level' : 'Grade Level'}</Label>
              <Select value={selectedLevel} onValueChange={setSelectedLevel}>
                <SelectTrigger>
                  <SelectValue placeholder={isTeacher ? 'All Assigned Levels' : 'All Levels'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{isTeacher ? 'All Assigned Levels' : 'All Levels'}</SelectItem>
                  {gradeLevelOptions.map((level) => (
                    <SelectItem key={level} value={level}>{level}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {isTeacher ? (
        <Card>
          <CardHeader className="space-y-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Daily Class Attendance
                </CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">
                  Mark each learner for {format(new Date(selectedDate), 'MMMM d, yyyy')}, then save the whole roster once.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => markAllRoster('present')}
                  disabled={isReadOnly || visibleStudents.length === 0}
                >
                  Mark All Present
                </Button>
                <Button
                  type="button"
                  onClick={handleBulkSave}
                  disabled={isReadOnly || visibleStudents.length === 0 || bulkSaveMutation.isPending}
                >
                  {bulkSaveMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Save Attendance
                </Button>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-4">
              <div className="rounded-xl border bg-green-50 p-3 text-green-700">
                <p className="text-xs font-medium uppercase tracking-wide">Present</p>
                <p className="text-2xl font-bold">{rosterStatusCounts.present}</p>
              </div>
              <div className="rounded-xl border bg-yellow-50 p-3 text-yellow-700">
                <p className="text-xs font-medium uppercase tracking-wide">Late</p>
                <p className="text-2xl font-bold">{rosterStatusCounts.late}</p>
              </div>
              <div className="rounded-xl border bg-red-50 p-3 text-red-700">
                <p className="text-xs font-medium uppercase tracking-wide">Absent</p>
                <p className="text-2xl font-bold">{rosterStatusCounts.absent}</p>
              </div>
              <div className="rounded-xl border bg-muted/50 p-3">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Unmarked</p>
                <p className="text-2xl font-bold">{rosterStatusCounts.unmarked}</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : visibleStudents.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No learners found for your assigned class in this academic year.</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Learner</TableHead>
                      <TableHead>LRN</TableHead>
                      <TableHead>Level</TableHead>
                      <TableHead>Section</TableHead>
                      <TableHead className="min-w-[320px] text-right">Attendance Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {visibleStudents.map((student) => (
                      <TableRow key={student.id}>
                        <TableCell className="font-medium">{student.student_name}</TableCell>
                        <TableCell className="text-muted-foreground">{student.lrn || '-'}</TableCell>
                        <TableCell>{student.level || '-'}</TableCell>
                        <TableCell>{student.section || '-'}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap justify-end gap-2">
                            {teacherAttendanceOptions.map((option) => {
                              const StatusIcon = option.icon;
                              const isActive = teacherRosterStatuses[student.id] === option.value;

                              return (
                                <Button
                                  key={option.value}
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  disabled={isReadOnly}
                                  onClick={() => updateRosterStatus(student.id, option.value)}
                                  className={isActive ? option.activeClass : ''}
                                >
                                  <StatusIcon className="h-4 w-4 mr-1.5" />
                                  {option.label}
                                </Button>
                              );
                            })}
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
      ) : (
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
          ) : visibleAttendance.length === 0 ? (
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
                  {visibleAttendance.map((record: any) => {
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
      )}

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
                  {visibleStudents.map((student: any) => (
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
