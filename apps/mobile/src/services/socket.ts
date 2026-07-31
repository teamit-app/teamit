import { Client, IMessage, StompSubscription } from '@stomp/stompjs';
import { tokenStorage } from './tokenStorage';
import { BackendNotification } from './notificationService';
import { BackendChatMessage } from './messageService';
import { handleServerNotification, invalidateRealtimeCaches } from './realtimeEvents';

const IS_MOCK = process.env.EXPO_PUBLIC_API_MODE === 'mock';
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'https://api.teamit.kr/api/v1';

// API_BASE_URL은 "http(s)://host/api/v1" 형태 — 웹소켓 엔드포인트는 같은 호스트의
// "ws(s)://host/ws"(REST와 별개 prefix, WebSocketConfig 참고)이므로 변환해서 사용한다
function buildWsUrl(): string {
  const withoutApiPrefix = API_BASE_URL.replace(/\/api\/v1\/?$/, '');
  return withoutApiPrefix.replace(/^http/, 'ws') + '/ws';
}

let client: Client | null = null;
// connectSocket()은 토큰을 비동기로 읽은 뒤 Client를 생성하는데, 이 await 구간 사이에
// connectSocket()이 또 호출되면(화면 전환으로 탭 레이아웃이 재마운트되는 경우 등) 둘 다
// "client?.active" 체크를 통과해버려 클라이언트가 중복 생성된다. 예전 클라이언트는 아무도
// 정리하지 않아 좀비 상태로 각자 따로 재연결을 반복하며 서버에 뒤섞인 CONNECT/SUBSCRIBE를
// 계속 보낸다(실제 재현 확인됨). 동기 플래그로 동시 진입을 막는다.
let isConnecting = false;

// 화면에 열려있는 채팅방들 — 재연결(네트워크 끊김 복구 등) 시 전부 다시 구독해야 해서
// 콜백 자체를 여기 들고 있는다(구독 객체만 들고 있으면 재연결 시 잃어버림)
const activeChatRoomHandlers = new Map<number, (message: BackendChatMessage) => void>();
const chatRoomSubscriptions = new Map<number, StompSubscription>();

function subscribeAll() {
  if (!client?.connected) return;

  client.subscribe('/user/queue/notifications', (message: IMessage) => {
    try {
      const notification: BackendNotification = JSON.parse(message.body);
      handleServerNotification(notification);
    } catch (e) {
      console.error('[Socket] 알림 메시지 파싱 실패:', e);
    }
  });

  activeChatRoomHandlers.forEach((onMessage, chatRoomId) => {
    const sub = client!.subscribe(`/topic/chatroom/${chatRoomId}`, (message: IMessage) => {
      try {
        onMessage(JSON.parse(message.body));
      } catch (e) {
        console.error('[Socket] 채팅 메시지 파싱 실패:', e);
      }
    });
    chatRoomSubscriptions.set(chatRoomId, sub);
  });
}

export async function connectSocket(): Promise<void> {
  if (IS_MOCK || client?.active || isConnecting) return;
  isConnecting = true;

  try {
    const token = await tokenStorage.getAccessToken();
    if (!token) return;
    if (client?.active) return; // await 도중 이미 다른 경로로 연결됐으면 중복 생성하지 않음

    client = new Client({
      brokerURL: buildWsUrl(),
      reconnectDelay: 5000,
      // connectHeaders는 최초 연결 시점의 토큰을 고정값으로 들고 있어서, 재연결(자동
      // reconnectDelay 포함) 때도 만료된 토큰을 그대로 재사용해 CONNECT가 계속 거부될 수
      // 있다. beforeConnect에서 매 (재)연결 직전에 최신 토큰을 다시 읽어 갱신한다.
      beforeConnect: async () => {
        const latestToken = await tokenStorage.getAccessToken();
        if (client) client.connectHeaders = { Authorization: `Bearer ${latestToken ?? token}` };
      },
      // 프록시/로드밸런서가 유휴 커넥션을 조용히 끊는 경우를 빨리 감지해 재연결하기 위한 하트비트
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      // onConnect는 최초 연결뿐 아니라 자동 재연결(reconnectDelay) 때마다도 호출된다 —
      // 재구독(subscribeAll)과 함께, 끊겨 있던 동안 놓쳤을 수 있는 이벤트를 따라잡기 위해
      // 이벤트 연동 캐시를 전부 한 번 무효화한다.
      onConnect: () => {
        subscribeAll();
        invalidateRealtimeCaches();
      },
      onStompError: (frame) => {
        console.error('[Socket] STOMP 오류:', frame.headers['message']);
      },
      onWebSocketClose: (event) => {
        console.warn('[Socket] 연결 종료, 재연결 대기 중:', event?.code, event?.reason);
      },
    });

    client.activate();
  } finally {
    isConnecting = false;
  }
}

export function disconnectSocket(): void {
  chatRoomSubscriptions.forEach((sub) => sub.unsubscribe());
  chatRoomSubscriptions.clear();
  activeChatRoomHandlers.clear();
  client?.deactivate();
  client = null;
}

// 채팅방 화면에 들어가 있는 동안만 구독 — 반환된 함수를 호출하면 구독 해제.
// 소켓이 재연결되더라도(네트워크 끊김 복구 등) subscribeAll이 다시 불려서 자동 재구독된다.
export function subscribeToChatRoom(
  chatRoomId: number,
  onMessage: (message: BackendChatMessage) => void,
): () => void {
  if (IS_MOCK) return () => {};

  activeChatRoomHandlers.set(chatRoomId, onMessage);
  if (client?.connected) {
    const sub = client.subscribe(`/topic/chatroom/${chatRoomId}`, (message: IMessage) => {
      try {
        onMessage(JSON.parse(message.body));
      } catch (e) {
        console.error('[Socket] 채팅 메시지 파싱 실패:', e);
      }
    });
    chatRoomSubscriptions.set(chatRoomId, sub);
  }

  return () => {
    chatRoomSubscriptions.get(chatRoomId)?.unsubscribe();
    chatRoomSubscriptions.delete(chatRoomId);
    activeChatRoomHandlers.delete(chatRoomId);
  };
}
