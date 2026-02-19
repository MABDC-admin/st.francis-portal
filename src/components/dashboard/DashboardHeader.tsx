import { LogOut, GraduationCap, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { useUnreadCount } from '@/hooks/useUnreadCount';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useColorTheme } from '@/hooks/useColorTheme';
import { ColorThemeSelector } from '@/components/ColorThemeSelector';
import { DashboardLayoutSwitcher } from '@/components/dashboard/DashboardLayoutSwitcher';
import { useSchool } from '@/contexts/SchoolContext';
import { useSchoolSettings } from '@/hooks/useSchoolSettings';
import { cn } from '@/lib/utils';

interface DashboardHeaderProps {
  onNavigateToMessages?: () => void;
}

export const DashboardHeader = ({ onNavigateToMessages }: DashboardHeaderProps) => {
  const { user, role, signOut } = useAuth();
  const unreadCount = useUnreadCount();
  const { currentTheme, selectTheme } = useColorTheme();
  const { schoolTheme, selectedSchool } = useSchool();
  const { data: schoolSettings } = useSchoolSettings(selectedSchool);

  const showMailbox = role === 'admin' || role === 'teacher' || role === 'registrar';

  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-3">
        {/* School Logo */}
        <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl overflow-hidden bg-white shadow-sm flex items-center justify-center flex-shrink-0">
          {schoolSettings?.logo_url ? (
            <img 
              src={schoolSettings.logo_url} 
              alt={`${schoolTheme.fullName} logo`} 
              className="w-full h-full object-contain p-1" 
            />
          ) : (
            <div className={cn("w-full h-full flex items-center justify-center bg-gradient-to-br", schoolTheme.sidebarBg)}>
              <GraduationCap className="h-6 w-6 text-white" />
            </div>
          )}
        </div>
        <h1 className="text-xl lg:text-2xl font-bold text-foreground">
          {schoolTheme.fullName}
        </h1>
      </div>

      <div className="flex items-center gap-2">
        {showMailbox && (
          <Button
            variant="ghost"
            size="icon"
            className="relative h-10 w-10 rounded-full"
            onClick={onNavigateToMessages}
          >
            <Mail className="h-5 w-5 text-muted-foreground" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </Button>
        )}
        <ColorThemeSelector currentTheme={currentTheme} onSelectTheme={selectTheme} />
        <DashboardLayoutSwitcher />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 w-10 rounded-full">
              <Avatar className="h-10 w-10 border-2 border-primary cursor-pointer hover:opacity-80 transition-opacity">
                <AvatarImage src="" />
                <AvatarFallback className="bg-primary text-primary-foreground font-bold">
                  {user?.email?.substring(0, 2).toUpperCase() || 'JD'}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{user?.email?.split('@')[0]}</p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user?.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={signOut} className="text-destructive cursor-pointer">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};