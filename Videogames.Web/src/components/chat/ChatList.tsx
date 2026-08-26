"use client";

import React from "react";
import {
  ChatBubbleLeftRightIcon,
  UserCircleIcon
} from "@heroicons/react/24/outline";
import { Conversation } from "../../domain/models/Chat";
import { User } from "../../domain/models/User";

interface ChatListProps {
  conversations: Conversation[];
  activeTab: string | null;
  onSelectConversation: (conv: Conversation) => void;
  currentUser: User | null;
  loading?: boolean;
  errorMessage?: string | null;
  onRetry?: () => void;
}

export const ChatList: React.FC<ChatListProps> = ({
  conversations,
  activeTab,
  onSelectConversation,
  currentUser,
  loading,
  errorMessage,
  onRetry,
}) => {
  if (loading) {
    return (
      <div className="flex-1 space-y-3 overflow-y-auto p-4" aria-label="Loading conversations">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="h-20 animate-pulse border border-outline bg-surface-1/40"
          />
        ))}
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="flex-1 overflow-y-auto p-8 text-center">
        <ChatBubbleLeftRightIcon className="mx-auto mb-4 h-12 w-12 text-error" />
        <p className="mb-4 text-sm text-error">{errorMessage}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="min-h-11 border border-secondary bg-secondary/10 px-4 font-mono text-xs uppercase tracking-widest text-secondary transition-colors active:bg-secondary/20"
          >
            Retry
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-surface">
      {conversations.length === 0 ? (
        <div className="p-8 text-center">
          <ChatBubbleLeftRightIcon className="mx-auto mb-4 h-12 w-12 text-on-surface-muted" />
          <p className="text-sm text-on-surface-muted">No conversations yet. Start one from a product details page!</p>
        </div>
      ) : (
        conversations.map((conv) => (
          <button
            key={conv.id}
            onClick={() => onSelectConversation(conv)}
            className={`flex w-full gap-4 border-b border-outline bg-surface p-4 text-left transition-colors active:bg-surface-1/60 ${
              activeTab === conv.id ? 'bg-surface-1/60' : 'hover:bg-surface-1/30'
            }`}
          >
            <div className="relative shrink-0">
              <UserCircleIcon className="h-12 w-12 text-on-surface-muted" />
              {conv.lastMessage && !conv.lastMessage.isRead && conv.lastMessage.senderId !== currentUser?.id && (
                <span className="absolute right-0 top-0 h-3 w-3 rounded-full border-2 border-surface bg-secondary" />
              )}
            </div>
            <div className="flex-1 overflow-hidden text-left">
              <div className="flex items-start justify-between">
                <span className="truncate font-bold text-on-surface">
                  {currentUser?.id === conv.buyerId ? conv.sellerName : conv.buyerName}
                </span>
                <span className="font-mono text-[10px] uppercase text-on-surface-muted">
                  {conv.lastMessage ? new Date(conv.lastMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                </span>
              </div>
              <div className="mb-1 truncate font-mono text-xs text-secondary">
                {conv.videogameName}
              </div>
              <p className="truncate text-sm text-on-surface-muted">
                {conv.lastMessage?.text || "Started a conversation"}
              </p>
            </div>
          </button>
        ))
      )}
    </div>
  );
};
