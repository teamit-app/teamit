import { ChatRoom } from '../types/message';
import { dummyChatRooms } from '../data/chatRooms';

// TODO: 백엔드 API 연결 시 fetch 호출로 교체
export const getChatRooms = async (): Promise<ChatRoom[]> => {
  return dummyChatRooms;
};
