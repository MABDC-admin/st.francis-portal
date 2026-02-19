/**
 * send-enrollment-email — Standardized with shared utilities
 *
 * Sends enrollment confirmation email with portal credentials via Resend.
 */
import {
    handleCors,
    jsonResponse,
    errorResponse,
} from '../_shared/response.ts';

interface EmailRequest {
    to: string;
    studentName: string;
    school: string;
    username: string;
    password?: string;
    qrCodeUrl?: string;
}

Deno.serve(async (req) => {
    const corsResponse = handleCors(req);
    if (corsResponse) return corsResponse;

    try {
        const { to, studentName, school, username, password, qrCodeUrl }: EmailRequest = await req.json();

        const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
        if (!RESEND_API_KEY) {
            console.log('RESEND_API_KEY not set. Mocking email send.');
            console.log(`To: ${to}, Student: ${studentName}, School: ${school}`);
            return jsonResponse({ message: 'Email mocked (API key missing)' });
        }

        const subject = `Welcome to ${school} - Enrollment Confirmation`;
        const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Enrollment Confirmed!</h2>
        <p>Dear Parent,</p>
        <p>We are pleased to confirm that <strong>${studentName}</strong> has been successfully enrolled at <strong>${school}</strong>.</p>
        
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Student Portal Credentials</h3>
          <p><strong>Username:</strong> ${username}</p>
          <p><strong>Password:</strong> ${password || '********'}</p>
        </div>

        ${qrCodeUrl ? `
        <div style="text-align: center; margin: 20px 0;">
          <h3>Student ID Badge</h3>
          <p>Please save this QR code for attendance scanning.</p>
          <img src="${qrCodeUrl}" alt="Student QR Code" style="width: 200px; height: 200px; border: 1px solid #ddd; padding: 10px; border-radius: 8px;" />
        </div>
        ` : ''}

        <p>You can log in to the student portal to view grades, schedules, and more.</p>
        <p>Best regards,<br>The Registrar Team</p>
      </div>
    `;

        const res = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${RESEND_API_KEY}`,
            },
            body: JSON.stringify({
                from: 'Registrar <onboarding@resend.dev>',
                to: [to],
                subject,
                html,
            }),
        });

        const data = await res.json();

        if (!res.ok) {
            console.error('Resend API Error:', data);
            return errorResponse(data?.message || 'Email send failed', 400, 'EMAIL_FAILED');
        }

        return jsonResponse(data);
    } catch (error) {
        const err = error as Error;
        console.error('Error sending email:', err);
        return errorResponse(err.message || 'Internal server error', 500);
    }
});
