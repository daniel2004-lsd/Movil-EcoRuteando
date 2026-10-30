import axios from 'axios';
import * as SecureStore from './keyStorage';
import { emitSessionExpired } from './authEvents';
import { tGlobal } from '../../i18n/translations';

export const PRODUCTION_API_URL = 'https://ecoruteandobackend.onrender.com';
export const API_BASE = !__DEV__
  ? PRODUCTION_API_URL
  : (process.env.EXPO_PUBLIC_API_URL || PRODUCTION_API_URL);

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

  const token = await SecureStore.getItemAsync('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
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

      try {
        const refreshToken = await SecureStore.getItemAsync('refreshToken');
        if (!refreshToken) throw new Error('No has iniciado sesión o tu sesión ha expirado.');

        const { data } = await axios.post(`${API_BASE}/api/auth/refresh`, {
          refreshToken,
        });

        await SecureStore.setItemAsync('accessToken', data.accessToken);
        await SecureStore.setItemAsync('refreshToken', data.refreshToken);

        processQueue(null, data.accessToken);
        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError: any) {
        processQueue(refreshError, null);

        // No cerrar sesión por errores temporales de red o indisponibilidad momentánea de servidor
        const isTemporaryNetworkOrServerError =
          !refreshError.response ||
          refreshError.code === 'ECONNABORTED' ||
          (refreshError.response.status >= 500 && refreshError.response.status <= 599);

        if (!isTemporaryNetworkOrServerError) {
          await SecureStore.deleteItemAsync('accessToken');
          await SecureStore.deleteItemAsync('refreshToken');
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
