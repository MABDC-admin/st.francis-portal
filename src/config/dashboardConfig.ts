/**
 * Dashboard Configuration — extracted from DashboardLayout.tsx
 * 
 * Contains: icon maps, nav group definitions per role, role colors/labels,
 * and helper functions. Single source of truth for sidebar navigation.
 */

import React from 'react';

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

// ─── Types ───────────────────────────────────────────────────────────────────

/** Shared type for all dashboard icon components (3D and Apple styles) */
export type IconComponent = React.ComponentType<{ className?: string }>;

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

// ─── Icon Maps ───────────────────────────────────────────────────────────────

export const icon3DMap: Record<string, IconComponent> = {
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
    'student-calendar': EventsIcon3D,
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
    'fee-setup': SubjectsIcon3D,
    'assessments': EnrollmentIcon3D,
    'cashier': EnterGradeIcon3D,
    'payment-plans': ScheduleIcon3D,
    'student-ledger': ReportsIcon3D,
    'discount-scholarships': StudentIcon3D,
    'finance-clearance': AdminIcon3D,
    'finance-reports': ReportsIcon3D,
    'finance-settings': AdminIcon3D,
    'year-end-close': AdminIcon3D,
    'finance-audit': ImportIcon3D,
    'billing': ReportsIcon3D,
    'payments-group': EnterGradeIcon3D,
    'accounts': ProfileIcon3D,
    'finance-config': AdminIcon3D,
    'finance-learners': StudentIcon3D,
    'helpdesk': AdminIcon3D,
    'admissions': EnrollmentIcon3D,
    'my-profile': ProfileIcon3D,
    'applicants': TeacherIcon3D,
    'banner-management': ReportsIcon3D,
    'visits': EventsIcon3D,
};

export const iconAppleMap: Record<string, IconComponent> = {
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
    'student-calendar': AppleEventsIcon,
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
    'fee-setup': AppleSubjectsIcon,
    'assessments': AppleEnrollmentIcon,
    'cashier': AppleGradesIcon,
    'payment-plans': AppleScheduleIcon,
    'student-ledger': AppleReportsIcon,
    'discount-scholarships': AppleStudentIcon,
    'finance-clearance': AppleAdminIcon,
    'finance-reports': AppleReportsIcon,
    'finance-settings': AppleAdminIcon,
    'year-end-close': AppleAdminIcon,
    'finance-audit': AppleImportIcon,
    'billing': AppleReportsIcon,
    'payments-group': AppleGradesIcon,
    'accounts': AppleProfileIcon,
    'finance-config': AppleAdminIcon,
    'finance-learners': AppleStudentIcon,
    'helpdesk': AppleAdminIcon,
    'admissions': AppleEnrollmentIcon,
    'my-profile': AppleProfileIcon,
    'applicants': AppleTeacherIcon,
    'banner-management': AppleReportsIcon,
    'visits': AppleEventsIcon,
};

// ─── Role Config ─────────────────────────────────────────────────────────────

export const adminItem: NavItem = { id: 'admin', icon: AdminIcon3D, label: 'Admin' };

export const roleColors: Record<string, string> = {
    admin: 'bg-red-500',
    registrar: 'bg-blue-500',
    teacher: 'bg-green-500',
    student: 'bg-purple-500',
    parent: 'bg-orange-500',
    finance: 'bg-emerald-600',
    principal: 'bg-amber-500',
};

