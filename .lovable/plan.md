
# Student Portal Sidebar Refactor & Admin/Teacher/Registrar CRUD Implementation

## Summary

This plan refactors the Student Portal from a tab-based navigation to a sidebar-based navigation system, organizes the Admin/Teacher/Registrar menus into proper hierarchical structures, and implements CRUD management interfaces for attendance, schedules, assignments, announcements, and exams.

## Current State

| Component | Current Implementation | Issue |
|-----------|----------------------|-------|
| Student Portal | 9 horizontal tabs (Dashboard, Profile, Grades, Subjects, Schedule, Attendance, Assignments, Exams, Announcements) | Crowded, doesn't scale well |
| Admin Sidebar | Flat list of 14+ items | No hierarchy, overwhelming |
| Teacher Sidebar | 5 flat items | Missing management capabilities |
| Registrar Sidebar | 9 flat items | Same as admin issues |
| CRUD for new tables | None | `student_attendance`, `class_schedules`, `student_assignments`, `exam_schedules`, `announcements` need admin management |

## Architecture Overview

```text
+------------------------------------------------------------------+
|  SIDEBAR STRUCTURE                                                |
+------------------------------------------------------------------+
|                                                                   |
|  ADMIN/REGISTRAR:                                                 |
|  +---------------------------------------------------------+     |
|  | [Portal Home]                                             |     |
|  | [Student Records]                                         |     |
|  |    ├── Students                                           |     |
|  |    ├── Enrollment                                         |     |
|  |    ├── Import CSV                                         |     |
|  |    └── Attendance                                         |     |
|  | [Academics]                                               |     |
|  |    ├── Grades                                             |     |
|  |    ├── Subjects                                           |     |
|  |    ├── Subject Enrollment                                 |     |
|  |    ├── Schedules                                          |     |
|  |    ├── Assignments                                        |     |
|  |    └── Exams                                              |     |
|  | [School Management]                                       |     |
|  |    ├── Teachers                                           |     |
|  |    ├── Events                                             |     |
|  |    ├── Announcements                                      |     |
|  |    └── Academic Years (Admin only)                        |     |
|  | [Resources]                                               |     |
|  |    ├── Library                                            |     |
|  |    ├── Canva Studio                                       |     |
|  |    └── Notebook LLM                                       |     |
|  | [Reports]                                                 |     |
|  | [Admin] (Admin only)                                      |     |
|  +---------------------------------------------------------+     |
|                                                                   |
|  TEACHER:                                                         |
|  +---------------------------------------------------------+     |
|  | [Portal Home]                                             |     |
|  | [My Classes]                                              |     |
|  | [Academics]                                               |     |
|  |    ├── Grades                                             |     |
|  |    ├── Attendance                                         |     |
|  |    ├── Schedules                                          |     |
|  |    ├── Assignments                                        |     |
|  |    └── Exams                                              |     |
|  | [Resources]                                               |     |
|  |    ├── Library                                            |     |
|  |    ├── Canva Studio                                       |     |
|  |    └── Notebook LLM                                       |     |
|  +---------------------------------------------------------+     |
|                                                                   |
|  STUDENT (New Sidebar):                                           |
|  +---------------------------------------------------------+     |
|  | [Dashboard]                                               |     |
|  | [My Records]                                              |     |
|  |    ├── Profile                                            |     |
|  |    ├── Grades                                             |     |
|  |    ├── Subjects                                           |     |
|  |    └── Attendance                                         |     |
|  | [Academics]                                               |     |
|  |    ├── Schedule                                           |     |
|  |    ├── Assignments                                        |     |
|  |    └── Exams                                              |     |
|  | [Resources]                                               |     |
|  |    └── Library                                            |     |
|  | [Announcements]                                           |     |
|  +---------------------------------------------------------+     |
+------------------------------------------------------------------+
```

## Technical Changes

### 1. New CRUD Management Components

Create comprehensive management interfaces for admin/teacher/registrar:

#### AttendanceManagement.tsx
Full CRUD for student attendance with:
- Date picker and bulk attendance entry
- Status selection (present/absent/late/excused)
- Filter by grade level, section, date range
- Export attendance reports
- Edit/delete individual records

#### ScheduleManagement.tsx
Full CRUD for class schedules with:
- Weekly timetable grid view
- Add/edit/delete schedule slots
- Assign teachers to time slots
- Room assignment
- Conflict detection

#### AssignmentManagement.tsx
Full CRUD for assignments with:
- Create assignments per subject/grade level
- Set due dates, instructions, max score
- View submissions from students
- Grade and provide feedback
- Bulk actions

#### ExamScheduleManagement.tsx
Full CRUD for exam schedules with:
- Create exam dates per subject
- Quarter and exam type selection
- Assign rooms and times
- View/edit/delete exams

#### AnnouncementManagement.tsx
Full CRUD for announcements with:
- Create targeted announcements
- Select audience (all, specific grades, specific roles)
- Set priority and pin status
- Set expiry dates
- Edit/delete announcements

