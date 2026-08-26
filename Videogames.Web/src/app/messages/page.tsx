"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useChat } from "../../hooks/useChat";
import { ChatService } from "../../infrastructure/services/ChatService";
import { Conversation } from "../../domain/models/Chat";
import { ChatBubbleLeftRightIcon } from "@heroicons/react/24/outline";
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
      dot: "bg-success",
      text: "ONLINE",
      tone: "text-success",
    },
    connecting: {
      dot: "bg-warning",
      text: "CONNECTING...",
      tone: "text-warning",
    },
    reconnecting: {
      dot: "bg-warning",
      text: "RECONNECTING...",
      tone: "text-warning",
    },
    disconnected: {
      dot: "bg-error",
      text: "OFFLINE",
      tone: "text-error",
    },
  }[realtimeStatus];

  const [conversationsLoading, setConversationsLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [conversationsError, setConversationsError] = useState<string | null>(null);
  const [historyError, setHistoryError] = useState<string | null>(null);
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

  useEffect(() => {
    if (user) {
      loadConversations();
      return;
    }

    setConversationsLoading(false);
    setConversationsError(null);
  }, [loadConversations, user]);

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

  if (authLoading) return <div className="min-h-screen animate-pulse bg-surface" />;

  const activeConv = conversations.find(c => c.id === activeConversationId);

  return (
    <div className="flex min-h-screen flex-col bg-surface">
      {user && !user.emailVerified && (
        <div className="flex items-start gap-3 border-b border-warning/40 bg-warning/10 px-4 py-3">
          <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-warning">
            <span className="text-xs font-bold text-warning-container">!</span>
          </div>
          <div className="flex-1">
            <p className="mb-1 text-sm font-semibold text-warning">Email verification required</p>
            <p className="text-xs text-on-surface-muted">Verify your email before sending messages. Go to your profile to complete verification.</p>
          </div>
        </div>
      )}

      <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-surface pt-1">
        {/* Sidebar: Conversations List */}
        <aside className={`flex w-full flex-col border-r border-outline bg-surface md:w-80 lg:w-96 ${activeConversationId ? 'hidden md:flex' : 'flex'}`}>
          <div className="border-b border-outline p-4">
            <h2 className="mb-1 flex items-center gap-2 font-[family-name:var(--font-space-grotesk)] text-xl font-bold text-on-surface">
              <ChatBubbleLeftRightIcon className="h-6 w-6 text-secondary" />
              Messages
            </h2>
            <div
              data-testid="chat-connection-status"
              className={`inline-flex items-center gap-2 font-mono text-xs font-semibold ${realtimeBadge.tone}`}
            >
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
        <main className={`flex-1 flex flex-col bg-surface ${!activeConversationId ? 'hidden md:flex' : 'flex'}`}>
          {realtimeStatus !== "connected" && (
            <div className="flex items-center gap-2 border-b border-warning/40 bg-warning/10 px-4 py-2 font-mono text-xs text-warning">
              {realtimeStatus === "disconnected"
                ? "CHAT OFFLINE. TRYING TO RECONNECT."
                : "RESTORING CONNECTION..."}
            </div>
          )}

          {historyLoading ? (
            <div className="flex-1 space-y-4 p-8" aria-label="Loading conversation">
              <div className="h-5 w-40 animate-pulse border border-outline bg-surface-1/40" />
              <div className="h-24 animate-pulse border border-outline bg-surface-1/40" />
              <div className="h-20 animate-pulse border border-outline bg-surface-1/40" />
            </div>
          ) : historyError ? (
            <div className="flex flex-1 items-center justify-center p-10 text-center">
              <div>
                <h2 className="mb-2 font-[family-name:var(--font-space-grotesk)] text-xl font-bold text-on-surface">Conversation unavailable</h2>
                <p className="mb-5 text-sm text-on-surface-muted">{historyError}</p>
                <button
                  onClick={() => setActiveConversationId(null)}
                  className="min-h-11 border border-secondary bg-secondary/10 px-4 font-mono text-xs uppercase tracking-widest text-secondary transition-colors active:bg-secondary/20"
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
            <div className="flex flex-1 items-center justify-center p-12 text-center opacity-50">
              <div>
                <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center border border-outline bg-surface-1/40">
                  <ChatBubbleLeftRightIcon className="h-12 w-12 text-on-surface-muted" />
                </div>
                <h2 className="mb-2 font-[family-name:var(--font-space-grotesk)] text-2xl font-bold text-on-surface">Your Conversations</h2>
                <p className="text-on-surface-muted">Select a chat from the sidebar to start messaging. We recommend keeping all deals within vMarket for your safety.</p>
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
    <Suspense fallback={<div className="min-h-screen animate-pulse bg-surface" />}>
      <MessagesPageContent />
    </Suspense>
  );
}
