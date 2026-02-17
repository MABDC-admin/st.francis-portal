

## Insert 15 Teachers with Credentials and Add Credentials View to Teacher List

### Overview
1. Insert 15 teachers into the `teachers` table with grade level assignments
2. Create auth accounts for each using the `create-users` edge function with password `123456` and `@sfxsai.com` email domain
3. Link credentials in `user_credentials` with `teacher_id`
4. Create a `TeacherCredentialsTab` component (reusing the pattern from `StudentCredentialsTab`)
5. Add a credentials view button (Key icon) in the teacher table, visible only to admins, with a reset password function

### 1. Batch Insert Teachers via Edge Function

For each of the 15 teachers below, call the `create-users` edge function with `action: 'create_teacher'`, `password: '123456'`, and their `@sfxsai.com` email. Then insert a record in the `teachers` table and link `teacher_id` in `user_credentials`.

| Grade Level | Name | Email | Employee ID |
|-------------|------|-------|-------------|
| Kinder 1 | Loida B. Peteros | loida.peteros@sfxsai.com | TCH-001 |
| Grade 1 | Apple B. Cortes | apple.cortes@sfxsai.com | TCH-002 |
| Grade 1 | Jianne B. Briones | jianne.briones@sfxsai.com | TCH-003 |
| Grade 2 | Chemlie D. Yap | chemlie.yap@sfxsai.com | TCH-004 |
| Grade 2 | Johnin Mae P. Declaro | johnin.declaro@sfxsai.com | TCH-005 |
| Grade 3 | Melody Dawn M. Bisnar | melody.bisnar@sfxsai.com | TCH-006 |
| Grade 3 | Shaylene B. Manapsal | shaylene.manapsal@sfxsai.com | TCH-007 |
| Grade 4 | Joshua B. Munez | joshua.munez@sfxsai.com | TCH-008 |
| Grade 4 | Wenna Jane L. Caiwan | wenna.caiwan@sfxsai.com | TCH-009 |
| Grade 5 | Melirose D. Cerbo | melirose.cerbo@sfxsai.com | TCH-010 |
| Grade 5 | Syrah U. Ababat | syrah.ababat@sfxsai.com | TCH-011 |
| Grade 6 | Ronalyn B. Sual | ronalyn.sual@sfxsai.com | TCH-012 |
| Grade 6 | Ria D. Corpez | ria.corpez@sfxsai.com | TCH-013 |
| Grade 7 | Casandra U. Dante | casandra.dante@sfxsai.com | TCH-014 |
| Grade 7 | Alwin Marie P. Estremos | alwin.estremos@sfxsai.com | TCH-015 |

All teachers will use **password: `123456`** and **school: `SFXSAI`**.

### 2. New Component: `TeacherCredentialsTab`

Create `src/components/teachers/TeacherCredentialsTab.tsx` -- same structure as `StudentCredentialsTab`:
- Accepts `teacherId` prop
- Queries `user_credentials` where `teacher_id = teacherId`
- Shows email, temporary password (show/hide toggle), password status, and creation date
- Includes a **Reset Password** button with confirmation dialog
- Calls the existing `create-users` edge function with `action: 'reset_student_password'` (works for any user credential)

### 3. Update `TeacherManagement.tsx`

- Import `useAuth` from AuthContext
- Import the new `TeacherCredentialsTab`
- Add a credentials dialog state (`credentialsTeacher`)
- For admin users, add a **Key icon button** in each teacher row's actions column
- Clicking it opens a dialog showing the `TeacherCredentialsTab` for that teacher
- The Key button and column are only rendered when `role === 'admin'`

### Technical Details

**Teacher creation flow (per teacher):**
```typescript
// 1. Create auth account via edge function
const { data } = await supabase.functions.invoke('create-users', {
  body: { action: 'create_teacher', email: 'loida.peteros@sfxsai.com', password: '123456', fullName: 'Loida B. Peteros' }
});

// 2. Insert teacher record
const { data: teacher } = await supabase.from('teachers').insert({
  employee_id: 'TCH-001', full_name: 'Loida B. Peteros',
  email: 'loida.peteros@sfxsai.com', grade_level: 'Kinder 1', school: 'SFXSAI', user_id: data.userId
}).select('id').single();

// 3. Link credential to teacher
await supabase.from('user_credentials')
  .update({ teacher_id: teacher.id })
  .eq('user_id', data.userId);
```

**Files to create:**
- `src/components/teachers/TeacherCredentialsTab.tsx`

**Files to modify:**
- `src/components/teachers/TeacherManagement.tsx` (add Key button + credentials dialog for admin)

**No RLS changes needed** -- the existing policy already allows admin SELECT on `user_credentials`.