### 2. Refactor Student Portal to Sidebar Navigation

Replace the current tab-based StudentPortal with a sidebar-based layout:

```typescript
// New structure for StudentPortal
const StudentPortal = () => {
  const [activeSection, setActiveSection] = useState('dashboard');
  
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <StudentSidebar 
          activeSection={activeSection} 
          onNavigate={setActiveSection} 
        />
        <main className="flex-1 p-6">
          {activeSection === 'dashboard' && <StudentDashboard />}
          {activeSection === 'profile' && <StudentProfileCard />}
          {activeSection === 'grades' && <StudentGradesView />}
          {/* ... other sections */}
        </main>
      </div>
    </SidebarProvider>
  );
};
```

### 3. Update DashboardLayout.tsx

Refactor the `getNavItemsForRole` function to return hierarchical menu structures:

```typescript
interface NavGroup {
  id: string;
  label: string;
  icon: any;
  items?: NavItem[];  // Sub-items for collapsible groups
  isCollapsible?: boolean;
}

const getNavGroupsForRole = (role: string | null): NavGroup[] => {
  switch (role) {
    case 'admin':
      return [
        { id: 'portal', label: 'Portal Home', icon: HomeIcon3D },
        { 
          id: 'student-records', 
          label: 'Student Records', 
          icon: StudentIcon3D,
          isCollapsible: true,
          items: [
            { id: 'students', label: 'Students' },
            { id: 'enrollment', label: 'New Student' },
            { id: 'import', label: 'Import CSV' },
            { id: 'attendance-mgmt', label: 'Attendance' },
          ]
        },
        { 
          id: 'academics', 
          label: 'Academics', 
          icon: GradesIcon3D,
          isCollapsible: true,
          items: [
            { id: 'grades', label: 'Grades' },
            { id: 'subjects', label: 'Subjects' },
            { id: 'subject-enrollment', label: 'Subject Enrollment' },
            { id: 'schedule-mgmt', label: 'Schedules' },
            { id: 'assignment-mgmt', label: 'Assignments' },
            { id: 'exam-mgmt', label: 'Exams' },
          ]
        },
        // ... more groups
      ];
    // ... other roles
  }
};
```

### 4. Collapsible Sidebar Groups

Implement collapsible groups using the existing Collapsible component:

```typescript
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

const SidebarNavGroup = ({ group, activeTab, onTabChange }) => {
  const [isOpen, setIsOpen] = useState(
    group.items?.some(item => item.id === activeTab) || false
  );
  
  if (!group.isCollapsible) {
    return <SidebarNavItem item={group} isActive={activeTab === group.id} onClick={() => onTabChange(group.id)} />;
  }
  
  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className="w-full">
        <div className="flex items-center justify-between p-2 rounded-lg hover:bg-white/10">
          <span className="flex items-center gap-2">
            <group.icon className="h-5 w-5" />
            {group.label}
          </span>
          <ChevronDown className={cn("h-4 w-4 transition-transform", isOpen && "rotate-180")} />
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="ml-6 space-y-1">
          {group.items.map(item => (
            <SidebarNavItem 
              key={item.id} 
              item={item} 
              isActive={activeTab === item.id}
              onClick={() => onTabChange(item.id)}
            />
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};
```

## Files to Create

| File | Purpose |
|------|---------|
| `src/components/management/AttendanceManagement.tsx` | CRUD for student attendance |
| `src/components/management/ScheduleManagement.tsx` | CRUD for class schedules |
| `src/components/management/AssignmentManagement.tsx` | CRUD for assignments |
| `src/components/management/ExamScheduleManagement.tsx` | CRUD for exam schedules |
| `src/components/management/AnnouncementManagement.tsx` | CRUD for announcements |
| `src/components/portals/student/StudentSidebar.tsx` | Student-specific sidebar component |
| `src/components/portals/student/StudentGradesView.tsx` | Extracted grades view from StudentPortal |
| `src/components/portals/student/StudentSubjectsView.tsx` | Extracted subjects view from StudentPortal |

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/layout/DashboardLayout.tsx` | Add hierarchical menu groups, collapsible sections |
| `src/components/portals/StudentPortal.tsx` | Replace tabs with sidebar navigation, use internal routing |
| `src/pages/Index.tsx` | Add new management tab handlers |
| `src/components/portals/TeacherPortal.tsx` | Add quick links to management sections |
| `src/components/portals/AdminPortal.tsx` | Add quick links to new management sections |
| `src/components/portals/RegistrarPortal.tsx` | Add quick links to new management sections |

## Menu Hierarchy by Role

### Admin Menu Structure
```text
├── Portal Home
├── Student Records (collapsible)
│   ├── Students
│   ├── Enrollment
│   ├── Import CSV
│   └── Attendance
├── Academics (collapsible)
│   ├── Grades
│   ├── Subjects
│   ├── Subject Enrollment
│   ├── Schedules
│   ├── Assignments
│   └── Exams
├── School Management (collapsible)
│   ├── Teachers
│   ├── Events
│   ├── Announcements
│   └── Academic Years
├── Resources (collapsible)
│   ├── Library
│   ├── Canva Studio
│   └── Notebook LLM
├── Reports
└── Admin Panel
```

### Registrar Menu Structure
```text
├── Portal Home
├── Student Records (collapsible)
│   ├── Students
│   ├── Enrollment
│   ├── Import CSV
│   └── Attendance
├── Academics (collapsible)
│   ├── Grades
│   ├── Subjects
│   ├── Subject Enrollment
│   ├── Schedules
│   ├── Assignments
│   └── Exams
├── School Management (collapsible)
│   ├── Teachers
│   ├── Events
│   └── Announcements
├── Resources (collapsible)
│   └── Library
└── Reports
```

### Teacher Menu Structure
```text
├── Portal Home
├── My Classes
├── Academics (collapsible)
│   ├── Grades
│   ├── Attendance
│   ├── Schedules
│   ├── Assignments
│   └── Exams
└── Resources (collapsible)
    ├── Library
    ├── Canva Studio
    └── Notebook LLM
