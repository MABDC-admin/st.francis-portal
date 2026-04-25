import type { LucideIcon } from "lucide-react";
import {
  Bell,
  BookCopy,
  BookOpen,
  Bot,
  CalendarDays,
  ClipboardCheck,
  FileBarChart2,
  FileSpreadsheet,
  FolderKanban,
  GraduationCap,
  LayoutGrid,
  Library,
  Layers3,
  LucideShield,
  MessageSquare,
  MonitorCog,
  NotebookPen,
  ReceiptText,
  ScanSearch,
  School,
  Settings,
  Sparkles,
  SquarePen,
  UserCog,
  UserRound,
  Users,
  Wallet,
  Waypoints,
  Wrench,
} from "lucide-react";

export type IconComponent = LucideIcon;

export interface NavItem {
  id: string;
  icon: IconComponent;
  label: string;
}

export interface NavGroup {
  id: string;
  icon: IconComponent;
  label: string;
  items?: NavItem[];
  isCollapsible?: boolean;
}

const iconMap: Record<string, IconComponent> = {
  portal: LayoutGrid,
  dashboard: LayoutGrid,
  students: Users,
  teachers: GraduationCap,
  grades: ClipboardCheck,
  subjects: BookCopy,
  "academic-years": CalendarDays,
  events: CalendarDays,
  "subject-enrollment": FileSpreadsheet,
  library: Library,
  "student-library": Library,
  canva: Sparkles,
  notebook: NotebookPen,
  reports: FileBarChart2,
  enrollment: SquarePen,
  import: FileSpreadsheet,
  profile: UserRound,
  classes: School,
  children: Users,
  admin: LucideShield,
  lis: ScanSearch,
  "student-records": Users,
  academics: BookOpen,
  "school-management": School,
  resources: Library,
  "my-records": UserRound,
  "attendance-mgmt": ClipboardCheck,
  "schedule-mgmt": CalendarDays,
  "sections-mgmt": Layers3,
  "assignment-mgmt": SquarePen,
  "exam-mgmt": FileBarChart2,
  "announcement-mgmt": Bell,
  "student-schedule": CalendarDays,
  "student-attendance": ClipboardCheck,
  "student-assignments": SquarePen,
  "student-exams": FileBarChart2,
  "student-announcements": Bell,
  "student-calendar": CalendarDays,
  "student-grades": ClipboardCheck,
  "student-subjects": BookCopy,
  "student-profile": UserRound,
  messages: MessageSquare,
  zoom: MonitorCog,
  nocodb: FolderKanban,
  onlyoffice: FileBarChart2,
  excalidraw: Sparkles,
  omada: Waypoints,
  tacticalrmm: Wrench,
  documize: BookOpen,
  integrations: MonitorCog,
  "ai-chat": Bot,
  impersonate: UserCog,
  "teacher-import": FileSpreadsheet,
  "teacher-profile": UserRound,
  "teacher-grades": ClipboardCheck,
  "teacher-schedule": CalendarDays,
  "lesson-plans": NotebookPen,
  "my-info": UserRound,
  "fee-setup": ReceiptText,
  assessments: Wallet,
  cashier: Wallet,
  "payment-plans": ReceiptText,
  "cashier-sessions": Wallet,
  "student-ledger": ReceiptText,
  "statement-of-account": ReceiptText,
  "finance-approvals": LucideShield,
  "discount-scholarships": Wallet,
  "finance-clearance": LucideShield,
  "finance-reports": FileBarChart2,
  "finance-settings": Settings,
  "year-end-close": Settings,
  "finance-audit": ScanSearch,
  billing: ReceiptText,
  "payments-group": Wallet,
  accounts: UserRound,
  "finance-config": Settings,
  "finance-learners": Users,
  helpdesk: Wrench,
  admissions: SquarePen,
  "my-profile": UserRound,
  applicants: GraduationCap,
  "banner-management": Bell,
  visits: CalendarDays,
  registrations: SquarePen,
  "online-registration": SquarePen,
  "user-mgmt": UserCog,
};

export const adminItem: NavItem = { id: "admin", icon: LucideShield, label: "Admin Panel" };

export const roleColors: Record<string, string> = {
  admin: "bg-destructive/12 text-destructive border-destructive/15",
  registrar: "bg-primary/12 text-primary border-primary/15",
  teacher: "bg-hrms-success/12 text-hrms-success border-hrms-success/15",
  student: "bg-primary/12 text-primary border-primary/15",
  parent: "bg-warning/12 text-warning border-warning/15",
  finance: "bg-hrms-success/12 text-hrms-success border-hrms-success/15",
  principal: "bg-accent text-accent-foreground border-primary/10",
  it: "bg-secondary text-secondary-foreground border-border",
};

