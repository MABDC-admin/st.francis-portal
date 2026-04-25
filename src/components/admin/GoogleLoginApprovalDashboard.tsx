import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, Clock3, ShieldCheck, UserRound, XCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

type ApprovalStatus = 'pending' | 'approved' | 'rejected';
type AssignableRole = 'student' | 'teacher';

interface GoogleApprovalRecord {
  id: string;
  user_id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  provider: string;
  status: ApprovalStatus;
  assigned_role: AssignableRole | null;
  review_notes: string | null;
  created_at: string;
  reviewed_at: string | null;
  current_role: string | null;
}

const statusClasses: Record<ApprovalStatus, string> = {
  pending: 'bg-amber-100 text-amber-900 border-amber-200',
  approved: 'bg-emerald-100 text-emerald-900 border-emerald-200',
  rejected: 'bg-rose-100 text-rose-900 border-rose-200',
};

export const GoogleLoginApprovalDashboard = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<'all' | ApprovalStatus>('pending');
  const [roleSelections, setRoleSelections] = useState<Record<string, AssignableRole>>({});

  const { data: records = [], isLoading, isError, error } = useQuery({
    queryKey: ['google-login-approvals'],
    queryFn: async (): Promise<GoogleApprovalRecord[]> => {
      const approvalsTable = 'google_login_approvals' as any;
      const { data: approvals, error: approvalsError } = await supabase
        .from(approvalsTable)
        .select('*')
        .order('created_at', { ascending: false });

      if (approvalsError) {
        throw approvalsError;
      }

      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) {
        throw rolesError;
      }

      const roleMap = new Map((roles || []).map((entry) => [entry.user_id, entry.role]));

      return (approvals || []).map((record: any) => ({
        ...record,
        current_role: roleMap.get(record.user_id) || null,
      }));
    },
    retry: false,
    throwOnError: false,
  });

  const filteredRecords = useMemo(() => {
    if (statusFilter === 'all') {
      return records;
    }

    return records.filter((record) => record.status === statusFilter);
  }, [records, statusFilter]);

  const summary = useMemo(() => ({
    pending: records.filter((record) => record.status === 'pending').length,
    approved: records.filter((record) => record.status === 'approved').length,
    rejected: records.filter((record) => record.status === 'rejected').length,
  }), [records]);

  const reviewMutation = useMutation({
    mutationFn: async ({
      record,
      status,
      assignedRole,
    }: {
      record: GoogleApprovalRecord;
      status: 'approved' | 'rejected';
      assignedRole?: AssignableRole;
    }) => {
      const approvalsTable = 'google_login_approvals' as any;

      if (status === 'approved') {
        if (!assignedRole) {
          throw new Error('Select a role before approving.');
        }

        const { error: roleError } = await supabase
          .from('user_roles')
          .upsert({ user_id: record.user_id, role: assignedRole }, { onConflict: 'user_id' });

        if (roleError) {
          throw roleError;
        }

        if (user?.id) {
          const { error: logError } = await supabase
            .from('role_change_logs')
            .insert([{
              user_id: record.user_id,
              changed_by: user.id,
              old_role: record.current_role,
              new_role: assignedRole,
              reason: 'Approved Google login access',
            }]);

          if (logError) {
            console.error('Failed to log Google approval role change:', logError);
          }
        }
      }

      const { error: approvalError } = await supabase
        .from(approvalsTable)
        .update({
          status,
          assigned_role: status === 'approved' ? assignedRole : null,
          reviewed_at: new Date().toISOString(),
          reviewed_by: user?.id || null,
        })
        .eq('id', record.id);

      if (approvalError) {
        throw approvalError;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['google-login-approvals'] });
      queryClient.invalidateQueries({ queryKey: ['users-with-roles'] });
      toast.success(
        variables.status === 'approved'
          ? `Google access approved as ${variables.assignedRole}`
          : 'Google access request rejected',
      );
    },
    onError: (error: any) => {
      toast.error(error.message || 'Unable to review Google login request');
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Google Login Approvals</h2>
        <p className="mt-1 text-muted-foreground">
          Review Google sign-ins and assign learner or teacher access before they can enter the portal.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-card">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-amber-100 p-3 text-amber-700">
              <Clock3 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pending</p>
              <p className="text-2xl font-semibold text-foreground">{summary.pending}</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-card">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-emerald-100 p-3 text-emerald-700">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Approved</p>
              <p className="text-2xl font-semibold text-foreground">{summary.approved}</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-card">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-rose-100 p-3 text-rose-700">
              <XCircle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Rejected</p>
              <p className="text-2xl font-semibold text-foreground">{summary.rejected}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as 'all' | ApprovalStatus)}>
          <SelectTrigger className="w-full sm:w-[220px]">
            <SelectValue placeholder="Filter requests" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="all">All requests</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-4">
        {isLoading ? (
          <div className="rounded-2xl border border-border/70 bg-card p-6 text-sm text-muted-foreground shadow-card">
            Loading Google login requests...
          </div>
        ) : isError ? (
          <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6 text-sm text-destructive shadow-card">
            <p className="font-semibold">Google approval data could not be loaded.</p>
            <p className="mt-2">
              {(error as Error)?.message || 'Unknown database error'}
            </p>
            <p className="mt-2 text-destructive/80">
              If this started after enabling Google login, run the migration that creates `google_login_approvals` and reload the panel.
            </p>
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border/80 bg-card p-8 text-center shadow-card">
            <ShieldCheck className="mx-auto h-10 w-10 text-primary/70" />
            <p className="mt-4 text-sm font-semibold text-foreground">No Google login requests in this view.</p>
            <p className="mt-1 text-sm text-muted-foreground">
              New Google sign-ins will appear here when users request access.
            </p>
          </div>
        ) : (
          filteredRecords.map((record) => {
            const selectedRole = roleSelections[record.id] || record.assigned_role || 'student';

            return (
              <div key={record.id} className="rounded-2xl border border-border/70 bg-card p-5 shadow-card">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex items-start gap-4">
                    {record.avatar_url ? (
                      <img
                        src={record.avatar_url}
                        alt={record.full_name || record.email || 'Google user'}
                        className="h-14 w-14 rounded-2xl border border-border/60 object-cover"
                      />
                    ) : (
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-border/60 bg-muted text-muted-foreground">
                        <UserRound className="h-6 w-6" />
                      </div>
                    )}

                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-base font-semibold text-foreground">
                          {record.full_name || 'Unnamed Google user'}
                        </p>
                        <Badge variant="outline" className={statusClasses[record.status]}>
                          {record.status}
                        </Badge>
                        <Badge variant="outline" className="border-border/70 bg-background/80">
                          {record.provider}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{record.email || 'No email provided'}</p>
                      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                        <span>Requested: {new Date(record.created_at).toLocaleString()}</span>
                        <span>Current role: {record.current_role || 'none'}</span>
                        {record.reviewed_at ? <span>Reviewed: {new Date(record.reviewed_at).toLocaleString()}</span> : null}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <Select
                      value={selectedRole}
                      onValueChange={(value) => {
                        setRoleSelections((current) => ({ ...current, [record.id]: value as AssignableRole }));
                      }}
                    >
                      <SelectTrigger className="w-full sm:w-[160px]">
                        <SelectValue placeholder="Assign role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="student">Student</SelectItem>
                        <SelectItem value="teacher">Teacher</SelectItem>
                      </SelectContent>
                    </Select>

                    <Button
                      className="sm:min-w-[120px]"
                      onClick={() => reviewMutation.mutate({ record, status: 'approved', assignedRole: selectedRole })}
                      disabled={reviewMutation.isPending}
                    >
                      Approve
                    </Button>
                    <Button
                      variant="outline"
                      className="border-destructive/30 text-destructive hover:bg-destructive/5 sm:min-w-[120px]"
                      onClick={() => reviewMutation.mutate({ record, status: 'rejected' })}
                      disabled={reviewMutation.isPending}
                    >
                      Reject
                    </Button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
