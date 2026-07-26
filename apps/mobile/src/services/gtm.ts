import { Platform } from 'react-native';

declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[];
  }
}

export function trackEvent(event: string, params: Record<string, unknown> = {}) {
  if (Platform.OS !== 'web' || typeof window === 'undefined' || !window.dataLayer) return;
  window.dataLayer.push({ event, ...params });
}
