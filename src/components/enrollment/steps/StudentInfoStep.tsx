import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectGroup, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { AlertCircle, Info } from "lucide-react";
import { useMemo } from "react";
import { differenceInYears } from "date-fns";
import { SHS_STRANDS, GENDERS, requiresStrand, isKindergartenLevel } from "../constants";
import { useAcademicYear } from "@/contexts/AcademicYearContext";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface StudentInfoStepProps {
    formData: any;
    errors: any;
    touched: any;
    handleChange: (field: string, value: string) => void;
    handleBlur: (field: string) => void;
    hasLrn?: boolean;
    onToggleLrn?: (value: boolean) => void;
}

export const StudentInfoStep = ({ formData, errors, touched, handleChange, handleBlur, hasLrn = true, onToggleLrn }: StudentInfoStepProps) => {
    const { selectedYear } = useAcademicYear();
    
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
                {/* Grade Level - FIRST FIELD */}
                <div className="space-y-2">
                    <Label className="text-stat-purple">
                        Grade Level <span className="text-destructive">*</span>
                    </Label>
                    <Select value={formData.level} onValueChange={(v) => {
                        handleChange('level', v);
                        if (!requiresStrand(v) && formData.strand) {
                            handleChange('strand', '');
                        }
                        // Auto-set LRN toggle for Kindergarten
                        if (isKindergartenLevel(v) && onToggleLrn) {
                            onToggleLrn(false);
                        }
                    }}>
                        <SelectTrigger className={`bg-secondary/50 ${errors.level && touched.level ? 'border-destructive' : ''}`}>
                            <SelectValue placeholder="Select grade level" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Kindergarten">Kindergarten</SelectItem>
                            <SelectGroup>
                                <SelectLabel className="font-semibold text-primary">Elementary (Grades 1-6)</SelectLabel>
                                {['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6'].map(level => (
                                    <SelectItem key={level} value={level}>{level}</SelectItem>
                                ))}
                            </SelectGroup>
                            <SelectGroup>
                                <SelectLabel className="font-semibold text-primary">Junior High School (Grades 7-10)</SelectLabel>
                                {['Grade 7', 'Grade 8', 'Grade 9', 'Grade 10'].map(level => (
                                    <SelectItem key={level} value={level}>{level}</SelectItem>
                                ))}
                            </SelectGroup>
                            <SelectGroup>
                                <SelectLabel className="font-semibold text-primary">Senior High School (Grades 11-12)</SelectLabel>
                                {['Grade 11', 'Grade 12'].map(level => (
                                    <SelectItem key={level} value={level}>{level}</SelectItem>
                                ))}
                            </SelectGroup>
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

                {/* LRN Toggle + LRN Field */}
                <div className="space-y-2">
                    {onToggleLrn && (
                        <div className="flex items-center justify-between mb-2">
                            <Label className="text-stat-purple">Has LRN?</Label>
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-muted-foreground">{hasLrn ? 'Yes' : 'No'}</span>
                                <Switch checked={hasLrn} onCheckedChange={onToggleLrn} />
                            </div>
                        </div>
                    )}
                    {hasLrn && (
                        <>
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
                        </>
                    )}
                    {!hasLrn && !onToggleLrn && (
                        <div /> // spacer
                    )}
                </div>

                {/* Full Name */}
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

                {/* Academic Year */}
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

                {/* Birth Date */}
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

                {/* Age */}
                <div className="space-y-2">
                    <Label className="text-stat-purple">Age</Label>
                    <Input
                        value={calculatedAge !== null ? `${calculatedAge} years old` : ''}
                        placeholder="Auto-calculated from birth date"
                        disabled
                        className="bg-secondary/30 text-muted-foreground"
                    />
                </div>

                {/* Gender */}
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

                {/* SHS Strand Selection (only for Grade 11 & 12) */}
                {needsStrand && (
                    <div className="space-y-2">
                        <Label className="text-stat-purple">
                            SHS Strand <span className="text-destructive">*</span>
                        </Label>
                        <Select value={formData.strand || undefined} onValueChange={(v) => handleChange('strand', v)}>
                            <SelectTrigger className={`bg-secondary/50 ${errors.strand && touched.strand ? 'border-destructive' : ''}`}>
                                <SelectValue placeholder="Select strand" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectGroup>
                                    <SelectLabel className="font-semibold">Academic Track</SelectLabel>
                                    {SHS_STRANDS.filter(s => ['ABM', 'STEM', 'HUMSS', 'GAS'].includes(s.value)).map(strand => (
                                        <SelectItem key={strand.value} value={strand.value}>{strand.label}</SelectItem>
                                    ))}
                                </SelectGroup>
                                <SelectGroup>
                                    <SelectLabel className="font-semibold">Technical-Vocational-Livelihood (TVL)</SelectLabel>
                                    {SHS_STRANDS.filter(s => s.value.startsWith('TVL')).map(strand => (
                                        <SelectItem key={strand.value} value={strand.value}>{strand.label}</SelectItem>
                                    ))}
                                </SelectGroup>
                                <SelectGroup>
                                    <SelectLabel className="font-semibold">Arts & Sports Track</SelectLabel>
                                    {SHS_STRANDS.filter(s => ['SPORTS', 'ARTS-DESIGN'].includes(s.value)).map(strand => (
                                        <SelectItem key={strand.value} value={strand.value}>{strand.label}</SelectItem>
                                    ))}
                                </SelectGroup>
                            </SelectContent>
                        </Select>
                        {touched.strand && <FieldError error={errors.strand} />}
                    </div>
                )}
                
                {!needsStrand && <div></div>} {/* Spacer to maintain grid */}

                {/* Mother Tongue */}
                <div className="space-y-2">
                    <Label className="text-stat-purple">Mother Tongue</Label>
                    <Input
                        placeholder="e.g. Cebuano"
                        value={formData.mother_tongue}
                        onChange={(e) => handleChange('mother_tongue', e.target.value)}
                        className="bg-secondary/50"
                    />
                </div>

                {/* Dialects */}
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
