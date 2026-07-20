import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  ACCESS_TOKEN: '@teamit/access_token',
  REFRESH_TOKEN: '@teamit/refresh_token',
  ONBOARDING_COMPLETE: '@teamit/onboarding_complete',
};

export const tokenStorage = {
  getAccessToken: () => AsyncStorage.getItem(KEYS.ACCESS_TOKEN),
  getRefreshToken: () => AsyncStorage.getItem(KEYS.REFRESH_TOKEN),

  setTokens: (accessToken: string, refreshToken: string) =>
    Promise.all([
      AsyncStorage.setItem(KEYS.ACCESS_TOKEN, accessToken),
      AsyncStorage.setItem(KEYS.REFRESH_TOKEN, refreshToken),
    ]),

  clearTokens: () =>
    Promise.all([
      AsyncStorage.removeItem(KEYS.ACCESS_TOKEN),
      AsyncStorage.removeItem(KEYS.REFRESH_TOKEN),
      AsyncStorage.removeItem(KEYS.ONBOARDING_COMPLETE),
    ]),

  setOnboardingComplete: () =>
    AsyncStorage.setItem(KEYS.ONBOARDING_COMPLETE, 'true'),

  isOnboardingComplete: async () => {
    const val = await AsyncStorage.getItem(KEYS.ONBOARDING_COMPLETE);
    return val === 'true';
  },
};
