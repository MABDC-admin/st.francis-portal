import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface GradeChangeRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  gradeId: string;
  currentValues: {
    q1_grade: number | null;
    q2_grade: number | null;
    q3_grade: number | null;
    q4_grade: number | null;
    remarks: string | null;
  };
  onSuccess: () => void;
}

export const GradeChangeRequestDialog = ({
  open,
  onOpenChange,
  gradeId,
  currentValues,
  onSuccess,
}: GradeChangeRequestDialogProps) => {
  const [reason, setReason] = useState('');
  const [newValues, setNewValues] = useState({
    q1_grade: currentValues.q1_grade?.toString() || '',
    q2_grade: currentValues.q2_grade?.toString() || '',
    q3_grade: currentValues.q3_grade?.toString() || '',
    q4_grade: currentValues.q4_grade?.toString() || '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!reason.trim()) {
      toast.error('Please provide a reason for the change');
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const oldVals: Record<string, number | null> = {};
      const newVals: Record<string, number | null> = {};

      // Only include changed values
      (['q1_grade', 'q2_grade', 'q3_grade', 'q4_grade'] as const).forEach(key => {
        const newVal = newValues[key] ? parseFloat(newValues[key]) : null;
        const oldVal = currentValues[key];
        if (newVal !== oldVal) {
          oldVals[key] = oldVal;
          newVals[key] = newVal;
        }
      });

      if (Object.keys(newVals).length === 0) {
        toast.error('No changes detected');
        setIsSubmitting(false);
        return;
      }

      const { error } = await (supabase.from('grade_change_requests') as any).insert({
        student_grade_id: gradeId,
        requested_by: user.id,
        reason: reason.trim(),
        old_values: oldVals,
        new_values: newVals,
      });

      if (error) throw error;
      toast.success('Change request submitted for review');
      onOpenChange(false);
      setReason('');
      onSuccess();
    } catch (error: any) {
      toast.error('Failed to submit change request: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Request Grade Change</DialogTitle>
          <DialogDescription>
            This grade has been finalized. Submit a change request with a reason for review.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <Label>Reason for Change *</Label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explain why this grade needs to be changed..."
              rows={3}
            />
          </div>
          <div className="grid grid-cols-4 gap-3">
            {(['q1_grade', 'q2_grade', 'q3_grade', 'q4_grade'] as const).map((key, i) => (
              <div key={key}>
                <Label>Q{i + 1}</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={newValues[key]}
                  onChange={(e) => setNewValues(prev => ({ ...prev, [key]: e.target.value }))}
                  placeholder={currentValues[key]?.toString() || '-'}
                />
                {currentValues[key] !== null && (
                  <p className="text-xs text-muted-foreground mt-1">Current: {currentValues[key]}</p>
                )}
              </div>
            ))}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || !reason.trim()}>
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Submit Request
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
