/**
 * reset-password — Standardized with shared utilities
 *
 * Allows admins/principals to reset a user's password with
 * history checking (last 5 passwords) and strength validation.
 */
import { hash, compare } from 'https://deno.land/x/bcrypt@v0.4.1/mod.ts';
import {
  handleCors,
  jsonResponse,
  errorResponse,
  requireAuth,
  requireRole,
  createServiceClient,
  parseRequiredFields,
} from '../_shared/response.ts';

Deno.serve(async (req): Promise<Response> => {
  // Handle CORS preflight
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    // 1. Authenticate the requester
    const auth = await requireAuth(req);
    if ('error' in auth) return auth.error;

    // 2. Verify admin/principal role
    const serviceClient = createServiceClient();
    const roleCheck = await requireRole(serviceClient, auth.user.id, ['admin', 'principal']);
    if ('error' in roleCheck) return roleCheck.error;

    // 3. Parse and validate request body
    const body = await parseRequiredFields<{ userId: string; newPassword: string }>(
      req,
      ['userId', 'newPassword'],
    );
    if (body.error) return body.error;

    const { userId, newPassword } = body.data!;

    // 4. Validate password strength
    if (newPassword.length < 8) {
      return errorResponse('Password must be at least 8 characters', 400, 'VALIDATION_ERROR');
    }

    // 5. Check password history (last 5)
    const { data: history } = await serviceClient
      .from('password_history')
      .select('password_hash')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5);

    if (history && history.length > 0) {
      for (const entry of history) {
        const matches = await compare(newPassword, entry.password_hash);
        if (matches) {
          return errorResponse(
            'This password was used recently. Please choose a different password.',
            400,
            'PASSWORD_REUSE',
          );
        }
      }
    }

    // 6. Update password via admin API
    const { error: updateError } = await serviceClient.auth.admin.updateUserById(
      userId,
      { password: newPassword },
    );

    if (updateError) {
      return errorResponse(updateError.message, 500, 'UPDATE_FAILED');
    }

    // 7. Store new password hash in history
    const hashedPassword = await hash(newPassword);
    await serviceClient.from('password_history').insert({
      user_id: userId,
      password_hash: hashedPassword,
    });

    return jsonResponse({ message: 'Password reset successfully' });
  } catch (error) {
    const err = error as Error;
    console.error('Error in reset-password:', err);
    return errorResponse(err.message || 'Internal server error', 500);
  }
});
