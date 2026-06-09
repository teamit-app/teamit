import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../../src/constants/colors';

export default function MessagesScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>메시지</Text>
      {/* TODO: 단체채팅 / 1:1 채팅 탭 구현 */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundLight,
    paddingHorizontal: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.textDark,
  },
});
