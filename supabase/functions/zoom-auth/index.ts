import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { encodeBase64 } from "https://deno.land/std@0.224.0/encoding/base64.ts";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ZOOM_CLIENT_ID = Deno.env.get('ZOOM_CLIENT_ID');
const ZOOM_CLIENT_SECRET = Deno.env.get('ZOOM_CLIENT_SECRET');
const ZOOM_ACCOUNT_ID = Deno.env.get('ZOOM_ACCOUNT_ID');

async function getAccessToken() {
    const auth = btoa(`${ZOOM_CLIENT_ID}:${ZOOM_CLIENT_SECRET}`);
    const response = await fetch(`https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${ZOOM_ACCOUNT_ID}`, {
        method: 'POST',
        headers: {
            'Authorization': `Basic ${auth}`,
        },
    });

    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.reason || 'Failed to get access token');
    }
    return data.access_token;
}

async function getZakToken(accessToken: string) {
    const response = await fetch('https://api.zoom.us/v2/users/me/token?type=zak', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
        },
    });

    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || 'Failed to get ZAK token');
    }
    return data.token;
}

// Generate Meeting SDK Signature (JWT)
async function generateSignature(meetingNumber: string, role: number) {
    const iat = Math.round(new Date().getTime() / 1000) - 30;
    const exp = iat + 60 * 60 * 2; // 2 hours

    const header = { alg: "HS256", typ: "JWT" };
    const payload = {
        sdkKey: ZOOM_CLIENT_ID,
        mn: meetingNumber,
        role: role,
        iat: iat,
        exp: exp,
        tokenExp: exp
    };

    const sHeader = encodeBase64(JSON.stringify(header)).replace(/=/g, "");
    const sPayload = encodeBase64(JSON.stringify(payload)).replace(/=/g, "");
    const data = `${sHeader}.${sPayload}`;

    const key = await crypto.subtle.importKey(
        "raw",
        new TextEncoder().encode(ZOOM_CLIENT_SECRET!),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"]
    );

    const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data));
    const sSignature = encodeBase64(new Uint8Array(signature))
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=/g, "");

    return `${data}.${sSignature}`;
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        if (!ZOOM_CLIENT_ID || !ZOOM_CLIENT_SECRET || !ZOOM_ACCOUNT_ID) {
            throw new Error('Zoom credentials not configured in environment variables');
        }

        const { meetingNumber, role = 0 } = await req.json();

        if (!meetingNumber) {
            throw new Error('meetingNumber is required');
        }

        console.log(`Generating credentials for meeting: ${meetingNumber}, role: ${role}`);

        const accessToken = await getAccessToken();
        const zakToken = role === 1 ? await getZakToken(accessToken) : null;
        const signature = await generateSignature(meetingNumber, role);

        return new Response(JSON.stringify({
            signature,
            zakToken,
            sdkKey: ZOOM_CLIENT_ID
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });

    } catch (error) {
        const err = error as Error;
        console.error('Zoom Auth Error:', err.message);
        return new Response(JSON.stringify({ error: err.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        });
    }
});
