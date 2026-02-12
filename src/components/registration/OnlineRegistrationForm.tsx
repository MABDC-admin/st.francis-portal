import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Loader2, UserPlus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectGroup, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { GENDERS, SHS_STRANDS, requiresStrand, isKindergartenLevel } from '@/components/enrollment/constants';
import { useAcademicYear } from '@/contexts/AcademicYearContext';
import { useSchool } from '@/contexts/SchoolContext';
import { getSchoolId } from '@/utils/schoolIdMap';
import { differenceInYears } from 'date-fns';

export const OnlineRegistrationForm = () => {
  const { selectedYearId, selectedYear } = useAcademicYear();
  const { selectedSchool } = useSchool();
  const schoolId = getSchoolId(selectedSchool);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [hasLrn, setHasLrn] = useState(true);
  const [formData, setFormData] = useState({
    student_name: '', lrn: '', level: '', strand: '',
    birth_date: '', gender: '',
    mother_maiden_name: '', mother_contact: '',
    father_name: '', father_contact: '',
    phil_address: '', uae_address: '',
    previous_school: '', parent_email: '',
    mother_tongue: '', dialects: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const needsStrand = useMemo(() => requiresStrand(formData.level), [formData.level]);
  const calculatedAge = useMemo(() => {
    if (!formData.birth_date) return null;
    const age = differenceInYears(new Date(), new Date(formData.birth_date));
    return age >= 0 ? age : null;
  }, [formData.birth_date]);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!formData.student_name.trim()) errs.student_name = 'Required';
    if (!formData.level) errs.level = 'Required';
    if (hasLrn && !isKindergartenLevel(formData.level) && !formData.lrn.trim()) errs.lrn = 'Required';
    if (hasLrn && formData.lrn && !/^\d{12}$/.test(formData.lrn)) errs.lrn = 'Must be 12 digits';
    if (needsStrand && !formData.strand) errs.strand = 'Required for SHS';
    if (!formData.birth_date) errs.birth_date = 'Required';
    if (!formData.gender) errs.gender = 'Required';
    if (!formData.mother_maiden_name.trim()) errs.mother_maiden_name = 'Required';
    if (!formData.mother_contact.trim()) errs.mother_contact = 'Required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) { toast.error('Please fix the errors before submitting'); return; }
    if (!schoolId || !selectedYearId) { toast.error('School or academic year not available'); return; }

    setIsSubmitting(true);
    try {
      const { error } = await (supabase.from('online_registrations') as any).insert([{
        student_name: formData.student_name.trim(),
        lrn: hasLrn && formData.lrn.trim() ? formData.lrn.trim() : null,
        level: formData.level,
        strand: formData.strand || null,
        birth_date: formData.birth_date || null,
        gender: formData.gender || null,
        mother_maiden_name: formData.mother_maiden_name.trim() || null,
        mother_contact: formData.mother_contact.trim() || null,
        father_name: formData.father_name.trim() || null,
        father_contact: formData.father_contact.trim() || null,
        phil_address: formData.phil_address.trim() || null,
        uae_address: formData.uae_address.trim() || null,
        previous_school: formData.previous_school.trim() || null,
        parent_email: formData.parent_email.trim() || null,
        mother_tongue: formData.mother_tongue.trim() || null,
        dialects: formData.dialects.trim() || null,
        school_id: schoolId,
        academic_year_id: selectedYearId,
        status: 'pending',
      }]);
      if (error) throw error;
      setIsSuccess(true);
      toast.success('Registration submitted successfully!');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to submit registration');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="flex items-center justify-center py-16">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center space-y-4">
          <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto" />
          <h2 className="text-2xl font-bold text-foreground">Registration Submitted!</h2>
          <p className="text-muted-foreground max-w-md">Your registration has been received and is pending review. You will be notified once it has been processed.</p>
          <Button onClick={() => { setIsSuccess(false); setFormData({ student_name: '', lrn: '', level: '', strand: '', birth_date: '', gender: '', mother_maiden_name: '', mother_contact: '', father_name: '', father_contact: '', phil_address: '', uae_address: '', previous_school: '', parent_email: '', mother_tongue: '', dialects: '' }); }}>
            Submit Another Registration
          </Button>
        </motion.div>
      </div>
    );
  }

  const FieldError = ({ field }: { field: string }) => errors[field] ? <p className="text-destructive text-sm mt-1">{errors[field]}</p> : null;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl lg:text-3xl font-bold text-foreground flex items-center gap-2">
          <UserPlus className="h-7 w-7 text-stat-purple" /> Online Registration
        </h1>
        <p className="text-muted-foreground mt-1">
          Submit a registration application for the {selectedYear?.name || 'current'} academic year
        </p>
      </motion.div>

      <Card>
        <CardHeader>
          <CardTitle>Student Information</CardTitle>
          <CardDescription>Fill in the learner's details below</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Grade Level */}
            <div className="space-y-2">
              <Label>Grade Level <span className="text-destructive">*</span></Label>
              <Select value={formData.level} onValueChange={(v) => {
                handleChange('level', v);
                if (!requiresStrand(v)) handleChange('strand', '');
                if (isKindergartenLevel(v)) setHasLrn(false);
              }}>
                <SelectTrigger className={errors.level ? 'border-destructive' : ''}><SelectValue placeholder="Select grade level" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Kindergarten">Kindergarten</SelectItem>
                  <SelectGroup><SelectLabel>Elementary (Grades 1-6)</SelectLabel>
                    {['Grade 1','Grade 2','Grade 3','Grade 4','Grade 5','Grade 6'].map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                  </SelectGroup>
                  <SelectGroup><SelectLabel>Junior High School (Grades 7-10)</SelectLabel>
                    {['Grade 7','Grade 8','Grade 9','Grade 10'].map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                  </SelectGroup>
                  <SelectGroup><SelectLabel>Senior High School (Grades 11-12)</SelectLabel>
                    {['Grade 11','Grade 12'].map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                  </SelectGroup>
                </SelectContent>
              </Select>
              <FieldError field="level" />
            </div>

            {/* LRN Toggle + Input */}
            <div className="space-y-2">
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
                  <FieldError field="lrn" />
                </>
              )}
            </div>

            {/* Full Name */}
            <div className="space-y-2">
              <Label>Full Name <span className="text-destructive">*</span></Label>
              <Input placeholder="Learner's full name" value={formData.student_name} onChange={(e) => handleChange('student_name', e.target.value)} className={errors.student_name ? 'border-destructive' : ''} />
              <FieldError field="student_name" />
            </div>

            {/* Birth Date */}
            <div className="space-y-2">
              <Label>Birth Date <span className="text-destructive">*</span></Label>
              <Input type="date" value={formData.birth_date} onChange={(e) => handleChange('birth_date', e.target.value)} className={errors.birth_date ? 'border-destructive' : ''} />
              <FieldError field="birth_date" />
            </div>

            {/* Age */}
            <div className="space-y-2">
              <Label>Age</Label>
              <Input value={calculatedAge !== null ? `${calculatedAge} years old` : ''} placeholder="Auto-calculated" disabled className="bg-secondary/30" />
            </div>

            {/* Gender */}
            <div className="space-y-2">
              <Label>Gender <span className="text-destructive">*</span></Label>
              <Select value={formData.gender} onValueChange={(v) => handleChange('gender', v)}>
                <SelectTrigger className={errors.gender ? 'border-destructive' : ''}><SelectValue placeholder="Select gender" /></SelectTrigger>
                <SelectContent>{GENDERS.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
              </Select>
              <FieldError field="gender" />
            </div>

            {/* SHS Strand */}
            {needsStrand && (
              <div className="space-y-2">
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
                <FieldError field="strand" />
              </div>
            )}

            <div className="space-y-2">
              <Label>Mother Tongue</Label>
              <Input placeholder="e.g. Cebuano" value={formData.mother_tongue} onChange={(e) => handleChange('mother_tongue', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Dialects</Label>
              <Input placeholder="e.g. English, Tagalog" value={formData.dialects} onChange={(e) => handleChange('dialects', e.target.value)} />
            </div>
          </div>

          {/* Parent Info */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Parent/Guardian Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Mother's Maiden Name <span className="text-destructive">*</span></Label>
                <Input value={formData.mother_maiden_name} onChange={(e) => handleChange('mother_maiden_name', e.target.value)} className={errors.mother_maiden_name ? 'border-destructive' : ''} />
                <FieldError field="mother_maiden_name" />
              </div>
              <div className="space-y-2">
                <Label>Mother's Contact <span className="text-destructive">*</span></Label>
                <Input value={formData.mother_contact} onChange={(e) => handleChange('mother_contact', e.target.value)} className={errors.mother_contact ? 'border-destructive' : ''} />
                <FieldError field="mother_contact" />
              </div>
              <div className="space-y-2">
                <Label>Father's Name</Label>
                <Input value={formData.father_name} onChange={(e) => handleChange('father_name', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Father's Contact</Label>
                <Input value={formData.father_contact} onChange={(e) => handleChange('father_contact', e.target.value)} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Parent Email</Label>
                <Input type="email" placeholder="parent@example.com" value={formData.parent_email} onChange={(e) => handleChange('parent_email', e.target.value)} />
              </div>
            </div>
          </div>

          {/* Address Info */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Address Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Philippines Address</Label>
                <Input value={formData.phil_address} onChange={(e) => handleChange('phil_address', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>UAE Address</Label>
                <Input value={formData.uae_address} onChange={(e) => handleChange('uae_address', e.target.value)} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Previous School</Label>
                <Input value={formData.previous_school} onChange={(e) => handleChange('previous_school', e.target.value)} />
              </div>
            </div>
          </div>

          <Button onClick={handleSubmit} disabled={isSubmitting} className="w-full bg-stat-purple hover:bg-stat-purple/90 text-white">
            {isSubmitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Submitting...</> : 'Submit Registration'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
