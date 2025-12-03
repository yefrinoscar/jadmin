export interface ChatUser {
  id: string;
  name: string;
  email: string;
  isOnline: boolean;
  lastMessage?: string;
  lastMessageAt?: Date;
  unreadCount: number;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderType: 'user' | 'agent' | 'ai';
  content: string;
  createdAt: Date;
}

export interface ChatConversation {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  status: 'active' | 'closed' | 'waiting';
  createdAt: Date;
  updatedAt: Date;
  messages: ChatMessage[];
}

