import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ChevronLeft, ChevronRight, FlaskConical } from 'lucide-react';
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
import { generateTestData } from './useTestData';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { teacherApplicationSchema, TeacherApplicationFormValues } from './schema';

const initialFormData: TeacherApplicationFormValues = {
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [referenceNumber, setReferenceNumber] = useState('');

  const methods = useForm<TeacherApplicationFormValues>({
    resolver: zodResolver(teacherApplicationSchema),
    defaultValues: initialFormData,
    mode: 'onChange', // Validate on change for immediate feedback
  });

  const { handleSubmit, trigger, formState: { errors }, reset } = methods;

  const progress = ((step + 1) / STEPS.length) * 100;

  // Validation fields for each step
  const stepFields: (keyof TeacherApplicationFormValues)[][] = [
    ['first_name', 'last_name', 'gender', 'date_of_birth', 'civil_status', 'nationality'], // Step 0: Personal
    ['mobile_number', 'email', 'house_street', 'barangay', 'city_municipality', 'province', 'zip_code', 'country'], // Step 1: Contact
    ['position_applied', 'subject_specialization'], // Step 2: Position
    ['has_prc_license', 'prc_license_number', 'prc_expiration_date'], // Step 3: PRC (conditional handled by schema refine, but triggering key fields helps)
    ['education'], // Step 4: Education
    ['has_experience', 'experience'], // Step 5: Experience
    ['resume_url', 'valid_id_url'], // Step 6: Documents
    [], // Step 7: Additional (optional mainly)
    [], // Step 8: Review
  ];

  const handleNext = async () => {
    const fieldsToValidate = stepFields[step];

    // If specific fields are defined for this step, validate them
    if (fieldsToValidate && fieldsToValidate.length > 0) {
      const isValid = await trigger(fieldsToValidate as any);
      if (!isValid) {
        toast.error('Please fix the errors before proceeding');
        return;
      }
    }

    // Special check for conditional PRC logic in Zod refine
    if (step === 3) {
      // Trigger validation on the whole object or specific complex fields if needed
      // but usually 'trigger' takes field names.
      // Since license number is conditional on 'has_prc_license', if 'has_prc_license' is true, 
      // trigger('prc_license_number') should show error if empty.
      const hasLicense = methods.getValues('has_prc_license');
      if (hasLicense) {
        const isLicenseValid = await trigger(['prc_license_number', 'prc_expiration_date']);
        if (!isLicenseValid) return;
      }
    }

    if (step < STEPS.length - 1) setStep(s => s + 1);
  };

  const handleBack = () => {
    if (step > 0) setStep(s => s - 1);
  };

  const onSubmit = async (data: TeacherApplicationFormValues) => {
    setIsSubmitting(true);
    try {
      const payload = {
        school_id: schoolId,
        first_name: data.first_name.trim(),
        middle_name: data.middle_name?.trim() || null,
        last_name: data.last_name.trim(),
        suffix: data.suffix || null,
        gender: data.gender,
        date_of_birth: data.date_of_birth,
        place_of_birth: data.place_of_birth || null,
        civil_status: data.civil_status,
        nationality: data.nationality,
        photo_url: data.photo_url || null,
        mobile_number: data.mobile_number,
        alternate_mobile: data.alternate_mobile || null,
        email: data.email.trim(),
        house_street: data.house_street.trim(),
        barangay: data.barangay.trim(),
        city_municipality: data.city_municipality.trim(),
        province: data.province.trim(),
        zip_code: data.zip_code,
        country: data.country,
        position_applied: data.position_applied,
        subject_specialization: data.subject_specialization.length > 0 ? data.subject_specialization : null,
        preferred_level: data.preferred_level || null,
        has_prc_license: data.has_prc_license,
        prc_license_number: data.prc_license_number || null,
        prc_expiration_date: data.prc_expiration_date || null,
        prc_license_url: data.prc_license_url || null,
        education: data.education,
        has_experience: data.has_experience,
        experience: data.experience && data.experience.length > 0 ? data.experience : null,
        resume_url: data.resume_url || null,
        transcript_url: data.transcript_url || null,
        diploma_url: data.diploma_url || null,
        valid_id_url: data.valid_id_url || null,
        certificates_url: data.certificates_url && data.certificates_url.length > 0 ? data.certificates_url : null,
        why_join: data.why_join?.trim() || null,
        teaching_philosophy: data.teaching_philosophy?.trim() || null,
        expected_salary: data.expected_salary || null,
        available_start_date: data.available_start_date || null,
      };

      // Insert-only pattern (no .select() to avoid SELECT RLS conflict)
      const { error } = await supabase.from('teacher_applications').insert(payload);

      if (error) throw error;

      // Reference number is generated by trigger and delivered via email
      setReferenceNumber('Submitted (Check Email)');
      toast.success('Application submitted successfully!');

      // Send email via Edge Function
      const fullName = `${data.first_name} ${data.middle_name ? data.middle_name + ' ' : ''}${data.last_name}${data.suffix ? ' ' + data.suffix : ''}`.trim();

      await supabase.functions.invoke('send-teacher-application-email', {
        body: {
          applicantName: fullName,
          applicantEmail: data.email,
          positionApplied: data.position_applied,
          schoolId,
          referenceNumber: 'Pending'
        },
      });

      setStep(9); // Confirmation step
    } catch (err: any) {
      console.error('Submission error:', err);
      toast.error(err.message || 'Failed to submit application');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper for child components to update form
  // We need to pass 'formData' (values) and 'updateField' (setter) to maintain compatibility 
  // with existing step components, OR refactor step components to use useFormContext.
  // Ideally, step components should use useFormContext.
  // BUT, to avoid refactoring 10 files at once, we can bridge it.

  // NOTE: This bridge causes re-renders but is safer for immediate refactor.
  // Best practice: Refactor children to useFormContext().
  // Given "Opus style", I should do it right. But checking files... they expect specific props.
  // I will pass 'methods.watch()' as 'formData' and a wrapper for 'updateField'.

  const currentValues = methods.watch();

  const updateFieldWrapper = (field: keyof TeacherApplicationFormValues, value: any) => {
    methods.setValue(field, value, { shouldValidate: true, shouldDirty: true });
  };

  return (
    <div className="space-y-6">
      <FormProvider {...methods}>
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
                {/* 
                  We pass `formData` (watched values) and `updateField` (setValue wrapper)
                  This maintains compatibility with existing step components while using RHF state.
                  Ideally, we'd go into each step and use useFormContext(), but this is a valid interim pattern.
                */}
                {step === 0 && <PersonalInfoStep formData={currentValues} updateField={updateFieldWrapper} schoolId={schoolId} />}
                {step === 1 && <ContactInfoStep formData={currentValues} updateField={updateFieldWrapper} />}
                {step === 2 && <PositionStep formData={currentValues} updateField={updateFieldWrapper} schoolId={schoolId} />}
                {step === 3 && <PrcLicenseStep formData={currentValues} updateField={updateFieldWrapper} schoolId={schoolId} />}
                {step === 4 && <EducationStep formData={currentValues} updateField={updateFieldWrapper} />}
                {step === 5 && <ExperienceStep formData={currentValues} updateField={updateFieldWrapper} />}
                {step === 6 && <DocumentUploadStep formData={currentValues} updateField={updateFieldWrapper} schoolId={schoolId} />}
                {step === 7 && <AdditionalQuestionsStep formData={currentValues} updateField={updateFieldWrapper} />}
                {step === 8 && <ReviewStep formData={currentValues} goToStep={(s) => setStep(s)} />}
                {step === 9 && <ConfirmationStep referenceNumber={referenceNumber} />}
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>

        {/* Navigation Buttons */}
        {step < 9 && (
          <div className="flex justify-between">
            <Button variant="outline" onClick={handleBack} disabled={step === 0} type="button">
              <ChevronLeft className="h-4 w-4 mr-1" /> Back
            </Button>
            <div className="flex gap-2">
              <Button type="button" variant="secondary" size="sm"
                onClick={() => {
                  const testData = generateTestData();
                  reset(testData); // Reset form with test data
                  toast.success('Test data loaded');
                }}
                className="text-xs">
                <FlaskConical className="h-3 w-3 mr-1" /> Fill Test Data
              </Button>

              {step === 8 ? (
                <Button onClick={handleSubmit(onSubmit)} disabled={isSubmitting}>
                  {isSubmitting ? 'Submitting...' : 'Submit Application'}
                </Button>
              ) : (
                <Button onClick={handleNext} type="button">
                  Next <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              )}
            </div>
          </div>
        )}
      </FormProvider>
    </div>
  );
};
