import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  Printer,
  Download,
  Pencil,
  User,
  Users,
  Phone,
  MapPin,
  Calendar,
  BookOpen,
  GraduationCap,
  FileText,
  AlertTriangle,
  Plus,
  Loader2,
  Camera,
  X,
  Trash2,
  Save,
  FolderOpen,
  FileDown
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AnimatedStudentAvatar } from '@/components/students/AnimatedStudentAvatar';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useStudents, useUpdateStudent } from '@/hooks/useStudents';
import { useUploadStudentPhoto } from '@/hooks/useStudentDocuments';
import { DocumentsManager } from '@/components/students/DocumentsManager';
import { useColorTheme } from '@/contexts/ColorThemeContext';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { StudentSubjectsManager } from '@/components/students/StudentSubjectsManager';
import { useSchool } from '@/contexts/SchoolContext';
import { generateSF1 } from '@/utils/sf1Generator';
import { generateAnnex1 } from '@/utils/annex1Generator';
import { generateSF9 } from '@/utils/sf9Generator';
import { TransmutationManager } from '@/components/students/TransmutationManager';
import { Calculator } from 'lucide-react';

interface EnrolledSubject {
  id: string;
  code: string;
  name: string;
  status: string;
}

interface StudentGrade {
  id: string;
  subject_code: string;
  subject_name: string;
  q1_grade: number | null;
  q2_grade: number | null;
  q3_grade: number | null;
  q4_grade: number | null;
  final_grade: number | null;
  academic_year: string;
}

interface StudentIncident {
  id: string;
  incident_date: string;
  category: string;
  title: string;
  description: string | null;
  action_taken: string | null;
  reported_by: string | null;
  status: string;
}

const INCIDENT_CATEGORIES = [
  { value: 'bullying', label: 'Bullying', color: 'bg-red-100 text-red-700' },
  { value: 'bad_attitude', label: 'Bad Attitude', color: 'bg-orange-100 text-orange-700' },
  { value: 'tardiness', label: 'Tardiness', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'misconduct', label: 'Misconduct', color: 'bg-purple-100 text-purple-700' },
  { value: 'positive', label: 'Positive Behavior', color: 'bg-green-100 text-green-700' },
  { value: 'other', label: 'Other', color: 'bg-gray-100 text-gray-700' },
];

