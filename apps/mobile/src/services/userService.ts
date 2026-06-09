import { User } from '../types/user';
import { dummyUsers } from '../data/users';

// TODO: 백엔드 API 연결 시 fetch 호출로 교체
export const getUsers = async (): Promise<User[]> => {
  return dummyUsers;
};

export const getUserById = async (id: number): Promise<User | undefined> => {
  return dummyUsers.find((u) => u.id === id);
};
