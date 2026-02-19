/**
 * send-admission-email — Standardized with shared utilities
 *
 * Sends admission approval/rejection/notification emails via Resend.
 */
import {
  handleCors,
  jsonResponse,
  errorResponse,
} from '../_shared/response.ts';

interface EmailRequest {
  type: 'approval' | 'rejection' | 'admin_notification';
  to: string;
  studentName: string;
  school: string;
  level: string;
  rejectionReason?: string;
  approvedBy?: string;
}

Deno.serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    const { type, to, studentName, school, level, rejectionReason, approvedBy }: EmailRequest = await req.json();

    if (!RESEND_API_KEY) {
      console.log('RESEND_API_KEY not set. Mocking email send.');
      console.log('Mock email:', JSON.stringify({ type, to, studentName }));
      return jsonResponse({ message: 'Email mocked (API key missing)' });
    }

    let subject = '';
    let html = '';

    if (type === 'approval') {
      subject = `Admission Approved - ${studentName} at ${school}`;
      html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #059669, #10b981); padding: 30px; border-radius: 12px 12px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">✅ Admission Approved</h1>
          </div>
          <div style="padding: 30px; background: #f9fafb; border-radius: 0 0 12px 12px;">
            <p>Dear Parent/Guardian,</p>
            <p>We are pleased to inform you that <strong>${studentName}</strong> has been <strong>approved for admission</strong> at <strong>${school}</strong>.</p>
            <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #059669; margin: 20px 0;">
              <p style="margin: 0;"><strong>Student:</strong> ${studentName}</p>
              <p style="margin: 8px 0 0;"><strong>Grade Level:</strong> ${level}</p>
              <p style="margin: 8px 0 0;"><strong>School:</strong> ${school}</p>
            </div>
            <p>A student record has been created. Login credentials will be provided separately.</p>
            <p>Best regards,<br>The Registrar Team</p>
          </div>
        </div>
      `;
    } else if (type === 'rejection') {
      subject = `Admission Update - ${studentName}`;
      html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #dc2626, #ef4444); padding: 30px; border-radius: 12px 12px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Admission Update</h1>
          </div>
          <div style="padding: 30px; background: #f9fafb; border-radius: 0 0 12px 12px;">
            <p>Dear Parent/Guardian,</p>
            <p>We regret to inform you that the admission application for <strong>${studentName}</strong> at <strong>${school}</strong> was not approved at this time.</p>
            ${rejectionReason ? `
            <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #dc2626; margin: 20px 0;">
              <p style="margin: 0;"><strong>Reason:</strong> ${rejectionReason}</p>
            </div>
            ` : ''}
            <p>If you have questions, please contact the registrar's office.</p>
            <p>Best regards,<br>The Registrar Team</p>
          </div>
        </div>
      `;
    } else if (type === 'admin_notification') {
      subject = `Admission Approved: ${studentName} - ${school}`;
      html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #2563eb, #3b82f6); padding: 30px; border-radius: 12px 12px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">📋 Admission Approved</h1>
          </div>
          <div style="padding: 30px; background: #f9fafb; border-radius: 0 0 12px 12px;">
            <p>An admission has been approved:</p>
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0;"><strong>Student:</strong> ${studentName}</p>
              <p style="margin: 8px 0 0;"><strong>Level:</strong> ${level}</p>
              <p style="margin: 8px 0 0;"><strong>School:</strong> ${school}</p>
              <p style="margin: 8px 0 0;"><strong>Approved by:</strong> ${approvedBy || 'N/A'}</p>
            </div>
          </div>
        </div>
      `;
    }

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'Enrollment <enrollment@sfxsai.org>',
        to: [to],
        subject,
        html,
      }),
    });

    const emailResponse = await res.json();
    console.log('Email sent successfully:', emailResponse);

    if (!res.ok) {
      return errorResponse(emailResponse?.message || 'Email send failed', 400, 'EMAIL_FAILED');
    }

    return jsonResponse(emailResponse);
  } catch (error) {
    const err = error as Error;
    console.error('Error sending admission email:', err);
    return errorResponse(err.message || 'Internal server error', 500);
  }
});
