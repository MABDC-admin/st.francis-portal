import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { format } from 'date-fns';
import { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const STATUS_FLOW = ['submitted', 'under_review', 'shortlisted', 'interview_scheduled', 'demo_teaching', 'approved', 'hired'];
const STATUS_LABELS: Record<string, string> = {
  submitted: 'Submitted', under_review: 'Under Review', shortlisted: 'Shortlisted',
  interview_scheduled: 'Interview', demo_teaching: 'Demo Teaching', approved: 'Approved',
  rejected: 'Rejected', hired: 'Hired',
};

interface Props {
  application: any;
  open: boolean;
  onClose: () => void;
  onStatusChange: (status: string, reason?: string) => void;
}

export const ApplicantDetailDialog = ({ application: app, open, onClose, onStatusChange }: Props) => {
  const [newStatus, setNewStatus] = useState(app.status);
  const [rejectionReason, setRejectionReason] = useState('');

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="space-y-2">
      <h3 className="font-semibold text-sm text-foreground">{title}</h3>
      <div className="text-sm text-muted-foreground space-y-1">{children}</div>
    </div>
  );

  const Field = ({ label, value }: { label: string; value?: string | null }) => {
    if (!value) return null;
    return <p><span className="font-medium text-foreground">{label}:</span> {value}</p>;
  };

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {app.first_name} {app.last_name}
            <Badge className="ml-2">{STATUS_LABELS[app.status]}</Badge>
          </DialogTitle>
          <p className="text-xs text-muted-foreground font-mono">{app.reference_number}</p>
        </DialogHeader>

        <div className="space-y-4">
          <Section title="Personal Information">
            <Field label="Full Name" value={`${app.first_name} ${app.middle_name || ''} ${app.last_name} ${app.suffix || ''}`.trim()} />
            <Field label="Gender" value={app.gender} />
            <Field label="Date of Birth" value={app.date_of_birth} />
            <Field label="Civil Status" value={app.civil_status} />
            <Field label="Nationality" value={app.nationality} />
          </Section>

          <Separator />

          <Section title="Contact">
            <Field label="Mobile" value={app.mobile_number} />
            <Field label="Email" value={app.email} />
            <Field label="Address" value={`${app.house_street}, ${app.barangay}, ${app.city_municipality}, ${app.province} ${app.zip_code}`} />
          </Section>

          <Separator />

          <Section title="Position">
            <Field label="Applied For" value={app.position_applied} />
            <Field label="Preferred Level" value={app.preferred_level} />
            {app.subject_specialization?.length > 0 && <Field label="Subjects" value={app.subject_specialization.join(', ')} />}
          </Section>

          <Separator />

          <Section title="PRC License">
            <Field label="Has License" value={app.has_prc_license ? 'Yes' : 'No'} />
            {app.has_prc_license && (
              <>
                <Field label="License #" value={app.prc_license_number} />
                <Field label="Expiration" value={app.prc_expiration_date} />
              </>
            )}
          </Section>

          <Separator />

          <Section title="Education">
            {(app.education as any[])?.map((edu: any, i: number) => (
              <div key={i} className="p-2 bg-muted rounded text-xs">
                <p className="font-medium">{edu.level}: {edu.course} {edu.major && `- ${edu.major}`}</p>
                <p>{edu.school} ({edu.year_graduated}){edu.honors && ` • ${edu.honors}`}</p>
              </div>
            ))}
          </Section>

          <Separator />

          <Section title="Experience">
            {app.has_experience && (app.experience as any[])?.map((exp: any, i: number) => (
              <div key={i} className="p-2 bg-muted rounded text-xs">
                <p className="font-medium">{exp.position} at {exp.school}</p>
                <p>{exp.subjects} • {exp.start_date} - {exp.end_date || 'Present'} • {exp.status}</p>
              </div>
            ))}
            {!app.has_experience && <p>No teaching experience</p>}
          </Section>

          <Separator />

          <Section title="Additional">
            <Field label="Expected Salary" value={app.expected_salary} />
            <Field label="Available Start" value={app.available_start_date} />
            {app.why_join && <div><p className="font-medium text-foreground">Why join:</p><p className="text-xs">{app.why_join}</p></div>}
            {app.teaching_philosophy && <div><p className="font-medium text-foreground">Philosophy:</p><p className="text-xs">{app.teaching_philosophy}</p></div>}
          </Section>

          <Separator />

          {/* Status Update */}
          <div className="space-y-3 p-4 border rounded-lg bg-muted/50">
            <h3 className="font-semibold text-sm">Update Status</h3>
            <Select value={newStatus} onValueChange={setNewStatus}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {[...STATUS_FLOW, 'rejected'].map(s => (
                  <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {newStatus === 'rejected' && (
              <Textarea placeholder="Reason for rejection..." value={rejectionReason} onChange={e => setRejectionReason(e.target.value)} />
            )}
            <div className="flex gap-2">
              <Button size="sm" onClick={() => onStatusChange(newStatus, rejectionReason)} disabled={newStatus === app.status}>
                Update Status
              </Button>
              <Button size="sm" variant="outline" onClick={onClose}>Close</Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
