import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface EmailRequest {
  type: "approval" | "rejection" | "admin_notification";
  to: string;
  studentName: string;
  school: string;
  level: string;
  rejectionReason?: string;
  approvedBy?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      console.log("RESEND_API_KEY not set. Mocking email send.");
      const body = await req.json();
      console.log("Mock email:", JSON.stringify(body));
      return new Response(
        JSON.stringify({ success: true, message: "Email mocked (API key missing)" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const resend = new Resend(RESEND_API_KEY);
    const { type, to, studentName, school, level, rejectionReason, approvedBy }: EmailRequest = await req.json();

    let subject = "";
    let html = "";

    if (type === "approval") {
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
    } else if (type === "rejection") {
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
    } else if (type === "admin_notification") {
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

    const emailResponse = await resend.emails.send({
      from: "Enrollment <enrollment@sfxsai.org>",
      to: [to],
      subject,
      html,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error sending admission email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
