import { Conversation, Message } from '../models/Chat';

export interface IChatService {
  getConversations(): Promise<Conversation[]>;
  getMessages(conversationId: string): Promise<Message[]>;
  startConversation(videogameId: string): Promise<Conversation>;
  markAsRead(conversationId: string): Promise<void>;
}
