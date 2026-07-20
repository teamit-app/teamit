import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors } from '../../constants/colors';
import { useAlertStore } from '../../store/useAlertStore';

// 앱 전체 확인창(Alert.alert)을 위한 단일 렌더 지점. app/_layout.tsx 루트에 한 번만 마운트한다.
// src/utils/alert.ts의 Alert.alert(...)는 네이티브 팝업 대신 이 모달을 띄우도록 useAlertStore에 상태만 넣는다.
export function AlertHost() {
  const { visible, title, message, buttons, hide } = useAlertStore();

  const handlePress = (onPress?: () => void) => {
    hide();
    // 모달이 닫히는 애니메이션과 onPress 후속 네비게이션이 겹치지 않도록 한 틱 미룬다
    setTimeout(() => onPress?.(), 0);
  };

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={hide}>
      <View style={s.overlay}>
        <View style={s.box}>
          <Text style={s.title}>{title}</Text>
          {message ? <Text style={s.desc}>{message}</Text> : null}
          <View style={[s.btns, buttons.length > 2 && s.btnsColumn]}>
            {buttons.map((btn, i) => {
              const isCancel = btn.style === 'cancel';
              const isDestructive = btn.style === 'destructive';
              return (
                <TouchableOpacity
                  key={`${btn.text}-${i}`}
                  style={[s.btn, isCancel ? s.btnCancel : isDestructive ? s.btnDestructive : s.btnDefault]}
                  onPress={() => handlePress(btn.onPress)}
                  activeOpacity={0.85}
                >
                  <Text style={[s.btnText, isCancel ? s.btnTextCancel : s.btnTextOnColor]}>{btn.text}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center', alignItems: 'center', paddingHorizontal: 28,
  },
  box: { width: '100%', backgroundColor: Colors.white, borderRadius: 20, padding: 24 },
  title: { fontSize: 18, fontWeight: '700', color: Colors.dark, marginBottom: 10 },
  desc: { fontSize: 14, color: Colors.grayMedium, lineHeight: 22, marginBottom: 24 },
  btns: { flexDirection: 'row', gap: 10 },
  btnsColumn: { flexDirection: 'column' },
  btn: { flex: 1, paddingVertical: 18, borderRadius: 14, alignItems: 'center' },
  btnCancel: { backgroundColor: Colors.pageBg },
  btnDefault: { backgroundColor: Colors.primary },
  btnDestructive: { backgroundColor: Colors.error },
  btnText: { fontSize: 15, fontWeight: '700' },
  btnTextCancel: { color: Colors.grayMedium },
  btnTextOnColor: { color: Colors.white },
});
