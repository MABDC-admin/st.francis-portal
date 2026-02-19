/**
 * sync-holidays — Standardized with shared utilities
 *
 * Fetches holidays from Nager.Date API and syncs to Supabase.
 */
import {
    handleCors,
    jsonResponse,
    errorResponse,
    createServiceClient,
} from '../_shared/response.ts';

interface HolidayRequest {
    year: number;
}

Deno.serve(async (req) => {
    const corsResponse = handleCors(req);
    if (corsResponse) return corsResponse;

    try {
        let year: number;
        try {
            const body = await req.text();
            if (body && body.trim()) {
                const parsed = JSON.parse(body) as HolidayRequest;
                year = parsed.year || new Date().getFullYear();
            } else {
                year = new Date().getFullYear();
            }
        } catch {
            year = new Date().getFullYear();
        }

        console.log(`Syncing holidays for year ${year}...`);

        const supabaseClient = createServiceClient();
        const schools = [{ code: 'SFXSAI', country: 'PH' }];
        const results = [];

        for (const school of schools) {
            const response = await fetch(`https://date.nager.at/api/v3/PublicHolidays/${year}/${school.country}`);

            if (!response.ok) {
                console.error(`Failed to fetch holidays for ${school.country}: ${response.statusText}`);
                continue;
            }

            const holidays = await response.json();
            const events = holidays.map((h: any) => ({
                title: h.name,
                event_date: h.date,
                event_type: 'holiday',
                school: school.code,
                description: h.localName
            }));

            const startDate = `${year}-01-01`;
            const endDate = `${year}-12-31`;

            await supabaseClient
                .from('school_events')
                .delete()
                .eq('school', school.code)
                .eq('event_type', 'holiday')
                .gte('event_date', startDate)
                .lte('event_date', endDate);

            const { error } = await supabaseClient.from('school_events').insert(events);

            if (error) {
                console.error(`Error inserting ${school.code} holidays:`, error);
                results.push({ school: school.code, status: 'error', error });
            } else {
                results.push({ school: school.code, status: 'success', count: events.length });
            }
        }

        return jsonResponse({ success: true, results });

    } catch (error) {
        const err = error as Error;
        return errorResponse(err.message || 'An unexpected error occurred', 400);
    }
});
