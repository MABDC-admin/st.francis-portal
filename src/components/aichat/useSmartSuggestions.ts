import { useMemo } from 'react';
import type { ChatSession } from './types';

export interface SmartSuggestion {
  emoji: string;
  label: string;
  prefill: string;
  reason: string;
}

function getTimeOfDay(): 'morning' | 'afternoon' | 'evening' {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}

const TIME_SUGGESTIONS: Record<string, SmartSuggestion[]> = {
  morning: [
    { emoji: '📋', label: 'Lesson Plan', prefill: 'Create a DepEd MELC lesson plan for ', reason: 'Morning lesson prep' },
    { emoji: '🔥', label: 'Warm-up Activity', prefill: 'Create a fun warm-up activity for ', reason: 'Start the day right' },
    { emoji: '📅', label: 'Daily Schedule', prefill: 'Help me plan today\'s class schedule for ', reason: 'Organize your morning' },
  ],
  afternoon: [
    { emoji: '📊', label: 'Quiz Creator', prefill: 'Create a 10-item quiz about ', reason: 'Afternoon assessment' },
    { emoji: '📝', label: 'Grade Helper', prefill: 'Help me compute grades for ', reason: 'Grading time' },
    { emoji: '📌', label: 'Summarize Lesson', prefill: 'Summarize the key points of ', reason: 'Wrap up the lesson' },
  ],
  evening: [
    { emoji: '💡', label: 'Study Tips', prefill: 'Give me effective study tips for ', reason: 'Evening review' },
    { emoji: '📖', label: 'Reading List', prefill: 'Suggest reading materials about ', reason: 'Wind-down reading' },
    { emoji: '🧘', label: 'Mindfulness', prefill: 'Create a mindfulness activity for ', reason: 'End-of-day wellness' },
  ],
};

const EXPLORE_POOL: SmartSuggestion[] = [
  { emoji: '🎨', label: 'Art Critique', prefill: 'Analyze this artwork: ', reason: 'Try something new' },
  { emoji: '🧬', label: 'Biology Explainer', prefill: 'Explain in biology: ', reason: 'Explore science' },
  { emoji: '📐', label: 'Rubric Generator', prefill: 'Create a rubric for ', reason: 'Assessment tool' },
  { emoji: '🗺️', label: 'Map Analysis', prefill: 'Help me analyze this map of ', reason: 'Geography exploration' },
  { emoji: '🎯', label: 'Trivia Game', prefill: 'Create a trivia game about ', reason: 'Fun & engaging' },
  { emoji: '🧪', label: 'Science Experiment', prefill: 'Suggest a science experiment about ', reason: 'Hands-on learning' },
  { emoji: '✍️', label: 'Creative Writing', prefill: 'Write a creative story about ', reason: 'Spark creativity' },
  { emoji: '🌍', label: 'Climate Explainer', prefill: 'Explain climate change effects on ', reason: 'Environmental awareness' },
  { emoji: '📰', label: 'Current Events', prefill: 'Discuss recent news about ', reason: 'Stay informed' },
  { emoji: '🎵', label: 'Music Theory', prefill: 'Explain this music concept: ', reason: 'Explore the arts' },
];

function extractTopics(sessions: ChatSession[]): string[] {
  const topics: string[] = [];
  const sorted = [...sessions].sort((a, b) => b.updatedAt - a.updatedAt);
  for (const s of sorted) {
    for (const m of [...s.messages].reverse()) {
      if (m.role === 'user' && m.content.length > 5 && topics.length < 5) {
        const cleaned = m.content
          .replace(/^(find |search youtube for |generate an image of |write an essay about |solve step by step: |create a .* for )/i, '')
          .trim()
          .slice(0, 30);
        const lastSpace = cleaned.lastIndexOf(' ');
        const topic = lastSpace > 8 ? cleaned.slice(0, lastSpace) : cleaned;
        if (topic.length > 3 && !topics.includes(topic)) topics.push(topic);
      }
    }
    if (topics.length >= 5) break;
  }
  return topics;
}

const TOPIC_TEMPLATES: ((t: string) => SmartSuggestion)[] = [
  (t) => ({ emoji: '🔄', label: `Continue: ${t.slice(0, 20)}`, prefill: `Tell me more about ${t}`, reason: 'Based on your history' }),
  (t) => ({ emoji: '📝', label: `Quiz on ${t.slice(0, 20)}`, prefill: `Create a quiz about ${t}`, reason: 'Test your knowledge' }),
  (t) => ({ emoji: '📊', label: `Worksheet: ${t.slice(0, 18)}`, prefill: `Create a worksheet about ${t}`, reason: 'Practice makes perfect' }),
];

export function useSmartSuggestions(sessions: ChatSession[]): SmartSuggestion[] {
  return useMemo(() => {
    const suggestions: SmartSuggestion[] = [];
    const time = getTimeOfDay();
    const topics = extractTopics(sessions);

    // 1-2 topic-based suggestions
    topics.slice(0, 2).forEach((topic, i) => {
      suggestions.push(TOPIC_TEMPLATES[i % TOPIC_TEMPLATES.length](topic));
    });

    // 1 time-based suggestion
    const timeSugs = TIME_SUGGESTIONS[time];
    suggestions.push(timeSugs[Math.floor(Math.random() * timeSugs.length)]);

    // 1-2 explore suggestions (random from pool)
    const shuffled = [...EXPLORE_POOL].sort(() => Math.random() - 0.5);
    const needed = Math.max(0, 5 - suggestions.length);
    suggestions.push(...shuffled.slice(0, needed));

    return suggestions.slice(0, 5);
  }, [sessions]);
}
