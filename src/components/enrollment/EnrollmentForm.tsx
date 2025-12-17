import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { UserPlus, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { useCreateStudent } from '@/hooks/useStudents';
import { toast } from 'sonner';

const GRADE_LEVELS = [
  'Kinder 1', 'Kinder 2',
  'Level 1', 'Level 2', 'Level 3', 'Level 4', 'Level 5', 
  'Level 6', 'Level 7', 'Level 8', 'Level 9', 'Level 10',
  'Level 11', 'Level 12'
];

const KINDER_LEVELS = ['Kinder 1', 'Kinder 2'];

const SCHOOL_YEARS = [
  '2025-2026', '2024-2025', '2023-2024'
];

const GENDERS = ['Male', 'Female'];

interface FormErrors {
  student_name?: string;
  lrn?: string;
  level?: string;
  birth_date?: string;
  gender?: string;
  mother_maiden_name?: string;
  mother_contact?: string;
  father_name?: string;
  father_contact?: string;
  phil_address?: string;
  uae_address?: string;
}

export const EnrollmentForm = () => {
  const [formData, setFormData] = useState({
    student_name: '',
    lrn: '',
    level: '',
    school_year: '2025-2026',
    birth_date: '',
    gender: '',
    mother_maiden_name: '',
    mother_contact: '',
    father_name: '',
    father_contact: '',
    phil_address: '',
    uae_address: '',
    previous_school: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const createStudent = useCreateStudent();

  const isKinderLevel = useMemo(() => {
    return KINDER_LEVELS.includes(formData.level);
  }, [formData.level]);

  const validateField = (field: string, value: string): string | undefined => {
    switch (field) {
      case 'student_name':
        if (!value.trim()) return 'Full name is required';
        if (value.trim().length < 2) return 'Name must be at least 2 characters';
        break;
      case 'lrn':
        if (!isKinderLevel && !value.trim()) return 'LRN is required for this grade level';
        if (value.trim() && !/^\d{12}$/.test(value.trim())) return 'LRN must be exactly 12 digits';
        break;
      case 'level':
        if (!value) return 'Grade level is required';
        break;
      case 'birth_date':
        if (!value) return 'Birth date is required';
        break;
      case 'gender':
        if (!value) return 'Gender is required';
        break;
      case 'mother_maiden_name':
        if (!value.trim()) return "Mother's maiden name is required";
        break;
      case 'mother_contact':
        if (!value.trim()) return "Mother's contact is required";
        if (!/^[\d+\-\s()]+$/.test(value.trim())) return 'Invalid phone number format';
        break;
      case 'father_name':
        if (!value.trim()) return "Father's name is required";
        break;
      case 'father_contact':
        if (!value.trim()) return "Father's contact is required";
        if (!/^[\d+\-\s()]+$/.test(value.trim())) return 'Invalid phone number format';
        break;
      case 'phil_address':
        if (!value.trim()) return 'Philippine address is required';
        break;
      case 'uae_address':
        if (!value.trim()) return 'UAE address is required';
        break;
    }
    return undefined;
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    const fields = ['student_name', 'lrn', 'level', 'birth_date', 'gender', 
                    'mother_maiden_name', 'mother_contact', 'father_name', 
                    'father_contact', 'phil_address', 'uae_address'];
    
    fields.forEach(field => {
      const error = validateField(field, formData[field as keyof typeof formData]);
      if (error) {
        newErrors[field as keyof FormErrors] = error;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear LRN error when switching to Kinder level
    if (field === 'level' && KINDER_LEVELS.includes(value)) {
      setErrors(prev => ({ ...prev, lrn: undefined }));
    }
    
    // Validate on change if field was touched
    if (touched[field]) {
      const error = validateField(field, value);
      setErrors(prev => ({ ...prev, [field]: error }));
    }
  };

  const handleBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    const error = validateField(field, formData[field as keyof typeof formData]);
    setErrors(prev => ({ ...prev, [field]: error }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Mark all fields as touched
    const allTouched: Record<string, boolean> = {};
    Object.keys(formData).forEach(key => { allTouched[key] = true; });
    setTouched(allTouched);

    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    setShowConfirmDialog(true);
  };

  const handleConfirmEnrollment = async () => {
    try {
      // Generate temp LRN for Kinder students without LRN
      const finalLrn = formData.lrn.trim() || `TEMP-${Date.now()}`;

      await createStudent.mutateAsync({
        student_name: formData.student_name.trim(),
        lrn: finalLrn,
        level: formData.level,
        birth_date: formData.birth_date || undefined,
        gender: formData.gender || undefined,
        mother_maiden_name: formData.mother_maiden_name.trim() || undefined,
        mother_contact: formData.mother_contact.trim() || undefined,
        father_name: formData.father_name.trim() || undefined,
        father_contact: formData.father_contact.trim() || undefined,
        phil_address: formData.phil_address.trim() || undefined,
        uae_address: formData.uae_address.trim() || undefined,
        previous_school: formData.previous_school.trim() || undefined,
      });
      
      toast.success('Student enrolled successfully!');
      setShowConfirmDialog(false);
      
      // Reset form
      setFormData({
        student_name: '',
        lrn: '',
        level: '',
        school_year: '2025-2026',
        birth_date: '',
        gender: '',
        mother_maiden_name: '',
        mother_contact: '',
        father_name: '',
        father_contact: '',
        phil_address: '',
        uae_address: '',
        previous_school: '',
      });
      setErrors({});
      setTouched({});
    } catch (error) {
      toast.error('Failed to enroll student');
    }
  };

  const FieldError = ({ error }: { error?: string }) => {
    if (!error) return null;
    return (
      <div className="flex items-center gap-1 text-destructive text-sm mt-1">
        <AlertCircle className="h-3 w-3" />
        <span>{error}</span>
      </div>
    );
  };

  const ReviewItem = ({ label, value }: { label: string; value: string }) => (
    <div className="flex justify-between py-2 border-b border-border/50 last:border-0">
      <span className="text-muted-foreground text-sm">{label}</span>
      <span className="text-foreground font-medium text-sm text-right max-w-[60%]">{value || '-'}</span>
    </div>
  );

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-2xl shadow-card p-6 lg:p-8"
      >
        <div className="flex items-center gap-3 mb-8">
          <UserPlus className="h-6 w-6 text-stat-purple" />
          <h2 className="text-xl font-bold text-foreground">New Student Enrollment</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Student Information */}
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-4 pb-2 border-b border-border">
              Student Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-stat-purple">
                  Full Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  placeholder="Enter student's full name"
                  value={formData.student_name}
                  onChange={(e) => handleChange('student_name', e.target.value)}
                  onBlur={() => handleBlur('student_name')}
                  className={`bg-secondary/50 ${errors.student_name && touched.student_name ? 'border-destructive' : ''}`}
                />
                {touched.student_name && <FieldError error={errors.student_name} />}
              </div>
              <div className="space-y-2">
                <Label className="text-stat-purple">
                  LRN (Learner Reference Number) {!isKinderLevel && <span className="text-destructive">*</span>}
                  {isKinderLevel && <span className="text-muted-foreground text-xs ml-1">(Optional for Kinder)</span>}
                </Label>
                <Input
                  placeholder="12-digit LRN"
                  value={formData.lrn}
                  onChange={(e) => handleChange('lrn', e.target.value)}
                  onBlur={() => handleBlur('lrn')}
                  className={`bg-secondary/50 ${errors.lrn && touched.lrn ? 'border-destructive' : ''}`}
                />
                {touched.lrn && <FieldError error={errors.lrn} />}
              </div>
              <div className="space-y-2">
                <Label className="text-stat-purple">
                  Grade Level <span className="text-destructive">*</span>
                </Label>
                <Select value={formData.level} onValueChange={(v) => { handleChange('level', v); setTouched(prev => ({ ...prev, level: true })); }}>
                  <SelectTrigger className={`bg-secondary/50 ${errors.level && touched.level ? 'border-destructive' : ''}`}>
                    <SelectValue placeholder="Select grade level" />
                  </SelectTrigger>
                  <SelectContent>
                    {GRADE_LEVELS.map(level => (
                      <SelectItem key={level} value={level}>{level}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {touched.level && <FieldError error={errors.level} />}
              </div>
              <div className="space-y-2">
                <Label className="text-stat-purple">
                  School Year <span className="text-destructive">*</span>
                </Label>
                <Select value={formData.school_year} onValueChange={(v) => handleChange('school_year', v)}>
                  <SelectTrigger className="bg-secondary/50">
                    <SelectValue placeholder="Select school year" />
                  </SelectTrigger>
                  <SelectContent>
                    {SCHOOL_YEARS.map(year => (
                      <SelectItem key={year} value={year}>{year}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-stat-purple">
                  Birth Date <span className="text-destructive">*</span>
                </Label>
                <Input
                  type="date"
                  value={formData.birth_date}
                  onChange={(e) => handleChange('birth_date', e.target.value)}
                  onBlur={() => handleBlur('birth_date')}
                  className={`bg-secondary/50 ${errors.birth_date && touched.birth_date ? 'border-destructive' : ''}`}
                />
                {touched.birth_date && <FieldError error={errors.birth_date} />}
              </div>
              <div className="space-y-2">
                <Label className="text-stat-purple">
                  Gender <span className="text-destructive">*</span>
                </Label>
                <Select value={formData.gender} onValueChange={(v) => { handleChange('gender', v); setTouched(prev => ({ ...prev, gender: true })); }}>
                  <SelectTrigger className={`bg-secondary/50 ${errors.gender && touched.gender ? 'border-destructive' : ''}`}>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    {GENDERS.map(gender => (
                      <SelectItem key={gender} value={gender}>{gender}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {touched.gender && <FieldError error={errors.gender} />}
              </div>
            </div>
          </div>

          {/* Parent/Guardian Information */}
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-4 pb-2 border-b border-border">
              Parent/Guardian Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-stat-purple">
                  Mother's Maiden Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  placeholder="Enter mother's maiden name"
                  value={formData.mother_maiden_name}
                  onChange={(e) => handleChange('mother_maiden_name', e.target.value)}
                  onBlur={() => handleBlur('mother_maiden_name')}
                  className={`bg-secondary/50 ${errors.mother_maiden_name && touched.mother_maiden_name ? 'border-destructive' : ''}`}
                />
                {touched.mother_maiden_name && <FieldError error={errors.mother_maiden_name} />}
              </div>
              <div className="space-y-2">
                <Label className="text-stat-purple">
                  Mother's Contact Number <span className="text-destructive">*</span>
                </Label>
                <Input
                  placeholder="e.g., 09123456789"
                  value={formData.mother_contact}
                  onChange={(e) => handleChange('mother_contact', e.target.value)}
                  onBlur={() => handleBlur('mother_contact')}
                  className={`bg-secondary/50 ${errors.mother_contact && touched.mother_contact ? 'border-destructive' : ''}`}
                />
                {touched.mother_contact && <FieldError error={errors.mother_contact} />}
              </div>
              <div className="space-y-2">
                <Label className="text-stat-purple">
                  Father's Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  placeholder="Enter father's name"
                  value={formData.father_name}
                  onChange={(e) => handleChange('father_name', e.target.value)}
                  onBlur={() => handleBlur('father_name')}
                  className={`bg-secondary/50 ${errors.father_name && touched.father_name ? 'border-destructive' : ''}`}
                />
                {touched.father_name && <FieldError error={errors.father_name} />}
              </div>
              <div className="space-y-2">
                <Label className="text-stat-purple">
                  Father's Contact Number <span className="text-destructive">*</span>
                </Label>
                <Input
                  placeholder="e.g., 09123456789"
                  value={formData.father_contact}
                  onChange={(e) => handleChange('father_contact', e.target.value)}
                  onBlur={() => handleBlur('father_contact')}
                  className={`bg-secondary/50 ${errors.father_contact && touched.father_contact ? 'border-destructive' : ''}`}
                />
                {touched.father_contact && <FieldError error={errors.father_contact} />}
              </div>
            </div>
          </div>

          {/* Address Information */}
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-4 pb-2 border-b border-border">
              Address Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-stat-purple">
                  Philippine Address <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  placeholder="Enter complete Philippine address"
                  value={formData.phil_address}
                  onChange={(e) => handleChange('phil_address', e.target.value)}
                  onBlur={() => handleBlur('phil_address')}
                  className={`bg-secondary/50 min-h-[100px] ${errors.phil_address && touched.phil_address ? 'border-destructive' : ''}`}
                />
                {touched.phil_address && <FieldError error={errors.phil_address} />}
              </div>
              <div className="space-y-2">
                <Label className="text-stat-purple">
                  UAE Address <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  placeholder="Enter complete UAE address"
                  value={formData.uae_address}
                  onChange={(e) => handleChange('uae_address', e.target.value)}
                  onBlur={() => handleBlur('uae_address')}
                  className={`bg-secondary/50 min-h-[100px] ${errors.uae_address && touched.uae_address ? 'border-destructive' : ''}`}
                />
                {touched.uae_address && <FieldError error={errors.uae_address} />}
              </div>
            </div>
          </div>

          {/* Academic History */}
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-4 pb-2 border-b border-border">
              Academic History
            </h3>
            <div className="space-y-2">
              <Label className="text-stat-purple">
                Previous School <span className="text-muted-foreground">(Optional)</span>
              </Label>
              <Input
                placeholder="Enter previous school name"
                value={formData.previous_school}
                onChange={(e) => handleChange('previous_school', e.target.value)}
                className="bg-secondary/50"
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end pt-4">
            <Button 
              type="submit" 
              disabled={createStudent.isPending}
              className="bg-stat-purple hover:bg-stat-purple/90 text-white px-8"
            >
              {createStudent.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <UserPlus className="h-4 w-4 mr-2" />
              )}
              Review & Enroll
            </Button>
          </div>
        </form>
      </motion.div>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-stat-purple" />
              Confirm Enrollment
            </DialogTitle>
            <DialogDescription>
              Please review the student information before submitting.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {/* Student Information */}
            <div>
              <h4 className="font-semibold text-foreground mb-2 text-stat-purple">Student Information</h4>
              <div className="bg-secondary/30 rounded-lg p-4">
                <ReviewItem label="Full Name" value={formData.student_name} />
                <ReviewItem label="LRN" value={formData.lrn || (isKinderLevel ? 'Will be auto-generated' : '-')} />
                <ReviewItem label="Grade Level" value={formData.level} />
                <ReviewItem label="School Year" value={formData.school_year} />
                <ReviewItem label="Birth Date" value={formData.birth_date} />
                <ReviewItem label="Gender" value={formData.gender} />
              </div>
            </div>

            {/* Parent/Guardian Information */}
            <div>
              <h4 className="font-semibold text-foreground mb-2 text-stat-purple">Parent/Guardian Information</h4>
              <div className="bg-secondary/30 rounded-lg p-4">
                <ReviewItem label="Mother's Maiden Name" value={formData.mother_maiden_name} />
                <ReviewItem label="Mother's Contact" value={formData.mother_contact} />
                <ReviewItem label="Father's Name" value={formData.father_name} />
                <ReviewItem label="Father's Contact" value={formData.father_contact} />
              </div>
            </div>

            {/* Address Information */}
            <div>
              <h4 className="font-semibold text-foreground mb-2 text-stat-purple">Address Information</h4>
              <div className="bg-secondary/30 rounded-lg p-4">
                <ReviewItem label="Philippine Address" value={formData.phil_address} />
                <ReviewItem label="UAE Address" value={formData.uae_address} />
              </div>
            </div>

            {/* Academic History */}
            <div>
              <h4 className="font-semibold text-foreground mb-2 text-stat-purple">Academic History</h4>
              <div className="bg-secondary/30 rounded-lg p-4">
                <ReviewItem label="Previous School" value={formData.previous_school} />
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
              Go Back & Edit
            </Button>
            <Button 
              onClick={handleConfirmEnrollment}
              disabled={createStudent.isPending}
              className="bg-stat-purple hover:bg-stat-purple/90 text-white"
            >
              {createStudent.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4 mr-2" />
              )}
              Confirm Enrollment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
