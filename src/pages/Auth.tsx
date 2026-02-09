import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useSchool, SCHOOL_THEMES, SchoolType } from '@/contexts/SchoolContext';
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
  const { selectedSchool, setSelectedSchool } = useSchool();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDetectingSchool, setIsDetectingSchool] = useState(false);
  const [hasIdentified, setHasIdentified] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutUntil, setLockoutUntil] = useState<number | null>(null);
  const [geoData, setGeoData] = useState<{ country?: string; ip?: string; city?: string } | null>(null);
  const { data: mabdcSettings } = useSchoolSettings('MABDC');
  const { data: stfxsaSettings } = useSchoolSettings('STFXSA');

  const [loginData, setLoginData] = useState({ email: '', password: '' });

  useEffect(() => {
    if (user && !loading) {
      navigate('/');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    const detectLocation = async () => {
      try {
        const response = await fetch('https://ipapi.co/json/');
        const data = await response.json();
        setGeoData({ country: data.country, ip: data.ip, city: data.city });

        if (data.country === 'PH') {
          setSelectedSchool('STFXSA');
        } else if (data.country === 'AE') {
          setSelectedSchool('MABDC');
        }
      } catch (err) {
        console.error('Geolocation detection failed:', err);
      }
    };

    detectLocation();
  }, [setSelectedSchool]);

  useEffect(() => {
    const debounceTimer = setTimeout(async () => {
      const input = loginData.email.trim();
      if (!input || input.includes('@') || input.length < 5) {
        setHasIdentified(false);
        return;
      }

      setIsDetectingSchool(true);
      try {
        const { data: student } = await supabase
          .from('students')
          .select('school')
          .eq('lrn', input)
          .maybeSingle();

        if (student) {
          const studentSchool = student.school?.toUpperCase() || 'MABDC';
          const isSTFXSA = studentSchool.includes('STFXSA') || studentSchool.includes('ST. FRANCIS');
          setSelectedSchool(isSTFXSA ? 'STFXSA' : 'MABDC');
          setHasIdentified(true);
        } else {
          setHasIdentified(false);
        }
      } catch (err) {
        console.error('School detection check failed:', err);
      } finally {
        setIsDetectingSchool(false);
      }
    }, 500);

    return () => clearTimeout(debounceTimer);
  }, [loginData.email, setSelectedSchool]);

  const logAudit = async (action: string, status: string, error?: string) => {
    try {
      // Cast to any because audit_logs might not be in the generated types yet
      await (supabase.from('audit_logs') as any).insert({
        lrn: loginData.email.includes('@') ? null : loginData.email,
        action,
        status,
        ip_address: geoData?.ip,
        country_code: geoData?.country,
        city: geoData?.city,
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
    const emailToUse = isEmailLogin
      ? inputData
      : (selectedSchool === 'STFXSA' ? `${cleanLrn}@stfxsa.org` : `${cleanLrn}@mabdc.org`);

    // Geofencing enforcement for students only
    if (!isEmailLogin && geoData?.country) {
      if (geoData.country === 'PH' && selectedSchool === 'MABDC') {
        setIsSubmitting(false);
        toast.error('Access Denied', {
          description: 'Students in the Philippines region are restricted to the STFXSA portal.'
        });
        await logAudit('login_blocked_geo', 'blocked', 'PH student attempted MABDC access');
        return;
      }
      if (geoData.country === 'AE' && selectedSchool === 'STFXSA') {
        setIsSubmitting(false);
        toast.error('Access Denied', {
          description: 'Students in the UAE region are restricted to the MABDC portal.'
        });
        await logAudit('login_blocked_geo', 'blocked', 'AE student attempted STFXSA access');
        return;
      }
    }

    const { error } = await signIn(emailToUse, loginData.password);
    setIsSubmitting(false);

    if (error) {
      const newFailedAttempts = failedAttempts + 1;
      setFailedAttempts(newFailedAttempts);

      if (newFailedAttempts >= 5) {
        setLockoutUntil(Date.now() + 30000); // 30 sec lockout
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
      await logAudit('login_success', 'success');
      toast.success('Logged in successfully');
      navigate('/');
    }
  };

  const currentTheme = SCHOOL_THEMES[selectedSchool];
  const currentSettings = selectedSchool === 'MABDC' ? mabdcSettings : stfxsaSettings;

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
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500 rounded-full blur-[120px] animate-blob" />
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
              <div className={cn(
                "w-20 h-20 rounded-3xl flex items-center justify-center shadow-2xl overflow-hidden transition-all duration-700 bg-white/5 border border-white/10 mb-6",
                hasIdentified ? "scale-110 rotate-0 shadow-emerald-500/20" : "scale-100 rotate-0"
              )}>
                {isDetectingSchool ? (
                  <RefreshCcw className="h-10 w-10 animate-spin text-white/40" />
                ) : hasIdentified && currentSettings?.logo_url ? (
                  <img src={currentSettings.logo_url} alt="Logo" className="w-full h-full object-contain p-2" />
                ) : (
                  <GraduationCap className="h-12 w-12 text-white/20" />
                )}
              </div>

              <h1 className={cn(
                "text-2xl font-bold transition-all duration-700 tracking-tight",
                hasIdentified ? "text-white" : "text-white/40"
              )}>
                {hasIdentified ? (currentSettings?.name || currentTheme.fullName) : "Regis360"}
              </h1>
              <p className="text-white/30 text-sm mt-1">
                {hasIdentified ? "School Portal Access" : "Unified Smart Login"}
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="login-email" className="text-white/50 text-xs font-medium uppercase tracking-wider ml-1">Identity</Label>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20 group-focus-within:text-emerald-400 transition-colors" />
                  <Input
                    id="login-email"
                    type="text"
                    placeholder="Enter LRN or Email"
                    className="h-12 bg-white/5 border-white/10 text-white placeholder:text-white/20 pl-11 focus:border-emerald-500/50 focus:ring-emerald-500/20 transition-all rounded-xl"
                    value={loginData.email}
                    onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                    required
                  />
                  {isDetectingSchool && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                      <div className="h-4 w-4 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="login-password" className="text-white/50 text-xs font-medium uppercase tracking-wider ml-1">Password</Label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20 group-focus-within:text-emerald-400 transition-colors" />
                  <Input
                    id="login-password"
                    type="password"
                    placeholder="••••••••"
                    className="h-12 bg-white/5 border-white/10 text-white placeholder:text-white/20 pl-11 focus:border-emerald-500/50 focus:ring-emerald-500/20 transition-all rounded-xl"
                    value={loginData.password}
                    onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                className={cn(
                  "w-full h-12 text-sm font-semibold rounded-xl transition-all duration-500 shadow-xl mt-4",
                  hasIdentified
                    ? (selectedSchool === 'MABDC'
                      ? "bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20 text-white"
                      : "bg-blue-600 hover:bg-blue-700 shadow-blue-500/20 text-white")
                    : "bg-white/10 hover:bg-white/20 text-white border border-white/5"
                )}
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
              {geoData?.country || 'GLOBAL'} NODE {geoData?.ip?.split('.')[0] || '80'}
            </div>
          </div>
        </Card>

        <div className="flex flex-col items-center space-y-6 pt-4">
          <button
            onClick={() => navigate('/auth?admin=true')}
            className="text-white/40 hover:text-white text-xs font-medium tracking-widest uppercase transition-all flex items-center gap-2 group"
          >
            <span className="w-8 h-[1px] bg-white/10 group-hover:bg-emerald-500/50 transition-colors" />
            Admin Login
            <span className="w-8 h-[1px] bg-white/10 group-hover:bg-emerald-500/50 transition-colors" />
          </button>

          <p className="text-[10px] text-white/10 text-center leading-relaxed max-w-[200px]">
            © 2026 Regis360 Systems<br />
            Secure International Education Gateway
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;

