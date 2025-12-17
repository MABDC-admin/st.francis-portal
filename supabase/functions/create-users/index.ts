import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CreateUserRequest {
  action: "create_admin" | "create_registrar" | "bulk_create_students";
  email?: string;
  password?: string;
  fullName?: string;
}

// Generate a random password
function generatePassword(length = 12): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%";
  let password = "";
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

// Generate email from student name
function generateEmail(studentName: string, lrn: string): string {
  const cleanName = studentName.toLowerCase().replace(/[^a-z0-9]/g, "");
  const shortLrn = lrn.slice(-4);
  return `${cleanName.slice(0, 10)}${shortLrn}@student.edutrack.local`;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    // Create admin client with service role
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const { action, email, password, fullName }: CreateUserRequest = await req.json();
    console.log(`Processing action: ${action}`);

    if (action === "create_admin" || action === "create_registrar") {
      if (!email || !password) {
        return new Response(
          JSON.stringify({ error: "Email and password required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const role = action === "create_admin" ? "admin" : "registrar";
      
      // Create user
      const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: fullName || email.split("@")[0] },
      });

      if (userError) {
        console.error("Error creating user:", userError);
        return new Response(
          JSON.stringify({ error: userError.message }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log(`User created: ${userData.user.id}`);

      // Update role in user_roles table
      const { error: roleError } = await supabaseAdmin
        .from("user_roles")
        .update({ role })
        .eq("user_id", userData.user.id);

      if (roleError) {
        console.error("Error updating role:", roleError);
      }

      // Store credentials
      await supabaseAdmin.from("user_credentials").insert({
        user_id: userData.user.id,
        email,
        temp_password: password,
        role,
      });

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `${role} account created successfully`,
          userId: userData.user.id 
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "bulk_create_students") {
      // Fetch all students without accounts
      const { data: students, error: studentsError } = await supabaseAdmin
        .from("students")
        .select("id, student_name, lrn");

      if (studentsError) {
        console.error("Error fetching students:", studentsError);
        return new Response(
          JSON.stringify({ error: studentsError.message }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Check which students already have accounts
      const { data: existingCreds } = await supabaseAdmin
        .from("user_credentials")
        .select("student_id")
        .not("student_id", "is", null);

      const existingStudentIds = new Set(existingCreds?.map(c => c.student_id) || []);
      const studentsToCreate = students?.filter(s => !existingStudentIds.has(s.id)) || [];

      console.log(`Creating accounts for ${studentsToCreate.length} students`);

      const results = {
        created: 0,
        failed: 0,
        errors: [] as string[],
      };

      for (const student of studentsToCreate) {
        try {
          const email = generateEmail(student.student_name, student.lrn);
          const password = generatePassword();

          // Create user
          const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { full_name: student.student_name },
          });

          if (userError) {
            console.error(`Error creating user for ${student.student_name}:`, userError);
            results.failed++;
            results.errors.push(`${student.student_name}: ${userError.message}`);
            continue;
          }

          // Role is already set to 'student' by trigger, but update if needed
          await supabaseAdmin
            .from("user_roles")
            .update({ role: "student" })
            .eq("user_id", userData.user.id);

          // Store credentials
          await supabaseAdmin.from("user_credentials").insert({
            user_id: userData.user.id,
            email,
            temp_password: password,
            role: "student",
            student_id: student.id,
          });

          results.created++;
          console.log(`Created account for ${student.student_name}`);
        } catch (err) {
          console.error(`Unexpected error for ${student.student_name}:`, err);
          results.failed++;
          results.errors.push(`${student.student_name}: Unexpected error`);
        }
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `Created ${results.created} student accounts, ${results.failed} failed`,
          ...results 
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid action" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in create-users function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
