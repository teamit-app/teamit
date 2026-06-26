import { Tabs } from 'expo-router';
import { TabBar } from '../../src/components/common/TabBar';

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="home" options={{ title: '홈' }} />
      <Tabs.Screen name="explore" options={{ title: '탐색' }} />
      <Tabs.Screen
        name="messages"
        options={{ title: '메시지' }}
        listeners={({ navigation }) => ({
          tabPress: () => {
            navigation.navigate('messages', { screen: 'index' });
          },
        })}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: '내정보' }}
        listeners={({ navigation }) => ({
          tabPress: () => {
            navigation.navigate('profile', { screen: 'index' });
          },
        })}
      />
    </Tabs>
  );
}
