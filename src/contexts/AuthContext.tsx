import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { logAuditAction } from '@/hooks/useAuditLog';
import { toast } from 'sonner';

type AppRole = 'admin' | 'registrar' | 'teacher' | 'student' | 'parent' | 'finance' | 'principal' | 'it';
type ApprovalStatus = 'none' | 'pending' | 'approved' | 'rejected';

const ROLE_PRIORITY: AppRole[] = ['admin', 'principal', 'registrar', 'finance', 'it', 'teacher', 'parent', 'student'];

interface AuthContextType {
  user: User | null;
  session: Session | null;
  role: AppRole | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  hasRole: (role: AppRole) => boolean;
  impersonate: (target: { id: string, role: AppRole, full_name?: string | null }) => void;
  stopImpersonating: () => void;
  isImpersonating: boolean;
  actualRole: AppRole | null;
  actualUser: User | null;
  approvalStatus: ApprovalStatus;
  approvalAssignedRole: AppRole | null;
  isGoogleApprovalRequired: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [approvalStatus, setApprovalStatus] = useState<ApprovalStatus>('none');
  const [approvalAssignedRole, setApprovalAssignedRole] = useState<AppRole | null>(null);

  // Impersonation state
  const [impersonatedUser, setImpersonatedUser] = useState<{ id: string, role: AppRole, full_name?: string | null } | null>(null);

  const resolvePrimaryRole = (roles: AppRole[]): AppRole | null => {
    for (const preferredRole of ROLE_PRIORITY) {
      if (roles.includes(preferredRole)) {
        return preferredRole;
      }
    }

    return roles[0] ?? null;
  };

  const isGoogleAuthUser = (authUser: User | null) => {
    if (!authUser) return false;

    const directProvider = typeof authUser.app_metadata?.provider === 'string'
      ? authUser.app_metadata.provider
      : null;

    if (directProvider === 'google') {
      return true;
    }

    const identities = Array.isArray((authUser as User & { identities?: Array<{ provider?: string }> }).identities)
      ? (authUser as User & { identities?: Array<{ provider?: string }> }).identities
      : [];

    return identities.some((identity) => identity.provider === 'google');
  };

  const ensureGoogleApprovalRecord = async (authUser: User) => {
    const approvalsTable = 'google_login_approvals' as any;
    const { data: existing, error } = await supabase
      .from(approvalsTable)
      .select('status, assigned_role')
      .eq('user_id', authUser.id)
      .maybeSingle();

    if (error) {
      console.error('Error checking Google approval state:', error);
      return { status: 'pending' as ApprovalStatus, assignedRole: null as AppRole | null };
    }

    if (existing) {
      return {
        status: (existing.status as ApprovalStatus) || 'pending',
        assignedRole: (existing.assigned_role as AppRole | null) || null,
      };
    }

    const metadata = authUser.user_metadata || {};
    const { error: insertError } = await supabase
      .from(approvalsTable)
      .insert({
        user_id: authUser.id,
        email: authUser.email ?? null,
        full_name: metadata.full_name || metadata.name || null,
        avatar_url: metadata.avatar_url || metadata.picture || null,
        provider: 'google',
        status: 'pending',
      });

    if (insertError) {
      console.error('Error creating Google approval record:', insertError);
    }

    return { status: 'pending' as ApprovalStatus, assignedRole: null as AppRole | null };
  };

  const fetchApprovalState = async (authUser: User | null) => {
    if (!isGoogleAuthUser(authUser)) {
      setApprovalStatus('none');
      setApprovalAssignedRole(null);
      return { status: 'none' as ApprovalStatus, assignedRole: null as AppRole | null };
    }

    const approval = await ensureGoogleApprovalRecord(authUser);
    setApprovalStatus(approval.status);
    setApprovalAssignedRole(approval.assignedRole);
    return approval;
  };

  const fetchUserRole = async (userId: string, options?: { fallbackToStudent?: boolean }) => {
    const fallbackToStudent = options?.fallbackToStudent ?? true;

    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);

