// Centralized hooks for Student Portal data fetching
// All hooks enforce school_id and academic_year_id segregation

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useMemo } from 'react';
import type {
  AttendanceRecord,
  AttendanceSummary,
  ClassSchedule,
  Assignment,
  AssignmentSubmission,
  ExamSchedule,
  Announcement,
} from '@/types/studentPortal';

// ============================================
// ATTENDANCE HOOKS
// ============================================

export const useStudentAttendance = (
  studentId: string | null,
  schoolId: string | null,
  academicYearId: string | null
) => {
  const query = useQuery({
    queryKey: ['student-attendance', studentId, schoolId, academicYearId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('student_attendance')
        .select('*')
        .eq('student_id', studentId!)
        .eq('school_id', schoolId!)
        .eq('academic_year_id', academicYearId!)
        .order('date', { ascending: false });

      if (error) throw error;
      return data as AttendanceRecord[];
    },
    enabled: !!studentId && !!schoolId && !!academicYearId,
  });

  // Compute attendance summary
  const summary = useMemo<AttendanceSummary | null>(() => {
    if (!query.data || query.data.length === 0) return null;

    const records = query.data;
    const total = records.length;
    const present = records.filter((r) => r.status === 'present').length;
    const absent = records.filter((r) => r.status === 'absent').length;
    const late = records.filter((r) => r.status === 'late').length;
    const excused = records.filter((r) => r.status === 'excused').length;
    const percentage = total > 0 ? ((present + late + excused) / total) * 100 : 0;

    return { total, present, absent, late, excused, percentage };
  }, [query.data]);

  return {
    ...query,
    summary,
  };
};

// ============================================
// SCHEDULE HOOKS
// ============================================

export const useStudentSchedule = (
  gradeLevel: string | null,
  schoolId: string | null,
  academicYearId: string | null
) => {
  const query = useQuery({
    queryKey: ['class-schedules', gradeLevel, schoolId, academicYearId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('class_schedules')
        .select(`
          *,
          subjects:subject_id(id, name, code),
          teachers:teacher_id(id, full_name)
        `)
        .eq('school_id', schoolId!)
        .eq('academic_year_id', academicYearId!)
        .eq('grade_level', gradeLevel!)
        .order('day_of_week', { ascending: true })
        .order('start_time', { ascending: true });

      if (error) throw error;
      return data as ClassSchedule[];
    },
    enabled: !!gradeLevel && !!schoolId && !!academicYearId,
  });

  // Group schedules by day
  const byDay = useMemo(() => {
    if (!query.data) return new Map<number, ClassSchedule[]>();

    const grouped = new Map<number, ClassSchedule[]>();
    for (let i = 0; i <= 6; i++) {
      grouped.set(i, []);
    }

    query.data.forEach((schedule) => {
      const daySchedules = grouped.get(schedule.day_of_week) || [];
      daySchedules.push(schedule);
      grouped.set(schedule.day_of_week, daySchedules);
    });

    return grouped;
  }, [query.data]);

  return {
    ...query,
    byDay,
  };
};

// ============================================
// ASSIGNMENTS HOOKS
// ============================================

export const useStudentAssignments = (
  studentId: string | null,
  gradeLevel: string | null,
  schoolId: string | null,
  academicYearId: string | null
) => {
  // Fetch assignments for the grade level
  const assignmentsQuery = useQuery({
    queryKey: ['student-assignments', gradeLevel, schoolId, academicYearId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('student_assignments')
        .select(`
          *,
          subjects:subject_id(id, name, code)
        `)
        .eq('school_id', schoolId!)
        .eq('academic_year_id', academicYearId!)
        .eq('grade_level', gradeLevel!)
        .order('due_date', { ascending: true });

      if (error) throw error;
      return data as Assignment[];
    },
    enabled: !!gradeLevel && !!schoolId && !!academicYearId,
  });

  // Fetch student's submissions
  const submissionsQuery = useQuery({
    queryKey: ['assignment-submissions', studentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('assignment_submissions')
        .select('*')
        .eq('student_id', studentId!);

      if (error) throw error;
      return data as AssignmentSubmission[];
    },
    enabled: !!studentId,
  });

  // Merge assignments with submissions and categorize
  const categorized = useMemo(() => {
    if (!assignmentsQuery.data) {
      return { pending: [], submitted: [], graded: [], overdue: [], all: [] };
    }

    const now = new Date();
    const submissionMap = new Map(
      (submissionsQuery.data || []).map((s) => [s.assignment_id, s])
    );

    const assignmentsWithSubmissions = assignmentsQuery.data.map((assignment) => ({
      ...assignment,
      submission: submissionMap.get(assignment.id),
    }));

    const pending: Assignment[] = [];
    const submitted: Assignment[] = [];
    const graded: Assignment[] = [];
    const overdue: Assignment[] = [];

    assignmentsWithSubmissions.forEach((assignment) => {
      const dueDate = new Date(assignment.due_date);
      const submission = assignment.submission;

      if (submission?.status === 'graded' || submission?.status === 'returned') {
        graded.push(assignment);
      } else if (submission?.status === 'submitted' || submission?.status === 'late') {
        submitted.push(assignment);
      } else if (dueDate < now && !submission) {
        overdue.push(assignment);
      } else {
        pending.push(assignment);
      }
    });

    return {
      pending,
      submitted,
      graded,
      overdue,
      all: assignmentsWithSubmissions,
    };
  }, [assignmentsQuery.data, submissionsQuery.data]);

  return {
    data: categorized.all,
    isLoading: assignmentsQuery.isLoading || submissionsQuery.isLoading,
    error: assignmentsQuery.error || submissionsQuery.error,
    ...categorized,
  };
};

