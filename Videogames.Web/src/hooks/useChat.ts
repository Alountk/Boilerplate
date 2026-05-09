import { useChatContext } from "../context/ChatContext";

export function useChat() {
  const context = useChatContext();
  
  return {
    connection: context.connection,
    realtimeStatus: context.realtimeStatus,
    messages: context.messages,
    setMessages: context.setMessages,
    conversations: context.conversations,
    setConversations: context.setConversations,
    joinConversation: context.joinConversation,
    leaveConversation: context.leaveConversation,
    sendMessage: context.sendMessage,
    activeConversationId: context.activeConversationId,
    setActiveConversationId: context.setActiveConversationId,
    refreshConversations: context.refreshConversations
  };
}
