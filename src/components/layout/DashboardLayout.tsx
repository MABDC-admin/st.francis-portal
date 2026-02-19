import { ReactNode, useState, useEffect } from 'react';
import { motion, Reorder } from 'framer-motion';
import {
  Menu,
  Moon,
  Sun,
  Search,
  ChevronDown,
  LogOut,
  ShieldAlert,
  GraduationCap,
  Building2,
  CalendarDays,
  GripVertical,
  UserCircle,
  Users,
  BookOpen,
  FileSpreadsheet,
  Library,
  FileText,
  Upload,
  ChevronLeft,
  ChevronRight,
  LucideIcon,
  Home,
  BarChart3,
  Calendar,
  Lock,
  Unlock,
  Loader2
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/hooks/useTheme';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useSchool, SCHOOL_THEMES, SchoolType } from '@/contexts/SchoolContext';
import { useAcademicYear } from '@/contexts/AcademicYearContext';
import { useDashboardLayout } from '@/contexts/DashboardLayoutContext';
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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { StudentBottomNav } from './StudentBottomNav';
import { useRegistrationNotifications } from '@/hooks/useRegistrationNotifications';
import { NotificationBell } from '@/components/registration/NotificationBell';
import {
  type NavItem,
  type NavGroup,
  getNavGroupsForRole,
  getIconForItem,
  isGroupActive,
  adminItem,
  roleColors,
  roleLabels,
} from '@/config/dashboardConfig';

interface DashboardLayoutProps {
  children: ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
}


export const DashboardLayout = ({ children, activeTab, onTabChange }: DashboardLayoutProps) => {
  const { isDark, toggle } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { user, role, signOut } = useAuth();
  const [isDragging, setIsDragging] = useState(false);
  const [isMenuLocked, setIsMenuLocked] = useState(true);
  const { selectedSchool, schoolTheme } = useSchool();
  const { academicYears, selectedYearId, selectedYear, setSelectedYearId, isLoading: isLoadingYears } = useAcademicYear();
  const { data: schoolSettings } = useSchoolSettings(selectedSchool);
  const { theme, currentTheme, selectTheme } = useColorTheme();
  const { layoutStyle } = useDashboardLayout();
  const { unreadCount, newRegistrations, markAllRead } = useRegistrationNotifications();

  // Track open groups
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  // Check if Apple theme is active
  const isAppleTheme = layoutStyle === 'apple';

  // Enable academic year switching in sidebar
  const canSwitch = true;

  // Use school theme when no custom theme is set
  const hasCustomTheme = currentTheme !== 'default';
  const effectiveTheme = hasCustomTheme ? theme : schoolTheme;

  const navGroups = getNavGroupsForRole(role);

  // Initialize open groups based on active tab
  useEffect(() => {
    const newOpenGroups: Record<string, boolean> = {};
    navGroups.forEach(group => {
      if (group.isCollapsible && isGroupActive(group, activeTab)) {
        newOpenGroups[group.id] = true;
      }
    });
    setOpenGroups(prev => ({ ...prev, ...newOpenGroups }));
  }, [activeTab, role]);

  const toggleSidebar = () => setIsCollapsed(!isCollapsed);

  const toggleGroup = (groupId: string) => {
    setOpenGroups(prev => ({ ...prev, [groupId]: !prev[groupId] }));
  };

  const getInitials = (email: string) => {
    return email.substring(0, 2).toUpperCase();
  };

  const navVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        type: "spring" as const,
        stiffness: 300,
        damping: 30
      }
    }
  };

  // Render a single nav item (for both standalone and grouped items)
  const renderNavItem = (item: NavItem, isNested: boolean = false) => {
    const IconComponent = getIconForItem(item.id, isAppleTheme);
    const isActive = activeTab === item.id;

    return (
      <motion.button
        key={item.id}
        variants={itemVariants}
        whileHover={isAppleTheme ? { scale: 1.01 } : { x: isNested ? 3 : 5, scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => {
          onTabChange(item.id);
          setSidebarOpen(false);
        }}
        className={cn(
          "w-full flex items-center gap-3 font-medium transition-all duration-200 relative overflow-hidden",
          isNested ? "px-3 py-2 text-sm" : "px-3 py-2.5",
          isAppleTheme
            ? cn(
              "rounded-xl",
              isActive
                ? "bg-[#007AFF] text-white shadow-sm"
                : "text-gray-700 hover:bg-black/5"
            )
            : cn(
              "rounded-lg",
              isActive
                ? `${effectiveTheme.menuActiveBg} ${effectiveTheme.menuActiveText} shadow-md`
                : `text-inherit/80 ${effectiveTheme.menuHoverBg} hover:bg-yellow-400/20 hover:text-yellow-700 dark:hover:text-yellow-300 transition-colors`
            ),
          isCollapsed && "justify-center px-2"
        )}
        role="menuitem"
        aria-current={isActive ? 'page' : undefined}
        aria-label={item.label}
        title={isCollapsed ? item.label : undefined}
      >
        {isActive && !isAppleTheme && (
          <motion.div
            layoutId="activeTabBackground"
            className="absolute inset-0 bg-white/20 dark:bg-black/20"
            initial={false}
            transition={{ type: "spring", stiffness: 350, damping: 30 }}
          />
        )}
        <IconComponent className={cn(
          isNested ? "h-4 w-4" : "h-5 w-5",
          "flex-shrink-0 z-10",
          isAppleTheme && !isActive && "text-gray-500"
        )} />
        {!isCollapsed && <span className={cn("truncate z-10", isAppleTheme && "text-[13px]")}>{item.label}</span>}
        {!isCollapsed && (item.id === 'registrations' || item.id === 'online-registration') && unreadCount > 0 && (
          <div className="ml-auto z-10" onClick={(e) => e.stopPropagation()}>
            <NotificationBell
              unreadCount={unreadCount}
              newRegistrations={newRegistrations}
              onViewAll={() => { onTabChange('registrations'); markAllRead(); setSidebarOpen(false); }}
              onMarkRead={markAllRead}
            />
          </div>
        )}
      </motion.button>
    );
  };

  // Render a collapsible group
  const renderNavGroup = (group: NavGroup) => {
    if (!group.isCollapsible || !group.items) {
      return renderNavItem({ id: group.id, icon: group.icon, label: group.label });
    }

    const IconComponent = getIconForItem(group.id, isAppleTheme);
    const isOpen = openGroups[group.id] || false;
    const hasActiveChild = group.items.some(item => item.id === activeTab);

    if (isCollapsed) {
      // In collapsed mode, show first item of group or expand on hover
      return (
        <div key={group.id} className="relative group">
          <motion.button
            variants={itemVariants}
            className={cn(
              "w-full flex items-center justify-center px-2 py-2.5 rounded-lg transition-all duration-200",
              hasActiveChild
                ? isAppleTheme
                  ? "bg-[#007AFF] text-white"
                  : `${effectiveTheme.menuActiveBg} ${effectiveTheme.menuActiveText}`
                : "text-inherit/80 hover:bg-white/10"
            )}
            title={group.label}
            aria-label={group.label}
          >
            <IconComponent className="h-5 w-5" />
          </motion.button>
        </div>
      );
    }

    return (
      <Collapsible
        key={group.id}
        open={isOpen}
        onOpenChange={() => toggleGroup(group.id)}
      >
        <CollapsibleTrigger asChild>
          <motion.button
            variants={itemVariants}
            whileHover={isAppleTheme ? { scale: 1.01 } : { x: 3 }}
            className={cn(
              "w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all duration-200",
              isAppleTheme
                ? cn(
                  hasActiveChild ? "bg-black/5" : "hover:bg-black/5",
                  "text-gray-700"
                )
                : cn(
                  hasActiveChild ? "bg-white/10" : "hover:bg-white/10",
                  "text-inherit/80"
                )
            )}
            aria-expanded={isOpen}
            aria-label={`${group.label} section, ${isOpen ? 'expanded' : 'collapsed'}`}
          >
            <div className="flex items-center gap-3">
              <IconComponent className={cn(
                "h-5 w-5 flex-shrink-0",
                isAppleTheme && "text-gray-500"
              )} />
              <span className={cn("font-medium", isAppleTheme && "text-[13px]")}>{group.label}</span>
            </div>
            <ChevronDown className={cn(
              "h-4 w-4 transition-transform duration-200",
              isOpen && "rotate-180"
            )} />
          </motion.button>
        </CollapsibleTrigger>
        <CollapsibleContent className="overflow-hidden data-[state=open]:animate-none data-[state=closed]:animate-none">
          <div className="ml-4 pl-2 border-l border-white/20 space-y-0.5 mt-1">
            {group.items.map(item => renderNavItem(item, true))}
          </div>
        </CollapsibleContent>
      </Collapsible>
    );
  };

  return (
    <div className={cn(
      "min-h-screen bg-background theme-transition",
      currentTheme === 'pastel'
        ? "bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-green-100 via-stone-50 to-orange-50 dark:from-green-900/20 dark:via-stone-900 dark:to-orange-900/20"
        : effectiveTheme.pageBg
    )}>
      <header className={cn(
        "lg:hidden fixed top-0 left-0 right-0 z-50 px-4 py-3 flex items-center justify-between theme-transition",
        role === 'student'
          ? "bg-transparent border-none"
          : cn("border-b border-border `bg-gradient-to-r` ", effectiveTheme.sidebarBg, effectiveTheme.sidebarText)
      )}>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-label="Toggle menu"
          className={cn(
            "text-inherit hover:bg-white/10",
            role === 'student' && "bg-white/20 backdrop-blur-md shadow-md rounded-full text-white"
          )}
        >
          <Menu className="h-5 w-5" />
        </Button>
        {role !== 'student' && (
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
          </div>
        )}
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
        "fixed left-0 top-0 z-50 h-full border-r transform transition-all duration-300 flex flex-col theme-transition",
        sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        isCollapsed ? "w-[70px]" : "w-64",
        isAppleTheme
          ? "apple-sidebar border-r-black/5 text-gray-800"
          : currentTheme === 'pastel'
            ? "bg-white/40 dark:bg-black/20 backdrop-blur-md border-r-white/20 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)]"
            : currentTheme !== 'default'
              ? `bg-gradient-to-b ${effectiveTheme.sidebarBg} ${effectiveTheme.sidebarText} border-border`
              : "bg-gradient-to-b from-success to-success/90 text-white border-border"
      )}>
        <div className={cn("p-4 flex items-center justify-between", isCollapsed && "justify-center")}>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={cn("flex items-center gap-3", isCollapsed && "hidden")}
          >
            <div className="w-8 h-8 rounded-lg shadow-sm overflow-hidden bg-white flex items-center justify-center flex-shrink-0">
              {schoolSettings?.logo_url ? (
                <img src={schoolSettings.logo_url} alt="Logo" className="w-full h-full object-contain p-0.5" />
              ) : (
                <div className={cn("w-full h-full flex items-center justify-center bg-gradient-to-br", effectiveTheme.sidebarBg)}>
                  <GraduationCap className="h-4 w-4 text-white" />
                </div>
              )}
            </div>
            <h1 className="font-bold text-sm truncate text-inherit">
              {schoolSettings?.acronym || selectedSchool}
            </h1>
          </motion.div>

          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="hidden lg:flex h-6 w-6 text-inherit/50 hover:text-inherit hover:bg-black/5 dark:hover:bg-white/10"
          >
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>


        {/* Academic Year Switcher */}
        {!isCollapsed && role !== 'student' && (
          <div className="px-3 mt-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-between text-inherit border",
                    isAppleTheme
                      ? "hover:bg-black/5 border-black/10"
                      : "hover:bg-white/10 border-white/20"
                  )}
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
              <DropdownMenuContent align="start" className="w-[220px] max-h-[300px] overflow-y-auto bg-popover z-50">
                <DropdownMenuLabel>Academic Year</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {academicYears.map((year) => (
                  <DropdownMenuItem
                    key={year.id}
                    onClick={() => setSelectedYearId(year.id)}
                    className={selectedYearId === year.id ? 'bg-primary/10' : ''}
                  >
                    <div className="flex items-center gap-2 flex-1">
                      {year.is_archived ? (
                        <Lock className="h-3 w-3 opacity-50" />
                      ) : (
                        <CalendarDays className="h-3 w-3 opacity-50" />
                      )}
                      <span>{year.name}</span>
                      {year.is_current && (
                        <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4">Current</Badge>
                      )}
                    </div>
                    {selectedYearId === year.id && <span className="text-primary">âœ“</span>}
                  </DropdownMenuItem>
                ))}
                {academicYears.length === 0 && !isLoadingYears && (
                  <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                    No academic years found
                  </div>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
            {/* Read-only indicator */}
            {selectedYear && !selectedYear.is_current && (
              <div className={cn(
                "mt-1.5 flex items-center gap-1.5 text-[11px] px-2 py-1 rounded-md",
                isAppleTheme
                  ? "text-amber-600 bg-amber-50"
                  : "text-amber-300 bg-amber-900/30"
              )}>
                <Lock className="h-3 w-3 shrink-0" />
                <span>Read-only</span>
              </div>
            )}
          </div>
        )}
        {isCollapsed && role !== 'student' && (
          <div className="px-2 mt-2 flex justify-center" title={selectedYear?.name || 'Academic Year'}>
            <CalendarDays className="h-5 w-5 opacity-70" />
          </div>
        )}

        {/* Navigation */}
        <motion.nav
          className="px-2 space-y-1 flex-1 overflow-y-auto overflow-x-hidden mt-4"
          variants={navVariants}
          initial="hidden"
          animate="visible"
          aria-label="Main navigation"
          role="menu"
        >
          {navGroups.map((group) => renderNavGroup(group))}

          {/* Student-specific Sign Out button after menu items */}
          {role === 'student' && (
            <motion.button
              variants={itemVariants}
              initial="hidden"
              animate="visible"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={signOut}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 mt-16 font-medium transition-all duration-200 rounded-lg",
                isAppleTheme
                  ? "text-[#FF3B30] hover:bg-[#FF3B30]/10 rounded-xl"
                  : "text-inherit/80 hover:bg-white/10 hover:text-red-300"
              )}
            >
              <LogOut className="h-5 w-5 flex-shrink-0" />
              {!isCollapsed && <span className={cn(isAppleTheme && "text-[13px]")}>Sign Out</span>}
            </motion.button>
          )}
        </motion.nav>

        {/* Bottom Section - Admin */}
        <div className="px-3 pb-6 space-y-2">
          {/* Admin Button - Only show for admin role */}
          {role === 'admin' && !isCollapsed && (() => {
            const AdminIconComponent = getIconForItem('admin', isAppleTheme);
            return (
              <motion.button
                variants={itemVariants}
                initial="hidden"
                animate="visible"
                whileHover={isAppleTheme ? { scale: 1.01 } : { x: 5, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  onTabChange(adminItem.id);
                  setSidebarOpen(false);
                }}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 font-medium transition-all duration-200 relative overflow-hidden",
                  isAppleTheme
                    ? cn(
                      "rounded-xl",
                      activeTab === adminItem.id
                        ? "bg-[#FF3B30] text-white shadow-sm"
                        : "text-[#FF3B30] hover:bg-[#FF3B30]/10"
                    )
                    : cn(
                      "rounded-lg",
                      activeTab === adminItem.id
                        ? "bg-destructive text-destructive-foreground shadow-md"
                        : "text-inherit/80 hover:bg-white/10 hover:text-red-300"
                    )
                )}
              >
                {activeTab === adminItem.id && !isAppleTheme && (
                  <motion.div
                    layoutId="activeTabBackground"
                    className="absolute inset-0 bg-white/20 dark:bg-black/20"
                    initial={false}
                    transition={{ type: "spring", stiffness: 350, damping: 30 }}
                  />
                )}
                <AdminIconComponent className="h-5 w-5 z-10" />
                <span className={cn("z-10", isAppleTheme && "text-[13px]")}>{adminItem.label}</span>
              </motion.button>
            );
          })()}

          {/* Logout Button */}
          {!isCollapsed && (
            <motion.button
              variants={itemVariants}
              initial="hidden"
              animate="visible"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={signOut}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 font-medium transition-all duration-200 rounded-lg",
                isAppleTheme
                  ? "text-[#FF3B30] hover:bg-[#FF3B30]/10 rounded-xl"
                  : "text-inherit/80 hover:bg-white/10 hover:text-red-300"
              )}
            >
              <LogOut className="h-5 w-5 flex-shrink-0" />
              <span className={cn(isAppleTheme && "text-[13px]")}>Sign Out</span>
            </motion.button>
          )}
          {isCollapsed && (
            <motion.button
              variants={itemVariants}
              initial="hidden"
              animate="visible"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={signOut}
              className={cn(
                "w-full flex items-center justify-center px-2 py-2.5 rounded-lg transition-all duration-200",
                isAppleTheme
                  ? "text-[#FF3B30] hover:bg-[#FF3B30]/10"
                  : "text-inherit/80 hover:bg-white/10 hover:text-red-300"
              )}
              title="Sign Out"
            >
              <LogOut className="h-5 w-5" />
            </motion.button>
          )}
        </div>
      </aside>

      <main className={cn(
        "transition-all duration-300 min-h-screen",
        role === 'student' ? "pt-0" : "pt-16 lg:pt-0",
        isCollapsed ? "lg:pl-[70px]" : "lg:pl-64",
        role === 'student' && "pb-20 lg:pb-0"
      )}>
        <div className="p-4 lg:p-8">
          {children}
        </div>
      </main>

      {/* Student Bottom Navigation - Mobile Only */}
      {role === 'student' && (
        <StudentBottomNav activeTab={activeTab} onTabChange={onTabChange} />
      )}

    </div>
  );
};
