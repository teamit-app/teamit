import { ChatRoom, Chat, Message } from '../types/message';
import {
  dummyChatRooms,
  dummyDirectMessages1,
  dummyDirectMessages2,
  dummyDirectMessages3,
  dummyGroupMessages,
} from '../data/chatRooms';

// TODO: 백엔드 API 연결 시 fetch 호출로 교체
export const getChatRooms = async (): Promise<ChatRoom[]> => {
  return dummyChatRooms;
};

export const getChat = async (chatId: number): Promise<Chat | null> => {
  const chatRoom = dummyChatRooms.find((room) => room.id === chatId);
  if (!chatRoom) return null;

  let messages: Message[] = [];

  // 각 채팅 ID별로 정확한 메시지를 할당
  switch (chatId) {
    case 1: // 김모집
      messages = dummyDirectMessages1;
      break;
    case 2: // AI 해커톤 팀
      messages = dummyGroupMessages;
      break;
    case 3: // 박강민
      messages = dummyDirectMessages2;
      break;
    case 4: // 박준서
      messages = dummyDirectMessages3;
      break;
    default:
      messages = [];
  }

  return {
    id: chatRoom.id,
    type: chatRoom.type,
    name: chatRoom.name,
    avatar: chatRoom.avatar,
    participants: chatRoom.participants,
    messages: messages,
    description: chatRoom.description,
  };
};

export const sendMessage = async (chatId: number, text: string): Promise<Message> => {
  // 실제 구현에서는 API로 보낼 메시지 데이터를 전송
  const newMessage: Message = {
    id: Math.random(),
    senderId: 1,
    senderName: '김지수',
    senderAvatar: '👨‍💻',
    content: text,
    createdAt: new Date().toISOString(),
    isSent: true,
  };
  return newMessage;
};
