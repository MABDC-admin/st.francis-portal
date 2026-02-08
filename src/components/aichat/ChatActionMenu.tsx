import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useState } from 'react';

export interface ModeInfo {
  label: string;
  icon: string;
}

interface ActionItem {
  emoji: string;
  label: string;
  action: () => void;
}

interface ActionGroup {
  title: string;
  bgClass: string;
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
      bgClass: 'bg-blue-50 text-blue-600',
      items: [
        { emoji: '🔍', label: 'Search Library', action: () => act('find ', 'Library Search', '🔍') },
        { emoji: '🎥', label: 'Search YouTube Videos', action: () => act('Search YouTube for ', 'YouTube Search', '🎥') },
        { emoji: '📚', label: 'Wikipedia Lookup', action: () => act('Look up on Wikipedia: ', 'Wikipedia', '📚') },
        { emoji: '📰', label: 'News & Current Events', action: () => act('Find recent news about ', 'News Search', '📰') },
      ],
    },
    {
      title: 'Create & Generate',
      bgClass: 'bg-purple-50 text-purple-600',
      items: [
        { emoji: '🖼️', label: 'Generate Image', action: () => act('Generate an image of ', 'Image Generation', '🖼️') },
        { emoji: '📝', label: 'Write Essay / Report', action: () => act('Write an essay about ', 'Essay Writing', '📝') },
        { emoji: '📊', label: 'Create Quiz / Exam', action: () => act('Create a 10-item quiz about ', 'Quiz Creator', '📊') },
        { emoji: '📋', label: 'Lesson Plan (MELC)', action: () => act('Create a DepEd MELC lesson plan for ', 'Lesson Plan', '📋') },
        { emoji: '🃏', label: 'Create Flashcards', action: () => act('Create flashcards for ', 'Flashcards', '🃏') },
        { emoji: '✍️', label: 'Write a Story / Poem', action: () => act('Write a creative story about ', 'Story Writer', '✍️') },
        { emoji: '📽️', label: 'Presentation Outline', action: () => act('Create a presentation outline for ', 'Presentation', '📽️') },
      ],
    },
    {
      title: 'Analyze & Upload',
      bgClass: 'bg-amber-50 text-amber-600',
      items: [
        { emoji: '📄', label: 'Upload PDF Document', action: () => { onFileUpload(); setOpen(false); } },
        { emoji: '📖', label: 'Document Analysis', action: () => act('Analyze the uploaded document: ', 'Doc Analysis', '📖') },
        { emoji: '📌', label: 'Summarize a Topic', action: () => act('Summarize the key points of ', 'Summarizer', '📌') },
        { emoji: '⚖️', label: 'Compare & Contrast', action: () => act('Compare and contrast ', 'Compare', '⚖️') },
      ],
    },
    {
      title: 'School Tools',
      bgClass: 'bg-green-50 text-green-600',
      items: [
        { emoji: '📅', label: 'Schedule Helper', action: () => act('Help me create a class schedule for ', 'Schedule Helper', '📅') },
        { emoji: '💡', label: 'Study Tips', action: () => act('Give me effective study tips for ', 'Study Tips', '💡') },
        { emoji: '🧮', label: 'Math Solver', action: () => act('Solve step by step: ', 'Math Solver', '🧮') },
        { emoji: '🔬', label: 'Science Experiment Ideas', action: () => act('Suggest a science experiment about ', 'Science Lab', '🔬') },
        { emoji: '📕', label: 'Book Report Helper', action: () => act('Help me write a book report on ', 'Book Report', '📕') },
        { emoji: '🧭', label: 'Research Guide', action: () => act('Guide me on how to research ', 'Research Guide', '🧭') },
      ],
    },
    {
      title: 'Language & Writing',
      bgClass: 'bg-pink-50 text-pink-600',
      items: [
        { emoji: '✅', label: 'Grammar Checker', action: () => act('Check the grammar of: ', 'Grammar Check', '✅') },
        { emoji: '🌐', label: 'Translate Text', action: () => act('Translate to English: ', 'Translator', '🌐') },
        { emoji: '📖', label: 'Vocabulary Builder', action: () => act('Teach me 10 vocabulary words about ', 'Vocabulary', '📖') },
        { emoji: '✉️', label: 'Letter / Email Writer', action: () => act('Write a professional email about ', 'Email Writer', '✉️') },
      ],
    },
    {
      title: 'Science & Math',
      bgClass: 'bg-teal-50 text-teal-600',
      items: [
        { emoji: '⚛️', label: 'Physics Problem Solver', action: () => act('Solve this physics problem: ', 'Physics Solver', '⚛️') },
        { emoji: '🧪', label: 'Chemistry Helper', action: () => act('Explain this chemistry concept: ', 'Chemistry', '🧪') },
        { emoji: '🧬', label: 'Biology Explainer', action: () => act('Explain in biology: ', 'Biology', '🧬') },
        { emoji: '📈', label: 'Statistics Calculator', action: () => act('Calculate the statistics for: ', 'Statistics', '📈') },
      ],
    },
    {
      title: 'Lifestyle & Wellness',
      bgClass: 'bg-rose-50 text-rose-600',
      items: [
        { emoji: '🍽️', label: 'Meal / Nutrition Planner', action: () => act('Create a weekly meal plan for ', 'Meal Planner', '🍽️') },
        { emoji: '🏃', label: 'Exercise / PE Activities', action: () => act('Suggest PE activities for ', 'PE Activities', '🏃') },
        { emoji: '🧘', label: 'Mindfulness / SEL Activity', action: () => act('Create a mindfulness activity for ', 'Mindfulness', '🧘') },
        { emoji: '⏰', label: 'Time Management Tips', action: () => act('Give me time management tips for ', 'Time Management', '⏰') },
      ],
    },
    {
      title: 'Fun & Creative',
      bgClass: 'bg-indigo-50 text-indigo-600',
      items: [
        { emoji: '🎯', label: 'Trivia Game', action: () => act('Create a trivia game about ', 'Trivia', '🎯') },
        { emoji: '🧩', label: 'Brain Teasers / Riddles', action: () => act('Give me brain teasers about ', 'Brain Teasers', '🧩') },
        { emoji: '🎤', label: 'Debate Topic Generator', action: () => act('Generate debate topics about ', 'Debate Topics', '🎤') },
        { emoji: '🤔', label: 'Would You Rather (Edu)', action: () => act('Create educational "Would You Rather" questions about ', 'Would You Rather', '🤔') },
        { emoji: '🎲', label: 'Icebreaker Activities', action: () => act('Suggest icebreaker activities for ', 'Icebreakers', '🎲') },
      ],
    },
    {
      title: 'Professional & Career',
      bgClass: 'bg-slate-100 text-slate-600',
      items: [
        { emoji: '📄', label: 'Resume / CV Helper', action: () => act('Help me create a resume for ', 'Resume Helper', '📄') },
        { emoji: '🎙️', label: 'Interview Prep', action: () => act('Prepare me for an interview about ', 'Interview Prep', '🎙️') },
        { emoji: '💻', label: 'Code Helper', action: () => act('Help me write code for ', 'Code Helper', '💻') },
        { emoji: '💡', label: 'Project Idea Generator', action: () => act('Generate project ideas for ', 'Project Ideas', '💡') },
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
        className="w-80 p-2 max-h-[520px] overflow-y-auto"
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
                <span className={`w-6 h-6 rounded-md flex items-center justify-center text-sm ${group.bgClass}`}>
                  {item.emoji}
                </span>
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        ))}
      </PopoverContent>
    </Popover>
  );
};
