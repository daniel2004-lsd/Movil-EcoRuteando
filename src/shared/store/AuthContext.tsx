import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { AppState } from 'react-native';
import * as SecureStore from '../services/keyStorage';
import { onSessionExpired } from '../services/authEvents';
import { requestPushPermissions, getExpoPushToken, registerDeviceOnBackend, isExpoGo } from '../services/pushNotificationService';

type Role = 'user' | 'admin';

export type AuthState = {
  email: string | null;
  role: Role | null;
  userId: string | null;
  firstName: string | null;
  isAuthenticated: boolean;
};

type AuthContextType = {
  auth: AuthState;
  isLoading: boolean;
  isAuthenticated: boolean;
  connectionStatus?: 'online' | 'offline-degraded' | 'offline-unvalidated';
  connectionMessage?: string | null;
  retrySessionValidation: () => Promise<boolean>;
  signIn: (params: {
    accessToken: string;
    refreshToken: string;
    email: string;
    role?: string;
    userId?: string;
    firstName?: string;
  }) => Promise<void>;
  signOut: () => Promise<void>;
  setAuth: (value: AuthState) => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = 'ecoruteando_auth';

import axios from 'axios';
import { API_BASE } from '../services/apiClient';
import {
  canAccessProtectedRoutes,
  classifyRefreshError,
  decodeJwtPayload,
  executeSingleFlightRefresh,
  extractClaimsFromAccessToken,
  hydrateSessionFromTokens,
  isTemporaryRefreshError,
  isTemporaryTwoFactorToken,
  isTokenExpired,
  normalizeSessionRole,
  persistValidatedSessionAtomically,
  purgeSessionStorage,
  restoreOrRefreshSessionLifecycle,
} from '../utils/jwtHydration';

export {
  canAccessProtectedRoutes,
  classifyRefreshError,
  decodeJwtPayload,
  executeSingleFlightRefresh,
  extractClaimsFromAccessToken,
  hydrateSessionFromTokens,
  isTemporaryRefreshError,
  isTemporaryTwoFactorToken,
  isTokenExpired,
  normalizeSessionRole,
  persistValidatedSessionAtomically,
  purgeSessionStorage,
  restoreOrRefreshSessionLifecycle,
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState<AuthState>({
    email: null,
    role: null,
    userId: null,
    firstName: null,
    isAuthenticated: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<
    'online' | 'offline-degraded' | 'offline-unvalidated'
  >('online');
  const [connectionMessage, setConnectionMessage] = useState<string | null>(null);

  const validateAndRestoreSession = useCallback(async (): Promise<boolean> => {
    try {
      const result = await restoreOrRefreshSessionLifecycle({
        storage: SecureStore,
        refreshCall: async (refreshToken: string) => {
          const res = await axios.post(
            `${API_BASE}/api/auth/refresh`,
            { refreshToken },
            { timeout: 10000 }
          );
          return {
            accessToken: res.data?.accessToken,
            refreshToken: res.data?.refreshToken,
          };
        },
      });
      setAuth(result.authState);
      setConnectionStatus(result.connectionStatus);
      setConnectionMessage(result.connectionMessage);
      return canAccessProtectedRoutes({
        authState: result.authState,
        connectionStatus: result.connectionStatus,
        isLoading: false,
      });
    } catch {
      setAuth({
        email: null,
        role: null,
        userId: null,
        firstName: null,
        isAuthenticated: false,
      });
      setConnectionStatus('online');
      setConnectionMessage(null);
      return false;
    }
  }, []);

  useEffect(() => {
    void (async () => {
      try {
        await validateAndRestoreSession();
      } finally {
        setIsLoading(false);
      }
    })();
  }, [validateAndRestoreSession]);

  // Recuperación automática cuando la sesión quedó en 'offline-unvalidated' y la app vuelve a primer plano
  useEffect(() => {
    if (connectionStatus !== 'offline-unvalidated') {
      return;
    }
    const subscription = AppState.addEventListener('change', nextState => {
      if (nextState === 'active') {
        void validateAndRestoreSession();
      }
    });
    return () => subscription.remove();
  }, [connectionStatus, validateAndRestoreSession]);

  const retrySessionValidation = useCallback(async (): Promise<boolean> => {
    return validateAndRestoreSession();
  }, [validateAndRestoreSession]);

  // Sincronización inmediata cuando el refresh token falla definitivamente en background
  useEffect(() => {
    const unsubscribe = onSessionExpired(async () => {
      // 1. Invalida de inmediato el estado en memoria para que el Route Guard reaccione al instante
      setAuth({
        email: null,
        role: null,
        userId: null,
        firstName: null,
        isAuthenticated: false,
      });
      setConnectionStatus('online');
      setConnectionMessage(null);

      // 2. Purgar credenciales en almacenamiento seguro de forma asíncrona
      try {
        await SecureStore.deleteItemAsync(AUTH_STORAGE_KEY);
        await SecureStore.deleteItemAsync('accessToken');
        await SecureStore.deleteItemAsync('refreshToken');
        await SecureStore.deleteItemAsync('userId');
        await SecureStore.deleteItemAsync('profileAvatarUri');
      } catch {}
    });
    return () => unsubscribe();
  }, []);

  const signIn = async (params: {
    accessToken: string;
    refreshToken: string;
    email: string;
    role?: string;
    userId?: string;
    firstName?: string;
  }) => {
    let authData: AuthState;
    try {
      authData = await persistValidatedSessionAtomically(SecureStore, params);
    } catch (err) {
      setAuth({
        email: null,
        role: null,
        userId: null,
        firstName: null,
        isAuthenticated: false,
      });
      throw err;
    }

    setAuth(authData);
    setConnectionStatus('online');
    setConnectionMessage(null);

    // El registro de notificaciones push se ejecuta únicamente tras completar y persistir la autenticación válida
    if (authData.isAuthenticated && authData.userId) {
      try {
        if (isExpoGo) {
          await registerDeviceOnBackend('android', 'EXPO_GO_TEST_TOKEN');
        } else {
          const granted = await requestPushPermissions();
          if (granted) {
            const token = await getExpoPushToken();
            if (token) {
              await registerDeviceOnBackend('android', token);
            }
          }
        }
      } catch {}
    }
  };

  const signOut = async () => {
    await purgeSessionStorage(SecureStore, true);
    setAuth({ email: null, role: null, userId: null, firstName: null, isAuthenticated: false });
    setConnectionStatus('online');
    setConnectionMessage(null);
  };

  // Garantía de cierre seguro: nunca considerar autenticada una sesión sin claims completos
  // ni cuando connectionStatus es 'offline-unvalidated' (antes de validar la sesión con el backend)
  const isAuthenticated = canAccessProtectedRoutes({
    authState: auth,
    connectionStatus,
    isLoading: false,
  });

  return (
    <AuthContext.Provider
      value={{
        auth,
        isLoading,
        isAuthenticated,
        connectionStatus,
        connectionMessage,
        retrySessionValidation,
        signIn,
        signOut,
        setAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return ctx;
}
