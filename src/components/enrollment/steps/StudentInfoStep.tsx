import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, Info } from "lucide-react";
import { useMemo } from "react";
import { differenceInYears } from "date-fns";
import { GRADE_LEVELS, SHS_STRANDS, GENDERS, requiresStrand, isKindergartenLevel } from "../constants";
import { useAcademicYear } from "@/contexts/AcademicYearContext";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface StudentInfoStepProps {
    formData: any;
    errors: any;
    touched: any;
    handleChange: (field: string, value: string) => void;
    handleBlur: (field: string) => void;
}

export const StudentInfoStep = ({ formData, errors, touched, handleChange, handleBlur }: StudentInfoStepProps) => {
    const { selectedYear, academicYears } = useAcademicYear();
    
    const isKinderLevel = useMemo(() => {
        return isKindergartenLevel(formData.level);
    }, [formData.level]);

    const needsStrand = useMemo(() => {
        return requiresStrand(formData.level);
    }, [formData.level]);

    const calculatedAge = useMemo(() => {
        if (!formData.birth_date) return null;
        const birthDate = new Date(formData.birth_date);
        const age = differenceInYears(new Date(), birthDate);
        return age >= 0 ? age : null;
    }, [formData.birth_date]);

    const FieldError = ({ error }: { error?: string }) => {
        if (!error) return null;
        return (
            <div className="flex items-center gap-1 text-destructive text-sm mt-1">
                <AlertCircle className="h-3 w-3" />
                <span>{error}</span>
            </div>
        );
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            {/* Academic Year Info Alert */}
            {selectedYear && (
                <Alert className="bg-blue-50 border-blue-200">
                    <Info className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-blue-800">
                        <strong>Academic Year:</strong> {selectedYear.name} - Student will be enrolled in this academic year
                    </AlertDescription>
                </Alert>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <Label className="text-stat-purple">
                        Full Name <span className="text-destructive">*</span>
                    </Label>
                    <Input
                        placeholder="Enter learner's full name"
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
                    <Select value={formData.level} onValueChange={(v) => {
                        handleChange('level', v);
                        // Clear strand if switching away from Grade 11/12
                        if (!requiresStrand(v) && formData.strand) {
                            handleChange('strand', '');
                        }
                    }}>
                        <SelectTrigger className={`bg-secondary/50 ${errors.level && touched.level ? 'border-destructive' : ''}`}>
                            <SelectValue placeholder="Select grade level" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Kindergarten">Kindergarten</SelectItem>
                            <SelectItem value="" disabled className="font-semibold text-primary">Elementary (Grades 1-6)</SelectItem>
                            {['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6'].map(level => (
                                <SelectItem key={level} value={level} className="pl-6">{level}</SelectItem>
                            ))}
                            <SelectItem value="" disabled className="font-semibold text-primary">Junior High School (Grades 7-10)</SelectItem>
                            {['Grade 7', 'Grade 8', 'Grade 9', 'Grade 10'].map(level => (
                                <SelectItem key={level} value={level} className="pl-6">{level}</SelectItem>
                            ))}
                            <SelectItem value="" disabled className="font-semibold text-primary">Senior High School (Grades 11-12)</SelectItem>
                            {['Grade 11', 'Grade 12'].map(level => (
                                <SelectItem key={level} value={level} className="pl-6">{level}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {touched.level && <FieldError error={errors.level} />}
                    {needsStrand && (
                        <p className="text-xs text-blue-600 flex items-center gap-1 mt-1">
                            <Info className="h-3 w-3" />
                            <span>Senior High School requires strand selection below</span>
                        </p>
                    )}
                </div>
                
                {/* SHS Strand Selection (only for Grade 11 & 12) */}
                {needsStrand && (
                    <div className="space-y-2">
                        <Label className="text-stat-purple">
                            SHS Strand <span className="text-destructive">*</span>
                        </Label>
                        <Select value={formData.strand || ''} onValueChange={(v) => handleChange('strand', v)}>
                            <SelectTrigger className={`bg-secondary/50 ${errors.strand && touched.strand ? 'border-destructive' : ''}`}>
                                <SelectValue placeholder="Select strand" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="" disabled className="font-semibold">Academic Track</SelectItem>
                                {SHS_STRANDS.filter(s => ['ABM', 'STEM', 'HUMSS', 'GAS'].includes(s.value)).map(strand => (
                                    <SelectItem key={strand.value} value={strand.value} className="pl-4">{strand.label}</SelectItem>
                                ))}
                                <SelectItem value="" disabled className="font-semibold">Technical-Vocational-Livelihood (TVL)</SelectItem>
                                {SHS_STRANDS.filter(s => s.value.startsWith('TVL')).map(strand => (
                                    <SelectItem key={strand.value} value={strand.value} className="pl-4">{strand.label}</SelectItem>
                                ))}
                                <SelectItem value="" disabled className="font-semibold">Arts & Sports Track</SelectItem>
                                {SHS_STRANDS.filter(s => ['SPORTS', 'ARTS-DESIGN'].includes(s.value)).map(strand => (
                                    <SelectItem key={strand.value} value={strand.value} className="pl-4">{strand.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {touched.strand && <FieldError error={errors.strand} />}
                    </div>
                )}
                
                {!needsStrand && <div></div>} {/* Spacer to maintain grid */}
                
                <div className="space-y-2">
                    <Label className="text-stat-purple">
                        Academic Year <span className="text-destructive">*</span>
                    </Label>
                    <Input
                        value={selectedYear?.name || 'No academic year selected'}
                        disabled
                        className="bg-secondary/30 text-muted-foreground cursor-not-allowed"
                    />
                    <p className="text-xs text-muted-foreground">
                        Synced with current academic year selection
                    </p>
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
                    <Label className="text-stat-purple">Age</Label>
                    <Input
                        value={calculatedAge !== null ? `${calculatedAge} years old` : ''}
                        placeholder="Auto-calculated from birth date"
                        disabled
                        className="bg-secondary/30 text-muted-foreground"
                    />
                </div>
                <div className="space-y-2">
                    <Label className="text-stat-purple">
                        Gender <span className="text-destructive">*</span>
                    </Label>
                    <Select value={formData.gender} onValueChange={(v) => handleChange('gender', v)}>
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
                <div className="space-y-2">
                    <Label className="text-stat-purple">Mother Tongue</Label>
                    <Input
                        placeholder="e.g. Cebuano"
                        value={formData.mother_tongue}
                        onChange={(e) => handleChange('mother_tongue', e.target.value)}
                        className="bg-secondary/50"
                    />
                </div>
                <div className="space-y-2">
                    <Label className="text-stat-purple">Dialects</Label>
                    <Input
                        placeholder="e.g. English, Tagalog"
                        value={formData.dialects}
                        onChange={(e) => handleChange('dialects', e.target.value)}
                        className="bg-secondary/50"
                    />
                </div>
            </div>
        </div>
    );
};
