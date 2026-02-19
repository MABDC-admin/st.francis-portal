import { useState, useMemo, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Loader2, UserPlus, ArrowRight, ArrowLeft, Building2, Wand2, Phone, Edit2, CheckCircle, MapPin, CalendarDays, Sun, Sunset } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
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
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { GENDERS, SHS_STRANDS, requiresStrand, isKindergartenLevel } from '@/components/enrollment/constants';
import { differenceInYears, format, addDays, isWeekend } from 'date-fns';
import { cn } from '@/lib/utils';
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from '@/components/ui/carousel';

const RELIGIONS = [
  'Roman Catholic', 'Islam', 'Iglesia ni Cristo', 'Protestant/Evangelical',
  'Seventh-Day Adventist', 'Aglipayan', 'Buddhism', 'Hinduism', 'Other',
];

const STEP_LABELS = ['Student Information', 'Parent & Address', 'Agreement', 'School Visit', 'Review & Submit'];
const SLOT_CAPACITY = 5;

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

  const [formData, setFormData] = useState({
    student_name: '', lrn: '', level: '', strand: '',
    birth_date: '', gender: '', religion: '', religion_other: '',
    mother_tongue: '', dialects: '',
    mother_maiden_name: '', mother_contact: '',
    father_name: '', father_contact: '',
    parent_email: '', current_address: '',
    previous_school: '', mobile_number: '',
  });

  const [agreements, setAgreements] = useState({ terms: false, consent: false });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Visit-related state
  const [wantsVisit, setWantsVisit] = useState(false);
  const [visitDate, setVisitDate] = useState<Date | undefined>();
  const [visitSlot, setVisitSlot] = useState<'morning' | 'afternoon' | ''>('');
  const [visitorName, setVisitorName] = useState('');

  // School info & visit capacity
  const [schoolInfo, setSchoolInfo] = useState<any>(null);
  const [existingVisits, setExistingVisits] = useState<{ visit_date: string; visit_slot: string }[]>([]);

  // Fetch school info and existing visits
  useEffect(() => {
    const fetchData = async () => {
      const [infoRes, visitsRes] = await Promise.all([
        supabase.from('school_info').select('*').eq('school_id', schoolId).maybeSingle(),
        supabase.from('school_visits').select('visit_date, visit_slot')
          .eq('school_id', schoolId).eq('status', 'scheduled')
          .gte('visit_date', format(new Date(), 'yyyy-MM-dd')),
      ]);
      if (infoRes.data) setSchoolInfo(infoRes.data);
      if (visitsRes.data) setExistingVisits(visitsRes.data);
    };
    fetchData();
  }, [schoolId]);

  // Pre-fill visitor name from parent info
  useEffect(() => {
    if (wantsVisit && !visitorName) {
      setVisitorName(formData.mother_maiden_name || formData.father_name || '');
    }
  }, [wantsVisit]);

  const needsStrand = useMemo(() => requiresStrand(formData.level), [formData.level]);
  const calculatedAge = useMemo(() => {
    if (!formData.birth_date) return null;
    const age = differenceInYears(new Date(), new Date(formData.birth_date));
    return age >= 0 ? age : null;
  }, [formData.birth_date]);
  const isMinor = calculatedAge !== null && calculatedAge < 18;

  const getSlotCount = useCallback((date: Date, slot: string) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return existingVisits.filter(v => v.visit_date === dateStr && v.visit_slot === slot).length;
  }, [existingVisits]);

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
    } else if (s === 3) {
      if (wantsVisit) {
        if (!visitDate) errs.visitDate = 'Please select a visit date';
        if (!visitSlot) errs.visitSlot = 'Please select a time slot';
        if (!visitorName.trim()) errs.visitorName = 'Visitor name is required';
        if (visitDate && visitSlot) {
          const count = getSlotCount(visitDate, visitSlot);
          if (count >= SLOT_CAPACITY) errs.visitSlot = 'This slot is fully booked';
        }
      }
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

      // Generate ID client-side so we can link the visit without needing SELECT permission
      const registrationId = crypto.randomUUID();

      // 1. Insert registration with pre-generated ID
      const { error: regError } = await (supabase.from('online_registrations') as any).insert([{
        id: registrationId,
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
      if (regError) throw regError;

      // 2. If visit was requested, insert visit linked to registration
      if (wantsVisit && visitDate && visitSlot) {
        const { error: visitError } = await supabase.from('school_visits').insert([{
          school_id: schoolId,
          registration_id: registrationId,
          visitor_name: visitorName.trim(),
          visit_date: format(visitDate, 'yyyy-MM-dd'),
          visit_slot: visitSlot,
          status: 'scheduled',
          visitor_level: formData.level || null,
          visitor_birth_date: formData.birth_date || null,
          visitor_address: formData.current_address?.trim() || null,
          visitor_student_name: formData.student_name?.trim() || null,
        }] as any);
        if (visitError) {
          console.warn('Visit scheduling failed (non-critical):', visitError);
          toast.warning('Registration saved but visit scheduling failed. Please contact the school.');
        }
      }

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
    setStep(0);
    setFormData({ student_name: '', lrn: '', level: '', strand: '', birth_date: '', gender: '', religion: '', religion_other: '', mother_tongue: '', dialects: '', mother_maiden_name: '', mother_contact: '', father_name: '', father_contact: '', parent_email: '', current_address: '', previous_school: '', mobile_number: '' });
    setAgreements({ terms: false, consent: false });
    setHasLrn(true);
    setWantsVisit(false);
    setVisitDate(undefined);
    setVisitSlot('');
    setVisitorName('');
  };

  if (isSuccess) {
    return (
      <div className="flex items-center justify-center py-16">
        <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 15 }} className="text-center space-y-6">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: 'spring', stiffness: 300 }}>
            <CheckCircle2 className="h-24 w-24 text-green-500 mx-auto" />
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <h2 className="text-3xl font-bold text-foreground">Registration Submitted!</h2>
            <p className="text-muted-foreground mt-3 max-w-md mx-auto">
              Your registration has been received and is pending review by the school registrar.
              {wantsVisit && visitDate && ` Your school visit is scheduled for ${format(visitDate, 'MMMM d, yyyy')} (${visitSlot === 'morning' ? 'Morning' : 'Afternoon'}).`}
            </p>
          </motion.div>
        </motion.div>
      </div>
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

  const photos: string[] = schoolInfo?.facility_photos || [];
  const today = new Date();

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Autofill & Progress */}
      <div className="flex items-center justify-between">
        <Button
          type="button" variant="outline" size="sm" className="gap-1.5 text-xs"
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
              student_name: randomPick(testNames), lrn, level: randomPick(testLevels), strand: '',
              birth_date: `${year}-${month}-${day}`, gender: randomPick(testGenders),
              religion: randomPick(testReligions), religion_other: '',
              mother_tongue: 'Filipino', dialects: 'Tagalog, English',
              mother_maiden_name: `${randomPick(['Fernandez', 'Lopez', 'Aquino', 'Bautista'])}, ${randomPick(['Maria', 'Ana', 'Rosa', 'Carmen'])}`,
              mother_contact: `09${Math.floor(100000000 + Math.random() * 900000000)}`,
              father_name: `${randomPick(['Dela Cruz', 'Santos', 'Reyes', 'Garcia'])}, ${randomPick(['Pedro', 'Jose', 'Miguel', 'Carlos'])}`,
              father_contact: `09${Math.floor(100000000 + Math.random() * 900000000)}`,
              parent_email: `parent.test${Math.floor(Math.random() * 999)}@example.com`,
              current_address: `${Math.floor(Math.random() * 999) + 1} ${randomPick(['Rizal', 'Mabini', 'Bonifacio', 'Luna'])} St., ${randomPick(['Al Nahda', 'Deira', 'Bur Dubai', 'Sharjah'])}, UAE`,
              previous_school: randomPick(['Manila Elementary School', 'Quezon City National HS', 'Cebu International School', 'Davao Central Academy']),
              mobile_number: phone,
            });
            setHasLrn(true); setErrors({});
            toast.success('Test data filled!');
          }}
        >
          <Wand2 className="h-3.5 w-3.5" /> Fill Test Data
        </Button>
      </div>

      {/* Progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs font-medium gap-1">
          {STEP_LABELS.map((label, i) => (
            <span key={i} className={cn("text-center flex-1", i <= step ? 'text-primary' : 'text-muted-foreground')}>
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
                  <div className="space-y-1.5 md:col-span-2">
                    <Label>Full Name <span className="text-destructive">*</span></Label>
                    <Input placeholder="Learner's full name (Last, First, Middle)" value={formData.student_name} onChange={(e) => handleChange('student_name', e.target.value)} className={errors.student_name ? 'border-destructive' : ''} />
                    {fieldError("student_name")}
                  </div>
                  <div className="space-y-1.5">
                    <Label>Birth Date <span className="text-destructive">*</span></Label>
                    <Input type="date" value={formData.birth_date} onChange={(e) => handleChange('birth_date', e.target.value)} className={errors.birth_date ? 'border-destructive' : ''} />
                    {fieldError("birth_date")}
                  </div>
                  <div className="space-y-1.5">
                    <Label>Age</Label>
                    <Input value={calculatedAge !== null ? `${calculatedAge} years old` : ''} placeholder="Auto-calculated" disabled className="bg-muted/50" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Gender <span className="text-destructive">*</span></Label>
                    <Select value={formData.gender} onValueChange={(v) => handleChange('gender', v)}>
                      <SelectTrigger className={errors.gender ? 'border-destructive' : ''}><SelectValue placeholder="Select gender" /></SelectTrigger>
                      <SelectContent>{GENDERS.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
                    </Select>
                    {fieldError("gender")}
                  </div>
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

        {/* Step 2: Agreement */}
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
                  <Button onClick={goNext}>Next: School Visit <ArrowRight className="h-4 w-4 ml-1" /></Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Step 3: School Visit */}
        {step === 3 && (
          <motion.div key="step3" custom={1} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.25 }}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Building2 className="h-5 w-5" /> School Visit</CardTitle>
                <CardDescription>Would you like to visit the school before enrollment?</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* Toggle */}
                <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
                  <div>
                    <p className="font-medium text-sm">Schedule a school visit</p>
                    <p className="text-xs text-muted-foreground">Tour our facilities and meet the registrar</p>
                  </div>
                  <Switch checked={wantsVisit} onCheckedChange={setWantsVisit} />
                </div>

                {wantsVisit ? (
                  <div className="space-y-5">
                    {/* Photo Gallery */}
                    {photos.length > 0 && (
                      <div>
                        <Label className="text-sm font-semibold mb-2 block">School Gallery</Label>
                        <Carousel className="w-full max-w-lg mx-auto">
                          <CarouselContent>
                            {photos.map((url: string, i: number) => (
                              <CarouselItem key={i}>
                                <div className="aspect-video rounded-lg overflow-hidden">
                                  <img src={url} alt={`School photo ${i + 1}`} className="w-full h-full object-cover" />
                                </div>
                              </CarouselItem>
                            ))}
                          </CarouselContent>
                          {photos.length > 1 && (
                            <>
                              <CarouselPrevious className="-left-4" />
                              <CarouselNext className="-right-4" />
                            </>
                          )}
                        </Carousel>
                      </div>
                    )}

                    {/* Map */}
                    {schoolInfo?.map_embed_url && (
                      <div>
                        <Label className="text-sm font-semibold mb-2 flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> Location</Label>
                        <div className="rounded-lg overflow-hidden border aspect-video">
                          <iframe
                            src={schoolInfo.map_embed_url}
                            width="100%" height="100%" style={{ border: 0 }}
                            allowFullScreen loading="lazy"
                            referrerPolicy="no-referrer-when-downgrade"
                            title="School Location"
                          />
                        </div>
                      </div>
                    )}

                    {/* Date Picker */}
                    <div className="space-y-2">
                      <Label className="flex items-center gap-1.5"><CalendarDays className="h-3.5 w-3.5" /> Select Visit Date <span className="text-destructive">*</span></Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !visitDate && "text-muted-foreground", errors.visitDate && "border-destructive")}>
                            <CalendarDays className="mr-2 h-4 w-4" />
                            {visitDate ? format(visitDate, 'EEEE, MMMM d, yyyy') : 'Pick a date'}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={visitDate}
                            onSelect={(d) => { setVisitDate(d); if (errors.visitDate) setErrors(p => ({ ...p, visitDate: '' })); }}
                            disabled={(date) => date < today || date > addDays(today, 30) || isWeekend(date)}
                            initialFocus
                            className={cn("p-3 pointer-events-auto")}
                          />
                        </PopoverContent>
                      </Popover>
                      {fieldError("visitDate")}
                    </div>

                    {/* Time Slot */}
                    <div className="space-y-2">
                      <Label>Select Time Slot <span className="text-destructive">*</span></Label>
                      <div className="grid grid-cols-2 gap-3">
                        {(['morning', 'afternoon'] as const).map(slot => {
                          const count = visitDate ? getSlotCount(visitDate, slot) : 0;
                          const available = SLOT_CAPACITY - count;
                          const isFull = available <= 0;
                          const isSelected = visitSlot === slot;
                          return (
                            <button
                              key={slot}
                              type="button"
                              disabled={isFull}
                              onClick={() => { setVisitSlot(slot); if (errors.visitSlot) setErrors(p => ({ ...p, visitSlot: '' })); }}
                              className={cn(
                                "flex flex-col items-center gap-1.5 p-4 rounded-lg border-2 transition-all",
                                isSelected ? "border-primary bg-primary/5 shadow-sm" : "border-border hover:border-primary/40",
                                isFull && "opacity-50 cursor-not-allowed",
                                errors.visitSlot && !isSelected && "border-destructive/30"
                              )}
                            >
                              {slot === 'morning' ? <Sun className="h-6 w-6 text-amber-500" /> : <Sunset className="h-6 w-6 text-orange-500" />}
                              <span className="font-medium text-sm capitalize">{slot}</span>
                              <span className="text-xs text-muted-foreground">
                                {slot === 'morning' ? '8:00 AM – 12:00 PM' : '1:00 PM – 5:00 PM'}
                              </span>
                              <span className={cn("text-xs font-medium", isFull ? "text-destructive" : "text-green-600")}>
                                {isFull ? 'Fully booked' : `${available} slot${available !== 1 ? 's' : ''} available`}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                      {fieldError("visitSlot")}
                    </div>

                    {/* Visitor Name */}
                    <div className="space-y-1.5">
                      <Label>Visitor Name <span className="text-destructive">*</span></Label>
                      <Input
                        placeholder="Name of person visiting"
                        value={visitorName}
                        onChange={(e) => { setVisitorName(e.target.value); if (errors.visitorName) setErrors(p => ({ ...p, visitorName: '' })); }}
                        className={errors.visitorName ? 'border-destructive' : ''}
                      />
                      {fieldError("visitorName")}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    <Building2 className="h-10 w-10 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">No problem! You can always visit the school later.</p>
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

        {/* Step 4: Review & Submit */}
        {step === 4 && (
          <motion.div key="step4" custom={1} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.25 }}>
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-6 w-6 text-primary" />
                <div>
                  <h2 className="text-lg font-bold text-foreground">Review Your Information</h2>
                  <p className="text-sm text-muted-foreground">Please verify all details before submitting</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                {/* School Visit Card */}
                <Card className="shadow-sm">
                  <CardHeader className="pb-2 pt-4 px-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-semibold flex items-center gap-1.5"><CalendarDays className="h-4 w-4 text-primary" /> School Visit</CardTitle>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setStep(3)}><Edit2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  </CardHeader>
                  <CardContent className="px-4 pb-4 pt-0 space-y-1 text-sm">
                    {wantsVisit ? (
                      <>
                        {reviewRow("Visit Date", visitDate ? format(visitDate, 'MMMM d, yyyy') : undefined)}
                        {reviewRow("Time Slot", visitSlot === 'morning' ? '🌅 Morning (8AM–12PM)' : '🌇 Afternoon (1PM–5PM)')}
                        {reviewRow("Visitor Name", visitorName)}
                      </>
                    ) : (
                      <p className="text-sm text-muted-foreground py-1">No visit scheduled</p>
                    )}
                  </CardContent>
                </Card>

                {/* Agreement Card */}
                <Card className="shadow-sm">
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
