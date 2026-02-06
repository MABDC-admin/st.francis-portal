import { Student } from '@/types/student';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { Phone, MapPin, GraduationCap, Calendar, User, BookOpen } from 'lucide-react';
import { AnimatedStudentAvatar } from './AnimatedStudentAvatar';

interface StudentHoverPreviewProps {
  student: Student;
  children: React.ReactNode;
}

export const StudentHoverPreview = ({ student, children }: StudentHoverPreviewProps) => {
  return (
    <HoverCard openDelay={300} closeDelay={100}>
      <HoverCardTrigger asChild>
        {children}
      </HoverCardTrigger>
      <HoverCardContent className="w-80 p-0" side="right" align="start">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-lime-400 p-4 rounded-t-md">
          <div className="flex items-center gap-3">
            <AnimatedStudentAvatar
              photoUrl={student.photo_url}
              name={student.student_name}
              size="lg"
              borderColor="rgba(255,255,255,0.5)"
            />
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-white text-sm truncate">
                {student.student_name}
              </h4>
              <p className="text-white/80 text-xs">{student.level}</p>
              <p className="text-white/60 text-[10px] font-mono">{student.lrn}</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-3 space-y-3">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Calendar className="h-3 w-3 text-emerald-500" />
              <span>{student.birth_date || 'N/A'}</span>
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <User className="h-3 w-3 text-emerald-500" />
              <span>{student.age ? `${student.age} yrs` : 'N/A'} • {student.gender || 'N/A'}</span>
            </div>
          </div>

          {/* Parents */}
          <div className="space-y-1.5">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Parents/Guardian</p>
            <div className="space-y-1 text-xs">
              {student.mother_maiden_name && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground truncate">Mother:</span>
                  <span className="font-medium truncate max-w-[60%]">{student.mother_maiden_name}</span>
                </div>
              )}
              {student.father_name && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground truncate">Father:</span>
                  <span className="font-medium truncate max-w-[60%]">{student.father_name}</span>
                </div>
              )}
            </div>
          </div>

          {/* Contact */}
          {(student.mother_contact || student.father_contact) && (
            <div className="space-y-1.5">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Contact</p>
              <div className="flex flex-wrap gap-2 text-xs">
                {student.mother_contact && (
                  <div className="flex items-center gap-1 text-muted-foreground bg-secondary/50 px-2 py-0.5 rounded">
                    <Phone className="h-3 w-3 text-stat-green" />
                    <span>{student.mother_contact}</span>
                  </div>
                )}
                {student.father_contact && (
                  <div className="flex items-center gap-1 text-muted-foreground bg-secondary/50 px-2 py-0.5 rounded">
                    <Phone className="h-3 w-3 text-stat-blue" />
                    <span>{student.father_contact}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Address */}
          {student.uae_address && (
            <div className="space-y-1">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">UAE Address</p>
              <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3 text-stat-orange flex-shrink-0 mt-0.5" />
                <span className="line-clamp-2">{student.uae_address}</span>
              </div>
            </div>
          )}

          {/* Previous School */}
          {student.previous_school && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-1 border-t border-border">
              <BookOpen className="h-3 w-3 text-emerald-500" />
              <span className="truncate">From: {student.previous_school}</span>
            </div>
          )}
        </div>

        {/* Footer hint */}
        <div className="px-3 pb-2">
          <p className="text-[10px] text-center text-muted-foreground/60">Click to view full profile</p>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
};
