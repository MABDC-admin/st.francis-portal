/**
 * delete-user — Standardized with shared utilities
 *
 * Allows admins to delete a user account (roles, credentials, profile, auth).
 */
import {
  handleCors,
  jsonResponse,
  errorResponse,
  requireAuth,
  requireRole,
  createServiceClient,
  parseRequiredFields,
} from '../_shared/response.ts';

Deno.serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    // 1. Authenticate
    const auth = await requireAuth(req);
    if ('error' in auth) return auth.error;

    // 2. Verify admin role
    const serviceClient = createServiceClient();
    const roleCheck = await requireRole(serviceClient, auth.user.id, ['admin']);
    if ('error' in roleCheck) return roleCheck.error;

    // 3. Parse request
    const body = await parseRequiredFields<{ userId: string }>(req, ['userId']);
    if (body.error) return body.error;

    const { userId } = body.data!;

    // 4. Prevent self-deletion
    if (userId === auth.user.id) {
      return errorResponse('Cannot delete your own account', 400, 'SELF_DELETE');
    }

    // 5. Delete related records then auth user
    await serviceClient.from('user_roles').delete().eq('user_id', userId);
    await serviceClient.from('user_credentials').delete().eq('user_id', userId);
    await serviceClient.from('profiles').delete().eq('id', userId);

    const { error: deleteError } = await serviceClient.auth.admin.deleteUser(userId);
    if (deleteError) {
      console.error('Failed to delete auth user:', deleteError);
      return errorResponse(deleteError.message, 500, 'DELETE_FAILED');
    }

    return jsonResponse({ message: 'User deleted successfully' });
  } catch (error) {
    const err = error as Error;
    console.error('Error:', err);
    return errorResponse(err.message || 'Internal server error', 500);
  }
});
