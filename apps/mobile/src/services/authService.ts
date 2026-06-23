import { apiRequest } from './api';
import { tokenStorage } from './tokenStorage';

interface KakaoLoginResponse {
  accessToken: string;
  refreshToken: string;
  isNewUser: boolean;
  userId: number;
}

/**
 * 카카오 액세스 토큰을 백엔드로 전달해 로그인/회원가입 처리.
 * 성공 시 JWT를 AsyncStorage에 저장하고 응답을 반환합니다.
 */
export const kakaoLogin = async (kakaoAccessToken: string): Promise<KakaoLoginResponse> => {
  const response = await apiRequest<KakaoLoginResponse>('/auth/kakao', {
    method: 'POST',
    body: JSON.stringify({ kakaoAccessToken }),
  });
  await tokenStorage.setTokens(response.accessToken, response.refreshToken);
  return response;
};

/**
 * 로그아웃: 백엔드 refresh token 무효화 후 로컬 토큰 삭제.
 */
export const logout = async (): Promise<void> => {
  try {
    await apiRequest<null>('/auth/logout', { method: 'POST' });
  } finally {
    await tokenStorage.clearTokens();
  }
};
