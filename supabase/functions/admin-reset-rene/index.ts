import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

Deno.serve(async (): Promise<Response> => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const userId = '7d022361-e814-4d03-ae8d-3c0f58e2c56c';
    const { error: updErr } = await supabase.auth.admin.updateUserById(userId, { password: 'Antonio@@1963' });
    if (updErr) throw updErr;

    return new Response(JSON.stringify({ success: true, userId }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const err = error as Error;
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});
