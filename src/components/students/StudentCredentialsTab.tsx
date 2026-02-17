import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Lock, Eye, EyeOff, Mail, KeyRound, ShieldCheck, ShieldAlert, Calendar, RotateCcw, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from '@/hooks/use-toast';

interface StudentCredentialsTabProps {
  studentId: string;
}

export const StudentCredentialsTab = ({ studentId }: StudentCredentialsTabProps) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const queryClient = useQueryClient();

  const { data: credentials, isLoading } = useQuery({
    queryKey: ['student-credentials', studentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_credentials')
        .select('*')
        .eq('student_id', studentId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const handleResetPassword = async () => {
    if (!credentials?.id || !credentials?.user_id) return;
    setIsResetting(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-users', {
        body: {
          action: 'reset_student_password',
          credentialId: credentials.id,
          userId: credentials.user_id,
        },
      });
      if (error) throw error;
      const newPassword = data?.tempPassword || data?.temp_password;
      toast({
        title: 'Password Reset Successful',
        description: newPassword
          ? `New temporary password: ${newPassword}`
          : 'The password has been reset.',
      });
      queryClient.invalidateQueries({ queryKey: ['student-credentials', studentId] });
    } catch (err: any) {
      toast({
        title: 'Reset Failed',
        description: err.message || 'Could not reset the password.',
        variant: 'destructive',
      });
    } finally {
      setIsResetting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (!credentials) {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
        <Lock className="h-10 w-10 mb-3 opacity-30" />
        <p className="text-sm font-medium">No account found</p>
        <p className="text-xs mt-1">This student does not have login credentials yet.</p>
      </div>
    );
  }

  return (
    <Card className="border shadow-sm">
      <CardContent className="p-5 space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            <Lock className="h-4 w-4" />
            Login Credentials
          </div>

          {credentials.user_id && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" disabled={isResetting}>
                  {isResetting ? (
                    <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                  ) : (
                    <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                  )}
                  Reset Password
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Reset Student Password?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will generate a new temporary password for the student. The old password will no longer work. Are you sure?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleResetPassword}>
                    Yes, Reset Password
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Email */}
          <div>
            <p className="text-xs text-muted-foreground mb-0.5 flex items-center gap-1.5">
              <Mail className="h-3 w-3" /> Email / Username
            </p>
            <p className="text-sm font-medium font-mono">{credentials.email}</p>
          </div>

          {/* Temporary Password */}
          <div>
            <p className="text-xs text-muted-foreground mb-0.5 flex items-center gap-1.5">
              <KeyRound className="h-3 w-3" /> Temporary Password
            </p>
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium font-mono">
                {showPassword ? credentials.temp_password : '••••••••'}
              </p>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </Button>
            </div>
          </div>

          {/* Password Changed Status */}
          <div>
            <p className="text-xs text-muted-foreground mb-0.5 flex items-center gap-1.5">
              {credentials.password_changed ? (
                <ShieldCheck className="h-3 w-3" />
              ) : (
                <ShieldAlert className="h-3 w-3" />
              )}
              Password Status
            </p>
            <Badge variant={credentials.password_changed ? 'default' : 'secondary'}>
              {credentials.password_changed ? 'Changed' : 'Not Changed'}
            </Badge>
          </div>

          {/* Created At */}
          {credentials.created_at && (
            <div>
              <p className="text-xs text-muted-foreground mb-0.5 flex items-center gap-1.5">
                <Calendar className="h-3 w-3" /> Account Created
              </p>
              <p className="text-sm font-medium">
                {format(new Date(credentials.created_at), 'MMM dd, yyyy h:mm a')}
              </p>
            </div>
          )}
        </div>

        <p className="text-[11px] text-muted-foreground/60 italic">
          This information is sensitive. Only admin, registrar, and IT roles can view this tab.
        </p>
      </CardContent>
    </Card>
  );
};
