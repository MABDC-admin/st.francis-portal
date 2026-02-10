import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useSchool, SCHOOL_THEMES } from '@/contexts/SchoolContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { GraduationCap, Lock, User, RefreshCcw, ShieldCheck } from 'lucide-react';
import { z } from 'zod';
import { useSchoolSettings } from '@/hooks/useSchoolSettings';
import { cn } from '@/lib/utils';

const loginSchema = z.object({
  email: z.string().min(1, 'Email or LRN is required'),
  password: z.string().min(6, 'Password must be at least 6 characters')
});

const Auth = () => {
  const navigate = useNavigate();
  const { user, signIn, loading } = useAuth();
  const { selectedSchool } = useSchool();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutUntil, setLockoutUntil] = useState<number | null>(null);
  const { data: schoolSettings } = useSchoolSettings('STFXSA');

  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [rememberMe, setRememberMe] = useState(false);

  // Load saved credentials on mount
  useEffect(() => {
    const savedEmail = localStorage.getItem('rememberedEmail');
    const savedPassword = localStorage.getItem('rememberedPassword');
    if (savedEmail) {
      setLoginData({ email: savedEmail, password: savedPassword || '' });
      setRememberMe(true);
    }
  }, []);

  useEffect(() => {
    if (user && !loading) {
      navigate('/');
    }
  }, [user, loading, navigate]);

  const logAudit = async (action: string, status: string, error?: string) => {
    try {
      await (supabase.from('audit_logs') as any).insert({
        lrn: loginData.email.includes('@') ? null : loginData.email,
        action,
        status,
        school: selectedSchool,
        error_message: error,
        user_agent: navigator.userAgent
      });
    } catch (err) {
      console.error('Audit logging failed:', err);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (lockoutUntil && Date.now() < lockoutUntil) {
      const remainingSeconds = Math.ceil((lockoutUntil - Date.now()) / 1000);
      toast.error(`Too many failed attempts. Please wait ${remainingSeconds} seconds.`);
      return;
    }

    const validation = loginSchema.safeParse(loginData);
    if (!validation.success) {
      toast.error(validation.error.errors[0].message);
      return;
    }

    setIsSubmitting(true);
    await logAudit('login_attempt', 'pending');

    const inputData = loginData.email.trim();
    const isEmailLogin = inputData.includes('@');
    const cleanLrn = inputData.replace(/[^a-zA-Z0-9]/g, '');
    const emailToUse = isEmailLogin ? inputData : `${cleanLrn}@sfxsai.org`;

    const { error } = await signIn(emailToUse, loginData.password);
    setIsSubmitting(false);

    if (error) {
      const newFailedAttempts = failedAttempts + 1;
      setFailedAttempts(newFailedAttempts);

      if (newFailedAttempts >= 5) {
        setLockoutUntil(Date.now() + 30000);
        toast.error('Too many failed attempts. Login locked for 30 seconds.');
      } else {
        toast.error(error.message.includes('Invalid login credentials')
          ? 'Invalid LRN/email or password.'
          : error.message);
      }

      await logAudit('login_failure', 'failure', error.message);
    } else {
      setFailedAttempts(0);
      setLockoutUntil(null);
      
      // Handle Remember Me
      if (rememberMe) {
        localStorage.setItem('rememberedEmail', loginData.email);
        localStorage.setItem('rememberedPassword', loginData.password);
      } else {
        localStorage.removeItem('rememberedEmail');
        localStorage.removeItem('rememberedPassword');
      }
      
      await logAudit('login_success', 'success');
      toast.success('Logged in successfully');
      navigate('/');
    }
  };

  const currentTheme = SCHOOL_THEMES[selectedSchool];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white" />
      </div>
    );
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden font-sans">
      {/* Animated Mesh Gradient Background */}
      <div className="absolute inset-0 bg-slate-950 z-0">
        <div className="absolute inset-0 opacity-40">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500 rounded-full blur-[120px] animate-blob" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600 rounded-full blur-[120px] animate-blob animation-delay-2000" />
          <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-indigo-500 rounded-full blur-[120px] animate-blob animation-delay-4000" />
        </div>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animation-delay-2000 { animation-delay: 2s; }
        .animation-delay-4000 { animation-delay: 4s; }
        .animate-blob { animation: blob 7s infinite alternate ease-in-out; }
        .glass-card {
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
      `}} />

      <div className="w-full max-w-md z-10 space-y-8 animate-fade-in">
        <Card className="glass-card shadow-2xl border-0 overflow-hidden theme-transition">
          <CardContent className="p-8 pt-10">
            <div className="flex flex-col items-center mb-8 text-center">
              <div className="w-40 h-40 rounded-3xl flex items-center justify-center overflow-hidden transition-all duration-700 mb-6">
                {schoolSettings?.logo_url ? (
                  <img src={schoolSettings.logo_url} alt="Logo" className="w-full h-full object-contain" />
                ) : (
                  <GraduationCap className="h-24 w-24 text-white/20" />
                )}
              </div>

              <h1 className="text-2xl font-bold transition-all duration-700 tracking-tight text-white">
                {schoolSettings?.name || currentTheme.fullName}
              </h1>
              <p className="text-white/30 text-sm mt-1">
                School Portal Access
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="login-email" className="text-white/50 text-xs font-medium uppercase tracking-wider ml-1">Identity</Label>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20 group-focus-within:text-blue-400 transition-colors" />
                  <Input
                    id="login-email"
                    type="text"
                    placeholder="Enter LRN or Email"
                    className="h-12 bg-white/5 border-white/10 text-white placeholder:text-white/20 pl-11 focus:border-blue-500/50 focus:ring-blue-500/20 transition-all rounded-xl"
                    value={loginData.email}
                    onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="login-password" className="text-white/50 text-xs font-medium uppercase tracking-wider ml-1">Password</Label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20 group-focus-within:text-blue-400 transition-colors" />
                  <Input
                    id="login-password"
                    type="password"
                    placeholder="••••••••"
                    className="h-12 bg-white/5 border-white/10 text-white placeholder:text-white/20 pl-11 focus:border-blue-500/50 focus:ring-blue-500/20 transition-all rounded-xl"
                    value={loginData.password}
                    onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="remember-me"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 rounded border-white/10 bg-white/5 text-blue-600 focus:ring-blue-500/20 focus:ring-offset-0 cursor-pointer"
                  />
                  <Label
                    htmlFor="remember-me"
                    className="text-white/50 text-sm font-medium cursor-pointer select-none"
                  >
                    Remember me
                  </Label>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setLoginData({ email: 'sottodennis@gmail.com', password: 'Denskie123' });
                  }}
                  className="text-white/40 hover:text-white hover:bg-white/5 text-xs h-8 px-3"
                >
                  <ShieldCheck className="h-3 w-3 mr-1" />
                  Admin Login
                </Button>
              </div>

              <Button
                type="submit"
                className="w-full h-12 text-sm font-semibold rounded-xl transition-all duration-500 shadow-xl mt-4 bg-blue-600 hover:bg-blue-700 shadow-blue-500/20 text-white"
                disabled={isSubmitting || (lockoutUntil ? Date.now() < lockoutUntil : false)}
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <RefreshCcw className="h-4 w-4 animate-spin" />
                    <span>Signing in...</span>
                  </div>
                ) : `Continue to Dashboard`}
              </Button>
            </form>
          </CardContent>

          {/* Bottom Security Bar */}
          <div className="px-8 py-4 bg-white/[0.02] border-t border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2 text-[10px] text-white/20 uppercase tracking-[0.1em]">
              <ShieldCheck className="h-3 w-3" />
              <span>TLS 1.3 SECURE</span>
            </div>
            <div className="text-[10px] text-white/20 uppercase tracking-[0.1em]">
              SFXSAI PORTAL
            </div>
          </div>
        </Card>

        <div className="flex flex-col items-center space-y-6 pt-4">
          <button
            onClick={() => navigate('/auth?admin=true')}
            className="text-white/40 hover:text-white text-xs font-medium tracking-widest uppercase transition-all flex items-center gap-2 group"
          >
            <span className="w-8 h-[1px] bg-white/10 group-hover:bg-blue-500/50 transition-colors" />
            Admin Portal
            <span className="w-8 h-[1px] bg-white/10 group-hover:bg-blue-500/50 transition-colors" />
          </button>

          <p className="text-[10px] text-white/10 text-center leading-relaxed max-w-[200px]">
            © 2026 Portal Systems<br />
            St. Francis Xavier Smart Academy Inc
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
