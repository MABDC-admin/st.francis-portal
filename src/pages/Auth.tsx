import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import {
  Eye,
  EyeOff,
  Lock,
  ShieldCheck,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useSchool, SCHOOL_THEMES } from "@/contexts/SchoolContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useSchoolSettings } from "@/hooks/useSchoolSettings";
import { SchoolLogo } from "@/components/branding/SchoolLogo";
import { resolveSchoolLogo } from "@/lib/schoolBranding";

const loginSchema = z.object({
  email: z.string().min(1, "Email or LRN is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const Auth = () => {
  const navigate = useNavigate();
  const { user, signIn, loading } = useAuth();
  const { selectedSchool } = useSchool();
  const { data: schoolSettings } = useSchoolSettings(selectedSchool);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutUntil, setLockoutUntil] = useState<number | null>(null);
  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const savedEmail = localStorage.getItem("rememberedEmail");
    if (savedEmail) {
      setLoginData((previous) => ({ ...previous, email: savedEmail }));
      setRememberMe(true);
    }
  }, []);

  useEffect(() => {
    if (user && !loading) {
      navigate("/");
    }
  }, [user, loading, navigate]);

  const logAudit = async (action: string, status: string, error?: string) => {
    try {
      await supabase.from("audit_logs").insert({
        lrn: loginData.email.includes("@") ? null : loginData.email,
        action,
        status,
        school: selectedSchool,
        error_message: error,
        user_agent: navigator.userAgent,
      });
    } catch (auditError) {
      console.error("Audit logging failed:", auditError);
    }
  };

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();

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
    await logAudit("login_attempt", "pending");

    const inputData = loginData.email.trim();
    const isEmailLogin = inputData.includes("@");
    const cleanLrn = inputData.replace(/[^a-zA-Z0-9]/g, "");
    const emailToUse = isEmailLogin ? inputData : `${cleanLrn}@sfxsai.org`;

    const { error } = await signIn(emailToUse, loginData.password);
    setIsSubmitting(false);

    if (error) {
      const attempts = failedAttempts + 1;
      setFailedAttempts(attempts);

      if (attempts >= 5) {
        setLockoutUntil(Date.now() + 30000);
        toast.error("Too many failed attempts. Login locked for 30 seconds.");
      } else {
        toast.error(error.message.includes("Invalid login credentials") ? "Invalid LRN/email or password." : error.message);
      }

      await logAudit("login_failure", "failure", error.message);
      return;
    }

    setFailedAttempts(0);
    setLockoutUntil(null);

    if (rememberMe) {
      localStorage.setItem("rememberedEmail", loginData.email);
    } else {
      localStorage.removeItem("rememberedEmail");
    }

    await logAudit("login_success", "success");
    toast.success("Logged in successfully");
    navigate("/");
  };

  const currentTheme = SCHOOL_THEMES[selectedSchool];

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-background px-4 py-4 lg:py-6">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(25,31,56,0.12),transparent_30%),radial-gradient(circle_at_top_right,rgba(33,196,93,0.16),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(37,140,244,0.12),transparent_26%),linear-gradient(180deg,rgba(255,255,255,0.94),rgba(245,247,252,0.98))]" />
      <div className="relative mx-auto flex min-h-[calc(100vh-2rem)] max-w-xl items-center">
        <div className="w-full">
          <Card className="overflow-hidden rounded-[2rem] border-border/80 shadow-soft">
            <CardContent className="p-0">
              <div className="border-b border-border/80 bg-[linear-gradient(135deg,rgba(25,31,56,0.04),rgba(37,140,244,0.03)_45%,rgba(33,196,93,0.09))] p-8">
                <div className="mb-6 flex items-center gap-4">
                  <SchoolLogo
                    src={resolveSchoolLogo(schoolSettings?.logo_url || currentTheme.logoSrc)}
                    className="h-14 w-14 rounded-2xl border border-white/70 bg-white p-1 ring-4 ring-primary/10"
                    imageClassName="rounded-2xl"
                  />
                  <div>
                    <p className="micro-label">Secure Access</p>
                    <h2 className="text-2xl font-bold tracking-tight text-foreground">
                      {schoolSettings?.name || currentTheme.fullName}
                    </h2>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className="rounded-full border-[hsl(var(--getyn-navy)/0.12)] bg-[hsl(var(--getyn-navy)/0.05)] text-[hsl(var(--getyn-navy))]">
                    Session protected
                  </Badge>
                </div>
                <p className="mt-4 text-sm leading-6 text-muted-foreground">
                  Use your email or learner reference number to continue to the portal.
                </p>
              </div>

              <form onSubmit={handleLogin} className="space-y-5 p-8">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Identity</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="login-email"
                      type="text"
                      placeholder="Enter LRN or email"
                      className="pl-10"
                      value={loginData.email}
                      onChange={(event) => setLoginData({ ...loginData, email: event.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="login-password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="login-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      className="pl-10 pr-11"
                      value={loginData.password}
                      onChange={(event) => setLoginData({ ...loginData, password: event.target.value })}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((previous) => !previous)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <label className="flex items-center gap-3 text-sm text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(event) => setRememberMe(event.target.checked)}
                    className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                  />
                  Remember my identity on this device
                </label>

                <Button
                  type="submit"
                  className="h-11 w-full rounded-xl"
                  disabled={isSubmitting || (lockoutUntil ? Date.now() < lockoutUntil : false)}
                >
                  {isSubmitting ? "Signing in..." : "Continue to Dashboard"}
                </Button>
              </form>

              <div className="flex items-center justify-between border-t border-border/80 bg-secondary/55 px-8 py-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                  <span>TLS secured session</span>
                </div>
                <span>{schoolSettings?.acronym || "SFXSAI"} Portal</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Auth;
