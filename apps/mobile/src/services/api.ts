import { getMockResponse } from './mockRouter';
import { tokenStorage } from './tokenStorage';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'https://api.teamit.app/api/v1';
const IS_MOCK = process.env.EXPO_PUBLIC_API_MODE === 'mock';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}

async function fetchWithAuth(url: string, token: string | null, options?: RequestInit) {
  return fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options?.headers as Record<string, string> | undefined),
    },
  });
}

export async function apiRequest<T>(
  endpoint: string,
  options?: RequestInit,
): Promise<T> {
  if (IS_MOCK) {
    return getMockResponse<T>(endpoint);
  }

  const accessToken = await tokenStorage.getAccessToken();
  let response = await fetchWithAuth(`${BASE_URL}${endpoint}`, accessToken, options);

  // 401: access token expired → refresh token rotation → retry once
  if (response.status === 401) {
    const refreshToken = await tokenStorage.getRefreshToken();
    if (!refreshToken) {
      throw new Error('로그인이 필요합니다');
    }

    const reissueRes = await fetch(`${BASE_URL}/auth/reissue`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!reissueRes.ok) {
      await tokenStorage.clearTokens();
      throw new Error('세션이 만료되었습니다. 다시 로그인해주세요');
    }

    const reissueJson: ApiResponse<{ accessToken: string; refreshToken: string }> =
      await reissueRes.json();
    const { accessToken: newAccess, refreshToken: newRefresh } = reissueJson.data;
    await tokenStorage.setTokens(newAccess, newRefresh);

    response = await fetchWithAuth(`${BASE_URL}${endpoint}`, newAccess, options);
  }

  // 빈 body 응답(204 등) 또는 인증 실패 처리
  if (response.status === 204) return null as T;
  if (!response.ok) {
    const text = await response.text();
    let message = `서버 오류 (${response.status})`;
    try { message = JSON.parse(text)?.message ?? message; } catch {}
    throw new Error(message);
  }

  const json: ApiResponse<T> = await response.json();

  if (!json.success) {
    throw new Error(json.message ?? '요청에 실패했습니다');
  }

  return json.data;
}
