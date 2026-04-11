import { IChatService } from '../../domain/ports/IChatService';
import { Conversation, Message } from '../../domain/models/Chat';
import { axiosInstance } from '../api/axiosInstance';

export class ChatService implements IChatService {
  async getConversations(): Promise<Conversation[]> {
    const response = await axiosInstance.get<Conversation[]>("/Chat/conversations");
    return response.data;
  }

  async getMessages(conversationId: string): Promise<Message[]> {
    const response = await axiosInstance.get<Message[]>(`/Chat/conversations/${conversationId}/messages`);
    return response.data;
  }

  async startConversation(videogameId: string): Promise<Conversation> {
    const response = await axiosInstance.post<Conversation>(`/Chat/conversations/${videogameId}`);
    return response.data;
  }

  async markAsRead(conversationId: string): Promise<void> {
    await axiosInstance.post(`/Chat/conversations/${conversationId}/read`);
  }
}
