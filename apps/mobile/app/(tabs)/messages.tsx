import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../src/constants/colors';
import { ScreenHeader } from '../../src/components/common/ScreenHeader';

export default function MessagesScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScreenHeader title="메시지" />
      <View style={styles.body}>
        <Text style={styles.icon}>💬</Text>
        <Text style={styles.title}>메시지 기능을 준비 중이에요</Text>
        <Text style={styles.subtitle}>단체채팅 · 1:1 채팅이 곧 제공될 예정이에요</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  icon: {
    fontSize: 44,
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.dark,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.grayMedium,
    marginTop: 8,
    textAlign: 'center',
  },
});
