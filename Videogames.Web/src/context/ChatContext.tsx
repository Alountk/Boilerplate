"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import * as signalR from "@microsoft/signalr";
import { Message, Conversation } from "../domain/models/Chat";
import { useAuth } from "./AuthContext";
import { HUB_URL } from "../constants/config";
import { ChatService } from "../infrastructure/services/ChatService";

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
  const [loading, setLoading] = useState(false);

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
        accessTokenFactory: () => localStorage.getItem("token") || "",
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
      // Update messages if it's for the active conversation
      setMessages((prev) => {
        if (prev.some(m => m.id === message.id)) return prev;
        // Only append if it's the current active conversation
        // (Wait, logic here: we might want to update conversations list even if not active)
        return message.conversationId === activeConversationId ? [...prev, message] : prev;
      });
      
      // Update conversations list with the latest message and sort
      setConversations(prev => {
        const updated = prev.map(c => {
          if (c.id === message.conversationId) {
            return { ...c, lastMessage: message };
          }
          return c;
        });
        
        // If it's a new conversation not in list, we might need to refresh
        if (!updated.some(c => c.id === message.conversationId)) {
            refreshConversations();
            return prev;
        }

        return updated.sort((a, b) => {
            const dateA = a.lastMessage?.createdAt || a.createdAt;
            const dateB = b.lastMessage?.createdAt || b.createdAt;
            return new Date(dateB).getTime() - new Date(dateA).getTime();
        });
      });
    });

    return () => {
      newConnection.stop();
    };
  }, [user, activeConversationId, refreshConversations]);

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
    if (connection && connection.state === signalR.HubConnectionState.Connected) {
      await connection.invoke("SendMessage", conversationId, text);
    }
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
