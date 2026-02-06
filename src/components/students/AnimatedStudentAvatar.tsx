import { useMemo } from 'react';
import { cn } from '@/lib/utils';

interface AnimatedStudentAvatarProps {
  photoUrl: string | null;
  name: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl';
  className?: string;
  enableAnimation?: boolean;
  borderColor?: string;
}

const sizeMap = {
  xs: 'h-6 w-6',
  sm: 'h-8 w-8',
  md: 'h-12 w-12',
  lg: 'h-16 w-16',
  xl: 'h-24 w-24',
  '2xl': 'h-32 w-32',
  '3xl': 'h-40 w-40',
  '4xl': 'h-48 w-48',
  '5xl': 'h-56 w-56',
};

const textSizeMap = {
  xs: 'text-[8px]',
  sm: 'text-xs',
  md: 'text-base',
  lg: 'text-xl',
  xl: 'text-3xl',
  '2xl': 'text-4xl',
  '3xl': 'text-5xl',
  '4xl': 'text-6xl',
  '5xl': 'text-7xl',
};

const eyeSizeMap = {
  xs: { eye: 'h-1 w-1', pupil: 'h-0.5 w-0.5' },
  sm: { eye: 'h-1.5 w-1.5', pupil: 'h-0.5 w-0.5' },
  md: { eye: 'h-2 w-2', pupil: 'h-1 w-1' },
  lg: { eye: 'h-2.5 w-2.5', pupil: 'h-1 w-1' },
  xl: { eye: 'h-3.5 w-3.5', pupil: 'h-1.5 w-1.5' },
  '2xl': { eye: 'h-4 w-4', pupil: 'h-2 w-2' },
  '3xl': { eye: 'h-5 w-5', pupil: 'h-2.5 w-2.5' },
  '4xl': { eye: 'h-6 w-6', pupil: 'h-3 w-3' },
  '5xl': { eye: 'h-7 w-7', pupil: 'h-3.5 w-3.5' },
};

const getInitials = (name: string) => {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

// Generate a consistent color based on name
const getAvatarColor = (name: string) => {
  const colors = [
    { bg: 'bg-cyan-500', face: 'bg-cyan-400' },
    { bg: 'bg-emerald-500', face: 'bg-emerald-400' },
    { bg: 'bg-violet-500', face: 'bg-violet-400' },
    { bg: 'bg-rose-500', face: 'bg-rose-400' },
    { bg: 'bg-amber-500', face: 'bg-amber-400' },
    { bg: 'bg-blue-500', face: 'bg-blue-400' },
    { bg: 'bg-pink-500', face: 'bg-pink-400' },
    { bg: 'bg-teal-500', face: 'bg-teal-400' },
  ];
  const index = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
  return colors[index];
};

// Stagger animation delays to prevent synchronized movement
const getAnimationDelay = (name: string) => {
  const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return `${(hash % 20) * 0.2}s`;
};

export const AnimatedStudentAvatar = ({
  photoUrl,
  name,
  size = 'md',
  className,
  enableAnimation = true,
  borderColor,
}: AnimatedStudentAvatarProps) => {
  const initials = useMemo(() => getInitials(name), [name]);
  const avatarColor = useMemo(() => getAvatarColor(name), [name]);
  const animationDelay = useMemo(() => getAnimationDelay(name), [name]);
  const eyeSize = eyeSizeMap[size];

  if (photoUrl) {
    // Photo avatar with breathing and swaying animations
    return (
      <div
        className={cn(
          sizeMap[size],
          'rounded-full overflow-hidden border-2 border-border shrink-0',
          enableAnimation && 'animate-avatar-float animate-avatar-breathe animate-avatar-sway',
          className
        )}
        style={{
          animationDelay,
          borderColor: borderColor,
        }}
      >
        <img
          src={photoUrl}
          alt={name}
          className="h-full w-full object-cover"
        />
      </div>
    );
  }

  // Character avatar with animated eyes
  return (
    <div
      className={cn(
        sizeMap[size],
        'rounded-full shrink-0 relative overflow-hidden border-2 border-border',
        avatarColor.bg,
        enableAnimation && 'animate-avatar-float',
        className
      )}
      style={{
        animationDelay,
        borderColor: borderColor,
      }}
    >
      {/* Face background */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {/* Eyes container */}
        <div className="flex items-center justify-center gap-[20%] mb-[5%]">
          {/* Left eye */}
          <div
            className={cn(
              eyeSize.eye,
              'bg-white rounded-full flex items-center justify-center relative overflow-hidden'
            )}
          >
            <div
              className={cn(
                eyeSize.pupil,
                'bg-slate-800 rounded-full',
                enableAnimation && 'animate-avatar-look'
              )}
              style={{ animationDelay }}
            />
            {/* Eyelid for blink */}
            <div
              className={cn(
                'absolute inset-0 rounded-full',
                avatarColor.face,
                enableAnimation && 'animate-avatar-blink'
              )}
              style={{ 
                animationDelay,
                transformOrigin: 'center top',
              }}
            />
          </div>
          
          {/* Right eye */}
          <div
            className={cn(
              eyeSize.eye,
              'bg-white rounded-full flex items-center justify-center relative overflow-hidden'
            )}
          >
            <div
              className={cn(
                eyeSize.pupil,
                'bg-slate-800 rounded-full',
                enableAnimation && 'animate-avatar-look'
              )}
              style={{ animationDelay }}
            />
            {/* Eyelid for blink */}
            <div
              className={cn(
                'absolute inset-0 rounded-full',
                avatarColor.face,
                enableAnimation && 'animate-avatar-blink'
              )}
              style={{ 
                animationDelay,
                transformOrigin: 'center top',
              }}
            />
          </div>
        </div>
        
        {/* Initials below eyes */}
        <span className={cn(textSizeMap[size], 'font-bold text-white/90 leading-none')}>
          {initials}
        </span>
      </div>
    </div>
  );
};
