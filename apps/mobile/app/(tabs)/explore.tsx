import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../../src/constants/colors';

export default function ExploreScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>탐색</Text>
      {/* TODO: 인재풀 / 공모전 탭, 필터, 하트 구현 */}
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
