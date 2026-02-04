import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Student, StudentFormData } from '@/types/student';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from '@/components/ui/textarea';

interface StudentFormModalProps {
  student: Student | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: StudentFormData & { id?: string }) => void;
  isLoading?: boolean;
}

const LEVELS = ['Level 1', 'Level 2', 'Level 3', 'Level 4', 'Level 5', 'Level 6'];
const GENDERS = ['MALE', 'FEMALE'];

export const StudentFormModal = ({
  student,
  isOpen,
  onClose,
  onSubmit,
  isLoading
}: StudentFormModalProps) => {
  const [formData, setFormData] = useState<StudentFormData>({
    lrn: '',
    student_name: '',
    level: 'Level 1',
  });

  useEffect(() => {
    if (student) {
      setFormData({
        lrn: student.lrn,
        student_name: student.student_name,
        level: student.level,
        birth_date: student.birth_date || undefined,
        age: student.age || undefined,
        gender: student.gender || undefined,
        mother_contact: student.mother_contact || undefined,
        mother_maiden_name: student.mother_maiden_name || undefined,
        father_contact: student.father_contact || undefined,
        father_name: student.father_name || undefined,
        phil_address: student.phil_address || undefined,
        uae_address: student.uae_address || undefined,
        previous_school: student.previous_school || undefined,
      });
    } else {
      setFormData({
        lrn: '',
        student_name: '',
        level: 'Level 1',
      });
    }
  }, [student, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(student ? { ...formData, id: student.id } : formData);
  };

  const handleChange = (field: keyof StudentFormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-2rem)] lg:w-full lg:max-w-2xl lg:max-h-[90vh] bg-card rounded-2xl shadow-lg z-50 overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="px-6 py-5 border-b border-border flex items-center justify-between">
              <h2 className="text-xl font-bold text-foreground">
                {student ? 'Edit Student' : 'Add New Student'}
              </h2>
              <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close">
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
              <div className="space-y-6">
                {/* Basic Info */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-foreground">Basic Information</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="lrn">LRN *</Label>
                      <Input
                        id="lrn"
                        value={formData.lrn}
                        onChange={(e) => handleChange('lrn', e.target.value)}
                        required
                        placeholder="Enter LRN"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="student_name">Full Name *</Label>
                      <Input
                        id="student_name"
                        value={formData.student_name}
                        onChange={(e) => handleChange('student_name', e.target.value)}
                        required
                        placeholder="Enter full name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="level">Level *</Label>
                      <Select
                        value={formData.level}
                        onValueChange={(v) => handleChange('level', v)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select level" />
                        </SelectTrigger>
                        <SelectContent>
                          {LEVELS.map(level => (
                            <SelectItem key={level} value={level}>{level}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="gender">Gender</Label>
                      <Select
                        value={formData.gender || ''}
                        onValueChange={(v) => handleChange('gender', v)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent>
                          {GENDERS.map(gender => (
                            <SelectItem key={gender} value={gender}>{gender}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="birth_date">Date of Birth</Label>
                      <Input
                        id="birth_date"
                        type="date"
                        value={formData.birth_date || ''}
                        onChange={(e) => handleChange('birth_date', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="age">Age</Label>
                      <Input
                        id="age"
                        type="number"
                        value={formData.age || ''}
                        onChange={(e) => handleChange('age', parseInt(e.target.value) || 0)}
                        placeholder="Enter age"
                      />
                    </div>
                  </div>
                </div>

                {/* Parent Info */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-foreground">Parent/Guardian Information</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="mother_maiden_name">Mother's Maiden Name</Label>
                      <Input
                        id="mother_maiden_name"
                        value={formData.mother_maiden_name || ''}
                        onChange={(e) => handleChange('mother_maiden_name', e.target.value)}
                        placeholder="Enter mother's maiden name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="mother_contact">Mother's Contact</Label>
                      <Input
                        id="mother_contact"
                        value={formData.mother_contact || ''}
                        onChange={(e) => handleChange('mother_contact', e.target.value)}
                        placeholder="Enter contact number"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="father_name">Father's Name</Label>
                      <Input
                        id="father_name"
                        value={formData.father_name || ''}
                        onChange={(e) => handleChange('father_name', e.target.value)}
                        placeholder="Enter father's name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="father_contact">Father's Contact</Label>
                      <Input
                        id="father_contact"
                        value={formData.father_contact || ''}
                        onChange={(e) => handleChange('father_contact', e.target.value)}
                        placeholder="Enter contact number"
                      />
                    </div>
                  </div>
                </div>

                {/* Address Info */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-foreground">Address Information</h3>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="phil_address">Philippines Address</Label>
                      <Textarea
                        id="phil_address"
                        value={formData.phil_address || ''}
                        onChange={(e) => handleChange('phil_address', e.target.value)}
                        placeholder="Enter Philippines address"
                        rows={2}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="uae_address">UAE Address</Label>
                      <Textarea
                        id="uae_address"
                        value={formData.uae_address || ''}
                        onChange={(e) => handleChange('uae_address', e.target.value)}
                        placeholder="Enter UAE address"
                        rows={2}
                      />
                    </div>
                  </div>
                </div>

                {/* Academic Info */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-foreground">Academic Information</h3>
                  <div className="space-y-2">
                    <Label htmlFor="previous_school">Previous School</Label>
                    <Input
                      id="previous_school"
                      value={formData.previous_school || ''}
                      onChange={(e) => handleChange('previous_school', e.target.value)}
                      placeholder="Enter previous school name"
                    />
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-border">
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      {student ? 'Update' : 'Add'} Student
                    </>
                  )}
                </Button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
