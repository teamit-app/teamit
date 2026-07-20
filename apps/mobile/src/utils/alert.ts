import { useAlertStore } from '../store/useAlertStore';

export type AlertButton = {
  text?: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
};

// 앱 전체에서 뜨는 확인창을 OS 기본 Alert 대신 커스텀 모달(AlertHost)로 통일한다.
// 호출부 시그니처는 그대로 유지해서 기존 Alert.alert(...) 호출은 손댈 필요가 없다.
export const Alert = {
  alert(title: string, message?: string, buttons?: AlertButton[]) {
    const list = buttons && buttons.length > 0 ? buttons : [{ text: '확인' }];
    useAlertStore.getState().show(
      title,
      message,
      list.map((b) => ({ text: b.text ?? '확인', style: b.style, onPress: b.onPress })),
    );
  },
};
