import type { ChatSession } from './types';

interface ChatSuggestionChipsProps {
  sessions: ChatSession[];
  onSelect: (text: string) => void;
}

const DEFAULT_SUGGESTIONS = [
  'Help with homework',
  'Create a lesson plan',
  'Generate an image',
  'Solve a math problem',
  'Search YouTube videos',
];

const TEMPLATES = [
  (t: string) => `Continue: ${t}`,
  (t: string) => `Quiz me on ${t}`,
  (t: string) => `Explain ${t} simply`,
];

function extractTopic(content: string): string {
  // Remove common prefixes and trim
  const cleaned = content
    .replace(/^(find |search youtube for |generate an image of |write an essay about |solve step by step: )/i, '')
    .trim();
  // Take first 30 chars, cut at last word boundary
  const short = cleaned.slice(0, 30);
  const lastSpace = short.lastIndexOf(' ');
  return lastSpace > 10 ? short.slice(0, lastSpace) : short;
}

export const ChatSuggestionChips = ({ sessions, onSelect }: ChatSuggestionChipsProps) => {
  // Collect last 5 unique user messages across sessions
  const userMessages: string[] = [];
  const sortedSessions = [...sessions].sort((a, b) => b.updatedAt - a.updatedAt);

  for (const session of sortedSessions) {
    const msgs = [...session.messages].reverse();
    for (const msg of msgs) {
      if (msg.role === 'user' && msg.content.length > 5 && userMessages.length < 5) {
        if (!userMessages.includes(msg.content)) userMessages.push(msg.content);
      }
    }
    if (userMessages.length >= 5) break;
  }

  let chips: string[];

  if (userMessages.length === 0) {
    chips = DEFAULT_SUGGESTIONS;
  } else {
    chips = [];
    userMessages.slice(0, 3).forEach((msg, i) => {
      const topic = extractTopic(msg);
      if (topic.length > 3) {
        chips.push(TEMPLATES[i % TEMPLATES.length](topic));
      }
    });
    // Pad with defaults if needed
    if (chips.length < 3) {
      for (const d of DEFAULT_SUGGESTIONS) {
        if (chips.length >= 4) break;
        if (!chips.includes(d)) chips.push(d);
      }
    }
  }

  if (chips.length === 0) return null;

  return (
    <div className="px-3 pb-1 pt-2 flex gap-2 flex-wrap">
      {chips.map((chip, i) => (
        <button
          key={i}
          onClick={() => onSelect(chip)}
          className="text-xs px-3 py-1.5 rounded-full border bg-background hover:bg-accent transition-colors text-muted-foreground hover:text-foreground truncate max-w-[200px]"
        >
          {chip}
        </button>
      ))}
    </div>
  );
};
