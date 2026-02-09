import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Search, X, Loader2, Users, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useSchool } from '@/contexts/SchoolContext';
import { useAcademicYear } from '@/contexts/AcademicYearContext';
import { AnimatedStudentAvatar } from '@/components/students/AnimatedStudentAvatar';
import { StudentProfileModal } from '@/components/students/StudentProfileModal';
import type { Student } from '@/types/student';

export const FinanceLearnerPage = () => {
  const { selectedSchool } = useSchool();
  const { selectedYearId } = useAcademicYear();
  const [searchQuery, setSearchQuery] = useState('');
  const [gradeFilter, setGradeFilter] = useState('all');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);

  // Get school UUID
  const { data: schoolId } = useQuery({
    queryKey: ['school-id-finance', selectedSchool],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('schools')
        .select('id')
        .eq('code', selectedSchool)
        .single();
      if (error) throw error;
      return data?.id;
    },
  });

  // Fetch students for this school
  const { data: students = [], isLoading } = useQuery({
    queryKey: ['finance-learners', schoolId],
    queryFn: async () => {
      if (!schoolId) return [];

      // Students table uses text 'school' column (MABDC/STFXSA), not UUID school_id
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('school', selectedSchool)
        .order('student_name', { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!schoolId,
  });

  // Fetch financial summaries for these students
  const studentIds = students.map((s: any) => s.id);
  const { data: assessments = [] } = useQuery({
    queryKey: ['finance-learner-assessments', schoolId, selectedYearId, studentIds.length],
    queryFn: async () => {
      if (!schoolId || !selectedYearId || studentIds.length === 0) return [];

      const { data, error } = await supabase
        .from('student_assessments')
        .select('student_id, total_amount, total_paid, balance, status')
        .eq('school_id', schoolId)
        .eq('academic_year_id', selectedYearId)
        .in('student_id', studentIds);

      if (error) throw error;
      return data || [];
    },
    enabled: !!schoolId && !!selectedYearId && studentIds.length > 0,
  });

  // Build assessment lookup
  const assessmentMap = useMemo(() => {
    const map: Record<string, { total_amount: number; total_paid: number; balance: number; status: string }> = {};
    assessments.forEach((a: any) => {
      map[a.student_id] = {
        total_amount: Number(a.total_amount || 0),
        total_paid: Number(a.total_paid || 0),
        balance: Number(a.balance || 0),
        status: a.status || 'none',
      };
    });
    return map;
  }, [assessments]);

  // Get unique grade levels
  const gradeLevels = useMemo(() => {
    const levels = new Set(students.map((s: any) => s.level).filter(Boolean));
    return Array.from(levels).sort();
  }, [students]);

  // Filter students
  const filteredStudents = useMemo(() => {
    let filtered = students;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter((s: any) =>
        s.student_name?.toLowerCase().includes(q) ||
        s.lrn?.toLowerCase().includes(q)
      );
    }

    if (gradeFilter !== 'all') {
      filtered = filtered.filter((s: any) => s.level === gradeFilter);
    }

    return filtered;
  }, [students, searchQuery, gradeFilter]);

  const totalAssessed = Object.values(assessmentMap).reduce((sum, a) => sum + a.total_amount, 0);
  const totalCollected = Object.values(assessmentMap).reduce((sum, a) => sum + a.total_paid, 0);
  const totalOutstanding = Object.values(assessmentMap).reduce((sum, a) => sum + a.balance, 0);

  const getStatusBadge = (studentId: string) => {
    const a = assessmentMap[studentId];
    if (!a) return <Badge variant="outline" className="text-[10px]">No Assessment</Badge>;
    if (a.balance <= 0) return <Badge className="bg-green-500/10 text-green-600 border-green-200 text-[10px]">Fully Paid</Badge>;
    if (a.total_paid > 0) return <Badge className="bg-amber-500/10 text-amber-600 border-amber-200 text-[10px]">Partial</Badge>;
    return <Badge className="bg-red-500/10 text-red-600 border-red-200 text-[10px]">Unpaid</Badge>;
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Finance - Learners</h1>
        <p className="text-muted-foreground mt-1">Browse and search learners with financial summaries ({selectedSchool})</p>
      </motion.div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total Learners</p>
            <p className="text-2xl font-bold">{students.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total Assessed</p>
            <p className="text-2xl font-bold">₱{totalAssessed.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total Collected</p>
            <p className="text-2xl font-bold text-green-600">₱{totalCollected.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Outstanding</p>
            <p className="text-2xl font-bold text-amber-600">₱{totalOutstanding.toLocaleString()}</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name or LRN..."
                className="pl-10 pr-10"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                  onClick={() => setSearchQuery('')}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            <Select value={gradeFilter} onValueChange={setGradeFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="All Grade Levels" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Grade Levels</SelectItem>
                {gradeLevels.map((level) => (
                  <SelectItem key={level as string} value={level as string}>{level as string}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Student Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4" />
            {filteredStudents.length} Learner{filteredStudents.length !== 1 ? 's' : ''} found
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center p-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-muted-foreground">
              <Users className="h-12 w-12 mb-3 opacity-30" />
              <p className="text-sm">No learners found</p>
              {searchQuery && <p className="text-xs mt-1">Try adjusting your search</p>}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12"></TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>LRN</TableHead>
                    <TableHead>Grade Level</TableHead>
                    
                    <TableHead className="text-right">Assessed</TableHead>
                    <TableHead className="text-right">Paid</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.map((student: any) => {
                    const fin = assessmentMap[student.id];
                    return (
                      <TableRow key={student.id} className="cursor-pointer hover:bg-muted/50">
                        <TableCell className="w-12">
                          <AnimatedStudentAvatar
                            photoUrl={student.photo_url}
                            name={student.student_name}
                            size="sm"
                            enableAnimation={false}
                          />
                        </TableCell>
                        <TableCell>
                          <button
                            className="font-medium text-primary hover:underline underline-offset-2 cursor-pointer text-left"
                            onClick={() => { setSelectedStudent(student as Student); setProfileOpen(true); }}
                          >
                            {student.student_name}
                          </button>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-xs">{student.lrn || '—'}</TableCell>
                        <TableCell>{student.level || '—'}</TableCell>
                        
                        <TableCell className="text-right">₱{(fin?.total_amount || 0).toLocaleString()}</TableCell>
                        <TableCell className="text-right text-green-600">₱{(fin?.total_paid || 0).toLocaleString()}</TableCell>
                        <TableCell className="text-right font-semibold">{fin?.balance ? `₱${fin.balance.toLocaleString()}` : '—'}</TableCell>
                        <TableCell>{getStatusBadge(student.id)}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
      <StudentProfileModal
        student={selectedStudent}
        isOpen={profileOpen}
        onClose={() => { setProfileOpen(false); setSelectedStudent(null); }}
      />
    </div>
  );
};
