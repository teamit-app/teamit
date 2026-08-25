import { useEffect } from 'react';
import { Tabs, router } from 'expo-router';
import { TabBar } from '../../src/components/common/TabBar';
import { useAuthStore } from '../../src/store/useAuthStore';
import { connectSocket, disconnectSocket } from '../../src/services/socket';
import { refetchExploreData } from '../../src/hooks/useExploreData';

export default function TabLayout() {
  const fetchCurrentUserId = useAuthStore((s) => s.fetchCurrentUserId);

  useEffect(() => {
    // 약관 개정으로 재동의가 필요한 기존 가입자는 어느 탭으로 진입했든 재동의 화면으로
    // 보낸다 — 동의하거나 로그아웃하기 전까지는 이 화면을 벗어날 수 없다(소프트락).
    fetchCurrentUserId().then(() => {
      if (useAuthStore.getState().needsTermsReconsent) {
        router.replace('/(auth)/reconsent' as never);
      }
    });
    connectSocket();
    return () => {
      disconnectSocket();
    };
  }, []);

  return (
    <Tabs
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="home" options={{ title: '홈' }} />
      <Tabs.Screen
        name="explore"
        options={{ title: '탐색' }}
        listeners={({ navigation }) => ({
          // 이미 탐색 탭에 있는 상태에서 탭을 다시 누르면(화면 전환 자체가 없어서
          // useFocusEffect는 안 불림) 목록을 새로고침한다.
          tabPress: () => {
            if (navigation.isFocused()) {
              refetchExploreData();
            }
          },
        })}
      />
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
