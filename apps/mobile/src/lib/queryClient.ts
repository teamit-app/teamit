import { QueryClient } from '@tanstack/react-query';

// 컴포넌트 트리 밖(zustand 스토어의 로그아웃 처리 등)에서도 캐시를 직접 조작해야 해서
// useQueryClient() 훅 대신 단일 인스턴스를 만들어 Provider와 공유한다.
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: false,
    },
  },
});
