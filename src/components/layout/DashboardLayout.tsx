import { ReactNode, useState, useEffect } from 'react';
import { motion, Reorder } from 'framer-motion';
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
  UserCircle,
  Library,
  Calendar,
  GripVertical,
  LucideIcon,
  FileSpreadsheet,
  FileText,
  Building2,
  ChevronDown,
  CalendarDays
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/hooks/useTheme';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useSchool, SCHOOL_THEMES, SchoolType } from '@/contexts/SchoolContext';
import { useAcademicYear } from '@/contexts/AcademicYearContext';
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
import { useSchoolSettings } from '@/hooks/useSchoolSettings';
import { useColorTheme } from '@/hooks/useColorTheme';
import { ColorThemeSelector } from '@/components/ColorThemeSelector';
import { Skeleton } from '@/components/ui/skeleton';

interface NavItem {
  id: string;
  icon: LucideIcon;
  label: string;
}

interface DashboardLayoutProps {
  children: ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

// Icon mapping for serialization
const iconMap: Record<string, LucideIcon> = {
  Home, BarChart3, Users, BookOpen, Library, Calendar, GraduationCap, Upload, UserCircle, FileSpreadsheet, FileText
};

const getNavItemsForRole = (role: string | null): NavItem[] => {
  const baseItems: NavItem[] = [
    { id: 'portal', icon: Home, label: 'Portal Home' },
  ];

  switch (role) {
    case 'admin':
      return [
        ...baseItems,
        { id: 'dashboard', icon: BarChart3, label: 'Dashboard' },
        { id: 'students', icon: Users, label: 'Students' },
        { id: 'teachers', icon: BookOpen, label: 'Teachers' },
        { id: 'grades', icon: FileSpreadsheet, label: 'Grades' },
        { id: 'subjects', icon: Library, label: 'Subjects' },
        { id: 'academic-years', icon: Calendar, label: 'Academic Years' },
        { id: 'subject-enrollment', icon: GraduationCap, label: 'Enrollment' },
        { id: 'reports', icon: FileText, label: 'Reports' },
        { id: 'enrollment', icon: GraduationCap, label: 'New Student' },
        { id: 'import', icon: Upload, label: 'Import CSV' },
      ];
    case 'registrar':
      return [
        ...baseItems,
        { id: 'dashboard', icon: BarChart3, label: 'Dashboard' },
        { id: 'students', icon: Users, label: 'Students' },
        { id: 'teachers', icon: BookOpen, label: 'Teachers' },
        { id: 'grades', icon: FileSpreadsheet, label: 'Grades' },
        { id: 'subjects', icon: Library, label: 'Subjects' },
        { id: 'subject-enrollment', icon: GraduationCap, label: 'Enrollment' },
        { id: 'reports', icon: FileText, label: 'Reports' },
        { id: 'enrollment', icon: GraduationCap, label: 'New Student' },
        { id: 'import', icon: Upload, label: 'Import CSV' },
      ];
    case 'teacher':
      return [
        ...baseItems,
        { id: 'classes', icon: BookOpen, label: 'My Classes' },
        { id: 'grades', icon: FileSpreadsheet, label: 'Grades' },
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
  const [isDragging, setIsDragging] = useState(false);
  const { selectedSchool, setSelectedSchool, schoolTheme, setCanSwitchSchool } = useSchool();
  const { academicYears, selectedYearId, selectedYear, setSelectedYearId, isLoading: isLoadingYears } = useAcademicYear();
  const { data: schoolSettings } = useSchoolSettings(selectedSchool);
  const { theme, currentTheme, selectTheme } = useColorTheme();

  // Admin and Registrar can switch schools
  const canSwitch = role === 'admin' || role === 'registrar';

  useEffect(() => {
    setCanSwitchSchool(canSwitch);
  }, [canSwitch, setCanSwitchSchool]);

  // Use school theme when no custom theme is set
  const hasCustomTheme = currentTheme !== 'default';
  const effectiveTheme = hasCustomTheme ? theme : schoolTheme;

  const defaultNavItems = getNavItemsForRole(role);
  
  // Load saved menu order from localStorage
  const [navItems, setNavItems] = useState<NavItem[]>(defaultNavItems);
  
  useEffect(() => {
    if (role === 'admin') {
      const savedOrder = localStorage.getItem(`menu-order-${role}`);
      if (savedOrder) {
        try {
          const orderIds = JSON.parse(savedOrder) as string[];
          const reorderedItems = orderIds
            .map(id => defaultNavItems.find(item => item.id === id))
            .filter((item): item is NavItem => item !== undefined);
          
          // Add any new items that weren't in the saved order
          const newItems = defaultNavItems.filter(item => !orderIds.includes(item.id));
          setNavItems([...reorderedItems, ...newItems]);
        } catch {
          setNavItems(defaultNavItems);
        }
      } else {
        setNavItems(defaultNavItems);
      }
    } else {
      setNavItems(defaultNavItems);
    }
  }, [role]);

  const handleReorder = (newOrder: NavItem[]) => {
    setNavItems(newOrder);
    if (role === 'admin') {
      localStorage.setItem(`menu-order-${role}`, JSON.stringify(newOrder.map(item => item.id)));
    }
  };

  const getInitials = (email: string) => {
    return email.substring(0, 2).toUpperCase();
  };

  return (
    <div className={cn(
      "min-h-screen bg-background theme-transition",
      effectiveTheme.pageBg
    )}>
      {/* Mobile Header */}
      <header className={cn(
        "lg:hidden fixed top-0 left-0 right-0 z-50 border-b border-border px-4 py-3 flex items-center justify-between theme-transition",
        `bg-gradient-to-r ${effectiveTheme.sidebarBg} ${effectiveTheme.sidebarText}`
      )}>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-label="Toggle menu"
          className="text-inherit hover:bg-white/10"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg overflow-hidden bg-white flex items-center justify-center">
            {schoolSettings?.logo_url ? (
              <img src={schoolSettings.logo_url} alt="Logo" className="w-full h-full object-contain" />
            ) : (
              <div className={cn("w-full h-full flex items-center justify-center bg-gradient-to-br", effectiveTheme.sidebarBg)}>
                <GraduationCap className="h-5 w-5 text-white" />
              </div>
            )}
          </div>
          <span className="font-bold text-inherit">
            {schoolSettings?.acronym || selectedSchool}
          </span>
          {canSwitch && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 px-2 text-inherit hover:bg-white/10">
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Switch School</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setSelectedSchool('MABDC')}>
                  <Building2 className="h-4 w-4 mr-2 text-emerald-500" />
                  MABDC
                  {selectedSchool === 'MABDC' && <span className="ml-auto">✓</span>}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSelectedSchool('STFXSA')}>
                  <Building2 className="h-4 w-4 mr-2 text-blue-500" />
                  STFXSA
                  {selectedSchool === 'STFXSA' && <span className="ml-auto">✓</span>}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={toggle} 
            aria-label="Toggle theme"
            className="text-inherit hover:bg-white/10"
          >
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
        "fixed left-0 top-0 z-50 h-full w-64 border-r border-border transform transition-all duration-500 lg:translate-x-0 flex flex-col theme-transition",
        sidebarOpen ? "translate-x-0" : "-translate-x-full",
        `bg-gradient-to-b ${effectiveTheme.sidebarBg} ${effectiveTheme.sidebarText}`
      )}>
        <div className="p-6">
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3"
          >
            <div className="w-12 h-12 rounded-xl shadow-md overflow-hidden bg-white flex items-center justify-center">
              {schoolSettings?.logo_url ? (
                <img src={schoolSettings.logo_url} alt="Logo" className="w-full h-full object-contain p-1" />
              ) : (
                <div className={cn("w-full h-full flex items-center justify-center bg-gradient-to-br", effectiveTheme.sidebarBg)}>
                  <GraduationCap className="h-6 w-6 text-white" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1">
                <h1 className="font-bold text-lg truncate text-inherit">
                  {schoolSettings?.acronym || selectedSchool}
                </h1>
              </div>
              <p className="text-xs text-inherit/70">
                {roleLabels[role || ''] || 'Loading...'}
              </p>
            </div>
          </motion.div>
          
          {/* School Switcher for Admin/Registrar */}
          {canSwitch && (
            <div className="mt-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    className="w-full justify-between text-inherit hover:bg-white/10 border border-white/20"
                  >
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      <span className="text-sm">{selectedSchool}</span>
                    </div>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-[200px]">
                  <DropdownMenuLabel>Switch School Portal</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => setSelectedSchool('MABDC')}
                    className={selectedSchool === 'MABDC' ? 'bg-emerald-50 dark:bg-emerald-950' : ''}
                  >
                    <div className="flex items-center gap-2 flex-1">
                      <div className="w-3 h-3 rounded-full bg-emerald-500" />
                      <span>MABDC</span>
                    </div>
                    {selectedSchool === 'MABDC' && <span className="text-emerald-500">✓</span>}
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => setSelectedSchool('STFXSA')}
                    className={selectedSchool === 'STFXSA' ? 'bg-blue-50 dark:bg-blue-950' : ''}
                  >
                    <div className="flex items-center gap-2 flex-1">
                      <div className="w-3 h-3 rounded-full bg-blue-500" />
                      <span>STFXSA</span>
                    </div>
                    {selectedSchool === 'STFXSA' && <span className="text-blue-500">✓</span>}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}

          {/* Academic Year Switcher */}
          {canSwitch && (
            <div className="mt-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    className="w-full justify-between text-inherit hover:bg-white/10 border border-white/20"
                  >
                    <div className="flex items-center gap-2">
                      <CalendarDays className="h-4 w-4" />
                      {isLoadingYears ? (
                        <Skeleton className="h-4 w-20 bg-white/20" />
                      ) : (
                        <span className="text-sm truncate">{selectedYear?.name || 'Select Year'}</span>
                      )}
                    </div>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-[200px] max-h-[300px] overflow-y-auto">
                  <DropdownMenuLabel>Academic Year</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {academicYears.map((year) => (
                    <DropdownMenuItem 
                      key={year.id}
                      onClick={() => setSelectedYearId(year.id)}
                      className={selectedYearId === year.id ? 'bg-primary/10' : ''}
                    >
                      <div className="flex items-center gap-2 flex-1">
                        <CalendarDays className="h-3 w-3 opacity-50" />
                        <span>{year.name}</span>
                        {year.is_current && (
                          <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4">Current</Badge>
                        )}
                      </div>
                      {selectedYearId === year.id && <span className="text-primary">✓</span>}
                    </DropdownMenuItem>
                  ))}
                  {academicYears.length === 0 && !isLoadingYears && (
                    <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                      No academic years found
                    </div>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>

        {/* User Info */}
        {user && (
          <div className="px-3 pb-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  className="w-full justify-start gap-3 h-auto py-3 hover:bg-white/10"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className={cn("text-white text-xs", roleColors[role || 'student'])}>
                      {getInitials(user.email || 'U')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col items-start text-left min-w-0">
                    <span className="text-sm font-medium truncate max-w-[140px] text-inherit">
                      {user.email}
                    </span>
                    <Badge variant="secondary" className="text-xs capitalize mt-0.5 bg-white/20 text-inherit">
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

        {role === 'admin' ? (
          <Reorder.Group 
            axis="y" 
            values={navItems} 
            onReorder={handleReorder}
            className="px-3 space-y-1 flex-1"
          >
            {navItems.map((item) => (
              <Reorder.Item
                key={item.id}
                value={item}
                onDragStart={() => setIsDragging(true)}
                onDragEnd={() => setIsDragging(false)}
                className="list-none"
                whileDrag={{ scale: 1.02, boxShadow: "0 4px 20px rgba(0,0,0,0.15)" }}
              >
                <button
                  onClick={() => {
                    if (!isDragging) {
                      onTabChange(item.id);
                      setSidebarOpen(false);
                    }
                  }}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all duration-200 cursor-grab active:cursor-grabbing",
                    activeTab === item.id
                      ? `${effectiveTheme.menuActiveBg} ${effectiveTheme.menuActiveText} shadow-md`
                      : `text-inherit/80 ${effectiveTheme.menuHoverBg}`
                  )}
                >
                  <GripVertical className="h-4 w-4 opacity-40" />
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </button>
              </Reorder.Item>
            ))}
          </Reorder.Group>
        ) : (
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
                    ? `${effectiveTheme.menuActiveBg} ${effectiveTheme.menuActiveText} shadow-md`
                    : `text-inherit/80 ${effectiveTheme.menuHoverBg}`
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </motion.button>
            ))}
          </nav>
        )}

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
                  : "text-inherit/80 hover:bg-white/10 hover:text-red-300"
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
              className="w-full justify-start gap-3 border-white/20 text-inherit hover:bg-white/10"
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
