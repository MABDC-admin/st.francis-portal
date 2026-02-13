import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { KeyRound, Check, X, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface ResetPasswordDialogProps {
  user: { id: string; email: string; full_name: string | null };
  isOpen: boolean;
  onClose: () => void;
}

const passwordRules = [
  { label: 'At least 8 characters', test: (p: string) => p.length >= 8 },
  { label: 'Uppercase letter', test: (p: string) => /[A-Z]/.test(p) },
  { label: 'Lowercase letter', test: (p: string) => /[a-z]/.test(p) },
  { label: 'Number', test: (p: string) => /[0-9]/.test(p) },
  { label: 'Special character', test: (p: string) => /[!@#$%^&*(),.?":{}|<>]/.test(p) },
];

export const ResetPasswordDialog = ({ user, isOpen, onClose }: ResetPasswordDialogProps) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const allValid = passwordRules.every(r => r.test(password)) && password === confirmPassword && password.length > 0;

  const resetMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('reset-password', {
        body: { userId: user.id, newPassword: password },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      toast.success(`Password reset for ${user.full_name || user.email}`);
      handleClose();
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to reset password');
    },
  });

  const handleClose = () => {
    setPassword('');
    setConfirmPassword('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-primary" />
            Reset Password
          </DialogTitle>
          <DialogDescription>
            Set a new password for {user.full_name || user.email}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="new-password">New Password</Label>
            <Input
              id="new-password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Enter new password"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirm Password</Label>
            <Input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
            />
            {confirmPassword && password !== confirmPassword && (
              <p className="text-xs text-destructive">Passwords do not match</p>
            )}
          </div>

          {/* Validation Rules */}
          <div className="space-y-1.5 p-3 rounded-lg bg-muted/50">
            <p className="text-xs font-medium text-muted-foreground mb-2">Password requirements:</p>
            {passwordRules.map(rule => {
              const passes = rule.test(password);
              return (
                <div key={rule.label} className="flex items-center gap-2 text-xs">
                  {passes ? (
                    <Check className="h-3.5 w-3.5 text-green-500" />
                  ) : (
                    <X className="h-3.5 w-3.5 text-muted-foreground" />
                  )}
                  <span className={passes ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}>
                    {rule.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>Cancel</Button>
          <Button
            onClick={() => resetMutation.mutate()}
            disabled={!allValid || resetMutation.isPending}
          >
            {resetMutation.isPending ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Resetting...</>
            ) : (
              'Reset Password'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
