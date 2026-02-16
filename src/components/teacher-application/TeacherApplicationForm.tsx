import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { PersonalInfoStep } from './steps/PersonalInfoStep';
import { ContactInfoStep } from './steps/ContactInfoStep';
import { PositionStep } from './steps/PositionStep';
import { PrcLicenseStep } from './steps/PrcLicenseStep';
import { EducationStep } from './steps/EducationStep';
import { ExperienceStep } from './steps/ExperienceStep';
import { DocumentUploadStep } from './steps/DocumentUploadStep';
import { AdditionalQuestionsStep } from './steps/AdditionalQuestionsStep';
import { ReviewStep } from './steps/ReviewStep';
import { ConfirmationStep } from './steps/ConfirmationStep';

export interface TeacherFormData {
  // Personal
  first_name: string;
  middle_name: string;
  last_name: string;
  suffix: string;
  gender: string;
  date_of_birth: string;
  place_of_birth: string;
  civil_status: string;
  nationality: string;
  photo_url: string;
  // Contact
  mobile_number: string;
  alternate_mobile: string;
  email: string;
  house_street: string;
  barangay: string;
  city_municipality: string;
  province: string;
  zip_code: string;
  country: string;
  // Position
  position_applied: string;
  subject_specialization: string[];
  preferred_level: string;
  // PRC
  has_prc_license: boolean;
  prc_license_number: string;
  prc_expiration_date: string;
  prc_license_url: string;
  // Education
  education: Array<{ level: string; course: string; major: string; school: string; year_graduated: string; honors: string }>;
  // Experience
  has_experience: boolean;
  experience: Array<{ school: string; position: string; subjects: string; start_date: string; end_date: string; status: string }>;
  // Documents
  resume_url: string;
  transcript_url: string;
  diploma_url: string;
  valid_id_url: string;
  certificates_url: string[];
  // Additional
  why_join: string;
  teaching_philosophy: string;
  expected_salary: string;
  available_start_date: string;
}

const initialFormData: TeacherFormData = {
  first_name: '', middle_name: '', last_name: '', suffix: '', gender: '', date_of_birth: '', place_of_birth: '', civil_status: '', nationality: 'Filipino', photo_url: '',
  mobile_number: '', alternate_mobile: '', email: '', house_street: '', barangay: '', city_municipality: '', province: '', zip_code: '', country: 'Philippines',
  position_applied: '', subject_specialization: [], preferred_level: '',
  has_prc_license: false, prc_license_number: '', prc_expiration_date: '', prc_license_url: '',
  education: [{ level: 'Bachelor', course: '', major: '', school: '', year_graduated: '', honors: '' }],
  has_experience: false, experience: [],
  resume_url: '', transcript_url: '', diploma_url: '', valid_id_url: '', certificates_url: [],
  why_join: '', teaching_philosophy: '', expected_salary: '', available_start_date: '',
};

const STEPS = [
  'Personal Information', 'Contact Information', 'Position Applied For', 'Professional License',
  'Educational Background', 'Teaching Experience', 'Document Upload', 'Additional Questions',
  'Review & Submit', 'Confirmation'
];

interface Props {
  schoolId: string;
}

