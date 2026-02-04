import { Bell, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';

export const DashboardHeader = () => {
  const { user } = useAuth();

  return (
    <div className="flex items-center justify-between mb-6">
      <h1 className="text-2xl lg:text-3xl font-bold">
        <span className="text-foreground">School Management</span>{' '}
        <span className="text-info font-normal">System</span>
      </h1>
      
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5 text-muted-foreground" />
        </Button>
        
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 border-2 border-info">
            <AvatarImage src="" />
            <AvatarFallback className="bg-info text-white">
              {user?.email?.substring(0, 2).toUpperCase() || 'JD'}
            </AvatarFallback>
          </Avatar>
          <div className="hidden md:block">
            <p className="text-sm font-semibold text-foreground">
              {user?.email?.split('@')[0] || 'John Doe'}
            </p>
            <p className="text-xs text-muted-foreground">
              {user?.email || 'johndoe@email.com'}
            </p>
          </div>
        </div>
        
        <Badge variant="destructive" className="relative">
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-destructive text-[10px] flex items-center justify-center rounded-full">
            1
          </span>
        </Badge>
      </div>
    </div>
  );
};
