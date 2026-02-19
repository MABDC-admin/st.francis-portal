import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Users, Clock, Star, UserCheck, Copy, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ApplicantDetailDialog } from './ApplicantDetailDialog';

const STATUSES = ['submitted', 'under_review', 'shortlisted', 'interview_scheduled', 'demo_teaching', 'approved', 'rejected', 'hired'] as const;

const STATUS_LABELS: Record<string, string> = {
  submitted: 'Submitted', under_review: 'Under Review', shortlisted: 'Shortlisted',
  interview_scheduled: 'Interview', demo_teaching: 'Demo Teaching', approved: 'Approved',
  rejected: 'Rejected', hired: 'Hired',
};

const STATUS_COLORS: Record<string, string> = {
  submitted: 'bg-blue-100 text-blue-800', under_review: 'bg-yellow-100 text-yellow-800',
  shortlisted: 'bg-purple-100 text-purple-800', interview_scheduled: 'bg-indigo-100 text-indigo-800',
  demo_teaching: 'bg-cyan-100 text-cyan-800', approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800', hired: 'bg-emerald-100 text-emerald-800',
};

export const TeacherApplicantDashboard = () => {
  const [search, setSearch] = useState('');
  const [activeStatus, setActiveStatus] = useState('submitted');
  const [selectedApp, setSelectedApp] = useState<any>(null);
  const queryClient = useQueryClient();

  const { data: applications = [], isLoading } = useQuery({
    queryKey: ['teacher-applications'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('teacher_applications')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status, rejection_reason }: { id: string; status: string; rejection_reason?: string }) => {
      const { error } = await supabase.from('teacher_applications').update({
        status,
        rejection_reason: rejection_reason || null,
        reviewed_at: new Date().toISOString(),
      }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher-applications'] });
      toast.success('Status updated');
    },
  });

  const filtered = applications.filter((a: any) => {
    const matchesStatus = a.status === activeStatus;
    const matchesSearch = !search || 
      `${a.first_name} ${a.last_name}`.toLowerCase().includes(search.toLowerCase()) ||
      a.email?.toLowerCase().includes(search.toLowerCase()) ||
      a.reference_number?.toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const countByStatus = (s: string) => applications.filter((a: any) => a.status === s).length;

  const copyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/apply`);
    toast.success('Application link copied!');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Teacher Applicants</h1>
          <p className="text-muted-foreground text-sm">Manage teacher applications</p>
        </div>
        <Button variant="outline" onClick={copyLink}>
          <Copy className="h-4 w-4 mr-2" /> Copy Application Link
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card><CardContent className="pt-4 text-center">
          <Users className="h-6 w-6 mx-auto text-primary mb-1" />
          <p className="text-2xl font-bold">{applications.length}</p>
          <p className="text-xs text-muted-foreground">Total Applications</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <Clock className="h-6 w-6 mx-auto text-yellow-500 mb-1" />
          <p className="text-2xl font-bold">{countByStatus('submitted') + countByStatus('under_review')}</p>
          <p className="text-xs text-muted-foreground">Pending Review</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <Star className="h-6 w-6 mx-auto text-purple-500 mb-1" />
          <p className="text-2xl font-bold">{countByStatus('shortlisted')}</p>
          <p className="text-xs text-muted-foreground">Shortlisted</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <UserCheck className="h-6 w-6 mx-auto text-green-500 mb-1" />
          <p className="text-2xl font-bold">{countByStatus('hired')}</p>
          <p className="text-xs text-muted-foreground">Hired</p>
        </CardContent></Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search by name, email or reference..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Status Tabs */}
      <Tabs value={activeStatus} onValueChange={setActiveStatus}>
        <TabsList className="flex flex-wrap h-auto gap-1">
          {STATUSES.map(s => (
            <TabsTrigger key={s} value={s} className="text-xs">
              {STATUS_LABELS[s]} ({countByStatus(s)})
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={activeStatus} className="mt-4">
          {isLoading ? (
            <p className="text-center py-8 text-muted-foreground">Loading...</p>
          ) : filtered.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">No applications found.</p>
          ) : (
            <div className="border rounded-lg overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ref #</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Position</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Date Applied</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((app: any) => (
                    <TableRow key={app.id}>
                      <TableCell className="font-mono text-xs">{app.reference_number}</TableCell>
                      <TableCell className="font-medium">{app.first_name} {app.last_name}</TableCell>
                      <TableCell>{app.position_applied}</TableCell>
                      <TableCell className="text-sm">{app.email}</TableCell>
                      <TableCell className="text-sm">{format(new Date(app.created_at), 'MMM d, yyyy')}</TableCell>
                      <TableCell>
                        <Badge className={STATUS_COLORS[app.status] || ''}>{STATUS_LABELS[app.status]}</Badge>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" onClick={() => setSelectedApp(app)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {selectedApp && (
        <ApplicantDetailDialog
          application={selectedApp}
          open={!!selectedApp}
          onClose={() => setSelectedApp(null)}
          onStatusChange={(status, reason) => {
            updateStatus.mutate({ id: selectedApp.id, status, rejection_reason: reason });
            setSelectedApp(null);
          }}
        />
      )}
    </div>
  );
};
