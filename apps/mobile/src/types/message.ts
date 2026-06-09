export interface Message {
  id: number;
  senderId: number;
  content: string;
  createdAt: string;
}

export interface ChatRoom {
  id: number;
  type: 'group' | 'direct';
  name: string;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
  participants: number[];
}
