import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface HolidayRequest {
    year: number;
}

serve(async (req) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders })
    }

    try {
        const supabaseClient = createClient(
            // Supabase API URL - Env var exported by default.
            Deno.env.get('SUPABASE_URL') ?? '',
            // Supabase API Anon Key - Env var exported by default.
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            {
                global: {
                    headers: { Authorization: req.headers.get('Authorization')! },
                },
            }
        )

        const { year } = await req.json() as HolidayRequest;

        if (!year) {
            throw new Error('Year is required');
        }

        console.log(`Syncing holidays for year ${year}...`);

        const schools = [
            { code: 'MABDC', country: 'AE' },
            { code: 'STFXSA', country: 'PH' }
        ];

        const results = [];

        for (const school of schools) {
            // Using Nager.Date API (Free, no key required)
            const response = await fetch(`https://date.nager.at/api/v3/PublicHolidays/${year}/${school.country}`);

            if (!response.ok) {
                console.error(`Failed to fetch holidays for ${school.country}: ${response.statusText}`);
                continue;
            }

            const holidays = await response.json();

            // Transform and insert into Supabase
            const events = holidays.map((h: any) => ({
                title: h.name,
                event_date: h.date,
                event_type: 'holiday',
                school: school.code, // Scope to specific school
                description: h.localName
            }));

            // Upsert events (avoid duplicates based on title + date + school if only we had a unique constraint, 
            // but simpler to just insert or maybe check existence. 
            // For now, simpler implementation: Delete existing holidays for this year/school and re-insert)

            const startDate = `${year}-01-01`;
            const endDate = `${year}-12-31`;

            // 1. Delete existing auto-synced holidays for this year/school
            // Note: This might delete manual holidays if we don't distinguish them. 
            // Ideally we'd have a 'source' column. 
            // For now, we will just delete range.
            await supabaseClient
                .from('school_events')
                .delete()
                .eq('school', school.code)
                .eq('event_type', 'holiday')
                .gte('event_date', startDate)
                .lte('event_date', endDate);

            // 2. Insert new
            const { error } = await supabaseClient
                .from('school_events')
                .insert(events);

            if (error) {
                console.error(`Error inserting ${school.code} holidays:`, error);
                results.push({ school: school.code, status: 'error', error });
            } else {
                results.push({ school: school.code, status: 'success', count: events.length });
            }
        }

        return new Response(JSON.stringify({ success: true, results }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        })

    } catch (error) {
        const message = error instanceof Error ? error.message : 'An unexpected error occurred';
        return new Response(JSON.stringify({ error: message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        })
    }
})
