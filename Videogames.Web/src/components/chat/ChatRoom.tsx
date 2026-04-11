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
      <header className="bg-white dark:bg-gray-800 p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button 
            onClick={onBack}
            className="md:hidden p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
          >
            <ChevronLeftIcon className="h-6 w-6 dark:text-white" />
          </button>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
              <UserCircleIcon className="h-8 w-8 text-blue-600" />
            </div>
            <div>
              <h3 className="font-bold dark:text-white leading-tight">
                {currentUser?.id === activeConv.buyerId ? activeConv.sellerName : activeConv.buyerName}
              </h3>
              <p className="text-xs text-gray-500 flex items-center gap-1">
                In reference to <span className="font-medium text-blue-600">{activeConv.videogameName}</span>
              </p>
            </div>
          </div>
        </div>
        <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-500 transition-colors">
          <ShoppingBagIcon className="h-5 w-5" />
        </button>
      </header>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((m, idx) => {
          const isMine = m.senderId === currentUser?.id;
          return (
            <div key={m.id || idx} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] md:max-w-[70%] p-3 rounded-2xl shadow-sm ${isMine ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-tl-none border border-gray-100 dark:border-gray-700'}`}>
                <p className="text-sm leading-relaxed">{m.text}</p>
                <div className={`text-[10px] mt-1 opacity-70 text-right ${isMine ? 'text-blue-100' : 'text-gray-400'}`}>
                  {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <footer className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
        <form onSubmit={handleSend} className="flex gap-2">
          <input
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 bg-gray-100 dark:bg-gray-900 dark:text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all border-none"
          />
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white p-3 rounded-xl transition-all shadow-lg shadow-blue-500/20 active:scale-95"
          >
            <PaperAirplaneIcon className="h-6 w-6" />
          </button>
        </form>
      </footer>
    </>
  );
};
