import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
    to: string;
    studentName: string;
    school: string;
    username: string;
    password?: string;
    qrCodeUrl?: string; // Data URL
}

const handler = async (req: Request): Promise<Response> => {
    if (req.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const { to, studentName, school, username, password, qrCodeUrl }: EmailRequest = await req.json();

        if (!RESEND_API_KEY) {
            console.log("RESEND_API_KEY not set. Mocking email send.");
            console.log(`To: ${to}, Student: ${studentName}, School: ${school}`);
            return new Response(
                JSON.stringify({ success: true, message: "Email mocked (API key missing)" }),
                { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        const subject = `Welcome to ${school} - Enrollment Confirmation`;

        // Basic HTML Template
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

        const res = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${RESEND_API_KEY}`,
            },
            body: JSON.stringify({
                from: "Registrar <onboarding@resend.dev>", // TODO: Configure verified domain
                to: [to],
                subject: subject,
                html: html,
            }),
        });

        const data = await res.json();

        if (res.ok) {
            return new Response(JSON.stringify(data), {
                status: 200,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        } else {
            console.error("Resend API Error:", data);
            return new Response(JSON.stringify({ error: data }), {
                status: 400,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

    } catch (error: any) {
        console.error("Error sending email:", error);
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
};

serve(handler);