export const TeacherApplicationForm = ({ schoolId }: Props) => {
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState<TeacherFormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [referenceNumber, setReferenceNumber] = useState('');

  const progress = ((step + 1) / STEPS.length) * 100;

  const updateField = (field: keyof TeacherFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const stripHtml = (str: string) => str.replace(/<[^>]*>/g, '');

  const handleNext = () => {
    if (step < STEPS.length - 1) setStep(s => s + 1);
  };

  const handleBack = () => {
    if (step > 0) setStep(s => s - 1);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const payload = {
        school_id: schoolId,
        first_name: stripHtml(formData.first_name.trim()),
        middle_name: formData.middle_name ? stripHtml(formData.middle_name.trim()) : null,
        last_name: stripHtml(formData.last_name.trim()),
        suffix: formData.suffix || null,
        gender: formData.gender,
        date_of_birth: formData.date_of_birth,
        place_of_birth: formData.place_of_birth || null,
        civil_status: formData.civil_status,
        nationality: formData.nationality,
        photo_url: formData.photo_url || null,
        mobile_number: formData.mobile_number,
        alternate_mobile: formData.alternate_mobile || null,
        email: stripHtml(formData.email.trim()),
        house_street: stripHtml(formData.house_street.trim()),
        barangay: stripHtml(formData.barangay.trim()),
        city_municipality: stripHtml(formData.city_municipality.trim()),
        province: stripHtml(formData.province.trim()),
        zip_code: formData.zip_code,
        country: formData.country,
        position_applied: formData.position_applied,
        subject_specialization: formData.subject_specialization.length > 0 ? formData.subject_specialization : null,
        preferred_level: formData.preferred_level || null,
        has_prc_license: formData.has_prc_license,
        prc_license_number: formData.prc_license_number || null,
        prc_expiration_date: formData.prc_expiration_date || null,
        prc_license_url: formData.prc_license_url || null,
        education: formData.education,
        has_experience: formData.has_experience,
        experience: formData.experience.length > 0 ? formData.experience : null,
        resume_url: formData.resume_url || null,
        transcript_url: formData.transcript_url || null,
        diploma_url: formData.diploma_url || null,
        valid_id_url: formData.valid_id_url || null,
        certificates_url: formData.certificates_url.length > 0 ? formData.certificates_url : null,
        why_join: formData.why_join ? stripHtml(formData.why_join.trim()) : null,
        teaching_philosophy: formData.teaching_philosophy ? stripHtml(formData.teaching_philosophy.trim()) : null,
        expected_salary: formData.expected_salary || null,
        available_start_date: formData.available_start_date || null,
      };

      // Insert-only pattern (no .select() for anon)
      const { error } = await supabase.from('teacher_applications').insert(payload);
      if (error) throw error;

      // Fetch reference number with a separate query won't work for anon.
      // We'll show a generic confirmation and the registrar will see the ref.
      setReferenceNumber('TCH-' + new Date().getFullYear() + '-XXXXXX');
      toast.success('Application submitted successfully!');
      setStep(9); // Confirmation step
    } catch (err: any) {
      console.error('Submission error:', err);
      toast.error(err.message || 'Failed to submit application');
    } finally {
      setIsSubmitting(false);
    }
  };

  const goToStep = (s: number) => setStep(s);

  return (
    <div className="space-y-6">
      {/* Progress */}
      {step < 9 && (
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Step {step + 1} of {STEPS.length - 1}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
          <p className="text-sm font-medium text-foreground">{STEPS[step]}</p>
        </div>
      )}

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{STEPS[step]}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {step === 0 && <PersonalInfoStep formData={formData} updateField={updateField} schoolId={schoolId} />}
              {step === 1 && <ContactInfoStep formData={formData} updateField={updateField} />}
              {step === 2 && <PositionStep formData={formData} updateField={updateField} schoolId={schoolId} />}
              {step === 3 && <PrcLicenseStep formData={formData} updateField={updateField} schoolId={schoolId} />}
              {step === 4 && <EducationStep formData={formData} updateField={updateField} />}
              {step === 5 && <ExperienceStep formData={formData} updateField={updateField} />}
              {step === 6 && <DocumentUploadStep formData={formData} updateField={updateField} schoolId={schoolId} />}
              {step === 7 && <AdditionalQuestionsStep formData={formData} updateField={updateField} />}
              {step === 8 && <ReviewStep formData={formData} goToStep={goToStep} />}
              {step === 9 && <ConfirmationStep referenceNumber={referenceNumber} />}
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>

      {/* Navigation Buttons */}
      {step < 9 && (
        <div className="flex justify-between">
          <Button variant="outline" onClick={handleBack} disabled={step === 0}>
            <ChevronLeft className="h-4 w-4 mr-1" /> Back
          </Button>
          {step === 8 ? (
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Submit Application'}
            </Button>
          ) : (
            <Button onClick={handleNext}>
              Next <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
};
