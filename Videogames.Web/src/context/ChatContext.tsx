"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode, useRef } from "react";
import * as signalR from "@microsoft/signalr";
import { Message, Conversation } from "../domain/models/Chat";
import { useAuth } from "./AuthContext";
import { HUB_URL } from "../constants/config";
import { ChatService } from "../infrastructure/services/ChatService";
import { TokenService } from "../infrastructure/services/TokenService";

interface ChatContextType {
  connection: signalR.HubConnection | null;
  messages: Message[];
  conversations: Conversation[];
  loading: boolean;
  activeConversationId: string | null;
  setActiveConversationId: (id: string | null) => void;
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  setConversations: React.Dispatch<React.SetStateAction<Conversation[]>>;
  joinConversation: (conversationId: string) => Promise<void>;
  leaveConversation: (conversationId: string) => Promise<void>;
  sendMessage: (conversationId: string, text: string) => Promise<void>;
  refreshConversations: () => Promise<void>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [connection, setConnection] = useState<signalR.HubConnection | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const activeConvIdRef = useRef<string | null>(null);
  const [loading] = useState(false);

  // Keep ref in sync so SignalR handlers always see the latest value
  useEffect(() => {
    activeConvIdRef.current = activeConversationId;
  }, [activeConversationId]);

  const refreshConversations = useCallback(async () => {
    if (!user) return;
    const chatService = new ChatService();
    const data = await chatService.getConversations();
    setConversations(data);
  }, [user]);

  useEffect(() => {
    if (!user) {
      if (connection) {
        connection.stop();
        setConnection(null);
      }
      setConversations([]);
      setMessages([]);
      return;
    }

    refreshConversations();

    const newConnection = new signalR.HubConnectionBuilder()
      .withUrl(HUB_URL, {
        accessTokenFactory: () => TokenService.getToken() ?? "",
      })
      .withAutomaticReconnect()
      .build();

    newConnection
      .start()
      .then(() => {
        console.log("Connected to Chat Hub");
        setConnection(newConnection);
      })
      .catch((err) => console.error("SignalR Connection Error: ", err));

    newConnection.on("ReceiveMessage", (message: Message) => {
      // Use ref to avoid stale closure — always reads current activeConversationId
      setMessages((prev) => {
        if (prev.some(m => m.id === message.id)) return prev;
        return message.conversationId === activeConvIdRef.current ? [...prev, message] : prev;
      });
      
      // Update conversations list with the latest message and sort
      setConversations(prev => {
        const inList = prev.some(c => c.id === message.conversationId);
        
        // If it's a brand-new conversation not in the list, refresh
        if (!inList) {
          refreshConversations();
          return prev;
        }

        return prev
          .map(c => c.id === message.conversationId ? { ...c, lastMessage: message } : c)
          .sort((a, b) => {
            const dateA = a.lastMessage?.createdAt || a.createdAt;
            const dateB = b.lastMessage?.createdAt || b.createdAt;
            return new Date(dateB).getTime() - new Date(dateA).getTime();
          });
      });
    });

    return () => {
      newConnection.stop();
    };
  // Only re-create the connection when the user changes (not on every conversation switch)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const joinConversation = useCallback(async (conversationId: string) => {
    if (connection && connection.state === signalR.HubConnectionState.Connected) {
      await connection.invoke("JoinConversation", conversationId);
    }
  }, [connection]);

  const leaveConversation = useCallback(async (conversationId: string) => {
    if (connection && connection.state === signalR.HubConnectionState.Connected) {
      await connection.invoke("LeaveConversation", conversationId);
    }
  }, [connection]);

  const sendMessage = useCallback(async (conversationId: string, text: string) => {
    if (!connection || connection.state !== signalR.HubConnectionState.Connected) return;

    // Optimistic update: show message immediately in sender's UI
    // The server will broadcast it back via ReceiveMessage which will deduplicate by id
    const optimisticMsg: Message = {
      id: `optimistic-${Date.now()}`,
      conversationId,
      senderId: "", // filled by server, but we render regardless
      text,
      createdAt: new Date().toISOString(),
      isRead: false,
    };
    setMessages(prev => [...prev, optimisticMsg]);

    await connection.invoke("SendMessage", conversationId, text);
  }, [connection]);

  return (
    <ChatContext.Provider
      value={{
        connection,
        messages,
        conversations,
        loading,
        activeConversationId,
        setActiveConversationId,
        setMessages,
        setConversations,
        joinConversation,
        leaveConversation,
        sendMessage,
        refreshConversations
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChatContext = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChatContext must be used within a ChatProvider");
  }
  return context;
};
