import axios from 'axios';
import * as SecureStore from './keyStorage';
import { emitSessionExpired } from './authEvents';
import { tGlobal } from '../../i18n/translations';
import {
  classifyRefreshError,
  isTemporaryTwoFactorToken,
  isTokenExpired,
} from '../utils/jwtHydration';

export const PRODUCTION_API_URL = 'https://ecoruteandobackend.onrender.com';
export const API_BASE = process.env.EXPO_PUBLIC_API_URL || PRODUCTION_API_URL;

const apiClient = axios.create({
  baseURL: API_BASE,
  timeout: 45000,
  headers: { 'Content-Type': 'application/json' },
});

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    error ? reject(error) : resolve(token!);
  });
  failedQueue = [];
};

apiClient.interceptors.request.use(async config => {
  // Purgar cualquier customApiUrl residual persistida en el dispositivo para evitar errores de red
  try {
    const customUrl = await SecureStore.getItemAsync('customApiUrl');
    if (customUrl) {
      await SecureStore.deleteItemAsync('customApiUrl');
    }
  } catch {
    // Silencioso
  }
  config.baseURL = API_BASE;

  // Si el cuerpo es FormData (ej. subida de foto H-04), eliminar Content-Type manual para que el cliente HTTP genere el boundary
  const isFormDataPayload =
    (typeof FormData !== 'undefined' && config.data instanceof FormData) ||
    (config.data && typeof (config.data as any).append === 'function');
  if (isFormDataPayload && config.headers) {
    if (typeof (config.headers as any).delete === 'function') {
      (config.headers as any).delete('Content-Type');
      (config.headers as any).delete('content-type');
    }
    delete (config.headers as any)['Content-Type'];
    delete (config.headers as any)['content-type'];
  }

  // Respetar cabecera Authorization explícita (ej. Bearer <twoFactorToken> en /api/auth/2fa/verify)
  const existingAuth =
    config.headers?.Authorization || (config.headers as any)?.authorization;
  if (!existingAuth) {
    const token = await SecureStore.getItemAsync('accessToken');
    if (token) {
      if (isTemporaryTwoFactorToken(token)) {
        try {
          await SecureStore.deleteItemAsync('accessToken');
        } catch {}
      } else {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
  }
  return config;
});

apiClient.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;
    const url = originalRequest?.url || '';
    const isAuthEndpoint =
      url.includes('/api/auth/login') ||
      url.includes('/api/auth/2fa/verify') ||
      url.includes('/api/auth/register') ||
      url.includes('/api/auth/refresh') ||
      url.includes('/api/auth/forgot-password') ||
      url.includes('/api/auth/reset-password') ||
      url.includes('/api/auth/send-verification') ||
      url.includes('/api/auth/verify-email');

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      if (isRefreshing) {
        return new Promise<string>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return apiClient(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      let sentRefreshToken: string | null = null;

      try {
        const refreshToken = await SecureStore.getItemAsync('refreshToken');
        if (!refreshToken || !refreshToken.trim()) {
          const missingErr: any = new Error('No has iniciado sesión o tu sesión ha expirado.');
          missingErr.code = 'MISSING_REFRESH_TOKEN_IN_STORAGE';
          throw missingErr;
        }

        if (isTemporaryTwoFactorToken(refreshToken)) {
          sentRefreshToken = refreshToken;
          const tempTokenErr: any = new Error('Token 2FA temporal detectado en lugar de refreshToken.');
          tempTokenErr.response = {
            status: 401,
            data: { detail: 'Refresh token inválido.' },
          };
          throw tempTokenErr;
        }

        sentRefreshToken = refreshToken.trim();

        const { data } = await axios.post(
          `${API_BASE}/api/auth/refresh`,
          { refreshToken: sentRefreshToken },
          { timeout: 15000 }
        );

        if (
          !data?.accessToken ||
          !data?.refreshToken ||
          isTemporaryTwoFactorToken(data.accessToken) ||
          isTemporaryTwoFactorToken(data.refreshToken) ||
          isTokenExpired(data.accessToken, 0)
        ) {
          const invalidRefreshResErr: any = new Error('Respuesta de renovación de sesión inválida.');
          invalidRefreshResErr.response = {
            status: 401,
            data: { detail: 'Refresh token inválido.' },
          };
          throw invalidRefreshResErr;
        }

        await SecureStore.setItemAsync('accessToken', data.accessToken);
        await SecureStore.setItemAsync('refreshToken', data.refreshToken);

        processQueue(null, data.accessToken);
        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError: any) {
        processQueue(refreshError, null);

        // Clasificar el error de refresh según el contrato real del backend:
        // - Refresh token ausente en SecureStore o no enviado en la solicitud -> NO purgar indiscriminadamente
        // - 401 con refresh token enviado y rechazado -> invalidar sesión
        // - 400 por usuario sin rol ("El usuario no tiene un rol asignado.") -> preservar credenciales
        // - 400 por refresh token inválido comprobado -> invalidar sesión
        // - 403 -> NO eliminar automáticamente la sesión
        // - Timeout, error de red, 429 o 5xx -> preservar credenciales
        const refreshClassification = classifyRefreshError(refreshError, {
          sentRefreshToken,
        });
        if (refreshClassification.shouldPurgeSession) {
          await SecureStore.deleteItemAsync('accessToken');
          await SecureStore.deleteItemAsync('refreshToken');
          await SecureStore.deleteItemAsync('ecoruteando_auth');
          await SecureStore.deleteItemAsync('userId');
          await SecureStore.deleteItemAsync('profileAvatarUri');
          emitSessionExpired();
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    const data = error.response?.data;
    const message =
      data?.detail ||
      data?.message ||
      data?.error ||
      (data?.errors
        ? Object.values(data.errors as Record<string, string[]>)
            .flat()
            .join(' ')
        : null) ||
      error.message ||
      tGlobal('common.networkError');
    if (error.response) {
      error.message = message;
      return Promise.reject(error);
    }
    return Promise.reject(new Error(message));
  }
);

export default apiClient;
