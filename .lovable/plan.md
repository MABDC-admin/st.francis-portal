

# Rename "Students" to "Learners" in All UI Text

## Overview

Replace every user-facing occurrence of "Student" / "Students" with "Learner" / "Learners" across the entire application. Only visible text (labels, headings, placeholders, descriptions, toasts, tooltips) will change. Variable names, database columns, file names, route IDs, and CSS classes remain untouched.

## Mapping Rules

| Original | Replacement |
|---|---|
| Students | Learners |
| Student | Learner |
| students | learners |
| student | learner |
| student's | learner's |

Context-sensitive exceptions (NO change):
- Code identifiers: variable/function/component names (e.g., `useStudents`, `StudentTable`, `student.id`)
- Database/API references: table names (`students`), column names (`student_id`, `student_name`)
- Route IDs and CSS classes (e.g., `student-records`, `student-profile`, `student-bottom-nav`)
- Import paths and file names
- The `types.ts` auto-generated file
- The word "student" when part of a DepEd form name (SF1, SF9) -- these are official document titles

## Files to Modify (approximately 40+ files)

### Navigation and Layout
- **`src/components/layout/DashboardLayout.tsx`** -- Sidebar labels: "Student Records" -> "Learner Records", "Students" -> "Learners", "New Student" -> "New Learner"
- **`src/components/layout/StudentBottomNav.tsx`** -- No label changes needed (labels are "Home", "Grades", etc.)

### Dashboard Components
- **`src/components/dashboard/DashboardStatsRow.tsx`** -- "Total Students" -> "Total Learners"
- **`src/components/dashboard/StudentOverview.tsx`** -- Card title "Student Overview" -> "Learner Overview"
- **`src/components/dashboard/StudentBirthdays.tsx`** -- Any heading text like "Student Birthdays" -> "Learner Birthdays"
- **`src/components/dashboard/GlobalStudentSearch.tsx`** -- Placeholder "Search student by name or LRN..." -> "Search learner by name or LRN..."
- **`src/components/dashboard/BottomActions.tsx`** -- "Manage Students" -> "Manage Learners"
- **`src/components/dashboard/Charts.tsx`** -- "Students by Level" -> "Learners by Level"
- **`src/components/dashboard/StatsCard.tsx`** -- Any "student" text in subtitles
- **`src/components/dashboard/QuickActions.tsx`** -- Any student-related labels

### Portal Pages
- **`src/pages/Index.tsx`** -- Headings: "Students" -> "Learners", subtitles: "Manage student records" -> "Manage learner records", "Overview of student records" -> "Overview of learner records", stat labels: "Total Students", "Male Students", "Female Students", "Enrolled students"
- **`src/components/portals/AdminPortal.tsx`** -- Any "student" labels
- **`src/components/portals/RegistrarPortal.tsx`** -- Stat props and text
- **`src/components/portals/TeacherPortal.tsx`** -- "Students in My Classes", "My Students" labels
- **`src/components/portals/StudentPortal.tsx`** -- Portal title/descriptions
- **`src/components/portals/ParentPortal.tsx`** -- Any child/student references in UI text

### Student Management Components
- **`src/components/students/StudentTable.tsx`** -- "No students found" -> "No learners found", column headers, export labels
- **`src/components/students/StudentCard.tsx`** -- Any visible text
- **`src/components/students/StudentFormModal.tsx`** -- Dialog titles, labels
- **`src/components/students/StudentDetailPanel.tsx`** -- Panel headings
- **`src/components/students/StudentProfileCard.tsx`** -- Section titles
- **`src/components/students/StudentProfileModal.tsx`** -- Modal title
- **`src/components/students/StudentHoverPreview.tsx`** -- Tooltip text
- **`src/components/students/DocumentsManager.tsx`** -- Any "student" text
- **`src/components/students/DeleteConfirmModal.tsx`** -- Confirmation messages

### Student Profile Page
- **`src/pages/StudentProfile.tsx`** -- Page title, tab labels, section headings

### Enrollment Components
- **`src/components/enrollment/EnrollmentWizard.tsx`** -- Step labels, headings
- **`src/components/enrollment/EnrollmentForm.tsx`** -- Form labels, toast messages, confirmation text
- **`src/components/enrollment/steps/StudentInfoStep.tsx`** -- "Enter student's full name" -> "Enter learner's full name", section title
- **`src/components/enrollment/steps/AgreementStep.tsx`** -- Legal text: "student named above" -> "learner named above", etc.

