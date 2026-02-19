import { supabase } from '@/integrations/supabase/client';

/**
 * Setup function for the finance user ivyan@sfxsai.org
 * This ensures the user has proper school access and role assignments
 */
export async function setupFinanceUser() {
  const financeEmail = 'ivyan@sfxsai.org';
  
  try {
    // 1. Check if user exists in auth
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', financeEmail)
      .single();
    
    if (usersError || !users) {
      console.log('Finance user not found in profiles, needs to be created manually');
      // User needs to be created through the admin panel or auth system
      return { success: false, error: 'User not found. Please create user first through admin panel.' };
      

    }
    
    const userId = users.id;
    
    if (!userId) {
      return { success: false, error: 'Could not get user ID' };
    }
    
    // 2. Ensure user has finance role
    const { error: roleError } = await supabase
      .from('user_roles')
      .upsert({
        user_id: userId,
        role: 'finance'
      }, { onConflict: 'user_id' });
    
    if (roleError) {
      console.error('Error setting user role:', roleError);
      return { success: false, error: roleError.message };
    }
    
    // 3. Get SFXSAI school ID
    const { data: schools, error: schoolError } = await supabase
      .from('schools')
      .select('id')
      .eq('code', 'SFXSAI')
      .eq('is_active', true)
      .limit(1);
    
    if (schoolError || !schools || schools.length === 0) {
      console.error('SFXSAI school not found:', schoolError);
      return { success: false, error: 'SFXSAI school not found' };
    }
    
    const sfxsaiSchoolId = schools[0].id;
    
    // 4. Grant school access
    const { error: accessError } = await supabase
      .from('user_school_access')
      .upsert({
        user_id: userId,
        school_id: sfxsaiSchoolId,
        role: 'finance',
        is_active: true
      }, { 
        onConflict: 'user_id,school_id',
        ignoreDuplicates: false
      });
    
    if (accessError) {
      console.error('Error granting school access:', accessError);
      return { success: false, error: accessError.message };
    }
    
    console.log('Successfully set up finance user ivyan@sfxsai.org with SFXSAI access');
    return { success: true };
    
  } catch (error) {
    console.error('Error in setupFinanceUser:', error);
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Quick setup function that can be called from admin panel or CLI
 */
export async function quickSetupFinanceUser() {
  const result = await setupFinanceUser();
  if (result.success) {
    console.log('✅ Finance user setup completed successfully');
  } else {
    console.error('❌ Finance user setup failed:', result.error);
  }
  return result;
}