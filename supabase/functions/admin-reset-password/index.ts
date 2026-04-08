/**
 * admin-reset-password — Service-role-based password reset
 * Used for direct admin password resets without requiring browser auth.
 * Protected by checking the apikey matches service role key.
 */
import {
  handleCors,
  jsonResponse,
  errorResponse,
  createServiceClient,
} from '../_shared/response.ts';

Deno.serve(async (req): Promise<Response> => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    // Verify this is called with service role key (not anon key)
    const apikey = req.headers.get('apikey') || '';
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    
    if (apikey !== serviceRoleKey) {
      return errorResponse('Unauthorized - requires service role key', 401, 'UNAUTHORIZED');
    }

    const { userId, newPassword } = await req.json();
    
    if (!userId || !newPassword) {
      return errorResponse('Missing userId or newPassword', 400, 'VALIDATION_ERROR');
    }

    const serviceClient = createServiceClient();

    // Update password via admin API
    const { error: updateError } = await serviceClient.auth.admin.updateUserById(
      userId,
      { password: newPassword },
    );

    if (updateError) {
      return errorResponse(updateError.message, 500, 'UPDATE_FAILED');
    }

    // Update user_credentials table
    await serviceClient
      .from('user_credentials')
      .update({ temp_password: newPassword, password_changed: false })
      .eq('user_id', userId);

    return jsonResponse({ message: 'Password reset successfully' });
  } catch (error) {
    const err = error as Error;
    console.error('Error in admin-reset-password:', err);
    return errorResponse(err.message || 'Internal server error', 500);
  }
});
