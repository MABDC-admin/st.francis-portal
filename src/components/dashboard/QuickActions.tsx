import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { AdmitStudentIcon3D, ScheduleIcon3D, EnterGradeIcon3D, EventsIcon3D } from '@/components/icons/ThreeDIcons';
import { AppleAdmitIcon, AppleScheduleIcon, AppleGradesIcon, AppleEventsIcon } from '@/components/icons/AppleStyleIcons';
import { LayoutStyle } from '@/contexts/DashboardLayoutContext';
import useEmblaCarousel from 'embla-carousel-react';
import { useCallback, useEffect, useState } from 'react';

interface QuickActionsProps {
  onNavigate: (tab: string) => void;
  variant?: LayoutStyle;
}

export const QuickActions = ({ onNavigate, variant = 'modern' }: QuickActionsProps) => {
  const isClassic = variant === 'classicBlue';
  const isApple = variant === 'apple';

  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: 'start',
    loop: true,
    dragFree: true,
  });

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollSnaps, setScrollSnaps] = useState<number[]>([]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    setScrollSnaps(emblaApi.scrollSnapList());
    emblaApi.on('select', onSelect);
    onSelect();
    return () => { emblaApi.off('select', onSelect); };
  }, [emblaApi, onSelect]);

  const actions = [
    {
      icon: isApple ? AppleAdmitIcon : AdmitStudentIcon3D,
      label: 'Admit Learner',
      onClick: () => onNavigate('enrollment'),
      bgClass: isApple ? 'apple-card' : isClassic ? 'classic-card' : 'bg-card hover:bg-muted',
      iconBg: isApple ? 'bg-[#007AFF]/10' : 'bg-info/10',
      iconColor: isApple ? 'text-[#007AFF]' : 'text-info',
    },
    {
      icon: isApple ? AppleEventsIcon : EventsIcon3D,
      label: 'Messages',
      onClick: () => onNavigate('messages'),
      bgClass: isApple ? 'apple-card' : isClassic ? 'classic-card' : 'bg-card hover:bg-muted',
      iconBg: isApple ? 'bg-[#34C759]/10' : 'bg-success/10',
      iconColor: isApple ? 'text-[#34C759]' : 'text-success',
    },
    {
      icon: isApple ? AppleScheduleIcon : ScheduleIcon3D,
      label: 'Schedule',
      onClick: () => onNavigate('academic-years'),
      bgClass: isApple ? 'apple-card' : isClassic ? 'classic-card' : 'bg-card hover:bg-muted',
      iconBg: isApple ? 'bg-[#FF9500]/10' : 'bg-warning/10',
      iconColor: isApple ? 'text-[#FF9500]' : 'text-warning',
    },
    {
      icon: isApple ? AppleGradesIcon : EnterGradeIcon3D,
      label: 'Enter Grades',
      onClick: () => onNavigate('grades'),
      bgClass: isApple ? 'apple-card' : isClassic ? 'classic-card' : 'bg-card hover:bg-muted',
      iconBg: isApple ? 'bg-[#AF52DE]/10' : 'bg-stat-purple/10',
      iconColor: isApple ? 'text-[#AF52DE]' : 'text-stat-purple',
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="mb-6"
    >
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex -ml-3">
          {actions.map((action, index) => (
            <div
              key={action.label}
              className="min-w-0 shrink-0 grow-0 basis-1/2 lg:basis-1/4 pl-3"
            >
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  delay: 0.2 + index * 0.05,
                  type: "spring",
                  stiffness: 260,
                  damping: 20
                }}
                whileHover={isApple ? {
                  scale: 1.02,
                  y: -4,
                  boxShadow: "0 8px 24px rgba(0, 0, 0, 0.08)"
                } : {
                  rotateX: -15,
                  y: -8,
                  scale: 1.02,
                  boxShadow: isClassic
                    ? "0 25px 30px -5px rgb(0 0 0 / 0.15), 0 10px 15px -6px rgb(0 0 0 / 0.15)"
                    : "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)"
                }}
                whileTap={{ scale: 0.98 }}
                onClick={action.onClick}
                style={isApple ? {} : {
                  transformOrigin: "top",
                  perspective: "1000px"
                }}
                className={cn(
                  "w-full p-4 flex flex-col items-center gap-2 transition-all",
                  isApple ? "rounded-[16px] border-0" : isClassic ? "rounded-2xl border-0" : "rounded-xl border border-border",
                  action.bgClass
                )}
              >
                <div className={cn(
                  "p-2 h-12 w-12 flex items-center justify-center",
                  isApple ? "rounded-xl" : "rounded-full",
                  action.iconBg
                )}>
                  <action.icon className={cn(
                    "h-full w-full",
                    isApple ? action.iconColor : "drop-shadow-sm"
                  )} />
                </div>
                <span className={cn(
                  "font-medium text-foreground",
                  isApple ? "text-[13px] font-medium" : "text-sm"
                )}>{action.label}</span>
              </motion.button>
            </div>
          ))}
        </div>
      </div>
      {/* Dot indicators */}
      <div className="flex justify-center gap-1.5 mt-3">
        {scrollSnaps.map((_, index) => (
          <button
            key={index}
            onClick={() => emblaApi?.scrollTo(index)}
            className={cn(
              "h-1.5 rounded-full transition-all duration-300",
              index === selectedIndex
                ? "w-4 bg-primary"
                : "w-1.5 bg-muted-foreground/30"
            )}
          />
        ))}
      </div>
    </motion.div>
  );
};
