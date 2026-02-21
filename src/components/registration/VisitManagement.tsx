import { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSchool } from '@/contexts/SchoolContext';
import { getSchoolId } from '@/utils/schoolIdMap';
import { toast } from 'sonner';
import { CalendarDays, CheckCircle2, XCircle, Loader2, Trash2, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';

export const VisitManagement = () => {
  const { selectedSchool } = useSchool();
  const queryClient = useQueryClient();
  const schoolId = getSchoolId(selectedSchool);
  const [visitFilter, setVisitFilter] = useState<'upcoming' | 'past'>('upcoming');

  const { data: visits = [], isLoading } = useQuery({
    queryKey: ['school_visits', schoolId],
    queryFn: async () => {
      if (!schoolId) return [];
      const { data, error } = await (supabase.from('school_visits') as any)
        .select('*, online_registrations(student_name, level, current_address, phil_address, birth_date, mobile_number), visitor_phone, visitor_email, visitor_level, visitor_birth_date, visitor_address, visitor_student_name')
        .eq('school_id', schoolId)
        .order('visit_date', { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: !!schoolId,
  });

  const today = new Date().toISOString().split('T')[0];
  const filteredVisits = visits.filter((v: any) =>
    visitFilter === 'upcoming' ? v.visit_date >= today : v.visit_date < today
  );

  const updateVisitStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await (supabase.from('school_visits') as any)
        .update({ status })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['school_visits'] });
      toast.success('Visit updated');
    },
    onError: (e: Error) => toast.error('Update failed: ' + e.message),
  });

  const deleteVisit = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase.from('school_visits') as any).delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['school_visits'] });
      toast.success('Visit record deleted');
    },
    onError: (e: Error) => toast.error('Delete failed: ' + e.message),
  });

  const handleShareLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/visit`);
    toast.success('Visit booking link copied!');
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground flex items-center gap-2">
            <CalendarDays className="h-7 w-7 text-stat-purple" /> Visit Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Track and manage scheduled school visits
          </p>
        </div>
        <Button variant="outline" onClick={handleShareLink}>
          <Share2 className="h-4 w-4 mr-2" /> Share Visit Link
        </Button>
      </motion.div>

      <div className="flex gap-2">
        <Button variant={visitFilter === 'upcoming' ? 'default' : 'outline'} size="sm" onClick={() => setVisitFilter('upcoming')}>Upcoming</Button>
        <Button variant={visitFilter === 'past' ? 'default' : 'outline'} size="sm" onClick={() => setVisitFilter('past')}>Past</Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
      ) : filteredVisits.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <CalendarDays className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>No {visitFilter} visits</p>
        </div>
      ) : (
        <div className="rounded-lg border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Visitor</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Slot</TableHead>
                <TableHead>Student</TableHead>
                <TableHead>Grade Level</TableHead>
                <TableHead>Age</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>Mobile No.</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredVisits.map((v: any) => (
                <TableRow key={v.id}>
                  <TableCell className="font-medium">{v.visitor_name}</TableCell>
                  <TableCell>{new Date(v.visit_date).toLocaleDateString()}</TableCell>
                  <TableCell><Badge variant="outline">{v.visit_slot === 'morning' ? '🌅 Morning' : '🌇 Afternoon'}</Badge></TableCell>
                  <TableCell className="font-medium">{v.online_registrations?.student_name || v.visitor_student_name || '---'}</TableCell>
                  <TableCell>{v.online_registrations?.level || v.visitor_level || '---'}</TableCell>
                  <TableCell>{(() => {
                    const bd = v.online_registrations?.birth_date || v.visitor_birth_date;
                    if (!bd) return '---';
                    const now = new Date();
                    const birth = new Date(bd);
                    let age = now.getFullYear() - birth.getFullYear();
                    const m = now.getMonth() - birth.getMonth();
                    if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
                    return age;
                  })()}</TableCell>
                  <TableCell className="max-w-[200px] truncate">{v.online_registrations?.current_address || v.online_registrations?.phil_address || v.visitor_address || '---'}</TableCell>
                  <TableCell>{v.online_registrations?.mobile_number || v.visitor_phone || '---'}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={
                      v.status === 'completed' ? 'bg-green-50 text-green-700 border-green-300' :
                      v.status === 'cancelled' ? 'bg-red-50 text-red-700 border-red-300' :
                      'bg-blue-50 text-blue-700 border-blue-300'
                    }>{v.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-2 justify-end">
                      {v.status === 'scheduled' && (
                        <>
                          <Button size="sm" variant="outline" className="text-green-600" onClick={() => updateVisitStatus.mutate({ id: v.id, status: 'completed' })}>
                            <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Complete
                          </Button>
                          <Button size="sm" variant="outline" className="text-red-600" onClick={() => updateVisitStatus.mutate({ id: v.id, status: 'cancelled' })}>
                            <XCircle className="h-3.5 w-3.5 mr-1" /> Cancel
                          </Button>
                        </>
                      )}
                      <Button size="sm" variant="destructive" onClick={() => { if (confirm('Delete this visit record?')) deleteVisit.mutate(v.id); }}>
                        <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};
