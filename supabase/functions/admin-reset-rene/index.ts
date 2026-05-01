Deno.serve(async (): Promise<Response> => {
  const keys = Object.keys(Deno.env.toObject()).filter(k => !k.includes('SECRET') && !k.includes('KEY') && !k.includes('PASSWORD'));
  const hasService = !!Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const hasUrl = !!Deno.env.get('SUPABASE_URL');
  return new Response(JSON.stringify({ keys, hasService, hasUrl }), { headers: { 'Content-Type': 'application/json' } });
});
