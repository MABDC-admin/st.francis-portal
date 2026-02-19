/**
 * create-finance-user — Standardized with shared utilities
 *
 * One-off setup function to create/reset the finance user account.
 * WARNING: Contains hardcoded credentials — intended for initial setup only.
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import {
  handleCors,
  jsonResponse,
  errorResponse,
  createServiceClient,
} from '../_shared/response.ts';

Deno.serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const supabase = createServiceClient();

    const email = 'ivyann@sfxsai.com';
    const password = 'dargantes';

    // 1. Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: 'Ivy Ann' },
    });

    if (authError) {
      // If user already exists, fetch and update
      if (authError.message?.includes('already been registered') || authError.message?.includes('already exists')) {
        const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
        if (listError) throw listError;
        const existingUser = users?.find((u: any) => u.email === email);
        if (!existingUser) throw new Error('User exists but could not be found');

        const { error: pwError } = await supabase.auth.admin.updateUserById(existingUser.id, {
          password,
        });
        if (pwError) throw pwError;

        await updateRoleAndAccess(supabase, existingUser.id);
        return jsonResponse({ message: 'User password reset and role updated', userId: existingUser.id });
      }
      throw authError;
    }

    const userId = authData.user.id;
    await updateRoleAndAccess(supabase, userId);

    return jsonResponse({ message: 'Finance user created successfully', userId });
  } catch (error) {
    const err = error as Error;
    console.error('Error:', err);
    return errorResponse(err.message || 'Internal server error', 400);
  }
});

async function updateRoleAndAccess(supabase: any, userId: string) {
  // Upsert role
  const { data: existingRole } = await supabase
    .from('user_roles')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle();

  if (existingRole) {
    const { error } = await supabase.from('user_roles').update({ role: 'finance' }).eq('user_id', userId);
    if (error) throw error;
  } else {
    const { error } = await supabase.from('user_roles').insert({ user_id: userId, role: 'finance' });
    if (error) throw error;
  }

  // Get SFXSAI school
  const { data: school, error: schoolError } = await supabase
    .from('schools')
    .select('id')
    .eq('code', 'SFXSAI')
    .eq('is_active', true)
    .single();

  if (schoolError || !school) throw new Error('SFXSAI school not found');

  // Upsert school access
  const { data: existingAccess } = await supabase
    .from('user_school_access')
    .select('id')
    .eq('user_id', userId)
    .eq('school_id', school.id)
    .maybeSingle();

  if (existingAccess) {
    const { error } = await supabase
      .from('user_school_access')
      .update({ role: 'finance', is_active: true })
      .eq('id', existingAccess.id);
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from('user_school_access')
      .insert({ user_id: userId, school_id: school.id, role: 'finance', is_active: true });
    if (error) throw error;
  }
}
