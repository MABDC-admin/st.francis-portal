import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle } from "lucide-react";
import { useMemo } from "react";
import { differenceInYears } from "date-fns";
import { GRADE_LEVELS, SCHOOLS, SCHOOL_YEARS, GENDERS } from "../constants";

interface StudentInfoStepProps {
    formData: any;
    errors: any;
    touched: any;
    handleChange: (field: string, value: string) => void;
    handleBlur: (field: string) => void;
}

export const StudentInfoStep = ({ formData, errors, touched, handleChange, handleBlur }: StudentInfoStepProps) => {
    const isKinderLevel = useMemo(() => {
        return ['Kinder 1', 'Kinder 2'].includes(formData.level);
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
                    <Select value={formData.level} onValueChange={(v) => handleChange('level', v)}>
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
            </div>
        </div>
    );
};
