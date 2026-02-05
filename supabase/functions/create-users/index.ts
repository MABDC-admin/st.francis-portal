import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CreateUserRequest {
  action: "create_admin" | "create_registrar" | "create_teacher" | "bulk_create_students" | "reset_student_accounts" | "create_single_student" | "reset_student_password";
  email?: string;
  password?: string;
  fullName?: string;
  studentId?: string;
  studentLrn?: string;
  studentName?: string;
  studentSchool?: string;
  credentialId?: string;
  userId?: string;
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

// Generate email from LRN and school
function generateEmail(lrn: string, school?: string | null): string {
  const cleanLrn = lrn.replace(/[^a-zA-Z0-9]/g, "");
  // Use school-specific domain
  if (school?.toLowerCase().includes('stfxsa') || school?.toLowerCase().includes('st. francis')) {
    return `${cleanLrn}@stfxsa.org`;
  }
  // Default to MABDC
  return `${cleanLrn}@mabdc.org`;
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

    const { action, email, password, fullName, studentId, studentLrn, studentName, studentSchool, credentialId, userId }: CreateUserRequest = await req.json();
    console.log(`Processing action: ${action}`);

    if (action === "create_admin" || action === "create_registrar" || action === "create_teacher") {
      const generatedPassword = password || generatePassword();
      
      if (!email) {
        return new Response(
          JSON.stringify({ error: "Email required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const roleMap: Record<string, string> = {
        create_admin: "admin",
        create_registrar: "registrar",
        create_teacher: "teacher",
      };
      const role = roleMap[action];
      
      // Create user
      const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password: generatedPassword,
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
        temp_password: generatedPassword,
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
      // Fetch all students without accounts (include school field)
      const { data: students, error: studentsError } = await supabaseAdmin
        .from("students")
        .select("id, student_name, lrn, level, school");

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
          // Use LRN and school to generate email
          const email = generateEmail(student.lrn, student.school);
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

          // Store credentials with LRN as the display username
          await supabaseAdmin.from("user_credentials").insert({
            user_id: userData.user.id,
            email: student.lrn, // Store LRN as the "email" field for display
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

    if (action === "reset_student_accounts") {
      console.log("Resetting all student accounts...");

      // Get all student credentials
      const { data: studentCreds, error: fetchError } = await supabaseAdmin
        .from("user_credentials")
        .select("user_id, id")
        .eq("role", "student");

      if (fetchError) {
        console.error("Error fetching student credentials:", fetchError);
        return new Response(
          JSON.stringify({ error: fetchError.message }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      let deleted = 0;
      let failed = 0;

      for (const cred of studentCreds || []) {
        try {
          // Delete the auth user (this will cascade delete the credentials via foreign key)
          if (cred.user_id) {
            const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(cred.user_id);
            if (deleteError) {
              console.error(`Error deleting user ${cred.user_id}:`, deleteError);
              failed++;
              continue;
            }
          }
          
          // Delete the credential record
          await supabaseAdmin.from("user_credentials").delete().eq("id", cred.id);
          deleted++;
        } catch (err) {
          console.error(`Error processing credential ${cred.id}:`, err);
          failed++;
        }
      }

      console.log(`Reset complete: ${deleted} deleted, ${failed} failed`);

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `Deleted ${deleted} student accounts${failed > 0 ? `, ${failed} failed` : ''}`,
          deleted,
          failed
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create a single student account (used during enrollment)
    if (action === "create_single_student") {
      if (!studentId || !studentLrn || !studentName) {
        return new Response(
          JSON.stringify({ error: "Student ID, LRN, and name are required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Check if student already has an account
      const { data: existingCred } = await supabaseAdmin
        .from("user_credentials")
        .select("id")
        .eq("student_id", studentId)
        .single();

      if (existingCred) {
        return new Response(
          JSON.stringify({ error: "Student already has an account" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const generatedEmail = generateEmail(studentLrn, studentSchool);
      const generatedPassword = generatePassword();

      const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
        email: generatedEmail,
        password: generatedPassword,
        email_confirm: true,
        user_metadata: { full_name: studentName },
      });

      if (userError) {
        console.error("Error creating student user:", userError);
        return new Response(
          JSON.stringify({ error: userError.message }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Update role to student
      await supabaseAdmin
        .from("user_roles")
        .update({ role: "student" })
        .eq("user_id", userData.user.id);

      // Store credentials
      await supabaseAdmin.from("user_credentials").insert({
        user_id: userData.user.id,
        email: studentLrn,
        temp_password: generatedPassword,
        role: "student",
        student_id: studentId,
      });

      console.log(`Created account for student: ${studentName}`);

      return new Response(
        JSON.stringify({
          success: true,
          message: "Student account created successfully",
          username: studentLrn,
          password: generatedPassword,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Reset a single student's password
    if (action === "reset_student_password") {
      if (!credentialId || !userId) {
        return new Response(
          JSON.stringify({ error: "Credential ID and User ID are required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const newPassword = generatePassword();

      // Update password in auth
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        password: newPassword,
      });

      if (updateError) {
        console.error("Error resetting password:", updateError);
        return new Response(
          JSON.stringify({ error: updateError.message }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Update credentials table
      const { error: credError } = await supabaseAdmin
        .from("user_credentials")
        .update({ temp_password: newPassword, password_changed: false })
        .eq("id", credentialId);

      if (credError) {
        console.error("Error updating credentials:", credError);
        return new Response(
          JSON.stringify({ error: credError.message }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log(`Password reset for credential: ${credentialId}`);

      return new Response(
        JSON.stringify({
          success: true,
          message: "Password reset successfully",
          newPassword,
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
