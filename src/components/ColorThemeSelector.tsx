import { Palette, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface ColorThemeSelectorProps {
  currentTheme: string;
  onSelectTheme: (theme: string) => void;
}

const themeColors = [
  { id: 'default', name: 'Default', color: 'bg-card', ring: 'ring-border' },
  { id: 'emerald', name: 'Emerald', color: 'bg-emerald-500', ring: 'ring-emerald-400' },
  { id: 'blue', name: 'Blue', color: 'bg-blue-500', ring: 'ring-blue-400' },
  { id: 'purple', name: 'Purple', color: 'bg-purple-500', ring: 'ring-purple-400' },
  { id: 'rose', name: 'Rose', color: 'bg-rose-500', ring: 'ring-rose-400' },
  { id: 'amber', name: 'Amber', color: 'bg-amber-500', ring: 'ring-amber-400' },
  { id: 'slate', name: 'Slate', color: 'bg-slate-600', ring: 'ring-slate-400' },
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
      <PopoverContent className="w-64 p-3" align="start">
        <div className="space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-border">
            <Palette className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Color Theme</span>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {themeColors.map((theme) => (
              <button
                key={theme.id}
                onClick={() => onSelectTheme(theme.id)}
                className={cn(
                  "relative h-10 w-full rounded-lg transition-all duration-200 ring-2 ring-offset-2 ring-offset-background",
                  theme.color,
                  currentTheme === theme.id ? theme.ring : "ring-transparent hover:ring-muted"
                )}
                title={theme.name}
              >
                {currentTheme === theme.id && (
                  <Check className="absolute inset-0 m-auto h-4 w-4 text-white drop-shadow-md" />
                )}
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground text-center pt-1">
            Customize sidebar & page colors
          </p>
        </div>
      </PopoverContent>
    </Popover>
  );
};
