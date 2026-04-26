import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StudentTable } from './StudentTable';
import { Student } from '@/types/student';
import { useAuth } from '@/contexts/AuthContext';
import { useAcademicYear } from '@/contexts/AcademicYearContext';
import { useSchoolId } from '@/hooks/useSchoolId';
import { useTeacherProfile, useTeacherSchedule } from '@/hooks/useTeacherData';

const normalizeGradeLevel = (value: string | null | undefined) => {
  if (!value) return '';
  const normalized = value.toLowerCase().replace(/\s+/g, ' ').trim();
  if (normalized.includes('kinder')) {
    return normalized.replace(/\s+/g, '');
  }
  const stripped = normalized.replace(/^grade\s*/i, '').replace(/^g\s*/i, '').trim();
  if (/^\d{1,2}$/.test(stripped)) {
    return `grade-${stripped}`;
  }
  return stripped.replace(/\s+/g, '');
};

interface TeacherStudentsViewProps {
  students: Student[];
  isLoading: boolean;
  role: string | null;
  hasAdminAccess: boolean;
  onView: (student: Student) => void;
  onEdit: (student: Student) => void;
  onDelete: (student: Student) => void;
  onAddNew: () => void;
}

export const TeacherStudentsView = ({
  students,
  isLoading,
  role,
  hasAdminAccess,
  onView,
  onEdit,
  onDelete,
  onAddNew,
}: TeacherStudentsViewProps) => {
  const { user } = useAuth();
  const { data: schoolId } = useSchoolId();
  const { selectedYearId } = useAcademicYear();
  const { data: teacherProfile } = useTeacherProfile(
    role === 'teacher' ? user?.id : undefined,
    role === 'teacher' ? user?.email : undefined,
  );
  const { data: teacherSchedules = [] } = useTeacherSchedule(
    role === 'teacher' ? teacherProfile?.id : undefined,
    role === 'teacher' ? schoolId : undefined,
    role === 'teacher' ? selectedYearId : undefined,
    role === 'teacher' ? teacherProfile?.grade_level : undefined,
  );

  const filteredStudents = useMemo(() => {
    if (role === 'teacher' && teacherProfile?.grade_level) {
      const classSlots = teacherSchedules.length > 0
        ? teacherSchedules.map((schedule) => ({
            level: schedule.grade_level,
            section: schedule.section,
          }))
        : [{
            level: teacherProfile.grade_level,
            section: null,
          }];

      return students.filter((student) => {
        return classSlots.some((slot) => {
          const sameLevel = normalizeGradeLevel(student.level) === normalizeGradeLevel(slot.level);
          if (!sameLevel) {
            return false;
          }

          if (!slot.section) {
            return true;
          }

          if (!student.section) {
            return true;
          }

          return student.section === slot.section;
        });
      });
    }
    return students;
  }, [students, role, teacherProfile?.grade_level, teacherSchedules]);

  const noopHandler = () => {};

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Learners</h1>
          <p className="text-muted-foreground mt-1">
            {role === 'teacher' && teacherProfile?.grade_level
              ? `${teacherProfile.grade_level} learners`
              : 'Manage learner records'}
          </p>
        </div>
        {hasAdminAccess && (
          <Button onClick={onAddNew} className="w-full sm:w-auto">
            <UserPlus className="h-4 w-4 mr-2" />
            Add Learner
          </Button>
        )}
      </motion.div>

      <StudentTable
        students={filteredStudents}
        onView={onView}
        onEdit={hasAdminAccess ? onEdit : noopHandler}
        onDelete={hasAdminAccess ? onDelete : noopHandler}
        isLoading={isLoading}
        hideActions={role === 'teacher'}
      />
    </div>
  );
};