export const roleLabels: Record<string, string> = {
  admin: "Administrator Portal",
  registrar: "Registrar Portal",
  teacher: "Teacher Portal",
  student: "Learner Portal",
  parent: "Parent Portal",
  finance: "Finance Portal",
  principal: "Principal Portal",
  it: "IT Portal",
};

export const getIconForItem = (itemId: string, _isApple: boolean) => {
  return iconMap[itemId] || LayoutGrid;
};

export const isGroupActive = (group: NavGroup, activeTab: string): boolean => {
  if (group.id === activeTab) return true;
  return group.items ? group.items.some((item) => item.id === activeTab) : false;
};

export const getNavGroupsForRole = (role: string | null): NavGroup[] => {
  switch (role) {
    case "admin":
      return [
        { id: "portal", icon: LayoutGrid, label: "Portal Home" },
        { id: "announcement-mgmt", icon: Bell, label: "Announcements" },
        { id: "applicants", icon: GraduationCap, label: "Teacher Applicants" },
        {
          id: "student-records",
          icon: Users,
          label: "Learner Records",
          isCollapsible: true,
          items: [
            { id: "students", icon: Users, label: "Learners" },
            { id: "lis", icon: ScanSearch, label: "LIS" },
            { id: "admissions", icon: SquarePen, label: "Admissions" },
            { id: "registrations", icon: SquarePen, label: "Registrations" },
            { id: "visits", icon: CalendarDays, label: "Visits" },
            { id: "online-registration", icon: SquarePen, label: "Online Registration" },
            { id: "import", icon: FileSpreadsheet, label: "Import CSV" },
            { id: "attendance-mgmt", icon: ClipboardCheck, label: "Attendance" },
          ],
        },
        {
          id: "academics",
          icon: BookOpen,
          label: "Academics",
          isCollapsible: true,
          items: [
            { id: "grades", icon: ClipboardCheck, label: "Grades" },
            { id: "subjects", icon: BookCopy, label: "Subjects" },
            { id: "sections-mgmt", icon: Layers3, label: "Sections" },
            { id: "subject-enrollment", icon: FileSpreadsheet, label: "Subject Enrollment" },
            { id: "schedule-mgmt", icon: CalendarDays, label: "Schedules" },
            { id: "assignment-mgmt", icon: SquarePen, label: "Assignments" },
            { id: "exam-mgmt", icon: FileBarChart2, label: "Exams" },
          ],
        },
        {
          id: "school-management",
          icon: School,
          label: "School Management",
          isCollapsible: true,
          items: [
            { id: "teachers", icon: GraduationCap, label: "Teachers" },
            { id: "teacher-import", icon: FileSpreadsheet, label: "Teacher Import" },
            { id: "messages", icon: MessageSquare, label: "Messages" },
            { id: "zoom", icon: MonitorCog, label: "Virtual Classes" },
            { id: "events", icon: CalendarDays, label: "Events" },
            { id: "banner-management", icon: Bell, label: "Banner Management" },
            { id: "academic-years", icon: CalendarDays, label: "Academic Years" },
          ],
        },
        {
          id: "resources",
          icon: Library,
          label: "Resources",
          isCollapsible: true,
          items: [
            { id: "library", icon: Library, label: "Library" },
            { id: "notebook", icon: NotebookPen, label: "Notebook LLM" },
          ],
        },
        { id: "reports", icon: FileBarChart2, label: "Reports" },
        {
          id: "integrations",
          icon: MonitorCog,
          label: "Integrations",
          isCollapsible: true,
          items: [
            { id: "nocodb", icon: FolderKanban, label: "NocoDB" },
            { id: "onlyoffice", icon: FileBarChart2, label: "Google Docs" },
            { id: "excalidraw", icon: Sparkles, label: "Excalidraw" },
            { id: "omada", icon: Waypoints, label: "Omada" },
            { id: "tacticalrmm", icon: Wrench, label: "Tactical RMM" },
            { id: "documize", icon: BookOpen, label: "Documize" },
          ],
        },
        { id: "impersonate", icon: UserCog, label: "Impersonate" },
        { id: "helpdesk", icon: Wrench, label: "Helpdesk" },
      ];
    case "registrar":
      return [
        { id: "portal", icon: LayoutGrid, label: "Portal Home" },
        { id: "announcement-mgmt", icon: Bell, label: "Announcements" },
        { id: "applicants", icon: GraduationCap, label: "Teacher Applicants" },
        {
          id: "student-records",
          icon: Users,
          label: "Learner Records",
          isCollapsible: true,
          items: [
            { id: "students", icon: Users, label: "Learners" },
            { id: "lis", icon: ScanSearch, label: "LIS" },
            { id: "admissions", icon: SquarePen, label: "Admissions" },
            { id: "registrations", icon: SquarePen, label: "Registrations" },
            { id: "visits", icon: CalendarDays, label: "Visits" },
            { id: "online-registration", icon: SquarePen, label: "Online Registration" },
            { id: "import", icon: FileSpreadsheet, label: "Import CSV" },
            { id: "attendance-mgmt", icon: ClipboardCheck, label: "Attendance" },
          ],
        },
        {
          id: "academics",
          icon: BookOpen,
          label: "Academics",
          isCollapsible: true,
          items: [
            { id: "grades", icon: ClipboardCheck, label: "Grades" },
            { id: "subjects", icon: BookCopy, label: "Subjects" },
            { id: "sections-mgmt", icon: Layers3, label: "Sections" },
            { id: "subject-enrollment", icon: FileSpreadsheet, label: "Subject Enrollment" },
            { id: "schedule-mgmt", icon: CalendarDays, label: "Schedules" },
            { id: "assignment-mgmt", icon: SquarePen, label: "Assignments" },
            { id: "exam-mgmt", icon: FileBarChart2, label: "Exams" },
          ],
        },
        {
          id: "school-management",
          icon: School,
          label: "School Management",
          isCollapsible: true,
          items: [
            { id: "teachers", icon: GraduationCap, label: "Teachers" },
            { id: "teacher-import", icon: FileSpreadsheet, label: "Teacher Import" },
            { id: "messages", icon: MessageSquare, label: "Messages" },
            { id: "zoom", icon: MonitorCog, label: "Virtual Classes" },
            { id: "events", icon: CalendarDays, label: "Events" },
            { id: "banner-management", icon: Bell, label: "Banner Management" },
          ],
        },
        {
          id: "resources",
          icon: Library,
          label: "Resources",
          isCollapsible: true,
          items: [
            { id: "library", icon: Library, label: "Library" },
            { id: "ai-chat", icon: Bot, label: "AI Chat" },
          ],
        },
        { id: "reports", icon: FileBarChart2, label: "Reports" },
        { id: "helpdesk", icon: Wrench, label: "Helpdesk" },
      ];
    case "teacher":
      return [
        { id: "portal", icon: LayoutGrid, label: "Portal Home" },
        { id: "classes", icon: School, label: "My Classes" },
        {
          id: "my-info",
          icon: UserRound,
          label: "My Info",
          isCollapsible: true,
          items: [
            { id: "teacher-profile", icon: UserRound, label: "Profile" },
            { id: "my-profile", icon: UserRound, label: "Account" },
          ],
        },
        { id: "students", icon: Users, label: "Learners" },
        {
          id: "academics",
          icon: BookOpen,
          label: "Academics",
          isCollapsible: true,
          items: [
            { id: "grades", icon: ClipboardCheck, label: "Grades" },
            { id: "attendance-mgmt", icon: ClipboardCheck, label: "Attendance" },
            { id: "schedule-mgmt", icon: CalendarDays, label: "Schedules" },
            { id: "assignment-mgmt", icon: SquarePen, label: "Assignments" },
            { id: "exam-mgmt", icon: FileBarChart2, label: "Exams" },
            { id: "lesson-plans", icon: NotebookPen, label: "Lesson Plans" },
          ],
        },
        { id: "messages", icon: MessageSquare, label: "Messages" },
        { id: "zoom", icon: MonitorCog, label: "Virtual Classes" },
        {
          id: "resources",
          icon: Library,
          label: "Resources",
          isCollapsible: true,
          items: [
            { id: "library", icon: Library, label: "Library" },
            { id: "notebook", icon: NotebookPen, label: "Notebook LLM" },
          ],
        },
        { id: "reports", icon: FileBarChart2, label: "Reports" },
        { id: "helpdesk", icon: Wrench, label: "Helpdesk" },
      ];
    case "student":
      return [
        { id: "portal", icon: LayoutGrid, label: "Dashboard" },
        {
          id: "my-records",
          icon: UserRound,
          label: "My Records",
          isCollapsible: true,
          items: [
            { id: "student-profile", icon: UserRound, label: "Profile" },
            { id: "student-grades", icon: ClipboardCheck, label: "Grades" },
            { id: "student-subjects", icon: BookCopy, label: "Subjects" },
            { id: "student-attendance", icon: ClipboardCheck, label: "Attendance" },
          ],
        },
        {
          id: "academics",
          icon: BookOpen,
          label: "Academics",
          isCollapsible: true,
          items: [
            { id: "student-schedule", icon: CalendarDays, label: "Schedule" },
            { id: "student-assignments", icon: SquarePen, label: "Assignments" },
            { id: "student-exams", icon: FileBarChart2, label: "Exams" },
          ],
        },
        { id: "student-library", icon: Library, label: "Library" },
        { id: "student-calendar", icon: CalendarDays, label: "Calendar" },
        { id: "student-announcements", icon: Bell, label: "Announcements" },
        { id: "helpdesk", icon: Wrench, label: "Helpdesk" },
      ];
    case "parent":
      return [
        { id: "portal", icon: LayoutGrid, label: "Portal Home" },
        { id: "children", icon: Users, label: "My Children" },
        { id: "library", icon: Library, label: "Library" },
        { id: "helpdesk", icon: Wrench, label: "Helpdesk" },
      ];
    case "finance":
      return [
        { id: "portal", icon: LayoutGrid, label: "Portal Home" },
        { id: "finance-learners", icon: Users, label: "Learners" },
        {
          id: "billing",
          icon: ReceiptText,
          label: "Billing",
          isCollapsible: true,
          items: [
            { id: "fee-setup", icon: ReceiptText, label: "Fees Setup" },
            { id: "assessments", icon: Wallet, label: "Assessments" },
            { id: "discount-scholarships", icon: Wallet, label: "Discounts" },
          ],
        },
        {
          id: "payments-group",
          icon: Wallet,
          label: "Payments",
          isCollapsible: true,
          items: [
            { id: "cashier", icon: Wallet, label: "Cashier" },
            { id: "cashier-sessions", icon: Wallet, label: "Cashier Sessions" },
            { id: "payment-plans", icon: ReceiptText, label: "Payment Plans" },
          ],
        },
        {
          id: "accounts",
          icon: UserRound,
          label: "Accounts",
          isCollapsible: true,
          items: [
            { id: "statement-of-account", icon: ReceiptText, label: "Statement of Account" },
            { id: "student-ledger", icon: ReceiptText, label: "Student Ledger" },
            { id: "finance-clearance", icon: LucideShield, label: "Clearance" },
          ],
        },
        { id: "finance-reports", icon: FileBarChart2, label: "Reports" },
        {
          id: "finance-config",
          icon: Settings,
          label: "Settings",
          isCollapsible: true,
          items: [
            { id: "finance-approvals", icon: LucideShield, label: "Approval Queue" },
            { id: "finance-settings", icon: Settings, label: "Finance Settings" },
            { id: "year-end-close", icon: Settings, label: "Year-End Close" },
            { id: "finance-audit", icon: ScanSearch, label: "Audit Logs" },
          ],
        },
        { id: "library", icon: Library, label: "Library" },
        { id: "helpdesk", icon: Wrench, label: "Helpdesk" },
      ];
    case "principal":
      return [
        { id: "portal", icon: LayoutGrid, label: "Portal Home" },
        {
          id: "student-records",
          icon: Users,
          label: "Learner Records",
          isCollapsible: true,
          items: [{ id: "students", icon: Users, label: "Learners" }],
        },
        {
          id: "academics",
          icon: BookOpen,
          label: "Academics",
          isCollapsible: true,
          items: [
            { id: "grades", icon: ClipboardCheck, label: "Grades" },
            { id: "reports", icon: FileBarChart2, label: "Reports" },
          ],
        },
        {
          id: "school-management",
          icon: School,
          label: "School Management",
          isCollapsible: true,
          items: [
            { id: "teachers", icon: GraduationCap, label: "Teachers" },
            { id: "events", icon: CalendarDays, label: "Events" },
            { id: "messages", icon: MessageSquare, label: "Messages" },
          ],
        },
        { id: "library", icon: Library, label: "Library" },
        { id: "my-profile", icon: UserRound, label: "My Profile" },
        { id: "helpdesk", icon: Wrench, label: "Helpdesk" },
      ];
    case "it":
      return [
        { id: "portal", icon: LayoutGrid, label: "Portal Home" },
        {
          id: "user-mgmt",
          icon: UserCog,
          label: "User Management",
          isCollapsible: true,
          items: [{ id: "admin", icon: LucideShield, label: "Permissions" }],
        },
        {
          id: "integrations",
          icon: MonitorCog,
          label: "System Tools",
          isCollapsible: true,
          items: [
            { id: "nocodb", icon: FolderKanban, label: "NocoDB" },
            { id: "omada", icon: Waypoints, label: "Omada" },
            { id: "tacticalrmm", icon: Wrench, label: "Tactical RMM" },
            { id: "documize", icon: BookOpen, label: "Documize" },
            { id: "excalidraw", icon: Sparkles, label: "Excalidraw" },
          ],
        },
        {
          id: "resources",
          icon: Library,
          label: "Resources",
          isCollapsible: true,
          items: [
            { id: "library", icon: Library, label: "Library" },
            { id: "ai-chat", icon: Bot, label: "AI Chat" },
          ],
        },
        { id: "my-profile", icon: UserRound, label: "My Profile" },
        { id: "helpdesk", icon: Wrench, label: "Helpdesk" },
      ];
    default:
      return [{ id: "portal", icon: LayoutGrid, label: "Portal Home" }];
  }
};
