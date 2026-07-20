import { Client, IMessage, StompSubscription } from '@stomp/stompjs';
import { tokenStorage } from './tokenStorage';
import { useNotificationStore } from '../store/useNotificationStore';
import { BackendNotification } from './notificationService';
import { BackendChatMessage } from './messageService';

const IS_MOCK = process.env.EXPO_PUBLIC_API_MODE === 'mock';
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'https://api.teamit.app/api/v1';

// API_BASE_URL은 "http(s)://host/api/v1" 형태 — 웹소켓 엔드포인트는 같은 호스트의
// "ws(s)://host/ws"(REST와 별개 prefix, WebSocketConfig 참고)이므로 변환해서 사용한다
function buildWsUrl(): string {
  const withoutApiPrefix = API_BASE_URL.replace(/\/api\/v1\/?$/, '');
  return withoutApiPrefix.replace(/^http/, 'ws') + '/ws';
}

let client: Client | null = null;

// 화면에 열려있는 채팅방들 — 재연결(네트워크 끊김 복구 등) 시 전부 다시 구독해야 해서
// 콜백 자체를 여기 들고 있는다(구독 객체만 들고 있으면 재연결 시 잃어버림)
const activeChatRoomHandlers = new Map<number, (message: BackendChatMessage) => void>();
const chatRoomSubscriptions = new Map<number, StompSubscription>();

function subscribeAll() {
  if (!client?.connected) return;

  client.subscribe('/user/queue/notifications', (message: IMessage) => {
    try {
      const notification: BackendNotification = JSON.parse(message.body);
      if (!notification.isRead) {
        useNotificationStore.getState().incrementUnread();
      }
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
  if (IS_MOCK || client?.active) return;

  const token = await tokenStorage.getAccessToken();
  if (!token) return;

  client = new Client({
    brokerURL: buildWsUrl(),
    connectHeaders: { Authorization: `Bearer ${token}` },
    reconnectDelay: 5000,
    onConnect: subscribeAll,
    onStompError: (frame) => {
      console.error('[Socket] STOMP 오류:', frame.headers['message']);
    },
  });

  client.activate();
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
