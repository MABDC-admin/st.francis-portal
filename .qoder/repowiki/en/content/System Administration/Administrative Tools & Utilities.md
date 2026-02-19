# Administrative Tools & Utilities

<cite>
**Referenced Files in This Document**
- [AdminPanel.tsx](file://src/components/admin/AdminPanel.tsx)
- [AdminPinModal.tsx](file://src/components/admin/AdminPinModal.tsx)
- [ImpersonatePage.tsx](file://src/components/admin/ImpersonatePage.tsx)
- [DataQualityDashboard.tsx](file://src/components/admin/DataQualityDashboard.tsx)
- [UserManagement.tsx](file://src/components/admin/UserManagement.tsx)
- [PermissionManagement.tsx](file://src/components/admin/PermissionManagement.tsx)
- [SchoolManagement.tsx](file://src/components/admin/SchoolManagement.tsx)
- [ActivityLogs.tsx](file://src/components/admin/ActivityLogs.tsx)
- [SchoolSettings.tsx](file://src/components/admin/SchoolSettings.tsx)
- [GrantAccessDialog.tsx](file://src/components/admin/GrantAccessDialog.tsx)
- [RoleAssignmentDialog.tsx](file://src/components/admin/RoleAssignmentDialog.tsx)
- [SchoolAccessManager.tsx](file://src/components/admin/SchoolAccessManager.tsx)
- [PrintableCredentialSlips.tsx](file://src/components/admin/PrintableCredentialSlips.tsx)
- [AuthContext.tsx](file://src/contexts/AuthContext.tsx)
- [client.ts](file://src/integrations/supabase/client.ts)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [Project Structure](#project-structure)
3. [Core Components](#core-components)
4. [Architecture Overview](#architecture-overview)
5. [Detailed Component Analysis](#detailed-component-analysis)
6. [Dependency Analysis](#dependency-analysis)
7. [Performance Considerations](#performance-considerations)
8. [Troubleshooting Guide](#troubleshooting-guide)
9. [Conclusion](#conclusion)

## Introduction
This document describes the administrative tools and utilities available in the portal. It covers the admin panel interface, administrative PIN protection, user impersonation, data quality monitoring, administrative workflow automation, bulk operations, and system maintenance utilities. It also explains impersonation procedures, administrative security measures, audit trails, and administrative access controls.

## Project Structure
Administrative features are organized under the admin folder and integrated with Supabase for authentication, authorization, and data operations. The admin panel aggregates multiple specialized components for user management, permissions, schools, data quality, activity logs, and settings.

```mermaid
graph TB
AdminPanel["AdminPanel.tsx"]
AdminPin["AdminPinModal.tsx"]
Impersonate["ImpersonatePage.tsx"]
UserMgmt["UserManagement.tsx"]
PermMgmt["PermissionManagement.tsx"]
SchoolMgmt["SchoolManagement.tsx"]
DataQual["DataQualityDashboard.tsx"]
ActLogs["ActivityLogs.tsx"]
SchoolSettings["SchoolSettings.tsx"]
AuthCtx["AuthContext.tsx"]
Supabase["Supabase Client (client.ts)"]
AdminPanel --> UserMgmt
AdminPanel --> PermMgmt
AdminPanel --> SchoolMgmt
AdminPanel --> DataQual
AdminPanel --> ActLogs
AdminPanel --> SchoolSettings
AdminPanel --> AdminPin
AdminPanel --> Impersonate
UserMgmt --> Supabase
PermMgmt --> Supabase
SchoolMgmt --> Supabase
DataQual --> Supabase
ActLogs --> Supabase
SchoolSettings --> Supabase
Impersonate --> AuthCtx
AuthCtx --> Supabase
```

**Diagram sources**
- [AdminPanel.tsx](file://src/components/admin/AdminPanel.tsx#L1-L229)
- [AdminPinModal.tsx](file://src/components/admin/AdminPinModal.tsx#L1-L120)
- [ImpersonatePage.tsx](file://src/components/admin/ImpersonatePage.tsx#L1-L236)
- [UserManagement.tsx](file://src/components/admin/UserManagement.tsx#L1-L881)
- [PermissionManagement.tsx](file://src/components/admin/PermissionManagement.tsx#L1-L277)
- [SchoolManagement.tsx](file://src/components/admin/SchoolManagement.tsx#L1-L464)
- [DataQualityDashboard.tsx](file://src/components/admin/DataQualityDashboard.tsx#L1-L403)
- [ActivityLogs.tsx](file://src/components/admin/ActivityLogs.tsx#L1-L312)
- [SchoolSettings.tsx](file://src/components/admin/SchoolSettings.tsx#L1-L614)
- [AuthContext.tsx](file://src/contexts/AuthContext.tsx#L1-L216)
- [client.ts](file://src/integrations/supabase/client.ts#L1-L17)

**Section sources**
- [AdminPanel.tsx](file://src/components/admin/AdminPanel.tsx#L1-L229)
- [client.ts](file://src/integrations/supabase/client.ts#L1-L17)

## Core Components
- Admin Panel: Central hub with tabs for Users, Permissions, Schools, Data Quality, Logs, Settings, and System utilities.
- Administrative PIN Protection: Modal requiring a fixed PIN to unlock restricted admin features.
- User Management: Create, reset, and manage user accounts; bulk operations; credential printing and QR downloads.
- Permission Management: Assign and change user roles; manage school access; role change logging.
- School Management: CRUD for schools; activation/deactivation; search and filtering.
- Data Quality Dashboard: Scans for missing/invalid/incomplete data; duplicate detection; resolution tracking.
- Activity Logs: Monitor login/logout/failure events; export to CSV.
- School Settings: Manage branding, themes, and multiple school profiles.
- Impersonation: Admin-only ability to view the system as another user with audit logging.
- Access Control: Role-based access enforcement via AuthContext and dialogs.

**Section sources**
- [AdminPanel.tsx](file://src/components/admin/AdminPanel.tsx#L1-L229)
- [AdminPinModal.tsx](file://src/components/admin/AdminPinModal.tsx#L1-L120)
- [UserManagement.tsx](file://src/components/admin/UserManagement.tsx#L1-L881)
- [PermissionManagement.tsx](file://src/components/admin/PermissionManagement.tsx#L1-L277)
- [SchoolManagement.tsx](file://src/components/admin/SchoolManagement.tsx#L1-L464)
- [DataQualityDashboard.tsx](file://src/components/admin/DataQualityDashboard.tsx#L1-L403)
- [ActivityLogs.tsx](file://src/components/admin/ActivityLogs.tsx#L1-L312)
- [SchoolSettings.tsx](file://src/components/admin/SchoolSettings.tsx#L1-L614)
- [ImpersonatePage.tsx](file://src/components/admin/ImpersonatePage.tsx#L1-L236)
- [AuthContext.tsx](file://src/contexts/AuthContext.tsx#L1-L216)

## Architecture Overview
Administrative features rely on Supabase for authentication, authorization, and data persistence. The AuthContext centralizes role and impersonation state, while individual admin components coordinate with Supabase to perform operations and maintain audit trails.

```mermaid
sequenceDiagram
participant Admin as "Admin User"
participant Panel as "AdminPanel"
participant Pin as "AdminPinModal"
participant Ctx as "AuthContext"
participant Comp as "Admin Component"
participant DB as "Supabase"
Admin->>Panel : Open Admin Panel
Panel->>Pin : Require PIN for restricted actions
Pin-->>Panel : PIN verified or blocked
Admin->>Comp : Perform action (e.g., reset users)
Comp->>DB : Execute operation
DB-->>Comp : Result
Comp-->>Admin : Feedback
Admin->>Ctx : Impersonate user (admin-only)
Ctx-->>Admin : View as target user with audit logs
```

**Diagram sources**
- [AdminPanel.tsx](file://src/components/admin/AdminPanel.tsx#L1-L229)
- [AdminPinModal.tsx](file://src/components/admin/AdminPinModal.tsx#L1-L120)
- [AuthContext.tsx](file://src/contexts/AuthContext.tsx#L1-L216)
- [client.ts](file://src/integrations/supabase/client.ts#L1-L17)

## Detailed Component Analysis

### Admin Panel
- Purpose: Unified administrative interface with tabbed navigation for core tasks.
- Key features:
  - Danger zone: Reset student records with confirmation.
  - System utilities: Refresh cached data across the app.
  - Tabbed sections: Users, Permissions, Schools, Data Quality, Logs, Settings, System.

```mermaid
flowchart TD
Start(["Open Admin Panel"]) --> ChooseTab["Select Admin Tab"]
ChooseTab --> Action{"Action Required?"}
Action --> |Reset Students| Confirm["Confirm 'DELETE ALL'"]
Confirm --> |Valid| Delete["Delete all student records"]
Confirm --> |Invalid| Abort["Abort and reset"]
Action --> |Refresh Data| Invalidate["Invalidate queries and refresh"]
Delete --> Notify["Notify success/error"]
Invalidate --> Notify
Abort --> End(["Done"])
Notify --> End
```

**Diagram sources**
- [AdminPanel.tsx](file://src/components/admin/AdminPanel.tsx#L22-L46)

**Section sources**
- [AdminPanel.tsx](file://src/components/admin/AdminPanel.tsx#L1-L229)

### Administrative PIN Protection
- Purpose: Protect sensitive admin actions with a fixed PIN and attempt limits.
- Behavior:
  - Modal prompts for PIN input.
  - Enforces 6-digit PIN; rejects invalid entries.
  - Blocks after three failed attempts.
  - Success grants access to protected features.

```mermaid
flowchart TD
A["Open Protected Feature"] --> B["Show PIN Modal"]
B --> C{"PIN Entered?"}
C --> |No| D["Close Modal"]
C --> |Yes| E{"PIN == Expected?"}
E --> |Yes| F["Grant Access and Close"]
E --> |No| G["Increment Attempts<br/>Show Error"]
G --> H{"Attempts < 3?"}
H --> |Yes| B
H --> |No| I["Block and Close"]
```

**Diagram sources**
- [AdminPinModal.tsx](file://src/components/admin/AdminPinModal.tsx#L21-L41)

**Section sources**
- [AdminPinModal.tsx](file://src/components/admin/AdminPinModal.tsx#L1-L120)

### User Management
- Purpose: Create and manage user accounts, roles, and credentials.
- Key capabilities:
  - Quick creation of admin/registrar accounts.
  - Bulk student account creation from existing student records.
  - Reset all student accounts with confirmation.
  - Reset individual student passwords via serverless function.
  - Delete user accounts via serverless function.
  - Print credential slips and bulk QR downloads.
  - Filter and search across roles, schools, and grade levels.

```mermaid
sequenceDiagram
participant Admin as "Admin"
participant UM as "UserManagement"
participant Func as "Supabase Functions"
participant DB as "Supabase"
Admin->>UM : Create admin/registrar
UM->>Func : Invoke create-users (create_admin/create_registrar)
Func->>DB : Insert profile and role
DB-->>Func : OK
Func-->>UM : Success message
UM-->>Admin : Updated list
Admin->>UM : Bulk create students
UM->>Func : Invoke create-users (bulk_create_students)
Func->>DB : Create accounts for matched students
DB-->>Func : OK
Func-->>UM : Success message
UM-->>Admin : Updated list
Admin->>UM : Reset student accounts
UM->>Func : Invoke create-users (reset_student_accounts)
Func->>DB : Remove accounts
DB-->>Func : OK
Func-->>UM : Success message
UM-->>Admin : Updated list
```

**Diagram sources**
- [UserManagement.tsx](file://src/components/admin/UserManagement.tsx#L271-L337)

**Section sources**
- [UserManagement.tsx](file://src/components/admin/UserManagement.tsx#L1-L881)

### Permission Management
- Purpose: Manage user roles and school access.
- Features:
  - Role assignment with optional reason and audit logging.
  - Bulk grant access to users per school with role selection.
  - Toggle access enable/disable and revoke access.
  - Role reference guide and filtering by role.

```mermaid
sequenceDiagram
participant Admin as "Admin"
participant PM as "PermissionManagement"
participant RAM as "SchoolAccessManager"
participant DB as "Supabase"
Admin->>PM : Change user role
PM->>DB : Upsert user_roles
PM->>DB : Insert role_change_logs
DB-->>PM : OK
PM-->>Admin : Success toast
Admin->>RAM : Grant access (multi-user)
RAM->>DB : Insert user_school_access (skipping existing)
DB-->>RAM : OK
RAM-->>Admin : Success toast
```

**Diagram sources**
- [PermissionManagement.tsx](file://src/components/admin/PermissionManagement.tsx#L115-L118)
- [RoleAssignmentDialog.tsx](file://src/components/admin/RoleAssignmentDialog.tsx#L58-L104)
- [SchoolAccessManager.tsx](file://src/components/admin/SchoolAccessManager.tsx#L150-L190)

**Section sources**
- [PermissionManagement.tsx](file://src/components/admin/PermissionManagement.tsx#L1-L277)
- [RoleAssignmentDialog.tsx](file://src/components/admin/RoleAssignmentDialog.tsx#L1-L209)
- [SchoolAccessManager.tsx](file://src/components/admin/SchoolAccessManager.tsx#L1-L349)
- [GrantAccessDialog.tsx](file://src/components/admin/GrantAccessDialog.tsx#L1-L203)

### School Management
- Purpose: Manage school records and statuses.
- Features:
  - Create/edit/delete schools.
  - Activate/deactivate schools.
  - Search and filter by name/code/email.
  - Automatic cache invalidation after mutations.

**Section sources**
- [SchoolManagement.tsx](file://src/components/admin/SchoolManagement.tsx#L1-L464)

### Data Quality Dashboard
- Purpose: Detect and resolve data quality issues across student records.
- Features:
  - Scan for missing birthdates, invalid contacts, incomplete requirements, and duplicates.
  - Filter by issue type and resolution status.
  - Resolve issues with audit metadata.
  - Export scan results and resolutions.

```mermaid
flowchart TD
S["Run Scan"] --> Q["Query students for school"]
Q --> R1["Check missing birthdate"]
Q --> R2["Validate guardian contacts"]
Q --> R3["Check incomplete requirements"]
Q --> R4["Detect duplicates by LRN"]
R1 --> I["Insert issues"]
R2 --> I
R3 --> I
R4 --> I
I --> Done["Notify and refresh issues"]
```

**Diagram sources**
- [DataQualityDashboard.tsx](file://src/components/admin/DataQualityDashboard.tsx#L92-L219)

**Section sources**
- [DataQualityDashboard.tsx](file://src/components/admin/DataQualityDashboard.tsx#L1-L403)

### Activity Logs
- Purpose: Monitor authentication activity and export logs.
- Features:
  - Filter by action (login/logout/failed login).
  - Date range filtering.
  - Export to CSV with formatted timestamps.

**Section sources**
- [ActivityLogs.tsx](file://src/components/admin/ActivityLogs.tsx#L1-L312)

### School Settings
- Purpose: Configure branding and themes for multiple schools.
- Features:
  - Select school profile and update details.
  - Upload and preview school logo.
  - Apply color themes with persistent storage.
  - Create/delete school profiles.

**Section sources**
- [SchoolSettings.tsx](file://src/components/admin/SchoolSettings.tsx#L1-L614)

### Impersonation
- Purpose: Allow administrators to view the system as another user for support and troubleshooting.
- Security:
  - Admin-only capability enforced.
  - Session storage persists impersonation target.
  - Audit logs record impersonation start/stop.

```mermaid
sequenceDiagram
participant Admin as "Admin"
participant Ctx as "AuthContext"
participant UI as "UI Components"
participant DB as "Supabase"
Admin->>Ctx : impersonate(target)
Ctx->>DB : log audit (impersonation_start)
Ctx-->>UI : Update role/user to target
UI-->>Admin : Rendered as target user
Admin->>Ctx : stopImpersonating()
Ctx->>DB : log audit (impersonation_stop)
Ctx-->>UI : Restore original role/user
```

**Diagram sources**
- [ImpersonatePage.tsx](file://src/components/admin/ImpersonatePage.tsx#L85-L97)
- [AuthContext.tsx](file://src/contexts/AuthContext.tsx#L163-L189)

**Section sources**
- [ImpersonatePage.tsx](file://src/components/admin/ImpersonatePage.tsx#L1-L236)
- [AuthContext.tsx](file://src/contexts/AuthContext.tsx#L1-L216)

### Administrative Access Controls and Session Management
- Role-based access:
  - Role checks via AuthContext.
  - Admin-only impersonation and access grant features.
- Session management:
  - Supabase client configured with local storage and token refresh.
  - Impersonation state persisted in sessionStorage.

**Section sources**
- [AuthContext.tsx](file://src/contexts/AuthContext.tsx#L1-L216)
- [client.ts](file://src/integrations/supabase/client.ts#L1-L17)

### Audit Trail for Administrative Actions
- Logged actions include:
  - Login attempts (success/failure).
  - Logout events.
  - Role changes with reasons.
  - Impersonation start/stop.
  - School access grants/revocations.

**Section sources**
- [ActivityLogs.tsx](file://src/components/admin/ActivityLogs.tsx#L1-L312)
- [RoleAssignmentDialog.tsx](file://src/components/admin/RoleAssignmentDialog.tsx#L79-L93)
- [AuthContext.tsx](file://src/contexts/AuthContext.tsx#L169-L188)

## Dependency Analysis
Administrative components depend on Supabase for authentication, authorization, and data operations. The AuthContext centralizes role and impersonation state, ensuring consistent access control across the admin suite.

```mermaid
graph TB
AuthCtx["AuthContext.tsx"]
AdminPanel["AdminPanel.tsx"]
UserMgmt["UserManagement.tsx"]
PermMgmt["PermissionManagement.tsx"]
SchoolMgmt["SchoolManagement.tsx"]
DataQual["DataQualityDashboard.tsx"]
ActLogs["ActivityLogs.tsx"]
SchoolSettings["SchoolSettings.tsx"]
Impersonate["ImpersonatePage.tsx"]
Supabase["Supabase Client (client.ts)"]
AuthCtx --> Supabase
AdminPanel --> Supabase
UserMgmt --> Supabase
PermMgmt --> Supabase
SchoolMgmt --> Supabase
DataQual --> Supabase
ActLogs --> Supabase
SchoolSettings --> Supabase
Impersonate --> AuthCtx
```

**Diagram sources**
- [AuthContext.tsx](file://src/contexts/AuthContext.tsx#L1-L216)
- [AdminPanel.tsx](file://src/components/admin/AdminPanel.tsx#L1-L229)
- [client.ts](file://src/integrations/supabase/client.ts#L1-L17)

**Section sources**
- [AuthContext.tsx](file://src/contexts/AuthContext.tsx#L1-L216)
- [client.ts](file://src/integrations/supabase/client.ts#L1-L17)

## Performance Considerations
- Use caching and query invalidation judiciously to avoid stale data in admin views.
- Batch operations (e.g., bulk account creation) reduce repeated network calls.
- Limit log exports to reasonable date ranges to prevent large CSV generation.
- Debounce search inputs in admin dashboards to minimize unnecessary queries.

## Troubleshooting Guide
- PIN modal blocks repeated attempts: After three failures, the modal closes and further attempts are blocked until reopened.
- Reset actions require explicit confirmation: Type the exact confirmation text to proceed with destructive operations.
- Bulk operations may skip existing records: When granting access, existing grants are skipped to avoid duplicates.
- Audit logs not appearing: Ensure logging functions are invoked and Supabase tables exist for activity and role change logs.
- Impersonation not working: Verify the current user has admin role and that the impersonation target is valid.

**Section sources**
- [AdminPinModal.tsx](file://src/components/admin/AdminPinModal.tsx#L35-L39)
- [AdminPanel.tsx](file://src/components/admin/AdminPanel.tsx#L22-L46)
- [SchoolAccessManager.tsx](file://src/components/admin/SchoolAccessManager.tsx#L162-L164)
- [ActivityLogs.tsx](file://src/components/admin/ActivityLogs.tsx#L81-L84)
- [AuthContext.tsx](file://src/contexts/AuthContext.tsx#L163-L167)

## Conclusion
The administrative toolkit provides a comprehensive set of utilities for managing users, permissions, schools, data quality, and system settings. Built-in security measures, including PIN protection and impersonation logging, ensure accountability. Bulk operations and audit trails streamline administration while maintaining transparency and control.