import { User, Phone, MapPin, School, Calendar, Hash } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Student } from '@/types/student';

interface LISStudentOverviewProps {
  student: Student;
}

const InfoItem = ({ icon: Icon, label, value }: { icon: any; label: string; value: string | null | undefined }) => {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 py-2">
      <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium text-foreground truncate">{value}</p>
      </div>
    </div>
  );
};

export const LISStudentOverview = ({ student }: LISStudentOverviewProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card className="rounded-xl border-border">
        <CardContent className="p-5 space-y-1">
          <h3 className="text-sm font-semibold text-foreground mb-3">Personal Information</h3>
          <InfoItem icon={Hash} label="LRN" value={student.lrn} />
          <InfoItem icon={User} label="Full Name" value={student.student_name} />
          <InfoItem icon={User} label="Gender" value={student.gender} />
          <InfoItem icon={Calendar} label="Birth Date" value={student.birth_date} />
          <InfoItem icon={User} label="Age" value={student.age?.toString()} />
        </CardContent>
      </Card>

      <Card className="rounded-xl border-border">
        <CardContent className="p-5 space-y-1">
          <h3 className="text-sm font-semibold text-foreground mb-3">Contact & Address</h3>
          <InfoItem icon={User} label="Mother's Maiden Name" value={student.mother_maiden_name} />
          <InfoItem icon={Phone} label="Mother's Contact" value={student.mother_contact} />
          <InfoItem icon={User} label="Father's Name" value={student.father_name} />
          <InfoItem icon={Phone} label="Father's Contact" value={student.father_contact} />
          <InfoItem icon={MapPin} label="Philippine Address" value={student.phil_address} />
          <InfoItem icon={MapPin} label="UAE Address" value={student.uae_address} />
        </CardContent>
      </Card>

      <Card className="rounded-xl border-border md:col-span-2">
        <CardContent className="p-5 space-y-1">
          <h3 className="text-sm font-semibold text-foreground mb-3">School Information</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-6">
            <InfoItem icon={School} label="Current School" value={student.school} />
            <InfoItem icon={User} label="Grade Level" value={student.level} />
            <InfoItem icon={School} label="Previous School" value={student.previous_school} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
