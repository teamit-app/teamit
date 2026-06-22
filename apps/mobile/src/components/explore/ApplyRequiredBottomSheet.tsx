import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TouchableWithoutFeedback,
} from 'react-native';
import { Colors } from '../../constants/colors';

interface ApplyRequiredBottomSheetProps {
  visible: boolean;
  onGoRegister: () => void;
  onClose: () => void;
}

export function ApplyRequiredBottomSheet({
  visible,
  onGoRegister,
  onClose,
}: ApplyRequiredBottomSheetProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay} />
      </TouchableWithoutFeedback>

      <View style={styles.sheet}>
        <View style={styles.handle} />

        <View style={styles.content}>
          <View style={styles.lockIconWrap}>
            <Text style={styles.lockIcon}>🔒</Text>
          </View>
          <Text style={styles.title}>내 정보 등록이 필요해요</Text>
          <Text style={styles.descGray}>
            팀매칭 제의 받기를 아직 완료하지 않으셨네요!
          </Text>
          <Text style={styles.descOrange}>
            {'모집자가 사용자님의 정보를 확인할 수 있도록\n내 정보를 먼저 등록해 주세요.'}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.registerBtn}
          onPress={onGoRegister}
          activeOpacity={0.85}
        >
          <Text style={styles.registerBtnText}>내 정보 등록하러 가기</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.laterBtn} onPress={onClose} activeOpacity={0.75}>
          <Text style={styles.laterBtnText}>나중에 할게요</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  sheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 36,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.lightGray,
    alignSelf: 'center',
    marginTop: 12,
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 8,
  },
  lockIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.ogTint,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  lockIcon: {
    fontSize: 30,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.dark,
    marginBottom: 12,
    textAlign: 'center',
  },
  descGray: {
    fontSize: 14,
    color: Colors.gray,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 4,
  },
  descOrange: {
    fontSize: 14,
    color: Colors.primary,
    textAlign: 'center',
    lineHeight: 22,
  },
  registerBtn: {
    marginHorizontal: 20,
    marginTop: 24,
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  registerBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.white,
  },
  laterBtn: {
    alignItems: 'center',
    paddingVertical: 14,
  },
  laterBtnText: {
    fontSize: 14,
    color: Colors.grayMedium,
  },
});
