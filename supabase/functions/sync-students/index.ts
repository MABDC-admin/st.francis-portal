import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate API key
    const apiKey = req.headers.get('x-api-key');
    const expectedApiKey = Deno.env.get('SYNC_API_KEY');

    if (!apiKey || apiKey !== expectedApiKey) {
      console.error('Unauthorized: Invalid or missing API key');
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized: Invalid API key' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body for optional filters
    let school: string | null = null;
    if (req.method === 'POST') {
      try {
        const body = await req.json();
        school = body.school || null;
      } catch {
        // No body or invalid JSON, proceed without filters
      }
    }

    // Create Supabase client with service role for full access
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Build query
    let query = supabase
      .from('students')
      .select('id, lrn, student_name, level, school, birth_date, age, gender, mother_contact, mother_maiden_name, father_contact, father_name, phil_address, uae_address, previous_school, photo_url, created_at, updated_at');

    // Apply school filter if provided
    if (school) {
      query = query.eq('school', school);
    }

    // Execute query
    const { data: students, error } = await query;

    if (error) {
      console.error('Database error:', error.message);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to fetch students' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Sync request successful: ${students?.length || 0} students fetched${school ? ` for school: ${school}` : ''}`);

    return new Response(
      JSON.stringify({
        success: true,
        count: students?.length || 0,
        students: students || [],
        synced_at: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Unexpected error:', errorMessage);
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
