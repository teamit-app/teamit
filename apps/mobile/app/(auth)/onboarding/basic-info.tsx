import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../../../src/constants/colors';

export default function BasicInfoScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>기본 정보 입력</Text>
      {/* TODO: 기본정보 폼 구현 */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundWhite,
    paddingHorizontal: 24,
    paddingTop: 60,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.textDark,
  },
});
