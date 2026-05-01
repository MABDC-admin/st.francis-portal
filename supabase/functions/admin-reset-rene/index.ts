import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

Deno.serve(async (): Promise<Response> => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { data: list, error: listErr } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
    if (listErr) throw listErr;
    const user = list.users.find(u => u.email?.toLowerCase() === 'rene@sfxsai.com');
    if (!user) return new Response(JSON.stringify({ error: 'user not found' }), { status: 404 });

    const { error: updErr } = await supabase.auth.admin.updateUserById(user.id, { password: 'Antonio@@1963' });
    if (updErr) throw updErr;

    return new Response(JSON.stringify({ success: true, userId: user.id, email: user.email }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const err = error as Error;
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});
