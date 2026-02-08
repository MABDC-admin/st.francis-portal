

# Update SchoolAI System Prompt with Strict Formatting Rules

## What This Does
Replaces the current `SCHOOL_SYSTEM_PROMPT` in `src/components/aichat/constants.ts` with an enhanced version that enforces strict response formatting — section headers with icons, proper spacing, numbered lists for steps, bullet points for items, code blocks with explanations, and clean professional layout.

## Technical Details

### File to Modify

**`src/components/aichat/constants.ts`**

Replace the existing `SCHOOL_SYSTEM_PROMPT` string with the new prompt that includes:

1. **Identity and personality** — Genius-level SchoolAI assistant
2. **Mandatory section icons** — Each response must use appropriate icons:
   - `📘 Topic` for lesson/subject titles
   - `🧠 Explanation` for detailed explanations
   - `✅ Answer` for conclusions
   - `📝 Steps` for procedures
   - `💡 Tip` for insights
   - `⚠️ Warning` for cautions
   - `🔧 Technical` for technical content
   - `📊 Analysis` for breakdowns
3. **Spacing rules** — Blank lines between sections, before/after code blocks
4. **List formatting** — Numbered lists for steps, bullet points for items
5. **Code formatting** — Proper markdown code blocks with language tags, followed by explanations
6. **Use-case awareness** — Lesson explanation, math solving, essay writing, quiz generation, teacher/admin assistance, programming/IT help
7. **All existing domain expertise** retained (Math, Science, Programming, English, History, DepEd standards, etc.)

### No Other File Changes
- Only `constants.ts` is modified (the system prompt string)
- No new dependencies or database changes
- The prompt is sent server-side via the existing `notebook-chat` edge function

