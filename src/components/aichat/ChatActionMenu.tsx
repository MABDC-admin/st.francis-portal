import { Plus, Sparkles, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useState, useMemo } from 'react';
import type { ChatSession } from './types';
import { useSmartSuggestions } from './useSmartSuggestions';

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
  sessions?: ChatSession[];
}

export const ChatActionMenu = ({ onSelect, onFileUpload, disabled, sessions = [] }: ChatActionMenuProps) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const smartSuggestions = useSmartSuggestions(sessions);

  const act = (text: string, label: string, emoji: string) => {
    onSelect(text, { label, icon: emoji });
    setOpen(false);
    setSearch('');
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
        { emoji: '🎓', label: 'Academic Search', action: () => act('Find academic resources about ', 'Academic Search', '🎓') },
        { emoji: '🖼️', label: 'Image Search', action: () => act('Find images of ', 'Image Search', '🖼️') },
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
        { emoji: '📐', label: 'Infographic Creator', action: () => act('Design an infographic about ', 'Infographic', '📐') },
        { emoji: '📄', label: 'Worksheet Maker', action: () => act('Create a worksheet for ', 'Worksheet', '📄') },
        { emoji: '🏅', label: 'Certificate Template', action: () => act('Create a certificate template for ', 'Certificate', '🏅') },
        { emoji: '🧩', label: 'Crossword Puzzle', action: () => act('Create a crossword puzzle about ', 'Crossword', '🧩') },
        { emoji: '📐', label: 'Rubric Builder', action: () => act('Create a rubric for ', 'Rubric Builder', '📐') },
      ],
    },
    {
      title: 'Analyze & Upload',
      bgClass: 'bg-amber-50 text-amber-600',
      items: [
        { emoji: '📄', label: 'Upload PDF Document', action: () => { onFileUpload(); setOpen(false); setSearch(''); } },
        { emoji: '📖', label: 'Document Analysis', action: () => act('Analyze the uploaded document: ', 'Doc Analysis', '📖') },
        { emoji: '📌', label: 'Summarize a Topic', action: () => act('Summarize the key points of ', 'Summarizer', '📌') },
        { emoji: '⚖️', label: 'Compare & Contrast', action: () => act('Compare and contrast ', 'Compare', '⚖️') },
        { emoji: '🔎', label: 'Text Analyzer', action: () => act('Analyze this text: ', 'Text Analyzer', '🔎') },
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
        { emoji: '🔥', label: 'Warm-up Activity', action: () => act('Create a fun warm-up activity for ', 'Warm-up', '🔥') },
        { emoji: '🎒', label: 'Homework Helper', action: () => act('Help me with my homework on ', 'Homework Helper', '🎒') },
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
        { emoji: '🗣️', label: 'Speech Writer', action: () => act('Write a speech about ', 'Speech Writer', '🗣️') },
        { emoji: '📰', label: 'News Article Writer', action: () => act('Write a news article about ', 'News Writer', '📰') },
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
        { emoji: '🔢', label: 'Algebra Helper', action: () => act('Solve this algebra problem: ', 'Algebra', '🔢') },
        { emoji: '📏', label: 'Geometry Helper', action: () => act('Help me with this geometry problem: ', 'Geometry', '📏') },
      ],
    },
    {
      title: 'Filipino / Mother Tongue',
      bgClass: 'bg-yellow-50 text-yellow-700',
      items: [
        { emoji: '✍️', label: 'Pagsulat ng Sanaysay', action: () => act('Sumulat ng sanaysay tungkol sa ', 'Sanaysay', '✍️') },
        { emoji: '📖', label: 'Pagbasa Comprehension', action: () => act('Gumawa ng comprehension questions para sa ', 'Pagbasa', '📖') },
        { emoji: '📝', label: 'Filipino Grammar', action: () => act('Ipaliwanag ang Filipino grammar rule: ', 'Filipino Grammar', '📝') },
        { emoji: '🎭', label: 'Dula-dulaan Script', action: () => act('Sumulat ng maikling dula tungkol sa ', 'Dula-dulaan', '🎭') },
        { emoji: '📚', label: 'Panitikan / Literature', action: () => act('Suriin ang panitikang ito: ', 'Panitikan', '📚') },
      ],
    },
    {
      title: 'History & Social Studies',
      bgClass: 'bg-orange-50 text-orange-700',
      items: [
        { emoji: '📜', label: 'Timeline Creator', action: () => act('Create a historical timeline for ', 'Timeline', '📜') },
        { emoji: '🏛️', label: 'Historical Figure Bio', action: () => act('Write a biography of ', 'Biography', '🏛️') },
        { emoji: '🗺️', label: 'Map Analysis', action: () => act('Help me analyze this map of ', 'Map Analysis', '🗺️') },
        { emoji: '⚔️', label: 'War & Conflict Summary', action: () => act('Summarize the key events of ', 'War Summary', '⚔️') },
        { emoji: '🏛️', label: 'Government & Civics', action: () => act('Explain the concept of ', 'Civics', '🏛️') },
      ],
    },
    {
      title: 'Arts & Music',
      bgClass: 'bg-fuchsia-50 text-fuchsia-600',
      items: [
        { emoji: '🎨', label: 'Art Critique', action: () => act('Analyze this artwork: ', 'Art Critique', '🎨') },
        { emoji: '🎵', label: 'Music Theory', action: () => act('Explain this music concept: ', 'Music Theory', '🎵') },
        { emoji: '🎭', label: 'Drama Activity', action: () => act('Create a drama activity about ', 'Drama', '🎭') },
        { emoji: '🖌️', label: 'Color Theory Explainer', action: () => act('Explain color theory for ', 'Color Theory', '🖌️') },
        { emoji: '🎼', label: 'Song Lyrics Writer', action: () => act('Write song lyrics about ', 'Song Lyrics', '🎼') },
      ],
    },
    {
      title: 'Technology & Digital Literacy',
      bgClass: 'bg-cyan-50 text-cyan-700',
      items: [
        { emoji: '⌨️', label: 'Typing Practice', action: () => act('Create a typing practice exercise about ', 'Typing', '⌨️') },
        { emoji: '🔒', label: 'Cybersecurity Tips', action: () => act('Explain cybersecurity best practices for ', 'Cybersecurity', '🔒') },
        { emoji: '📊', label: 'Spreadsheet Helper', action: () => act('Help me create a spreadsheet for ', 'Spreadsheet', '📊') },
        { emoji: '💻', label: 'Coding Tutorial', action: () => act('Teach me how to code ', 'Coding', '💻') },
        { emoji: '🌐', label: 'Digital Citizenship', action: () => act('Create a lesson on digital citizenship about ', 'Digital Citizenship', '🌐') },
      ],
    },
    {
      title: 'Environmental & Earth Science',
      bgClass: 'bg-emerald-50 text-emerald-700',
      items: [
        { emoji: '🌍', label: 'Climate Change Explainer', action: () => act('Explain climate change effects on ', 'Climate', '🌍') },
        { emoji: '🌿', label: 'Ecosystem Builder', action: () => act('Describe the ecosystem of ', 'Ecosystem', '🌿') },
        { emoji: '🌦️', label: 'Weather Analysis', action: () => act('Explain the weather patterns of ', 'Weather', '🌦️') },
        { emoji: '♻️', label: 'Sustainability Project', action: () => act('Design a sustainability project about ', 'Sustainability', '♻️') },
        { emoji: '🌋', label: 'Natural Disasters', action: () => act('Explain how to prepare for ', 'Disaster Prep', '🌋') },
      ],
    },
    {
      title: 'Parenting & Home',
      bgClass: 'bg-lime-50 text-lime-700',
      items: [
        { emoji: '👨‍👩‍👧', label: 'Parent-Teacher Conference', action: () => act('Help me prepare for a parent-teacher conference about ', 'PTC Prep', '👨‍👩‍👧') },
        { emoji: '📚', label: 'Homework Help Guide', action: () => act('Create a parent guide for helping with homework on ', 'Homework Guide', '📚') },
        { emoji: '📖', label: 'Reading List', action: () => act('Suggest age-appropriate books about ', 'Reading List', '📖') },
        { emoji: '🏠', label: 'Home Learning Activity', action: () => act('Design a home learning activity about ', 'Home Learning', '🏠') },
      ],
    },
    {
      title: 'Special Education & Inclusion',
      bgClass: 'bg-violet-50 text-violet-600',
      items: [
        { emoji: '📋', label: 'IEP Helper', action: () => act('Help me create an IEP goal for ', 'IEP Helper', '📋') },
        { emoji: '🎯', label: 'Differentiation Strategies', action: () => act('Suggest differentiated instruction for ', 'Differentiation', '🎯') },
        { emoji: '🤝', label: 'Accommodations Guide', action: () => act('List accommodations for a student with ', 'Accommodations', '🤝') },
        { emoji: '🧩', label: 'Sensory Activity', action: () => act('Create a sensory-friendly activity for ', 'Sensory', '🧩') },
      ],
    },
    {
      title: 'Assessment & Evaluation',
      bgClass: 'bg-sky-50 text-sky-600',
      items: [
        { emoji: '📐', label: 'Rubric Generator', action: () => act('Create a rubric for evaluating ', 'Rubric', '📐') },
        { emoji: '🎯', label: 'Performance Task Design', action: () => act('Design a performance task for ', 'Performance Task', '🎯') },
        { emoji: '📊', label: 'Test Item Analysis', action: () => act('Analyze these test results: ', 'Item Analysis', '📊') },
        { emoji: '📝', label: 'Formative Assessment', action: () => act('Create a formative assessment for ', 'Formative', '📝') },
        { emoji: '🏆', label: 'Competency Checklist', action: () => act('Create a competency checklist for ', 'Checklist', '🏆') },
      ],
    },
    {
      title: 'Research & Academic Writing',
      bgClass: 'bg-stone-100 text-stone-700',
      items: [
        { emoji: '📎', label: 'APA/MLA Citation', action: () => act('Generate an APA citation for ', 'Citation', '📎') },
        { emoji: '📚', label: 'Literature Review', action: () => act('Write a literature review about ', 'Lit Review', '📚') },
        { emoji: '💡', label: 'Thesis Statement', action: () => act('Help me write a thesis statement for ', 'Thesis', '💡') },
        { emoji: '🔬', label: 'Research Methodology', action: () => act('Explain research methodology for ', 'Methodology', '🔬') },
        { emoji: '📊', label: 'Data Interpretation', action: () => act('Help me interpret this data: ', 'Data', '📊') },
      ],
    },
    {
      title: 'Current Events & Media',
      bgClass: 'bg-red-50 text-red-600',
      items: [
        { emoji: '✅', label: 'Fact Checker', action: () => act('Fact-check this claim: ', 'Fact Check', '✅') },
        { emoji: '📺', label: 'Media Literacy', action: () => act('Create a media literacy activity about ', 'Media Literacy', '📺') },
        { emoji: '💬', label: 'Current Events Discussion', action: () => act('Create discussion questions about ', 'Discussion', '💬') },
        { emoji: '📰', label: 'News Summary', action: () => act('Summarize recent developments in ', 'News Summary', '📰') },
      ],
    },
    {
      title: 'Values & Character Education',
      bgClass: 'bg-gray-50 text-gray-700',
      items: [
        { emoji: '⚖️', label: 'Moral Dilemma Discussion', action: () => act('Create a moral dilemma scenario about ', 'Moral Dilemma', '⚖️') },
        { emoji: '💎', label: 'Character Traits Activity', action: () => act('Create an activity about the character trait of ', 'Character', '💎') },
        { emoji: '🤗', label: 'SEL Lesson', action: () => act('Create a social-emotional learning lesson on ', 'SEL', '🤗') },
        { emoji: '🕊️', label: 'Peace Education', action: () => act('Create a peace education activity about ', 'Peace Ed', '🕊️') },
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
        { emoji: '😴', label: 'Sleep Hygiene Tips', action: () => act('Give advice on healthy sleep habits for ', 'Sleep Tips', '😴') },
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
        { emoji: '🎮', label: 'Educational Game Ideas', action: () => act('Design an educational game about ', 'Game Ideas', '🎮') },
        { emoji: '🎪', label: 'Team Building Activity', action: () => act('Create a team building activity for ', 'Team Building', '🎪') },
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
        { emoji: '📧', label: 'Professional Email', action: () => act('Write a professional email to ', 'Pro Email', '📧') },
        { emoji: '📊', label: 'Business Plan Outline', action: () => act('Create a business plan outline for ', 'Business Plan', '📊') },
      ],
    },
  ];

  const filteredGroups = useMemo(() => {
    if (!search.trim()) return groups;
    const q = search.toLowerCase();
    return groups
      .map(g => ({
        ...g,
        items: g.items.filter(item => item.label.toLowerCase().includes(q)),
      }))
      .filter(g => g.items.length > 0);
  }, [search]);

  return (
    <Popover open={open} onOpenChange={(v) => { setOpen(v); if (!v) setSearch(''); }}>
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
        className="w-80 p-0 max-h-[520px] overflow-hidden flex flex-col"
      >
        {/* Search */}
        <div className="p-2 border-b sticky top-0 bg-popover z-10">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search actions..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
        </div>

        <div className="overflow-y-auto p-2 flex-1">
          {/* Smart Suggestions */}
          {!search.trim() && smartSuggestions.length > 0 && (
            <div className="mb-2">
              <p className="text-[10px] font-semibold uppercase tracking-wider px-2 py-1 flex items-center gap-1 text-amber-600">
                <Sparkles className="h-3 w-3" /> Suggested For You
              </p>
              {smartSuggestions.map((s, i) => (
                <button
                  key={i}
                  onClick={() => act(s.prefill, s.label, s.emoji)}
                  className="flex items-center gap-2.5 w-full rounded-md px-2 py-1.5 text-sm hover:bg-accent transition-colors text-left"
                >
                  <span className="w-6 h-6 rounded-md flex items-center justify-center text-sm bg-amber-50 text-amber-600">
                    {s.emoji}
                  </span>
                  <span className="flex-1 truncate">{s.label}</span>
                  <span className="text-[10px] text-muted-foreground truncate max-w-[100px]">{s.reason}</span>
                </button>
              ))}
            </div>
          )}

          {/* Action Groups */}
          {filteredGroups.map((group, gi) => (
            <div key={gi} className={gi > 0 || (!search.trim() && smartSuggestions.length > 0) ? 'mt-2 pt-2 border-t' : ''}>
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

          {filteredGroups.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-6">No actions match "{search}"</p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};
