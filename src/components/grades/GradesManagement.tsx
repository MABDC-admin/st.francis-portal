import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Search, 
  Edit, 
  Trash2, 
  Save, 
  X, 
  Plus,
  FileSpreadsheet,
  Loader2,
  ChevronDown,
  Filter
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface StudentGrade {
  id: string;
  student_id: string;
  subject_id: string;
  academic_year_id: string | null;
  q1_grade: number | null;
  q2_grade: number | null;
  q3_grade: number | null;
  q4_grade: number | null;
  final_grade: number | null;
  remarks: string | null;
  student_name?: string;
  student_lrn?: string;
  subject_code?: string;
  subject_name?: string;
  academic_year?: string;
}

interface Student {
  id: string;
  student_name: string;
  lrn: string;
  level: string;
}

interface Subject {
  id: string;
  code: string;
  name: string;
}

interface AcademicYear {
  id: string;
  name: string;
  is_current: boolean;
}

export const GradesManagement = () => {
  const [grades, setGrades] = useState<StudentGrade[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [selectedYear, setSelectedYear] = useState<string>('all');
  
  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedGrade, setSelectedGrade] = useState<StudentGrade | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    student_id: '',
    subject_id: '',
    academic_year_id: '',
    q1_grade: '',
    q2_grade: '',
    q3_grade: '',
    q4_grade: '',
    remarks: ''
  });

  // Fetch data
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch grades with related data
      const { data: gradesData, error: gradesError } = await supabase
        .from('student_grades')
        .select(`
          *,
          students:student_id (student_name, lrn, level),
          subjects:subject_id (code, name),
          academic_years:academic_year_id (name)
        `)
        .order('created_at', { ascending: false });

      if (gradesError) throw gradesError;

      const formattedGrades = (gradesData || []).map((g: any) => ({
        ...g,
        student_name: g.students?.student_name,
        student_lrn: g.students?.lrn,
        student_level: g.students?.level,
        subject_code: g.subjects?.code,
        subject_name: g.subjects?.name,
        academic_year: g.academic_years?.name
      }));
      setGrades(formattedGrades);

      // Fetch students
      const { data: studentsData } = await supabase
        .from('students')
        .select('id, student_name, lrn, level')
        .order('student_name');
      setStudents(studentsData || []);

      // Fetch subjects
      const { data: subjectsData } = await supabase
        .from('subjects')
        .select('id, code, name')
        .eq('is_active', true)
        .order('name');
      setSubjects(subjectsData || []);

      // Fetch academic years
      const { data: yearsData } = await supabase
        .from('academic_years')
        .select('id, name, is_current')
        .order('start_date', { ascending: false });
      setAcademicYears(yearsData || []);

    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load grades data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdd = () => {
    const currentYear = academicYears.find(y => y.is_current);
    setFormData({
      student_id: '',
      subject_id: '',
      academic_year_id: currentYear?.id || '',
      q1_grade: '',
      q2_grade: '',
      q3_grade: '',
      q4_grade: '',
      remarks: ''
    });
    setIsAddModalOpen(true);
  };

  const handleEdit = (grade: StudentGrade) => {
    setSelectedGrade(grade);
    setFormData({
      student_id: grade.student_id,
      subject_id: grade.subject_id,
      academic_year_id: grade.academic_year_id || '',
      q1_grade: grade.q1_grade?.toString() || '',
      q2_grade: grade.q2_grade?.toString() || '',
      q3_grade: grade.q3_grade?.toString() || '',
      q4_grade: grade.q4_grade?.toString() || '',
      remarks: grade.remarks || ''
    });
    setIsEditModalOpen(true);
  };

  const handleDelete = (grade: StudentGrade) => {
    setSelectedGrade(grade);
    setIsDeleteDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.student_id || !formData.subject_id) {
      toast.error('Please select a student and subject');
      return;
    }

    setIsSaving(true);
    try {
      const gradeData = {
        student_id: formData.student_id,
        subject_id: formData.subject_id,
        academic_year_id: formData.academic_year_id || null,
        q1_grade: formData.q1_grade ? parseFloat(formData.q1_grade) : null,
        q2_grade: formData.q2_grade ? parseFloat(formData.q2_grade) : null,
        q3_grade: formData.q3_grade ? parseFloat(formData.q3_grade) : null,
        q4_grade: formData.q4_grade ? parseFloat(formData.q4_grade) : null,
        remarks: formData.remarks || null
      };

      if (isEditModalOpen && selectedGrade) {
        const { error } = await supabase
          .from('student_grades')
          .update(gradeData)
          .eq('id', selectedGrade.id);
        if (error) throw error;
        toast.success('Grade updated successfully');
      } else {
        const { error } = await supabase
          .from('student_grades')
          .insert(gradeData);
        if (error) throw error;
        toast.success('Grade added successfully');
      }

      setIsAddModalOpen(false);
      setIsEditModalOpen(false);
      fetchData();
    } catch (error: any) {
      console.error('Error saving grade:', error);
      if (error.code === '23505') {
        toast.error('Grade already exists for this student, subject, and academic year');
      } else {
        toast.error('Failed to save grade');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedGrade) return;
    
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('student_grades')
        .delete()
        .eq('id', selectedGrade.id);
      
      if (error) throw error;
      toast.success('Grade deleted successfully');
      setIsDeleteDialogOpen(false);
      fetchData();
    } catch (error) {
      console.error('Error deleting grade:', error);
      toast.error('Failed to delete grade');
    } finally {
      setIsSaving(false);
    }
  };

  const getGradeColor = (grade: number | null) => {
    if (grade === null) return 'text-muted-foreground';
    if (grade >= 90) return 'text-green-600';
    if (grade >= 80) return 'text-blue-600';
    if (grade >= 75) return 'text-yellow-600';
    return 'text-red-600';
  };

  const filteredGrades = grades.filter(grade => {
    const matchesSearch = 
      grade.student_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      grade.student_lrn?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      grade.subject_name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesYear = selectedYear === 'all' || grade.academic_year_id === selectedYear;
    
    return matchesSearch && matchesYear;
  });

  const levels = [...new Set(students.map(s => s.level))].sort();

  const GradeFormModal = ({ isOpen, onClose, title }: { isOpen: boolean; onClose: () => void; title: string }) => (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Enter grades for each quarter. Final grade is calculated automatically.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Student</Label>
            <Select 
              value={formData.student_id} 
              onValueChange={(v) => setFormData({ ...formData, student_id: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select student" />
              </SelectTrigger>
              <SelectContent>
                {students.map(s => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.student_name} ({s.lrn})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Subject</Label>
            <Select 
              value={formData.subject_id} 
              onValueChange={(v) => setFormData({ ...formData, subject_id: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select subject" />
              </SelectTrigger>
              <SelectContent>
                {subjects.map(s => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.code} - {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Academic Year</Label>
            <Select 
              value={formData.academic_year_id} 
              onValueChange={(v) => setFormData({ ...formData, academic_year_id: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select academic year" />
              </SelectTrigger>
              <SelectContent>
                {academicYears.map(y => (
                  <SelectItem key={y.id} value={y.id}>
                    {y.name} {y.is_current && '(Current)'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Q1 Grade</Label>
              <Input 
                type="number" 
                min="0" 
                max="100" 
                step="0.01"
                value={formData.q1_grade}
                onChange={(e) => setFormData({ ...formData, q1_grade: e.target.value })}
                placeholder="0-100"
              />
            </div>
            <div className="space-y-2">
              <Label>Q2 Grade</Label>
              <Input 
                type="number" 
                min="0" 
                max="100" 
                step="0.01"
                value={formData.q2_grade}
                onChange={(e) => setFormData({ ...formData, q2_grade: e.target.value })}
                placeholder="0-100"
              />
            </div>
            <div className="space-y-2">
              <Label>Q3 Grade</Label>
              <Input 
                type="number" 
                min="0" 
                max="100" 
                step="0.01"
                value={formData.q3_grade}
                onChange={(e) => setFormData({ ...formData, q3_grade: e.target.value })}
                placeholder="0-100"
              />
            </div>
            <div className="space-y-2">
              <Label>Q4 Grade</Label>
              <Input 
                type="number" 
                min="0" 
                max="100" 
                step="0.01"
                value={formData.q4_grade}
                onChange={(e) => setFormData({ ...formData, q4_grade: e.target.value })}
                placeholder="0-100"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Remarks</Label>
            <Input 
              value={formData.remarks}
              onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
              placeholder="Optional remarks"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Grades Management</h1>
          <p className="text-muted-foreground mt-1">Manage student grades by subject and quarter</p>
        </div>
        <Button onClick={handleAdd} className="w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          Add Grade
        </Button>
      </motion.div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by student name, LRN, or subject..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Academic Year" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Years</SelectItem>
                {academicYears.map(y => (
                  <SelectItem key={y.id} value={y.id}>
                    {y.name} {y.is_current && '(Current)'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Grades Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Student Grades
            <Badge variant="secondary">{filteredGrades.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredGrades.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              No grades found. Click "Add Grade" to create one.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Year</TableHead>
                    <TableHead className="text-center">Q1</TableHead>
                    <TableHead className="text-center">Q2</TableHead>
                    <TableHead className="text-center">Q3</TableHead>
                    <TableHead className="text-center">Q4</TableHead>
                    <TableHead className="text-center">Final</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredGrades.map((grade) => (
                    <TableRow key={grade.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{grade.student_name}</p>
                          <p className="text-xs text-muted-foreground">{grade.student_lrn}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{grade.subject_code}</Badge>
                      </TableCell>
                      <TableCell>{grade.academic_year || 'N/A'}</TableCell>
                      <TableCell className={`text-center font-medium ${getGradeColor(grade.q1_grade)}`}>
                        {grade.q1_grade ?? '-'}
                      </TableCell>
                      <TableCell className={`text-center font-medium ${getGradeColor(grade.q2_grade)}`}>
                        {grade.q2_grade ?? '-'}
                      </TableCell>
                      <TableCell className={`text-center font-medium ${getGradeColor(grade.q3_grade)}`}>
                        {grade.q3_grade ?? '-'}
                      </TableCell>
                      <TableCell className={`text-center font-medium ${getGradeColor(grade.q4_grade)}`}>
                        {grade.q4_grade ?? '-'}
                      </TableCell>
                      <TableCell className={`text-center font-bold ${getGradeColor(grade.final_grade)}`}>
                        {grade.final_grade ?? '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(grade)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(grade)} className="text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      <GradeFormModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        title="Add New Grade"
      />
      <GradeFormModal 
        isOpen={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)} 
        title="Edit Grade"
      />

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Grade</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this grade record for {selectedGrade?.student_name}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};