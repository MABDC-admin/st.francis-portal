/**
 * zoom-auth — Standardized with shared utilities
 *
 * Generates Zoom Meeting SDK Signatures (JWT) and ZAK tokens.
 */
import {
    handleCors,
    jsonResponse,
    errorResponse,
} from '../_shared/response.ts';
import { encodeBase64 } from 'https://deno.land/std@0.224.0/encoding/base64.ts';

const ZOOM_CLIENT_ID = Deno.env.get('ZOOM_CLIENT_ID');
const ZOOM_CLIENT_SECRET = Deno.env.get('ZOOM_CLIENT_SECRET');
const ZOOM_ACCOUNT_ID = Deno.env.get('ZOOM_ACCOUNT_ID');

async function getAccessToken() {
    const auth = btoa(`${ZOOM_CLIENT_ID}:${ZOOM_CLIENT_SECRET}`);
    const response = await fetch(`https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${ZOOM_ACCOUNT_ID}`, {
        method: 'POST',
        headers: { 'Authorization': `Basic ${auth}` },
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.reason || 'Failed to get access token');
    return data.access_token;
}

async function getZakToken(accessToken: string) {
    const response = await fetch('https://api.zoom.us/v2/users/me/token?type=zak', {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${accessToken}` },
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to get ZAK token');
    return data.token;
}

async function generateSignature(meetingNumber: string, role: number) {
    const iat = Math.round(new Date().getTime() / 1000) - 30;
    const exp = iat + 60 * 60 * 2; // 2 hours

    const header = { alg: 'HS256', typ: 'JWT' };
    const payload = {
        sdkKey: ZOOM_CLIENT_ID,
        mn: meetingNumber,
        role: role,
        iat: iat,
        exp: exp,
        tokenExp: exp
    };

    const sHeader = encodeBase64(JSON.stringify(header)).replace(/=/g, '');
    const sPayload = encodeBase64(JSON.stringify(payload)).replace(/=/g, '');
    const data = `${sHeader}.${sPayload}`;

    const key = await crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(ZOOM_CLIENT_SECRET!),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
    );

    const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data));
    const sSignature = encodeBase64(new Uint8Array(signature))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');

    return `${data}.${sSignature}`;
}

Deno.serve(async (req) => {
    const corsResponse = handleCors(req);
    if (corsResponse) return corsResponse;

    try {
        if (!ZOOM_CLIENT_ID || !ZOOM_CLIENT_SECRET || !ZOOM_ACCOUNT_ID) {
            return errorResponse('Zoom credentials not configured', 500, 'CONFIG_ERROR');
        }

        const { meetingNumber, role = 0 } = await req.json();

        if (!meetingNumber) return errorResponse('meetingNumber is required', 400);

        console.log(`Generating credentials for meeting: ${meetingNumber}, role: ${role}`);

        const accessToken = await getAccessToken();
        const zakToken = role === 1 ? await getZakToken(accessToken) : null;
        const signature = await generateSignature(meetingNumber, role);

        return jsonResponse({
            signature,
            zakToken,
            sdkKey: ZOOM_CLIENT_ID
        });

    } catch (error) {
        const err = error as Error;
        console.error('Zoom Auth Error:', err.message);
        return errorResponse(err.message || 'Internal server error', 400);
    }
});
