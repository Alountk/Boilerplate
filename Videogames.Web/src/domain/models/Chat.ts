export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  text: string;
  createdAt: string;
  isRead: boolean;
}

export interface Conversation {
  id: string;
  buyerId: string;
  buyerName: string;
  sellerId: string;
  sellerName: string;
  videogameId: string;
  videogameName: string;
  videogameUrlImg?: string;
  createdAt: string;
  lastMessage?: Message;
}
