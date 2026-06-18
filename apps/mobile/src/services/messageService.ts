import { ChatRoom, Chat, Message } from '../types/message';
import {
  dummyChatRooms,
  dummyDirectMessages1,
  dummyDirectMessages2,
  dummyDirectMessages3,
  dummyDirectMessages4,
  dummyGroupMessages1,
  dummyGroupMessages2,
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
    case 1: // 2025 창업 아이디어 팀
      messages = dummyGroupMessages1;
      break;
    case 2: // AI 해커톤 우리팀
      messages = dummyGroupMessages2;
      break;
    case 3: // 김모집 (팀 리더)
      messages = dummyDirectMessages1;
      break;
    case 4: // 박팀장
      messages = dummyDirectMessages2;
      break;
    case 5: // 이팀원
      messages = dummyDirectMessages3;
      break;
    case 6: // 최기획자
      messages = dummyDirectMessages4;
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
