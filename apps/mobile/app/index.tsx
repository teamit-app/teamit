import { Redirect } from 'expo-router';

export default function Index() {
  // TODO: 로그인 상태에 따라 분기 처리
  return <Redirect href="/(auth)/login" />;
}
