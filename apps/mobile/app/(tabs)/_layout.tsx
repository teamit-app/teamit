import { Tabs } from 'expo-router';
import { Colors } from '../../src/constants/colors';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textGray,
        tabBarStyle: {
          backgroundColor: Colors.backgroundWhite,
          borderTopColor: Colors.border,
        },
      }}
    >
      <Tabs.Screen name="home" options={{ title: '홈' }} />
      <Tabs.Screen name="explore" options={{ title: '탐색' }} />
      <Tabs.Screen name="messages" options={{ title: '메시지' }} />
      <Tabs.Screen name="profile" options={{ title: '내정보' }} />
    </Tabs>
  );
}
