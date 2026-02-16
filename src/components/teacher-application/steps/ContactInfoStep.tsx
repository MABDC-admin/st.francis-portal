import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TeacherFormData } from '../TeacherApplicationForm';

interface Props {
  formData: TeacherFormData;
  updateField: (field: keyof TeacherFormData, value: any) => void;
}

export const ContactInfoStep = ({ formData, updateField }: Props) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label>Mobile Number <span className="text-destructive">*</span></Label>
        <Input value={formData.mobile_number} onChange={e => updateField('mobile_number', e.target.value)} placeholder="09XX XXX XXXX" />
      </div>
      <div className="space-y-2">
        <Label>Alternate Mobile</Label>
        <Input value={formData.alternate_mobile} onChange={e => updateField('alternate_mobile', e.target.value)} placeholder="09XX XXX XXXX" />
      </div>
      <div className="space-y-2 md:col-span-2">
        <Label>Email Address <span className="text-destructive">*</span></Label>
        <Input type="email" value={formData.email} onChange={e => updateField('email', e.target.value)} placeholder="email@example.com" />
      </div>
      <div className="space-y-2 md:col-span-2">
        <Label>House/Street <span className="text-destructive">*</span></Label>
        <Input value={formData.house_street} onChange={e => updateField('house_street', e.target.value)} placeholder="House No., Street" />
      </div>
      <div className="space-y-2">
        <Label>Barangay <span className="text-destructive">*</span></Label>
        <Input value={formData.barangay} onChange={e => updateField('barangay', e.target.value)} placeholder="Barangay" />
      </div>
      <div className="space-y-2">
        <Label>City/Municipality <span className="text-destructive">*</span></Label>
        <Input value={formData.city_municipality} onChange={e => updateField('city_municipality', e.target.value)} placeholder="City/Municipality" />
      </div>
      <div className="space-y-2">
        <Label>Province <span className="text-destructive">*</span></Label>
        <Input value={formData.province} onChange={e => updateField('province', e.target.value)} placeholder="Province" />
      </div>
      <div className="space-y-2">
        <Label>ZIP Code <span className="text-destructive">*</span></Label>
        <Input value={formData.zip_code} onChange={e => updateField('zip_code', e.target.value)} placeholder="ZIP Code" />
      </div>
      <div className="space-y-2">
        <Label>Country <span className="text-destructive">*</span></Label>
        <Input value={formData.country} onChange={e => updateField('country', e.target.value)} placeholder="Country" />
      </div>
    </div>
  );
};
