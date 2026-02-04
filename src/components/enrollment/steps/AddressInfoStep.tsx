import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle } from "lucide-react";

interface AddressInfoStepProps {
    formData: any;
    errors: any;
    touched: any;
    handleChange: (field: string, value: string) => void;
    handleBlur: (field: string) => void;
}

export const AddressInfoStep = ({ formData, errors, touched, handleChange, handleBlur }: AddressInfoStepProps) => {
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
                <div className="space-y-2 md:col-span-2">
                    <h3 className="font-semibold text-lg text-foreground">Address Information</h3>
                </div>
                {/* STFXSA: Philippine Address Required, UAE Address hidden/optional */}
                {formData.school === 'STFXSA' && (
                    <div className="space-y-2 md:col-span-2">
                        <Label className="text-stat-purple">
                            Philippine Address <span className="text-destructive">*</span>
                        </Label>
                        <Textarea
                            placeholder="Enter complete Philippine address"
                            value={formData.phil_address}
                            onChange={(e) => handleChange('phil_address', e.target.value)}
                            onBlur={() => handleBlur('phil_address')}
                            className={`bg-secondary/50 min-h-[100px] ${errors.phil_address && touched.phil_address ? 'border-destructive' : ''}`}
                        />
                        {touched.phil_address && <FieldError error={errors.phil_address} />}
                    </div>
                )}

                {/* MABDC: UAE Address Required, PH Address hidden/optional */}
                {formData.school === 'MABDC' && (
                    <div className="space-y-2 md:col-span-2">
                        <Label className="text-stat-purple">
                            UAE Address <span className="text-destructive">*</span>
                        </Label>
                        <Textarea
                            placeholder="Enter complete UAE address"
                            value={formData.uae_address}
                            onChange={(e) => handleChange('uae_address', e.target.value)}
                            onBlur={() => handleBlur('uae_address')}
                            className={`bg-secondary/50 min-h-[100px] ${errors.uae_address && touched.uae_address ? 'border-destructive' : ''}`}
                        />
                        {touched.uae_address && <FieldError error={errors.uae_address} />}
                    </div>
                )}

                <div className="space-y-2 md:col-span-2 mt-4">
                    <h3 className="font-semibold text-lg text-foreground">Academic History</h3>
                </div>
                <div className="space-y-2 md:col-span-2">
                    <Label className="text-stat-purple">
                        Previous School <span className="text-muted-foreground">(Optional)</span>
                    </Label>
                    <Input
                        placeholder="Enter previous school name"
                        value={formData.previous_school}
                        onChange={(e) => handleChange('previous_school', e.target.value)}
                        className="bg-secondary/50"
                    />
                </div>
            </div>
        </div>
    );
};