      if (error) {
        console.warn('Error fetching user role:', error);
        setRole(fallbackToStudent ? 'student' : null);
        return fallbackToStudent ? 'student' : null;
      } else {
        const roles = (data ?? [])
          .map((entry) => entry.role as AppRole)
          .filter(Boolean);

        if (roles.length === 0) {
          console.warn('No role found for user', fallbackToStudent ? 'defaulting to student' : 'while approval is pending');
          const resolvedFallback = fallbackToStudent ? 'student' : null;
          setRole(resolvedFallback);
          return resolvedFallback;
        }

        const primaryRole = resolvePrimaryRole(roles);

        if (roles.length > 1) {
          console.warn('Multiple roles found for user, resolved by priority:', roles, '->', primaryRole);
        }

        setRole(primaryRole);
        return primaryRole;
      }
    } catch (err) {
      console.error('Exception in fetchUserRole:', err);
      const resolvedFallback = fallbackToStudent ? 'student' : null;
      setRole(resolvedFallback);
      return resolvedFallback;
    }
  };

  const syncAuthState = useCallback(async (nextSession: Session | null) => {
    setSession(nextSession);
    setUser(nextSession?.user ?? null);

    if (nextSession?.user) {
      const approval = await fetchApprovalState(nextSession.user);
      const resolvedRole = await fetchUserRole(nextSession.user.id, {
        fallbackToStudent: approval.status !== 'pending' && approval.status !== 'rejected',
      });

      if (!resolvedRole && approval.status === 'approved' && approval.assignedRole) {
        setRole(approval.assignedRole);
      }
    } else {
      setRole(null);
      setApprovalStatus('none');
      setApprovalAssignedRole(null);
      setImpersonatedUser(null);
      sessionStorage.removeItem('impersonating_target');
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    // Load impersonation from sessionStorage
    const stored = sessionStorage.getItem('impersonating_target');
    if (stored) {
      try {
        setImpersonatedUser(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse impersonation target:', e);
      }
    }

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        void event;
        void syncAuthState(session);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      void syncAuthState(session);
    });

    return () => subscription.unsubscribe();
  }, [syncAuthState]);

  const signIn = async (email: string, password: string) => {
    await logAuditAction({ action: 'login_attempt', status: 'success', error_message: `Attempt for ${email}` });
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      await logAuditAction({
        action: 'login_failure',
        status: 'failure',
        error_message: error.message
      });
    } else if (data.user) {
      await logAuditAction({
        action: 'login_success',
        status: 'success'
      }, data.user.id);
    }

    return { error: error as Error | null };
  };

  const signInWithGoogle = async () => {
    await logAuditAction({ action: 'google_login_attempt', status: 'pending' });

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/`,
      },
    });

    if (error) {
      await logAuditAction({
        action: 'google_login_failure',
        status: 'failure',
        error_message: error.message,
      });
    }

    return { error: error as Error | null };
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    const redirectUrl = `${window.location.origin}/`;
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: { full_name: fullName }
      }
    });
    return { error: error as Error | null };
  };

  const signOut = useCallback(async () => {
    try {
      if (user) {
        await logAuditAction({ action: 'logout', status: 'success' }, user.id);
      }

      setUser(null);
      setSession(null);
      setRole(null);
      setApprovalStatus('none');
      setApprovalAssignedRole(null);
      setImpersonatedUser(null);
      sessionStorage.removeItem('impersonating_target');

      await supabase.auth.signOut({ scope: 'local' });
    } catch (error) {
      console.warn('Sign out warning:', error);
    }
  }, [user]);

  const impersonate = (target: { id: string, role: AppRole, full_name?: string | null }) => {
    if (role !== 'admin') {
      console.warn('Unauthorized impersonation attempt blocked.');
      return;
    }

    logAuditAction({
      action: 'impersonation_start',
      status: 'success',
      error_message: `Impersonating ${target.full_name || target.id} (${target.role})`
    }, user?.id);

    setImpersonatedUser(target);
    sessionStorage.setItem('impersonating_target', JSON.stringify(target));
  };

  const stopImpersonating = () => {
    if (user) {
      logAuditAction({
        action: 'impersonation_stop',
        status: 'success'
      }, user.id);
    }
    setImpersonatedUser(null);
    sessionStorage.removeItem('impersonating_target');
    sessionStorage.removeItem('impersonating_admin_session');
  };

  const currentRole = impersonatedUser?.role || role;
  const isImpersonating = !!impersonatedUser;
  const isGoogleApprovalRequired = approvalStatus === 'pending' || approvalStatus === 'rejected';

  // Session timeout (30 min inactivity)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const warningRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetTimer = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (warningRef.current) {
      clearTimeout(warningRef.current);
    }
    if (!user) {
      return;
    }

    // Warning at 28 min
    warningRef.current = setTimeout(() => {
      toast.warning('Session expiring in 2 minutes due to inactivity');
    }, 28 * 60 * 1000);

    // Logout at 30 min
    timeoutRef.current = setTimeout(() => {
      void signOut();
      toast.info('Session expired due to inactivity');
    }, 30 * 60 * 1000);
  }, [user, signOut]);

  useEffect(() => {
    if (!user) {
      return;
    }

    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
    const handler = () => resetTimer();

    events.forEach(e => window.addEventListener(e, handler, { passive: true }));
    resetTimer();

    return () => {
      events.forEach(e => window.removeEventListener(e, handler));
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (warningRef.current) {
        clearTimeout(warningRef.current);
      }
    };
  }, [user, resetTimer]);

  const hasRole = (checkRole: AppRole) => currentRole === checkRole;

  return (
    <AuthContext.Provider value={{
      user: impersonatedUser ? { ...user, id: impersonatedUser.id } as User : user,
      session,
      role: currentRole,
      loading,
      signIn,
      signInWithGoogle,
      signUp,
      signOut,
      hasRole,
      impersonate,
      stopImpersonating,
      isImpersonating,
      actualRole: role,
      actualUser: user,
      approvalStatus,
      approvalAssignedRole,
      isGoogleApprovalRequired,
    }}>
      {children}
    </AuthContext.Provider>
  );
};
