import { useState, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserPlus, Loader2, CheckCircle2, ChevronRight, ChevronLeft, Printer, UserPlus as EnrollIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { useCreateStudent } from '@/hooks/useStudents';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { differenceInYears } from 'date-fns';
import { KINDER_LEVELS } from './constants';
import QRCode from 'qrcode';

// Steps
import { StudentInfoStep } from './steps/StudentInfoStep';
import { ParentInfoStep } from './steps/ParentInfoStep';
import { AddressInfoStep } from './steps/AddressInfoStep';
import { AgreementStep } from './steps/AgreementStep';

const STEPS = [
    { id: 1, title: 'Student Info', description: 'Personal details' },
    { id: 2, title: 'Parent Info', description: 'Guardian details' },
    { id: 3, title: 'Address', description: 'Location details' },
    { id: 4, title: 'Agreement', description: 'Review & Sign' }
];

import { useSchool } from '@/contexts/SchoolContext';

export const EnrollmentWizard = () => {
    const { selectedSchool } = useSchool();
    const [currentStep, setCurrentStep] = useState(1);
    const [direction, setDirection] = useState(0);
    const [formData, setFormData] = useState({
        student_name: '',
        lrn: '',
        level: '',
        school: selectedSchool,
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
        signature: ''
    });

    // Update school when selectedSchool changes
    useMemo(() => {
        setFormData(prev => ({ ...prev, school: selectedSchool }));
    }, [selectedSchool]);

    const [errors, setErrors] = useState<any>({});
    const [touched, setTouched] = useState<any>({});
    const [agreed, setAgreed] = useState(false);
    const [isCompleted, setIsCompleted] = useState(false);
    const [createdCredentials, setCreatedCredentials] = useState<{ username: string; password: string } | null>(null);
    const sigPadRef = useRef<any>(null);

    const createStudent = useCreateStudent();

    const validateStep = (step: number) => {
        const newErrors: any = {};
        let isValid = true;
        const isKinder = ['Kinder 1', 'Kinder 2'].includes(formData.level);

        if (step === 1) {
            if (!formData.student_name.trim()) newErrors.student_name = 'Required';
            if (!isKinder && !formData.lrn.trim()) newErrors.lrn = 'Required';
            if (formData.lrn && !/^\d{12}$/.test(formData.lrn)) newErrors.lrn = 'Must be 12 digits';
            if (!formData.level) newErrors.level = 'Required';
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
            if (formData.school === 'STFXSA' && !formData.phil_address.trim()) newErrors.phil_address = 'Required';
            if (formData.school === 'MABDC' && !formData.uae_address.trim()) newErrors.uae_address = 'Required';
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
        if (!formData[field as keyof typeof formData] && field !== 'previous_school' && !(field === 'lrn' && ['Kinder 1', 'Kinder 2'].includes(formData.level))) {
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

        try {
            const signatureData = sigPadRef.current.getTrimmedCanvas().toDataURL('image/png');

            const finalLrn = formData.lrn.trim() || `TEMP-${Date.now()}`;
            const calculatedAge = formData.birth_date ? differenceInYears(new Date(), new Date(formData.birth_date)) : undefined;

            // 1. Create Student
            const result = await createStudent.mutateAsync({
                student_name: formData.student_name.trim(),
                lrn: finalLrn,
                level: formData.level,
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
                // TODO: Add signature_url when schema updated
            });

            // 2. Create Credentials
            try {
                const { data: credResult, error: credError } = await supabase.functions.invoke('create-users', {
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
                    // Generate Data URL for the QR code
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
                }
            }

            // 4. Send Email Notification
            try {
                // Determine email recipient (Mother or Father)
                const parentEmail = formData.mother_contact.includes('@') ? formData.mother_contact :
                    (formData.father_contact.includes('@') ? formData.father_contact : undefined);

                if (parentEmail) {
                    await supabase.functions.invoke('send-enrollment-email', {
                        body: {
                            to: parentEmail,
                            studentName: formData.student_name,
                            school: formData.school,
                            username: createdCredentials?.username || finalLrn,
                            password: createdCredentials?.password || '********', // Fallback if creds logic skipped or delayed
                            qrCodeUrl: qrCodeUrl
                        }
                    });
                }
            } catch (emailError) {
                console.error("Failed to send email:", emailError);
                // Don't block success just because email failed
            }

            setIsCompleted(true);
            toast.success('Enrollment submitted successfully!');
        } catch (error) {
            console.error(error);
            toast.error('Enrollment failed. Please try again.');
        }
    };

    const handleNewEnrollment = () => {
        setFormData({
            student_name: '',
            lrn: '',
            level: '',
            school: selectedSchool,
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
