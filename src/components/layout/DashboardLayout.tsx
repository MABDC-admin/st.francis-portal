import { ReactNode, useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronRight,
  Eye,
  HelpCircle,
  Lock,
  Menu,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Sun,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { NotificationBell } from "@/components/registration/NotificationBell";
import { useTheme } from "@/hooks/useTheme";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useSchool } from "@/contexts/SchoolContext";
import { useAcademicYear } from "@/contexts/AcademicYearContext";
import { useSchoolSettings } from "@/hooks/useSchoolSettings";
import { useRegistrationNotifications } from "@/hooks/useRegistrationNotifications";
import { StudentBottomNav } from "./StudentBottomNav";
import { SchoolLogo } from "@/components/branding/SchoolLogo";
import { resolveSchoolLogo } from "@/lib/schoolBranding";
import {
  adminItem,
  type NavGroup,
  type NavItem,
  getIconForItem,
  getNavGroupsForRole,
  isGroupActive,
  roleColors,
  roleLabels,
} from "@/config/dashboardConfig";

interface DashboardLayoutProps {
  children: ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const sidebarExpandedWidth = 288;
const sidebarCollapsedWidth = 84;

export const DashboardLayout = ({ children, activeTab, onTabChange }: DashboardLayoutProps) => {
  const { isDark, toggle } = useTheme();
  const { user, role, signOut, isImpersonating, stopImpersonating, actualRole, actualUser } = useAuth();
  const { selectedSchool } = useSchool();
  const { data: schoolSettings } = useSchoolSettings(selectedSchool);
  const {
    academicYears,
    selectedYear,
    selectedYearId,
    setSelectedYearId,
    isLoading: isLoadingYears,
  } = useAcademicYear();
  const { unreadCount, newRegistrations, markAllRead } = useRegistrationNotifications();

  const navGroups = useMemo(() => getNavGroupsForRole(role), [role]);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const [clock, setClock] = useState(new Date());

  useEffect(() => {
    const interval = window.setInterval(() => setClock(new Date()), 1000 * 30);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    const nextOpenGroups: Record<string, boolean> = {};
    navGroups.forEach((group) => {
      if (group.isCollapsible && isGroupActive(group, activeTab)) {
        nextOpenGroups[group.id] = true;
      }
    });
    setOpenGroups((previous) => ({ ...previous, ...nextOpenGroups }));
  }, [activeTab, navGroups]);

  const pageTitle = useMemo(() => {
    for (const group of navGroups) {
      if (group.id === activeTab) return group.label;
      const child = group.items?.find((item) => item.id === activeTab);
      if (child) return child.label;
    }
    return "Workspace";
  }, [activeTab, navGroups]);

  const userName =
    user?.user_metadata?.full_name ||
    user?.email?.split("@")[0]?.replace(/[._-]/g, " ") ||
    "Portal User";
  const userInitials = userName
    .split(" ")
    .map((part: string) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const roleLabel = role ? roleLabels[role] || "Portal" : "Portal";
  const roleBadgeClass = role ? roleColors[role] : roleColors.student;
  const canShowComposer = role === "admin" || role === "registrar";
  const showRegistrationBell = role === "admin" || role === "registrar";
  const desktopOffset = `${isCollapsed ? sidebarCollapsedWidth : sidebarExpandedWidth}px`;
  const adminIdentity =
    actualUser?.user_metadata?.full_name ||
    actualUser?.email?.split("@")[0]?.replace(/[._-]/g, " ") ||
    actualUser?.email ||
    "Admin";
  const schoolLogoSrc = resolveSchoolLogo(schoolSettings?.logo_url || undefined);

  const toggleGroup = (groupId: string) => {
    setOpenGroups((previous) => ({ ...previous, [groupId]: !previous[groupId] }));
  };

  const handleNavigate = (tab: string) => {
    onTabChange(tab);
    setMobileSidebarOpen(false);
  };

  const renderNavItem = (item: NavItem, isNested = false) => {
    const Icon = getIconForItem(item.id, false);
    const isActive = activeTab === item.id;

    return (
      <motion.button
        key={item.id}
        whileHover={{ x: isCollapsed ? 0 : 2 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => handleNavigate(item.id)}
        title={isCollapsed ? item.label : undefined}
        className={cn(
          "group relative flex w-full items-center gap-3 rounded-xl border border-transparent font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar",
          isNested ? "px-3 py-2 text-sm" : "px-3 py-2.5 text-sm",
          isCollapsed && !isNested && "justify-center px-0",
          isActive
            ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]"
            : "text-sidebar-foreground/78 hover:bg-white/10 hover:text-sidebar-foreground",
        )}
      >
        <span
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors",
            isActive ? "bg-white/16" : "bg-white/6 group-hover:bg-white/12",
          )}
        >
          <Icon className={cn("h-[18px] w-[18px]", isNested && "h-4 w-4")} />
        </span>
        {!isCollapsed && <span className="truncate">{item.label}</span>}
      </motion.button>
    );
  };

