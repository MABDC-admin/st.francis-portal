import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { 
  GraduationCap, 
  Users, 
  BarChart3, 
  Upload, 
  Moon, 
  Sun,
  Menu,
  ShieldAlert,
  LogOut,
  Home,
  BookOpen,
  UserCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/hooks/useTheme';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface DashboardLayoutProps {
  children: ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

// Role-specific navigation configurations
const getNavItemsForRole = (role: string | null) => {
  const baseItems = [
    { id: 'portal', icon: Home, label: 'Portal Home' },
  ];

  switch (role) {
    case 'admin':
      return [
        ...baseItems,
        { id: 'dashboard', icon: BarChart3, label: 'Dashboard' },
        { id: 'enrollment', icon: GraduationCap, label: 'Enrollment' },
        { id: 'students', icon: Users, label: 'Students' },
        { id: 'teachers', icon: BookOpen, label: 'Teachers' },
        { id: 'import', icon: Upload, label: 'Import CSV' },
      ];
    case 'registrar':
      return [
        ...baseItems,
        { id: 'dashboard', icon: BarChart3, label: 'Dashboard' },
        { id: 'enrollment', icon: GraduationCap, label: 'Enrollment' },
        { id: 'students', icon: Users, label: 'Students' },
        { id: 'teachers', icon: BookOpen, label: 'Teachers' },
        { id: 'import', icon: Upload, label: 'Import CSV' },
      ];
    case 'teacher':
      return [
        ...baseItems,
        { id: 'classes', icon: BookOpen, label: 'My Classes' },
      ];
    case 'student':
      return [
        ...baseItems,
        { id: 'profile', icon: UserCircle, label: 'My Profile' },
      ];
    case 'parent':
      return [
        ...baseItems,
        { id: 'children', icon: Users, label: 'My Children' },
      ];
    default:
      return baseItems;
  }
};

const adminItem = { id: 'admin', icon: ShieldAlert, label: 'Admin' };

const roleColors: Record<string, string> = {
  admin: 'bg-red-500',
  registrar: 'bg-blue-500',
  teacher: 'bg-green-500',
  student: 'bg-purple-500',
  parent: 'bg-orange-500',
};

const roleLabels: Record<string, string> = {
  admin: 'Administrator',
  registrar: 'Registrar',
  teacher: 'Teacher',
  student: 'Student',
  parent: 'Parent',
};

export const DashboardLayout = ({ children, activeTab, onTabChange }: DashboardLayoutProps) => {
  const { isDark, toggle } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, role, signOut } = useAuth();

  const navItems = getNavItemsForRole(role);

  const getInitials = (email: string) => {
    return email.substring(0, 2).toUpperCase();
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-card border-b border-border px-4 py-3 flex items-center justify-between">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-label="Toggle menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-2">
          <div className="gradient-primary p-2 rounded-lg">
            <GraduationCap className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-bold text-foreground">EduTrack</span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={toggle} aria-label="Toggle theme">
            {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
        </div>
      </header>

      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-foreground/20 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed left-0 top-0 z-50 h-full w-64 bg-card border-r border-border transform transition-transform duration-300 lg:translate-x-0 flex flex-col",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-6">
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3"
          >
            <div className="gradient-primary p-2.5 rounded-xl shadow-md">
              <GraduationCap className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-bold text-lg text-foreground">EduTrack</h1>
              <p className="text-xs text-muted-foreground">{roleLabels[role || ''] || 'Loading...'}</p>
            </div>
          </motion.div>
        </div>

        {/* User Info */}
        {user && (
          <div className="px-3 pb-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="w-full justify-start gap-3 h-auto py-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className={cn("text-white text-xs", roleColors[role || 'student'])}>
                      {getInitials(user.email || 'U')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col items-start text-left min-w-0">
                    <span className="text-sm font-medium truncate max-w-[140px]">{user.email}</span>
                    <Badge variant="secondary" className="text-xs capitalize mt-0.5">
                      {role || 'Loading...'}
                    </Badge>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut} className="text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}

        <nav className="px-3 space-y-1 flex-1">
          {navItems.map((item, index) => (
            <motion.button
              key={item.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => {
                onTabChange(item.id);
                setSidebarOpen(false);
              }}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all duration-200",
                activeTab === item.id
                  ? "bg-stat-purple text-white shadow-md"
                  : "text-muted-foreground hover:bg-secondary hover:text-secondary-foreground"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </motion.button>
          ))}
        </nav>

        {/* Bottom Section - Admin & Theme Toggle */}
        <div className="px-3 pb-6 space-y-2">
          {/* Admin Button - Only show for admin role */}
          {role === 'admin' && (
            <motion.button
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              onClick={() => {
                onTabChange(adminItem.id);
                setSidebarOpen(false);
              }}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all duration-200",
                activeTab === adminItem.id
                  ? "bg-destructive text-destructive-foreground shadow-md"
                  : "text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
              )}
            >
              <adminItem.icon className="h-5 w-5" />
              {adminItem.label}
            </motion.button>
          )}

          {/* Theme Toggle - Desktop */}
          <div className="hidden lg:block">
            <Button 
              variant="outline" 
              className="w-full justify-start gap-3" 
              onClick={toggle}
            >
              {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              {isDark ? 'Light Mode' : 'Dark Mode'}
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:ml-64 pt-16 lg:pt-0 min-h-screen">
        <div className="p-4 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
};
