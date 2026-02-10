import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { logAuditAction } from '@/hooks/useAuditLog';
import { useSchool, SchoolType } from '@/contexts/SchoolContext';

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
  const { setSelectedSchool } = useSchool();

  // Impersonation state
  const [impersonatedUser, setImpersonatedUser] = useState<{ id: string, role: AppRole, full_name?: string | null } | null>(null);

  const fetchUserRole = async (userId: string, userEmail?: string) => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .single();

      if (!error && data) {
        const userRole = data.role as AppRole;
        setRole(userRole);
        
        // Set default school based on user email (passed directly, not from stale state)
        if (userEmail) {
          setDefaultSchoolForUser(userEmail, userRole);
        }
      } else if (error) {
        console.warn('Error fetching user role:', error);
        setRole('student');
      }
    } catch (err) {
      console.error('Exception in fetchUserRole:', err);
      setRole('student');
    }

    // Database-backed school resolution fallback
    try {
      const { data: cred } = await supabase
        .from('user_credentials')
        .select('student_id')
        .eq('user_id', userId)
        .maybeSingle();
      if (cred?.student_id) {
        const { data: student } = await supabase
          .from('students')
          .select('school')
          .eq('id', cred.student_id)
          .maybeSingle();
        if (student?.school) {
          setSelectedSchool(student.school.toUpperCase() as SchoolType);
        }
      }
    } catch (err) {
      console.warn('Could not resolve school from DB:', err);
    }
  };

  const setDefaultSchoolForUser = (userEmail: string, userRole: AppRole | null) => {
    // Special case: finance user ivyan@stfxsa.org should default to STFXSA
    if (userEmail === 'ivyan@stfxsa.org' && userRole === 'finance') {
      setSelectedSchool('STFXSA');
      return;
    }
    
    // Default logic based on email domain
    if (userEmail.endsWith('@stfxsa.org')) {
      setSelectedSchool('STFXSA');
    } else if (userEmail.endsWith('@mabdc.org')) {
      setSelectedSchool('MABDC');
    }
    // For other cases, keep current selection
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
            fetchUserRole(session.user.id, session.user.email);
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
        fetchUserRole(session.user.id, session.user.email);
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

      // Clear local state first to ensure UI updates immediately
      setUser(null);
      setSession(null);
      setRole(null);
      setImpersonatedUser(null);
      sessionStorage.removeItem('impersonating_target');

      // Then sign out from Supabase (ignore errors if session already expired)
      await supabase.auth.signOut({ scope: 'local' });
    } catch (error) {
      // Even if signOut fails (e.g., session not found), we've already cleared local state
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
