import { motion } from 'framer-motion';
import { useRef, useState, useEffect } from 'react';
import { 
  User, 
  Phone, 
  MapPin, 
  Calendar,
  Users,
  Camera,
  Loader2,
  BookOpen,
  Award,
  Music,
  Trophy,
  GraduationCap
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Student } from '@/types/student';
import { useUploadStudentPhoto } from '@/hooks/useStudentDocuments';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface StudentProfileCardProps {
  student: Student;
  showPhotoUpload?: boolean;
  compact?: boolean;
}

interface EnrolledSubject {
  id: string;
  code: string;
  name: string;
  status: string;
}

export const StudentProfileCard = ({ student, showPhotoUpload = true, compact = false }: StudentProfileCardProps) => {
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [enrolledSubjects, setEnrolledSubjects] = useState<EnrolledSubject[]>([]);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const uploadPhoto = useUploadStudentPhoto();

  // Fetch enrolled subjects
  useEffect(() => {
    const fetchEnrolledSubjects = async () => {
      if (!student?.id) return;
      
      try {
        const { data, error } = await supabase
          .from('student_subjects')
          .select(`
            id,
            status,
            subjects:subject_id (
              id,
              code,
              name
            )
          `)
          .eq('student_id', student.id);

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
      } catch (error) {
        console.error('Error fetching enrolled subjects:', error);
      }
    };

    fetchEnrolledSubjects();
  }, [student?.id]);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !student) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
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

  const InfoRow = ({ label, value }: { label: string; value: string | null | undefined }) => (
    <div className="space-y-0.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium text-foreground">{value || 'Not provided'}</p>
    </div>
  );

  const calculateAge = () => {
    if (!student.birth_date) return student.age?.toString() || 'N/A';
    const birthDate = new Date(student.birth_date);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age.toString();
  };

  const formatBirthDate = () => {
    if (!student.birth_date) return 'Not provided';
    const date = new Date(student.birth_date);
    return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-border"
      >
        <div className="p-6">
          <div className="flex flex-col lg:flex-row lg:items-start gap-6">
            {/* Left: Photo and Name */}
            <div className="flex items-center gap-4">
              {/* Photo */}
              <div className="relative group shrink-0">
                {showPhotoUpload && (
                  <input
                    ref={photoInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handlePhotoUpload}
                  />
                )}
                {student.photo_url ? (
                  <img 
                    src={student.photo_url} 
                    alt={student.student_name}
                    className="h-20 w-20 rounded-full object-cover border-4 border-primary/20 shadow-lg"
                  />
                ) : (
                  <div className="h-20 w-20 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center border-4 border-primary/20 shadow-lg">
                    <span className="text-2xl font-bold text-primary-foreground">
                      {student.student_name.charAt(0)}
                    </span>
                  </div>
                )}
                {showPhotoUpload && (
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
                )}
              </div>
              
              {/* Name and Class */}
              <div>
                <h2 className="text-xl lg:text-2xl font-bold text-primary">{student.student_name}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <GraduationCap className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-muted-foreground">{student.level}</span>
                </div>
              </div>
            </div>

            {/* Stats Row */}
            <div className="flex flex-wrap gap-4 lg:gap-6 lg:ml-auto">
              {/* Attendance */}
              <div className="text-center px-4 py-2 rounded-lg bg-background/50">
                <p className="text-xs text-muted-foreground">Attendance</p>
                <p className="text-lg font-bold text-emerald-600">95%</p>
                <p className="text-xs text-muted-foreground">(5 Leaves)</p>
              </div>
              
              {/* Birth Date */}
              <div className="text-center px-4 py-2 rounded-lg bg-background/50">
                <p className="text-xs text-muted-foreground flex items-center gap-1 justify-center">
                  <Calendar className="h-3 w-3" /> Birth Date
                </p>
                <p className="text-sm font-semibold text-foreground">{formatBirthDate()}</p>
              </div>

              {/* Best Subject */}
              <div className="text-center px-4 py-2 rounded-lg bg-background/50">
                <p className="text-xs text-muted-foreground flex items-center gap-1 justify-center">
                  <Award className="h-3 w-3" /> Best Subject
                </p>
                <p className="text-sm font-semibold text-foreground">
                  {enrolledSubjects[0]?.name || 'N/A'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Information Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Personal Information */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2 text-primary">
                <User className="h-4 w-4" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <InfoRow label="Gender" value={student.gender} />
                <InfoRow label="Age" value={calculateAge()} />
              </div>
              <InfoRow label="LRN" value={student.lrn} />
              <InfoRow label="Contact" value={student.mother_contact || student.father_contact} />
              <InfoRow label="Address" value={student.uae_address || student.phil_address} />
            </CardContent>
          </Card>
        </motion.div>

        {/* Parents Information */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2 text-primary">
                <Users className="h-4 w-4" />
                Parents Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <InfoRow label="Father's Name" value={student.father_name} />
              <div className="flex items-center gap-2">
                <Phone className="h-3 w-3 text-muted-foreground" />
                <InfoRow label="Contact" value={student.father_contact} />
              </div>
              <InfoRow label="Mother's Name" value={student.mother_maiden_name} />
              <div className="flex items-center gap-2">
                <Phone className="h-3 w-3 text-muted-foreground" />
                <InfoRow label="Contact" value={student.mother_contact} />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Academic Information */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2 text-primary">
                <BookOpen className="h-4 w-4" />
                Academic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <InfoRow label="Current Level" value={student.level} />
              <InfoRow label="Previous School" value={student.previous_school} />
              <InfoRow label="School" value={student.school} />
              <div>
                <p className="text-xs text-muted-foreground mb-2">Enrolled Subjects</p>
                <div className="flex flex-wrap gap-1.5">
                  {enrolledSubjects.length > 0 ? (
                    enrolledSubjects.slice(0, 6).map((subject) => (
                      <Badge key={subject.id} variant="secondary" className="text-xs">
                        {subject.code}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-sm text-muted-foreground">No subjects enrolled</span>
                  )}
                  {enrolledSubjects.length > 6 && (
                    <Badge variant="outline" className="text-xs">
                      +{enrolledSubjects.length - 6} more
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Extra Curriculum */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2 text-primary">
                <Trophy className="h-4 w-4" />
                Extra Curriculum
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <Trophy className="h-4 w-4 text-amber-500 mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">Sports</p>
                  <p className="text-sm font-medium">No Participation</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Award className="h-4 w-4 text-purple-500 mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">Arts</p>
                  <p className="text-sm font-medium">No Participation</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Music className="h-4 w-4 text-blue-500 mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">Music</p>
                  <p className="text-sm font-medium">No Participation</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};