  const renderNavGroup = (group: NavGroup) => {
    const Icon = getIconForItem(group.id, false);
    const isOpen = !!openGroups[group.id];
    const hasActiveChild = isGroupActive(group, activeTab);

    if (!group.isCollapsible || !group.items) {
      return renderNavItem({ id: group.id, label: group.label, icon: group.icon });
    }

    if (isCollapsed) {
      return (
        <button
          key={group.id}
          type="button"
          onClick={() => setIsCollapsed(false)}
          title={group.label}
          className={cn(
            "flex h-12 w-full items-center justify-center rounded-xl border border-transparent transition-colors",
            hasActiveChild
              ? "bg-sidebar-accent text-sidebar-accent-foreground"
              : "text-sidebar-foreground/80 hover:bg-white/10 hover:text-sidebar-foreground",
          )}
        >
          <Icon className="h-5 w-5" />
        </button>
      );
    }

    return (
      <Collapsible key={group.id} open={isOpen} onOpenChange={() => toggleGroup(group.id)}>
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className={cn(
              "flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-all",
              hasActiveChild
                ? "bg-white/10 text-sidebar-foreground"
                : "text-sidebar-foreground/78 hover:bg-white/10 hover:text-sidebar-foreground",
            )}
          >
            <span className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/6">
                <Icon className="h-[18px] w-[18px]" />
              </span>
              <span>{group.label}</span>
            </span>
            <ChevronRight className={cn("h-4 w-4 transition-transform", isOpen && "rotate-90")} />
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent className="data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up overflow-hidden">
          <div className="ml-4 mt-1 space-y-1 border-l border-white/16 pl-3">
            {group.items.map((item) => renderNavItem(item, true))}
          </div>
        </CollapsibleContent>
      </Collapsible>
    );
  };

