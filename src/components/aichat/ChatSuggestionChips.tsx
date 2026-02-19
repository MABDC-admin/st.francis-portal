import { useMemo } from 'react';
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
  'Write a story',
  'Create flashcards',
  'Translate a sentence',
  'Create a quiz',
  'Summarize a topic',
  'Write a poem',
  'Design a worksheet',
];

const CHIP_COLORS = [
  'border-blue-200 bg-blue-50 text-blue-700',
  'border-green-200 bg-green-50 text-green-700',
  'border-purple-200 bg-purple-50 text-purple-700',
  'border-pink-200 bg-pink-50 text-pink-700',
  'border-amber-200 bg-amber-50 text-amber-700',
  'border-teal-200 bg-teal-50 text-teal-700',
  'border-indigo-200 bg-indigo-50 text-indigo-700',
  'border-rose-200 bg-rose-50 text-rose-700',
  'border-cyan-200 bg-cyan-50 text-cyan-700',
  'border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700',
  'border-emerald-200 bg-emerald-50 text-emerald-700',
  'border-orange-200 bg-orange-50 text-orange-700',
];

const TEMPLATES = [
  (t: string) => `Continue: ${t}`,
  (t: string) => `Quiz me on ${t}`,
  (t: string) => `Explain ${t} simply`,
  (t: string) => `Deeper dive into ${t}`,
  (t: string) => `Create a worksheet on ${t}`,
  (t: string) => `Summarize ${t}`,
  (t: string) => `Debate about ${t}`,
];

function extractTopic(content: string): string {
  const cleaned = content
    .replace(/^(find |search youtube for |generate an image of |write an essay about |solve step by step: |create a .* for )/i, '')
    .trim();
  const short = cleaned.slice(0, 30);
  const lastSpace = short.lastIndexOf(' ');
  return lastSpace > 10 ? short.slice(0, lastSpace) : short;
}

// Simple seeded shuffle so chips rotate per-session but stay stable during render
function shuffleWithSeed<T>(arr: T[], seed: number): T[] {
  const copy = [...arr];
  let s = seed;
  for (let i = copy.length - 1; i > 0; i--) {
    s = (s * 9301 + 49297) % 233280;
    const j = s % (i + 1);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export const ChatSuggestionChips = ({ sessions, onSelect }: ChatSuggestionChipsProps) => {
  const chips = useMemo(() => {
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

    let result: string[];

    if (userMessages.length === 0) {
      // Shuffle defaults with a daily seed so they rotate
      const daySeed = Math.floor(Date.now() / 86400000);
      result = shuffleWithSeed(DEFAULT_SUGGESTIONS, daySeed).slice(0, 8);
    } else {
      result = [];
      userMessages.slice(0, 4).forEach((msg, i) => {
        const topic = extractTopic(msg);
        if (topic.length > 3) {
          result.push(TEMPLATES[i % TEMPLATES.length](topic));
        }
      });
      if (result.length < 4) {
        for (const d of DEFAULT_SUGGESTIONS) {
          if (result.length >= 6) break;
          if (!result.includes(d)) result.push(d);
        }
      }
    }

    return result;
  }, [sessions]);

  if (chips.length === 0) return null;

  return (
    <div className="px-3 pb-1 pt-2 flex gap-2 flex-wrap">
      {chips.map((chip, i) => (
        <button
          key={i}
          onClick={() => onSelect(chip)}
          className={`text-xs px-3 py-1.5 rounded-full border transition-colors hover:opacity-80 truncate max-w-[200px] ${CHIP_COLORS[i % CHIP_COLORS.length]}`}
        >
          {chip}
        </button>
      ))}
    </div>
  );
};
