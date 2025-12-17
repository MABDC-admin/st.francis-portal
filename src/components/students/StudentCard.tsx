import { motion } from 'framer-motion';
import { Eye, Pencil, Trash2, Phone, Mail, GraduationCap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Student } from '@/types/student';
import { cn } from '@/lib/utils';

interface StudentCardProps {
  student: Student;
  onView: (student: Student) => void;
  onEdit: (student: Student) => void;
  onDelete: (student: Student) => void;
  index: number;
}

export const StudentCard = ({ student, onView, onEdit, onDelete, index }: StudentCardProps) => {
  const getStatusColor = () => {
    // You can add logic here based on student status
    return 'bg-stat-green text-white';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      className="bg-card rounded-2xl shadow-card p-5 hover:shadow-lg transition-all duration-300 border border-border/50 group"
    >
      {/* Status Badge */}
      <div className="flex justify-between items-start mb-4">
        <span className={cn(
          "px-3 py-1 rounded-full text-xs font-semibold",
          getStatusColor()
        )}>
          Active
        </span>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8"
            onClick={() => onEdit(student)}
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 text-destructive hover:text-destructive"
            onClick={() => onDelete(student)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Profile Section */}
      <div 
        className="flex flex-col items-center text-center cursor-pointer"
        onClick={() => onView(student)}
      >
        {/* Avatar */}
        <div className="relative mb-3">
          {student.photo_url ? (
            <img 
              src={student.photo_url} 
              alt={student.student_name}
              className="h-20 w-20 rounded-full object-cover border-4 border-stat-purple-light"
            />
          ) : (
            <div className="h-20 w-20 rounded-full bg-gradient-to-br from-stat-purple to-stat-pink flex items-center justify-center border-4 border-stat-purple-light">
              <span className="text-2xl font-bold text-white">
                {student.student_name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-stat-green border-2 border-card flex items-center justify-center">
            <div className="h-2 w-2 rounded-full bg-white" />
          </div>
        </div>

        {/* Name & Level */}
        <h3 className="font-bold text-foreground text-lg mb-0.5 line-clamp-1">
          {student.student_name}
        </h3>
        <p className="text-stat-purple font-medium text-sm mb-4">
          {student.level}
        </p>

        {/* Divider */}
        <div className="w-full border-t border-border my-3" />

        {/* Info Grid */}
        <div className="w-full grid grid-cols-2 gap-3 text-left text-sm">
          <div>
            <p className="text-muted-foreground text-xs">LRN</p>
            <p className="text-foreground font-medium truncate font-mono text-xs">
              {student.lrn}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Age</p>
            <p className="text-foreground font-medium">
              {student.age || '-'}
            </p>
          </div>
        </div>

        {/* Contact Info */}
        <div className="w-full mt-3 space-y-2">
          {student.mother_contact && (
            <div className="flex items-center gap-2 text-muted-foreground text-xs">
              <Phone className="h-3.5 w-3.5 text-stat-green" />
              <span className="truncate">{student.mother_contact}</span>
            </div>
          )}
          {student.gender && (
            <div className="flex items-center gap-2 text-muted-foreground text-xs">
              <GraduationCap className="h-3.5 w-3.5 text-stat-purple" />
              <span>{student.gender}</span>
            </div>
          )}
        </div>
      </div>

      {/* View Profile Button */}
      <Button 
        variant="outline" 
        className="w-full mt-4 border-stat-purple text-stat-purple hover:bg-stat-purple hover:text-white transition-colors"
        onClick={() => onView(student)}
      >
        <Eye className="h-4 w-4 mr-2" />
        View Profile
      </Button>
    </motion.div>
  );
};
