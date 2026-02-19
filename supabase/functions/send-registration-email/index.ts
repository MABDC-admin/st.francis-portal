/**
 * send-registration-email — Standardized with shared utilities
 *
 * Sends registration confirmation to parent + notification to registrar via Resend.
 */
import {
  handleCors,
  jsonResponse,
  errorResponse,
  createServiceClient,
} from '../_shared/response.ts';

Deno.serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const { studentName, parentEmail, level, schoolId } = await req.json();

    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    if (!RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY not configured');
    }

    const supabase = createServiceClient();

    const { data: school } = await supabase
      .from('schools')
      .select('name, code')
      .eq('id', schoolId)
      .single();

    const schoolName = school?.name || 'St. Francis Xavier Smart Academy';
    const emailsSent: string[] = [];

    // Send confirmation to parent
    if (parentEmail) {
      const parentHtml = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f8fafc;">
  <div style="background: linear-gradient(135deg, #1e40af, #3b82f6); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 24px;">📋 Registration Received</h1>
    <p style="color: #dbeafe; margin: 8px 0 0;">Thank you for registering with ${schoolName}</p>
  </div>
  <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px; border: 1px solid #e2e8f0; border-top: none;">
    <p style="color: #334155;">Dear Parent/Guardian,</p>
    <p style="color: #334155;">We have received the online registration for:</p>
    <div style="background: #f1f5f9; padding: 16px; border-radius: 8px; margin: 16px 0;">
      <p style="margin: 4px 0; color: #1e293b;"><strong>Student:</strong> ${studentName}</p>
      <p style="margin: 4px 0; color: #1e293b;"><strong>Grade Level:</strong> ${level}</p>
    </div>
    <p style="color: #334155;">Your registration is currently <strong style="color: #d97706;">pending review</strong>. Our registrar will review and process your application.</p>
    <h3 style="color: #1e293b; margin-top: 24px;">Next Steps:</h3>
    <ol style="color: #475569; line-height: 1.8;">
      <li>Wait for registration review (1-3 business days)</li>
      <li>Prepare required documents for submission</li>
      <li>Visit the school for document verification</li>
    </ol>
    <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;">
    <p style="color: #94a3b8; font-size: 12px; text-align: center;">This is an automated message from ${schoolName}. Please do not reply directly.</p>
  </div>
</body>
</html>`;

      const parentRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: `SFXSAI Registrar <registrar@sfxsai.com>`,
          to: [parentEmail],
          subject: `Registration Received - ${studentName}`,
          html: parentHtml,
        }),
      });

      if (parentRes.ok) {
        emailsSent.push(parentEmail);
      } else {
        const err = await parentRes.text();
        console.error('Parent email failed:', err);
      }
    }

    // Send notification to school admin
    const { data: schoolInfo } = await supabase
      .from('school_info')
      .select('registrar_email')
      .eq('school_id', schoolId)
      .single();

    if (schoolInfo?.registrar_email) {
      const adminHtml = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: #059669; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
    <h2 style="color: white; margin: 0;">🆕 New Online Registration</h2>
  </div>
  <div style="background: white; padding: 24px; border: 1px solid #d1d5db; border-top: none; border-radius: 0 0 8px 8px;">
    <p><strong>Student:</strong> ${studentName}</p>
    <p><strong>Grade Level:</strong> ${level}</p>
    ${parentEmail ? `<p><strong>Parent Email:</strong> ${parentEmail}</p>` : ''}
    <p style="margin-top: 16px;">Please review this registration in the admin dashboard.</p>
  </div>
</body>
</html>`;

      const adminRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: `SFXSAI Registrar <registrar@sfxsai.com>`,
          to: [schoolInfo.registrar_email],
          subject: `New Registration: ${studentName} - ${level}`,
          html: adminHtml,
        }),
      });

      if (adminRes.ok) {
        emailsSent.push(schoolInfo.registrar_email);
      } else {
        const err = await adminRes.text();
        console.error('Admin email failed:', err);
      }
    }

    return jsonResponse({ emailsSent });
  } catch (error) {
    const err = error as Error;
    console.error('Email function error:', err);
    return errorResponse(err.message || 'Internal server error', 500);
  }
});
