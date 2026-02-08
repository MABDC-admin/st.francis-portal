import { Plus, Search, Youtube, ImageIcon, FileText, BookOpen, UtensilsCrossed, CalendarDays, Lightbulb, Calculator, Code, ClipboardList, GraduationCap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useState } from 'react';

interface ActionItem {
  icon: React.ReactNode;
  label: string;
  action: () => void;
}

interface ActionGroup {
  title: string;
  items: ActionItem[];
}

interface ChatActionMenuProps {
  onPrefill: (text: string) => void;
  onFileUpload: () => void;
  disabled?: boolean;
}

export const ChatActionMenu = ({ onPrefill, onFileUpload, disabled }: ChatActionMenuProps) => {
  const [open, setOpen] = useState(false);

  const act = (text: string) => {
    onPrefill(text);
    setOpen(false);
  };

  const groups: ActionGroup[] = [
    {
      title: 'Search & Discover',
      items: [
        { icon: <Search className="h-4 w-4" />, label: 'Search Library', action: () => act('find ') },
        { icon: <Youtube className="h-4 w-4" />, label: 'Search YouTube Videos', action: () => act('Search YouTube for ') },
      ],
    },
    {
      title: 'Create & Generate',
      items: [
        { icon: <ImageIcon className="h-4 w-4" />, label: 'Generate Image', action: () => act('Generate an image of ') },
        { icon: <FileText className="h-4 w-4" />, label: 'Write Essay / Report', action: () => act('Write an essay about ') },
        { icon: <ClipboardList className="h-4 w-4" />, label: 'Create Quiz / Exam', action: () => act('Create a 10-item quiz about ') },
        { icon: <GraduationCap className="h-4 w-4" />, label: 'Lesson Plan (MELC)', action: () => act('Create a DepEd MELC lesson plan for ') },
      ],
    },
    {
      title: 'Analyze & Upload',
      items: [
        { icon: <BookOpen className="h-4 w-4" />, label: 'Upload PDF Document', action: () => { onFileUpload(); setOpen(false); } },
        { icon: <FileText className="h-4 w-4" />, label: 'Document Analysis', action: () => act('Analyze the uploaded document: ') },
      ],
    },
    {
      title: 'School Tools',
      items: [
        { icon: <UtensilsCrossed className="h-4 w-4" />, label: 'Meal / Nutrition Planner', action: () => act('Create a weekly meal plan for ') },
        { icon: <CalendarDays className="h-4 w-4" />, label: 'Schedule Helper', action: () => act('Help me create a class schedule for ') },
        { icon: <Lightbulb className="h-4 w-4" />, label: 'Study Tips', action: () => act('Give me effective study tips for ') },
        { icon: <Calculator className="h-4 w-4" />, label: 'Math Solver', action: () => act('Solve step by step: ') },
        { icon: <Code className="h-4 w-4" />, label: 'Code Helper', action: () => act('Help me write code for ') },
      ],
    },
  ];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          size="icon"
          variant="ghost"
          disabled={disabled}
          className="h-11 w-11 rounded-xl flex-shrink-0"
          title="Quick Actions"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        side="top"
        align="start"
        className="w-72 p-2 max-h-[420px] overflow-y-auto"
      >
        {groups.map((group, gi) => (
          <div key={gi} className={gi > 0 ? 'mt-2 pt-2 border-t' : ''}>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-2 py-1">
              {group.title}
            </p>
            {group.items.map((item, ii) => (
              <button
                key={ii}
                onClick={item.action}
                className="flex items-center gap-2.5 w-full rounded-md px-2 py-1.5 text-sm hover:bg-accent transition-colors text-left"
              >
                <span className="text-muted-foreground">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        ))}
      </PopoverContent>
    </Popover>
  );
};
