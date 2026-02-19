import { Palette, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ColorThemeSelectorProps {
  currentTheme: string;
  onSelectTheme: (theme: string) => void;
}

const themeColors = [
  { id: 'aurora', name: 'Aurora', gradient: 'bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700' },
  { id: 'pastel', name: 'Pastel', gradient: 'bg-gradient-to-r from-[#88c999] to-[#f4f1ea]' },
  { id: 'sunset', name: 'Sunset', gradient: 'bg-gradient-to-r from-orange-500 to-amber-400' },
  { id: 'cosmic', name: 'Cosmic', gradient: 'bg-gradient-to-r from-indigo-700 via-purple-700 to-pink-600' },
  { id: 'sunrise', name: 'Sunrise', gradient: 'bg-gradient-to-r from-amber-500 via-orange-600 to-rose-600' },
  { id: 'oceania', name: 'Oceania', gradient: 'bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-700' },
  { id: 'paradise', name: 'Paradise', gradient: 'bg-gradient-to-r from-teal-600 via-emerald-600 to-lime-600' },
];

export const ColorThemeSelector = ({ currentTheme, onSelectTheme }: ColorThemeSelectorProps) => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-lg hover:bg-secondary/50"
          aria-label="Change color theme"
        >
          <Palette className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-3" align="start">
        <div className="space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-border">
            <Palette className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Color Theme</span>
          </div>
          <ScrollArea className="h-[280px] pr-2">
            <div className="grid grid-cols-3 gap-2">
              {themeColors.map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => onSelectTheme(theme.id)}
                  className={cn(
                    "relative h-12 w-full rounded-lg transition-all duration-200 ring-2 ring-offset-2 ring-offset-background",
                    theme.gradient,
                    currentTheme === theme.id ? "ring-primary" : "ring-transparent hover:ring-muted"
                  )}
                  title={theme.name}
                >
                  {currentTheme === theme.id && (
                    <Check className={cn(
                      "absolute inset-0 m-auto h-5 w-5 drop-shadow-md",
                      theme.id === 'default' || theme.id === 'silver' || theme.id === 'peach'
                        ? "text-foreground"
                        : "text-white"
                    )} />
                  )}
                </button>
              ))}
            </div>
          </ScrollArea>
          <p className="text-xs text-muted-foreground text-center pt-1">
            Customize sidebar & page colors
          </p>
        </div>
      </PopoverContent>
    </Popover>
  );
};
