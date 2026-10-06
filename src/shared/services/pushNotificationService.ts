import * as SecureStore from './keyStorage';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import apiClient from './apiClient';

export const isExpoGo = Platform.OS !== 'web'
  && (Constants?.expoGoConfig != null || Constants?.appOwnership === 'expo');

async function getNotifications() {
  if (isExpoGo) return null;
  try {
    return await import('expo-notifications');
  } catch {
    return null;
  }
}

export async function requestPushPermissions(): Promise<boolean> {
  const mod = await getNotifications();
  if (!mod) return false;
  try {
    const { status } = await mod.requestPermissionsAsync();
    return status === 'granted';
  } catch {
    return false;
  }
}

export async function getExpoPushToken(): Promise<string | null> {
  const mod = await getNotifications();
  if (!mod) return null;
  try {
    const token = await mod.getExpoPushTokenAsync();
    return token.data;
  } catch {
    return null;
  }
}

export async function registerDeviceOnBackend(
  platform: string,
  expoToken: string,
  deviceId?: string
): Promise<void> {
  const userId = await SecureStore.getItemAsync('userId');
  if (!userId) return;
  await apiClient.post('/api/notifications/device/register', {
    userId,
    platform,
    expoPushToken: expoToken,
    deviceId,
  });
}

export async function setupPushNotifications(
  _onNotificationReceived: (notification: any) => void
): Promise<void> {
  const mod = await getNotifications();
  if (!mod) return;
  try {
    mod.addNotificationReceivedListener(_onNotificationReceived);
    mod.addNotificationResponseReceivedListener((response: any) => {
      const data = response.notification.request.content.data as {
        path?: string;
        params?: Record<string, unknown>;
      };
      if (data?.path) {
        // Navegación a la URL de la notificación
      }
    });
  } catch {}
}
