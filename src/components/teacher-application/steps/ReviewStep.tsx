import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Pencil } from 'lucide-react';
import { TeacherFormData } from '../TeacherApplicationForm';

interface Props {
  formData: TeacherFormData;
  goToStep: (step: number) => void;
}

const Section = ({ title, step, goToStep, children }: { title: string; step: number; goToStep: (s: number) => void; children: React.ReactNode }) => (
  <Card>
    <CardHeader className="py-3 px-4 flex flex-row items-center justify-between">
      <CardTitle className="text-sm">{title}</CardTitle>
      <Button variant="ghost" size="sm" onClick={() => goToStep(step)}><Pencil className="h-3 w-3 mr-1" /> Edit</Button>
    </CardHeader>
    <CardContent className="px-4 pb-3 text-sm text-muted-foreground space-y-1">{children}</CardContent>
  </Card>
);

const Field = ({ label, value }: { label: string; value?: string | null }) => {
  if (!value) return null;
  return <p><span className="font-medium text-foreground">{label}:</span> {value}</p>;
};

export const ReviewStep = ({ formData, goToStep }: Props) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      <Section title="Personal Info" step={0} goToStep={goToStep}>
        <Field label="Name" value={`${formData.first_name} ${formData.middle_name} ${formData.last_name} ${formData.suffix}`.trim()} />
        <Field label="Gender" value={formData.gender} />
        <Field label="DOB" value={formData.date_of_birth} />
        <Field label="Civil Status" value={formData.civil_status} />
        <Field label="Nationality" value={formData.nationality} />
      </Section>

      <Section title="Contact Info" step={1} goToStep={goToStep}>
        <Field label="Mobile" value={formData.mobile_number} />
        <Field label="Email" value={formData.email} />
        <Field label="Address" value={`${formData.house_street}, ${formData.barangay}, ${formData.city_municipality}, ${formData.province}`} />
      </Section>

      <Section title="Position" step={2} goToStep={goToStep}>
        <Field label="Position" value={formData.position_applied} />
        <Field label="Level" value={formData.preferred_level} />
        {formData.subject_specialization.length > 0 && (
          <Field label="Subjects" value={formData.subject_specialization.join(', ')} />
        )}
      </Section>

      <Section title="PRC License" step={3} goToStep={goToStep}>
        <Field label="Has License" value={formData.has_prc_license ? 'Yes' : 'No'} />
        {formData.has_prc_license && (
          <>
            <Field label="License #" value={formData.prc_license_number} />
            <Field label="Expiration" value={formData.prc_expiration_date} />
          </>
        )}
      </Section>

      <Section title="Education" step={4} goToStep={goToStep}>
        {formData.education.map((edu, i) => (
          <div key={i}>
            <Field label={edu.level} value={`${edu.course}${edu.major ? ' - ' + edu.major : ''} at ${edu.school} (${edu.year_graduated})`} />
          </div>
        ))}
      </Section>

      <Section title="Experience" step={5} goToStep={goToStep}>
        <Field label="Has Experience" value={formData.has_experience ? 'Yes' : 'No'} />
        {formData.experience.map((exp, i) => (
          <div key={i}>
            <Field label={exp.position} value={`${exp.school} (${exp.start_date} - ${exp.end_date || 'Present'})`} />
          </div>
        ))}
      </Section>

      <Section title="Documents" step={6} goToStep={goToStep}>
        <Field label="Resume" value={formData.resume_url ? '✓ Uploaded' : '✗ Missing'} />
        <Field label="Transcript" value={formData.transcript_url ? '✓ Uploaded' : '✗ Missing'} />
        <Field label="Diploma" value={formData.diploma_url ? '✓ Uploaded' : '✗ Missing'} />
        <Field label="Valid ID" value={formData.valid_id_url ? '✓ Uploaded' : '✗ Missing'} />
        <Field label="Certificates" value={formData.certificates_url.length > 0 ? `${formData.certificates_url.length} uploaded` : 'None'} />
      </Section>

      <Section title="Additional" step={7} goToStep={goToStep}>
        <Field label="Expected Salary" value={formData.expected_salary} />
        <Field label="Start Date" value={formData.available_start_date} />
        {formData.why_join && <p className="text-xs mt-1 line-clamp-2">{formData.why_join}</p>}
      </Section>
    </div>
  );
};
