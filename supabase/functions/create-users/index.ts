import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CreateUserRequest {
  action: "create_admin" | "create_registrar" | "create_teacher" | "create_finance" | "bulk_create_students" | "reset_student_accounts" | "create_single_student" | "reset_student_password";
  email?: string;
  password?: string;
  fullName?: string;
  studentId?: string;
  studentLrn?: string;
  studentName?: string;
  studentSchool?: string;
  credentialId?: string;
  userId?: string;
  school?: string;
  gradeLevel?: string;
}

// Generate a cryptographically secure random password
function generateSecurePassword(length = 12): string {
  const uppercase = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lowercase = "abcdefghjkmnpqrstuvwxyz";
  const numbers = "23456789";
  const special = "!@#$%";
  const all = uppercase + lowercase + numbers + special;
  
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  
  let password = "";
  // Ensure at least one of each character type
  password += uppercase[array[0] % uppercase.length];
  password += lowercase[array[1] % lowercase.length];
  password += numbers[array[2] % numbers.length];
  password += special[array[3] % special.length];
  
  // Fill the rest
  for (let i = 4; i < length; i++) {
    password += all[array[i] % all.length];
  }
  
  // Shuffle the password
  return password.split('').sort(() => (crypto.getRandomValues(new Uint8Array(1))[0] % 2) - 0.5).join('');
}

