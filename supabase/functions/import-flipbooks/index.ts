import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Map grade_level integer to grade level string
function mapGradeLevel(gradeLevel: number): string[] {
  if (gradeLevel === 0) return ['Kinder'];
  if (gradeLevel <= 0) return [`Kinder ${Math.abs(gradeLevel)}`];
  if (gradeLevel >= 1 && gradeLevel <= 12) return [`Grade ${gradeLevel}`];
  return [`Grade ${gradeLevel}`];
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('Starting flipbooks import...');

    // Validate auth - require authenticated user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('No authorization header');
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create Supabase client for this project
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify user is admin
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } }
    });
    
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      console.error('Auth error:', authError);
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if user has admin role
    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (roleError || !roleData || roleData.role !== 'admin') {
      console.error('Not admin:', roleError);
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get the SYNC_API_KEY for authenticating with external API
    const syncApiKey = Deno.env.get('SYNC_API_KEY');
    if (!syncApiKey) {
      console.error('SYNC_API_KEY not configured');
      return new Response(JSON.stringify({ error: 'SYNC_API_KEY not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Flipbooks project URL - call their sync-books API
    const flipbooksApiUrl = 'https://kpzpuiiagtwajyrfmuzl.supabase.co/functions/v1/sync-books';
    
    console.log('Fetching from external API:', flipbooksApiUrl);

    const externalResponse = await fetch(flipbooksApiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': syncApiKey,
      },
    });

    if (!externalResponse.ok) {
      const errorText = await externalResponse.text();
      console.error('External API error:', externalResponse.status, errorText);
      return new Response(JSON.stringify({ 
        error: 'Failed to fetch from Flipbooks API',
        details: errorText,
        status: externalResponse.status
      }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const externalData = await externalResponse.json();
    console.log('Received books count:', externalData.books?.length || 0);

    if (!externalData.books || !Array.isArray(externalData.books)) {
      return new Response(JSON.stringify({ 
        error: 'Invalid response from Flipbooks API',
        received: externalData
      }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Map external books to our flipbooks schema
    const flipbooksToUpsert = externalData.books
      .filter((book: any) => book.status === 'ready') // Only sync ready books
      .map((book: any) => ({
        id: book.id,
        title: book.title,
        description: book.subject || null,
        cover_image_url: book.cover_url || null,
        flipbook_url: book.html5_url || `https://edu-flip-library.lovable.app/book/${book.id}`,
        grade_levels: mapGradeLevel(book.grade_level),
        school: null, // Available to all schools
        is_active: !book.is_teacher_only, // Hide teacher-only books from students
      }));

    console.log('Upserting flipbooks:', flipbooksToUpsert.length);

    if (flipbooksToUpsert.length === 0) {
      return new Response(JSON.stringify({ 
        success: true,
        imported: 0,
        message: 'No ready books found to import'
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Upsert flipbooks into our table
    const { data: upsertedData, error: upsertError } = await supabase
      .from('flipbooks')
      .upsert(flipbooksToUpsert, { 
        onConflict: 'id',
        ignoreDuplicates: false 
      })
      .select();

    if (upsertError) {
      console.error('Upsert error:', upsertError);
      return new Response(JSON.stringify({ 
        error: 'Failed to save flipbooks',
        details: upsertError.message
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Import completed successfully:', upsertedData?.length || 0);

    return new Response(JSON.stringify({ 
      success: true,
      imported: upsertedData?.length || 0,
      message: `Successfully imported ${upsertedData?.length || 0} flipbooks`
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Import error:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
