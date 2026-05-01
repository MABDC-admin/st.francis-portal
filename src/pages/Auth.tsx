import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import {
  ArrowUpRight,
  Bell,
  BookOpen,
  BriefcaseBusiness,
  CalendarDays,
  Eye,
  EyeOff,
  Flag,
  FlaskConical,
  Gift,
  GraduationCap,
  Heart,
  Leaf,
  Lock,
  Megaphone,
  Pin,
  Shield,
  ShieldCheck,
  Sparkles,
  Trophy,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useSchool, SCHOOL_THEMES } from "@/contexts/SchoolContext";
import { useAcademicYear } from "@/contexts/AcademicYearContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from "@/components/ui/carousel";
import { useSchoolSettings } from "@/hooks/useSchoolSettings";
import { SchoolLogo } from "@/components/branding/SchoolLogo";
import { resolveSchoolLogo } from "@/lib/schoolBranding";
import { useSchoolId } from "@/hooks/useSchoolId";

const loginSchema = z.object({
  email: z.string().min(1, "Email or LRN is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const formatBulletinDate = (value?: string | null) => {
  if (!value) return "";

  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const formatEventTypeLabel = (value?: string | null) => {
  if (!value) return "School Activity";
  return value.replace(/_/g, " ");
};

const getAnnouncementTone = (priority?: string | null) => {
  switch (priority) {
    case "high":
      return "border-l-4 border-l-red-500 bg-red-500/5";
    case "medium":
      return "border-l-4 border-l-amber-500 bg-amber-500/5";
    default:
      return "border-l-4 border-l-primary bg-primary/5";
  }
};

const getEventVisualTheme = (title?: string | null, eventType?: string | null) => {
  const normalized = `${title || ""} ${eventType || ""}`.toLowerCase();

  if (normalized.includes("labor")) {
    return {
      label: "Labor Day",
      icon: BriefcaseBusiness,
      shellClass: "border-amber-200/70 bg-[linear-gradient(135deg,rgba(255,247,237,0.98),rgba(254,243,199,0.88))]",
      badgeClass: "border-amber-300/70 bg-amber-100/80 text-amber-900",
      orbClass: "bg-[radial-gradient(circle_at_30%_30%,rgba(251,191,36,0.85),rgba(217,119,6,0.92))]",
      sparkleClass: "bg-amber-300/70",
    };
  }

  if (normalized.includes("hero")) {
    return {
      label: "Heroes Day",
      icon: Shield,
      shellClass: "border-blue-200/70 bg-[linear-gradient(135deg,rgba(239,246,255,0.98),rgba(219,234,254,0.9))]",
      badgeClass: "border-blue-300/70 bg-blue-100/80 text-blue-900",
      orbClass: "bg-[radial-gradient(circle_at_30%_30%,rgba(96,165,250,0.88),rgba(30,64,175,0.94))]",
      sparkleClass: "bg-blue-300/70",
    };
  }

  if (normalized.includes("independence") || normalized.includes("nation")) {
    return {
      label: "National Holiday",
      icon: Flag,
      shellClass: "border-rose-200/70 bg-[linear-gradient(135deg,rgba(255,241,242,0.98),rgba(254,226,226,0.9))]",
      badgeClass: "border-rose-300/70 bg-rose-100/80 text-rose-900",
      orbClass: "bg-[radial-gradient(circle_at_30%_30%,rgba(251,113,133,0.88),rgba(190,24,93,0.94))]",
      sparkleClass: "bg-rose-300/70",
    };
  }

  if (normalized.includes("christmas") || normalized.includes("holiday break")) {
    return {
      label: "Holiday Season",
      icon: Gift,
      shellClass: "border-emerald-200/70 bg-[linear-gradient(135deg,rgba(236,253,245,0.98),rgba(209,250,229,0.9))]",
      badgeClass: "border-emerald-300/70 bg-emerald-100/80 text-emerald-900",
      orbClass: "bg-[radial-gradient(circle_at_30%_30%,rgba(52,211,153,0.88),rgba(5,150,105,0.94))]",
      sparkleClass: "bg-emerald-300/70",
    };
  }

  if (normalized.includes("valentine")) {
    return {
      label: "Valentine",
      icon: Heart,
      shellClass: "border-pink-200/70 bg-[linear-gradient(135deg,rgba(253,242,248,0.98),rgba(252,231,243,0.9))]",
      badgeClass: "border-pink-300/70 bg-pink-100/80 text-pink-900",
      orbClass: "bg-[radial-gradient(circle_at_30%_30%,rgba(244,114,182,0.88),rgba(190,24,93,0.94))]",
      sparkleClass: "bg-pink-300/70",
    };
  }

  if (normalized.includes("earth") || normalized.includes("environment")) {
    return {
      label: "Nature Event",
      icon: Leaf,
      shellClass: "border-lime-200/70 bg-[linear-gradient(135deg,rgba(247,254,231,0.98),rgba(236,252,203,0.9))]",
      badgeClass: "border-lime-300/70 bg-lime-100/80 text-lime-900",
      orbClass: "bg-[radial-gradient(circle_at_30%_30%,rgba(163,230,53,0.88),rgba(77,124,15,0.94))]",
      sparkleClass: "bg-lime-300/70",
    };
  }

  if (normalized.includes("graduation") || normalized.includes("recognition") || normalized.includes("moving up")) {
    return {
      label: "Academic Milestone",
      icon: GraduationCap,
      shellClass: "border-violet-200/70 bg-[linear-gradient(135deg,rgba(245,243,255,0.98),rgba(237,233,254,0.9))]",
      badgeClass: "border-violet-300/70 bg-violet-100/80 text-violet-900",
      orbClass: "bg-[radial-gradient(circle_at_30%_30%,rgba(167,139,250,0.88),rgba(109,40,217,0.94))]",
      sparkleClass: "bg-violet-300/70",
    };
  }

  if (normalized.includes("science")) {
    return {
      label: "Science Event",
      icon: FlaskConical,
      shellClass: "border-cyan-200/70 bg-[linear-gradient(135deg,rgba(236,254,255,0.98),rgba(207,250,254,0.9))]",
      badgeClass: "border-cyan-300/70 bg-cyan-100/80 text-cyan-900",
      orbClass: "bg-[radial-gradient(circle_at_30%_30%,rgba(34,211,238,0.88),rgba(8,145,178,0.94))]",
      sparkleClass: "bg-cyan-300/70",
    };
  }

  if (normalized.includes("sport") || normalized.includes("intramural")) {
    return {
      label: "Sports Event",
      icon: Trophy,
      shellClass: "border-orange-200/70 bg-[linear-gradient(135deg,rgba(255,247,237,0.98),rgba(254,215,170,0.88))]",
      badgeClass: "border-orange-300/70 bg-orange-100/80 text-orange-900",
      orbClass: "bg-[radial-gradient(circle_at_30%_30%,rgba(251,146,60,0.88),rgba(194,65,12,0.94))]",
      sparkleClass: "bg-orange-300/70",
    };
  }

  if (normalized.includes("language") || normalized.includes("buwan ng wika") || normalized.includes("reading")) {
    return {
      label: "Literacy Event",
      icon: BookOpen,
      shellClass: "border-sky-200/70 bg-[linear-gradient(135deg,rgba(240,249,255,0.98),rgba(224,242,254,0.9))]",
      badgeClass: "border-sky-300/70 bg-sky-100/80 text-sky-900",
      orbClass: "bg-[radial-gradient(circle_at_30%_30%,rgba(56,189,248,0.88),rgba(2,132,199,0.94))]",
      sparkleClass: "bg-sky-300/70",
    };
  }

  return {
    label: "School Activity",
    icon: CalendarDays,
    shellClass: "border-emerald-200/70 bg-[linear-gradient(135deg,rgba(236,253,245,0.98),rgba(220,252,231,0.9))]",
    badgeClass: "border-emerald-300/70 bg-emerald-100/80 text-emerald-900",
    orbClass: "bg-[radial-gradient(circle_at_30%_30%,rgba(16,185,129,0.88),rgba(5,150,105,0.94))]",
    sparkleClass: "bg-emerald-300/70",
  };
};

const Auth = () => {
  const navigate = useNavigate();
  const { user, signIn, signInWithGoogle, loading } = useAuth();
  const { selectedSchool } = useSchool();
  const { selectedYearId } = useAcademicYear();
  const { data: schoolSettings } = useSchoolSettings(selectedSchool);
  const { data: schoolId } = useSchoolId();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutUntil, setLockoutUntil] = useState<number | null>(null);
  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);
  const [bulletinApi, setBulletinApi] = useState<CarouselApi>();
  const [bulletinIndex, setBulletinIndex] = useState(0);

  const { data: loginAnnouncements = [], isLoading: isLoadingAnnouncements } = useQuery({
    queryKey: ["login-announcements", schoolId, selectedYearId],
    queryFn: async () => {
      if (!schoolId || !selectedYearId) return [];

      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from("announcements")
        .select("id, title, content, priority, is_pinned, published_at, expires_at")
        .eq("school_id", schoolId)
        .eq("academic_year_id", selectedYearId)
        .or(`expires_at.is.null,expires_at.gt.${now}`)
        .order("is_pinned", { ascending: false })
        .order("published_at", { ascending: false })
        .limit(4);

      if (error) {
        console.warn("Login announcements unavailable:", error.message);
        return [];
      }

      return data || [];
    },
    enabled: !!schoolId && !!selectedYearId,
  });

  const { data: loginEvents = [], isLoading: isLoadingEvents } = useQuery({
    queryKey: ["login-events", selectedSchool],
    queryFn: async () => {
      const today = new Date().toISOString().slice(0, 10);
      const { data, error } = await supabase
        .from("school_events")
        .select("id, title, event_date, event_type, school")
        .gte("event_date", today)
        .order("event_date", { ascending: true })
        .limit(4);

      if (error) {
        console.warn("Login events unavailable:", error.message);
        return [];
      }

      return (data || []).filter((event) => event.school === selectedSchool || event.school === null);
    },
  });

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

  useEffect(() => {
    if (!bulletinApi) return;

    const onSelect = () => {
      setBulletinIndex(bulletinApi.selectedScrollSnap());
    };

    onSelect();
    bulletinApi.on("select", onSelect);
    bulletinApi.on("reInit", onSelect);

    return () => {
      bulletinApi.off("select", onSelect);
      bulletinApi.off("reInit", onSelect);
    };
  }, [bulletinApi]);

  useEffect(() => {
    if (!bulletinApi) return;

    const autoAdvance = window.setInterval(() => {
      bulletinApi.scrollNext();
    }, 3000);

    return () => {
      window.clearInterval(autoAdvance);
    };
  }, [bulletinApi]);

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

  const handleGoogleLogin = async () => {
    setIsGoogleSubmitting(true);
    const { error } = await signInWithGoogle();

    if (error) {
      toast.error(error.message);
      setIsGoogleSubmitting(false);
      return;
    }
  };

  const currentTheme = SCHOOL_THEMES[selectedSchool];
  const featuredAnnouncement = loginAnnouncements[0];
  const secondaryAnnouncements = loginAnnouncements.slice(1);

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
      <div className="relative mx-auto flex min-h-[calc(100vh-2rem)] max-w-7xl items-center">
        <div className="grid w-full gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-8">
          <div className="space-y-5 lg:space-y-6">
            <Badge variant="outline" className="w-fit rounded-full border-primary/20 bg-primary/10 px-3.5 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-primary">
              {schoolSettings?.acronym || currentTheme.name} Portal
            </Badge>
            <div className="space-y-3">
              <div className="flex items-center gap-4">
                <SchoolLogo
                  src={resolveSchoolLogo(schoolSettings?.logo_url || currentTheme.logoSrc)}
                  className="h-16 w-16 rounded-[1.35rem] border border-white/70 bg-white p-1 shadow-soft lg:h-[4.75rem] lg:w-[4.75rem]"
                />
                <div>
                  <p className="micro-label">School Portal</p>
                  <p className="text-lg font-semibold text-foreground">
                    {schoolSettings?.name || currentTheme.fullName}
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <h1 className="max-w-2xl text-4xl font-extrabold tracking-[-0.04em] text-foreground sm:text-5xl">
                  Calm, modern school access with live campus updates.
                </h1>
                <p className="max-w-xl text-sm leading-6 text-muted-foreground">
                  Sign in while staying informed with announcements, events, and a cleaner portal experience built for daily school operations.
                </p>
              </div>
            </div>

            <div className="grid max-w-2xl gap-3 sm:grid-cols-3">
              <div className="rounded-[1.35rem] border border-border/70 bg-card/88 p-4 shadow-card backdrop-blur-sm">
                <p className="micro-label">Announcements</p>
                <p className="mt-2 text-2xl font-bold tracking-tight text-foreground">{loginAnnouncements.length}</p>
                <p className="mt-1 text-xs text-muted-foreground">Published for this academic year</p>
              </div>
              <div className="rounded-[1.35rem] border border-border/70 bg-card/88 p-4 shadow-card backdrop-blur-sm">
                <p className="micro-label">Incoming Activities</p>
                <p className="mt-2 text-2xl font-bold tracking-tight text-foreground">{loginEvents.length}</p>
                <p className="mt-1 text-xs text-muted-foreground">Upcoming items on the calendar</p>
              </div>
              <div className="rounded-[1.35rem] border border-border/70 bg-card/88 p-4 shadow-card backdrop-blur-sm">
                <p className="micro-label">Portal Year</p>
                <p className="mt-2 text-lg font-bold tracking-tight text-foreground">{selectedYearId ? "Active" : "Pending"}</p>
                <p className="mt-1 text-xs text-muted-foreground">Feeds follow the selected school year</p>
              </div>
            </div>

            <div className="relative w-full max-w-2xl overflow-hidden rounded-[1.8rem] border border-border/70 bg-card/88 shadow-soft backdrop-blur">
              <div className="absolute inset-x-0 top-0 h-24 bg-[radial-gradient(circle_at_top_left,rgba(25,31,56,0.1),transparent_48%),radial-gradient(circle_at_top_right,rgba(33,196,93,0.18),transparent_40%)]" />
              <div className="relative border-b border-border/60 px-4 pb-3 pt-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1.5">
                    <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-primary">
                      <Sparkles className="h-3.5 w-3.5" />
                      Bulletin Board
                    </div>
                    <h3 className="text-base font-semibold tracking-tight text-foreground">
                      Announcements and Activities
                    </h3>
                    <p className="max-w-md text-xs text-muted-foreground">
                      Swipe through the latest school updates before signing in.
                    </p>
                  </div>
                  <div className="rounded-2xl border border-border/60 bg-background/80 px-3 py-2 text-right shadow-sm">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                      Live feed
                    </p>
                    <p className="mt-1 text-xs font-medium text-foreground">
                      {loginAnnouncements.length + loginEvents.length} updates
                    </p>
                  </div>
                </div>
              </div>

              <div className="relative px-4 pb-4 pt-3">
                <Carousel setApi={setBulletinApi} opts={{ loop: true, align: "start" }} className="w-full">
                  <CarouselContent className="-ml-0">
                    <CarouselItem className="pl-0">
                      <section className="min-h-[220px] rounded-[1.35rem] border border-border/70 bg-background/70 p-4 lg:min-h-[230px]">
                        <div className="mb-4 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <div className="rounded-lg bg-primary/10 p-2 text-primary">
                              <Megaphone className="h-3.5 w-3.5" />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-foreground">Announcements</p>
                              <p className="text-[11px] text-muted-foreground">Pinned notices and reminders</p>
                            </div>
                          </div>
                          <Badge variant="outline" className="border-border/70 bg-background/80 text-[11px]">
                            {loginAnnouncements.length} posted
                          </Badge>
                        </div>

                        {isLoadingAnnouncements ? (
                          <div className="space-y-3">
                            <div className="rounded-xl border border-border/70 bg-background/80 p-4">
                              <div className="h-4 w-24 animate-pulse rounded bg-muted" />
                              <div className="mt-3 h-5 w-3/4 animate-pulse rounded bg-muted/90" />
                              <div className="mt-2 h-3 w-full animate-pulse rounded bg-muted/80" />
                              <div className="mt-2 h-3 w-5/6 animate-pulse rounded bg-muted/70" />
                            </div>
                            <div className="grid gap-2 sm:grid-cols-2">
                              {Array.from({ length: 2 }).map((_, index) => (
                                <div key={index} className="rounded-xl border border-border/70 bg-background/70 p-3">
                                  <div className="h-3.5 w-2/3 animate-pulse rounded bg-muted" />
                                  <div className="mt-2 h-3 w-full animate-pulse rounded bg-muted/80" />
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : featuredAnnouncement ? (
                          <div className="space-y-3">
                            <article className={`rounded-[1.35rem] border border-border/70 p-4 shadow-sm ${getAnnouncementTone(featuredAnnouncement.priority)}`}>
                              <div className="flex flex-wrap items-center gap-2">
                                <Badge className="bg-foreground text-[11px] text-background hover:bg-foreground">
                                  Featured
                                </Badge>
                                {featuredAnnouncement.is_pinned ? (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-1 text-[11px] font-semibold text-primary">
                                    <Pin className="h-3 w-3" />
                                    Pinned
                                  </span>
                                ) : null}
                              </div>
                              <h4 className="mt-3 text-sm font-semibold tracking-tight text-foreground">
                                {featuredAnnouncement.title}
                              </h4>
                              <p className="mt-2 line-clamp-3 text-xs leading-5 text-muted-foreground">
                                {featuredAnnouncement.content}
                              </p>
                              <div className="mt-4 flex items-center justify-between gap-3 text-[11px] text-muted-foreground">
                                <span>{formatBulletinDate(featuredAnnouncement.published_at)}</span>
                                <span className="inline-flex items-center gap-1 font-medium text-foreground">
                                  Latest
                                  <ArrowUpRight className="h-3.5 w-3.5" />
                                </span>
                              </div>
                            </article>

                            {secondaryAnnouncements.length > 0 ? (
                              <div className="grid gap-2 sm:grid-cols-2">
                                {secondaryAnnouncements.map((announcement: any) => (
                                  <article key={announcement.id} className="rounded-2xl border border-border/70 bg-background/80 p-3 shadow-sm">
                                    <div className="flex items-start justify-between gap-2">
                                      <p className="line-clamp-2 text-xs font-semibold text-foreground">
                                        {announcement.title}
                                      </p>
                                      {announcement.is_pinned ? (
                                        <Pin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                                      ) : null}
                                    </div>
                                    <p className="mt-2 line-clamp-2 text-[11px] leading-5 text-muted-foreground">
                                      {announcement.content}
                                    </p>
                                  </article>
                                ))}
                              </div>
                            ) : null}
                          </div>
                        ) : (
                          <div className="rounded-[1.35rem] border border-dashed border-border/80 bg-background/60 p-5 text-center">
                            <Bell className="mx-auto h-8 w-8 text-primary/70" />
                            <p className="mt-3 text-sm font-semibold text-foreground">No active announcements right now.</p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              New notices will appear here as soon as they are published.
                            </p>
                          </div>
                        )}
                      </section>
                    </CarouselItem>

                    <CarouselItem className="pl-0">
                      <section className="min-h-[220px] rounded-[1.35rem] border border-border/70 bg-background/70 p-4 lg:min-h-[230px]">
                        <div className="mb-4 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-600">
                              <CalendarDays className="h-3.5 w-3.5" />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-foreground">Incoming Activities</p>
                              <p className="text-[11px] text-muted-foreground">Upcoming school events</p>
                            </div>
                          </div>
                          <Badge variant="outline" className="border-border/70 bg-background/80 text-[11px]">
                            {loginEvents.length} upcoming
                          </Badge>
                        </div>

                        {isLoadingEvents ? (
                          <div className="space-y-2.5">
                            {Array.from({ length: 3 }).map((_, index) => (
                              <div key={index} className="flex gap-3 rounded-xl border border-border/70 bg-background/80 p-3">
                                <div className="h-12 w-12 animate-pulse rounded-xl bg-muted" />
                                <div className="flex-1 space-y-2">
                                  <div className="h-3.5 w-2/3 animate-pulse rounded bg-muted" />
                                  <div className="h-3 w-full animate-pulse rounded bg-muted/80" />
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : loginEvents.length > 0 ? (
                          <div className="space-y-2.5">
                            {loginEvents.map((event: any) => {
                              const eventDate = new Date(event.event_date);
                              const theme = getEventVisualTheme(event.title, event.event_type);
                              const EventIcon = theme.icon;

                              return (
                                <article key={event.id} className="overflow-hidden rounded-2xl border border-border/70 bg-background/80 shadow-sm">
                                  <div className="flex gap-3 p-3">
                                    <div className={`relative flex h-24 w-24 shrink-0 overflow-hidden rounded-[1rem] border border-white/50 ${theme.shellClass}`}>
                                      <div className="absolute inset-0 opacity-90">
                                        <div className={`absolute left-3 top-3 h-12 w-12 rounded-full blur-sm animate-float-gentle ${theme.orbClass}`} />
                                        <div className={`absolute bottom-3 right-3 h-8 w-8 rounded-full blur-sm animate-float-gentle-delayed ${theme.orbClass}`} />
                                        <div className="absolute inset-x-3 bottom-3 h-px bg-white/70" />
                                        <div className={`absolute right-4 top-4 h-2.5 w-2.5 rounded-full animate-soft-bob ${theme.sparkleClass}`} />
                                        <div className={`absolute right-8 top-9 h-1.5 w-1.5 rounded-full animate-soft-bob-delayed ${theme.sparkleClass}`} />
                                      </div>
                                      <div className="relative z-10 flex w-full flex-col justify-between p-3">
                                        <span className={`inline-flex w-fit rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${theme.badgeClass}`}>
                                          {theme.label}
                                        </span>
                                        <div className="flex items-end justify-between">
                                          <EventIcon className="h-7 w-7 text-foreground/90" />
                                          <div className="text-right">
                                            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-foreground/70">
                                              {eventDate.toLocaleDateString("en-US", { month: "short" })}
                                            </p>
                                            <p className="text-xl font-bold leading-none text-foreground">
                                              {eventDate.toLocaleDateString("en-US", { day: "numeric" })}
                                            </p>
                                          </div>
                                        </div>
                                      </div>
                                    </div>

                                    <div className="min-w-0 flex-1">
                                      <Badge variant="outline" className="border-primary/20 bg-primary/5 text-[11px] text-primary">
                                        {formatEventTypeLabel(event.event_type)}
                                      </Badge>
                                      <p className="mt-2 line-clamp-2 text-xs font-semibold text-foreground">
                                        {event.title}
                                      </p>
                                      <p className="mt-1 text-[11px] text-muted-foreground">
                                        {formatBulletinDate(event.event_date)}
                                      </p>
                                      <p className="mt-2 line-clamp-2 text-[11px] text-muted-foreground">
                                        {theme.label} visual preview based on the activity title.
                                      </p>
                                    </div>
                                  </div>
                                  <div className="border-t border-border/60 bg-background/55 px-3 py-2">
                                    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                                      <Sparkles className="h-3.5 w-3.5 text-primary" />
                                      Animated holiday artwork adapts automatically from the event title.
                                    </div>
                                  </div>
                                </article>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="rounded-[1.35rem] border border-dashed border-border/80 bg-background/60 p-5 text-center">
                            <CalendarDays className="mx-auto h-8 w-8 text-emerald-600/80" />
                            <p className="mt-3 text-sm font-semibold text-foreground">
                              No upcoming activities have been posted yet.
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              Scheduled events will appear here once the calendar is updated.
                            </p>
                          </div>
                        )}
                      </section>
                    </CarouselItem>
                  </CarouselContent>
                </Carousel>

                <div className="mt-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    {["Announcements", "Activities"].map((label, index) => (
                      <button
                        key={label}
                        type="button"
                        onClick={() => bulletinApi?.scrollTo(index)}
                        className={`h-2.5 rounded-full transition-all ${
                          bulletinIndex === index ? "w-7 bg-primary" : "w-2.5 bg-border"
                        }`}
                        aria-label={`Go to ${label} slide`}
                      />
                    ))}
                  </div>

                  <div className="flex items-center gap-2">
            <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 rounded-xl px-3 text-xs"
                      onClick={() => bulletinApi?.scrollPrev()}
                    >
                      Previous
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 rounded-xl px-3 text-xs"
                      onClick={() => bulletinApi?.scrollNext()}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>

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
                  <Badge variant="outline" className="rounded-full border-primary/20 bg-primary/10 text-primary">
                    Google approval ready
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

                <div className="space-y-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-11 w-full justify-center gap-3 rounded-xl"
                    onClick={handleGoogleLogin}
                    disabled={isGoogleSubmitting || isSubmitting}
                  >
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-[12px] font-bold text-[#4285F4] shadow-sm">
                      G
                    </span>
                    {isGoogleSubmitting ? "Redirecting to Google..." : "Continue with Google"}
                  </Button>
                  <p className="text-center text-[11px] text-muted-foreground">
                    Google sign-in requires admin approval before learner or teacher access is activated.
                  </p>
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
