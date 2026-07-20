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
 * [로컬 개발 전용] 닉네임으로 즉시 로그인.
 * 서버의 @Profile("local") DevAuthController와 연동됩니다.
 */
export const devLogin = async (nickname: string): Promise<KakaoLoginResponse> => {
  const response = await apiRequest<KakaoLoginResponse>('/auth/dev/login', {
    method: 'POST',
    body: JSON.stringify({ nickname }),
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

/**
 * 회원 탈퇴: 서버에 계정 삭제 요청 후 로컬 토큰 삭제.
 */
export const withdraw = async (): Promise<void> => {
  try {
    await apiRequest<null>('/auth/withdraw', { method: 'DELETE' });
  } finally {
    await tokenStorage.clearTokens();
  }
};
