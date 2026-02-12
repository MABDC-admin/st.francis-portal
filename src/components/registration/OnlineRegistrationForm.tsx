import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Loader2, UserPlus, ArrowRight, ArrowLeft, Building2, Wand2, Phone, Edit2, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { SchoolShowcaseDialog } from './SchoolShowcaseDialog';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectGroup, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { GENDERS, SHS_STRANDS, requiresStrand, isKindergartenLevel } from '@/components/enrollment/constants';
import { differenceInYears } from 'date-fns';

const RELIGIONS = [
  'Roman Catholic',
  'Islam',
  'Iglesia ni Cristo',
  'Protestant/Evangelical',
  'Seventh-Day Adventist',
  'Aglipayan',
  'Buddhism',
  'Hinduism',
  'Other',
];

const STEP_LABELS = ['Student Information', 'Parent & Address', 'Agreement', 'Review & Submit'];

interface OnlineRegistrationFormProps {
  schoolId: string;
  academicYearId: string;
  academicYearName?: string;
}

export const OnlineRegistrationForm = ({ schoolId, academicYearId, academicYearName }: OnlineRegistrationFormProps) => {
  const [step, setStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [hasLrn, setHasLrn] = useState(true);
  const [showShowcase, setShowShowcase] = useState(false);
  const [lastRegistrationId, setLastRegistrationId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    student_name: '', lrn: '', level: '', strand: '',
    birth_date: '', gender: '', religion: '', religion_other: '',
    mother_tongue: '', dialects: '',
    mother_maiden_name: '', mother_contact: '',
    father_name: '', father_contact: '',
    parent_email: '', current_address: '',
    previous_school: '', mobile_number: '',
  });

  const [agreements, setAgreements] = useState({
    terms: false, consent: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const needsStrand = useMemo(() => requiresStrand(formData.level), [formData.level]);
  const calculatedAge = useMemo(() => {
    if (!formData.birth_date) return null;
    const age = differenceInYears(new Date(), new Date(formData.birth_date));
    return age >= 0 ? age : null;
  }, [formData.birth_date]);
  const isMinor = calculatedAge !== null && calculatedAge < 18;

  const handleChange = useCallback((field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  }, [errors]);

  const validateStep = (s: number): boolean => {
    const errs: Record<string, string> = {};
    if (s === 0) {
      if (!formData.level) errs.level = 'Required';
      if (hasLrn && !isKindergartenLevel(formData.level) && !formData.lrn.trim()) errs.lrn = 'Required';
      if (hasLrn && formData.lrn && !/^\d{12}$/.test(formData.lrn)) errs.lrn = 'Must be 12 digits';
      if (!formData.student_name.trim()) errs.student_name = 'Required';
      if (!formData.birth_date) errs.birth_date = 'Required';
      if (!formData.gender) errs.gender = 'Required';
      if (!formData.religion) errs.religion = 'Required';
      if (formData.religion === 'Other' && !formData.religion_other.trim()) errs.religion_other = 'Please specify';
      if (needsStrand && !formData.strand) errs.strand = 'Required for SHS';
    } else if (s === 1) {
      if (!formData.mother_maiden_name.trim()) errs.mother_maiden_name = 'Required';
      if (!formData.mother_contact.trim()) errs.mother_contact = 'Required';
      if (!formData.current_address.trim()) errs.current_address = 'Required';
    } else if (s === 2) {
      if (!agreements.terms) errs.terms = 'Required';
      if (isMinor && !agreements.consent) errs.consent = 'Required';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const goNext = () => {
    if (validateStep(step)) setStep(s => s + 1);
    else toast.error('Please fix the highlighted errors');
  };

  const goBack = () => setStep(s => s - 1);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const religion = formData.religion === 'Other' ? formData.religion_other.trim() : formData.religion;

      const { error } = await (supabase.from('online_registrations') as any).insert([{
        student_name: formData.student_name.trim(),
        lrn: hasLrn && formData.lrn.trim() ? formData.lrn.trim() : null,
        level: formData.level,
        strand: formData.strand || null,
        birth_date: formData.birth_date || null,
        gender: formData.gender || null,
        religion,
        mother_maiden_name: formData.mother_maiden_name.trim() || null,
        mother_contact: formData.mother_contact.trim() || null,
        father_name: formData.father_name.trim() || null,
        father_contact: formData.father_contact.trim() || null,
        parent_email: formData.parent_email.trim() || null,
        current_address: formData.current_address.trim() || null,
        phil_address: formData.current_address.trim() || null,
        previous_school: formData.previous_school.trim() || null,
        mother_tongue: formData.mother_tongue.trim() || null,
        dialects: formData.dialects.trim() || null,
        mobile_number: formData.mobile_number.trim() || null,
        signature_data: null,
        agreements_accepted: {
          terms: agreements.terms,
          consent: agreements.consent,
          accepted_at: new Date().toISOString(),
        },
        school_id: schoolId,
        academic_year_id: academicYearId,
        status: 'pending',
      }]);
      if (error) throw error;

      setLastRegistrationId(null);
      setIsSuccess(true);
      toast.success('Registration submitted successfully!');

      try {
        await supabase.functions.invoke('send-registration-email', {
          body: {
            studentName: formData.student_name.trim(),
            parentEmail: formData.parent_email.trim() || null,
            level: formData.level,
            schoolId,
          },
        });
      } catch (emailErr) {
        console.warn('Email notification failed (non-critical):', emailErr);
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to submit');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setIsSuccess(false);
    setShowShowcase(false);
    setLastRegistrationId(null);
    setStep(0);
    setFormData({ student_name: '', lrn: '', level: '', strand: '', birth_date: '', gender: '', religion: '', religion_other: '', mother_tongue: '', dialects: '', mother_maiden_name: '', mother_contact: '', father_name: '', father_contact: '', parent_email: '', current_address: '', previous_school: '', mobile_number: '' });
    setAgreements({ terms: false, consent: false });
    setHasLrn(true);
  };

  if (isSuccess) {
    return (
      <>
        <div className="flex items-center justify-center py-16">
          <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 15 }} className="text-center space-y-6">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: 'spring', stiffness: 300 }}>
              <CheckCircle2 className="h-24 w-24 text-green-500 mx-auto" />
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
              <h2 className="text-3xl font-bold text-foreground">Registration Submitted!</h2>
              <p className="text-muted-foreground mt-3 max-w-md mx-auto">
                Your registration has been received and is pending review by the school registrar. You will be notified once it has been processed.
              </p>
            </motion.div>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="flex flex-col gap-3 items-center">
              <Button onClick={() => setShowShowcase(true)} size="lg" variant="outline" className="gap-2">
                <Building2 className="h-4 w-4" /> View School Info & Schedule Visit
              </Button>
            </motion.div>
          </motion.div>
        </div>
        <SchoolShowcaseDialog
          open={showShowcase}
          onOpenChange={setShowShowcase}
          schoolId={schoolId}
          registrationId={lastRegistrationId || undefined}
        />
      </>
    );
  }

  const fieldError = (field: string) => errors[field] ? <p className="text-destructive text-xs mt-1">{errors[field]}</p> : null;
  const progressValue = ((step + 1) / STEP_LABELS.length) * 100;

  const slideVariants = {
    enter: (dir: number) => ({ x: dir > 0 ? 80 : -80, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? -80 : 80, opacity: 0 }),
  };

  const reviewRow = (label: string, value: string | null | undefined) => (
    <div className="flex justify-between py-1.5 border-b border-border/50 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-foreground text-right max-w-[60%]">{value || '—'}</span>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Autofill & Progress */}
      <div className="flex items-center justify-between">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1.5 text-xs"
          onClick={() => {
            const testNames = ['Dela Cruz, Juan Miguel M.', 'Santos, Maria Clara P.', 'Reyes, Jose Andres L.', 'Garcia, Ana Sofia R.'];
            const testLevels = ['Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 1', 'Grade 2', 'Grade 3'];
            const testReligions = ['Roman Catholic', 'Islam', 'Iglesia ni Cristo', 'Protestant/Evangelical'];
            const testGenders = ['Male', 'Female'];
            const randomPick = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];
            const year = 2010 + Math.floor(Math.random() * 10);
            const month = String(Math.floor(Math.random() * 12) + 1).padStart(2, '0');
            const day = String(Math.floor(Math.random() * 28) + 1).padStart(2, '0');
            const lrn = Array.from({ length: 12 }, () => Math.floor(Math.random() * 10)).join('');
            const phone = `09${Math.floor(100000000 + Math.random() * 900000000)}`;

            setFormData({
              student_name: randomPick(testNames),
              lrn,
              level: randomPick(testLevels),
              strand: '',
              birth_date: `${year}-${month}-${day}`,
              gender: randomPick(testGenders),
              religion: randomPick(testReligions),
              religion_other: '',
              mother_tongue: 'Filipino',
              dialects: 'Tagalog, English',
              mother_maiden_name: `${randomPick(['Fernandez', 'Lopez', 'Aquino', 'Bautista'])}, ${randomPick(['Maria', 'Ana', 'Rosa', 'Carmen'])}`,
              mother_contact: `09${Math.floor(100000000 + Math.random() * 900000000)}`,
              father_name: `${randomPick(['Dela Cruz', 'Santos', 'Reyes', 'Garcia'])}, ${randomPick(['Pedro', 'Jose', 'Miguel', 'Carlos'])}`,
              father_contact: `09${Math.floor(100000000 + Math.random() * 900000000)}`,
              parent_email: `parent.test${Math.floor(Math.random() * 999)}@example.com`,
              current_address: `${Math.floor(Math.random() * 999) + 1} ${randomPick(['Rizal', 'Mabini', 'Bonifacio', 'Luna'])} St., ${randomPick(['Al Nahda', 'Deira', 'Bur Dubai', 'Sharjah'])}, UAE`,
              previous_school: randomPick(['Manila Elementary School', 'Quezon City National HS', 'Cebu International School', 'Davao Central Academy']),
              mobile_number: phone,
            });
            setHasLrn(true);
            setErrors({});
            toast.success('Test data filled! Review and adjust as needed.');
          }}
        >
          <Wand2 className="h-3.5 w-3.5" /> Fill Test Data
        </Button>
      </div>

      {/* Progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm font-medium">
          {STEP_LABELS.map((label, i) => (
            <span key={i} className={i <= step ? 'text-primary' : 'text-muted-foreground'}>
              {i + 1}. {label}
            </span>
          ))}
        </div>
        <Progress value={progressValue} className="h-2" />
      </div>

      <AnimatePresence mode="wait" custom={step}>
        {/* Step 0: Student Information */}
        {step === 0 && (
          <motion.div key="step0" custom={1} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.25 }}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><UserPlus className="h-5 w-5" /> Student Information</CardTitle>
                <CardDescription>Enter the learner's personal details{academicYearName ? ` for ${academicYearName}` : ''}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Grade Level */}
                  <div className="space-y-1.5">
                    <Label>Grade Level <span className="text-destructive">*</span></Label>
                    <Select value={formData.level} onValueChange={(v) => { handleChange('level', v); if (!requiresStrand(v)) handleChange('strand', ''); if (isKindergartenLevel(v)) setHasLrn(false); }}>
                      <SelectTrigger className={errors.level ? 'border-destructive' : ''}><SelectValue placeholder="Select grade level" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Kindergarten">Kindergarten</SelectItem>
                        <SelectGroup><SelectLabel>Elementary</SelectLabel>
                          {['Grade 1','Grade 2','Grade 3','Grade 4','Grade 5','Grade 6'].map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                        </SelectGroup>
                        <SelectGroup><SelectLabel>Junior High School</SelectLabel>
                          {['Grade 7','Grade 8','Grade 9','Grade 10'].map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                        </SelectGroup>
                        <SelectGroup><SelectLabel>Senior High School</SelectLabel>
                          {['Grade 11','Grade 12'].map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                    {fieldError("level")}
                  </div>

                  {/* LRN Toggle */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label>Has LRN?</Label>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">{hasLrn ? 'Yes' : 'No'}</span>
                        <Switch checked={hasLrn} onCheckedChange={setHasLrn} />
                      </div>
                    </div>
                    {hasLrn && (
                      <>
                        <Input placeholder="12-digit LRN" value={formData.lrn} onChange={(e) => handleChange('lrn', e.target.value)} className={errors.lrn ? 'border-destructive' : ''} />
                        {fieldError("lrn")}
                      </>
                    )}
                  </div>

                  {/* Full Name */}
                  <div className="space-y-1.5 md:col-span-2">
                    <Label>Full Name <span className="text-destructive">*</span></Label>
                    <Input placeholder="Learner's full name (Last, First, Middle)" value={formData.student_name} onChange={(e) => handleChange('student_name', e.target.value)} className={errors.student_name ? 'border-destructive' : ''} />
                    {fieldError("student_name")}
                  </div>

                  {/* Birth Date */}
                  <div className="space-y-1.5">
                    <Label>Birth Date <span className="text-destructive">*</span></Label>
                    <Input type="date" value={formData.birth_date} onChange={(e) => handleChange('birth_date', e.target.value)} className={errors.birth_date ? 'border-destructive' : ''} />
                    {fieldError("birth_date")}
                  </div>

                  {/* Age */}
                  <div className="space-y-1.5">
                    <Label>Age</Label>
                    <Input value={calculatedAge !== null ? `${calculatedAge} years old` : ''} placeholder="Auto-calculated" disabled className="bg-muted/50" />
                  </div>

                  {/* Gender */}
                  <div className="space-y-1.5">
                    <Label>Gender <span className="text-destructive">*</span></Label>
                    <Select value={formData.gender} onValueChange={(v) => handleChange('gender', v)}>
                      <SelectTrigger className={errors.gender ? 'border-destructive' : ''}><SelectValue placeholder="Select gender" /></SelectTrigger>
                      <SelectContent>{GENDERS.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
                    </Select>
                    {fieldError("gender")}
                  </div>

                  {/* Religion */}
                  <div className="space-y-1.5">
                    <Label>Religion <span className="text-destructive">*</span></Label>
                    <Select value={formData.religion} onValueChange={(v) => { handleChange('religion', v); if (v !== 'Other') handleChange('religion_other', ''); }}>
                      <SelectTrigger className={errors.religion ? 'border-destructive' : ''}><SelectValue placeholder="Select religion" /></SelectTrigger>
                      <SelectContent>{RELIGIONS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                    </Select>
                    {formData.religion === 'Other' && (
                      <Input placeholder="Please specify religion" value={formData.religion_other} onChange={(e) => handleChange('religion_other', e.target.value)} className={errors.religion_other ? 'border-destructive mt-1.5' : 'mt-1.5'} />
                    )}
                    {fieldError("religion")}
                    {fieldError("religion_other")}
                  </div>

                  {/* SHS Strand */}
                  {needsStrand && (
                    <div className="space-y-1.5 md:col-span-2">
                      <Label>SHS Strand <span className="text-destructive">*</span></Label>
                      <Select value={formData.strand || undefined} onValueChange={(v) => handleChange('strand', v)}>
                        <SelectTrigger className={errors.strand ? 'border-destructive' : ''}><SelectValue placeholder="Select strand" /></SelectTrigger>
                        <SelectContent>
                          <SelectGroup><SelectLabel>Academic Track</SelectLabel>
                            {SHS_STRANDS.filter(s => ['ABM','STEM','HUMSS','GAS'].includes(s.value)).map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                          </SelectGroup>
                          <SelectGroup><SelectLabel>TVL Track</SelectLabel>
                            {SHS_STRANDS.filter(s => s.value.startsWith('TVL')).map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                          </SelectGroup>
                          <SelectGroup><SelectLabel>Arts & Sports</SelectLabel>
                            {SHS_STRANDS.filter(s => ['SPORTS','ARTS-DESIGN'].includes(s.value)).map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                      {fieldError("strand")}
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <Label>Mother Tongue</Label>
                    <Input placeholder="e.g. Cebuano" value={formData.mother_tongue} onChange={(e) => handleChange('mother_tongue', e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Dialects</Label>
                    <Input placeholder="e.g. English, Tagalog" value={formData.dialects} onChange={(e) => handleChange('dialects', e.target.value)} />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <Button onClick={goNext}> Next <ArrowRight className="h-4 w-4 ml-1" /></Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Step 1: Parent & Address */}
        {step === 1 && (
          <motion.div key="step1" custom={1} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.25 }}>
            <Card>
              <CardHeader>
                <CardTitle>Parent/Guardian & Address</CardTitle>
                <CardDescription>Contact information and current address</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Mother's Maiden Name <span className="text-destructive">*</span></Label>
                    <Input value={formData.mother_maiden_name} onChange={(e) => handleChange('mother_maiden_name', e.target.value)} className={errors.mother_maiden_name ? 'border-destructive' : ''} />
                    {fieldError("mother_maiden_name")}
                  </div>
                  <div className="space-y-1.5">
                    <Label>Mother's Contact <span className="text-destructive">*</span></Label>
                    <Input value={formData.mother_contact} onChange={(e) => handleChange('mother_contact', e.target.value)} className={errors.mother_contact ? 'border-destructive' : ''} />
                    {fieldError("mother_contact")}
                  </div>
                  <div className="space-y-1.5">
                    <Label>Father's Name</Label>
                    <Input value={formData.father_name} onChange={(e) => handleChange('father_name', e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Father's Contact</Label>
                    <Input value={formData.father_contact} onChange={(e) => handleChange('father_contact', e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" /> Student/Guardian Mobile Number</Label>
                    <Input type="tel" placeholder="+971 XX XXX XXXX or 09XX XXX XXXX" value={formData.mobile_number} onChange={(e) => handleChange('mobile_number', e.target.value)} />
                  </div>
                  <div className="space-y-1.5 md:col-span-2">
                    <Label>Parent Email</Label>
                    <Input type="email" placeholder="parent@example.com" value={formData.parent_email} onChange={(e) => handleChange('parent_email', e.target.value)} />
                  </div>
                  <div className="space-y-1.5 md:col-span-2">
                    <Label>Current Address <span className="text-destructive">*</span></Label>
                    <Input placeholder="Full current address" value={formData.current_address} onChange={(e) => handleChange('current_address', e.target.value)} className={errors.current_address ? 'border-destructive' : ''} />
                    {fieldError("current_address")}
                  </div>
                  <div className="space-y-1.5 md:col-span-2">
                    <Label>Previous School</Label>
                    <Input placeholder="Name of previous school attended" value={formData.previous_school} onChange={(e) => handleChange('previous_school', e.target.value)} />
                  </div>
                </div>

                <div className="flex justify-between pt-2">
                  <Button variant="outline" onClick={goBack}><ArrowLeft className="h-4 w-4 mr-1" /> Back</Button>
                  <Button onClick={goNext}>Next <ArrowRight className="h-4 w-4 ml-1" /></Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Step 2: Agreement (simplified) */}
        {step === 2 && (
          <motion.div key="step2" custom={1} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.25 }}>
            <Card>
              <CardHeader>
                <CardTitle>Terms and Conditions</CardTitle>
                <CardDescription>Please review and accept before proceeding</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <ScrollArea className="h-36 rounded-md border p-3 text-xs text-muted-foreground">
                    By submitting this registration form, you agree to abide by the rules and regulations of St. Francis Xavier Smart Academy Inc. The school reserves the right to verify all information provided and to deny admission based on incomplete or inaccurate data. Students are expected to follow the school's code of conduct, academic policies, and disciplinary guidelines. The school may update these terms as necessary, and continued enrollment constitutes acceptance of any changes. We are committed to protecting your personal information in accordance with the Data Privacy Act of 2012. All personal data collected will be used solely for enrollment processing, student records management, and communication purposes.
                  </ScrollArea>
                  <div className="flex items-center gap-2">
                    <Checkbox id="terms" checked={agreements.terms} onCheckedChange={(v) => { setAgreements(p => ({ ...p, terms: !!v })); if (errors.terms) setErrors(p => ({ ...p, terms: '' })); }} />
                    <label htmlFor="terms" className="text-sm cursor-pointer">I accept the Terms and Conditions <span className="text-destructive">*</span></label>
                  </div>
                  {fieldError("terms")}
                </div>

                {isMinor && (
                  <div className="space-y-2 bg-muted/50 rounded-lg p-4 border">
                    <h4 className="font-semibold text-sm">Parent/Guardian Consent</h4>
                    <p className="text-xs text-muted-foreground">As the registrant is a minor (under 18), a parent or legal guardian must provide consent.</p>
                    <div className="flex items-center gap-2">
                      <Checkbox id="consent" checked={agreements.consent} onCheckedChange={(v) => { setAgreements(p => ({ ...p, consent: !!v })); if (errors.consent) setErrors(p => ({ ...p, consent: '' })); }} />
                      <label htmlFor="consent" className="text-sm cursor-pointer">I am the parent/legal guardian and I consent to this registration <span className="text-destructive">*</span></label>
                    </div>
                    {fieldError("consent")}
                  </div>
                )}

                <div className="flex justify-between pt-2">
                  <Button variant="outline" onClick={goBack}><ArrowLeft className="h-4 w-4 mr-1" /> Back</Button>
                  <Button onClick={goNext}>Next: Review <ArrowRight className="h-4 w-4 ml-1" /></Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Step 3: Review & Submit */}
        {step === 3 && (
          <motion.div key="step3" custom={1} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.25 }}>
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-6 w-6 text-primary" />
                <div>
                  <h2 className="text-lg font-bold text-foreground">Review Your Information</h2>
                  <p className="text-sm text-muted-foreground">Please verify all details before submitting</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Student Details Card */}
                <Card className="shadow-sm">
                  <CardHeader className="pb-2 pt-4 px-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-semibold flex items-center gap-1.5"><UserPlus className="h-4 w-4 text-primary" /> Student Details</CardTitle>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setStep(0)}><Edit2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  </CardHeader>
                  <CardContent className="px-4 pb-4 pt-0 space-y-1 text-sm">
                    {reviewRow("Full Name", formData.student_name)}
                    {reviewRow("LRN", hasLrn ? formData.lrn : 'N/A')}
                    {reviewRow("Grade Level", formData.level)}
                    {formData.strand && reviewRow("Strand", formData.strand)}
                    {reviewRow("Birth Date", formData.birth_date)}
                    {reviewRow("Age", calculatedAge !== null ? `${calculatedAge} years old` : undefined)}
                    {reviewRow("Gender", formData.gender)}
                    {reviewRow("Religion", formData.religion === 'Other' ? formData.religion_other : formData.religion)}
                  </CardContent>
                </Card>

                {/* Language Card */}
                <Card className="shadow-sm">
                  <CardHeader className="pb-2 pt-4 px-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-semibold">Language</CardTitle>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setStep(0)}><Edit2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  </CardHeader>
                  <CardContent className="px-4 pb-4 pt-0 space-y-1 text-sm">
                    {reviewRow("Mother Tongue", formData.mother_tongue)}
                    {reviewRow("Dialects", formData.dialects)}
                  </CardContent>
                </Card>

                {/* Parent/Guardian Card */}
                <Card className="shadow-sm">
                  <CardHeader className="pb-2 pt-4 px-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-semibold flex items-center gap-1.5"><Phone className="h-4 w-4 text-primary" /> Parent/Guardian</CardTitle>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setStep(1)}><Edit2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  </CardHeader>
                  <CardContent className="px-4 pb-4 pt-0 space-y-1 text-sm">
                    {reviewRow("Mother's Name", formData.mother_maiden_name)}
                    {reviewRow("Mother's Contact", formData.mother_contact)}
                    {reviewRow("Father's Name", formData.father_name)}
                    {reviewRow("Father's Contact", formData.father_contact)}
                    {reviewRow("Mobile", formData.mobile_number)}
                    {reviewRow("Email", formData.parent_email)}
                  </CardContent>
                </Card>

                {/* Address & School Card */}
                <Card className="shadow-sm">
                  <CardHeader className="pb-2 pt-4 px-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-semibold flex items-center gap-1.5"><Building2 className="h-4 w-4 text-primary" /> Address & School</CardTitle>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setStep(1)}><Edit2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  </CardHeader>
                  <CardContent className="px-4 pb-4 pt-0 space-y-1 text-sm">
                    {reviewRow("Current Address", formData.current_address)}
                    {reviewRow("Previous School", formData.previous_school)}
                  </CardContent>
                </Card>

                {/* Agreement Card - full width */}
                <Card className="shadow-sm md:col-span-2">
                  <CardHeader className="pb-2 pt-4 px-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-semibold flex items-center gap-1.5"><CheckCircle className="h-4 w-4 text-primary" /> Agreement</CardTitle>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setStep(2)}><Edit2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  </CardHeader>
                  <CardContent className="px-4 pb-4 pt-0">
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      <span className="text-foreground">Terms and Conditions accepted</span>
                    </div>
                    {isMinor && agreements.consent && (
                      <div className="flex items-center gap-2 text-sm mt-1.5">
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                        <span className="text-foreground">Parent/Guardian consent provided</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              <div className="flex justify-between pt-2">
                <Button variant="outline" onClick={goBack}><ArrowLeft className="h-4 w-4 mr-1" /> Back</Button>
                <Button onClick={handleSubmit} disabled={isSubmitting} size="lg">
                  {isSubmitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Submitting...</> : 'Submit Registration'}
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
