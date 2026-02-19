import { CheckCircle } from 'lucide-react';

interface Props {
  referenceNumber: string;
}

export const ConfirmationStep = ({ referenceNumber }: Props) => {
  return (
    <div className="text-center space-y-4 py-8">
      <div className="flex justify-center">
        <CheckCircle className="h-16 w-16 text-green-500" />
      </div>
      <h2 className="text-2xl font-bold text-foreground">Application Submitted!</h2>
      <p className="text-muted-foreground max-w-md mx-auto">
        Your teacher application has been successfully submitted. Our registrar will review your application and contact you via email or phone.
      </p>
      <div className="bg-muted p-4 rounded-lg inline-block">
        <p className="text-sm text-muted-foreground">Reference Number</p>
        <p className="text-xl font-mono font-bold text-primary">{referenceNumber}</p>
      </div>
      <p className="text-xs text-muted-foreground">Please save your reference number for future inquiries.</p>
    </div>
  );
};
