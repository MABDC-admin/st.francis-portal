import { createClient } from "npm:@supabase/supabase-js@2";
import QRCode from "npm:qrcode@1.5.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { student_id } = await req.json();

    if (!student_id) {
      return new Response(
        JSON.stringify({ error: "student_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Generating QR code for student: ${student_id}`);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Fetch student LRN
    const { data: student, error: studentError } = await supabase
      .from("students")
      .select("lrn, student_name, school_id")
      .eq("id", student_id)
      .single();

    if (studentError || !student) {
      console.error("Student not found:", studentError);
      return new Response(
        JSON.stringify({ error: "Student not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch credentials (may not exist yet)
    const { data: creds } = await supabase
      .from("user_credentials")
      .select("temp_password")
      .eq("student_id", student_id)
      .maybeSingle();

    // Get school code
    let schoolCode = "";
    if (student.school_id) {
      const { data: school } = await supabase
        .from("schools")
        .select("code")
        .eq("id", student.school_id)
        .single();
      schoolCode = school?.code || "";
    }

    const qrPayload = JSON.stringify({
      lrn: student.lrn || "",
      password: creds?.temp_password || "",
      school: schoolCode,
      generated: new Date().toISOString(),
    });

    console.log(`QR payload built for ${student.student_name}, generating image...`);

    const qrDataUrl = await QRCode.toDataURL(qrPayload, {
      width: 200,
      margin: 1,
      color: { dark: "#000000", light: "#ffffff" },
    });

    console.log("QR code generated successfully");

    return new Response(
      JSON.stringify({ qr_data_url: qrDataUrl }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch (err) {
    console.error("QR generation error:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
