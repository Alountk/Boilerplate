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
      <div className="flex-1 overflow-y-auto p-4 space-y-3" aria-label="Loading conversations">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="h-20 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-700/40"
          />
        ))}
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="flex-1 overflow-y-auto p-8 text-center">
        <ChatBubbleLeftRightIcon className="h-12 w-12 mx-auto text-red-300 mb-4" />
        <p className="text-sm text-red-600 dark:text-red-400 mb-4">{errorMessage}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Retry
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {conversations.length === 0 ? (
        <div className="p-8 text-center">
          <ChatBubbleLeftRightIcon className="h-12 w-12 mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500 text-sm">No conversations yet. Start one from a product details page!</p>
        </div>
      ) : (
        conversations.map((conv) => (
          <button
            key={conv.id}
            onClick={() => onSelectConversation(conv)}
            className={`w-full p-4 flex gap-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors border-b border-gray-50 dark:border-gray-700/50 ${activeTab === conv.id ? 'bg-blue-50/50 dark:bg-blue-900/20' : ''}`}
          >
            <div className="relative shrink-0">
              <UserCircleIcon className="h-12 w-12 text-gray-400" />
              {conv.lastMessage && !conv.lastMessage.isRead && conv.lastMessage.senderId !== currentUser?.id && (
                <span className="absolute top-0 right-0 h-3 w-3 bg-blue-600 rounded-full border-2 border-white dark:border-gray-800" />
              )}
            </div>
            <div className="flex-1 text-left overflow-hidden">
              <div className="flex justify-between items-start">
                <span className="font-bold text-gray-900 dark:text-gray-100 truncate">
                  {currentUser?.id === conv.buyerId ? conv.sellerName : conv.buyerName}
                </span>
                <span className="text-[10px] text-gray-400 uppercase">
                  {conv.lastMessage ? new Date(conv.lastMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                </span>
              </div>
              <div className="text-xs text-blue-600 dark:text-blue-400 font-medium truncate mb-1">
                {conv.videogameName}
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                {conv.lastMessage?.text || "Started a conversation"}
              </p>
            </div>
          </button>
        ))
      )}
    </div>
  );
};