export const roleLabels: Record<string, string> = {
    admin: 'Administrator',
    registrar: 'Registrar',
    teacher: 'Teacher',
    student: 'Learner',
    parent: 'Parent',
    finance: 'Finance',
    principal: 'Principal',
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Get the icon component for a given item ID, respecting Apple/3D theme */
export const getIconForItem = (itemId: string, isApple: boolean) => {
    return isApple ? (iconAppleMap[itemId] || iconAppleMap.portal) : (icon3DMap[itemId] || icon3DMap.portal);
};

/** Check if any item in a group is active */
export const isGroupActive = (group: NavGroup, activeTab: string): boolean => {
    if (group.id === activeTab) return true;
    if (group.items) {
        return group.items.some(item => item.id === activeTab);
    }
    return false;
};

// ─── Nav Groups per Role ─────────────────────────────────────────────────────

export const getNavGroupsForRole = (role: string | null): NavGroup[] => {
    switch (role) {
        case 'admin':
            return [
                { id: 'portal', icon: HomeIcon3D, label: 'Portal Home' },
                { id: 'announcement-mgmt', icon: EventsIcon3D, label: 'Announcements' },
                { id: 'applicants', icon: TeacherIcon3D, label: 'Teacher Applicants' },
                {
                    id: 'student-records', icon: StudentIcon3D, label: 'Learner Records', isCollapsible: true,
                    items: [
                        { id: 'students', icon: StudentIcon3D, label: 'Learners' },
                        { id: 'lis', icon: StudentIcon3D, label: 'LIS' },
                        { id: 'admissions', icon: EnrollmentIcon3D, label: 'Admissions' },
                        { id: 'registrations', icon: EnrollmentIcon3D, label: 'Registrations' },
                        { id: 'visits', icon: EventsIcon3D, label: 'Visits' },
                        { id: 'online-registration', icon: EnrollmentIcon3D, label: 'Online Registration' },
                        { id: 'import', icon: ImportIcon3D, label: 'Import CSV' },
                        { id: 'attendance-mgmt', icon: ScheduleIcon3D, label: 'Attendance' },
                    ]
                },
                {
                    id: 'academics', icon: EnterGradeIcon3D, label: 'Academics', isCollapsible: true,
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
                    id: 'school-management', icon: TeacherIcon3D, label: 'School Management', isCollapsible: true,
                    items: [
                        { id: 'teachers', icon: TeacherIcon3D, label: 'Teachers' },
                        { id: 'teacher-import', icon: ImportIcon3D, label: 'Teacher Import' },
                        { id: 'messages', icon: EventsIcon3D, label: 'Messages' },
                        { id: 'zoom', icon: TeacherIcon3D, label: 'Virtual Classes' },
                        { id: 'events', icon: EventsIcon3D, label: 'Events' },
                        { id: 'banner-management', icon: ReportsIcon3D, label: 'Banner Management' },
                        { id: 'academic-years', icon: ScheduleIcon3D, label: 'Academic Years' },
                    ]
                },
                {
                    id: 'resources', icon: LibraryIcon3D, label: 'Resources', isCollapsible: true,
                    items: [
                        { id: 'library', icon: LibraryIcon3D, label: 'Library' },
                        { id: 'canva', icon: CanvaIcon3D, label: 'Canva Studio' },
                        { id: 'notebook', icon: NotebookIcon3D, label: 'Notebook LLM' },
                        { id: 'ai-chat', icon: NotebookIcon3D, label: 'AI Chat' },
                    ]
                },
                { id: 'reports', icon: ReportsIcon3D, label: 'Reports' },
                {
                    id: 'integrations', icon: AdminIcon3D, label: 'Integrations', isCollapsible: true,
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
                { id: 'helpdesk', icon: AdminIcon3D, label: 'Helpdesk' },
            ];
        case 'registrar':
            return [
                { id: 'portal', icon: HomeIcon3D, label: 'Portal Home' },
                { id: 'announcement-mgmt', icon: EventsIcon3D, label: 'Announcements' },
                { id: 'applicants', icon: TeacherIcon3D, label: 'Teacher Applicants' },
                {
                    id: 'student-records', icon: StudentIcon3D, label: 'Learner Records', isCollapsible: true,
                    items: [
                        { id: 'students', icon: StudentIcon3D, label: 'Learners' },
                        { id: 'lis', icon: StudentIcon3D, label: 'LIS' },
                        { id: 'admissions', icon: EnrollmentIcon3D, label: 'Admissions' },
                        { id: 'registrations', icon: EnrollmentIcon3D, label: 'Registrations' },
                        { id: 'visits', icon: EventsIcon3D, label: 'Visits' },
                        { id: 'online-registration', icon: EnrollmentIcon3D, label: 'Online Registration' },
                        { id: 'import', icon: ImportIcon3D, label: 'Import CSV' },
                        { id: 'attendance-mgmt', icon: ScheduleIcon3D, label: 'Attendance' },
                    ]
                },
                {
                    id: 'academics', icon: EnterGradeIcon3D, label: 'Academics', isCollapsible: true,
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
                    id: 'school-management', icon: TeacherIcon3D, label: 'School Management', isCollapsible: true,
                    items: [
                        { id: 'teachers', icon: TeacherIcon3D, label: 'Teachers' },
                        { id: 'teacher-import', icon: ImportIcon3D, label: 'Teacher Import' },
                        { id: 'messages', icon: EventsIcon3D, label: 'Messages' },
                        { id: 'zoom', icon: TeacherIcon3D, label: 'Virtual Classes' },
                        { id: 'events', icon: EventsIcon3D, label: 'Events' },
                        { id: 'banner-management', icon: ReportsIcon3D, label: 'Banner Management' },
                    ]
                },
                {
                    id: 'resources', icon: LibraryIcon3D, label: 'Resources', isCollapsible: true,
                    items: [
                        { id: 'library', icon: LibraryIcon3D, label: 'Library' },
                        { id: 'ai-chat', icon: NotebookIcon3D, label: 'AI Chat' },
                    ]
                },
                { id: 'reports', icon: ReportsIcon3D, label: 'Reports' },
                { id: 'helpdesk', icon: AdminIcon3D, label: 'Helpdesk' },
            ];
        case 'teacher':
            return [
                { id: 'portal', icon: HomeIcon3D, label: 'Portal Home' },
                {
                    id: 'my-info', icon: ProfileIcon3D, label: 'My Info', isCollapsible: true,
                    items: [
                        { id: 'teacher-profile', icon: ProfileIcon3D, label: 'Profile' },
                    ]
                },
                {
                    id: 'student-records', icon: StudentIcon3D, label: 'Learner Records', isCollapsible: true,
                    items: [
                        { id: 'students', icon: StudentIcon3D, label: 'Learners' },
                    ]
                },
                {
                    id: 'academics', icon: EnterGradeIcon3D, label: 'Academics', isCollapsible: true,
                    items: [
                        { id: 'grades', icon: EnterGradeIcon3D, label: 'Grades' },
                        { id: 'subjects', icon: SubjectsIcon3D, label: 'Subjects' },
                        { id: 'subject-enrollment', icon: EnrollmentIcon3D, label: 'Subject Enrollment' },
                        { id: 'attendance-mgmt', icon: ScheduleIcon3D, label: 'Attendance' },
                        { id: 'schedule-mgmt', icon: ScheduleIcon3D, label: 'Schedules' },
                        { id: 'assignment-mgmt', icon: ReportsIcon3D, label: 'Assignments' },
                        { id: 'exam-mgmt', icon: ReportsIcon3D, label: 'Exams' },
                    ]
                },
                { id: 'messages', icon: EventsIcon3D, label: 'Messages' },
                { id: 'zoom', icon: TeacherIcon3D, label: 'Virtual Classes' },
                {
                    id: 'resources', icon: LibraryIcon3D, label: 'Resources', isCollapsible: true,
                    items: [
                        { id: 'library', icon: LibraryIcon3D, label: 'Library' },
                        { id: 'canva', icon: CanvaIcon3D, label: 'Canva Studio' },
                        { id: 'notebook', icon: NotebookIcon3D, label: 'Notebook LLM' },
                        { id: 'ai-chat', icon: NotebookIcon3D, label: 'AI Chat' },
                    ]
                },
                { id: 'reports', icon: ReportsIcon3D, label: 'Reports' },
                { id: 'helpdesk', icon: AdminIcon3D, label: 'Helpdesk' },
            ];
        case 'student':
            return [
                { id: 'portal', icon: HomeIcon3D, label: 'Dashboard' },
                {
                    id: 'my-records', icon: ProfileIcon3D, label: 'My Records', isCollapsible: true,
                    items: [
                        { id: 'student-profile', icon: ProfileIcon3D, label: 'Profile' },
                        { id: 'student-grades', icon: EnterGradeIcon3D, label: 'Grades' },
                        { id: 'student-subjects', icon: SubjectsIcon3D, label: 'Subjects' },
                        { id: 'student-attendance', icon: ScheduleIcon3D, label: 'Attendance' },
                    ]
                },
                {
                    id: 'academics', icon: EnterGradeIcon3D, label: 'Academics', isCollapsible: true,
                    items: [
                        { id: 'student-schedule', icon: ScheduleIcon3D, label: 'Schedule' },
                        { id: 'student-assignments', icon: ReportsIcon3D, label: 'Assignments' },
                        { id: 'student-exams', icon: ReportsIcon3D, label: 'Exams' },
                    ]
                },
                { id: 'student-library', icon: LibraryIcon3D, label: 'Library' },
                { id: 'student-calendar', icon: EventsIcon3D, label: 'Calendar' },
                { id: 'student-announcements', icon: EventsIcon3D, label: 'Announcements' },
                { id: 'helpdesk', icon: AdminIcon3D, label: 'Helpdesk' },
            ];
        case 'parent':
            return [
                { id: 'portal', icon: HomeIcon3D, label: 'Portal Home' },
                { id: 'children', icon: StudentIcon3D, label: 'My Children' },
                { id: 'library', icon: LibraryIcon3D, label: 'Library' },
                { id: 'helpdesk', icon: AdminIcon3D, label: 'Helpdesk' },
            ];
        case 'finance':
            return [
                { id: 'finance-learners', icon: StudentIcon3D, label: 'Learners' },
                {
                    id: 'billing', icon: ReportsIcon3D, label: 'Billing', isCollapsible: true,
                    items: [
                        { id: 'fee-setup', icon: SubjectsIcon3D, label: 'Fees Setup' },
                        { id: 'assessments', icon: EnrollmentIcon3D, label: 'Assessments' },
                        { id: 'discount-scholarships', icon: StudentIcon3D, label: 'Discounts' },
                    ]
                },
                {
                    id: 'payments-group', icon: EnterGradeIcon3D, label: 'Payments', isCollapsible: true,
                    items: [
                        { id: 'cashier', icon: EnterGradeIcon3D, label: 'Cashier' },
                        { id: 'payment-plans', icon: ScheduleIcon3D, label: 'Payment Plans' },
                    ]
                },
                {
                    id: 'accounts', icon: ProfileIcon3D, label: 'Accounts', isCollapsible: true,
                    items: [
                        { id: 'student-ledger', icon: ReportsIcon3D, label: 'Student Ledger' },
                        { id: 'finance-clearance', icon: AdminIcon3D, label: 'Clearance' },
                    ]
                },
                { id: 'finance-reports', icon: ReportsIcon3D, label: 'Reports' },
                {
                    id: 'finance-config', icon: AdminIcon3D, label: 'Settings', isCollapsible: true,
                    items: [
                        { id: 'finance-settings', icon: AdminIcon3D, label: 'Finance Settings' },
                        { id: 'year-end-close', icon: AdminIcon3D, label: 'Year-End Close' },
                        { id: 'finance-audit', icon: ImportIcon3D, label: 'Audit Logs' },
                    ]
                },
                { id: 'library', icon: LibraryIcon3D, label: 'Library' },
                { id: 'helpdesk', icon: AdminIcon3D, label: 'Helpdesk' },
            ];
        case 'principal':
            return [
                { id: 'portal', icon: HomeIcon3D, label: 'Portal Home' },
                {
                    id: 'student-records', icon: StudentIcon3D, label: 'Learner Records', isCollapsible: true,
                    items: [
                        { id: 'students', icon: StudentIcon3D, label: 'Learners' },
                    ]
                },
                {
                    id: 'academics', icon: EnterGradeIcon3D, label: 'Academics', isCollapsible: true,
                    items: [
                        { id: 'grades', icon: EnterGradeIcon3D, label: 'Grades' },
                        { id: 'reports', icon: ReportsIcon3D, label: 'Reports' },
                    ]
                },
                {
                    id: 'school-management', icon: TeacherIcon3D, label: 'School Management', isCollapsible: true,
                    items: [
                        { id: 'teachers', icon: TeacherIcon3D, label: 'Teachers' },
                        { id: 'events', icon: EventsIcon3D, label: 'Events' },
                        { id: 'messages', icon: EventsIcon3D, label: 'Messages' },
                    ]
                },
                { id: 'library', icon: LibraryIcon3D, label: 'Library' },
                { id: 'my-profile', icon: ProfileIcon3D, label: 'My Profile' },
                { id: 'helpdesk', icon: AdminIcon3D, label: 'Helpdesk' },
            ];
        case 'it':
            return [
                { id: 'portal', icon: HomeIcon3D, label: 'Portal Home' },
                {
                    id: 'user-mgmt', icon: AdminIcon3D, label: 'User Management', isCollapsible: true,
                    items: [
                        { id: 'admin', icon: AdminIcon3D, label: 'Permissions' },
                    ]
                },
                {
                    id: 'integrations', icon: AdminIcon3D, label: 'System Tools', isCollapsible: true,
                    items: [
                        { id: 'nocodb', icon: ImportIcon3D, label: 'NocoDB' },
                        { id: 'omada', icon: TeacherIcon3D, label: 'Omada' },
                        { id: 'tacticalrmm', icon: AdminIcon3D, label: 'Tactical RMM' },
                        { id: 'documize', icon: LibraryIcon3D, label: 'Documize' },
                        { id: 'excalidraw', icon: CanvaIcon3D, label: 'Excalidraw' },
                    ]
                },
                {
                    id: 'resources', icon: LibraryIcon3D, label: 'Resources', isCollapsible: true,
                    items: [
                        { id: 'library', icon: LibraryIcon3D, label: 'Library' },
                        { id: 'ai-chat', icon: NotebookIcon3D, label: 'AI Chat' },
                    ]
                },
                { id: 'my-profile', icon: ProfileIcon3D, label: 'My Profile' },
                { id: 'helpdesk', icon: AdminIcon3D, label: 'Helpdesk' },
            ];
        default:
            return [
                { id: 'portal', icon: HomeIcon3D, label: 'Portal Home' },
            ];
    }
};
