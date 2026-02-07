

# Admin-Teacher Communication Page

## Overview
A real-time messaging system accessible to admins and teachers, featuring private 1-on-1 chats and group conversations. The UI will follow a modern messenger-style layout (similar to WhatsApp/Messenger) with a left sidebar for conversations and a right panel for the active chat.

## Features
- Private chat between admin and individual teachers
- Group chat between admin and multiple teachers
- Real-time messaging with typing indicators and online/offline presence
- Message status tracking (sent, delivered, seen)
- File attachment support (PDF, images, documents) via storage bucket
- Search across messages and conversations
- Unread message badge in sidebar navigation
- Access restricted to admin and teacher roles only

## UI Layout

```text
+---------------------------+--------------------------------------+
|   Conversation List       |         Active Chat                  |
|                           |                                      |
| [Search conversations...] | [Chat Header: name, status, avatar]  |
|                           |                                      |
| - Teacher A (2 unread)    | +----------------------------------+ |
| - Group: Math Dept (1)    | |  Message bubbles (scrollable)    | |
| - Teacher B               | |  - Sent/received alignment       | |
| - Group: All Staff        | |  - Timestamps, status icons      | |
|                           | |  - File attachments              | |
|                           | |  - Typing indicator              | |
|                           | +----------------------------------+ |
| [+ New Chat]              |                                      |
| [+ New Group]             | [Attachment] [Message input] [Send]  |
+---------------------------+--------------------------------------+
```

---

## Technical Details

### Database Tables (4 new tables)

**1. `conversations`** -- Stores chat rooms (private or group)
- `id` (uuid, PK)
- `type` (text: 'private' or 'group')
- `name` (text, nullable -- used for group chats)
- `created_by` (uuid, references auth.users)
- `school_id` (text, references schools)
- `created_at`, `updated_at` (timestamptz)

**2. `conversation_participants`** -- Links users to conversations
- `id` (uuid, PK)
- `conversation_id` (uuid, FK to conversations)
- `user_id` (uuid, references auth.users)
- `role` (text: 'admin' or 'member')
- `last_read_at` (timestamptz)
- `joined_at` (timestamptz)
- Unique constraint on (conversation_id, user_id)

**3. `messages`** -- Stores individual messages
- `id` (uuid, PK)
- `conversation_id` (uuid, FK to conversations)
- `sender_id` (uuid, references auth.users)
- `content` (text, nullable)
- `message_type` (text: 'text', 'file', 'image', 'system')
- `file_url` (text, nullable)
- `file_name` (text, nullable)
- `file_size` (bigint, nullable)
- `created_at` (timestamptz)
- `updated_at` (timestamptz)

**4. `message_receipts`** -- Tracks delivered/seen status per recipient
- `id` (uuid, PK)
- `message_id` (uuid, FK to messages)
- `user_id` (uuid, references auth.users)
- `status` (text: 'delivered' or 'seen')
- `status_at` (timestamptz)
- Unique constraint on (message_id, user_id)

### Storage
- New `chat-attachments` storage bucket (private) for file uploads
- RLS policies allowing authenticated admin/teacher users to upload and read

### Realtime
- Enable Supabase Realtime on `messages` table for instant message delivery
- Use Supabase Presence (channel-based) for online/offline status and typing indicators

### RLS Policies
- All 4 tables have RLS enabled
- Users can only read/write conversations they participate in
- Uses the existing `has_role()` security definer function to verify admin/teacher role
- Message insert restricted to conversation participants
- Receipts can only be updated by the target user

### New Files

1. **`src/components/messaging/MessagingPage.tsx`** -- Main page container with conversation list + chat panel layout
2. **`src/components/messaging/ConversationList.tsx`** -- Left sidebar: search, conversation cards with unread badges, new chat/group buttons
3. **`src/components/messaging/ChatPanel.tsx`** -- Right panel: message area, input box, file upload, typing indicator
4. **`src/components/messaging/MessageBubble.tsx`** -- Individual message component with alignment, status icons, timestamps, file previews
5. **`src/components/messaging/NewChatDialog.tsx`** -- Dialog to start a private chat (select a teacher) or create a group (select multiple)
6. **`src/components/messaging/ChatHeader.tsx`** -- Shows recipient name/avatar, online status, group members
7. **`src/hooks/useMessaging.ts`** -- Custom hook for all messaging logic: fetch conversations, send messages, realtime subscriptions, presence tracking, typing indicators, file uploads
8. **`src/hooks/useUnreadCount.ts`** -- Hook that returns total unread message count for the nav badge

### Modified Files

1. **`src/components/layout/DashboardLayout.tsx`**
   - Add "Messages" nav item under "School Management" group for admin, and as standalone for teacher
   - Add icon mapping entries for `messages` tab
   - Show unread count badge on the Messages nav item

2. **`src/pages/Index.tsx`**
   - Add rendering block for `activeTab === 'messages'` with access check for admin/teacher roles
   - Import and render `<MessagingPage />`

### How It Works

1. **Starting a chat**: User clicks "New Chat" to select a teacher (or admin), or "New Group" to select multiple participants. A `conversations` row is created with linked `conversation_participants`.

2. **Sending messages**: Messages are inserted into the `messages` table. Supabase Realtime broadcasts the insert to all participants subscribed to that conversation's channel.

3. **File attachments**: Files are uploaded to the `chat-attachments` storage bucket. The returned URL is saved in the message's `file_url` field.

4. **Read receipts**: When a user opens a conversation, their `last_read_at` is updated in `conversation_participants`. Individual message receipts are inserted/updated in `message_receipts` for "delivered" and "seen" states.

5. **Typing indicators**: Uses Supabase Realtime Presence on a per-conversation channel. When a user types, they broadcast a typing event; other participants display the indicator.

6. **Online status**: Uses a global Presence channel where each user tracks their online state. The conversation list and chat header reflect this.

7. **Unread badges**: The `useUnreadCount` hook compares each conversation's latest message timestamp against the user's `last_read_at` to compute unread counts, displayed both on individual conversations and as a total badge on the sidebar nav item.

