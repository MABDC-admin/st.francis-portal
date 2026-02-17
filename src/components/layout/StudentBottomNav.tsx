import { STUDENT_ICONS, StudentPortalIcon } from '@/components/icons/StudentPortalIcons';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface StudentBottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const navItems = [
  { id: 'portal', label: 'Home', icon: '/assets/home.png' },
  { id: 'student-schedule', label: 'Timetable', icon: '/assets/timetable.png' },
  { id: 'student-assignments', label: 'Assignments', icon: '/assets/assignement.png' },
  { id: 'student-grades', label: 'Grades', icon: '/assets/grades.png' },
  { id: 'student-library', label: 'Library', icon: '/assets/library.png' },
];

export const StudentBottomNav = ({ activeTab, onTabChange }: StudentBottomNavProps) => {
  return (
    <nav
      className={cn(
        "student-bottom-nav fixed bottom-0 left-0 right-0 z-50 lg:hidden",
        "bg-white/80 backdrop-blur-2xl border-t border-white/40",
        "shadow-[0_-8px_32px_rgba(0,0,0,0.06)]"
      )}
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="flex items-center justify-around px-2 h-20">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;

          return (
            <motion.button
              key={item.id}
              whileTap={{ scale: 0.8 }}
              onClick={() => onTabChange(item.id)}
              className={cn(
                "relative flex flex-col items-center justify-center gap-0.5 w-16 h-16 transition-all duration-300",
                isActive ? "text-primary" : "text-slate-400"
              )}
            >
              <div
                className={cn(
                  "relative flex items-center justify-center h-12 w-12 transition-all duration-500",
                  isActive ? "scale-125 -translate-y-2" : "grayscale opacity-70"
                )}
              >
                <img
                  src={item.icon}
                  alt={item.label}
                  className={cn(
                    "w-full h-full object-contain drop-shadow-md transition-all duration-500",
                    isActive ? "drop-shadow-[0_4px_8px_rgba(0,0,0,0.2)]" : ""
                  )}
                />

                {/* Active Glow Effect */}
                {isActive && (
                  <div className="absolute -inset-2 bg-primary/20 blur-xl rounded-full -z-10 animate-pulse" />
                )}
              </div>

              <span className={cn(
                "text-[9px] font-black uppercase tracking-widest transition-all duration-300",
                isActive ? "text-primary opacity-100" : "text-slate-400 opacity-0"
              )}>
                {item.label}
              </span>
            </motion.button>
          );
        })}
      </div>
    </nav>
  );
};