### Curriculum Components
- **`src/components/curriculum/EnrollmentManagement.tsx`** -- "Auto-enroll students to subjects" -> "Auto-enroll learners to subjects"
- **`src/components/curriculum/PromoteStudentsWorkflow.tsx`** -- "Promote Students" -> "Promote Learners"
- **`src/components/curriculum/SubjectManagement.tsx`** -- Any student references

### Grade and Academic Components
- **`src/components/grades/GradesManagement.tsx`** -- "Select Student", labels
- **`src/components/grades/GradeApprovalQueue.tsx`** -- Any student text
- **`src/components/students/TransmutationManager.tsx`** -- Labels
- **`src/components/students/StudentSubjectsManager.tsx`** -- Headings

### LIS (Learner Information System)
- **`src/components/lis/LISPage.tsx`** -- Description text: "comprehensive student records" -> "comprehensive learner records"
- **`src/components/lis/LISStudentSearch.tsx`** -- Search placeholder, labels
- **`src/components/lis/LISStudentDetail.tsx`** -- Export menu labels
- **`src/components/lis/LISStudentOverview.tsx`** -- Section headings
- **`src/components/lis/LISAcademicHistory.tsx`** -- Any student text
- **`src/components/lis/LISIncidents.tsx`** -- Any student text

### Management Components
- **`src/components/management/AttendanceManagement.tsx`** -- "Student" column headers, labels
- **`src/components/management/AssignmentManagement.tsx`** -- Any student text
- **`src/components/management/ScheduleManagement.tsx`** -- Any student text

### Admin Components
- **`src/components/admin/AdminPanel.tsx`** -- "Reset Student Records" -> "Reset Learner Records", description text
- **`src/components/admin/DataQualityDashboard.tsx`** -- Validation labels referencing students
- **`src/components/admin/PermissionManagement.tsx`** -- Role descriptions: "Manage student records" -> "Manage learner records"
- **`src/components/admin/PrintableCredentialSlips.tsx`** -- Any student text
- **`src/components/admin/UserManagement.tsx`** -- Any student labels
- **`src/components/admin/SchoolAccessManager.tsx`** -- Any student text

### Import and Reports
- **`src/components/import/CSVImport.tsx`** -- "Import Students" -> "Import Learners", toast messages
- **`src/components/reports/ReportsManagement.tsx`** -- Report names/descriptions
- **`src/components/reports/reportTypes.ts`** -- Report category labels
- **`src/utils/qrBulkDownload.ts`** -- Toast messages: "No students selected" -> "No learners selected"

### Hooks (toast/error messages only)
- **`src/hooks/useStudents.ts`** -- Toast messages like "Student added", "Student updated"
- **`src/hooks/useStudentDocuments.ts`** -- Toast messages
- **`src/hooks/useStudentQRCode.ts`** -- Toast messages

### Student Portal Tabs
- **`src/components/portals/student/StudentDashboard.tsx`** -- Headings
- **`src/components/portals/student/StudentAttendanceTab.tsx`** -- Labels
- **`src/components/portals/student/StudentAssignmentsTab.tsx`** -- Labels
- **`src/components/portals/student/StudentExamsTab.tsx`** -- Labels

### Library
- **`src/components/library/LibraryPage.tsx`** -- "No books available for your grade level" and filter labels (code comments referencing "student" stay)

## Implementation Approach

1. Work through each file systematically, using search-and-replace on UI-visible strings only
2. Preserve all variable names, imports, database queries, route IDs, and CSS classes exactly as they are
3. Each replacement will be verified in context to avoid changing code identifiers
4. Estimated: ~45 files with text-only edits, no structural or logic changes

## What Will NOT Change

- File names (e.g., `StudentTable.tsx` stays)
- Component names (e.g., `StudentOverview` stays)
- Variable names (e.g., `totalStudents`, `students` stays)
- Database table/column names (`students`, `student_id`, `student_name`)
- Route IDs (`student-records`, `student-profile`)
- CSS class names (`student-bottom-nav`)
- The auto-generated `types.ts`
- Official DepEd form names in export menus (SF1, SF9, Annex 1)

