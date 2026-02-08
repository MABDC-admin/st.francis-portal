

# AI Chat Page with Gemini Flash

## Overview
Create a dedicated AI Chat page that lets all authenticated users have conversations with Google's Gemini Flash model through the built-in Lovable AI gateway. The page reuses the existing `notebook-chat` edge function (already configured with streaming and error handling).

## What You'll Get
- A full-screen chat interface with message bubbles, markdown rendering, and streaming responses
- Conversation history maintained during the session
- Loading indicators while the AI responds
- Error handling for rate limits (429) and credit issues (402)
- Responsive design for mobile and desktop
- Accessible from the sidebar under "Resources" as "AI Chat"

## Technical Details

### New File: `src/components/aichat/AIChatPage.tsx`
- Main chat component with:
  - State: `messages[]` array with `{role, content, id}`, `isLoading`, `error`
  - Streaming via `fetch` to the existing `notebook-chat` edge function with SSE parsing
  - System prompt: "You are a helpful AI assistant. Keep answers clear and concise. Use markdown formatting."
  - Model: `google/gemini-3-flash-preview`
  - Message rendering with `react-markdown` + `remark-gfm` (already installed)
  - Auto-scroll to latest message
  - Input with Enter-to-send (Shift+Enter for newline)
  - AbortController support for canceling in-flight requests
  - Toast notifications for 429/402 errors

### Modified File: `src/components/layout/DashboardLayout.tsx`
- Add `{ id: 'ai-chat', icon: NotebookIcon3D, label: 'AI Chat' }` to the Resources section for admin, registrar, and teacher nav groups
- Add icon mapping entries for `'ai-chat'`

### Modified File: `src/pages/Index.tsx`
- Import `AIChatPage`
- Add tab rendering: `{activeTab === 'ai-chat' && (role === 'admin' || role === 'teacher' || role === 'registrar') && <AIChatPage />}`

### No edge function changes needed
The existing `notebook-chat` function already supports:
- Streaming SSE responses
- Lovable AI gateway with `google/gemini-3-flash-preview`
- Auth verification
- Rate limit (429) and credit (402) error handling
