"use client";

import { useEffect, useState, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import { useChat } from "../../hooks/useChat";
import { ChatService, ConversationDto } from "../../infrastructure/services/ChatService";
import { 
  PaperAirplaneIcon, 
  ChatBubbleLeftRightIcon,
  UserCircleIcon,
  ShoppingBagIcon,
  ChevronLeftIcon
} from "@heroicons/react/24/outline";

export default function MessagesPage() {
  const { user, loading: authLoading } = useAuth();
  const chatService = new ChatService();
  const { 
    messages, 
    setMessages, 
    conversations, 
    setConversations, 
    joinConversation, 
    leaveConversation, 
    sendMessage 
  } = useChat();

  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (user) {
      chatService.getConversations().then((data) => {
        setConversations(data);
        setLoading(false);
      });
    }
  }, [user]);

  const handleSelectConversation = async (conv: ConversationDto) => {
    if (activeTab) {
      await leaveConversation(activeTab);
    }
    setActiveTab(conv.id);
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
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !activeTab) return;

    try {
      await sendMessage(activeTab, inputText);
      setInputText("");
    } catch (err) {
      console.error(err);
    }
  };

  if (authLoading) return <div className="min-h-screen animate-pulse bg-gray-50 dark:bg-gray-900" />;

  const activeConv = conversations.find(c => c.id === activeTab);

  return (
    <div className="flex h-[calc(100vh-64px)] bg-gray-100 dark:bg-gray-900 overflow-hidden pt-1">
      {/* Sidebar: Conversations List */}
      <aside className={`w-full md:w-80 lg:w-96 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col ${activeTab ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 border-b border-gray-100 dark:border-gray-700">
          <h2 className="text-xl font-bold dark:text-white flex items-center gap-2">
            <ChatBubbleLeftRightIcon className="h-6 w-6 text-blue-600" />
            Messages
          </h2>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 && !loading ? (
            <div className="p-8 text-center">
              <ChatBubbleLeftRightIcon className="h-12 w-12 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500 text-sm">No conversations yet. Start one from a product details page!</p>
            </div>
          ) : (
            conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => handleSelectConversation(conv)}
                className={`w-full p-4 flex gap-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors border-b border-gray-50 dark:border-gray-700/50 ${activeTab === conv.id ? 'bg-blue-50/50 dark:bg-blue-900/20' : ''}`}
              >
                <div className="relative shrink-0">
                  <UserCircleIcon className="h-12 w-12 text-gray-400" />
                  {conv.lastMessage && !conv.lastMessage.isRead && conv.lastMessage.senderId !== user?.id && (
                    <span className="absolute top-0 right-0 h-3 w-3 bg-blue-600 rounded-full border-2 border-white dark:border-gray-800" />
                  )}
                </div>
                <div className="flex-1 text-left overflow-hidden">
                  <div className="flex justify-between items-start">
                    <span className="font-bold text-gray-900 dark:text-gray-100 truncate">
                      {user?.id === conv.buyerId ? conv.sellerName : conv.buyerName}
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
      </aside>

      {/* Main Chat Area */}
      <main className={`flex-1 flex flex-col bg-gray-50 dark:bg-gray-950 ${!activeTab ? 'hidden md:flex' : 'flex'}`}>
        {activeTab && activeConv ? (
          <>
            {/* Chat Header */}
            <header className="bg-white dark:bg-gray-800 p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setActiveTab(null)}
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
                      {user?.id === activeConv.buyerId ? activeConv.sellerName : activeConv.buyerName}
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
                const isMine = m.senderId === user?.id;
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
        ) : (
          <div className="flex-1 flex flex-center items-center justify-center p-12 text-center opacity-40">
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
