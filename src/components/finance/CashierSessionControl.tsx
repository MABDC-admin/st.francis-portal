import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CircleDollarSign, DoorOpen, DoorClosed, MinusCircle, PlusCircle } from 'lucide-react';
import { useSchool } from '@/contexts/SchoolContext';
import { useAcademicYear } from '@/contexts/AcademicYearContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Tables, TablesInsert } from '@/integrations/supabase/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

type CashierSession = Tables<'cashier_sessions'>;

const toMoney = (value: number) =>
  `₱${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const shortUser = (value: string | null) => (value ? `${value.slice(0, 8)}...` : '—');

export const CashierSessionControl = () => {
  const { selectedSchool } = useSchool();
  const { selectedYearId } = useAcademicYear();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [openingCash, setOpeningCash] = useState('');
  const [terminalId, setTerminalId] = useState('');
  const [openNotes, setOpenNotes] = useState('');

  const [actualCash, setActualCash] = useState('');
  const [closeNotes, setCloseNotes] = useState('');

  const { data: schoolData } = useQuery({
    queryKey: ['school-id', selectedSchool],
    queryFn: async () => {
      const { data, error } = await supabase.from('schools').select('id').eq('code', selectedSchool).single();
      if (error) throw error;
      return data;
    },
    enabled: !!selectedSchool,
  });

  const schoolId = schoolData?.id ?? null;

  const { data: openSession } = useQuery({
    queryKey: ['cashier-open-session', schoolId, selectedYearId, user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cashier_sessions')
        .select('*')
        .eq('school_id', schoolId!)
        .eq('academic_year_id', selectedYearId!)
        .eq('status', 'open')
        .eq('opened_by', user!.id)
        .order('opened_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!schoolId && !!selectedYearId && !!user?.id,
  });

  const { data: recentSessions = [] } = useQuery({
    queryKey: ['cashier-sessions', schoolId, selectedYearId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cashier_sessions')
        .select('*')
        .eq('school_id', schoolId!)
        .eq('academic_year_id', selectedYearId!)
        .order('opened_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      return data;
    },
    enabled: !!schoolId && !!selectedYearId,
  });

  const { data: currentCashCollections = 0 } = useQuery({
    queryKey: ['cashier-session-cash-collections', schoolId, selectedYearId, openSession?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payments')
        .select('amount')
        .eq('school_id', schoolId!)
        .eq('academic_year_id', selectedYearId!)
        .eq('status', 'verified')
        .eq('payment_method', 'cash')
        .gte('created_at', openSession!.opened_at);
      if (error) throw error;
      return (data || []).reduce((sum, row) => sum + Number(row.amount || 0), 0);
    },
    enabled: !!schoolId && !!selectedYearId && !!openSession?.id,
  });

  const expectedOnHand = useMemo(() => {
    if (!openSession) return 0;
    return Number(openSession.opening_cash || 0) + currentCashCollections;
  }, [openSession, currentCashCollections]);

  const openSessionMutation = useMutation({
    mutationFn: async () => {
      const parsedOpening = Number(openingCash);
      if (!Number.isFinite(parsedOpening) || parsedOpening < 0) {
        throw new Error('Opening cash must be zero or greater.');
      }

      const payload: TablesInsert<'cashier_sessions'> = {
        school_id: schoolId!,
        academic_year_id: selectedYearId!,
        opened_by: user!.id,
        opening_cash: parsedOpening,
        expected_cash: parsedOpening,
        terminal_id: terminalId.trim() || null,
        notes: openNotes.trim() || null,
        status: 'open',
      };

      const { error } = await supabase.from('cashier_sessions').insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Cashier session opened');
      setOpeningCash('');
      setTerminalId('');
      setOpenNotes('');
      queryClient.invalidateQueries({ queryKey: ['cashier-open-session'] });
      queryClient.invalidateQueries({ queryKey: ['cashier-sessions'] });
      queryClient.invalidateQueries({ queryKey: ['cashier-session-cash-collections'] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const closeSessionMutation = useMutation({
    mutationFn: async () => {
      if (!openSession) throw new Error('No open cashier session found.');

      const parsedActual = Number(actualCash);
      if (!Number.isFinite(parsedActual) || parsedActual < 0) {
        throw new Error('Actual cash must be zero or greater.');
      }

      const { data: cashPayments, error: paymentsError } = await supabase
        .from('payments')
        .select('amount')
        .eq('school_id', schoolId!)
        .eq('academic_year_id', selectedYearId!)
        .eq('status', 'verified')
        .eq('payment_method', 'cash')
        .gte('created_at', openSession.opened_at)
        .lte('created_at', new Date().toISOString());

      if (paymentsError) throw paymentsError;

      const collectedCash = (cashPayments || []).reduce((sum, row) => sum + Number(row.amount || 0), 0);
      const recomputedExpected = Number(openSession.opening_cash || 0) + collectedCash;

      const { error } = await supabase
        .from('cashier_sessions')
        .update({
          status: 'closed',
          expected_cash: recomputedExpected,
          actual_cash: parsedActual,
          closed_by: user!.id,
          closed_at: new Date().toISOString(),
          notes: closeNotes.trim() || openSession.notes,
        })
        .eq('id', openSession.id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Cashier session closed');
      setActualCash('');
      setCloseNotes('');
      queryClient.invalidateQueries({ queryKey: ['cashier-open-session'] });
      queryClient.invalidateQueries({ queryKey: ['cashier-sessions'] });
      queryClient.invalidateQueries({ queryKey: ['cashier-session-cash-collections'] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const openSessionTyped = openSession as CashierSession | null;

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-foreground">Cashier Sessions</h1>
        <p className="text-muted-foreground">Open and close shift sessions with opening/ending cash control.</p>
      </motion.div>

      {!openSessionTyped ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DoorOpen className="h-5 w-5 text-emerald-600" />
              Open New Session
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="opening-cash">Opening Cash</Label>
                <Input
                  id="opening-cash"
                  type="number"
                  min="0"
                  placeholder="0.00"
                  value={openingCash}
                  onChange={(event) => setOpeningCash(event.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="terminal-id">Terminal / Session ID</Label>
                <Input
                  id="terminal-id"
                  placeholder="e.g. Window 1"
                  value={terminalId}
                  onChange={(event) => setTerminalId(event.target.value)}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="open-notes">Opening Notes</Label>
              <Textarea
                id="open-notes"
                placeholder="Optional notes for this cashier shift"
                value={openNotes}
                onChange={(event) => setOpenNotes(event.target.value)}
              />
            </div>
            <Button
              onClick={() => openSessionMutation.mutate()}
              disabled={openSessionMutation.isPending || !schoolId || !selectedYearId}
            >
              <DoorOpen className="h-4 w-4 mr-2" />
              Open Session
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CircleDollarSign className="h-5 w-5 text-blue-600" />
              Active Session
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <Card>
                <CardContent className="p-3">
                  <p className="text-xs text-muted-foreground">Opened At</p>
                  <p className="text-sm font-semibold">{new Date(openSessionTyped.opened_at).toLocaleString()}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3">
                  <p className="text-xs text-muted-foreground">Opening Cash</p>
                  <p className="text-sm font-semibold">{toMoney(Number(openSessionTyped.opening_cash || 0))}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3">
                  <p className="text-xs text-muted-foreground">Cash Collected</p>
                  <p className="text-sm font-semibold text-emerald-600">{toMoney(currentCashCollections)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3">
                  <p className="text-xs text-muted-foreground">Expected On Hand</p>
                  <p className="text-sm font-semibold">{toMoney(expectedOnHand)}</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="actual-cash">Actual Cash On Hand</Label>
                <Input
                  id="actual-cash"
                  type="number"
                  min="0"
                  placeholder="0.00"
                  value={actualCash}
                  onChange={(event) => setActualCash(event.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="close-notes">Closing Notes</Label>
                <Textarea
                  id="close-notes"
                  placeholder="Optional closing notes"
                  value={closeNotes}
                  onChange={(event) => setCloseNotes(event.target.value)}
                />
              </div>
            </div>

            <Button
              variant="destructive"
              onClick={() => closeSessionMutation.mutate()}
              disabled={closeSessionMutation.isPending}
            >
              <DoorClosed className="h-4 w-4 mr-2" />
              Close Session
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Recent Sessions</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Opened</TableHead>
                <TableHead>Terminal</TableHead>
                <TableHead>Opened By</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Opening</TableHead>
                <TableHead>Expected</TableHead>
                <TableHead>Actual</TableHead>
                <TableHead>Variance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentSessions.map((session) => {
                const typedSession = session as CashierSession;
                const variance = Number(typedSession.variance_cash || 0);
                const varianceClass = variance > 0 ? 'text-emerald-600' : variance < 0 ? 'text-red-600' : 'text-muted-foreground';

                return (
                  <TableRow key={typedSession.id}>
                    <TableCell>{new Date(typedSession.opened_at).toLocaleString()}</TableCell>
                    <TableCell>{typedSession.terminal_id || '—'}</TableCell>
                    <TableCell>{shortUser(typedSession.opened_by)}</TableCell>
                    <TableCell>
                      <Badge variant={typedSession.status === 'open' ? 'default' : 'secondary'}>
                        {typedSession.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{toMoney(Number(typedSession.opening_cash || 0))}</TableCell>
                    <TableCell>{toMoney(Number(typedSession.expected_cash || 0))}</TableCell>
                    <TableCell>{typedSession.actual_cash == null ? '—' : toMoney(Number(typedSession.actual_cash))}</TableCell>
                    <TableCell className={varianceClass}>
                      <span className="inline-flex items-center gap-1">
                        {variance > 0 ? <PlusCircle className="h-3.5 w-3.5" /> : variance < 0 ? <MinusCircle className="h-3.5 w-3.5" /> : null}
                        {toMoney(variance)}
                      </span>
                    </TableCell>
                  </TableRow>
                );
              })}
              {recentSessions.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                    No cashier sessions found for this school year.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
