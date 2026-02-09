import { ReactNode, useState, useEffect } from 'react';
import { motion, Reorder } from 'framer-motion';
import {
  Menu,
  Moon,
  Sun,
  Search,
  ChevronDown,
  LogOut,
  ShieldAlert,
  GraduationCap,
  Building2,
  CalendarDays,
  GripVertical,
  UserCircle,
  Users,
  BookOpen,
  FileSpreadsheet,
  Library,
  FileText,
  Upload,
  ChevronLeft,
  ChevronRight,
  LucideIcon,
  Home,
  BarChart3,
  Calendar,
  Lock,
  Unlock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/hooks/useTheme';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useSchool, SCHOOL_THEMES, SchoolType } from '@/contexts/SchoolContext';
import { useAcademicYear } from '@/contexts/AcademicYearContext';
import { useDashboardLayout } from '@/contexts/DashboardLayoutContext';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useSchoolSettings } from '@/hooks/useSchoolSettings';
import { useColorTheme } from '@/hooks/useColorTheme';
import { ColorThemeSelector } from '@/components/ColorThemeSelector';
import { Skeleton } from '@/components/ui/skeleton';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { StudentBottomNav } from './StudentBottomNav';
import {
  HomeIcon3D,
  StudentIcon3D,
  TeacherIcon3D,
  EnterGradeIcon3D,
  SubjectsIcon3D,
  ScheduleIcon3D,
  EventsIcon3D,
  EnrollmentIcon3D,
  ReportsIcon3D,
  ImportIcon3D,
  AdminIcon3D,
  ProfileIcon3D,
  LibraryIcon3D,
  CanvaIcon3D,
  NotebookIcon3D
} from '@/components/icons/ThreeDIcons';
import {
  AppleHomeIcon,
  AppleStudentIcon,
  AppleTeacherIcon,
  AppleGradesIcon,
  AppleSubjectsIcon,
  AppleScheduleIcon,
  AppleEventsIcon,
  AppleEnrollmentIcon,
  AppleReportsIcon,
  AppleImportIcon,
  AppleAdminIcon,
  AppleProfileIcon,
  AppleLibraryIcon,
  AppleCanvaIcon,
  AppleNotebookIcon
} from '@/components/icons/AppleStyleIcons';

interface NavItem {
  id: string;
  icon: any;
  label: string;
}

interface NavGroup {
  id: string;
  icon: any;
  label: string;
  items?: NavItem[];
  isCollapsible?: boolean;
}

