import { create } from 'zustand';

export interface AlertButtonSpec {
  text: string;
  style?: 'default' | 'cancel' | 'destructive';
  onPress?: () => void;
}

interface AlertState {
  visible: boolean;
  title: string;
  message?: string;
  buttons: AlertButtonSpec[];
  show: (title: string, message?: string, buttons?: AlertButtonSpec[]) => void;
  hide: () => void;
}

// 앱 전체 확인창(Alert.alert)이 공유하는 상태 — src/utils/alert.ts가 여기에 밀어넣고,
// components/common/AlertHost.tsx가 앱 루트에서 이 상태를 읽어 하나의 예쁜 모달로 그린다
export const useAlertStore = create<AlertState>((set) => ({
  visible: false,
  title: '',
  message: undefined,
  buttons: [{ text: '확인' }],
  show: (title, message, buttons) =>
    set({
      visible: true,
      title,
      message,
      buttons: buttons && buttons.length > 0 ? buttons : [{ text: '확인' }],
    }),
  hide: () => set({ visible: false }),
}));
