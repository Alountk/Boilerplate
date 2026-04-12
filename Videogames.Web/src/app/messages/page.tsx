"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useChat } from "../../hooks/useChat";
import { ChatService } from "../../infrastructure/services/ChatService";
import { Conversation } from "../../domain/models/Chat";
import { 
  ChatBubbleLeftRightIcon
} from "@heroicons/react/24/outline";
import { ChatList } from "../../components/chat/ChatList";
import { useSearchParams } from "next/navigation";
import { ChatRoom } from "../../components/chat/ChatRoom";

function MessagesPageContent() {
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const { 
    messages, 
    setMessages, 
    conversations, 
    setConversations, 
    joinConversation, 
    leaveConversation, 
    sendMessage,
    activeConversationId,
    setActiveConversationId
  } = useChat();

  const [loading, setLoading] = useState(true);
  // Use stable service instance
  const [chatService] = useState(() => new ChatService());

  const handleSelectConversation = useCallback(async (conv: Conversation) => {
    if (activeConversationId) {
      await leaveConversation(activeConversationId);
    }
    setActiveConversationId(conv.id);
    setLoading(true);
    try {
      const history = await chatService.getMessages(conv.id);
      setMessages(history);
      await joinConversation(conv.id);
      await chatService.markAsRead(conv.id);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [activeConversationId, chatService, joinConversation, leaveConversation, setActiveConversationId, setMessages]);

  // Effect 1: Load conversations when user is ready
  useEffect(() => {
    if (user) {
      chatService.getConversations().then((data) => {
        setConversations(data);
        setLoading(false);
      });
    }
  }, [user, chatService, setConversations]);

  // Effect 2: Auto-select conversation from ?conv= URL param once conversations are loaded
  useEffect(() => {
    const convId = searchParams.get("conv");
    if (!convId || activeConversationId || conversations.length === 0) return;

    const targetConv = conversations.find(c => c.id === convId);
    if (targetConv) {
      handleSelectConversation(targetConv);
    }
  }, [conversations, searchParams, activeConversationId, handleSelectConversation]);

  const onSendMessage = async (text: string) => {
    if (!activeConversationId) return;
    await sendMessage(activeConversationId, text);
  };

  if (authLoading) return <div className="min-h-screen animate-pulse bg-gray-50 dark:bg-gray-900" />;

  const activeConv = conversations.find(c => c.id === activeConversationId);

  return (
    <div className="flex h-[calc(100vh-64px)] bg-gray-100 dark:bg-gray-900 overflow-hidden pt-1">
      {/* Sidebar: Conversations List */}
      <aside className={`w-full md:w-80 lg:w-96 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col ${activeConversationId ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 border-b border-gray-100 dark:border-gray-700">
          <h2 className="text-xl font-bold dark:text-white flex items-center gap-2">
            <ChatBubbleLeftRightIcon className="h-6 w-6 text-blue-600" />
            Messages
          </h2>
        </div>
        
        <ChatList 
            conversations={conversations}
            activeTab={activeConversationId}
            onSelectConversation={handleSelectConversation}
            currentUser={user}
            loading={loading}
        />
      </aside>

      {/* Main Chat Area */}
      <main className={`flex-1 flex flex-col bg-gray-50 dark:bg-gray-950 ${!activeConversationId ? 'hidden md:flex' : 'flex'}`}>
        {activeConversationId && activeConv ? (
          <ChatRoom 
            activeConv={activeConv}
            messages={messages}
            currentUser={user}
            onSendMessage={onSendMessage}
            onBack={() => setActiveConversationId(null)}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center p-12 text-center opacity-40">
            <div>
              <div className="h-24 w-24 bg-gray-200 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
                 <ChatBubbleLeftRightIcon className="h-12 w-12 text-gray-400" />
              </div>
              <h2 className="text-2xl font-bold dark:text-white mb-2">Your Conversations</h2>
              <p className="dark:text-gray-400">Select a chat from the sidebar to start messaging. We recommend keeping all deals within vMarket for your safety.</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function MessagesPage() {
  return (
    <Suspense fallback={<div className="min-h-screen animate-pulse bg-gray-50 dark:bg-gray-900" />}>
      <MessagesPageContent />
    </Suspense>
  );
}
