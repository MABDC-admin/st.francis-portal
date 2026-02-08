import { 
  Users, FileText, GraduationCap, Calendar, Shield, 
  UserCheck, ClipboardList, AlertTriangle, BookOpen, 
  BarChart3, Clock, UserX, Briefcase, Database,
  LucideIcon
} from 'lucide-react';

export interface ReportSubType {
  id: string;
  label: string;
  description: string;
  icon: LucideIcon;
  requiredRoles: string[];
}

export interface ReportCategory {
  id: string;
  label: string;
  description: string;
  icon: LucideIcon;
  color: string;
  subTypes: ReportSubType[];
}

export interface ReportFiltersState {
  schoolYearId: string | null;
  quarter: number | null;
  gradeLevel: string | null;
  section: string | null;
  studentSearch: string;
  teacherId: string | null;
  dateFrom: string | null;
  dateTo: string | null;
  status: 'all' | 'active' | 'inactive';
}

export interface SavedTemplate {
  id: string;
  name: string;
  categoryId: string;
  subTypeId: string;
  filters: ReportFiltersState;
  createdAt: string;
}

export interface ReportData {
  columns: { key: string; label: string }[];
  rows: Record<string, any>[];
  totalCount: number;
  summary?: Record<string, any>;
}

export const GRADE_LEVELS = [
  'Kinder', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6',
  'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'
];

export const DEFAULT_FILTERS: ReportFiltersState = {
  schoolYearId: null,
  quarter: null,
  gradeLevel: null,
  section: null,
  studentSearch: '',
  teacherId: null,
  dateFrom: null,
  dateTo: null,
  status: 'all',
};

export const REPORT_CATEGORIES: ReportCategory[] = [
  {
    id: 'enrollment',
    label: 'Enrollment & Students',
    description: 'Student enrollment summaries, masterlists, and profiles',
    icon: Users,
    color: 'hsl(217 91% 60%)',
    subTypes: [
      { id: 'enrollment-summary', label: 'Enrollment Summary', description: 'By grade/section, new vs returning', icon: BarChart3, requiredRoles: ['admin', 'registrar'] },
      { id: 'student-masterlist', label: 'Student Masterlist', description: 'Filterable and exportable student list', icon: ClipboardList, requiredRoles: ['admin', 'registrar'] },
      { id: 'student-profile', label: 'Student Profile Report', description: 'Full profile with guardian info', icon: UserCheck, requiredRoles: ['admin', 'registrar'] },
      { id: 'drop-transfer', label: 'Drop/Transfer List', description: 'Students who dropped or transferred', icon: UserX, requiredRoles: ['admin', 'registrar'] },
    ],
  },
  {
    id: 'academic',
    label: 'Academic & Grades',
    description: 'Grade summaries, report cards, and at-risk learners',
    icon: GraduationCap,
    color: 'hsl(142 71% 45%)',
    subTypes: [
      { id: 'class-grade-summary', label: 'Class Grade Summary', description: 'Per subject, per section', icon: BarChart3, requiredRoles: ['admin', 'registrar', 'teacher'] },
      { id: 'student-report-card', label: 'Student Report Card', description: 'DepEd SF9-style report card', icon: FileText, requiredRoles: ['admin', 'registrar', 'teacher', 'student', 'parent'] },
      { id: 'at-risk-learners', label: 'At-Risk Learners', description: 'Grades below 75 threshold', icon: AlertTriangle, requiredRoles: ['admin', 'registrar', 'teacher'] },
    ],
  },
  {
    id: 'attendance',
    label: 'Attendance',
    description: 'Daily summaries, student detail, and leaderboards',
    icon: Calendar,
    color: 'hsl(38 92% 50%)',
    subTypes: [
      { id: 'daily-attendance', label: 'Daily Attendance Summary', description: 'Per section daily breakdown', icon: Calendar, requiredRoles: ['admin', 'registrar', 'teacher'] },
      { id: 'student-attendance-detail', label: 'Student Attendance Detail', description: 'Individual student date range', icon: Clock, requiredRoles: ['admin', 'registrar', 'teacher', 'student', 'parent'] },
      { id: 'tardiness-leaderboard', label: 'Tardiness/Absences Leaderboard', description: 'Top absent/tardy students', icon: AlertTriangle, requiredRoles: ['admin', 'registrar', 'teacher'] },
    ],
  },
  {
    id: 'teacher',
    label: 'Teacher & Class',
    description: 'Teacher loads, class lists, and schedules',
    icon: Briefcase,
    color: 'hsl(271 91% 65%)',
    subTypes: [
      { id: 'teacher-load', label: 'Teacher Load Report', description: 'Subjects and sections per teacher', icon: Briefcase, requiredRoles: ['admin', 'registrar'] },
      { id: 'class-list', label: 'Class List per Teacher', description: 'Students in each teacher\'s class', icon: ClipboardList, requiredRoles: ['admin', 'registrar', 'teacher'] },
    ],
  },
  {
    id: 'system',
    label: 'System & Compliance',
    description: 'Data quality, completeness, and audit logs',
    icon: Shield,
    color: 'hsl(0 84% 60%)',
    subTypes: [
      { id: 'data-completeness', label: 'Data Completeness Report', description: 'Missing student info and grades', icon: Database, requiredRoles: ['admin', 'registrar'] },
      { id: 'export-audit-log', label: 'Export Audit Log', description: 'Who exported what and when', icon: Shield, requiredRoles: ['admin'] },
    ],
  },
];
