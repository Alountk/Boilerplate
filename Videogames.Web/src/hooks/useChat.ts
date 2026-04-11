import { useEffect, useRef, useState, useCallback } from "react";
import * as signalR from "@microsoft/signalr";
import { MessageDto, ConversationDto } from "../infrastructure/services/ChatService";
import { useAuth } from "../context/AuthContext";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5017/api";
const HUB_URL = API_URL.replace("/api", "/hubs/chat");

export function useChat() {
  const { user } = useAuth();
  const [connection, setConnection] = useState<signalR.HubConnection | null>(null);
  const [messages, setMessages] = useState<MessageDto[]>([]);
  const [conversations, setConversations] = useState<ConversationDto[]>([]);
  const messagesRef = useRef<MessageDto[]>([]);

  // Update ref when messages state changes to use inside SignalR callback
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    if (!user) return;

    const newConnection = new signalR.HubConnectionBuilder()
      .withUrl(HUB_URL, {
        accessTokenFactory: () => localStorage.getItem("token") || "",
      })
      .withAutomaticReconnect()
      .build();

    newConnection
      .start()
      .then(() => {
        console.log("Joined Chat Hub");
        setConnection(newConnection);
      })
      .catch((err) => console.error("SignalR Connection Error: ", err));

    newConnection.on("ReceiveMessage", (message: MessageDto) => {
      setMessages((prev) => {
        // Prevent duplicate messages if already in list
        if (prev.some(m => m.id === message.id)) return prev;
        return [...prev, message];
      });
      
      // Update conversations list with the latest message
      setConversations(prev => {
        return prev.map(c => {
          if (c.id === message.conversationId) {
            return { ...c, lastMessage: message };
          }
          return c;
        }).sort((a, b) => {
            const dateA = a.lastMessage?.createdAt || a.createdAt;
            const dateB = b.lastMessage?.createdAt || b.createdAt;
            return new Date(dateB).getTime() - new Date(dateA).getTime();
        });
      });
    });

    return () => {
      newConnection.stop();
    };
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
    if (connection && connection.state === signalR.HubConnectionState.Connected) {
      await connection.invoke("SendMessage", conversationId, text);
    }
  }, [connection]);

  return {
    connection,
    messages,
    setMessages,
    conversations,
    setConversations,
    joinConversation,
    leaveConversation,
    sendMessage,
  };
}