// Generate email from LRN and school
function generateEmail(lrn: string, school?: string | null): string {
  const cleanLrn = lrn.replace(/[^a-zA-Z0-9]/g, "");
  return `${cleanLrn}@sfxsai.org`;
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

    const { action, email, password, fullName, studentId, studentLrn, studentName, studentSchool, credentialId, userId, school, gradeLevel }: CreateUserRequest = await req.json();
    console.log(`Processing action: ${action}`);

    if (action === "create_admin" || action === "create_registrar" || action === "create_teacher" || action === "create_finance") {
      const generatedPassword = password || generateSecurePassword();
      
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
        create_finance: "finance",
      };
      const role = roleMap[action];
      
      // Create user - handle "already registered" gracefully
      let authUserId: string;
      const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password: generatedPassword,
        email_confirm: true,
        user_metadata: { full_name: fullName || email.split("@")[0] },
      });

      if (userError) {
        if (userError.message?.includes("already been registered")) {
          const { data: { users } } = await supabaseAdmin.auth.admin.listUsers();
          const existingUser = users?.find(u => u.email === email);
          if (existingUser) {
            authUserId = existingUser.id;
            console.log(`User ${email} already exists, updating role`);
          } else {
            return new Response(
              JSON.stringify({ error: "User exists but could not be found" }),
              { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
        } else {
          console.error("Error creating user:", userError);
          return new Response(
            JSON.stringify({ error: userError.message }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      } else {
        authUserId = userData.user.id;
      }

      console.log(`User ready: ${authUserId}`);

      // Update role in user_roles table
      const { error: roleError } = await supabaseAdmin
        .from("user_roles")
        .update({ role })
        .eq("user_id", authUserId);

      if (roleError) {
        console.error("Error updating role:", roleError);
      }

      // Store credentials (upsert to handle re-creation)
      await supabaseAdmin.from("user_credentials").upsert({
        user_id: authUserId,
        email,
        temp_password: generatedPassword,
        role,
      }, { onConflict: 'user_id' }).select();

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `${role} account created successfully`,
          userId: authUserId 
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "bulk_create_students") {
      // Fetch students with optional school and grade level filtering
      let query = supabaseAdmin
        .from("students")
        .select("id, student_name, lrn, level, school");

      // Apply school filter
      if (school && school !== 'all') {
        query = query.eq('school', school);
      }

      // Apply grade level filter
      if (gradeLevel && gradeLevel !== 'all') {
        query = query.eq('level', gradeLevel);
      }

      const { data: students, error: studentsError } = await query;

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
          const password = generateSecurePassword(10); // Generate secure unique password for each student

          // Try to create user - handle "already registered" gracefully
          let authUserId: string;
          const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { full_name: student.student_name },
          });

          if (userError) {
            // If user already exists in auth, find them and link credential
            if (userError.message?.includes("already been registered")) {
              const { data: { users } } = await supabaseAdmin.auth.admin.listUsers();
              const existingUser = users?.find(u => u.email === email);
              if (existingUser) {
                authUserId = existingUser.id;
                console.log(`User ${email} already exists in auth, linking credential`);
              } else {
                console.error(`User ${email} reported as existing but not found`);
                results.failed++;
                results.errors.push(`${student.student_name}: User exists but not found`);
                continue;
              }
            } else {
              console.error(`Error creating user for ${student.student_name}:`, userError);
              results.failed++;
              results.errors.push(`${student.student_name}: ${userError.message}`);
              continue;
            }
          } else {
            authUserId = userData.user.id;
          }

          // Role is already set to 'student' by trigger, but update if needed
          await supabaseAdmin
            .from("user_roles")
            .update({ role: "student" })
            .eq("user_id", authUserId);

          // Store credentials with LRN as the display username
          await supabaseAdmin.from("user_credentials").insert({
            user_id: authUserId,
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
      const generatedPassword = generateSecurePassword(10); // Generate secure unique password

      let authUserId: string;
      const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
        email: generatedEmail,
        password: generatedPassword,
        email_confirm: true,
        user_metadata: { full_name: studentName },
      });

      if (userError) {
        // Handle "already registered" by finding and linking existing user
        if (userError.message?.includes("already been registered")) {
          const { data: { users } } = await supabaseAdmin.auth.admin.listUsers();
          const existingUser = users?.find(u => u.email === generatedEmail);
          if (existingUser) {
            authUserId = existingUser.id;
            console.log(`Student auth user already exists for ${generatedEmail}, linking credential`);
          } else {
            return new Response(
              JSON.stringify({ error: "Auth user exists but could not be found" }),
              { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
        } else {
          console.error("Error creating student user:", userError);
          return new Response(
            JSON.stringify({ error: userError.message }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      } else {
        authUserId = userData.user.id;
      }

      // Update role to student
      await supabaseAdmin
        .from("user_roles")
        .update({ role: "student" })
        .eq("user_id", authUserId);

      // Store credentials
      await supabaseAdmin.from("user_credentials").insert({
        user_id: authUserId,
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

      const newPassword = generateSecurePassword(10); // Generate secure password for reset

      // Update password in auth
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        password: newPassword,
      });

      if (updateError) {
        console.error("Error resetting password:", updateError);
        
        // If user not found, the credential is orphaned - delete it and return helpful message
        if (updateError.message?.includes("User not found") || updateError.status === 404) {
          // Delete orphaned credential
          await supabaseAdmin.from("user_credentials").delete().eq("id", credentialId);
          console.log(`Deleted orphaned credential: ${credentialId}`);
          
          return new Response(
            JSON.stringify({ 
              error: "Account no longer exists. Credential has been removed. Please recreate the student account.",
              orphaned: true 
            }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        
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

    // Delete a single account
    if (action === "delete_account") {
      if (!credentialId || !userId) {
        return new Response(
          JSON.stringify({ error: "Credential ID and User ID are required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log(`Deleting account: userId=${userId}, credentialId=${credentialId}`);

      // Delete the auth user (cascades to user_roles, profiles via ON DELETE CASCADE)
      const { error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(userId);
      if (deleteAuthError) {
        console.error("Error deleting auth user:", deleteAuthError);
        // If user not found in auth, still clean up the credential
        if (!deleteAuthError.message?.includes("User not found") && deleteAuthError.status !== 404) {
          return new Response(
            JSON.stringify({ error: deleteAuthError.message }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        console.log("Auth user not found, cleaning up orphaned credential");
      }

      // Delete the credential record
      const { error: deleteCredError } = await supabaseAdmin
        .from("user_credentials")
        .delete()
        .eq("id", credentialId);

      if (deleteCredError) {
        console.error("Error deleting credential:", deleteCredError);
        return new Response(
          JSON.stringify({ error: deleteCredError.message }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log(`Account deleted successfully: ${userId}`);

      return new Response(
        JSON.stringify({
          success: true,
          message: "Account deleted successfully",
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
