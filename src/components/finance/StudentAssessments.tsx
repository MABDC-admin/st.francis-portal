import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, UserPlus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useSchool } from '@/contexts/SchoolContext';
import { useAcademicYear } from '@/contexts/AcademicYearContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  partial: 'bg-blue-100 text-blue-800',
  paid: 'bg-green-100 text-green-800',
  overpaid: 'bg-purple-100 text-purple-800',
  closed: 'bg-red-100 text-red-800',
};

export const StudentAssessments = () => {
  const { selectedSchool } = useSchool();
  const { selectedYearId } = useAcademicYear();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [assessOpen, setAssessOpen] = useState(false);
  const [studentSearch, setStudentSearch] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);

  const { data: schoolData } = useQuery({
    queryKey: ['school-id', selectedSchool],
    queryFn: async () => {
      const { data } = await supabase.from('schools').select('id').eq('code', selectedSchool).single();
      return data;
    },
  });

  const { data: assessments = [] } = useQuery({
    queryKey: ['student-assessments', schoolData?.id, selectedYearId],
    queryFn: async () => {
      let query = supabase.from('student_assessments').select('*, students(student_name, lrn, level)').eq('school_id', schoolData!.id);
      if (selectedYearId) query = query.eq('academic_year_id', selectedYearId);
      const { data } = await query.order('created_at', { ascending: false });
      return data || [];
    },
    enabled: !!schoolData?.id,
  });

  // Students for the assess dialog
  const { data: students = [] } = useQuery({
    queryKey: ['students-for-assess', schoolData?.id, studentSearch],
    queryFn: async () => {
      let query = supabase.from('students').select('id, student_name, lrn, level').eq('school_id', schoolData!.id);
      if (studentSearch) {
        query = query.or(`student_name.ilike.%${studentSearch}%,lrn.ilike.%${studentSearch}%`);
      }
      const { data } = await query.limit(20).order('student_name');
      return data || [];
    },
    enabled: !!schoolData?.id && assessOpen,
  });

  // Templates for the assess dialog
  const { data: templates = [] } = useQuery({
    queryKey: ['fee-templates-active', schoolData?.id, selectedYearId],
    queryFn: async () => {
      let query = supabase.from('fee_templates').select('*').eq('school_id', schoolData!.id).eq('is_active', true);
      if (selectedYearId) query = query.eq('academic_year_id', selectedYearId);
      const { data } = await query.order('grade_level');
      return data || [];
    },
    enabled: !!schoolData?.id && assessOpen,
  });

  // Template items preview
  const { data: templateItems = [] } = useQuery({
    queryKey: ['fee-template-items-preview', selectedTemplateId],
    queryFn: async () => {
      const { data } = await supabase.from('fee_template_items').select('*, fee_catalog(name)').eq('template_id', selectedTemplateId!);
      return data || [];
    },
    enabled: !!selectedTemplateId,
  });

  const templateTotal = templateItems.reduce((sum: number, i: any) => sum + Number(i.amount), 0);
  const selectedStudent = students.find((s: any) => s.id === selectedStudentId);

  const createAssessment = useMutation({
    mutationFn: async () => {
      if (!selectedStudentId || !selectedTemplateId || !schoolData?.id || !selectedYearId) {
        throw new Error('Please select a student and template');
      }

      // Check for existing assessment
      const { data: existing } = await supabase.from('student_assessments')
        .select('id').eq('student_id', selectedStudentId).eq('academic_year_id', selectedYearId).eq('is_closed', false).limit(1);
      if (existing && existing.length > 0) {
        throw new Error('This student already has an active assessment for the current year');
      }

      const { data: session } = await supabase.auth.getSession();
      const userId = session?.session?.user?.id;

      const { data: assessment, error } = await supabase.from('student_assessments').insert({
        student_id: selectedStudentId,
        school_id: schoolData.id,
        academic_year_id: selectedYearId,
        template_id: selectedTemplateId,
        total_amount: templateTotal,
        net_amount: templateTotal,
        balance: templateTotal,
        assessed_by: userId || null,
        assessed_at: new Date().toISOString(),
        status: 'pending',
      }).select('id').single();
      if (error) throw error;

      const items = templateItems.map((i: any) => ({
        assessment_id: assessment.id,
        fee_catalog_id: i.fee_catalog_id,
        name: (i.fee_catalog as any)?.name || 'Fee Item',
        amount: Number(i.amount),
        is_mandatory: i.is_mandatory,
      }));
      const { error: itemsError } = await supabase.from('assessment_items').insert(items);
      if (itemsError) throw itemsError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student-assessments'] });
      toast.success('Student assessed successfully');
      setAssessOpen(false);
      setSelectedStudentId(null);
      setSelectedTemplateId(null);
      setStudentSearch('');
    },
    onError: (e: any) => toast.error(e.message),
  });

  const filtered = assessments.filter((a: any) => {
    const name = a.students?.student_name?.toLowerCase() || '';
    const lrn = a.students?.lrn?.toLowerCase() || '';
    return name.includes(search.toLowerCase()) || lrn.includes(search.toLowerCase());
  });

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Student Assessments</h1>
          <p className="text-muted-foreground">View and manage student fee assessments</p>
        </div>
        <Dialog open={assessOpen} onOpenChange={(v) => {
          setAssessOpen(v);
          if (!v) { setSelectedStudentId(null); setSelectedTemplateId(null); setStudentSearch(''); }
        }}>
          <DialogTrigger asChild>
            <Button><UserPlus className="h-4 w-4 mr-2" />Assess Student</Button>
          </DialogTrigger>
          <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Assess Student</DialogTitle></DialogHeader>
            <div className="space-y-4">
              {/* Student Search */}
              <div>
                <Label>Search Student</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Name or LRN..." value={studentSearch} onChange={e => setStudentSearch(e.target.value)} className="pl-9" />
                </div>
                {students.length > 0 && !selectedStudentId && (
                  <div className="border rounded-md mt-1 max-h-40 overflow-y-auto">
                    {students.map((s: any) => (
                      <button key={s.id} className="w-full text-left px-3 py-2 hover:bg-muted text-sm" onClick={() => { setSelectedStudentId(s.id); setStudentSearch(s.student_name); }}>
                        <span className="font-medium">{s.student_name}</span>
                        <span className="text-muted-foreground ml-2">{s.lrn}</span>
                        <span className="text-muted-foreground ml-2">({s.level})</span>
                      </button>
                    ))}
                  </div>
                )}
                {selectedStudent && (
                  <div className="mt-2 p-2 bg-muted rounded-md text-sm flex justify-between items-center">
                    <span><strong>{selectedStudent.student_name}</strong> — {selectedStudent.lrn} ({selectedStudent.level})</span>
                    <Button variant="ghost" size="sm" onClick={() => { setSelectedStudentId(null); setStudentSearch(''); }}>Change</Button>
                  </div>
                )}
              </div>

              {/* Template Picker */}
              <div>
                <Label>Fee Template</Label>
                <Select value={selectedTemplateId || ''} onValueChange={v => setSelectedTemplateId(v)}>
                  <SelectTrigger><SelectValue placeholder="Select a template" /></SelectTrigger>
                  <SelectContent>
                    {templates.map((t: any) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.name} {t.grade_level ? `(${t.grade_level})` : ''} {t.strand ? `- ${t.strand}` : ''}
                      </SelectItem>
                    ))}
                    {templates.length === 0 && (
                      <div className="px-3 py-2 text-sm text-muted-foreground">No active templates. Create one in Fee Setup first.</div>
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Items Preview */}
              {templateItems.length > 0 && (
                <div>
                  <Label className="text-base">Assessment Items</Label>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Type</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {templateItems.map((i: any) => (
                        <TableRow key={i.id}>
                          <TableCell>{(i.fee_catalog as any)?.name}</TableCell>
                          <TableCell>₱{Number(i.amount).toLocaleString()}</TableCell>
                          <TableCell><Badge variant={i.is_mandatory ? 'default' : 'secondary'}>{i.is_mandatory ? 'Mandatory' : 'Optional'}</Badge></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <div className="text-right font-semibold mt-2">Total: ₱{templateTotal.toLocaleString()}</div>
                </div>
              )}

              <Button onClick={() => createAssessment.mutate()} className="w-full" disabled={!selectedStudentId || !selectedTemplateId || createAssessment.isPending}>
                Create Assessment
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </motion.div>

      <div className="flex gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by name or LRN..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Grade</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Discount</TableHead>
                <TableHead>Net</TableHead>
                <TableHead>Paid</TableHead>
                <TableHead>Balance</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Closed</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((a: any) => (
                <TableRow key={a.id} className={a.is_closed ? 'opacity-60' : ''}>
                  <TableCell>
                    <div><span className="font-medium">{a.students?.student_name}</span><br /><span className="text-xs text-muted-foreground">{a.students?.lrn}</span></div>
                  </TableCell>
                  <TableCell>{a.students?.level}</TableCell>
                  <TableCell>₱{Number(a.total_amount).toLocaleString()}</TableCell>
                  <TableCell>₱{Number(a.discount_amount).toLocaleString()}</TableCell>
                  <TableCell>₱{Number(a.net_amount).toLocaleString()}</TableCell>
                  <TableCell>₱{Number(a.total_paid).toLocaleString()}</TableCell>
                  <TableCell className="font-semibold">₱{Number(a.balance).toLocaleString()}</TableCell>
                  <TableCell><Badge className={statusColors[a.is_closed ? 'closed' : a.status] || ''}>{a.is_closed ? 'closed' : a.status}</Badge></TableCell>
                  <TableCell>{a.is_closed ? <Badge variant="destructive">Closed</Badge> : '—'}</TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground py-8">No assessments found</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
