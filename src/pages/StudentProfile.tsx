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
  CheckCircle2,
  Clock,
  Eye
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useStudents } from '@/hooks/useStudents';
import { useUploadStudentPhoto } from '@/hooks/useStudentDocuments';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

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
  const [enrolledSubjects, setEnrolledSubjects] = useState<EnrolledSubject[]>([]);
  const [grades, setGrades] = useState<StudentGrade[]>([]);
  const [incidents, setIncidents] = useState<StudentIncident[]>([]);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isIncidentModalOpen, setIsIncidentModalOpen] = useState(false);
  const [isSavingIncident, setIsSavingIncident] = useState(false);
  const [incidentForm, setIncidentForm] = useState({
    incident_date: new Date().toISOString().split('T')[0],
    category: '',
    title: '',
    description: '',
    action_taken: '',
    reported_by: '',
    status: 'open'
  });
  
  const photoInputRef = useRef<HTMLInputElement>(null);
  const uploadPhoto = useUploadStudentPhoto();
  
  const { data: students = [], isLoading } = useStudents();
  const student = students.find(s => s.id === id);

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
  useEffect(() => {
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

  const handleSaveIncident = async () => {
    if (!incidentForm.category || !incidentForm.title) {
      toast.error('Please fill in required fields');
      return;
    }

    setIsSavingIncident(true);
    try {
      const { error } = await supabase
        .from('student_incidents')
        .insert({
          student_id: id,
          ...incidentForm
        });

      if (error) throw error;

      toast.success('Incident recorded successfully');
      setIsIncidentModalOpen(false);
      setIncidentForm({
        incident_date: new Date().toISOString().split('T')[0],
        category: '',
        title: '',
        description: '',
        action_taken: '',
        reported_by: '',
        status: 'open'
      });

      // Refresh incidents
      const { data } = await supabase
        .from('student_incidents')
        .select('*')
        .eq('student_id', id)
        .order('incident_date', { ascending: false });
      if (data) setIncidents(data);
    } catch (error) {
      toast.error('Failed to save incident');
    } finally {
      setIsSavingIncident(false);
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

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navigation Bar */}
      <div className="border-b border-border bg-card sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <Button 
            variant="ghost" 
            className="gap-2"
            onClick={() => navigate('/')}
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Students
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-2" onClick={() => window.print()}>
              <Printer className="h-4 w-4" />
              Print
            </Button>
            <Button variant="outline" size="sm" className="gap-2">
              <Download className="h-4 w-4" />
              Export
            </Button>
            <Button size="sm" className="gap-2">
              <Pencil className="h-4 w-4" />
              Edit
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Student Header Card */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border rounded-xl p-6"
        >
          <div className="flex flex-col lg:flex-row lg:items-start gap-6">
            {/* Avatar and Info */}
            <div className="flex items-center gap-4">
              <div className="relative group">
                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoUpload}
                />
                <Avatar className="h-20 w-20 border-4 border-primary/20">
                  <AvatarImage src={student.photo_url || ''} alt={student.student_name} />
                  <AvatarFallback className="text-2xl font-bold bg-primary text-primary-foreground">
                    {student.student_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
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
              </div>
              
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold text-foreground">{student.student_name}</h1>
                  <Badge className="bg-green-100 text-green-700">Active</Badge>
                </div>
                <p className="text-muted-foreground text-sm mt-1">
                  {student.lrn} • {student.level} • {student.school || 'MABDC'}
                </p>
                <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                  {student.mother_contact && (
                    <span className="flex items-center gap-1">
                      <Phone className="h-3 w-3" /> {student.mother_contact}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> Enrolled: {formatDate(student.created_at)}
                  </span>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="lg:ml-auto text-right">
              <p className="text-4xl font-bold text-foreground">
                {grades.length > 0 && grades[0].final_grade 
                  ? grades[0].final_grade.toFixed(2)
                  : '--'}
              </p>
              <p className="text-sm text-muted-foreground">Current Average</p>
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent">
            <TabsTrigger 
              value="personal" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3"
            >
              <User className="h-4 w-4 mr-2" />
              Personal Information
            </TabsTrigger>
            <TabsTrigger 
              value="academic" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3"
            >
              <BookOpen className="h-4 w-4 mr-2" />
              Academic History
            </TabsTrigger>
            <TabsTrigger 
              value="subjects" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3"
            >
              <GraduationCap className="h-4 w-4 mr-2" />
              Subjects
            </TabsTrigger>
            <TabsTrigger 
              value="grades" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3"
            >
              <FileText className="h-4 w-4 mr-2" />
              Grades
            </TabsTrigger>
            <TabsTrigger 
              value="anecdotal" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3"
            >
              <AlertTriangle className="h-4 w-4 mr-2" />
              Anecdotal/Behavior
            </TabsTrigger>
          </TabsList>

          {/* Personal Information Tab */}
          <TabsContent value="personal" className="mt-6">
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
                    <InfoRow label="Full Name" value={student.student_name} />
                    <InfoRow label="LRN" value={student.lrn} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <InfoRow label="Gender" value={student.gender} />
                    <InfoRow label="Age" value={student.age?.toString()} />
                  </div>
                  <InfoRow label="Birth Date" value={formatDate(student.birth_date)} />
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
                  <div>
                    <InfoRow label="Father's Name" value={student.father_name} />
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                      <Phone className="h-3 w-3" /> {student.father_contact || 'No contact'}
                    </p>
                  </div>
                  <div>
                    <InfoRow label="Mother's Name" value={student.mother_maiden_name} />
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                      <Phone className="h-3 w-3" /> {student.mother_contact || 'No contact'}
                    </p>
                  </div>
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
                    <InfoRow label="UAE Address" value={student.uae_address} />
                    <InfoRow label="Philippine Address" value={student.phil_address} />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Academic History Tab */}
          <TabsContent value="academic" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Academic Background</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <InfoRow label="Current Level" value={student.level} />
                  <InfoRow label="School" value={student.school || 'MABDC'} />
                  <InfoRow label="Previous School" value={student.previous_school} />
                </div>
                <div className="pt-4 border-t">
                  <p className="text-sm font-medium mb-3">Enrollment History</p>
                  <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground">
                    <p>Enrolled since {formatDate(student.created_at)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Subjects Tab */}
          <TabsContent value="subjects" className="mt-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">Enrolled Subjects</CardTitle>
                <Badge variant="secondary">{enrolledSubjects.length} subjects</Badge>
              </CardHeader>
              <CardContent>
                {enrolledSubjects.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Code</TableHead>
                        <TableHead>Subject Name</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {enrolledSubjects.map(subject => (
                        <TableRow key={subject.id}>
                          <TableCell>
                            <Badge variant="outline">{subject.code}</Badge>
                          </TableCell>
                          <TableCell>{subject.name}</TableCell>
                          <TableCell>
                            <Badge className={subject.status === 'enrolled' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}>
                              {subject.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-center text-muted-foreground py-8">No subjects enrolled</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Grades Tab */}
          <TabsContent value="grades" className="mt-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">Grade Records</CardTitle>
                <Badge variant="secondary">{grades.length} records</Badge>
              </CardHeader>
              <CardContent>
                {grades.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Subject</TableHead>
                        <TableHead>Year</TableHead>
                        <TableHead className="text-center">Q1</TableHead>
                        <TableHead className="text-center">Q2</TableHead>
                        <TableHead className="text-center">Q3</TableHead>
                        <TableHead className="text-center">Q4</TableHead>
                        <TableHead className="text-center">Final</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {grades.map(grade => (
                        <TableRow key={grade.id}>
                          <TableCell>
                            <div>
                              <Badge variant="outline">{grade.subject_code}</Badge>
                              <p className="text-xs text-muted-foreground mt-1">{grade.subject_name}</p>
                            </div>
                          </TableCell>
                          <TableCell>{grade.academic_year}</TableCell>
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
                ) : (
                  <p className="text-center text-muted-foreground py-8">No grade records found</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Anecdotal/Behavior Tab */}
          <TabsContent value="anecdotal" className="mt-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base">Anecdotal Records / Behavior Incidents</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">Track and manage student behavior incidents</p>
                </div>
                <Button onClick={() => setIsIncidentModalOpen(true)} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Incident
                </Button>
              </CardHeader>
              <CardContent>
                {incidents.length > 0 ? (
                  <div className="space-y-4">
                    {incidents.map(incident => {
                      const categoryInfo = getCategoryInfo(incident.category);
                      return (
                        <motion.div
                          key={incident.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge className={categoryInfo.color}>{categoryInfo.label}</Badge>
                                {getStatusBadge(incident.status)}
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {formatDate(incident.incident_date)}
                                </span>
                              </div>
                              <h4 className="font-medium text-foreground">{incident.title}</h4>
                              {incident.description && (
                                <p className="text-sm text-muted-foreground mt-1">{incident.description}</p>
                              )}
                              {incident.action_taken && (
                                <div className="mt-2 pt-2 border-t">
                                  <p className="text-xs font-medium text-muted-foreground">Action Taken:</p>
                                  <p className="text-sm text-foreground">{incident.action_taken}</p>
                                </div>
                              )}
                              {incident.reported_by && (
                                <p className="text-xs text-muted-foreground mt-2">
                                  Reported by: {incident.reported_by}
                                </p>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <AlertTriangle className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                    <p className="text-muted-foreground">No incidents recorded</p>
                    <p className="text-sm text-muted-foreground mt-1">Click "Add Incident" to record a new incident</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Add Incident Modal */}
      <Dialog open={isIncidentModalOpen} onOpenChange={setIsIncidentModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Record New Incident</DialogTitle>
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
              Save Incident
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StudentProfile;