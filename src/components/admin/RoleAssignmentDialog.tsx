import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Shield, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface UserWithRole {
  id: string;
  email: string;
  full_name: string | null;
  role: string | null;
}

interface RoleAssignmentDialogProps {
  user: UserWithRole;
  isOpen: boolean;
  onClose: () => void;
}

const roles = ['admin', 'registrar', 'teacher', 'student', 'parent'] as const;
type AppRole = typeof roles[number];

const roleColors: Record<string, string> = {
  admin: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  registrar: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  teacher: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  student: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  parent: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
};

export const RoleAssignmentDialog = ({ user, isOpen, onClose }: RoleAssignmentDialogProps) => {
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const [newRole, setNewRole] = useState<AppRole>((user.role as AppRole) || 'student');
  const [reason, setReason] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);

  const updateRoleMutation = useMutation({
    mutationFn: async () => {
      // Update the user's role
      const { error: updateError } = await supabase
        .from('user_roles')
        .update({ role: newRole })
        .eq('user_id', user.id);

      if (updateError) {
        // If no row exists, insert instead
        if (updateError.code === 'PGRST116') {
          const { error: insertError } = await supabase
            .from('user_roles')
            .insert({ user_id: user.id, role: newRole });
          
          if (insertError) throw insertError;
        } else {
          throw updateError;
        }
      }

      // Log the role change
      const { error: logError } = await supabase
        .from('role_change_logs')
        .insert([{
          user_id: user.id,
          changed_by: currentUser?.id || '',
          old_role: user.role,
          new_role: newRole,
          reason: reason || null,
        }]);

      if (logError) {
        console.error('Failed to log role change:', logError);
        // Don't throw - the role change succeeded, just logging failed
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users-with-roles'] });
      toast.success(`Role updated to ${newRole} successfully`);
      onClose();
    },
    onError: (error: any) => {
      console.error('Failed to update role:', error);
      toast.error('Failed to update role: ' + error.message);
    },
  });

  const handleSubmit = () => {
    if (newRole === user.role) {
      toast.info('Role is unchanged');
      return;
    }

    if (newRole === 'admin' && !showConfirm) {
      setShowConfirm(true);
      return;
    }

    updateRoleMutation.mutate();
  };

  const handleClose = () => {
    setShowConfirm(false);
    setNewRole((user.role as AppRole) || 'student');
    setReason('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Change User Role
          </DialogTitle>
          <DialogDescription>
            Update the role for {user.full_name || user.email}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Current Role</Label>
            <div>
              <Badge className={roleColors[user.role || 'student']}>
                {(user.role || 'student').charAt(0).toUpperCase() + (user.role || 'student').slice(1)}
              </Badge>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="new-role">New Role</Label>
            <Select value={newRole} onValueChange={(value) => {
              setNewRole(value as AppRole);
              setShowConfirm(false);
            }}>
              <SelectTrigger id="new-role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {roles.map((role) => (
                  <SelectItem key={role} value={role}>
                    {role.charAt(0).toUpperCase() + role.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Reason for Change (Optional)</Label>
            <Textarea
              id="reason"
              placeholder="Enter reason for this role change..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
            />
          </div>

          {showConfirm && newRole === 'admin' && (
            <div className="flex items-start gap-3 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
              <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-destructive">Warning: Admin Access</p>
                <p className="text-destructive/80">
                  Granting admin access gives full system control. Click "Confirm Change" again to proceed.
                </p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={updateRoleMutation.isPending || newRole === user.role}
            variant={showConfirm ? 'destructive' : 'default'}
          >
            {updateRoleMutation.isPending ? 'Updating...' : showConfirm ? 'Confirm Change' : 'Update Role'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
