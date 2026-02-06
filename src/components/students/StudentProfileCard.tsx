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
  Pencil
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Student } from '@/types/student';
import { useUploadStudentPhoto } from '@/hooks/useStudentDocuments';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { AnimatedStudentAvatar } from './AnimatedStudentAvatar';

interface StudentProfileCardProps {
  student: Student;
  showPhotoUpload?: boolean;
  showEditButton?: boolean;
  onEditClick?: () => void;
  compact?: boolean;
}

interface EnrolledSubject {
  id: string;
  code: string;
  name: string;
  status: string;
}

export const StudentProfileCard = ({ 
  student, 
  showPhotoUpload = true, 
  showEditButton = false,
  onEditClick,
  compact = false 
}: StudentProfileCardProps) => {
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

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <motion.div 
      className="space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header Card - Teal/Cyan Gradient */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="relative overflow-hidden rounded-2xl shadow-lg"
        style={{
          background: 'linear-gradient(135deg, #0891b2 0%, #22d3ee 50%, #67e8f9 100%)'
        }}
      >
        <div className="p-6">
          <div className="flex flex-col lg:flex-row lg:items-center gap-6">
            {/* Avatar */}
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
              <AnimatedStudentAvatar
                photoUrl={student.photo_url}
                name={student.student_name}
                size="lg"
                borderColor="rgba(255,255,255,0.3)"
                className="shadow-lg"
              />
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
            
            {/* Student Info */}
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-xl lg:text-2xl font-bold text-white">{student.student_name}</h2>
                <Badge className="bg-amber-400 text-amber-900 hover:bg-amber-400 border-0 font-semibold">
                  Active
                </Badge>
              </div>
              <p className="text-white/80 text-sm">
                {student.lrn} • {student.level} • {student.school || 'MABDC'}
              </p>
              <div className="flex items-center gap-4 text-sm text-white/70 flex-wrap">
                {(student.mother_contact || student.father_contact) && (
                  <span className="flex items-center gap-1">
                    <Phone className="h-3 w-3" /> {student.mother_contact || student.father_contact}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" /> Enrolled: {formatDate(student.created_at)}
                </span>
              </div>
            </div>

            {/* Current Average */}
            <div className="text-right">
              <p className="text-4xl font-bold text-white">--</p>
              <p className="text-sm text-white/70">Current Average</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Edit Button Row */}
      {showEditButton && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex justify-end"
        >
          <Button 
            variant="default" 
            size="sm" 
            onClick={onEditClick}
            className="bg-slate-700 hover:bg-slate-800 text-white gap-2"
          >
            <Pencil className="h-4 w-4" />
            Edit
          </Button>
        </motion.div>
      )}

      {/* Information Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Basic Information Card - Teal Gradient */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900 shadow-lg border-t-4"
          style={{ borderTopColor: '#0891b2' }}
        >
          {/* Header */}
          <div 
            className="px-5 py-3 flex items-center gap-2"
            style={{
              background: 'linear-gradient(135deg, #0891b2 0%, #22d3ee 100%)'
            }}
          >
            <User className="h-4 w-4 text-white" />
            <h3 className="font-semibold text-white">Basic Information</h3>
          </div>
          
          {/* Content */}
          <div className="p-5 space-y-4 bg-gradient-to-br from-cyan-50/50 to-white dark:from-slate-800/50 dark:to-slate-900">
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
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{calculateAge()}</p>
              </div>
            </div>
            <div>
              <p className="text-xs text-cyan-600 dark:text-cyan-400 font-medium">Birth Date</p>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{formatBirthDate()}</p>
            </div>
          </div>
        </motion.div>

        {/* Parents/Guardian Card - Purple/Pink Gradient */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900 shadow-lg border-t-4"
          style={{ borderTopColor: '#a855f7' }}
        >
          {/* Header */}
          <div 
            className="px-5 py-3 flex items-center gap-2"
            style={{
              background: 'linear-gradient(135deg, #a855f7 0%, #d946ef 100%)'
            }}
          >
            <Users className="h-4 w-4 text-white" />
            <h3 className="font-semibold text-white">Parents/Guardian</h3>
          </div>
          
          {/* Content */}
          <div className="p-5 space-y-4 bg-gradient-to-br from-purple-50/50 to-white dark:from-slate-800/50 dark:to-slate-900">
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
          transition={{ duration: 0.4, delay: 0.4 }}
          className="relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900 shadow-lg border-t-4 lg:col-span-2"
          style={{ borderTopColor: '#f59e0b' }}
        >
          {/* Header */}
          <div 
            className="px-5 py-3 flex items-center gap-2"
            style={{
              background: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 50%, #fde047 100%)'
            }}
          >
            <MapPin className="h-4 w-4 text-white" />
            <h3 className="font-semibold text-white">Address Information</h3>
          </div>
          
          {/* Content */}
          <div className="p-5 bg-gradient-to-br from-amber-50/50 to-white dark:from-slate-800/50 dark:to-slate-900">
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
    </motion.div>
  );
};
