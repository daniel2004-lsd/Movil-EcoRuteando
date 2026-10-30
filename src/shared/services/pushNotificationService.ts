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

/**
 * Registra o actualiza el push token del dispositivo en el backend (H-12).
 * Consume POST /api/notifications/device-token.
 * La identidad del usuario se valida mediante el JWT Bearer token transmitido por apiClient.
 * Maneja errores de registro de forma controlada sin exponer tokens en logs ni bloquear la app.
 */
export async function registerDeviceOnBackend(
  platform: string,
  expoToken: string,
  deviceId?: string
): Promise<void> {
  if (!expoToken) return;
  try {
    await apiClient.post('/api/notifications/device-token', {
      platform,
      expoPushToken: expoToken,
      deviceId,
    });
  } catch (error: any) {
    // Fallo controlado de registro para no interrumpir el uso normal de la app
    const status = error?.response?.status;
    if (__DEV__) {
      console.warn(`[PushNotification] Registro de dispositivo no completado (HTTP ${status || 'red'}).`);
    }
  }
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
