import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })

    const email = 'ivyann@sfxsai.com'
    const password = 'dargantes'

    // 1. Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: 'Ivy Ann' }
    })

    if (authError) {
      // If user already exists, fetch their ID
      if (authError.message?.includes('already been registered') || authError.message?.includes('already exists')) {
        const { data: { users }, error: listError } = await supabase.auth.admin.listUsers()
        if (listError) throw listError
        const existingUser = users?.find(u => u.email === email)
        if (!existingUser) throw new Error('User exists but could not be found')
        
        // Still update role and access
        await updateRoleAndAccess(supabase, existingUser.id)
        return new Response(JSON.stringify({ success: true, message: 'User already existed, role and access updated', userId: existingUser.id }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }
      throw authError
    }

    const userId = authData.user.id

    // 2. Update role and grant school access
    await updateRoleAndAccess(supabase, userId)

    return new Response(JSON.stringify({ success: true, message: 'Finance user created successfully', userId }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Error:', error)
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

async function updateRoleAndAccess(supabase: any, userId: string) {
  // Update user_roles to finance - check first
  const { data: existingRole } = await supabase
    .from('user_roles')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle()

  if (existingRole) {
    const { error: roleError } = await supabase
      .from('user_roles')
      .update({ role: 'finance' })
      .eq('user_id', userId)
    if (roleError) throw roleError
  } else {
    const { error: roleError } = await supabase
      .from('user_roles')
      .insert({ user_id: userId, role: 'finance' })
    if (roleError) throw roleError
  }

  // Get SFXSAI school ID
  const { data: school, error: schoolError } = await supabase
    .from('schools')
    .select('id')
    .eq('code', 'SFXSAI')
    .eq('is_active', true)
    .single()

  if (schoolError || !school) throw new Error('SFXSAI school not found')

  // Grant school access - check first, then insert or update
  const { data: existingAccess } = await supabase
    .from('user_school_access')
    .select('id')
    .eq('user_id', userId)
    .eq('school_id', school.id)
    .maybeSingle()

  if (existingAccess) {
    const { error: updateError } = await supabase
      .from('user_school_access')
      .update({ role: 'finance', is_active: true })
      .eq('id', existingAccess.id)
    if (updateError) throw updateError
  } else {
    const { error: insertError } = await supabase
      .from('user_school_access')
      .insert({ user_id: userId, school_id: school.id, role: 'finance', is_active: true })
    if (insertError) throw insertError
  }
}
