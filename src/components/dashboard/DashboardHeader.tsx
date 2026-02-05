import { LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
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
import { useSchool } from '@/contexts/SchoolContext';

export const DashboardHeader = () => {
  const { user, signOut } = useAuth();
  const { currentTheme, selectTheme } = useColorTheme();
  const { schoolTheme } = useSchool();

  return (
    <div className="flex items-center justify-between mb-6">
      <h1 className="text-2xl lg:text-3xl font-bold">
        <span className="text-foreground">{schoolTheme.fullName}</span>
      </h1>

      <div className="flex items-center gap-4">
        <ColorThemeSelector currentTheme={currentTheme} onSelectTheme={selectTheme} />

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
