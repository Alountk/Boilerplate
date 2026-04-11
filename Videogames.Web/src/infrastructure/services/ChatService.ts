import { axiosInstance } from "../api/axiosInstance";

export interface MessageDto {
  id: string;
  conversationId: string;
  senderId: string;
  text: string;
  createdAt: string;
  isRead: boolean;
}

export interface ConversationDto {
  id: string;
  buyerId: string;
  buyerName: string;
  sellerId: string;
  sellerName: string;
  videogameId: string;
  videogameName: string;
  videogameUrlImg?: string;
  createdAt: string;
  lastMessage?: MessageDto;
}

export class ChatService {
  async getConversations(): Promise<ConversationDto[]> {
    const response = await axiosInstance.get<ConversationDto[]>("/Chat/conversations");
    return response.data;
  }

  async getMessages(conversationId: string): Promise<MessageDto[]> {
    const response = await axiosInstance.get<MessageDto[]>(`/Chat/conversations/${conversationId}/messages`);
    return response.data;
  }

  async startConversation(videogameId: string): Promise<ConversationDto> {
    const response = await axiosInstance.post<ConversationDto>(`/Chat/conversations/${videogameId}`);
    return response.data;
  }

  async markAsRead(conversationId: string): Promise<void> {
    await axiosInstance.post(`/Chat/conversations/${conversationId}/read`);
  }
}
