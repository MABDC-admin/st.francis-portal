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
  { id: 'default', name: 'Default', gradient: 'bg-card border border-border' },
  { id: 'sunset', name: 'Sunset', gradient: 'bg-gradient-to-r from-orange-500 to-amber-400' },
  { id: 'ocean', name: 'Ocean', gradient: 'bg-gradient-to-r from-emerald-500 to-teal-400' },
  { id: 'berry', name: 'Berry', gradient: 'bg-gradient-to-r from-pink-600 to-rose-500' },
  { id: 'sky', name: 'Sky', gradient: 'bg-gradient-to-r from-blue-600 to-sky-500' },
  { id: 'grape', name: 'Grape', gradient: 'bg-gradient-to-r from-purple-700 to-violet-600' },
  { id: 'blush', name: 'Blush', gradient: 'bg-gradient-to-r from-pink-400 to-fuchsia-400' },
  { id: 'cherry', name: 'Cherry', gradient: 'bg-gradient-to-r from-red-600 to-red-500' },
  { id: 'slate', name: 'Slate', gradient: 'bg-gradient-to-r from-gray-500 to-slate-400' },
  { id: 'navy', name: 'Navy', gradient: 'bg-gradient-to-r from-blue-900 to-indigo-800' },
  { id: 'royal', name: 'Royal', gradient: 'bg-gradient-to-r from-blue-700 to-blue-500' },
  { id: 'peach', name: 'Peach', gradient: 'bg-gradient-to-r from-orange-400 to-amber-300' },
  { id: 'silver', name: 'Silver', gradient: 'bg-gradient-to-r from-gray-300 to-slate-200' },
  { id: 'emerald', name: 'Emerald', gradient: 'bg-gradient-to-r from-emerald-900 to-emerald-700' },
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
