import { queryClient } from '../lib/queryClient';
import { useNotificationStore } from '../store/useNotificationStore';
import { useAuthStore } from '../store/useAuthStore';
import { BackendNotification } from './notificationService';

// 이벤트(웹소켓)로 무효화되는 쿼리들의 staleTime. 이벤트+재연결 안전망이 신선도를 챙겨주므로
// 30초 기본값보다 훨씬 길게 둬서, 그 사이에는 화면 재마운트 등으로 인한 불필요한 배경 재요청을 줄인다.
// (이벤트가 커버 안 되는 화면 재구독 등 예외 상황을 위한 보수적인 상한선일 뿐, 주된 갱신 수단은 이벤트다)
export const REALTIME_STALE_TIME = 5 * 60 * 1000;

// 웹소켓으로 들어온 알림 종류별로 "어떤 React Query 캐시가 오래된 것으로 간주돼야 하는지"를
// 한 곳에 선언한다. socket.ts는 이 함수를 호출만 하고 어떤 캐시가 있는지는 몰라도 된다 —
// 새 알림 종류가 생기거나 새 화면이 이 데이터를 구독하게 되면 여기만 고치면 된다.
function invalidateForNotification(notification: BackendNotification) {
  queryClient.invalidateQueries({ queryKey: ['notifications'] });

  switch (notification.type) {
    case 'MATCH_PROPOSAL':
    case 'PROPOSAL_RESPONSE':
    case 'MATCH_SUCCESS': {
      const userId = useAuthStore.getState().currentUserId;
      queryClient.invalidateQueries({ queryKey: ['matchingStatus', userId] });
      break;
    }
    default:
      break;
  }

  // 누가 내 모집글에 지원했을 때 — payload에 postId가 없고 applicationId만 있어서
  // 특정 postId만 콕 집어 무효화할 수 없다. postId 없이 prefix로 넘기면 지금 화면에
  // 열려있는 후보 목록(있다면 그거 하나뿐)만 알아서 다시 불러온다.
  if (notification.type === 'MATCH_PROPOSAL' && notification.referenceType === 'APPLICATION') {
    queryClient.invalidateQueries({ queryKey: ['contestCandidates'] });
    queryClient.invalidateQueries({ queryKey: ['allContestCandidates'] });
  }
}

export function handleServerNotification(notification: BackendNotification) {
  if (!notification.isRead) {
    useNotificationStore.getState().incrementUnread();
  }
  invalidateForNotification(notification);
}

// 소켓이 끊겨 있던 동안(백그라운드, 네트워크 끊김)의 이벤트는 유실된다 — 재연결 시점에
// 이벤트 연동된 캐시를 전부 한 번씩 무효화해서 "못 들은 게 있을지 모르니 다시 확인"하는
// 안전망. STOMP 클라이언트의 onConnect(최초 연결 + 재연결마다 호출됨)에서 부른다.
export function invalidateRealtimeCaches() {
  const userId = useAuthStore.getState().currentUserId;
  queryClient.invalidateQueries({ queryKey: ['notifications'] });
  queryClient.invalidateQueries({ queryKey: ['matchingStatus', userId] });
  queryClient.invalidateQueries({ queryKey: ['contestCandidates'] });
  queryClient.invalidateQueries({ queryKey: ['allContestCandidates'] });
}
