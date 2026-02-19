import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle } from "lucide-react";

interface ParentInfoStepProps {
    formData: any;
    errors: any;
    touched: any;
    handleChange: (field: string, value: string) => void;
    handleBlur: (field: string) => void;
}

export const ParentInfoStep = ({ formData, errors, touched, handleChange, handleBlur }: ParentInfoStepProps) => {
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
                        Mother's Maiden Name <span className="text-destructive">*</span>
                    </Label>
                    <Input
                        placeholder="Enter mother's maiden name"
                        value={formData.mother_maiden_name}
                        onChange={(e) => handleChange('mother_maiden_name', e.target.value)}
                        onBlur={() => handleBlur('mother_maiden_name')}
                        className={`bg-secondary/50 ${errors.mother_maiden_name && touched.mother_maiden_name ? 'border-destructive' : ''}`}
                    />
                    {touched.mother_maiden_name && <FieldError error={errors.mother_maiden_name} />}
                </div>
                <div className="space-y-2">
                    <Label className="text-stat-purple">
                        Mother's Contact Number <span className="text-destructive">*</span>
                    </Label>
                    <Input
                        placeholder="e.g., 09123456789"
                        value={formData.mother_contact}
                        onChange={(e) => handleChange('mother_contact', e.target.value)}
                        onBlur={() => handleBlur('mother_contact')}
                        className={`bg-secondary/50 ${errors.mother_contact && touched.mother_contact ? 'border-destructive' : ''}`}
                    />
                    {touched.mother_contact && <FieldError error={errors.mother_contact} />}
                </div>
                <div className="space-y-2">
                    <Label className="text-stat-purple">
                        Father's Name <span className="text-destructive">*</span>
                    </Label>
                    <Input
                        placeholder="Enter father's name"
                        value={formData.father_name}
                        onChange={(e) => handleChange('father_name', e.target.value)}
                        onBlur={() => handleBlur('father_name')}
                        className={`bg-secondary/50 ${errors.father_name && touched.father_name ? 'border-destructive' : ''}`}
                    />
                    {touched.father_name && <FieldError error={errors.father_name} />}
                </div>
                <div className="space-y-2">
                    <Label className="text-stat-purple">
                        Father's Contact Number <span className="text-destructive">*</span>
                    </Label>
                    <Input
                        placeholder="e.g., 09123456789"
                        value={formData.father_contact}
                        onChange={(e) => handleChange('father_contact', e.target.value)}
                        onBlur={() => handleBlur('father_contact')}
                        className={`bg-secondary/50 ${errors.father_contact && touched.father_contact ? 'border-destructive' : ''}`}
                    />
                    {touched.father_contact && <FieldError error={errors.father_contact} />}
                </div>
            </div>
        </div>
    );
};
