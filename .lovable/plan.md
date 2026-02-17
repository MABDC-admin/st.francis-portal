

## Add Student Credentials View for Admin and Registrar

### Overview
Add a "Credentials" tab to the student detail views that displays the student's login credentials (email, temporary password, password changed status). This tab will only be visible to users with the **admin** or **registrar** role.

### Changes

#### 1. Database Migration -- Update RLS Policy
The current `user_credentials` SELECT policy only allows **admin** users. The registrar role needs to be added.

- Drop the existing "Only admins can view credentials" policy
- Create a new policy: "Admins and registrars can view credentials" allowing SELECT when `has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'registrar')`

#### 2. New Component: `StudentCredentialsTab`
Create `src/components/students/StudentCredentialsTab.tsx`:

- Accepts `studentId` as a prop
- Queries `user_credentials` table filtered by `student_id`
- Displays:
  - Email / Username (LRN)
  - Temporary password (with show/hide toggle)
  - Whether the password has been changed
  - Account creation date
- Shows a "No account found" message if the student has no credentials
- Uses a lock icon and security-themed styling to indicate sensitivity

#### 3. Update `StudentDetailPanel.tsx`
- Import `useAuth` from AuthContext
- Import the new `StudentCredentialsTab`
- Conditionally add a "Credentials" tab (with a Key icon) to the tab list only when the current user's role is `admin` or `registrar`
- Add the corresponding tab content panel

#### 4. Update `LISStudentDetail.tsx`
- Same changes as above: import `useAuth`, conditionally render the "Credentials" tab for admin/registrar roles

### Technical Details

**RLS policy SQL:**
```sql
DROP POLICY IF EXISTS "Only admins can view credentials" ON public.user_credentials;
CREATE POLICY "Admins and registrars can view credentials"
  ON public.user_credentials FOR SELECT
  TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'registrar'::app_role)
    OR user_id = auth.uid()
  );
```

**Files to create:**
- `src/components/students/StudentCredentialsTab.tsx`

**Files to modify:**
- `src/components/students/StudentDetailPanel.tsx` (add credentials tab for admin/registrar)
- `src/components/lis/LISStudentDetail.tsx` (add credentials tab for admin/registrar)
- New SQL migration (update RLS policy)

**Role check pattern (client-side, for tab visibility only -- RLS enforces server-side):**
```typescript
const { role } = useAuth();
const canViewCredentials = role === 'admin' || role === 'registrar';
```
