import { useState, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserPlus as EnrollIcon, Loader2, CheckCircle2, ChevronRight, ChevronLeft, Printer, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useCreateStudent } from '@/hooks/useStudents';
import { getSchoolId } from '@/utils/schoolIdMap';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { differenceInYears } from 'date-fns';

import QRCode from 'qrcode';
import { useAcademicYear } from '@/contexts/AcademicYearContext';
import { GRADE_LEVELS, isKindergartenLevel } from './constants';

// Steps
import { StudentInfoStep } from './steps/StudentInfoStep';
import { ParentInfoStep } from './steps/ParentInfoStep';
import { AddressInfoStep } from './steps/AddressInfoStep';
import { AgreementStep } from './steps/AgreementStep';

const STEPS = [
    { id: 1, title: 'Learner Info', description: 'Personal details' },
    { id: 2, title: 'Parent Info', description: 'Guardian details' },
    { id: 3, title: 'Address', description: 'Location details' },
    { id: 4, title: 'Agreement', description: 'Review & Sign' }
];

import { useSchool } from '@/contexts/SchoolContext';
import { useAuth } from '@/contexts/AuthContext';

interface EnrollmentWizardProps {
    mode?: 'enrollment' | 'admission';
    onComplete?: () => void;
}

export const EnrollmentWizard = ({ mode = 'enrollment', onComplete }: EnrollmentWizardProps) => {
    const { selectedSchool } = useSchool();
    const { user } = useAuth();
    const { selectedYearId, selectedYear } = useAcademicYear();
    const [currentStep, setCurrentStep] = useState(1);
    const [, setDirection] = useState(0);
    const [hasLrn, setHasLrn] = useState(true);
    const [formData, setFormData] = useState({
        student_name: '',
        lrn: '',
        level: '',
        strand: '', // SHS strand for Grade 11/12
        school: selectedSchool,
        school_year: selectedYear?.name || '',
        birth_date: '',
        gender: '',
        mother_maiden_name: '',
        mother_contact: '',
        father_name: '',
        father_contact: '',
        phil_address: '',
        uae_address: '',
        previous_school: '',
        mother_tongue: '',
        dialects: '',
        signature: ''
    });

    // Update school and academic year when context changes
    useMemo(() => {
        setFormData(prev => ({
            ...prev,
            school: selectedSchool,
            school_year: selectedYear?.name || ''
        }));
    }, [selectedSchool, selectedYear]);

    const [errors, setErrors] = useState<any>({});
    const [touched, setTouched] = useState<any>({});
    const [agreed, setAgreed] = useState(false);
    const [isCompleted, setIsCompleted] = useState(false);
    const [createdCredentials, setCreatedCredentials] = useState<{ username: string; password: string } | null>(null);
    const sigPadRef = useRef<any>(null);

    const createStudent = useCreateStudent();

    // Auto-fill with test data (for testing purposes)
    const handleAutoFill = () => {
        const randomNum = Math.floor(Math.random() * 1000);
        const genders = ['Male', 'Female'];
        const levels = GRADE_LEVELS;
        const strands = ['ABM', 'STEM', 'HUMSS', 'GAS'];
        const firstNames = ['John', 'Maria', 'Jose', 'Anna', 'Miguel', 'Sofia', 'Carlos', 'Isabella', 'Luis', 'Elena'];
        const lastNames = ['Santos', 'Reyes', 'Cruz', 'Garcia', 'Fernandez', 'Lopez', 'Martinez', 'Rodriguez', 'Gonzalez', 'Hernandez'];
        const previousSchools = ['Manila Central School', 'Quezon City Elementary', 'Makati High School', 'Cebu International School', 'Davao Learning Center'];

        const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
        const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
        const gender = genders[Math.floor(Math.random() * genders.length)];
        const level = levels[Math.floor(Math.random() * levels.length)];
        const isKinder = level === 'Kindergarten';
        const isSHS = level === 'Grade 11' || level === 'Grade 12';

        // Generate birth date (6-18 years old)
        const currentYear = new Date().getFullYear();
        const birthYear = currentYear - Math.floor(Math.random() * 13 + 6); // 6-18 years old
        const birthMonth = String(Math.floor(Math.random() * 12) + 1).padStart(2, '0');
        const birthDay = String(Math.floor(Math.random() * 28) + 1).padStart(2, '0');
        const birthDate = `${birthYear}-${birthMonth}-${birthDay}`;

        setFormData({
            student_name: `${firstName} ${lastName}`,
            lrn: isKinder ? '' : `1234${String(randomNum).padStart(8, '0')}`,
            level: level,
            strand: isSHS ? strands[Math.floor(Math.random() * strands.length)] : '',
            school: selectedSchool,
            school_year: selectedYear?.name || '',
            birth_date: birthDate,
            gender: gender,
            mother_maiden_name: `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`,
            mother_contact: `+971-50-${Math.floor(Math.random() * 900 + 100)}-${Math.floor(Math.random() * 9000 + 1000)}`,
            father_name: `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastName}`,
            father_contact: `+971-50-${Math.floor(Math.random() * 900 + 100)}-${Math.floor(Math.random() * 9000 + 1000)}`,
            phil_address: `${Math.floor(Math.random() * 500 + 1)} ${['Mabini', 'Rizal', 'Bonifacio', 'Luna'][Math.floor(Math.random() * 4)]} Street, ${['Manila', 'Quezon City', 'Makati', 'Taguig'][Math.floor(Math.random() * 4)]}, Metro Manila, Philippines`,
            uae_address: `Apartment ${Math.floor(Math.random() * 500 + 1)}, ${['Al Nahda', 'Deira', 'Bur Dubai', 'Karama'][Math.floor(Math.random() * 4)]}, Dubai, UAE`,
            previous_school: previousSchools[Math.floor(Math.random() * previousSchools.length)],
            mother_tongue: 'Filipino',
            dialects: 'Tagalog, English',
            signature: ''
        });

        // Clear errors and touched state
        setErrors({});
        setTouched({});

        toast.success('Form auto-filled with test data');
    };

    const validateStep = (step: number) => {
        const newErrors: any = {};
        let isValid = true;
        const isKinder = formData.level === 'Kindergarten';
        const isSHS = formData.level === 'Grade 11' || formData.level === 'Grade 12';

        if (step === 1) {
            if (!formData.student_name.trim()) newErrors.student_name = 'Required';
            if (hasLrn && !isKinder && !formData.lrn.trim()) newErrors.lrn = 'Required';
            if (hasLrn && formData.lrn && !/^\d{12}$/.test(formData.lrn)) newErrors.lrn = 'Must be 12 digits';
            if (!formData.level) newErrors.level = 'Required';
            if (isSHS && !formData.strand) newErrors.strand = 'Strand is required for Grade 11 & 12';
            if (!formData.birth_date) newErrors.birth_date = 'Required';
            if (!formData.gender) newErrors.gender = 'Required';
        }

        if (step === 2) {
            if (!formData.mother_maiden_name.trim()) newErrors.mother_maiden_name = 'Required';
            if (!formData.mother_contact.trim()) newErrors.mother_contact = 'Required';
            if (!formData.father_name.trim()) newErrors.father_name = 'Required';
            if (!formData.father_contact.trim()) newErrors.father_contact = 'Required';
        }

        if (step === 3) {
            if (!formData.phil_address.trim()) newErrors.phil_address = 'Required';
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            // Mark all fields in this step as touched
            const stepFields = Object.keys(newErrors);
            const newTouched = { ...touched };
            stepFields.forEach(f => newTouched[f] = true);
            setTouched(newTouched);
            isValid = false;
            toast.error('Please fix errors before proceeding');
        }

        return isValid;
    };

    const handleNext = () => {
        if (validateStep(currentStep)) {
            setDirection(1);
            setCurrentStep(prev => Math.min(prev + 1, STEPS.length));
        }
    };

    const handleBack = () => {
        setDirection(-1);
        setCurrentStep(prev => Math.max(prev - 1, 1));
    };

    const handleChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (touched[field]) {
            // Simple re-validation on change
            setErrors((prev: any) => ({ ...prev, [field]: value ? undefined : 'Required' }));
        }
    };

    const handleBlur = (field: string) => {
        setTouched((prev: any) => ({ ...prev, [field]: true }));
        if (!formData[field as keyof typeof formData] && field !== 'previous_school' && !(field === 'lrn' && isKindergartenLevel(formData.level))) {
            setErrors((prev: any) => ({ ...prev, [field]: 'Required' }));
        }
    };

    const handleClearSignature = () => {
        sigPadRef.current?.clear();
    };

    const handleSubmit = async () => {
        if (!agreed) {
            toast.error('Please accept the Terms and Conditions');
            return;
        }

        if (sigPadRef.current?.isEmpty()) {
            toast.error('Parent signature is required');
            return;
        }

        // Pre-submit guard: ensure school_id and academic_year_id are available
        const resolvedSchoolId = getSchoolId(formData.school);
        if (!resolvedSchoolId) {
            toast.error('Unable to resolve school. Please select a valid school and try again.');
            return;
        }
        if (!selectedYearId) {
            toast.error('No academic year selected. Please select an academic year before enrolling.');
            return;
        }

        try {
            const _sig = sigPadRef.current.getCanvas().toDataURL('image/png');

            const finalLrn = formData.lrn.trim() || `TEMP-${Date.now()}`;
            const calculatedAge = formData.birth_date ? differenceInYears(new Date(), new Date(formData.birth_date)) : undefined;

            // --- ADMISSION MODE: insert into admissions table ---
            if (mode === 'admission') {
                const { data: inserted, error: admError } = await (supabase.from('admissions') as any).insert([{
                    student_name: formData.student_name.trim(),
                    lrn: finalLrn.startsWith('TEMP') ? null : finalLrn,
                    level: formData.level,
                    school: formData.school,
                    school_id: resolvedSchoolId,
                    academic_year_id: selectedYearId,
                    birth_date: formData.birth_date || null,
                    gender: formData.gender || null,
                    strand: formData.strand || null, // SHS strand for Grade 11/12
                    mother_maiden_name: formData.mother_maiden_name.trim() || null,
                    mother_contact: formData.mother_contact.trim() || null,
                    father_name: formData.father_name.trim() || null,
                    father_contact: formData.father_contact.trim() || null,
                    phil_address: formData.phil_address.trim() || null,
                    uae_address: formData.uae_address.trim() || null,
                    previous_school: formData.previous_school.trim() || null,
                    parent_email: formData.mother_contact.includes('@') ? formData.mother_contact : (formData.father_contact.includes('@') ? formData.father_contact : null),
                    created_by: user?.id,
                    status: 'pending',
                }]).select('id').single();
                if (admError) throw admError;

                // Audit log
                if (inserted?.id) {
                    await (supabase.from('admission_audit_logs') as any).insert([{
                        admission_id: inserted.id,
                        action: 'submitted',
                        performed_by: user?.id,
                        details: { student_name: formData.student_name.trim() },
                    }]);
                }

                toast.success('Admission application submitted successfully!');
                onComplete?.();
                return;
            }

            // --- ENROLLMENT MODE (default): create student directly ---
            // Pre-submit LRN duplicate check
            if (finalLrn && !finalLrn.startsWith('TEMP')) {
                const { data: existingLrn } = await supabase
                    .from('students')
                    .select('id')
                    .eq('lrn', finalLrn)
                    .eq('school', formData.school)
                    .maybeSingle();

                if (existingLrn) {
                    toast.error('A learner with this LRN already exists in this school');
                    return;
                }
            }

            // 1. Create Student
            const result = await createStudent.mutateAsync({
                student_name: formData.student_name.trim(),
                lrn: finalLrn,
                level: formData.level,
                strand: formData.strand || undefined, // SHS strand for Grade 11/12
                school: formData.school,
                birth_date: formData.birth_date || undefined,
                age: calculatedAge,
                gender: formData.gender,
                mother_maiden_name: formData.mother_maiden_name.trim(),
                mother_contact: formData.mother_contact.trim(),
                father_name: formData.father_name.trim(),
                father_contact: formData.father_contact.trim(),
                phil_address: formData.phil_address.trim(),
                uae_address: formData.uae_address.trim(),
                previous_school: formData.previous_school.trim() || undefined,
                academic_year_id: selectedYearId,
                school_id: resolvedSchoolId,
            } as any);

            // 2. Create Credentials
            try {
                const { data: credResult } = await supabase.functions.invoke('create-users', {
                    body: {
                        action: 'create_single_student',
                        studentId: result.id,
                        studentLrn: finalLrn,
                        studentName: formData.student_name.trim(),
                        studentSchool: formData.school,
                    },
                });

                if (credResult) {
                    setCreatedCredentials({
                        username: credResult.username,
                        password: credResult.password,
                    });
                }
            } catch (e) {
                console.error('Credential creation failed', e);
            }

            // 3. Generate QR Code (ID Badge)
            let qrCodeUrl = undefined;
            if (finalLrn && !finalLrn.startsWith('TEMP')) {
                try {
                    qrCodeUrl = await QRCode.toDataURL(finalLrn, {
                        width: 300,
                        margin: 2,
                        color: {
                            dark: '#000000',
                            light: '#ffffff',
                        },
                    });
                } catch (qrError) {
                    console.error('QR Code generation failed:', qrError);
                    toast.warning('QR Code generation failed, but enrollment was successful');
                }
            }

            // 4. Send Email Notification
            try {
                const parentEmail = formData.mother_contact.includes('@') ? formData.mother_contact :
                    (formData.father_contact.includes('@') ? formData.father_contact : undefined);

                if (parentEmail) {
                    await supabase.functions.invoke('send-enrollment-email', {
                        body: {
                            to: parentEmail,
                            studentName: formData.student_name,
                            school: formData.school,
                            username: createdCredentials?.username || finalLrn,
                            password: createdCredentials?.password || '********',
                            qrCodeUrl: qrCodeUrl
                        }
                    });
                } else {
                    toast.info('No parent email provided, email notification skipped');
                }
            } catch (emailError) {
                console.error("Failed to send email:", emailError);
                toast.warning('Enrollment successful but failed to send email notification');
            }

            setIsCompleted(true);
            toast.success('Enrollment submitted successfully!');
        } catch (error: any) {
            console.error('Enrollment error:', error);
            toast.error(error?.message || 'Enrollment failed. Please try again.');
        }
    };

    const handleNewEnrollment = () => {
        setFormData({
            student_name: '',
            lrn: '',
            level: '',
            strand: '',
            school: selectedSchool,
            school_year: selectedYear?.name || '',
            birth_date: '',
            gender: '',
            mother_maiden_name: '',
            mother_contact: '',
            father_name: '',
            father_contact: '',
            phil_address: '',
            uae_address: '',
            previous_school: '',
            mother_tongue: '',
            dialects: '',
            signature: ''
        });
        setCurrentStep(1);
        setIsCompleted(false);
        setCreatedCredentials(null);
        setErrors({});
        setTouched({});
        setAgreed(false);
        sigPadRef.current?.clear();
    };

    if (isCompleted) {
        return (
            <EnrollmentSuccess
                studentName={formData.student_name}
                credentials={createdCredentials}
                onNew={handleNewEnrollment}
            />
        );
    }

    return (
        <div className="max-w-4xl mx-auto">
            {/* Auto-fill button (only in admission mode and before completion) */}
            {mode === 'admission' && currentStep === 1 && (
                <div className="mb-4 flex justify-end">
                    <Button
                        onClick={handleAutoFill}
                        variant="outline"
                        size="sm"
                        className="gap-2 text-purple-600 border-purple-300 hover:bg-purple-50"
                    >
                        <Sparkles className="h-4 w-4" />
                        Auto-fill Test Data
                    </Button>
                </div>
            )}

            {/* Wizard Progress */}
            <div className="mb-8">
                <div className="flex items-center justify-between relative z-10">
                    {STEPS.map((step) => {
                        const isActive = step.id === currentStep;
                        const isPast = step.id < currentStep;
                        return (
                            <div key={step.id} className="flex flex-col items-center flex-1">
                                <div
                                    className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors duration-300 bg-background ${isActive ? 'border-stat-purple text-stat-purple' :
                                        isPast ? 'border-stat-purple bg-stat-purple text-white' : 'border-muted text-muted-foreground'
                                        }`}
                                >
                                    {isPast ? <CheckCircle2 className="h-6 w-6" /> : <span className="font-bold">{step.id}</span>}
                                </div>
                                <div className="mt-2 text-center hidden md:block">
                                    <p className={`text-sm font-medium ${isActive ? 'text-stat-purple' : 'text-muted-foreground'}`}>{step.title}</p>
                                </div>
                            </div>
                        );
                    })}
                    {/* Progress Bar Background */}
                    <div className="absolute top-5 left-0 w-full h-0.5 bg-muted -z-10" />

                    {/* Active Progress Bar */}
                    <div
                        className="absolute top-5 left-0 h-0.5 bg-stat-purple -z-10 transition-all duration-300"
                        style={{ width: `${((currentStep - 1) / (STEPS.length - 1)) * 100}%` }}
                    />
                </div>
            </div>

            <div className="bg-card rounded-2xl shadow-card p-6 lg:p-8 min-h-[500px] flex flex-col">
                <div className="flex-1">
                    <AnimatePresence mode="wait">
                        {currentStep === 1 && (
                            <StudentInfoStep
                                key="step1"
                                formData={formData}
                                errors={errors}
                                touched={touched}
                                handleChange={handleChange}
                                handleBlur={handleBlur}
                                hasLrn={hasLrn}
                                onToggleLrn={setHasLrn}
                            />
                        )}
                        {currentStep === 2 && (
                            <ParentInfoStep
                                key="step2"
                                formData={formData}
                                errors={errors}
                                touched={touched}
                                handleChange={handleChange}
                                handleBlur={handleBlur}
                            />
                        )}
                        {currentStep === 3 && (
                            <AddressInfoStep
                                key="step3"
                                formData={formData}
                                errors={errors}
                                touched={touched}
                                handleChange={handleChange}
                                handleBlur={handleBlur}
                            />
                        )}
                        {currentStep === 4 && (
                            <AgreementStep
                                key="step4"
                                agreed={agreed}
                                setAgreed={setAgreed}
                                sigPadRef={sigPadRef}
                                handleClearSignature={handleClearSignature}
                                isCompleted={isCompleted}
                            />
                        )}
                    </AnimatePresence>
                </div>

                <div className="flex justify-between mt-8 pt-4 border-t border-border">
                    <Button
                        variant="ghost"
                        onClick={handleBack}
                        disabled={currentStep === 1 || createStudent.isPending}
                        className="gap-2"
                    >
                        <ChevronLeft className="h-4 w-4" /> Back
                    </Button>

                    {currentStep < STEPS.length ? (
                        <Button onClick={handleNext} className="bg-stat-purple hover:bg-stat-purple/90 text-white gap-2">
                            Next <ChevronRight className="h-4 w-4" />
                        </Button>
                    ) : (
                        <Button
                            onClick={handleSubmit}
                            className="bg-stat-purple hover:bg-stat-purple/90 text-white gap-2"
                            disabled={createStudent.isPending}
                        >
                            {createStudent.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <EnrollIcon className="h-4 w-4" />}
                            Submit Enrollment
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
};

const EnrollmentSuccess = ({ studentName, credentials, onNew }: { studentName: string, credentials: any, onNew: () => void }) => {
    return (
        <div className="bg-card rounded-2xl shadow-card p-8 text-center max-w-2xl mx-auto animate-in fade-in zoom-in duration-300">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="h-10 w-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Enrollment Successful!</h2>
            <p className="text-muted-foreground mb-8">
                <span className="font-semibold text-foreground">{studentName}</span> has been successfully enrolled.
                A confirmation email has been sent to the parents.
            </p>

            {credentials && (
                <div className="bg-muted/30 rounded-lg p-6 mb-8 border border-border text-left">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-stat-purple" />
                        Student Portal Credentials
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Username</p>
                            <p className="font-mono font-medium bg-background p-2 rounded border">{credentials.username}</p>
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Password</p>
                            <p className="font-mono font-medium bg-background p-2 rounded border">{credentials.password}</p>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex justify-center gap-4">
                <Button onClick={() => window.print()} variant="outline" className="gap-2">
                    <Printer className="h-4 w-4" /> Print
                </Button>
                <Button onClick={onNew} className="bg-stat-purple text-white gap-2">
                    <EnrollIcon className="h-4 w-4" /> Enroll Another
                </Button>
            </div>
        </div>
    );
}
