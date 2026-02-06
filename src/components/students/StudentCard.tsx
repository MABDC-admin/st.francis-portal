import { motion } from 'framer-motion';
import { Eye, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Student } from '@/types/student';
import { cn } from '@/lib/utils';
import { StudentHoverPreview } from './StudentHoverPreview';
import { AnimatedStudentAvatar } from './AnimatedStudentAvatar';

interface StudentCardProps {
  student: Student;
  onView: (student: Student) => void;
  onEdit: (student: Student) => void;
  onDelete: (student: Student) => void;
  index: number;
}

export const StudentCard = ({ student, onView, onEdit, onDelete, index }: StudentCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03, duration: 0.2 }}
      className="relative rounded-xl shadow-card hover:shadow-lg transition-all duration-300 border border-border bg-card group overflow-hidden"
    >
      <div className="p-3">
        {/* Status Badge & Actions */}
        <div className="flex justify-between items-start mb-2">
          <div className="flex flex-col gap-1 items-start">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-stat-green text-white">
              Active
            </span>
            {student.grade_quarters && (
              <div className="flex gap-1">
                {(['q1', 'q2', 'q3', 'q4'] as const).map(q => (
                  <span
                    key={q}
                    className={cn(
                      "px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ring-1 ring-inset",
                      student.grade_quarters?.[q]
                        ? "bg-primary text-primary-foreground ring-primary/50"
                        : "bg-muted text-muted-foreground ring-border"
                    )}
                  >
                    {q}
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => onView(student)}
            >
              <Eye className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-destructive hover:text-destructive"
              onClick={() => onDelete(student)}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* Profile Section with Hover Preview */}
        <StudentHoverPreview student={student}>
          <div
            className="flex flex-col items-center text-center cursor-pointer"
            onClick={() => onView(student)}
          >
            {/* Avatar */}
            <div className="relative mb-2">
              <AnimatedStudentAvatar
                photoUrl={student.photo_url}
                name={student.student_name}
                size="xl"
              />
              <div className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full bg-stat-green border-2 border-card flex items-center justify-center">
                <div className="h-1.5 w-1.5 rounded-full bg-white" />
              </div>
            </div>

            {/* Name & Level */}
            <h3 className="font-bold text-foreground text-sm mb-0.5 line-clamp-1">
              {student.student_name}
            </h3>
            <p className="text-muted-foreground font-medium text-xs mb-2">
              {student.level}
            </p>

            {/* Info Grid */}
            <div className="w-full grid grid-cols-2 gap-2 text-left text-xs border-t border-border pt-2">
              <div>
                <p className="text-muted-foreground text-[10px]">LRN</p>
                <p className="text-foreground font-medium truncate font-mono text-[10px]">
                  {student.lrn}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground text-[10px]">Age</p>
                <p className="text-foreground font-medium text-xs">
                  {student.age || '-'}
                </p>
              </div>
            </div>
          </div>
        </StudentHoverPreview>

        {/* View Profile Button */}
        <Button
          variant="outline"
          size="sm"
          className="w-full mt-2 h-7 text-xs"
          onClick={() => onView(student)}
        >
          <Eye className="h-3 w-3 mr-1" />
          View
        </Button>
      </div>
    </motion.div>
  );
};
