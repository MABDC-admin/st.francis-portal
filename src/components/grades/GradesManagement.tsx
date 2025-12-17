import { useState, useEffect, useRef } from 'react';
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
  Filter,
  Upload,
  Download,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import Papa from 'papaparse';
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
import { useSchool } from '@/contexts/SchoolContext';

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
  grade_levels: string[];
}

interface AcademicYear {
  id: string;
  name: string;
  is_current: boolean;
}

interface CSVGradeRow {
  lrn: string;
  subject_code: string;
  q1: string;
  q2: string;
  q3: string;
  q4: string;
  remarks?: string;
  // Parsed data
  student_id?: string;
  student_name?: string;
  subject_id?: string;
  subject_name?: string;
  isValid?: boolean;
  error?: string;
}

export const GradesManagement = () => {
  const { selectedSchool } = useSchool();
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
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [selectedGrade, setSelectedGrade] = useState<StudentGrade | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  // CSV Import state
  const [csvData, setCsvData] = useState<CSVGradeRow[]>([]);
  const [importAcademicYear, setImportAcademicYear] = useState<string>('');
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
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

  // Bulk grade entry state for add modal
  const [bulkGrades, setBulkGrades] = useState<Record<string, {
    q1: string;
    q2: string;
    q3: string;
    q4: string;
    remarks: string;
    hasExisting: boolean;
  }>>({});

  // Fetch data when school changes
  useEffect(() => {
    fetchData();
  }, [selectedSchool]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch students filtered by school first
      const { data: studentsData } = await supabase
        .from('students')
        .select('id, student_name, lrn, level')
        .eq('school', selectedSchool)
        .order('student_name');
      setStudents(studentsData || []);

      const studentIds = (studentsData || []).map(s => s.id);

      // Fetch grades only for students in the selected school
      let gradesData: any[] = [];
      if (studentIds.length > 0) {
        const { data, error: gradesError } = await supabase
          .from('student_grades')
          .select(`
            *,
            students:student_id (student_name, lrn, level),
            subjects:subject_id (code, name),
            academic_years:academic_year_id (name)
          `)
          .in('student_id', studentIds)
          .order('created_at', { ascending: false });

        if (gradesError) throw gradesError;
        gradesData = data || [];
      }

      const formattedGrades = gradesData.map((g: any) => ({
        ...g,
        student_name: g.students?.student_name,
        student_lrn: g.students?.lrn,
        student_level: g.students?.level,
        subject_code: g.subjects?.code,
        subject_name: g.subjects?.name,
        academic_year: g.academic_years?.name
      }));
      setGrades(formattedGrades);

      // Fetch subjects
      const { data: subjectsData } = await supabase
        .from('subjects')
        .select('id, code, name, grade_levels')
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
    setBulkGrades({});
    setIsAddModalOpen(true);
  };

  // Initialize bulk grades when student is selected - fetch existing grades
  const initializeBulkGrades = async (studentId: string, academicYearId?: string) => {
    const student = students.find(s => s.id === studentId);
    if (!student) return;
    
    const studentSubjects = subjects.filter(sub => sub.grade_levels.includes(student.level));
    const initialGrades: Record<string, { q1: string; q2: string; q3: string; q4: string; remarks: string; hasExisting: boolean }> = {};
    
    // Initialize all subjects with empty values
    studentSubjects.forEach(sub => {
      initialGrades[sub.id] = { q1: '', q2: '', q3: '', q4: '', remarks: '', hasExisting: false };
    });

    // Fetch existing grades for this student and academic year
    const yearId = academicYearId || formData.academic_year_id;
    if (yearId) {
      const { data: existingGrades } = await supabase
        .from('student_grades')
        .select('subject_id, q1_grade, q2_grade, q3_grade, q4_grade, remarks')
        .eq('student_id', studentId)
        .eq('academic_year_id', yearId);

      if (existingGrades) {
        existingGrades.forEach(grade => {
          if (initialGrades[grade.subject_id]) {
            initialGrades[grade.subject_id] = {
              q1: grade.q1_grade?.toString() || '',
              q2: grade.q2_grade?.toString() || '',
              q3: grade.q3_grade?.toString() || '',
              q4: grade.q4_grade?.toString() || '',
              remarks: grade.remarks || '',
              hasExisting: true
            };
          }
        });
      }
    }
    
    setBulkGrades(initialGrades);
  };

  const updateBulkGrade = (subjectId: string, field: 'q1' | 'q2' | 'q3' | 'q4' | 'remarks', value: string) => {
    setBulkGrades(prev => ({
      ...prev,
      [subjectId]: {
        ...prev[subjectId],
        [field]: value
      }
    }));
  };

  const handleBulkSave = async () => {
    if (!formData.student_id) {
      toast.error('Please select a student');
      return;
    }

    // Filter grades that have at least one quarter filled
    const gradesToSave = Object.entries(bulkGrades)
      .filter(([_, grades]) => grades.q1 || grades.q2 || grades.q3 || grades.q4)
      .map(([subjectId, grades]) => ({
        student_id: formData.student_id,
        subject_id: subjectId,
        academic_year_id: formData.academic_year_id || null,
        q1_grade: grades.q1 ? parseFloat(grades.q1) : null,
        q2_grade: grades.q2 ? parseFloat(grades.q2) : null,
        q3_grade: grades.q3 ? parseFloat(grades.q3) : null,
        q4_grade: grades.q4 ? parseFloat(grades.q4) : null,
        remarks: grades.remarks || null
      }));

    if (gradesToSave.length === 0) {
      toast.error('Please enter at least one grade');
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('student_grades')
        .upsert(gradesToSave, { 
          onConflict: 'student_id,subject_id,academic_year_id',
          ignoreDuplicates: false 
        });

      if (error) throw error;
      toast.success(`${gradesToSave.length} grade(s) saved successfully`);
      setIsAddModalOpen(false);
      setBulkGrades({});
      fetchData();
    } catch (error: any) {
      console.error('Error saving grades:', error);
      toast.error('Failed to save grades: ' + (error.message || 'Unknown error'));
    } finally {
      setIsSaving(false);
    }
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

  // CSV Import handlers
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const parsed = results.data.map((row: any) => {
          const lrn = (row.lrn || row.LRN || '').toString().trim();
          const subjectCode = (row.subject_code || row.subject || row.SUBJECT_CODE || row.SUBJECT || '').toString().trim().toUpperCase();
          
          // Find matching student and subject
          const student = students.find(s => s.lrn.toLowerCase() === lrn.toLowerCase());
          const subject = subjects.find(s => s.code.toUpperCase() === subjectCode);
          
          let error = '';
          if (!student) error = 'Student not found';
          else if (!subject) error = 'Subject not found';
          else if (!subject.grade_levels.includes(student.level)) error = 'Subject not available for student level';

          return {
            lrn,
            subject_code: subjectCode,
            q1: (row.q1 || row.Q1 || '').toString().trim(),
            q2: (row.q2 || row.Q2 || '').toString().trim(),
            q3: (row.q3 || row.Q3 || '').toString().trim(),
            q4: (row.q4 || row.Q4 || '').toString().trim(),
            remarks: (row.remarks || row.REMARKS || '').toString().trim(),
            student_id: student?.id,
            student_name: student?.student_name,
            subject_id: subject?.id,
            subject_name: subject?.name,
            isValid: !!student && !!subject && subject.grade_levels.includes(student.level),
            error
          };
        });
        
        setCsvData(parsed);
        
        // Set default academic year
        const currentYear = academicYears.find(y => y.is_current);
        if (currentYear) setImportAcademicYear(currentYear.id);
      },
      error: (error) => {
        toast.error('Failed to parse CSV file');
        console.error('CSV parse error:', error);
      }
    });
    
    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleImportGrades = async () => {
    const validRows = csvData.filter(row => row.isValid);
    if (validRows.length === 0) {
      toast.error('No valid grades to import');
      return;
    }

    if (!importAcademicYear) {
      toast.error('Please select an academic year');
      return;
    }

    setIsImporting(true);
    try {
      const gradesToInsert = validRows.map(row => ({
        student_id: row.student_id!,
        subject_id: row.subject_id!,
        academic_year_id: importAcademicYear,
        q1_grade: row.q1 ? parseFloat(row.q1) : null,
        q2_grade: row.q2 ? parseFloat(row.q2) : null,
        q3_grade: row.q3 ? parseFloat(row.q3) : null,
        q4_grade: row.q4 ? parseFloat(row.q4) : null,
        remarks: row.remarks || null
      }));

      const { error } = await supabase
        .from('student_grades')
        .upsert(gradesToInsert, { 
          onConflict: 'student_id,subject_id,academic_year_id',
          ignoreDuplicates: false 
        });

      if (error) throw error;
      
      toast.success(`Successfully imported ${validRows.length} grades`);
      setIsImportModalOpen(false);
      setCsvData([]);
      fetchData();
    } catch (error: any) {
      console.error('Import error:', error);
      toast.error('Failed to import grades: ' + (error.message || 'Unknown error'));
    } finally {
      setIsImporting(false);
    }
  };

  const downloadTemplate = () => {
    const template = 'lrn,subject_code,q1,q2,q3,q4,remarks\n12345678901,MATH101,85,88,90,92,Good performance';
    const blob = new Blob([template], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'grades_import_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportGrades = () => {
    const dataToExport = filteredGrades.map(grade => ({
      lrn: grade.student_lrn || '',
      student_name: grade.student_name || '',
      subject_code: grade.subject_code || '',
      subject_name: grade.subject_name || '',
      academic_year: grade.academic_year || '',
      q1: grade.q1_grade ?? '',
      q2: grade.q2_grade ?? '',
      q3: grade.q3_grade ?? '',
      q4: grade.q4_grade ?? '',
      final_grade: grade.final_grade ?? '',
      remarks: grade.remarks || ''
    }));

    const csv = Papa.unparse(dataToExport);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `grades_export_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${dataToExport.length} grades to CSV`);
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

  const selectedStudentForAdd = students.find(s => s.id === formData.student_id);
  const subjectsForStudent = selectedStudentForAdd 
    ? subjects.filter(sub => sub.grade_levels.includes(selectedStudentForAdd.level))
    : [];

  // Add Grade Modal - Expanded layout
  const AddGradeModal = () => (
    <Dialog open={isAddModalOpen} onOpenChange={() => setIsAddModalOpen(false)}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Add Grades</DialogTitle>
          <DialogDescription>
            Select a student to see all subjects for their grade level. Enter grades for each quarter.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
          {/* Student and Year Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Student</Label>
              <Select 
                value={formData.student_id} 
                onValueChange={(v) => {
                  setFormData({ ...formData, student_id: v });
                  initializeBulkGrades(v);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select student" />
                </SelectTrigger>
                <SelectContent>
                  {students.map(s => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.student_name} ({s.lrn}) - {s.level}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Academic Year</Label>
              <Select 
                value={formData.academic_year_id} 
                onValueChange={(v) => {
                  setFormData({ ...formData, academic_year_id: v });
                  if (formData.student_id) {
                    initializeBulkGrades(formData.student_id, v);
                  }
                }}
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
          </div>

          {/* Student Info Display */}
          {selectedStudentForAdd && (
            <div className="bg-muted/50 rounded-lg p-3 flex items-center gap-4">
              <div className="flex-1">
                <p className="font-medium">{selectedStudentForAdd.student_name}</p>
                <p className="text-sm text-muted-foreground">LRN: {selectedStudentForAdd.lrn} • Level: {selectedStudentForAdd.level}</p>
              </div>
              <div className="flex gap-2">
                <Badge variant="secondary">{subjectsForStudent.length} subjects</Badge>
                {Object.values(bulkGrades).filter(g => g.hasExisting).length > 0 && (
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                    {Object.values(bulkGrades).filter(g => g.hasExisting).length} with existing grades
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* Subjects Table */}
          {formData.student_id && subjectsForStudent.length > 0 ? (
            <div className="flex-1 overflow-auto border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="sticky top-0 bg-background min-w-[150px]">Subject</TableHead>
                    <TableHead className="sticky top-0 bg-background text-center w-[80px]">Q1</TableHead>
                    <TableHead className="sticky top-0 bg-background text-center w-[80px]">Q2</TableHead>
                    <TableHead className="sticky top-0 bg-background text-center w-[80px]">Q3</TableHead>
                    <TableHead className="sticky top-0 bg-background text-center w-[80px]">Q4</TableHead>
                    <TableHead className="sticky top-0 bg-background min-w-[120px]">Remarks</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subjectsForStudent.map(subject => (
                    <TableRow key={subject.id} className={bulkGrades[subject.id]?.hasExisting ? 'bg-blue-50/50 dark:bg-blue-950/20' : ''}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div>
                            <Badge variant="outline" className="mb-1">{subject.code}</Badge>
                            <p className="text-sm text-muted-foreground">{subject.name}</p>
                          </div>
                          {bulkGrades[subject.id]?.hasExisting && (
                            <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">Existing</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Input 
                          type="number" 
                          min="0" 
                          max="100" 
                          step="0.01"
                          value={bulkGrades[subject.id]?.q1 || ''}
                          onChange={(e) => updateBulkGrade(subject.id, 'q1', e.target.value)}
                          placeholder="Q1"
                          className="w-[70px] text-center"
                        />
                      </TableCell>
                      <TableCell>
                        <Input 
                          type="number" 
                          min="0" 
                          max="100" 
                          step="0.01"
                          value={bulkGrades[subject.id]?.q2 || ''}
                          onChange={(e) => updateBulkGrade(subject.id, 'q2', e.target.value)}
                          placeholder="Q2"
                          className="w-[70px] text-center"
                        />
                      </TableCell>
                      <TableCell>
                        <Input 
                          type="number" 
                          min="0" 
                          max="100" 
                          step="0.01"
                          value={bulkGrades[subject.id]?.q3 || ''}
                          onChange={(e) => updateBulkGrade(subject.id, 'q3', e.target.value)}
                          placeholder="Q3"
                          className="w-[70px] text-center"
                        />
                      </TableCell>
                      <TableCell>
                        <Input 
                          type="number" 
                          min="0" 
                          max="100" 
                          step="0.01"
                          value={bulkGrades[subject.id]?.q4 || ''}
                          onChange={(e) => updateBulkGrade(subject.id, 'q4', e.target.value)}
                          placeholder="Q4"
                          className="w-[70px] text-center"
                        />
                      </TableCell>
                      <TableCell>
                        <Input 
                          value={bulkGrades[subject.id]?.remarks || ''}
                          onChange={(e) => updateBulkGrade(subject.id, 'remarks', e.target.value)}
                          placeholder="Remarks"
                          className="min-w-[100px]"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : formData.student_id ? (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              No subjects available for this student's grade level.
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              Select a student to view available subjects and enter grades.
            </div>
          )}
        </div>

        <DialogFooter className="flex-shrink-0 border-t pt-4">
          <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
          <Button onClick={handleBulkSave} disabled={isSaving || !formData.student_id}>
            {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Save Grades
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  // Edit Grade Modal - Single subject form
  const EditGradeModal = () => (
    <Dialog open={isEditModalOpen} onOpenChange={() => setIsEditModalOpen(false)}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Grade</DialogTitle>
          <DialogDescription>
            Update grades for each quarter. Final grade is calculated automatically.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="bg-muted/50 rounded-lg p-3">
            <p className="font-medium">{selectedGrade?.student_name}</p>
            <p className="text-sm text-muted-foreground">
              {selectedGrade?.subject_code} - {selectedGrade?.subject_name}
            </p>
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
          <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
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
        <div className="flex flex-wrap gap-2">
          <Button onClick={handleAdd} className="w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            Add Grade
          </Button>
          <Button variant="outline" onClick={() => setIsImportModalOpen(true)} className="w-full sm:w-auto">
            <Upload className="h-4 w-4 mr-2" />
            Import CSV
          </Button>
          <Button variant="outline" onClick={exportGrades} disabled={filteredGrades.length === 0} className="w-full sm:w-auto">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
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
      <AddGradeModal />
      <EditGradeModal />

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

      {/* CSV Import Modal */}
      <Dialog open={isImportModalOpen} onOpenChange={(open) => { setIsImportModalOpen(open); if (!open) setCsvData([]); }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Import Grades from CSV</DialogTitle>
            <DialogDescription>
              Upload a CSV file with columns: lrn, subject_code, q1, q2, q3, q4, remarks
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
            {csvData.length === 0 ? (
              <div className="border-2 border-dashed rounded-lg p-8 text-center">
                <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">Select a CSV file to import grades</p>
                <div className="flex justify-center gap-2">
                  <Button onClick={() => fileInputRef.current?.click()}>
                    <Upload className="h-4 w-4 mr-2" />
                    Select File
                  </Button>
                  <Button variant="outline" onClick={downloadTemplate}>
                    <Download className="h-4 w-4 mr-2" />
                    Download Template
                  </Button>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
            ) : (
              <>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <Label>Academic Year for Import</Label>
                    <Select value={importAcademicYear} onValueChange={setImportAcademicYear}>
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
                  <div className="text-sm">
                    <span className="text-green-600 font-medium">{csvData.filter(r => r.isValid).length} valid</span>
                    {' / '}
                    <span className="text-red-600 font-medium">{csvData.filter(r => !r.isValid).length} invalid</span>
                    {' / '}
                    <span>{csvData.length} total</span>
                  </div>
                </div>
                
                <div className="flex-1 overflow-auto border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-10">Status</TableHead>
                        <TableHead>LRN</TableHead>
                        <TableHead>Student</TableHead>
                        <TableHead>Subject</TableHead>
                        <TableHead className="text-center">Q1</TableHead>
                        <TableHead className="text-center">Q2</TableHead>
                        <TableHead className="text-center">Q3</TableHead>
                        <TableHead className="text-center">Q4</TableHead>
                        <TableHead>Error</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {csvData.map((row, idx) => (
                        <TableRow key={idx} className={row.isValid ? '' : 'bg-destructive/10'}>
                          <TableCell>
                            {row.isValid ? (
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                            ) : (
                              <AlertCircle className="h-4 w-4 text-destructive" />
                            )}
                          </TableCell>
                          <TableCell className="font-mono text-xs">{row.lrn}</TableCell>
                          <TableCell>{row.student_name || '-'}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{row.subject_code}</Badge>
                            {row.subject_name && <span className="ml-1 text-xs text-muted-foreground">{row.subject_name}</span>}
                          </TableCell>
                          <TableCell className="text-center">{row.q1 || '-'}</TableCell>
                          <TableCell className="text-center">{row.q2 || '-'}</TableCell>
                          <TableCell className="text-center">{row.q3 || '-'}</TableCell>
                          <TableCell className="text-center">{row.q4 || '-'}</TableCell>
                          <TableCell className="text-destructive text-xs">{row.error}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </>
            )}
          </div>

          <DialogFooter className="flex-shrink-0">
            <Button variant="outline" onClick={() => { setIsImportModalOpen(false); setCsvData([]); }}>Cancel</Button>
            {csvData.length > 0 && (
              <>
                <Button variant="outline" onClick={() => setCsvData([])}>
                  <X className="h-4 w-4 mr-2" />
                  Clear
                </Button>
                <Button 
                  onClick={handleImportGrades} 
                  disabled={isImporting || csvData.filter(r => r.isValid).length === 0}
                >
                  {isImporting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Import {csvData.filter(r => r.isValid).length} Grades
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};