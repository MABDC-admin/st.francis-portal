// TypeScript interfaces for Student Portal
// Matches the database schema created for Phase 1

export interface AttendanceRecord {
  id: string;
  student_id: string;
  school_id: string;
  academic_year_id: string;
  date: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  time_in?: string;
  time_out?: string;
  remarks?: string;
  recorded_by?: string;
  created_at: string;
  updated_at: string;
}

export interface AttendanceSummary {
  total: number;
  present: number;
  absent: number;
  late: number;
  excused: number;
  percentage: number;
}

export interface ClassSchedule {
  id: string;
  school_id: string;
  academic_year_id: string;
  subject_id: string;
  grade_level: string;
  section?: string;
  day_of_week: number; // 0 = Sunday, 6 = Saturday
  start_time: string;
  end_time: string;
  room?: string;
  teacher_id?: string;
  created_at: string;
  updated_at: string;
  // Joined data
  subjects?: {
    id: string;
    name: string;
    code: string;
  };
  teachers?: {
    id: string;
    full_name: string;
  };
}

export interface Assignment {
  id: string;
  school_id: string;
  academic_year_id: string;
  subject_id: string;
  grade_level: string;
  title: string;
  description?: string;
  instructions?: string;
  due_date: string;
  max_score?: number;
  assignment_type: 'homework' | 'project' | 'quiz' | 'essay' | 'other';
  attachments?: Record<string, unknown>;
  created_by?: string;
  created_at: string;
  updated_at: string;
  // Joined data
  subjects?: {
    id: string;
    name: string;
    code: string;
  };
  // Computed
  submission?: AssignmentSubmission;
}

export interface AssignmentSubmission {
  id: string;
  assignment_id: string;
  student_id: string;
  submitted_at?: string;
  score?: number;
  feedback?: string;
  status: 'pending' | 'submitted' | 'late' | 'graded' | 'returned';
  attachments?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface ExamSchedule {
  id: string;
  school_id: string;
  academic_year_id: string;
  subject_id: string;
  grade_level: string;
  exam_type: 'quarterly' | 'midterm' | 'final' | 'quiz' | 'special';
  exam_date: string;
  start_time?: string;
  end_time?: string;
  room?: string;
  quarter?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
  // Joined data
  subjects?: {
    id: string;
    name: string;
    code: string;
  };
}

export interface Announcement {
  id: string;
  school_id?: string;
  academic_year_id?: string;
  title: string;
  content: string;
  target_audience: string[];
  target_grade_levels?: string[];
  priority: 'low' | 'normal' | 'high' | 'urgent';
  is_pinned: boolean;
  published_at: string;
  expires_at?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

// Day mapping for schedules
export const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
export const WEEKDAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

// Priority colors for announcements
export const PRIORITY_COLORS: Record<Announcement['priority'], { bg: string; text: string; border: string }> = {
  low: { bg: 'bg-muted/50', text: 'text-muted-foreground', border: 'border-muted' },
  normal: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  high: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  urgent: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
};

// Exam type badges
export const EXAM_TYPE_COLORS: Record<ExamSchedule['exam_type'], { bg: string; text: string }> = {
  quarterly: { bg: 'bg-purple-100', text: 'text-purple-700' },
  midterm: { bg: 'bg-blue-100', text: 'text-blue-700' },
  final: { bg: 'bg-red-100', text: 'text-red-700' },
  quiz: { bg: 'bg-green-100', text: 'text-green-700' },
  special: { bg: 'bg-amber-100', text: 'text-amber-700' },
};

// Assignment type badges
export const ASSIGNMENT_TYPE_COLORS: Record<Assignment['assignment_type'], { bg: string; text: string }> = {
  homework: { bg: 'bg-blue-100', text: 'text-blue-700' },
  project: { bg: 'bg-purple-100', text: 'text-purple-700' },
  quiz: { bg: 'bg-green-100', text: 'text-green-700' },
  essay: { bg: 'bg-amber-100', text: 'text-amber-700' },
  other: { bg: 'bg-gray-100', text: 'text-gray-700' },
};

// Attendance status colors
export const ATTENDANCE_STATUS_COLORS: Record<AttendanceRecord['status'], { bg: string; text: string; dot: string }> = {
  present: { bg: 'bg-green-100', text: 'text-green-700', dot: 'bg-green-500' },
  absent: { bg: 'bg-red-100', text: 'text-red-700', dot: 'bg-red-500' },
  late: { bg: 'bg-amber-100', text: 'text-amber-700', dot: 'bg-amber-500' },
  excused: { bg: 'bg-blue-100', text: 'text-blue-700', dot: 'bg-blue-500' },
};
