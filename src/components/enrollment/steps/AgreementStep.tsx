import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Eraser } from "lucide-react";
import { useRef } from "react";
import SignatureCanvas from "react-signature-canvas";

interface AgreementStepProps {
    agreed: boolean;
    setAgreed: (agreed: boolean) => void;
    sigPadRef: any;
    handleClearSignature: () => void;
    isCompleted: boolean;
}

export const AgreementStep = ({ agreed, setAgreed, sigPadRef, handleClearSignature, isCompleted }: AgreementStepProps) => {
    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="space-y-4">
                <h3 className="font-semibold text-lg text-foreground">Terms and Conditions</h3>
                <ScrollArea className="h-[200px] w-full rounded-md border p-4 bg-muted/30">
                    <div className="space-y-4 text-sm text-muted-foreground">
                        <p><strong>1. ENROLLMENT AGREEMENT:</strong> By submitting this form, I hereby request enrollment for the learner named above in M.A. Brain Development Center (MABDC) / St. Francis Xavier Smart Academy (STFXSA).</p>

                        <p><strong>2. PARENTAL CONSENT:</strong> I certify that I am the parent or legal guardian of the learner and have the authority to make educational decisions on their behalf.</p>

                        <p><strong>3. ACCURACY OF INFORMATION:</strong> I verify that all information provided in this form is true, correct, and complete to the best of my knowledge. I understand that withholding or falsifying information may be grounds for denial of enrollment or dismissal.</p>

                        <p><strong>4. DATA PRIVACY:</strong> I consent to the collection and processing of the learner's personal data for educational and administrative purposes in accordance with the Data Privacy Act.</p>

                        <p><strong>5. FINANCIAL OBLIGATION:</strong> I understand and agree to the financial obligations associated with this enrollment, including the payment of tuition and miscellaneous fees as scheduled.</p>

                        <p><strong>6. RULES AND REGULATIONS:</strong> I agree to abide by the rules, regulations, and policies of the school as set forth in the Student Handbook.</p>
                    </div>
                </ScrollArea>

                <div className="flex items-center space-x-2 pt-2">
                    <Checkbox
                        id="terms"
                        checked={agreed}
                        onCheckedChange={(checked) => setAgreed(checked as boolean)}
                    />
                    <Label htmlFor="terms" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        I have read and agree to the Terms and Conditions
                    </Label>
                </div>
            </div>

            <div className="space-y-4">
                <Label className="font-semibold text-lg text-foreground block">
                    Parent/Guardian Signature
                </Label>
                <p className="text-sm text-muted-foreground">
                    Please sign below using your mouse or touch screen to confirm this enrollment.
                </p>

                <div className="border-2 border-dashed border-input rounded-xl overflow-hidden bg-white dark:bg-zinc-900 relative">
                    <SignatureCanvas
                        ref={sigPadRef}
                        penColor="black"
                        canvasProps={{
                            className: "w-full h-[200px] cursor-crosshair",
                            height: 200,
                        }}
                        backgroundColor="transparent"
                    />
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleClearSignature}
                        className="absolute top-2 right-2 text-muted-foreground hover:text-destructive"
                    >
                        <Eraser className="h-4 w-4 mr-1" />
                        Clear
                    </Button>
                </div>
            </div>
        </div>
    );
};
