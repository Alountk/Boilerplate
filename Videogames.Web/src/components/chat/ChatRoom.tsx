"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  PaperAirplaneIcon,
  UserCircleIcon,
  ShoppingBagIcon,
  ChevronLeftIcon
} from "@heroicons/react/24/outline";
import { Message, Conversation } from "../../domain/models/Chat";
import { User } from "../../domain/models/User";

interface ChatRoomProps {
  activeConv: Conversation;
  messages: Message[];
  currentUser: User | null;
  onSendMessage: (text: string) => Promise<void>;
  onBack: () => void;
}

export const ChatRoom: React.FC<ChatRoomProps> = ({
  activeConv,
  messages,
  currentUser,
  onSendMessage,
  onBack
}) => {
  const [inputText, setInputText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    await onSendMessage(inputText);
    setInputText("");
  };

  return (
    <>
      {/* Chat Header */}
      <header className="flex items-center justify-between border-b border-outline bg-surface p-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="rounded-full p-1 text-on-surface-muted active:bg-surface-1/60 md:hidden"
            aria-label="Volver a la lista"
          >
            <ChevronLeftIcon className="h-6 w-6" />
          </button>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center border border-outline bg-surface-1/40">
              <UserCircleIcon className="h-8 w-8 text-secondary" />
            </div>
            <div>
              <h3 className="leading-tight font-bold text-on-surface">
                {currentUser?.id === activeConv.buyerId ? activeConv.sellerName : activeConv.buyerName}
              </h3>
              <p className="flex items-center gap-1 text-xs text-on-surface-muted">
                In reference to <span className="font-medium text-secondary">{activeConv.videogameName}</span>
              </p>
            </div>
          </div>
        </div>
        <button className="rounded-lg p-2 text-on-surface-muted transition-colors active:bg-surface-1/60">
          <ShoppingBagIcon className="h-5 w-5" />
        </button>
      </header>

      {/* Messages Area */}
      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {messages.map((m, idx) => {
          const isMine = m.senderId === currentUser?.id;
          return (
            <div key={m.id || idx} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] p-3 md:max-w-[70%] ${isMine
                ? 'border border-secondary bg-surface-2/40'
                : 'border border-outline bg-surface-1/40'}`}>
                <p className="text-sm leading-relaxed text-on-surface">{m.text}</p>
                <div className={`mt-1 text-right font-mono text-[10px] uppercase opacity-70 ${isMine ? 'text-secondary' : 'text-on-surface-muted'}`}>
                  {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <footer className="border-t border-outline bg-surface p-4">
        <form onSubmit={handleSend} className="flex gap-2">
          <input
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Escribí un mensaje..."
            aria-label="Mensaje"
            className="flex-1 border border-outline bg-surface-2/60 px-4 py-3 font-mono text-sm text-on-surface placeholder:text-on-surface-muted/50 outline-none transition-colors focus:border-secondary"
          />
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="flex h-12 w-12 items-center justify-center border border-secondary bg-secondary/10 text-secondary transition-colors active:bg-secondary/20 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <PaperAirplaneIcon className="h-6 w-6" />
          </button>
        </form>
      </footer>
    </>
  );
};
