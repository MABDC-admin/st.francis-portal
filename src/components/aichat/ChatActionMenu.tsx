import { Plus, Search, Youtube, ImageIcon, FileText, BookOpen, UtensilsCrossed, CalendarDays, Lightbulb, Calculator, Code, ClipboardList, GraduationCap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useState } from 'react';

export interface ModeInfo {
  label: string;
  icon: string;
}

interface ActionItem {
  icon: React.ReactNode;
  label: string;
  emoji: string;
  action: () => void;
}

interface ActionGroup {
  title: string;
  items: ActionItem[];
}

interface ChatActionMenuProps {
  onSelect: (text: string, mode: ModeInfo) => void;
  onFileUpload: () => void;
  disabled?: boolean;
}

export const ChatActionMenu = ({ onSelect, onFileUpload, disabled }: ChatActionMenuProps) => {
  const [open, setOpen] = useState(false);

  const act = (text: string, label: string, emoji: string) => {
    onSelect(text, { label, icon: emoji });
    setOpen(false);
  };

  const groups: ActionGroup[] = [
    {
      title: 'Search & Discover',
      items: [
        { icon: <Search className="h-4 w-4" />, label: 'Search Library', emoji: '🔍', action: () => act('find ', 'Library Search', '🔍') },
        { icon: <Youtube className="h-4 w-4" />, label: 'Search YouTube Videos', emoji: '🎥', action: () => act('Search YouTube for ', 'YouTube Search', '🎥') },
      ],
    },
    {
      title: 'Create & Generate',
      items: [
        { icon: <ImageIcon className="h-4 w-4" />, label: 'Generate Image', emoji: '🖼️', action: () => act('Generate an image of ', 'Image Generation', '🖼️') },
        { icon: <FileText className="h-4 w-4" />, label: 'Write Essay / Report', emoji: '📝', action: () => act('Write an essay about ', 'Essay Writing', '📝') },
        { icon: <ClipboardList className="h-4 w-4" />, label: 'Create Quiz / Exam', emoji: '📊', action: () => act('Create a 10-item quiz about ', 'Quiz Creator', '📊') },
        { icon: <GraduationCap className="h-4 w-4" />, label: 'Lesson Plan (MELC)', emoji: '📋', action: () => act('Create a DepEd MELC lesson plan for ', 'Lesson Plan', '📋') },
      ],
    },
    {
      title: 'Analyze & Upload',
      items: [
        { icon: <BookOpen className="h-4 w-4" />, label: 'Upload PDF Document', emoji: '📄', action: () => { onFileUpload(); setOpen(false); } },
        { icon: <FileText className="h-4 w-4" />, label: 'Document Analysis', emoji: '📖', action: () => act('Analyze the uploaded document: ', 'Doc Analysis', '📖') },
      ],
    },
    {
      title: 'School Tools',
      items: [
        { icon: <UtensilsCrossed className="h-4 w-4" />, label: 'Meal / Nutrition Planner', emoji: '🍽️', action: () => act('Create a weekly meal plan for ', 'Meal Planner', '🍽️') },
        { icon: <CalendarDays className="h-4 w-4" />, label: 'Schedule Helper', emoji: '📅', action: () => act('Help me create a class schedule for ', 'Schedule Helper', '📅') },
        { icon: <Lightbulb className="h-4 w-4" />, label: 'Study Tips', emoji: '💡', action: () => act('Give me effective study tips for ', 'Study Tips', '💡') },
        { icon: <Calculator className="h-4 w-4" />, label: 'Math Solver', emoji: '🧮', action: () => act('Solve step by step: ', 'Math Solver', '🧮') },
        { icon: <Code className="h-4 w-4" />, label: 'Code Helper', emoji: '💻', action: () => act('Help me write code for ', 'Code Helper', '💻') },
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
