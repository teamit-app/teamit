import React, { useEffect, useState } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors } from '../../constants/colors';
import { promptStorage } from '../../services/promptStorage';

// 오류 신고 유도 팝업. 앱 진입 시 하루 최대 1회 노출된다.
// app/_layout.tsx 루트에 AlertHost와 형제로 한 번만 마운트한다.
export function BugReportPromptModal() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    promptStorage.shouldShowBugReportPrompt().then((shouldShow) => {
      if (shouldShow) setVisible(true);
    });
  }, []);

  const handleClose = () => setVisible(false);

  const handleDismissToday = () => {
    setVisible(false);
    promptStorage.dismissBugReportPromptForToday();
  };

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={handleClose}>
      <View style={s.overlay}>
        <View style={s.box}>
          <Text style={s.title}>티밋에서 발생하는 오류를 신고해주세요 😄</Text>
          <Text style={s.desc}>
            이용 중 불편하거나 오류를 발견하셨다면 마이페이지 {'>'} 오류 신고하기로 편하게
            알려주세요. 검토 후 소중한 제보로 확인되면 소정의 보상을 드려요.
          </Text>
          <View style={s.btns}>
            <TouchableOpacity style={[s.btn, s.btnCancel]} onPress={handleDismissToday} activeOpacity={0.85}>
              <Text style={[s.btnText, s.btnTextCancel]}>오늘 하루 보지 않기</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[s.btn, s.btnDefault]} onPress={handleClose} activeOpacity={0.85}>
              <Text style={[s.btnText, s.btnTextOnColor]}>닫기</Text>
            </TouchableOpacity>
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
  btn: { flex: 1, paddingVertical: 18, borderRadius: 14, alignItems: 'center' },
  btnCancel: { backgroundColor: Colors.pageBg },
  btnDefault: { backgroundColor: Colors.primary },
  btnText: { fontSize: 15, fontWeight: '700' },
  btnTextCancel: { color: Colors.grayMedium },
  btnTextOnColor: { color: Colors.white },
});
