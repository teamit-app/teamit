const BASE_URL = 'https://api.teamit.app/api/v1';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}

export async function apiRequest<T>(
  endpoint: string,
  options?: RequestInit,
): Promise<T> {
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  const json: ApiResponse<T> = await response.json();

  if (!json.success) {
    throw new Error(json.message ?? '요청에 실패했습니다');
  }

  return json.data;
}