interface DashboardLayoutProps {
  children: ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

// Icon mapping for 3D icons
const icon3DMap: Record<string, any> = {
  portal: HomeIcon3D,
  dashboard: HomeIcon3D,
  students: StudentIcon3D,
  teachers: TeacherIcon3D,
  grades: EnterGradeIcon3D,
  subjects: SubjectsIcon3D,
  'academic-years': ScheduleIcon3D,
  events: EventsIcon3D,
  'subject-enrollment': EnrollmentIcon3D,
  library: LibraryIcon3D,
  canva: CanvaIcon3D,
  notebook: NotebookIcon3D,
  reports: ReportsIcon3D,
  enrollment: EnrollmentIcon3D,
  import: ImportIcon3D,
  profile: ProfileIcon3D,
  classes: TeacherIcon3D,
  children: StudentIcon3D,
  admin: AdminIcon3D,
  lis: StudentIcon3D,
  'student-records': StudentIcon3D,
  academics: EnterGradeIcon3D,
  'school-management': TeacherIcon3D,
  resources: LibraryIcon3D,
  'my-records': ProfileIcon3D,
  'attendance-mgmt': ScheduleIcon3D,
  'schedule-mgmt': ScheduleIcon3D,
  'assignment-mgmt': ReportsIcon3D,
  'exam-mgmt': ReportsIcon3D,
  'announcement-mgmt': EventsIcon3D,
  'student-schedule': ScheduleIcon3D,
  'student-attendance': ScheduleIcon3D,
  'student-assignments': ReportsIcon3D,
  'student-exams': ReportsIcon3D,
  'student-announcements': EventsIcon3D,
  'student-grades': EnterGradeIcon3D,
  'student-subjects': SubjectsIcon3D,
  'student-profile': ProfileIcon3D,
  'messages': EventsIcon3D,
  'zoom': TeacherIcon3D,
  'nocodb': ImportIcon3D,
  'onlyoffice': ReportsIcon3D,
  'excalidraw': CanvaIcon3D,
  'omada': TeacherIcon3D,
  'tacticalrmm': AdminIcon3D,
  'documize': LibraryIcon3D,
  'integrations': AdminIcon3D,
  'ai-chat': NotebookIcon3D,
  'impersonate': AdminIcon3D,
  'teacher-import': ImportIcon3D,
  'teacher-profile': ProfileIcon3D,
  'teacher-grades': EnterGradeIcon3D,
  'teacher-schedule': ScheduleIcon3D,
  'my-info': ProfileIcon3D,
};

// Icon mapping for Apple style icons
const iconAppleMap: Record<string, any> = {
  portal: AppleHomeIcon,
  dashboard: AppleHomeIcon,
  students: AppleStudentIcon,
  teachers: AppleTeacherIcon,
  grades: AppleGradesIcon,
  subjects: AppleSubjectsIcon,
  'academic-years': AppleScheduleIcon,
  events: AppleEventsIcon,
  'subject-enrollment': AppleEnrollmentIcon,
  library: AppleLibraryIcon,
  canva: AppleCanvaIcon,
  notebook: AppleNotebookIcon,
  reports: AppleReportsIcon,
  enrollment: AppleEnrollmentIcon,
  import: AppleImportIcon,
  profile: AppleProfileIcon,
  classes: AppleTeacherIcon,
  children: AppleStudentIcon,
  admin: AppleAdminIcon,
  lis: AppleStudentIcon,
  'student-records': AppleStudentIcon,
  academics: AppleGradesIcon,
  'school-management': AppleTeacherIcon,
  resources: AppleLibraryIcon,
  'my-records': AppleProfileIcon,
  'attendance-mgmt': AppleScheduleIcon,
  'schedule-mgmt': AppleScheduleIcon,
  'assignment-mgmt': AppleReportsIcon,
  'exam-mgmt': AppleReportsIcon,
  'announcement-mgmt': AppleEventsIcon,
  'student-schedule': AppleScheduleIcon,
  'student-attendance': AppleScheduleIcon,
  'student-assignments': AppleReportsIcon,
  'student-exams': AppleReportsIcon,
  'student-announcements': AppleEventsIcon,
  'student-grades': AppleGradesIcon,
  'student-subjects': AppleSubjectsIcon,
  'student-profile': AppleProfileIcon,
  'messages': AppleEventsIcon,
  'zoom': AppleTeacherIcon,
  'nocodb': AppleImportIcon,
  'onlyoffice': AppleReportsIcon,
  'excalidraw': AppleCanvaIcon,
  'omada': AppleTeacherIcon,
  'tacticalrmm': AppleAdminIcon,
  'documize': AppleLibraryIcon,
  'integrations': AppleAdminIcon,
  'ai-chat': AppleNotebookIcon,
  'impersonate': AppleAdminIcon,
  'teacher-import': AppleImportIcon,
  'teacher-profile': AppleProfileIcon,
  'teacher-grades': AppleGradesIcon,
  'teacher-schedule': AppleScheduleIcon,
  'my-info': AppleProfileIcon,
};

// Hierarchical navigation structure for each role
const getNavGroupsForRole = (role: string | null): NavGroup[] => {
  switch (role) {
    case 'admin':
      return [
        { id: 'portal', icon: HomeIcon3D, label: 'Portal Home' },
        {
          id: 'student-records',
          icon: StudentIcon3D,
          label: 'Learner Records',
          isCollapsible: true,
          items: [
            { id: 'students', icon: StudentIcon3D, label: 'Learners' },
            { id: 'lis', icon: StudentIcon3D, label: 'LIS' },
            { id: 'enrollment', icon: EnrollmentIcon3D, label: 'New Learner' },
            { id: 'import', icon: ImportIcon3D, label: 'Import CSV' },
            { id: 'attendance-mgmt', icon: ScheduleIcon3D, label: 'Attendance' },
          ]
        },
        {
          id: 'academics',
          icon: EnterGradeIcon3D,
          label: 'Academics',
          isCollapsible: true,
          items: [
            { id: 'grades', icon: EnterGradeIcon3D, label: 'Grades' },
            { id: 'subjects', icon: SubjectsIcon3D, label: 'Subjects' },
            { id: 'subject-enrollment', icon: EnrollmentIcon3D, label: 'Subject Enrollment' },
            { id: 'schedule-mgmt', icon: ScheduleIcon3D, label: 'Schedules' },
            { id: 'assignment-mgmt', icon: ReportsIcon3D, label: 'Assignments' },
            { id: 'exam-mgmt', icon: ReportsIcon3D, label: 'Exams' },
          ]
        },
        {
          id: 'school-management',
          icon: TeacherIcon3D,
          label: 'School Management',
          isCollapsible: true,
          items: [
            { id: 'teachers', icon: TeacherIcon3D, label: 'Teachers' },
            { id: 'teacher-import', icon: ImportIcon3D, label: 'Teacher Import' },
            { id: 'messages', icon: EventsIcon3D, label: 'Messages' },
            { id: 'zoom', icon: TeacherIcon3D, label: 'Virtual Classes' },
            { id: 'events', icon: EventsIcon3D, label: 'Events' },
            { id: 'announcement-mgmt', icon: EventsIcon3D, label: 'Announcements' },
            { id: 'academic-years', icon: ScheduleIcon3D, label: 'Academic Years' },
          ]
        },
        {
          id: 'resources',
          icon: LibraryIcon3D,
          label: 'Resources',
          isCollapsible: true,
          items: [
            { id: 'library', icon: LibraryIcon3D, label: 'Library' },
            { id: 'canva', icon: CanvaIcon3D, label: 'Canva Studio' },
            { id: 'notebook', icon: NotebookIcon3D, label: 'Notebook LLM' },
            { id: 'ai-chat', icon: NotebookIcon3D, label: 'AI Chat' },
          ]
        },
        { id: 'reports', icon: ReportsIcon3D, label: 'Reports' },
        {
          id: 'integrations',
          icon: AdminIcon3D,
          label: 'Integrations',
          isCollapsible: true,
          items: [
            { id: 'nocodb', icon: ImportIcon3D, label: 'NocoDB' },
            { id: 'onlyoffice', icon: ReportsIcon3D, label: 'Google Docs' },
            { id: 'excalidraw', icon: CanvaIcon3D, label: 'Excalidraw' },
            { id: 'omada', icon: TeacherIcon3D, label: 'Omada' },
            { id: 'tacticalrmm', icon: AdminIcon3D, label: 'Tactical RMM' },
            { id: 'documize', icon: LibraryIcon3D, label: 'Documize' },
          ]
        },
        { id: 'impersonate', icon: AdminIcon3D, label: 'Impersonate' },
      ];
    case 'registrar':
      return [
        { id: 'portal', icon: HomeIcon3D, label: 'Portal Home' },
        {
          id: 'student-records',
          icon: StudentIcon3D,
          label: 'Learner Records',
          isCollapsible: true,
          items: [
            { id: 'students', icon: StudentIcon3D, label: 'Learners' },
            { id: 'lis', icon: StudentIcon3D, label: 'LIS' },
            { id: 'enrollment', icon: EnrollmentIcon3D, label: 'New Learner' },
            { id: 'import', icon: ImportIcon3D, label: 'Import CSV' },
            { id: 'attendance-mgmt', icon: ScheduleIcon3D, label: 'Attendance' },
          ]
        },
        {
          id: 'academics',
          icon: EnterGradeIcon3D,
          label: 'Academics',
          isCollapsible: true,
          items: [
            { id: 'grades', icon: EnterGradeIcon3D, label: 'Grades' },
            { id: 'subjects', icon: SubjectsIcon3D, label: 'Subjects' },
            { id: 'subject-enrollment', icon: EnrollmentIcon3D, label: 'Subject Enrollment' },
            { id: 'schedule-mgmt', icon: ScheduleIcon3D, label: 'Schedules' },
            { id: 'assignment-mgmt', icon: ReportsIcon3D, label: 'Assignments' },
            { id: 'exam-mgmt', icon: ReportsIcon3D, label: 'Exams' },
          ]
        },
        {
          id: 'school-management',
          icon: TeacherIcon3D,
          label: 'School Management',
          isCollapsible: true,
          items: [
            { id: 'teachers', icon: TeacherIcon3D, label: 'Teachers' },
            { id: 'teacher-import', icon: ImportIcon3D, label: 'Teacher Import' },
            { id: 'messages', icon: EventsIcon3D, label: 'Messages' },
            { id: 'zoom', icon: TeacherIcon3D, label: 'Virtual Classes' },
            { id: 'events', icon: EventsIcon3D, label: 'Events' },
            { id: 'announcement-mgmt', icon: EventsIcon3D, label: 'Announcements' },
          ]
        },
        {
          id: 'resources',
          icon: LibraryIcon3D,
          label: 'Resources',
          isCollapsible: true,
          items: [
            { id: 'library', icon: LibraryIcon3D, label: 'Library' },
            { id: 'ai-chat', icon: NotebookIcon3D, label: 'AI Chat' },
          ]
        },
        { id: 'reports', icon: ReportsIcon3D, label: 'Reports' },
        { id: 'impersonate', icon: AdminIcon3D, label: 'Impersonate' },
      ];
    case 'teacher':
      return [
        { id: 'portal', icon: HomeIcon3D, label: 'Portal Home' },
        {
          id: 'my-info',
          icon: ProfileIcon3D,
          label: 'My Info',
          isCollapsible: true,
          items: [
            { id: 'teacher-profile', icon: ProfileIcon3D, label: 'Profile' },
          ]
        },
        {
          id: 'academics',
          icon: EnterGradeIcon3D,
          label: 'Academics',
          isCollapsible: true,
          items: [
            { id: 'grades', icon: EnterGradeIcon3D, label: 'Grades' },
            { id: 'attendance-mgmt', icon: ScheduleIcon3D, label: 'Attendance' },
            { id: 'schedule-mgmt', icon: ScheduleIcon3D, label: 'Schedules' },
            { id: 'assignment-mgmt', icon: ReportsIcon3D, label: 'Assignments' },
            { id: 'exam-mgmt', icon: ReportsIcon3D, label: 'Exams' },
          ]
        },
        { id: 'messages', icon: EventsIcon3D, label: 'Messages' },
        { id: 'zoom', icon: TeacherIcon3D, label: 'Virtual Classes' },
        {
          id: 'resources',
          icon: LibraryIcon3D,
          label: 'Resources',
          isCollapsible: true,
          items: [
            { id: 'library', icon: LibraryIcon3D, label: 'Library' },
            { id: 'canva', icon: CanvaIcon3D, label: 'Canva Studio' },
            { id: 'notebook', icon: NotebookIcon3D, label: 'Notebook LLM' },
            { id: 'ai-chat', icon: NotebookIcon3D, label: 'AI Chat' },
          ]
        },
        { id: 'reports', icon: ReportsIcon3D, label: 'Reports' },
        { id: 'impersonate', icon: AdminIcon3D, label: 'Impersonate' },
      ];
    case 'student':
      return [
        { id: 'portal', icon: HomeIcon3D, label: 'Dashboard' },
        {
          id: 'my-records',
          icon: ProfileIcon3D,
          label: 'My Records',
          isCollapsible: true,
          items: [
            { id: 'student-profile', icon: ProfileIcon3D, label: 'Profile' },
            { id: 'student-grades', icon: EnterGradeIcon3D, label: 'Grades' },
            { id: 'student-subjects', icon: SubjectsIcon3D, label: 'Subjects' },
            { id: 'student-attendance', icon: ScheduleIcon3D, label: 'Attendance' },
          ]
        },
        {
          id: 'academics',
          icon: EnterGradeIcon3D,
          label: 'Academics',
          isCollapsible: true,
          items: [
            { id: 'student-schedule', icon: ScheduleIcon3D, label: 'Schedule' },
            { id: 'student-assignments', icon: ReportsIcon3D, label: 'Assignments' },
            { id: 'student-exams', icon: ReportsIcon3D, label: 'Exams' },
          ]
        },
        { id: 'library', icon: LibraryIcon3D, label: 'Library' },
        { id: 'student-announcements', icon: EventsIcon3D, label: 'Announcements' },
        { id: 'impersonate', icon: AdminIcon3D, label: 'Impersonate' },
      ];
    case 'parent':
      return [
        { id: 'portal', icon: HomeIcon3D, label: 'Portal Home' },
        { id: 'children', icon: StudentIcon3D, label: 'My Children' },
        { id: 'library', icon: LibraryIcon3D, label: 'Library' },
        { id: 'impersonate', icon: AdminIcon3D, label: 'Impersonate' },
      ];
    default:
      return [
        { id: 'portal', icon: HomeIcon3D, label: 'Portal Home' },
      ];
  }
};

// Helper to get the correct icon based on theme
const getIconForItem = (itemId: string, isApple: boolean) => {
  return isApple ? (iconAppleMap[itemId] || iconAppleMap.portal) : (icon3DMap[itemId] || icon3DMap.portal);
};

const adminItem = { id: 'admin', icon: AdminIcon3D, label: 'Admin' };

const roleColors: Record<string, string> = {
  admin: 'bg-red-500',
  registrar: 'bg-blue-500',
  teacher: 'bg-green-500',
  student: 'bg-purple-500',
  parent: 'bg-orange-500',
};

const roleLabels: Record<string, string> = {
  admin: 'Administrator',
  registrar: 'Registrar',
  teacher: 'Teacher',
  student: 'Learner',
  parent: 'Parent',
};

// Check if any item in a group is active
const isGroupActive = (group: NavGroup, activeTab: string): boolean => {
  if (group.id === activeTab) return true;
  if (group.items) {
    return group.items.some(item => item.id === activeTab);
  }
  return false;
};

export const DashboardLayout = ({ children, activeTab, onTabChange }: DashboardLayoutProps) => {
  const { isDark, toggle } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { user, role, signOut } = useAuth();
  const [isDragging, setIsDragging] = useState(false);
  const [isMenuLocked, setIsMenuLocked] = useState(true);
  const { selectedSchool, setSelectedSchool, schoolTheme, setCanSwitchSchool } = useSchool();
  const { academicYears, selectedYearId, selectedYear, setSelectedYearId, isLoading: isLoadingYears } = useAcademicYear();
  const { data: schoolSettings } = useSchoolSettings(selectedSchool);
  const { theme, currentTheme, selectTheme } = useColorTheme();
  const { layoutStyle } = useDashboardLayout();

  // Track open groups
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  // Check if Apple theme is active
  const isAppleTheme = layoutStyle === 'apple';

  // Admin and Registrar can switch schools
  const canSwitch = role === 'admin' || role === 'registrar';

  useEffect(() => {
    setCanSwitchSchool(canSwitch);
  }, [canSwitch, setCanSwitchSchool]);

  // Use school theme when no custom theme is set
  const hasCustomTheme = currentTheme !== 'default';
  const effectiveTheme = hasCustomTheme ? theme : schoolTheme;

  const navGroups = getNavGroupsForRole(role);

  // Initialize open groups based on active tab
  useEffect(() => {
    const newOpenGroups: Record<string, boolean> = {};
    navGroups.forEach(group => {
      if (group.isCollapsible && isGroupActive(group, activeTab)) {
        newOpenGroups[group.id] = true;
      }
    });
    setOpenGroups(prev => ({ ...prev, ...newOpenGroups }));
  }, [activeTab, role]);

  const toggleSidebar = () => setIsCollapsed(!isCollapsed);

  const toggleGroup = (groupId: string) => {
    setOpenGroups(prev => ({ ...prev, [groupId]: !prev[groupId] }));
  };

  const getInitials = (email: string) => {
    return email.substring(0, 2).toUpperCase();
  };

  const navVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        type: "spring" as const,
        stiffness: 300,
        damping: 30
      }
    }
  };

  // Render a single nav item (for both standalone and grouped items)
  const renderNavItem = (item: NavItem, isNested: boolean = false) => {
    const IconComponent = getIconForItem(item.id, isAppleTheme);
    const isActive = activeTab === item.id;

    return (
      <motion.button
        key={item.id}
        variants={itemVariants}
        whileHover={isAppleTheme ? { scale: 1.01 } : { x: isNested ? 3 : 5, scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => {
          onTabChange(item.id);
          setSidebarOpen(false);
        }}
        className={cn(
          "w-full flex items-center gap-3 font-medium transition-all duration-200 relative overflow-hidden",
          isNested ? "px-3 py-2 text-sm" : "px-3 py-2.5",
          isAppleTheme
            ? cn(
                "rounded-xl",
                isActive
                  ? "bg-[#007AFF] text-white shadow-sm"
                  : "text-gray-700 hover:bg-black/5"
              )
            : cn(
                "rounded-lg",
                isActive
                  ? `${effectiveTheme.menuActiveBg} ${effectiveTheme.menuActiveText} shadow-md`
                  : `text-inherit/80 ${effectiveTheme.menuHoverBg} hover:bg-yellow-400/20 hover:text-yellow-700 dark:hover:text-yellow-300 transition-colors`
              ),
          isCollapsed && "justify-center px-2"
        )}
        title={isCollapsed ? item.label : undefined}
      >
        {isActive && !isAppleTheme && (
          <motion.div
            layoutId="activeTabBackground"
            className="absolute inset-0 bg-white/20 dark:bg-black/20"
            initial={false}
            transition={{ type: "spring", stiffness: 350, damping: 30 }}
          />
        )}
        <IconComponent className={cn(
          isNested ? "h-4 w-4" : "h-5 w-5",
          "flex-shrink-0 z-10",
          isAppleTheme && !isActive && "text-gray-500"
        )} />
        {!isCollapsed && <span className={cn("truncate z-10", isAppleTheme && "text-[13px]")}>{item.label}</span>}
      </motion.button>
    );
  };

  // Render a collapsible group
  const renderNavGroup = (group: NavGroup) => {
    if (!group.isCollapsible || !group.items) {
      return renderNavItem({ id: group.id, icon: group.icon, label: group.label });
    }

    const IconComponent = getIconForItem(group.id, isAppleTheme);
    const isOpen = openGroups[group.id] || false;
    const hasActiveChild = group.items.some(item => item.id === activeTab);

    if (isCollapsed) {
      // In collapsed mode, show first item of group or expand on hover
      return (
        <div key={group.id} className="relative group">
          <motion.button
            variants={itemVariants}
            className={cn(
              "w-full flex items-center justify-center px-2 py-2.5 rounded-lg transition-all duration-200",
              hasActiveChild
                ? isAppleTheme
                  ? "bg-[#007AFF] text-white"
                  : `${effectiveTheme.menuActiveBg} ${effectiveTheme.menuActiveText}`
                : "text-inherit/80 hover:bg-white/10"
            )}
            title={group.label}
          >
            <IconComponent className="h-5 w-5" />
          </motion.button>
        </div>
      );
    }

    return (
      <Collapsible
        key={group.id}
        open={isOpen}
        onOpenChange={() => toggleGroup(group.id)}
      >
        <CollapsibleTrigger asChild>
          <motion.button
            variants={itemVariants}
            whileHover={isAppleTheme ? { scale: 1.01 } : { x: 3 }}
            className={cn(
              "w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all duration-200",
              isAppleTheme
                ? cn(
                    hasActiveChild ? "bg-black/5" : "hover:bg-black/5",
                    "text-gray-700"
                  )
                : cn(
                    hasActiveChild ? "bg-white/10" : "hover:bg-white/10",
                    "text-inherit/80"
                  )
            )}
          >
            <div className="flex items-center gap-3">
              <IconComponent className={cn(
                "h-5 w-5 flex-shrink-0",
                isAppleTheme && "text-gray-500"
              )} />
              <span className={cn("font-medium", isAppleTheme && "text-[13px]")}>{group.label}</span>
            </div>
            <ChevronDown className={cn(
              "h-4 w-4 transition-transform duration-200",
              isOpen && "rotate-180"
            )} />
          </motion.button>
        </CollapsibleTrigger>
        <CollapsibleContent className="overflow-hidden data-[state=open]:animate-none data-[state=closed]:animate-none">
          <div className="ml-4 pl-2 border-l border-white/20 space-y-0.5 mt-1">
            {group.items.map(item => renderNavItem(item, true))}
          </div>
        </CollapsibleContent>
      </Collapsible>
    );
  };

  return (
    <div className={cn(
      "min-h-screen bg-background theme-transition",
      currentTheme === 'pastel'
        ? "bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-green-100 via-stone-50 to-orange-50 dark:from-green-900/20 dark:via-stone-900 dark:to-orange-900/20"
        : effectiveTheme.pageBg
    )}>
      {/* Mobile Header */}
      <header className={cn(
        "lg:hidden fixed top-0 left-0 right-0 z-50 border-b border-border px-4 py-3 flex items-center justify-between theme-transition",
        `bg-gradient-to-r ${effectiveTheme.sidebarBg} ${effectiveTheme.sidebarText}`
      )}>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-label="Toggle menu"
          className="text-inherit hover:bg-white/10"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg overflow-hidden bg-white flex items-center justify-center">
            {schoolSettings?.logo_url ? (
              <img src={schoolSettings.logo_url} alt="Logo" className="w-full h-full object-contain" />
            ) : (
              <div className={cn("w-full h-full flex items-center justify-center bg-gradient-to-br", effectiveTheme.sidebarBg)}>
                <GraduationCap className="h-5 w-5 text-white" />
              </div>
            )}
          </div>
          <span className="font-bold text-inherit">
            {schoolSettings?.acronym || selectedSchool}
          </span>
          {canSwitch && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 px-2 text-inherit hover:bg-white/10">
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Switch School</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setSelectedSchool('MABDC')}>
                  <Building2 className="h-4 w-4 mr-2 text-emerald-500" />
                  MABDC
                  {selectedSchool === 'MABDC' && <span className="ml-auto">✓</span>}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSelectedSchool('STFXSA')}>
                  <Building2 className="h-4 w-4 mr-2 text-blue-500" />
                  STFXSA
                  {selectedSchool === 'STFXSA' && <span className="ml-auto">✓</span>}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </header>

      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-foreground/20 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed left-0 top-0 z-50 h-full border-r transform transition-all duration-300 flex flex-col theme-transition",
        sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        isCollapsed ? "w-[70px]" : "w-64",
        isAppleTheme
          ? "apple-sidebar border-r-black/5 text-gray-800"
          : currentTheme === 'pastel'
            ? "bg-white/40 dark:bg-black/20 backdrop-blur-md border-r-white/20 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)]"
            : currentTheme !== 'default'
              ? `bg-gradient-to-b ${effectiveTheme.sidebarBg} ${effectiveTheme.sidebarText} border-border`
              : "bg-gradient-to-b from-success to-success/90 text-white border-border"
      )}>
        <div className={cn("p-4 flex items-center justify-between", isCollapsed && "justify-center")}>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={cn("flex items-center gap-3", isCollapsed && "hidden")}
          >
            <div className="w-8 h-8 rounded-lg shadow-sm overflow-hidden bg-white flex items-center justify-center flex-shrink-0">
              {schoolSettings?.logo_url ? (
                <img src={schoolSettings.logo_url} alt="Logo" className="w-full h-full object-contain p-0.5" />
              ) : (
                <div className={cn("w-full h-full flex items-center justify-center bg-gradient-to-br", effectiveTheme.sidebarBg)}>
                  <GraduationCap className="h-4 w-4 text-white" />
                </div>
              )}
            </div>
            <h1 className="font-bold text-sm truncate text-inherit">
              {schoolSettings?.acronym || selectedSchool}
            </h1>
          </motion.div>

          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="hidden lg:flex h-6 w-6 text-inherit/50 hover:text-inherit hover:bg-black/5 dark:hover:bg-white/10"
          >
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>

        {/* School Switcher for Admin/Registrar */}
        {canSwitch && !isCollapsed && (
          <div className="px-3 mt-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-between text-inherit hover:bg-white/10 border border-white/20"
                >
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    <span className="text-sm">{selectedSchool === 'MABDC' ? 'M.A Brain Dev Center' : 'St. Francis Xavier'}</span>
                  </div>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-[200px]">
                <DropdownMenuLabel>Switch School Portal</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setSelectedSchool('MABDC')}
                  className={selectedSchool === 'MABDC' ? 'bg-emerald-50 dark:bg-emerald-950' : ''}
                >
                  <div className="flex items-center gap-2 flex-1">
                    <div className="w-3 h-3 rounded-full bg-emerald-500" />
                    <span>M.A Brain Development Center</span>
                  </div>
                  {selectedSchool === 'MABDC' && <span className="text-emerald-500">✓</span>}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setSelectedSchool('STFXSA')}
                  className={selectedSchool === 'STFXSA' ? 'bg-blue-50 dark:bg-blue-950' : ''}
                >
                  <div className="flex items-center gap-2 flex-1">
                    <div className="w-3 h-3 rounded-full bg-blue-500" />
                    <span>St. Francis Xavier Smart Academy</span>
                  </div>
                  {selectedSchool === 'STFXSA' && <span className="text-blue-500">✓</span>}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}

        {/* Academic Year Switcher */}
        {canSwitch && !isCollapsed && (
          <div className="px-3 mt-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-between text-inherit hover:bg-white/10 border border-white/20"
                >
                  <div className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4" />
                    {isLoadingYears ? (
                      <Skeleton className="h-4 w-20 bg-white/20" />
                    ) : (
                      <span className="text-sm truncate">{selectedYear?.name || 'Select Year'}</span>
                    )}
                  </div>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-[200px] max-h-[300px] overflow-y-auto">
                <DropdownMenuLabel>Academic Year</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {academicYears.map((year) => (
                  <DropdownMenuItem
                    key={year.id}
                    onClick={() => setSelectedYearId(year.id)}
                    className={selectedYearId === year.id ? 'bg-primary/10' : ''}
                  >
                    <div className="flex items-center gap-2 flex-1">
                      <CalendarDays className="h-3 w-3 opacity-50" />
                      <span>{year.name}</span>
                      {year.is_current && (
                        <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4">Current</Badge>
                      )}
                    </div>
                    {selectedYearId === year.id && <span className="text-primary">✓</span>}
                  </DropdownMenuItem>
                ))}
                {academicYears.length === 0 && !isLoadingYears && (
                  <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                    No academic years found
                  </div>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}

        {/* Navigation */}
        <motion.nav
          className="px-2 space-y-1 flex-1 overflow-y-auto overflow-x-hidden mt-4"
          variants={navVariants}
          initial="hidden"
          animate="visible"
        >
          {navGroups.map((group) => renderNavGroup(group))}
        </motion.nav>

        {/* Bottom Section - Admin */}
        <div className="px-3 pb-6 space-y-2">
          {/* Admin Button - Only show for admin role */}
          {role === 'admin' && !isCollapsed && (() => {
            const AdminIconComponent = getIconForItem('admin', isAppleTheme);
            return (
              <motion.button
                variants={itemVariants}
                initial="hidden"
                animate="visible"
                whileHover={isAppleTheme ? { scale: 1.01 } : { x: 5, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  onTabChange(adminItem.id);
                  setSidebarOpen(false);
                }}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 font-medium transition-all duration-200 relative overflow-hidden",
                  isAppleTheme
                    ? cn(
                        "rounded-xl",
                        activeTab === adminItem.id
                          ? "bg-[#FF3B30] text-white shadow-sm"
                          : "text-[#FF3B30] hover:bg-[#FF3B30]/10"
                      )
                    : cn(
                        "rounded-lg",
                        activeTab === adminItem.id
                          ? "bg-destructive text-destructive-foreground shadow-md"
                          : "text-inherit/80 hover:bg-white/10 hover:text-red-300"
                      )
                )}
              >
                {activeTab === adminItem.id && !isAppleTheme && (
                  <motion.div
                    layoutId="activeTabBackground"
                    className="absolute inset-0 bg-white/20 dark:bg-black/20"
                    initial={false}
                    transition={{ type: "spring", stiffness: 350, damping: 30 }}
                  />
                )}
                <AdminIconComponent className="h-5 w-5 z-10" />
                <span className={cn("z-10", isAppleTheme && "text-[13px]")}>{adminItem.label}</span>
              </motion.button>
            );
          })()}
        </div>
      </aside>

      {/* Main Content */}
      <main className={cn(
        "transition-all duration-300 pt-16 lg:pt-0 min-h-screen",
        isCollapsed ? "lg:pl-[70px]" : "lg:pl-64",
        role === 'student' && "pb-20 lg:pb-0"
      )}>
        <div className="p-4 lg:p-8">
          {children}
        </div>
      </main>

      {/* Student Bottom Navigation - Mobile Only */}
      {role === 'student' && (
        <StudentBottomNav activeTab={activeTab} onTabChange={onTabChange} />
      )}
    </div>
  );
};