const StudentProfile = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('personal');
  const { theme } = useColorTheme();
  const [enrolledSubjects, setEnrolledSubjects] = useState<EnrolledSubject[]>([]);
  const [grades, setGrades] = useState<StudentGrade[]>([]);
  const [incidents, setIncidents] = useState<StudentIncident[]>([]);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [currentAcademicYearId, setCurrentAcademicYearId] = useState<string>('');
  const { schoolTheme } = useSchool();

  // Modal states
  const [isIncidentModalOpen, setIsIncidentModalOpen] = useState(false);
  const [isEditingIncident, setIsEditingIncident] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState<StudentIncident | null>(null);
  const [isDeleteIncidentOpen, setIsDeleteIncidentOpen] = useState(false);
  const [isSavingIncident, setIsSavingIncident] = useState(false);

  // Edit mode states
  const [isEditingPersonal, setIsEditingPersonal] = useState(false);
  const [isEditingAcademic, setIsEditingAcademic] = useState(false);
  const [isSavingStudent, setIsSavingStudent] = useState(false);

  const [incidentForm, setIncidentForm] = useState({
    incident_date: new Date().toISOString().split('T')[0],
    category: '',
    title: '',
    description: '',
    action_taken: '',
    reported_by: '',
    status: 'open'
  });

  const [studentForm, setStudentForm] = useState({
    student_name: '',
    lrn: '',
    gender: '',
    age: '',
    birth_date: '',
    father_name: '',
    father_contact: '',
    mother_maiden_name: '',
    mother_contact: '',
    uae_address: '',
    phil_address: '',
    level: '',
    school: '',
    previous_school: ''
  });

  const photoInputRef = useRef<HTMLInputElement>(null);
  const uploadPhoto = useUploadStudentPhoto();
  const updateStudent = useUpdateStudent();

  const { data: students = [], isLoading } = useStudents();
  const student = students.find(s => s.id === id);

  // Initialize student form when student data loads
  useEffect(() => {
    if (student) {
      setStudentForm({
        student_name: student.student_name || '',
        lrn: student.lrn || '',
        gender: student.gender || '',
        age: student.age?.toString() || '',
        birth_date: student.birth_date || '',
        father_name: student.father_name || '',
        father_contact: student.father_contact || '',
        mother_maiden_name: student.mother_maiden_name || '',
        mother_contact: student.mother_contact || '',
        uae_address: student.uae_address || '',
        phil_address: student.phil_address || '',
        level: student.level || '',
        school: student.school || '',
        previous_school: student.previous_school || ''
      });
    }
  }, [student]);

  // Fetch current academic year for TransmutationManager
  useEffect(() => {
    const fetchCurrentYear = async () => {
      const { data } = await supabase
        .from('academic_years')
        .select('id')
        .eq('is_current', true)
        .single();
      if (data) setCurrentAcademicYearId(data.id);
    };
    fetchCurrentYear();
  }, []);

  // Fetch enrolled subjects
  useEffect(() => {
    const fetchEnrolledSubjects = async () => {
      if (!id) return;

      const { data, error } = await supabase
        .from('student_subjects')
        .select(`
          id,
          status,
          subjects:subject_id (id, code, name)
        `)
        .eq('student_id', id);

      if (!error && data) {
        const subjects: EnrolledSubject[] = data
          .filter((item: any) => item.subjects)
          .map((item: any) => ({
            id: item.subjects.id,
            code: item.subjects.code,
            name: item.subjects.name,
            status: item.status || 'enrolled',
          }));
        setEnrolledSubjects(subjects);
      }
    };

    fetchEnrolledSubjects();
  }, [id]);

  // Fetch grades
  useEffect(() => {
    const fetchGrades = async () => {
      if (!id) return;

      const { data, error } = await supabase
        .from('student_grades')
        .select(`
          id,
          q1_grade,
          q2_grade,
          q3_grade,
          q4_grade,
          final_grade,
          subjects:subject_id (code, name),
          academic_years:academic_year_id (name)
        `)
        .eq('student_id', id)
        .order('created_at', { ascending: false });

      if (!error && data) {
        const formattedGrades = data.map((g: any) => ({
          id: g.id,
          subject_code: g.subjects?.code || '',
          subject_name: g.subjects?.name || '',
          q1_grade: g.q1_grade,
          q2_grade: g.q2_grade,
          q3_grade: g.q3_grade,
          q4_grade: g.q4_grade,
          final_grade: g.final_grade,
          academic_year: g.academic_years?.name || 'N/A'
        }));
        setGrades(formattedGrades);
      }
    };

    fetchGrades();
  }, [id]);

  // Fetch incidents
  const fetchIncidents = async () => {
    if (!id) return;

    const { data, error } = await supabase
      .from('student_incidents')
      .select('*')
      .eq('student_id', id)
      .order('incident_date', { ascending: false });

    if (!error && data) {
      setIncidents(data);
    }
  };

  useEffect(() => {
    fetchIncidents();
  }, [id]);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !student) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    setIsUploadingPhoto(true);
    try {
      await uploadPhoto.mutateAsync({ studentId: student.id, file });
      toast.success('Photo updated successfully');
    } catch (error) {
      toast.error('Failed to upload photo');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleSaveStudent = async () => {
    if (!student) return;

    setIsSavingStudent(true);
    try {
      await updateStudent.mutateAsync({
        id: student.id,
        ...studentForm,
        age: studentForm.age ? parseInt(studentForm.age) : null
      });
      toast.success('Student information updated');
      setIsEditingPersonal(false);
      setIsEditingAcademic(false);
    } catch (error) {
      toast.error('Failed to update student');
    } finally {
      setIsSavingStudent(false);
    }
  };

  const handleExportSF1 = async () => {
    if (!student) return;
    setIsExporting(true);
    try {
      generateSF1(student as any, {
        schoolName: schoolTheme.fullName,
        schoolId: schoolTheme.schoolId,
        region: schoolTheme.region,
        division: schoolTheme.division,
        district: schoolTheme.district
      });
      toast.success('SF1 generated successfully');
    } catch (error) {
      console.error('Error generating SF1:', error);
      toast.error('Failed to generate SF1');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportAnnex1 = async () => {
    if (!student) return;
    setIsExporting(true);
    try {
      generateAnnex1(student as any, {
        schoolName: schoolTheme.fullName,
        schoolId: schoolTheme.schoolId,
        region: schoolTheme.region,
        division: schoolTheme.division,
        district: schoolTheme.district
      });
      toast.success('Annex 1 generated successfully');
    } catch (error) {
      console.error('Error generating Annex 1:', error);
      toast.error('Failed to generate Annex 1');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportSF9 = async () => {
    if (!student) return;
    setIsExporting(true);
    try {
      const { data: gradesData, error: gradesError } = await supabase
        .from('student_grades')
        .select(`
          *,
          subjects:subject_id (code, name),
          academic_years:academic_year_id (name)
        `)
        .eq('student_id', student.id)
        .order('created_at', { ascending: false });

      if (gradesError) throw gradesError;

      const academicYear = gradesData?.[0]?.academic_years?.name || '2025-2026';

      const formattedGrades = (gradesData || []).map((g: any) => ({
        subject_code: g.subjects?.code || 'N/A',
        subject_name: g.subjects?.name || 'N/A',
        q1: g.q1_grade,
        q2: g.q2_grade,
        q3: g.q3_grade,
        q4: g.q4_grade,
        final: g.final_grade,
        remarks: g.remarks
      }));

      generateSF9(student as any, formattedGrades, academicYear);
      toast.success('SF9 Report Card generated successfully');
    } catch (error) {
      console.error('Error generating SF9:', error);
      toast.error('Failed to generate SF9 Report Card');
    } finally {
      setIsExporting(false);
    }
  };

  const handleOpenIncidentModal = (incident?: StudentIncident) => {
    if (incident) {
      setIsEditingIncident(true);
      setSelectedIncident(incident);
      setIncidentForm({
        incident_date: incident.incident_date,
        category: incident.category,
        title: incident.title,
        description: incident.description || '',
        action_taken: incident.action_taken || '',
        reported_by: incident.reported_by || '',
        status: incident.status
      });
    } else {
      setIsEditingIncident(false);
      setSelectedIncident(null);
      setIncidentForm({
        incident_date: new Date().toISOString().split('T')[0],
        category: '',
        title: '',
        description: '',
        action_taken: '',
        reported_by: '',
        status: 'open'
      });
    }
    setIsIncidentModalOpen(true);
  };

  const handleSaveIncident = async () => {
    if (!incidentForm.category || !incidentForm.title) {
      toast.error('Please fill in required fields');
      return;
    }

    setIsSavingIncident(true);
    try {
      if (isEditingIncident && selectedIncident) {
        const { error } = await supabase
          .from('student_incidents')
          .update(incidentForm)
          .eq('id', selectedIncident.id);

        if (error) throw error;
        toast.success('Incident updated successfully');
      } else {
        const { error } = await supabase
          .from('student_incidents')
          .insert({
            student_id: id,
            ...incidentForm
          });

        if (error) throw error;
        toast.success('Incident recorded successfully');
      }

      setIsIncidentModalOpen(false);
      fetchIncidents();
    } catch (error) {
      toast.error('Failed to save incident');
    } finally {
      setIsSavingIncident(false);
    }
  };

  const handleDeleteIncident = async () => {
    if (!selectedIncident) return;

    try {
      const { error } = await supabase
        .from('student_incidents')
        .delete()
        .eq('id', selectedIncident.id);

      if (error) throw error;
      toast.success('Incident deleted');
      setIsDeleteIncidentOpen(false);
      setSelectedIncident(null);
      fetchIncidents();
    } catch (error) {
      toast.error('Failed to delete incident');
    }
  };


  const getGradeColor = (grade: number | null) => {
    if (grade === null) return 'text-muted-foreground';
    if (grade >= 90) return 'text-green-600';
    if (grade >= 80) return 'text-blue-600';
    if (grade >= 75) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getCategoryInfo = (category: string) => {
    return INCIDENT_CATEGORIES.find(c => c.value === category) || INCIDENT_CATEGORIES[5];
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'resolved':
        return <Badge className="bg-green-100 text-green-700">Resolved</Badge>;
      case 'monitoring':
        return <Badge className="bg-yellow-100 text-yellow-700">Monitoring</Badge>;
      default:
        return <Badge className="bg-red-100 text-red-700">Open</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!student) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Student not found</p>
        <Button onClick={() => navigate('/')}>Go Back</Button>
      </div>
    );
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const InfoRow = ({ label, value }: { label: string; value: string | null | undefined }) => (
    <div className="space-y-0.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium text-foreground">{value || 'Not provided'}</p>
    </div>
  );

  const EditableField = ({
    label,
    value,
    field,
    type = 'text'
  }: {
    label: string;
    value: string;
    field: keyof typeof studentForm;
    type?: string;
  }) => (
    <div className="space-y-1">
      <Label className="text-xs">{label}</Label>
      <Input
        type={type}
        value={studentForm[field]}
        onChange={(e) => setStudentForm({ ...studentForm, [field]: e.target.value })}
        className="h-8"
      />
    </div>
  );

  return (
    <div className={cn("min-h-screen bg-background transition-colors duration-500", theme.pageBg)}>
      {/* Top Navigation Bar */}
      <div className={cn(
        "border-b border-border/50 sticky top-0 z-10 backdrop-blur-sm",
        theme.pageBg ? "bg-background/80" : "bg-card"
      )}>
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <Button
            variant="ghost"
            className="gap-2"
            onClick={() => navigate('/', { state: { activeTab: 'students' } })}
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Students
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-2" onClick={() => window.print()}>
              <Printer className="h-4 w-4" />
              Print
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-2 text-indigo-600 border-indigo-200 hover:bg-indigo-50"
              onClick={handleExportAnnex1}
              disabled={isExporting}
            >
              {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
              Annex 1
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-2 text-cyan-600 border-cyan-200 hover:bg-cyan-50"
              onClick={handleExportSF9}
              disabled={isExporting}
            >
              {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <GraduationCap className="h-4 w-4" />}
              SF9 Report
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-2 text-emerald-600 border-emerald-200 hover:bg-emerald-50"
              onClick={handleExportSF1}
              disabled={isExporting}
            >
              {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
              SF1 PDF
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Student Header Card - Teal/Cyan Gradient */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="relative overflow-hidden rounded-2xl shadow-lg"
          style={{
            background: 'linear-gradient(135deg, #0891b2 0%, #22d3ee 50%, #67e8f9 100%)'
          }}
        >
          <div className="p-6">
            <div className="flex flex-col lg:flex-row lg:items-center gap-6">
              {/* Avatar with brick animation */}
              <motion.div
                className="relative group shrink-0"
                initial={{ opacity: 0, x: -30, scale: 0.8 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoUpload}
                />
                <AnimatedStudentAvatar
                  photoUrl={student.photo_url}
                  name={student.student_name}
                  size="5xl"
                  borderColor="rgba(255,255,255,0.3)"
                />
                <button
                  onClick={() => photoInputRef.current?.click()}
                  disabled={isUploadingPhoto}
                  className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                >
                  {isUploadingPhoto ? (
                    <Loader2 className="h-5 w-5 text-white animate-spin" />
                  ) : (
                    <Camera className="h-5 w-5 text-white" />
                  )}
                </button>
              </motion.div>

              {/* Student Info */}
              <div className="flex-1 space-y-1">
                <motion.div
                  className="flex items-center gap-3 flex-wrap"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.2 }}
                >
                  <h1 className="text-xl lg:text-2xl font-bold text-white">{student.student_name}</h1>
                  <Badge className="bg-amber-400 text-amber-900 hover:bg-amber-400 border-0 font-semibold">
                    Active
                  </Badge>
                </motion.div>

                <motion.p
                  className="text-white/80 text-sm"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.3 }}
                >
                  {student.lrn} • {student.level} • {student.school || 'MABDC'}
                </motion.p>

                <motion.div
                  className="flex items-center gap-4 text-sm text-white/70 flex-wrap"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.4 }}
                >
                  {student.mother_contact && (
                    <span className="flex items-center gap-1">
                      <Phone className="h-3 w-3" /> {student.mother_contact}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> Enrolled: {formatDate(student.created_at)}
                  </span>
                </motion.div>
              </div>

              {/* Current Average */}
              <motion.div
                className="text-right"
                initial={{ opacity: 0, x: 30, scale: 0.9 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <motion.p
                  className="text-4xl font-bold text-white"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.5 }}
                >
                  {grades.length > 0 && grades[0].final_grade
                    ? grades[0].final_grade.toFixed(2)
                    : '--'}
                </motion.p>
                <motion.p
                  className="text-sm text-white/70"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3, delay: 0.6 }}
                >
                  Current Average
                </motion.p>
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div style={{ '--accent-color': theme.accentColor } as React.CSSProperties}>
            <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent flex-wrap">
              <TabsTrigger
                value="personal"
                className="rounded-none border-b-2 border-transparent data-[state=active]:bg-transparent px-4 py-3"
                style={activeTab === 'personal' ? { borderBottomColor: theme.accentColor || 'hsl(var(--primary))' } : {}}
              >
                <User className="h-4 w-4 mr-2" />
                Personal Information
              </TabsTrigger>
              <TabsTrigger
                value="academic"
                className="rounded-none border-b-2 border-transparent data-[state=active]:bg-transparent px-4 py-3"
                style={activeTab === 'academic' ? { borderBottomColor: theme.accentColor || 'hsl(var(--primary))' } : {}}
              >
                <BookOpen className="h-4 w-4 mr-2" />
                Academic History
              </TabsTrigger>
              <TabsTrigger
                value="subjects"
                className="rounded-none border-b-2 border-transparent data-[state=active]:bg-transparent px-4 py-3"
                style={activeTab === 'subjects' ? { borderBottomColor: theme.accentColor || 'hsl(var(--primary))' } : {}}
              >
                <GraduationCap className="h-4 w-4 mr-2" />
                Subjects
              </TabsTrigger>
              <TabsTrigger
                value="grades"
                className="rounded-none border-b-2 border-transparent data-[state=active]:bg-transparent px-4 py-3"
                style={activeTab === 'grades' ? { borderBottomColor: theme.accentColor || 'hsl(var(--primary))' } : {}}
              >
                <FileText className="h-4 w-4 mr-2" />
                Grades
              </TabsTrigger>
              <TabsTrigger
                value="documents"
                className="rounded-none border-b-2 border-transparent data-[state=active]:bg-transparent px-4 py-3"
                style={activeTab === 'documents' ? { borderBottomColor: theme.accentColor || 'hsl(var(--primary))' } : {}}
              >
                <FolderOpen className="h-4 w-4 mr-2" />
                Documents
              </TabsTrigger>
              <TabsTrigger
                value="anecdotal"
                className="rounded-none border-b-2 border-transparent data-[state=active]:bg-transparent px-4 py-3"
                style={activeTab === 'anecdotal' ? { borderBottomColor: theme.accentColor || 'hsl(var(--primary))' } : {}}
              >
                <AlertTriangle className="h-4 w-4 mr-2" />
                Anecdotal/Behavior
              </TabsTrigger>
              <TabsTrigger
                value="transmutation"
                className="rounded-none border-b-2 border-transparent data-[state=active]:bg-transparent px-4 py-3"
                style={activeTab === 'transmutation' ? { borderBottomColor: theme.accentColor || 'hsl(var(--primary))' } : {}}
              >
                <Calculator className="h-4 w-4 mr-2" />
                Transmutation
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Personal Information Tab */}
          <TabsContent value="personal" className="mt-6">
            <div className="flex justify-end mb-4">
              {isEditingPersonal ? (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setIsEditingPersonal(false)}>
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                  <Button size="sm" onClick={handleSaveStudent} disabled={isSavingStudent}>
                    {isSavingStudent ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                    Save Changes
                  </Button>
                </div>
              ) : (
                <Button variant="default" size="sm" onClick={() => setIsEditingPersonal(true)} className="bg-slate-700 hover:bg-slate-800 text-white gap-2">
                  <Pencil className="h-4 w-4" />
                  Edit
                </Button>
              )}
            </div>

            {isEditingPersonal ? (
              /* Edit Mode - Traditional Cards */
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Basic Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <EditableField label="Full Name" value={studentForm.student_name} field="student_name" />
                      <EditableField label="LRN" value={studentForm.lrn} field="lrn" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <Label className="text-xs">Gender</Label>
                        <Select value={studentForm.gender} onValueChange={(v) => setStudentForm({ ...studentForm, gender: v })}>
                          <SelectTrigger className="h-8">
                            <SelectValue placeholder="Select gender" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Male">Male</SelectItem>
                            <SelectItem value="Female">Female</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <EditableField label="Age" value={studentForm.age} field="age" type="number" />
                    </div>
                    <EditableField label="Birth Date" value={studentForm.birth_date} field="birth_date" type="date" />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Parents/Guardian
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <EditableField label="Father's Name" value={studentForm.father_name} field="father_name" />
                    <EditableField label="Father's Contact" value={studentForm.father_contact} field="father_contact" />
                    <EditableField label="Mother's Name" value={studentForm.mother_maiden_name} field="mother_maiden_name" />
                    <EditableField label="Mother's Contact" value={studentForm.mother_contact} field="mother_contact" />
                  </CardContent>
                </Card>

                <Card className="md:col-span-2">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Address Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <Label className="text-xs">UAE Address</Label>
                        <Textarea
                          value={studentForm.uae_address}
                          onChange={(e) => setStudentForm({ ...studentForm, uae_address: e.target.value })}
                          rows={2}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Philippine Address</Label>
                        <Textarea
                          value={studentForm.phil_address}
                          onChange={(e) => setStudentForm({ ...studentForm, phil_address: e.target.value })}
                          rows={2}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              /* View Mode - Colorful Gradient Cards */
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Basic Information Card - Teal Gradient */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.1 }}
                  className="relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900 shadow-lg border-t-4"
                  style={{ borderTopColor: '#0891b2' }}
                >
                  <div
                    className="px-5 py-3 flex items-center gap-2"
                    style={{ background: 'linear-gradient(135deg, #0891b2 0%, #22d3ee 100%)' }}
                  >
                    <User className="h-4 w-4 text-white" />
                    <h3 className="font-semibold text-white">Basic Information</h3>
                  </div>
                  <div className="p-5 space-y-4 bg-gradient-to-br from-cyan-50/50 to-white dark:from-slate-800/50 dark:to-slate-900 relative z-10">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-cyan-600 dark:text-cyan-400 font-medium">Full Name</p>
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{student.student_name}</p>
                      </div>
                      <div>
                        <p className="text-xs text-cyan-600 dark:text-cyan-400 font-medium">LRN</p>
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{student.lrn}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-cyan-600 dark:text-cyan-400 font-medium">Gender</p>
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{student.gender || 'Not provided'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-cyan-600 dark:text-cyan-400 font-medium">Age</p>
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{student.age || 'N/A'}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-cyan-600 dark:text-cyan-400 font-medium">Birth Date</p>
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{formatDate(student.birth_date)}</p>
                    </div>
                  </div>
                </motion.div>

                {/* Parents/Guardian Card - Purple/Pink Gradient */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.2 }}
                  className="relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900 shadow-lg border-t-4"
                  style={{ borderTopColor: '#a855f7' }}
                >
                  <div
                    className="px-5 py-3 flex items-center gap-2"
                    style={{ background: 'linear-gradient(135deg, #a855f7 0%, #d946ef 100%)' }}
                  >
                    <Users className="h-4 w-4 text-white" />
                    <h3 className="font-semibold text-white">Parents/Guardian</h3>
                  </div>
                  <div className="p-5 space-y-4 bg-gradient-to-br from-purple-50/50 to-white dark:from-slate-800/50 dark:to-slate-900 relative z-10">
                    <div>
                      <p className="text-xs text-purple-600 dark:text-purple-400 font-medium">Father's Name</p>
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{student.father_name || 'Not provided'}</p>
                      <p className="text-xs text-purple-500 dark:text-purple-400 flex items-center gap-1 mt-1">
                        <Phone className="h-3 w-3" /> {student.father_contact || 'No contact'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-purple-600 dark:text-purple-400 font-medium">Mother's Name</p>
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{student.mother_maiden_name || 'Not provided'}</p>
                      <p className="text-xs text-purple-500 dark:text-purple-400 flex items-center gap-1 mt-1">
                        <Phone className="h-3 w-3" /> {student.mother_contact || 'No contact'}
                      </p>
                    </div>
                  </div>
                </motion.div>

                {/* Address Information Card - Orange/Yellow Gradient - Full Width */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.3 }}
                  className="relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900 shadow-lg border-t-4 lg:col-span-2"
                  style={{ borderTopColor: '#f59e0b' }}
                >
                  <div
                    className="px-5 py-3 flex items-center gap-2"
                    style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 50%, #fde047 100%)' }}
                  >
                    <MapPin className="h-4 w-4 text-white" />
                    <h3 className="font-semibold text-white">Address Information</h3>
                  </div>
                  <div className="p-5 bg-gradient-to-br from-amber-50/50 to-white dark:from-slate-800/50 dark:to-slate-900 relative z-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">UAE Address</p>
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{student.uae_address || 'Not provided'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">Philippine Address</p>
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{student.phil_address || 'Not provided'}</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
            )}
          </TabsContent>

          {/* Academic History Tab */}
          <TabsContent value="academic" className="mt-6">
            <div className="flex justify-end mb-4">
              {isEditingAcademic ? (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setIsEditingAcademic(false)}>
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                  <Button size="sm" onClick={handleSaveStudent} disabled={isSavingStudent}>
                    {isSavingStudent ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                    Save
                  </Button>
                </div>
              ) : (
                <Button variant="default" size="sm" onClick={() => setIsEditingAcademic(true)} className="bg-slate-700 hover:bg-slate-800 text-white gap-2">
                  <Pencil className="h-4 w-4" />
                  Edit
                </Button>
              )}
            </div>

            {isEditingAcademic ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Academic Background</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <Label className="text-xs">Current Level</Label>
                      <Select value={studentForm.level} onValueChange={(v) => setStudentForm({ ...studentForm, level: v })}>
                        <SelectTrigger className="h-8">
                          <SelectValue placeholder="Select level" />
                        </SelectTrigger>
                        <SelectContent>
                          {['Kinder 1', 'Kinder 2', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'].map(level => (
                            <SelectItem key={level} value={level}>{level}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">School</Label>
                      <Select value={studentForm.school} onValueChange={(v) => setStudentForm({ ...studentForm, school: v })}>
                        <SelectTrigger className="h-8">
                          <SelectValue placeholder="Select school" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="MABDC">MABDC</SelectItem>
                          <SelectItem value="STFXSA">STFXSA</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <EditableField label="Previous School" value={studentForm.previous_school} field="previous_school" />
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Academic Background Card - Blue Gradient */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.1 }}
                  className="relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900 shadow-lg border-t-4"
                  style={{ borderTopColor: '#3b82f6' }}
                >
                  <div
                    className="px-5 py-3 flex items-center gap-2"
                    style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)' }}
                  >
                    <BookOpen className="h-4 w-4 text-white" />
                    <h3 className="font-semibold text-white">Academic Background</h3>
                  </div>
                  <div className="p-5 space-y-4 bg-gradient-to-br from-blue-50/50 to-white dark:from-slate-800/50 dark:to-slate-900 relative z-10">
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">Current Level</p>
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{student.level}</p>
                      </div>
                      <div>
                        <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">School</p>
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{student.school || 'MABDC'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">Previous School</p>
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{student.previous_school || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Enrollment History Card - Green Gradient */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.2 }}
                  className="relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900 shadow-lg border-t-4"
                  style={{ borderTopColor: '#22c55e' }}
                >
                  <div
                    className="px-5 py-3 flex items-center gap-2"
                    style={{ background: 'linear-gradient(135deg, #22c55e 0%, #4ade80 100%)' }}
                  >
                    <Calendar className="h-4 w-4 text-white" />
                    <h3 className="font-semibold text-white">Enrollment History</h3>
                  </div>
                  <div className="p-5 space-y-4 bg-gradient-to-br from-green-50/50 to-white dark:from-slate-800/50 dark:to-slate-900 relative z-10">
                    <div>
                      <p className="text-xs text-green-600 dark:text-green-400 font-medium">Enrollment Date</p>
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{formatDate(student.created_at)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-green-600 dark:text-green-400 font-medium">Status</p>
                      <Badge className="bg-green-100 text-green-700 mt-1">Active Student</Badge>
                    </div>
                  </div>
                </motion.div>
              </div>
            )}
          </TabsContent>

          {/* Subjects Tab */}
          <TabsContent value="subjects" className="mt-6">
            <StudentSubjectsManager studentId={student.id} gradeLevel={student.level} />
          </TabsContent>

          {/* Grades Tab */}
          <TabsContent value="grades" className="mt-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900 shadow-lg border-t-4"
              style={{ borderTopColor: '#ec4899' }}
            >
              <div
                className="px-5 py-3 flex items-center justify-between"
                style={{ background: 'linear-gradient(135deg, #ec4899 0%, #f472b6 100%)' }}
              >
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-white" />
                  <h3 className="font-semibold text-white">Grade Records</h3>
                </div>
                <Badge className="bg-white/20 text-white border-0">{grades.length} records</Badge>
              </div>
              <div className="p-5 bg-gradient-to-br from-pink-50/50 to-white dark:from-slate-800/50 dark:to-slate-900 relative z-10">
                {grades.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-pink-200 dark:border-slate-700">
                          <TableHead className="text-pink-600 dark:text-pink-400">Subject</TableHead>
                          <TableHead className="text-pink-600 dark:text-pink-400">Year</TableHead>
                          <TableHead className="text-center text-pink-600 dark:text-pink-400">Q1</TableHead>
                          <TableHead className="text-center text-pink-600 dark:text-pink-400">Q2</TableHead>
                          <TableHead className="text-center text-pink-600 dark:text-pink-400">Q3</TableHead>
                          <TableHead className="text-center text-pink-600 dark:text-pink-400">Q4</TableHead>
                          <TableHead className="text-center text-pink-600 dark:text-pink-400">Final</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {grades.map(grade => (
                          <TableRow key={grade.id} className="border-pink-100 dark:border-slate-700">
                            <TableCell>
                              <div>
                                <Badge className="bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-300">{grade.subject_code}</Badge>
                                <p className="text-xs text-slate-500 mt-1">{grade.subject_name}</p>
                              </div>
                            </TableCell>
                            <TableCell className="text-slate-700 dark:text-slate-300">{grade.academic_year}</TableCell>
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
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <p className="text-center text-pink-500 py-8">No grade records found</p>
                )}
              </div>
            </motion.div>
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents" className="mt-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900 shadow-lg border-t-4"
              style={{ borderTopColor: '#14b8a6' }}
            >
              <div
                className="px-5 py-3 flex items-center gap-2"
                style={{ background: 'linear-gradient(135deg, #14b8a6 0%, #2dd4bf 100%)' }}
              >
                <FolderOpen className="h-4 w-4 text-white" />
                <h3 className="font-semibold text-white">Student Documents</h3>
              </div>
              <div className="p-5 bg-gradient-to-br from-teal-50/50 to-white dark:from-slate-800/50 dark:to-slate-900 relative z-10">
                <DocumentsManager studentId={student.id} />
              </div>
            </motion.div>
          </TabsContent>

          {/* Anecdotal/Behavior Tab */}
          <TabsContent value="anecdotal" className="mt-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900 shadow-lg border-t-4"
              style={{ borderTopColor: '#f97316' }}
            >
              <div
                className="px-5 py-3 flex items-center justify-between"
                style={{ background: 'linear-gradient(135deg, #f97316 0%, #fb923c 100%)' }}
              >
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-white" />
                  <div>
                    <h3 className="font-semibold text-white">Anecdotal Records / Behavior Incidents</h3>
                    <p className="text-xs text-white/70">Track and manage student behavior incidents</p>
                  </div>
                </div>
                <Button onClick={() => handleOpenIncidentModal()} className="bg-white/20 hover:bg-white/30 text-white border-0 gap-2">
                  <Plus className="h-4 w-4" />
                  Add Incident
                </Button>
              </div>
              <div className="p-5 bg-gradient-to-br from-orange-50/50 to-white dark:from-slate-800/50 dark:to-slate-900 relative z-10">
                {incidents.length > 0 ? (
                  <div className="space-y-4">
                    {incidents.map(incident => {
                      const categoryInfo = getCategoryInfo(incident.category);
                      return (
                        <motion.div
                          key={incident.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="border border-orange-200 dark:border-slate-700 rounded-lg p-4 hover:bg-orange-50/50 dark:hover:bg-slate-800/50 transition-colors"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge className={categoryInfo.color}>{categoryInfo.label}</Badge>
                                {getStatusBadge(incident.status)}
                                <span className="text-xs text-orange-600 dark:text-orange-400 flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {formatDate(incident.incident_date)}
                                </span>
                              </div>
                              <h4 className="font-medium text-slate-800 dark:text-slate-200">{incident.title}</h4>
                              {incident.description && (
                                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{incident.description}</p>
                              )}
                              {incident.action_taken && (
                                <div className="mt-2 pt-2 border-t border-orange-200 dark:border-slate-700">
                                  <p className="text-xs font-medium text-orange-600 dark:text-orange-400">Action Taken:</p>
                                  <p className="text-sm text-slate-700 dark:text-slate-300">{incident.action_taken}</p>
                                </div>
                              )}
                              {incident.reported_by && (
                                <p className="text-xs text-orange-500 dark:text-orange-400 mt-2">
                                  Reported by: {incident.reported_by}
                                </p>
                              )}
                            </div>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 hover:bg-orange-100 dark:hover:bg-slate-700"
                                onClick={() => handleOpenIncidentModal(incident)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:bg-red-100 dark:hover:bg-red-900/30"
                                onClick={() => {
                                  setSelectedIncident(incident);
                                  setIsDeleteIncidentOpen(true);
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <AlertTriangle className="h-12 w-12 text-orange-300 mx-auto mb-4" />
                    <p className="text-orange-600 dark:text-orange-400">No incidents recorded</p>
                    <p className="text-sm text-orange-500/70 mt-1">Click "Add Incident" to record a new incident</p>
                  </div>
                )}
              </div>
            </motion.div>
          </TabsContent>

          {/* Transmutation Tab */}
          <TabsContent value="transmutation" className="mt-6">
            {currentAcademicYearId && student ? (
              <div className="h-[600px]">
                <TransmutationManager student={student} academicYearId={currentAcademicYearId} />
              </div>
            ) : (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Add/Edit Incident Modal */}
      <Dialog open={isIncidentModalOpen} onOpenChange={setIsIncidentModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{isEditingIncident ? 'Edit Incident' : 'Record New Incident'}</DialogTitle>
            <DialogDescription>
              Document a behavior incident or notable event for this student.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Date *</Label>
                <Input
                  type="date"
                  value={incidentForm.incident_date}
                  onChange={(e) => setIncidentForm({ ...incidentForm, incident_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Category *</Label>
                <Select
                  value={incidentForm.category}
                  onValueChange={(v) => setIncidentForm({ ...incidentForm, category: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {INCIDENT_CATEGORIES.map(cat => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Title *</Label>
              <Input
                value={incidentForm.title}
                onChange={(e) => setIncidentForm({ ...incidentForm, title: e.target.value })}
                placeholder="Brief title of the incident"
              />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={incidentForm.description}
                onChange={(e) => setIncidentForm({ ...incidentForm, description: e.target.value })}
                placeholder="Detailed description of what happened..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Action Taken</Label>
              <Textarea
                value={incidentForm.action_taken}
                onChange={(e) => setIncidentForm({ ...incidentForm, action_taken: e.target.value })}
                placeholder="What action was taken in response..."
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Reported By</Label>
                <Input
                  value={incidentForm.reported_by}
                  onChange={(e) => setIncidentForm({ ...incidentForm, reported_by: e.target.value })}
                  placeholder="Teacher/Staff name"
                />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={incidentForm.status}
                  onValueChange={(v) => setIncidentForm({ ...incidentForm, status: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="monitoring">Monitoring</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsIncidentModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveIncident} disabled={isSavingIncident}>
              {isSavingIncident && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isEditingIncident ? 'Update Incident' : 'Save Incident'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Incident Confirmation */}
      <AlertDialog open={isDeleteIncidentOpen} onOpenChange={setIsDeleteIncidentOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Incident</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this incident record? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteIncident} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default StudentProfile;