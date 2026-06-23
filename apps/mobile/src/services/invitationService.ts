import { apiRequest } from './api';
import { Invitation } from '../types/invitation';
import { dummyInvitations } from '../data/invitations';

export const getInvitations = async (): Promise<Invitation[]> => {
  const data = await apiRequest<{ content: Invitation[] }>('/users/invitations');
  return data.content ?? [];
};

export const declineInvitation = async (invitationId: number): Promise<void> => {
  await apiRequest<null>(`/users/invitations/${invitationId}/decline`, { method: 'POST' });
};

export const acceptInvitation = async (invitationId: number): Promise<void> => {
  await apiRequest<null>(`/users/invitations/${invitationId}/accept`, { method: 'POST' });
};
