/**
 * create-users — Standardized with shared utilities
 *
 * Handles bulk and individual user creation for various roles (admin, teacher, student, etc.).
 * Includes secure password generation and gracefull handling of existing users.
 */
import {
  handleCors,
  jsonResponse,
  errorResponse,
  createServiceClient,
} from '../_shared/response.ts';

interface CreateUserRequest {
  action: 'create_admin' | 'create_registrar' | 'create_teacher' | 'create_finance' | 'create_principal' | 'create_it' | 'bulk_create_students' | 'reset_student_accounts' | 'create_single_student' | 'reset_student_password' | 'delete_account';
  email?: string;
  password?: string;
  fullName?: string;
  studentId?: string;
  studentLrn?: string;
  studentName?: string;
  studentSchool?: string;
  credentialId?: string;
  userId?: string;
  school?: string;
  gradeLevel?: string;
}

// Generate a cryptographically secure random password
function generateSecurePassword(length = 12): string {
  const uppercase = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lowercase = 'abcdefghjkmnpqrstuvwxyz';
  const numbers = '23456789';
  const special = '!@#$%';
  const all = uppercase + lowercase + numbers + special;

  const array = new Uint8Array(length);
  crypto.getRandomValues(array);

  let password = '';
  password += uppercase[array[0] % uppercase.length];
  password += lowercase[array[1] % lowercase.length];
  password += numbers[array[2] % numbers.length];
  password += special[array[3] % special.length];

  for (let i = 4; i < length; i++) {
    password += all[array[i] % all.length];
  }

  return password.split('').sort(() => (crypto.getRandomValues(new Uint8Array(1))[0] % 2) - 0.5).join('');
}

function generateEmail(lrn: string, school?: string | null): string {
  const cleanLrn = lrn.replace(/[^a-zA-Z0-9]/g, '');
  return `${cleanLrn}@sfxsai.org`;
}

