import { motion, AnimatePresence } from 'framer-motion';
import { Home, GraduationCap, BookOpen, ClipboardList, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StudentBottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const navItems = [
  { id: 'portal', label: 'Home', icon: Home },
  { id: 'student-grades', label: 'Grades', icon: GraduationCap },
  { id: 'library', label: 'Library', icon: BookOpen },
  { id: 'student-assignments', label: 'Tasks', icon: ClipboardList },
  { id: 'student-profile', label: 'Profile', icon: User },
];

export const StudentBottomNav = ({ activeTab, onTabChange }: StudentBottomNavProps) => {
  return (
    <nav
      className={cn(
        "student-bottom-nav fixed bottom-0 left-0 right-0 z-50 lg:hidden",
        "bg-background/80 backdrop-blur-xl border-t border-border/50",
        "shadow-[0_-4px_24px_rgba(0,0,0,0.06)]"
      )}
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="flex items-center justify-around px-2 h-16">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          const Icon = item.icon;

          return (
            <motion.button
              key={item.id}
              whileTap={{ scale: 0.85 }}
              onClick={() => onTabChange(item.id)}
              className={cn(
                "relative flex flex-col items-center justify-center gap-0.5 w-16 h-14 rounded-xl transition-colors",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              {/* Active indicator pill */}
              <AnimatePresence>
                {isActive && (
                  <motion.div
                    layoutId="bottomNavIndicator"
                    className="absolute -top-1 w-8 h-1 rounded-full bg-primary"
                    initial={{ opacity: 0, scaleX: 0 }}
                    animate={{ opacity: 1, scaleX: 1 }}
                    exit={{ opacity: 0, scaleX: 0 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
              </AnimatePresence>

              <motion.div
                animate={isActive ? { scale: 1.15 } : { scale: 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              >
                <Icon className="h-5 w-5" strokeWidth={isActive ? 2.5 : 2} />
              </motion.div>

              <span className={cn(
                "text-[10px] font-medium leading-tight",
                isActive && "font-semibold"
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
