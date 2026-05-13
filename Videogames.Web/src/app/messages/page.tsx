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
    realtimeStatus,
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

  const realtimeBadge = {
    connected: {
      dot: "bg-emerald-500",
      text: "Online",
      tone: "text-emerald-600 dark:text-emerald-400",
    },
    connecting: {
      dot: "bg-amber-500",
      text: "Connecting...",
      tone: "text-amber-600 dark:text-amber-400",
    },
    reconnecting: {
      dot: "bg-amber-500",
      text: "Reconnecting...",
      tone: "text-amber-600 dark:text-amber-400",
    },
    disconnected: {
      dot: "bg-rose-500",
      text: "Offline",
      tone: "text-rose-600 dark:text-rose-400",
    },
  }[realtimeStatus];

  const [conversationsLoading, setConversationsLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [conversationsError, setConversationsError] = useState<string | null>(null);
  const [historyError, setHistoryError] = useState<string | null>(null);
  // Use stable service instance
  const [chatService] = useState(() => new ChatService());

  const loadConversations = useCallback(async () => {
    if (!user) return;

    setConversationsLoading(true);
    setConversationsError(null);

    try {
      const data = await chatService.getConversations();
      setConversations(data);
    } catch {
      setConversationsError("We could not load your conversations. Please try again.");
    } finally {
      setConversationsLoading(false);
    }
  }, [chatService, setConversations, user]);

  const handleSelectConversation = useCallback(async (conv: Conversation) => {
    if (activeConversationId) {
      await leaveConversation(activeConversationId);
    }

    setHistoryError(null);
    setActiveConversationId(conv.id);
    setHistoryLoading(true);

    try {
      const history = await chatService.getMessages(conv.id);
      setMessages(history);
      await joinConversation(conv.id);
      await chatService.markAsRead(conv.id);
    } catch {
      setHistoryError("We could not load this conversation. Please try another chat or retry.");
    } finally {
      setHistoryLoading(false);
    }
  }, [activeConversationId, chatService, joinConversation, leaveConversation, setActiveConversationId, setMessages]);

  // Effect 1: Load conversations when user is ready
  useEffect(() => {
    if (user) {
      loadConversations();
      return;
    }

    setConversationsLoading(false);
    setConversationsError(null);
  }, [loadConversations, user]);

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
    <div className="flex flex-col min-h-screen bg-gray-100 dark:bg-gray-900">
      {user && !user.emailVerified && (
        <div className="bg-warning-container/20 border-b border-warning/40 px-4 py-3 flex items-start gap-3">
          <div className="w-5 h-5 rounded-full bg-warning flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-warning-container text-xs font-bold">!</span>
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-warning">Email verification required</p>
            <p className="text-xs text-on-surface-variant">Verify your email before sending messages. Go to your profile to complete verification.</p>
          </div>
        </div>
      )}

      <div className="flex h-[calc(100vh-64px)] bg-gray-100 dark:bg-gray-900 overflow-hidden pt-1">
      {/* Sidebar: Conversations List */}
      <aside className={`w-full md:w-80 lg:w-96 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col ${activeConversationId ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 border-b border-gray-100 dark:border-gray-700">
          <h2 className="text-xl font-bold dark:text-white flex items-center gap-2 mb-1">
            <ChatBubbleLeftRightIcon className="h-6 w-6 text-blue-600" />
            Messages
          </h2>
          <div className={`inline-flex items-center gap-2 text-xs font-semibold ${realtimeBadge.tone}`}>
            <span className={`h-2.5 w-2.5 rounded-full ${realtimeBadge.dot}`} />
            {realtimeBadge.text}
          </div>
        </div>
        
        <ChatList 
            conversations={conversations}
            activeTab={activeConversationId}
            onSelectConversation={handleSelectConversation}
            currentUser={user}
          loading={conversationsLoading}
          errorMessage={conversationsError}
          onRetry={loadConversations}
        />
      </aside>

      {/* Main Chat Area */}
      <main className={`flex-1 flex flex-col bg-gray-50 dark:bg-gray-950 ${!activeConversationId ? 'hidden md:flex' : 'flex'}`}>
        {realtimeStatus !== "connected" && (
          <div className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-xs font-medium text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300">
            {realtimeStatus === "disconnected"
              ? "Chat is offline. Trying to reconnect automatically."
              : "Connection is being restored. New messages may take a moment."}
          </div>
        )}

        {historyLoading ? (
          <div className="flex-1 p-8 space-y-4" aria-label="Loading conversation">
            <div className="h-5 w-40 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
            <div className="h-24 animate-pulse rounded-xl bg-gray-200 dark:bg-gray-700" />
            <div className="h-20 animate-pulse rounded-xl bg-gray-200 dark:bg-gray-700" />
          </div>
        ) : historyError ? (
          <div className="flex-1 flex items-center justify-center p-10 text-center">
            <div>
              <h2 className="text-xl font-bold dark:text-white mb-2">Conversation unavailable</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">{historyError}</p>
              <button
                onClick={() => setActiveConversationId(null)}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Back to list
              </button>
            </div>
          </div>
        ) : activeConversationId && activeConv ? (
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