  const sidebar = (
    <div className="flex h-full flex-col gradient-sidebar text-sidebar-foreground">
      <div className={cn("flex items-center gap-3 border-b border-sidebar-border/70 px-4 py-4", isCollapsed && "justify-center px-3")}>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground ring-4 ring-white/10">
          <SchoolLogo
            src={schoolLogoSrc}
            className="h-full w-full rounded-xl"
            imageClassName="rounded-xl"
          />
        </div>
        {!isCollapsed && (
          <div className="min-w-0">
            <p className="micro-label text-white/60">School Portal</p>
            <p className="truncate text-sm font-black tracking-tight">
              {schoolSettings?.acronym || selectedSchool}
            </p>
          </div>
        )}
      </div>

      {!isCollapsed && role !== "student" && (
        <div className="space-y-2 border-b border-sidebar-border/70 px-4 py-4">
          <p className="micro-label text-white/60">Academic Year</p>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="h-10 w-full justify-between rounded-xl border border-white/16 bg-white/8 px-3 text-sidebar-foreground hover:bg-white/14 hover:text-sidebar-foreground"
              >
                {isLoadingYears ? (
                  <Skeleton className="h-4 w-24 bg-white/18" />
                ) : (
                  <span className="truncate text-sm">{selectedYear?.name || "Select year"}</span>
                )}
                <ChevronRight className="h-4 w-4 rotate-90 opacity-70" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-64">
              <DropdownMenuLabel>Academic Year</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {academicYears.map((year) => (
                <DropdownMenuItem key={year.id} onClick={() => setSelectedYearId(year.id)}>
                  <div className="flex w-full items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      {year.is_archived && <Lock className="h-3.5 w-3.5 text-muted-foreground" />}
                      <span>{year.name}</span>
                    </div>
                    {selectedYearId === year.id && (
                      <Badge variant="secondary" className="px-2 py-0.5 text-[10px]">
                        Active
                      </Badge>
                    )}
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          {selectedYear && !selectedYear.is_current && (
            <div className="flex items-center gap-2 rounded-xl bg-warning/18 px-3 py-2 text-xs text-white">
              <Lock className="h-3.5 w-3.5" />
              <span>Read-only year selected</span>
            </div>
          )}
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-3 py-4">
        <div className="space-y-1">{navGroups.map((group) => renderNavGroup(group))}</div>
      </div>

      <div className="border-t border-sidebar-border/70 px-3 py-4">
        {role === "admin" && !isCollapsed && (
          <button
            type="button"
            onClick={() => handleNavigate(adminItem.id)}
            className={cn(
              "mb-2 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
              activeTab === adminItem.id
                ? "bg-white text-sidebar-background"
                : "text-sidebar-foreground hover:bg-white/10",
            )}
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-black/10">
              <adminItem.icon className="h-[18px] w-[18px]" />
            </span>
            <span>{adminItem.label}</span>
          </button>
        )}

        <div
          className={cn(
            "rounded-2xl border border-white/12 bg-white/10 p-3",
            isCollapsed && "border-none bg-transparent p-0",
          )}
        >
          {isCollapsed ? (
            <button
              type="button"
              onClick={() => handleNavigate("helpdesk")}
              className="flex h-12 w-full items-center justify-center rounded-xl text-sidebar-foreground/80 hover:bg-white/10 hover:text-sidebar-foreground"
              title="Helpdesk"
            >
              <HelpCircle className="h-5 w-5" />
            </button>
          ) : (
            <>
              <div className="flex items-center gap-3">
                <Avatar className="h-11 w-11 border border-white/20">
                  <AvatarFallback className="bg-white text-sidebar-background font-bold">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{userName}</p>
                  <p className="truncate text-xs text-white/65">{user?.email}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleNavigate("helpdesk")}
                className="mt-3 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-sidebar-foreground/84 transition-colors hover:bg-white/10"
              >
                <HelpCircle className="h-4 w-4" />
                <span>Help & Support</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div
      className="min-h-screen bg-background app-shell-background theme-transition"
      style={{ ["--sidebar-offset" as string]: desktopOffset }}
    >
      <AnimatePresence>
        {mobileSidebarOpen && (
          <motion.button
            type="button"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileSidebarOpen(false)}
            className="fixed inset-0 z-40 bg-slate-950/45 md:hidden"
          />
        )}
      </AnimatePresence>

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 hidden border-r border-sidebar-border/80 shadow-soft md:block",
          isCollapsed ? "w-[84px]" : "w-72",
        )}
      >
        {sidebar}
      </aside>

      <AnimatePresence>
        {mobileSidebarOpen && (
          <motion.aside
            initial={{ x: -24, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -24, opacity: 0 }}
            className="fixed inset-y-0 left-0 z-50 w-72 border-r border-sidebar-border/80 shadow-soft md:hidden"
          >
            {sidebar}
          </motion.aside>
        )}
      </AnimatePresence>

      <header className="fixed inset-x-0 top-0 z-30 h-16 border-b border-border/80 bg-card/92 backdrop-blur md:pl-[var(--sidebar-offset)]">
        <div className="flex h-full items-center justify-between gap-4 px-4 md:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full md:hidden"
              onClick={() => setMobileSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="hidden rounded-full md:inline-flex"
              onClick={() => setIsCollapsed((previous) => !previous)}
            >
              {isCollapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
            </Button>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <div className="hidden items-center gap-2 rounded-full border border-border bg-background px-2 py-1 md:flex">
                  <SchoolLogo
                    src={schoolLogoSrc}
                    className="h-7 w-7 rounded-full border border-border/60"
                  />
                  <span className="max-w-[180px] truncate text-xs font-medium text-muted-foreground">
                    {schoolSettings?.acronym || selectedSchool}
                  </span>
                </div>
                <Badge className={cn("border", roleBadgeClass)} variant="outline">
                  {roleLabel}
                </Badge>
                <div className="hidden items-center rounded-full border border-border bg-muted/50 px-3 py-1 text-xs text-muted-foreground md:flex">
                  <span className="tabular">
                    {format(clock, "EEE, MMM d • hh:mm a")}
                  </span>
                </div>
              </div>
              <p className="truncate text-sm font-semibold tracking-tight text-foreground">{pageTitle}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {canShowComposer && (
              <Button
                size="icon"
                className="rounded-full"
                onClick={() => handleNavigate("enrollment")}
                aria-label="Create enrollment"
              >
                <Plus className="h-4 w-4" />
              </Button>
            )}

            {showRegistrationBell && (
              <div className="rounded-full border border-border bg-background p-0.5">
                <NotificationBell
                  unreadCount={unreadCount}
                  newRegistrations={newRegistrations}
                  onViewAll={() => handleNavigate("registrations")}
                  onMarkRead={markAllRead}
                />
              </div>
            )}

            <Button variant="ghost" size="icon" className="rounded-full" onClick={toggle}>
              {isDark ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 rounded-full border border-border bg-background px-1 py-1 shadow-sm transition-colors hover:bg-muted">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-primary text-primary-foreground font-bold">
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-72">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-primary text-primary-foreground font-bold">
                        {userInitials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{userName}</p>
                      <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <div className="px-2 pb-2">
                  <Badge className={cn("border", roleBadgeClass)} variant="outline">
                    {roleLabel}
                  </Badge>
                </div>
                <DropdownMenuItem onClick={() => handleNavigate("my-profile")}>My Profile</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleNavigate("helpdesk")}>Helpdesk</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={signOut}>
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <main className="min-h-screen transition-[padding] duration-300 md:pl-[var(--sidebar-offset)]">
        <div className="px-4 pb-24 pt-20 md:px-6 md:pb-6">
          <div className="mx-auto space-y-6">
            {isImpersonating && actualRole === "admin" && (
              <div className="flex flex-col gap-3 rounded-2xl border border-warning/35 bg-warning/10 px-4 py-4 text-sm shadow-sm md:flex-row md:items-center md:justify-between">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-warning/18 text-warning">
                    <Eye className="h-4 w-4" />
                  </span>
                  <div className="space-y-1">
                    <p className="font-semibold text-foreground">
                      Impersonation mode is active
                    </p>
                    <p className="text-muted-foreground">
                      Viewing the portal as <span className="font-medium text-foreground">{userName}</span> ({roleLabel}).
                      Return to <span className="font-medium text-foreground">{adminIdentity}</span> at any time.
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-full"
                    onClick={() => handleNavigate("impersonate")}
                  >
                    Manage Impersonation
                  </Button>
                  <Button
                    type="button"
                    className="rounded-full"
                    onClick={stopImpersonating}
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Return To Admin
                  </Button>
                </div>
              </div>
            )}
            {children}
          </div>
        </div>
      </main>

      {role === "student" && <StudentBottomNav activeTab={activeTab} onTabChange={onTabChange} />}
    </div>
  );
};
