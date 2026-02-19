import { useState } from 'react';
import { useMessaging } from '@/hooks/useMessaging';
import { useAuth } from '@/contexts/AuthContext';
import { ConversationList } from './ConversationList';
import { ChatPanel } from './ChatPanel';
import { NewChatDialog } from './NewChatDialog';
import { cn } from '@/lib/utils';

export const MessagingPage = () => {
  const { user } = useAuth();
  const [newChatOpen, setNewChatOpen] = useState(false);
  const [showChat, setShowChat] = useState(false);

  const {
    conversations, activeConversation, messages,
    loadingConversations, loadingMessages,
    typingUsers, onlineUsers,
    selectConversation, sendMessage, uploadFile,
    createConversation, broadcastTyping, setActiveConversation,
  } = useMessaging();

  if (!user) return null;

  const handleSelectConversation = async (conv: any) => {
    await selectConversation(conv);
    setShowChat(true);
  };

  const handleBack = () => {
    setShowChat(false);
    setActiveConversation(null);
  };

  const handleCreateChat = async (type: 'private' | 'group', userIds: string[], name?: string) => {
    const conv = await createConversation(type, userIds, name);
    if (conv) {
      await selectConversation(conv as any);
      setShowChat(true);
    }
  };

  const handleSendMessage = (content: string, type?: string, fileUrl?: string, fileName?: string, fileSize?: number) => {
    if (!activeConversation) return;
    sendMessage(activeConversation.id, content, type, fileUrl, fileName, fileSize);
  };

  return (
    <div className="h-[calc(100vh-120px)] flex rounded-xl overflow-hidden border bg-background shadow-sm">
      {/* Conversation List - hidden on mobile when chat is open */}
      <div className={cn(
        'w-full lg:w-[340px] lg:min-w-[340px] shrink-0',
        showChat ? 'hidden lg:flex lg:flex-col' : 'flex flex-col'
      )}>
        <ConversationList
          conversations={conversations}
          activeConversationId={activeConversation?.id || null}
          currentUserId={user.id}
          onlineUsers={onlineUsers}
          loading={loadingConversations}
          onSelect={handleSelectConversation}
          onNewChat={() => setNewChatOpen(true)}
        />
      </div>

      {/* Chat Panel - full width on mobile */}
      <div className={cn(
        'flex-1 min-w-0',
        !showChat ? 'hidden lg:flex' : 'flex'
      )}>
        <ChatPanel
          conversation={activeConversation}
          messages={messages}
          currentUserId={user.id}
          onlineUsers={onlineUsers}
          typingUsers={typingUsers}
          loadingMessages={loadingMessages}
          onSendMessage={handleSendMessage}
          onUploadFile={uploadFile}
          onTyping={broadcastTyping}
          onBack={handleBack}
        />
      </div>

      <NewChatDialog
        open={newChatOpen}
        onClose={() => setNewChatOpen(false)}
        onCreateChat={handleCreateChat}
      />
    </div>
  );
};