Deno.serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const supabaseAdmin = createServiceClient();
    const { action, email, password, fullName, studentId, studentLrn, studentName, studentSchool, credentialId, userId, school, gradeLevel }: CreateUserRequest = await req.json();

    console.log(`Processing action: ${action}`);

    // Action group: Create Staff/Admin
    if (['create_admin', 'create_registrar', 'create_teacher', 'create_finance', 'create_principal', 'create_it'].includes(action)) {
      const generatedPassword = password || generateSecurePassword();

      if (!email) return errorResponse('Email required', 400);

      const roleMap: Record<string, string> = {
        create_admin: 'admin',
        create_registrar: 'registrar',
        create_teacher: 'teacher',
        create_finance: 'finance',
        create_principal: 'principal',
        create_it: 'it',
      };
      const role = roleMap[action];

      let authUserId: string;
      const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password: generatedPassword,
        email_confirm: true,
        user_metadata: { full_name: fullName || email.split('@')[0] },
      });

      if (userError) {
        if (userError.message?.includes('already been registered')) {
          const { data: { users } } = await supabaseAdmin.auth.admin.listUsers();
          const existingUser = users?.find(u => u.email === email);
          if (existingUser) {
            authUserId = existingUser.id;
            console.log(`User ${email} already exists, updating role`);
          } else {
            return errorResponse('User exists but could not be found', 400);
          }
        } else {
          return errorResponse(userError.message, 400);
        }
      } else {
        authUserId = userData.user.id;
      }

      console.log(`User ready: ${authUserId}`);

      await supabaseAdmin.from('user_roles').upsert({ user_id: authUserId, role }, { onConflict: 'user_id' });
      await supabaseAdmin.from('profiles').upsert({ id: authUserId, email, full_name: fullName || email.split('@')[0] }, { onConflict: 'id' });

      await supabaseAdmin.from('user_credentials').upsert({
        user_id: authUserId,
        email,
        temp_password: generatedPassword,
        role,
      }, { onConflict: 'user_id' });

      return jsonResponse({
        success: true,
        message: `${role} account created successfully`,
        userId: authUserId
      });
    }

    // Action: Bulk Create Students
    if (action === 'bulk_create_students') {
      let query = supabaseAdmin.from('students').select('id, student_name, lrn, level, school');
      if (school && school !== 'all') query = query.eq('school', school);
      if (gradeLevel && gradeLevel !== 'all') query = query.eq('level', gradeLevel);

      const { data: students, error: studentsError } = await query;
      if (studentsError) return errorResponse(studentsError.message, 400);

      const { data: existingCreds } = await supabaseAdmin.from('user_credentials').select('student_id').not('student_id', 'is', null);
      const existingStudentIds = new Set(existingCreds?.map(c => c.student_id) || []);
      const studentsToCreate = students?.filter(s => !existingStudentIds.has(s.id)) || [];

      console.log(`Creating accounts for ${studentsToCreate.length} students`);

      const results = { created: 0, failed: 0, errors: [] as string[] };

      for (const student of studentsToCreate) {
        try {
          const email = generateEmail(student.lrn, student.school);
          const password = generateSecurePassword(10);
          let authUserId: string;

          const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { full_name: student.student_name },
          });

          if (userError) {
            if (userError.message?.includes('already been registered')) {
              const { data: { users } } = await supabaseAdmin.auth.admin.listUsers();
              const existingUser = users?.find(u => u.email === email);
              if (existingUser) {
                authUserId = existingUser.id;
              } else {
                results.failed++;
                results.errors.push(`${student.student_name}: User exists but not found`);
                continue;
              }
            } else {
              results.failed++;
              results.errors.push(`${student.student_name}: ${userError.message}`);
              continue;
            }
          } else {
            authUserId = userData.user.id;
          }

          await supabaseAdmin.from('user_roles').update({ role: 'student' }).eq('user_id', authUserId);
          await supabaseAdmin.from('user_credentials').insert({
            user_id: authUserId,
            email: student.lrn,
            temp_password: password,
            role: 'student',
            student_id: student.id,
          });

          results.created++;
        } catch (err) {
          console.error(`Unexpected error for ${student.student_name}:`, err);
          results.failed++;
          results.errors.push(`${student.student_name}: Unexpected error`);
        }
      }

      return jsonResponse({
        success: true,
        message: `Created ${results.created} student accounts, ${results.failed} failed`,
        ...results
      });
    }

    // Action: Reset all student accounts
    if (action === 'reset_student_accounts') {
      const { data: studentCreds, error: fetchError } = await supabaseAdmin
        .from('user_credentials')
        .select('user_id, id')
        .eq('role', 'student');

      if (fetchError) return errorResponse(fetchError.message, 400);

      let deleted = 0;
      let failed = 0;

      for (const cred of studentCreds || []) {
        try {
          if (cred.user_id) {
            const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(cred.user_id);
            if (deleteError) {
              failed++;
              continue;
            }
          }
          await supabaseAdmin.from('user_credentials').delete().eq('id', cred.id);
          deleted++;
        } catch {
          failed++;
        }
      }

      return jsonResponse({
        success: true,
        message: `Deleted ${deleted} student accounts${failed > 0 ? `, ${failed} failed` : ''}`,
        deleted,
        failed
      });
    }

    // Action: Create Single Student
    if (action === 'create_single_student') {
      if (!studentId || !studentLrn || !studentName) return errorResponse('Student ID, LRN, and name are required', 400);

      const { data: existingCred } = await supabaseAdmin.from('user_credentials').select('id').eq('student_id', studentId).single();
      if (existingCred) return errorResponse('Student already has an account', 400);

      const generatedEmail = generateEmail(studentLrn, studentSchool);
      const generatedPassword = generateSecurePassword(10);
      let authUserId: string;

      const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
        email: generatedEmail,
        password: generatedPassword,
        email_confirm: true,
        user_metadata: { full_name: studentName },
      });

      if (userError) {
        if (userError.message?.includes('already been registered')) {
          const { data: { users } } = await supabaseAdmin.auth.admin.listUsers();
          const existingUser = users?.find(u => u.email === generatedEmail);
          if (existingUser) {
            authUserId = existingUser.id;
          } else {
            return errorResponse('Auth user exists but could not be found', 400);
          }
        } else {
          return errorResponse(userError.message, 400);
        }
      } else {
        authUserId = userData.user.id;
      }

      await supabaseAdmin.from('user_roles').update({ role: 'student' }).eq('user_id', authUserId);
      await supabaseAdmin.from('user_credentials').insert({
        user_id: authUserId,
        email: studentLrn,
        temp_password: generatedPassword,
        role: 'student',
        student_id: studentId,
      });

      return jsonResponse({
        success: true,
        message: 'Student account created successfully',
        username: studentLrn,
        password: generatedPassword,
      });
    }

    // Action: Reset student password
    if (action === 'reset_student_password') {
      if (!credentialId || !userId) return errorResponse('Credential ID and User ID are required', 400);

      const newPassword = generateSecurePassword(10);
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(userId, { password: newPassword });

      if (updateError) {
        if (updateError.message?.includes('User not found') || updateError.status === 404) {
          await supabaseAdmin.from('user_credentials').delete().eq('id', credentialId);
          return errorResponse('Account no longer exists. Credential has been removed.', 400, 'ORPHANED_CREDENTIAL');
        }
        return errorResponse(updateError.message, 400);
      }

      const { error: credError } = await supabaseAdmin
        .from('user_credentials')
        .update({ temp_password: newPassword, password_changed: false })
        .eq('id', credentialId);

      if (credError) return errorResponse(credError.message, 400);

      return jsonResponse({
        success: true,
        message: 'Password reset successfully',
        newPassword,
      });
    }

    // Action: Delete Account
    if (action === 'delete_account') {
      if (!credentialId || !userId) return errorResponse('Credential ID and User ID are required', 400);

      const { error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(userId);
      if (deleteAuthError && !deleteAuthError.message?.includes('User not found') && deleteAuthError.status !== 404) {
        return errorResponse(deleteAuthError.message, 400);
      }

      const { error: deleteCredError } = await supabaseAdmin.from('user_credentials').delete().eq('id', credentialId);
      if (deleteCredError) return errorResponse(deleteCredError.message, 400);

      return jsonResponse({ success: true, message: 'Account deleted successfully' });
    }

    return errorResponse('Invalid action', 400);

  } catch (error) {
    const err = error as Error;
    console.error('Error in create-users function:', err);
    return errorResponse(err.message || 'Internal server error', 500);
  }
});
