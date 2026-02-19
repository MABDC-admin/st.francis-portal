/**
 * send-interview-invitation — Standardized with shared utilities
 *
 * Sends interview invitation email to teacher applicant via Resend.
 */
import {
    handleCors,
    jsonResponse,
    errorResponse,
} from '../_shared/response.ts';

interface InterviewRequest {
    applicationId: string;
    applicantEmail: string;
    applicantName: string;
    interviewDate: string;
    interviewTime: string;
    interviewType: string;
    meetingLink?: string;
    location?: string;
    notes?: string;
}

Deno.serve(async (req) => {
    const corsResponse = handleCors(req);
    if (corsResponse) return corsResponse;

    try {
        const {
            applicantEmail,
            applicantName,
            interviewDate,
            interviewTime,
            interviewType,
            meetingLink,
            location,
            notes,
        }: InterviewRequest = await req.json();

        const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
        if (!RESEND_API_KEY) {
            throw new Error('RESEND_API_KEY not configured');
        }

        const emailHtml = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f8fafc;">
  <div style="background: linear-gradient(135deg, #4f46e5, #4338ca); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 24px;">📅 Interview Invitation</h1>
    <p style="color: #e0e7ff; margin: 8px 0 0;">St. Francis Xavier Smart Academy</p>
  </div>
  <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px; border: 1px solid #e2e8f0; border-top: none;">
    <p style="color: #334155;">Dear ${applicantName},</p>
    <p style="color: #334155;">We are pleased to invite you for an interview regarding your application.</p>
    
    <div style="background: #eef2ff; padding: 20px; border-radius: 8px; margin: 24px 0; border-left: 4px solid #4f46e5;">
      <h3 style="color: #1e1b4b; margin: 0 0 12px 0;">Interview Details</h3>
      <p style="margin: 8px 0; color: #3730a3;"><strong>Date:</strong> ${interviewDate}</p>
      <p style="margin: 8px 0; color: #3730a3;"><strong>Time:</strong> ${interviewTime}</p>
      <p style="margin: 8px 0; color: #3730a3;"><strong>Type:</strong> ${interviewType}</p>
      ${location ? `<p style="margin: 8px 0; color: #3730a3;"><strong>Location:</strong> ${location}</p>` : ''}
      ${meetingLink ? `<p style="margin: 8px 0; color: #3730a3;"><strong>Link:</strong> <a href="${meetingLink}" style="color: #4f46e5;">Join Meeting</a></p>` : ''}
    </div>

    ${notes ? `<p style="color: #334155; font-style: italic;"><strong>Note:</strong> ${notes}</p>` : ''}

    <p style="color: #334155;">Please confirm your attendance by replying to this email.</p>
    
    <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;">
    <p style="color: #94a3b8; font-size: 12px; text-align: center;">This is an automated message from St. Francis Xavier Smart Academy.</p>
  </div>
</body>
</html>`;

        const res = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${RESEND_API_KEY}`,
            },
            body: JSON.stringify({
                from: `SFXSAI Recruitment <recruitment@sfxsai.com>`,
                to: [applicantEmail],
                subject: `Interview Invitation - St. Francis Xavier Smart Academy`,
                html: emailHtml,
            }),
        });

        if (!res.ok) {
            const err = await res.text();
            console.error('Email send failed:', err);
            return errorResponse('Failed to send email', 400, 'EMAIL_FAILED');
        }

        return jsonResponse({ message: 'Interview invitation sent' });
    } catch (error) {
        const err = error as Error;
        console.error('Function error:', err);
        return errorResponse(err.message || 'Internal server error', 500);
    }
});
