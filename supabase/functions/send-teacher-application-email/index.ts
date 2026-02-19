/**
 * send-teacher-application-email — Standardized with shared utilities
 *
 * Sends confirmation to teacher applicant + notification to registrar via Resend.
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
    const { applicantName, applicantEmail, positionApplied, schoolId } = await req.json();

    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    if (!RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY not configured');
    }

    const supabase = createServiceClient();

    const { data: school } = await supabase
      .from('schools')
      .select('name')
      .eq('id', schoolId)
      .single();

    const schoolName = school?.name || 'St. Francis Xavier Smart Academy';
    const emailsSent: string[] = [];

    // 1. Send confirmation to applicant
    if (applicantEmail) {
      const applicantHtml = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f8fafc;">
  <div style="background: linear-gradient(135deg, #1e40af, #3b82f6); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 24px;">📋 Application Received</h1>
    <p style="color: #dbeafe; margin: 8px 0 0;">Thank you for applying to ${schoolName}</p>
  </div>
  <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px; border: 1px solid #e2e8f0; border-top: none;">
    <p style="color: #334155;">Dear ${applicantName},</p>
    <p style="color: #334155;">We have received your teaching application. Here are the details:</p>
    <div style="background: #f1f5f9; padding: 16px; border-radius: 8px; margin: 16px 0;">
      <p style="margin: 4px 0; color: #1e293b;"><strong>Applicant:</strong> ${applicantName}</p>
      <p style="margin: 4px 0; color: #1e293b;"><strong>Position Applied:</strong> ${positionApplied}</p>
    </div>
    <p style="color: #334155;">Your application is currently <strong style="color: #d97706;">under review</strong>. Our registrar will evaluate your qualifications and documents.</p>
    <h3 style="color: #1e293b; margin-top: 24px;">Next Steps:</h3>
    <ol style="color: #475569; line-height: 1.8;">
      <li>Application review by the registrar (3-5 business days)</li>
      <li>If shortlisted, you will be contacted for an interview</li>
      <li>Demo teaching may be scheduled for qualified applicants</li>
      <li>Final decision and job offer</li>
    </ol>
    <p style="color: #334155; margin-top: 16px;">If you have any questions, please contact us at <a href="mailto:registrar@sfxsai.com" style="color: #2563eb;">registrar@sfxsai.com</a>.</p>
    <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;">
    <p style="color: #94a3b8; font-size: 12px; text-align: center;">This is an automated message from ${schoolName}. Please do not reply directly.</p>
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
          from: `SFXSAI Registrar <registrar@sfxsai.com>`,
          to: [applicantEmail],
          subject: `Application Received - ${positionApplied} | ${schoolName}`,
          html: applicantHtml,
        }),
      });

      if (res.ok) {
        emailsSent.push(applicantEmail);
      } else {
        const err = await res.text();
        console.error('Applicant email failed:', err);
      }
    }

    // 2. Send notification to registrar
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
    <h2 style="color: white; margin: 0;">🆕 New Teacher Application</h2>
  </div>
  <div style="background: white; padding: 24px; border: 1px solid #d1d5db; border-top: none; border-radius: 0 0 8px 8px;">
    <p><strong>Applicant:</strong> ${applicantName}</p>
    <p><strong>Position:</strong> ${positionApplied}</p>
    <p><strong>Email:</strong> ${applicantEmail}</p>
    <p style="margin-top: 16px;">Please review this application in the Teacher Applicants dashboard.</p>
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
          subject: `New Teacher Application: ${applicantName} - ${positionApplied}`,
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
