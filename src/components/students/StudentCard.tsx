import { motion } from 'framer-motion';
import { Eye, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Student } from '@/types/student';
import { cn } from '@/lib/utils';
import { StudentHoverPreview } from './StudentHoverPreview';
import { useColorTheme } from '@/hooks/useColorTheme';

interface StudentCardProps {
  student: Student;
  onView: (student: Student) => void;
  onEdit: (student: Student) => void;
  onDelete: (student: Student) => void;
  index: number;
}

// Theme-based gradient mappings for cards
const cardGradients: Record<string, { bg: string; bar: string; glow: string; accent: string }> = {
  default: {
    bg: 'from-emerald-500/40 via-lime-400/25 to-emerald-100/10',
    bar: 'from-emerald-600 to-lime-400',
    glow: 'from-emerald-500 via-lime-400 to-emerald-500',
    accent: 'border-emerald-400/60 hover:shadow-emerald-500/20',
  },
  sunset: {
    bg: 'from-orange-500/40 via-amber-400/25 to-orange-100/10',
    bar: 'from-orange-500 to-amber-400',
    glow: 'from-orange-500 via-amber-400 to-orange-500',
    accent: 'border-orange-400/60 hover:shadow-orange-500/20',
  },
  ocean: {
    bg: 'from-emerald-500/40 via-teal-400/25 to-emerald-100/10',
    bar: 'from-emerald-500 to-teal-400',
    glow: 'from-emerald-500 via-teal-400 to-emerald-500',
    accent: 'border-teal-400/60 hover:shadow-teal-500/20',
  },
  berry: {
    bg: 'from-pink-600/40 via-rose-400/25 to-pink-100/10',
    bar: 'from-pink-600 to-rose-500',
    glow: 'from-pink-500 via-rose-400 to-pink-500',
    accent: 'border-pink-400/60 hover:shadow-pink-500/20',
  },
  sky: {
    bg: 'from-blue-600/40 via-sky-400/25 to-blue-100/10',
    bar: 'from-blue-600 to-sky-500',
    glow: 'from-blue-500 via-sky-400 to-blue-500',
    accent: 'border-blue-400/60 hover:shadow-sky-500/20',
  },
  grape: {
    bg: 'from-purple-700/40 via-violet-400/25 to-purple-100/10',
    bar: 'from-purple-700 to-violet-600',
    glow: 'from-purple-500 via-violet-400 to-purple-500',
    accent: 'border-purple-400/60 hover:shadow-purple-500/20',
  },
  blush: {
    bg: 'from-pink-400/40 via-fuchsia-300/25 to-pink-100/10',
    bar: 'from-pink-400 to-fuchsia-400',
    glow: 'from-pink-400 via-fuchsia-300 to-pink-400',
    accent: 'border-fuchsia-400/60 hover:shadow-fuchsia-500/20',
  },
  cherry: {
    bg: 'from-red-600/40 via-red-400/25 to-red-100/10',
    bar: 'from-red-600 to-red-500',
    glow: 'from-red-500 via-red-400 to-red-500',
    accent: 'border-red-400/60 hover:shadow-red-500/20',
  },
  slate: {
    bg: 'from-gray-500/40 via-slate-400/25 to-gray-100/10',
    bar: 'from-gray-500 to-slate-400',
    glow: 'from-gray-500 via-slate-400 to-gray-500',
    accent: 'border-slate-400/60 hover:shadow-slate-500/20',
  },
  navy: {
    bg: 'from-blue-900/40 via-indigo-600/25 to-blue-100/10',
    bar: 'from-blue-900 to-indigo-800',
    glow: 'from-blue-700 via-indigo-600 to-blue-700',
    accent: 'border-indigo-400/60 hover:shadow-indigo-500/20',
  },
  royal: {
    bg: 'from-blue-700/40 via-blue-400/25 to-blue-100/10',
    bar: 'from-blue-700 to-blue-500',
    glow: 'from-blue-600 via-blue-400 to-blue-600',
    accent: 'border-blue-400/60 hover:shadow-blue-500/20',
  },
  peach: {
    bg: 'from-orange-400/40 via-amber-300/25 to-orange-100/10',
    bar: 'from-orange-400 to-amber-300',
    glow: 'from-orange-400 via-amber-300 to-orange-400',
    accent: 'border-amber-400/60 hover:shadow-amber-500/20',
  },
  silver: {
    bg: 'from-gray-300/40 via-slate-200/25 to-gray-100/10',
    bar: 'from-gray-400 to-slate-300',
    glow: 'from-gray-400 via-slate-300 to-gray-400',
    accent: 'border-gray-400/60 hover:shadow-gray-500/20',
  },
  emerald: {
    bg: 'from-emerald-800/40 via-emerald-500/25 to-emerald-100/10',
    bar: 'from-emerald-800 to-emerald-600',
    glow: 'from-emerald-600 via-emerald-500 to-emerald-600',
    accent: 'border-emerald-400/60 hover:shadow-emerald-500/20',
  },
};

export const StudentCard = ({ student, onView, onEdit, onDelete, index }: StudentCardProps) => {
  const { currentTheme } = useColorTheme();
  const cardTheme = cardGradients[currentTheme] || cardGradients.default;

  const getStatusColor = () => {
    return 'bg-stat-green text-white';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03, duration: 0.2 }}
      className={cn(
        "relative rounded-xl shadow-card hover:shadow-lg transition-all duration-300 border border-border/50 group overflow-hidden",
        `hover:${cardTheme.accent}`
      )}
    >
      {/* Pulsing glow effect on hover */}
      <div className={cn(
        "absolute -inset-0.5 bg-gradient-to-r rounded-xl opacity-0 group-hover:opacity-100 blur-sm transition-opacity duration-300 animate-pulse pointer-events-none",
        cardTheme.glow
      )} />
      <div className="absolute inset-0 bg-card rounded-xl" />
      
      {/* Gradient Background that blends */}
      <div className={cn(
        "absolute inset-0 bg-gradient-to-b pointer-events-none rounded-xl",
        cardTheme.bg
      )} />
      <div className={cn(
        "absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r",
        cardTheme.bar
      )} />
      
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
