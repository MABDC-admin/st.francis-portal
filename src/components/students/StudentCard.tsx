import { motion } from 'framer-motion';
import { Eye, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Student } from '@/types/student';
import { cn } from '@/lib/utils';
import { StudentHoverPreview } from './StudentHoverPreview';

interface StudentCardProps {
  student: Student;
  onView: (student: Student) => void;
  onEdit: (student: Student) => void;
  onDelete: (student: Student) => void;
  index: number;
}

export const StudentCard = ({ student, onView, onEdit, onDelete, index }: StudentCardProps) => {
  const getStatusColor = () => {
    return 'bg-stat-green text-white';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03, duration: 0.2 }}
      className="relative rounded-xl shadow-card hover:shadow-lg hover:shadow-emerald-500/20 transition-all duration-300 border border-border/50 hover:border-emerald-400/60 group overflow-hidden"
    >
      {/* Pulsing glow effect on hover */}
      <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 via-lime-400 to-emerald-500 rounded-xl opacity-0 group-hover:opacity-100 blur-sm transition-opacity duration-300 animate-pulse pointer-events-none" />
      <div className="absolute inset-0 bg-card rounded-xl" />
      
      {/* Gradient Background that blends */}
      <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/40 via-lime-400/25 to-emerald-100/10 pointer-events-none rounded-xl" />
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-600 to-lime-400" />
      
      {/* Shimmer sweep effect on hover */}
      <div className="absolute inset-0 overflow-hidden rounded-xl pointer-events-none">
        <div className="absolute inset-0 -translate-x-full opacity-0 group-hover:opacity-100 group-hover:animate-shimmer-sweep bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      </div>
      
      <div className="relative p-3">
      {/* Status Badge & Actions */}
      <div className="flex justify-between items-start mb-2">
        <span className={cn(
          "px-2 py-0.5 rounded-full text-[10px] font-semibold",
          getStatusColor()
        )}>
          Active
        </span>
        <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-6 w-6"
            onClick={() => onEdit(student)}
          >
            <Pencil className="h-3 w-3" />
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
            {student.photo_url ? (
              <img 
                src={student.photo_url} 
                alt={student.student_name}
                className="h-12 w-12 rounded-full object-cover border-2 border-stat-purple-light"
              />
            ) : (
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-stat-purple to-stat-pink flex items-center justify-center border-2 border-stat-purple-light">
                <span className="text-base font-bold text-white">
                  {student.student_name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full bg-stat-green border-2 border-card flex items-center justify-center">
              <div className="h-1.5 w-1.5 rounded-full bg-white" />
            </div>
          </div>

          {/* Name & Level */}
          <h3 className="font-bold text-foreground text-sm mb-0.5 line-clamp-1">
            {student.student_name}
          </h3>
          <p className="text-stat-purple font-medium text-xs mb-2">
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
        className="w-full mt-2 h-7 text-xs border-stat-purple text-stat-purple hover:bg-stat-purple hover:text-white transition-colors"
        onClick={() => onView(student)}
      >
        <Eye className="h-3 w-3 mr-1" />
        View
      </Button>
      </div>
    </motion.div>
  );
};
