import { AlertTriangle, LogOut, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SchoolLogo } from '@/components/branding/SchoolLogo';
import { useSchool, SCHOOL_THEMES } from '@/contexts/SchoolContext';
import { useSchoolSettings } from '@/hooks/useSchoolSettings';
import { resolveSchoolLogo } from '@/lib/schoolBranding';

interface GoogleApprovalStatusPageProps {
  status: 'pending' | 'rejected';
  onSignOut: () => Promise<void>;
}

export const GoogleApprovalStatusPage = ({ status, onSignOut }: GoogleApprovalStatusPageProps) => {
  const { selectedSchool } = useSchool();
  const { data: schoolSettings } = useSchoolSettings(selectedSchool);
  const currentTheme = SCHOOL_THEMES[selectedSchool];
  const isRejected = status === 'rejected';

  return (
    <div className="relative min-h-screen overflow-hidden bg-background px-4 py-6">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(0,123,255,0.14),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(239,68,68,0.08),transparent_22%)]" />
      <div className="relative mx-auto flex min-h-[calc(100vh-3rem)] max-w-3xl items-center justify-center">
        <div className="w-full max-w-xl rounded-[2rem] border border-border/70 bg-card/90 p-8 shadow-soft backdrop-blur">
          <div className="flex items-center gap-4">
            <SchoolLogo
              src={resolveSchoolLogo(schoolSettings?.logo_url || currentTheme.logoSrc)}
              className="h-16 w-16 rounded-[1.35rem] border border-border/60 shadow-soft"
            />
            <div>
              <p className="micro-label">Google Access</p>
              <h1 className="text-xl font-semibold text-foreground">
                {schoolSettings?.name || currentTheme.fullName}
              </h1>
            </div>
          </div>

          <div className={`mt-8 rounded-[1.6rem] border p-6 ${isRejected ? 'border-destructive/30 bg-destructive/5' : 'border-primary/20 bg-primary/5'}`}>
            <div className="flex items-start gap-4">
              <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${isRejected ? 'bg-destructive/15 text-destructive' : 'bg-primary/12 text-primary'}`}>
                {isRejected ? <AlertTriangle className="h-6 w-6" /> : <ShieldCheck className="h-6 w-6" />}
              </div>
              <div className="space-y-2">
                <h2 className="text-lg font-semibold text-foreground">
                  {isRejected ? 'Google access was not approved' : 'Google access is waiting for approval'}
                </h2>
                <p className="text-sm leading-6 text-muted-foreground">
                  {isRejected
                    ? 'An administrator reviewed this Google login request and did not grant portal access. Please contact the school admin team if you need this account reopened.'
                    : 'Your Google account has been recorded successfully, but an administrator still needs to assign your portal role before you can continue. Once approved, you will be able to enter as a learner or teacher.'}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-border/70 bg-background/70 p-5">
            <p className="text-sm font-semibold text-foreground">What happens next</p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {isRejected
                ? 'Ask the admin to review the Google login request again and assign the correct role if access should be restored.'
                : 'The admin will review your Google login request in the approval dashboard, choose whether you are a student or teacher, and activate access from there.'}
            </p>
          </div>

          <div className="mt-6 flex justify-end">
            <Button variant="outline" onClick={() => void onSignOut()} className="gap-2">
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