```

### Student Sidebar Structure (New)
```text
├── Dashboard
├── My Records (collapsible)
│   ├── Profile
│   ├── Grades
│   ├── Subjects
│   └── Attendance
├── Academics (collapsible)
│   ├── Schedule
│   ├── Assignments
│   └── Exams
├── Library
└── Announcements
```

## CRUD Component Pattern

Each management component will follow this consistent pattern:

```typescript
const AttendanceManagement = () => {
  // State
  const [data, setData] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState(initialState);
  
  // Queries
  const { data, isLoading } = useQuery({ ... });
  
  // Mutations
  const createMutation = useMutation({ ... });
  const updateMutation = useMutation({ ... });
  const deleteMutation = useMutation({ ... });
  
  // Handlers
  const handleCreate = () => { ... };
  const handleEdit = (item) => { ... };
  const handleDelete = (id) => { ... };
  const handleSubmit = async () => { ... };
  
  return (
    <div className="space-y-6">
      {/* Header with title and Add button */}
      <div className="flex justify-between">
        <div>
          <h1>Attendance Management</h1>
          <p>Manage student attendance records</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus /> Add Record
        </Button>
      </div>
      
      {/* Filters */}
      <Card>
        <CardContent className="flex gap-4">
          {/* Date picker, grade filter, etc. */}
        </CardContent>
      </Card>
      
      {/* Data Table */}
      <Card>
        <Table>
          {/* Table with edit/delete actions */}
        </Table>
      </Card>
      
      {/* Create/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        {/* Form fields */}
      </Dialog>
      
      {/* Delete Confirmation */}
      <AlertDialog>
        {/* Confirmation dialog */}
      </AlertDialog>
    </div>
  );
};
```

## Implementation Order

1. **Create CRUD Management Components** (5 new files)
   - AttendanceManagement.tsx
   - ScheduleManagement.tsx
   - AssignmentManagement.tsx
   - ExamScheduleManagement.tsx
   - AnnouncementManagement.tsx

2. **Refactor DashboardLayout Sidebar**
   - Add hierarchical menu structure
   - Implement collapsible groups
   - Update role-based menu items

3. **Update Index.tsx**
   - Add route handlers for new management tabs
   - Connect to new CRUD components

4. **Refactor Student Portal**
   - Create StudentSidebar component
   - Convert tabs to sidebar navigation
   - Extract reusable view components

5. **Update Portal Components**
   - Add quick action links to AdminPortal
   - Add management links to TeacherPortal
   - Add management links to RegistrarPortal

## Data Flow

```text
Management Components (Admin/Teacher/Registrar)
         │
         ▼
CRUD Operations → Supabase Tables
         │
         ├── student_attendance
         ├── class_schedules
         ├── student_assignments
         ├── assignment_submissions
         ├── exam_schedules
         └── announcements
         │
         ▼
Student Portal (Read-only view)
```

## Role-Based CRUD Permissions

| Feature | Admin | Registrar | Teacher | Student |
|---------|-------|-----------|---------|---------|
| Attendance | Full CRUD | Full CRUD | CRUD (own classes) | View only |
| Schedules | Full CRUD | Full CRUD | View only | View only |
| Assignments | Full CRUD | Full CRUD | Full CRUD | View + Submit |
| Exams | Full CRUD | Full CRUD | Full CRUD | View only |
| Announcements | Full CRUD | Full CRUD | View only | View only |

## Mobile Responsiveness

- Sidebar collapses to hamburger menu on mobile
- Student sidebar uses Sheet component on mobile devices
- All management tables have horizontal scroll on small screens
- Forms use responsive grid layouts
