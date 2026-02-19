import { LayoutGrid, Sparkles, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useDashboardLayout, LayoutStyle } from '@/contexts/DashboardLayoutContext';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

// Apple logo SVG component
const AppleLogo = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
  </svg>
);

const layouts: { id: LayoutStyle; name: string; description: string; preview: React.ReactNode }[] = [
  {
    id: 'modern',
    name: 'Modern',
    description: 'Current clean design',
    preview: (
      <div className="w-full h-12 rounded-md bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center gap-1 p-1">
        <div className="w-2 h-2 rounded bg-primary/60" />
        <div className="w-2 h-2 rounded bg-success/60" />
        <div className="w-2 h-2 rounded bg-warning/60" />
        <div className="w-2 h-2 rounded bg-info/60" />
      </div>
    ),
  },
  {
    id: 'classicBlue',
    name: 'Classic Blue',
    description: 'Glassmorphism style',
    preview: (
      <div className="w-full h-12 rounded-md bg-gradient-to-br from-blue-600 via-indigo-500 to-cyan-400 flex items-center justify-center gap-1 p-1">
        <div className="w-2 h-2 rounded bg-white/80 shadow-sm" />
        <div className="w-2 h-2 rounded bg-white/80 shadow-sm" />
        <div className="w-2 h-2 rounded bg-white/80 shadow-sm" />
        <div className="w-2 h-2 rounded bg-white/80 shadow-sm" />
      </div>
    ),
  },
  {
    id: 'apple',
    name: 'Apple Style',
    description: 'Clean iOS/macOS design',
    preview: (
      <div className="w-full h-12 rounded-xl bg-gradient-to-b from-gray-100 to-white flex items-center justify-center gap-1.5 p-1 border border-gray-200/50">
        <div className="w-2.5 h-2.5 rounded-full bg-[#34C759]" />
        <div className="w-2.5 h-2.5 rounded-full bg-[#007AFF]" />
        <div className="w-2.5 h-2.5 rounded-full bg-[#FF9500]" />
        <div className="w-2.5 h-2.5 rounded-full bg-[#FF3B30]" />
      </div>
    ),
  },
];

export const DashboardLayoutSwitcher = () => {
  const { layoutStyle, setLayoutStyle } = useDashboardLayout();

  const getIcon = () => {
    switch (layoutStyle) {
      case 'classicBlue':
        return <Sparkles className="h-4 w-4 text-blue-500" />;
      case 'apple':
        return <AppleLogo className="h-4 w-4 text-gray-700" />;
      default:
        return <LayoutGrid className="h-4 w-4" />;
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-9 w-9 rounded-full hover:bg-muted"
          title="Switch Dashboard Layout"
        >
          <motion.div
            whileHover={{ rotate: 180 }}
            transition={{ duration: 0.3 }}
          >
            {getIcon()}
          </motion.div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-2" align="end">
        <div className="space-y-1">
          <p className="text-xs font-semibold text-muted-foreground px-2 py-1 uppercase tracking-wider">
            Dashboard Style
          </p>
          {layouts.map((layout) => (
            <motion.button
              key={layout.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setLayoutStyle(layout.id)}
              className={cn(
                "w-full p-2 rounded-lg flex items-start gap-3 transition-all text-left",
                layoutStyle === layout.id
                  ? "bg-primary/10 border border-primary/20"
                  : "hover:bg-muted border border-transparent"
              )}
            >
              <div className="w-16 shrink-0">
                {layout.preview}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-medium">{layout.name}</span>
                  {layoutStyle === layout.id && (
                    <Check className="h-3 w-3 text-primary" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  {layout.description}
                </p>
              </div>
            </motion.button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};
