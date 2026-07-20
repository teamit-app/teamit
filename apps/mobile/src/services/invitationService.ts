import { apiRequest } from './api';
import { Invitation } from '../types/invitation';
import { dummyCandidates } from '../data/candidates';
import { registerCreatedRoom } from './messageService';

const IS_MOCK = process.env.EXPO_PUBLIC_API_MODE === 'mock';

export interface SendInvitationResponse {
  invitationId: number;
  status: string;
  chatRoomId: number;
}

export const getInvitations = async (): Promise<Invitation[]> => {
  const data = await apiRequest<{ content: Invitation[] }>('/users/invitations');
  return data.content ?? [];
};

export const sendInvitation = async (postId: number, receiverId: number): Promise<SendInvitationResponse> => {
  if (IS_MOCK) {
    const candidate = dummyCandidates.find((c) => c.id === receiverId);
    const chatRoomId = 1000 + receiverId;
    registerCreatedRoom({
      id: chatRoomId,
      type: 'direct',
      name: candidate?.name ?? `사용자 ${receiverId}`,
      avatar: '👤',
      lastMessage: '초대장을 보냈어요',
      lastMessageBy: '나',
      lastMessageAt: new Date().toISOString(),
      unreadCount: 1,
      participants: [],
      detailType: 'member-invite',
      matchStatus: 'pending',
    });
    return { invitationId: Date.now(), status: 'PENDING', chatRoomId };
  }

  return apiRequest<SendInvitationResponse>(`/posts/${postId}/invitations`, {
    method: 'POST',
    body: JSON.stringify({ receiverId }),
  });
};

export interface SentInvitation {
  invitationId: number;
  receiverId: number;
  receiverNickname: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
}

export const getSentInvitations = async (postId: number): Promise<SentInvitation[]> => {
  return apiRequest<SentInvitation[]>(`/posts/${postId}/invitations`);
};

// 모집자가 자신이 보낸 대기 중인 초대를 철회 — 철회하면 상대에게 다시 초대 가능해짐
export const cancelInvitation = async (postId: number, invitationId: number): Promise<void> => {
  await apiRequest<null>(`/posts/${postId}/invitations/${invitationId}`, { method: 'DELETE' });
};

export const declineInvitation = async (invitationId: number): Promise<void> => {
  await apiRequest<null>(`/users/invitations/${invitationId}/decline`, { method: 'POST' });
};

export const acceptInvitation = async (invitationId: number): Promise<void> => {
  await apiRequest<null>(`/users/invitations/${invitationId}/accept`, { method: 'POST' });
};
