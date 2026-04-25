import { resolveSchoolLogo } from '@/lib/schoolBranding';
import { cn } from '@/lib/utils';

interface SchoolLogoProps {
  src?: string | null;
  alt?: string;
  className?: string;
  imageClassName?: string;
}

export const SchoolLogo = ({
  src,
  alt = 'School logo',
  className,
  imageClassName,
}: SchoolLogoProps) => {
  return (
    <div className={cn('overflow-hidden rounded-full bg-white', className)}>
      <img
        src={resolveSchoolLogo(src)}
        alt={alt}
        className={cn('h-full w-full object-cover', imageClassName)}
      />
    </div>
  );
};
