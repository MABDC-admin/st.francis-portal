import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { logAuditAction } from '@/hooks/useAuditLog';
import { useSchool } from '@/contexts/SchoolContext';

type AppRole = 'admin' | 'registrar' | 'teacher' | 'student' | 'parent' | 'finance';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  role: AppRole | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  hasRole: (role: AppRole) => boolean;
  impersonate: (target: { id: string, role: AppRole, full_name?: string | null }) => void;
  stopImpersonating: () => void;
  isImpersonating: boolean;
  actualRole: AppRole | null;
  actualUser: User | null;
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

  // Impersonation state
  const [impersonatedUser, setImpersonatedUser] = useState<{ id: string, role: AppRole, full_name?: string | null } | null>(null);

  const fetchUserRole = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.warn('Error fetching user role:', error);
        setRole('student');
      } else if (data) {
        console.log('User role fetched:', data.role);
        setRole(data.role as AppRole);
      } else {
        console.warn('No role found for user, defaulting to student');
        setRole('student');
      }
    } catch (err) {
      console.error('Exception in fetchUserRole:', err);
      setRole('student');
    }
  };

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
        console.log('Auth state changed:', event, session?.user?.email);
        setSession(session);
        setUser(session?.user ?? null);

        // Defer role fetching
        if (session?.user) {
          setTimeout(() => {
            fetchUserRole(session.user.id);
          }, 0);
        } else {
          setRole(null);
          setImpersonatedUser(null);
          sessionStorage.removeItem('impersonating_target');
        }
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Initial session check:', session?.user?.email);
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserRole(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

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

  const signOut = async () => {
    try {
      if (user) {
        await logAuditAction({ action: 'logout', status: 'success' }, user.id);
      }

      setUser(null);
      setSession(null);
      setRole(null);
      setImpersonatedUser(null);
      sessionStorage.removeItem('impersonating_target');

      await supabase.auth.signOut({ scope: 'local' });
    } catch (error) {
      console.warn('Sign out warning:', error);
    }
  };

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

  const hasRole = (checkRole: AppRole) => currentRole === checkRole;

  return (
    <AuthContext.Provider value={{
      user: impersonatedUser ? { ...user, id: impersonatedUser.id } as User : user,
      session,
      role: currentRole,
      loading,
      signIn,
      signUp,
      signOut,
      hasRole,
      impersonate,
      stopImpersonating,
      isImpersonating,
      actualRole: role,
      actualUser: user
    }}>
      {children}
    </AuthContext.Provider>
  );
};