// ============================================
// EXAM SCHEDULE HOOKS
// ============================================

export const useExamSchedule = (
  gradeLevel: string | null,
  schoolId: string | null,
  academicYearId: string | null
) => {
  const query = useQuery({
    queryKey: ['exam-schedules', gradeLevel, schoolId, academicYearId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('exam_schedules')
        .select(`
          *,
          subjects:subject_id(id, name, code)
        `)
        .eq('school_id', schoolId!)
        .eq('academic_year_id', academicYearId!)
        .eq('grade_level', gradeLevel!)
        .order('exam_date', { ascending: true });

      if (error) throw error;
      return data as ExamSchedule[];
    },
    enabled: !!gradeLevel && !!schoolId && !!academicYearId,
  });

  // Split into upcoming and past exams
  const categorized = useMemo(() => {
    if (!query.data) return { upcoming: [], past: [] };

    const today = new Date().toISOString().split('T')[0];
    const upcoming = query.data.filter((exam) => exam.exam_date >= today);
    const past = query.data.filter((exam) => exam.exam_date < today);

    return { upcoming, past };
  }, [query.data]);

  return {
    ...query,
    ...categorized,
  };
};

// ============================================
// ANNOUNCEMENTS HOOKS
// ============================================

export const useAnnouncements = (
  schoolId: string | null,
  gradeLevel: string | null
) => {
  const query = useQuery({
    queryKey: ['announcements', schoolId, gradeLevel],
    queryFn: async () => {
      const now = new Date().toISOString();
      
      let queryBuilder = supabase
        .from('announcements')
        .select('*')
        .or(`expires_at.is.null,expires_at.gt.${now}`)
        .order('is_pinned', { ascending: false })
        .order('published_at', { ascending: false });

      // Filter by school if provided
      if (schoolId) {
        queryBuilder = queryBuilder.or(`school_id.eq.${schoolId},school_id.is.null`);
      }

      const { data, error } = await queryBuilder;

      if (error) throw error;

      // Filter by grade level if applicable
      let filtered = data as Announcement[];
      if (gradeLevel) {
        filtered = filtered.filter((a) => {
          if (!a.target_grade_levels || a.target_grade_levels.length === 0) return true;
          return a.target_grade_levels.includes(gradeLevel);
        });
      }

      return filtered;
    },
    enabled: true, // Announcements can be viewed even without strict filtering
  });

  // Separate pinned from regular
  const categorized = useMemo(() => {
    if (!query.data) return { pinned: [], regular: [], count: 0 };

    const pinned = query.data.filter((a) => a.is_pinned);
    const regular = query.data.filter((a) => !a.is_pinned);

    return { pinned, regular, count: query.data.length };
  }, [query.data]);

  return {
    ...query,
    ...categorized,
  };
};

// ============================================
// COMBINED DASHBOARD STATS
// ============================================

export const useStudentDashboardStats = (
  studentId: string | null,
  gradeLevel: string | null,
  schoolId: string | null,
  academicYearId: string | null
) => {
  const attendance = useStudentAttendance(studentId, schoolId, academicYearId);
  const assignments = useStudentAssignments(studentId, gradeLevel, schoolId, academicYearId);
  const exams = useExamSchedule(gradeLevel, schoolId, academicYearId);
  const announcements = useAnnouncements(schoolId, gradeLevel);

  return {
    attendance,
    assignments,
    exams,
    announcements,
    isLoading:
      attendance.isLoading ||
      assignments.isLoading ||
      exams.isLoading ||
      announcements.isLoading,
  };
};
