import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
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

function decodeBase64(input: string): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
  let str = input.replace(/=+$/, '');
  let output = '';
  if (str.length % 4 === 1) throw new Error('Invalid base64 string');
  for (let bc = 0, bs = 0, buffer, idx = 0; (buffer = str.charAt(idx++)); ) {
    const charIndex = chars.indexOf(buffer);
    if (~charIndex) {
      bs = bc % 4 ? bs * 64 + charIndex : charIndex;
      if (bc++ % 4) output += String.fromCharCode(255 & (bs >> ((-2 * bc) & 6)));
    }
  }
  return decodeURIComponent(
    output
      .split('')
      .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
      .join('')
  );
}

export function isTokenExpired(token: string, bufferSeconds = 60): boolean {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return true;
    let b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    while (b64.length % 4) b64 += '=';
    const jsonStr = decodeBase64(b64);
    const parsed = JSON.parse(jsonStr);
    if (!parsed.exp) return false;
    const now = Math.floor(Date.now() / 1000);
    return parsed.exp <= now + bufferSeconds;
  } catch {
    return true;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState<AuthState>({
    email: null,
    role: null,
    userId: null,
    firstName: null,
    isAuthenticated: false,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const stored = await SecureStore.getItemAsync(AUTH_STORAGE_KEY);
        const accessToken = await SecureStore.getItemAsync('accessToken');
        const refreshToken = await SecureStore.getItemAsync('refreshToken');

        if (stored) {
          const parsed = JSON.parse(stored);
          // Si existía un estado previo de invitado, se invalida de inmediato
          if (parsed?.guest) {
            await SecureStore.deleteItemAsync(AUTH_STORAGE_KEY);
            if (accessToken) {
              await SecureStore.deleteItemAsync('accessToken');
              await SecureStore.deleteItemAsync('refreshToken');
              await SecureStore.deleteItemAsync('userId');
            }
            setAuth({
              email: null,
              role: null,
              userId: null,
              firstName: null,
              isAuthenticated: false,
            });
          } else if (parsed?.email) {
            const expired = !accessToken || isTokenExpired(accessToken);
            if (!expired) {
              // Token válido y vigente
              setAuth({
                email: parsed.email,
                role: parsed.role || 'user',
                userId: parsed.userId || null,
                firstName: parsed.firstName || null,
                isAuthenticated: true,
              });
            } else if (refreshToken) {
              // Token expirado: intentar renovación proactiva inmediata antes de montar la app
              try {
                const res = await axios.post(
                  `${API_BASE}/api/auth/refresh`,
                  { refreshToken },
                  { timeout: 10000 }
                );
                if (res.data?.accessToken && res.data?.refreshToken) {
                  await SecureStore.setItemAsync('accessToken', res.data.accessToken);
                  await SecureStore.setItemAsync('refreshToken', res.data.refreshToken);
                  setAuth({
                    email: parsed.email,
                    role: parsed.role || 'user',
                    userId: parsed.userId || null,
                    firstName: parsed.firstName || null,
                    isAuthenticated: true,
                  });
                } else {
                  throw new Error('Respuesta de refresh inválida');
                }
              } catch (refreshErr: any) {
                const isTemporaryNetworkOrServerError =
                  !refreshErr.response ||
                  refreshErr.code === 'ECONNABORTED' ||
                  (refreshErr.response.status >= 500 && refreshErr.response.status <= 599);

                if (isTemporaryNetworkOrServerError) {
                  // Error de red temporal: permitir acceso con sesión persistida para modo offline
                  setAuth({
                    email: parsed.email,
                    role: parsed.role || 'user',
                    userId: parsed.userId || null,
                    firstName: parsed.firstName || null,
                    isAuthenticated: true,
                  });
                } else {
                  // Refresh token inválido o revocado en backend: invalidar sesión limpiamente
                  await SecureStore.deleteItemAsync('accessToken');
                  await SecureStore.deleteItemAsync('refreshToken');
                  await SecureStore.deleteItemAsync(AUTH_STORAGE_KEY);
                  setAuth({
                    email: null,
                    role: null,
                    userId: null,
                    firstName: null,
                    isAuthenticated: false,
                  });
                }
              }
            } else {
              setAuth({
                email: null,
                role: null,
                userId: null,
                firstName: null,
                isAuthenticated: false,
              });
            }
          } else {
            setAuth({
              email: null,
              role: null,
              userId: null,
              firstName: null,
              isAuthenticated: false,
            });
          }
        } else {
          setAuth({
            email: null,
            role: null,
            userId: null,
            firstName: null,
            isAuthenticated: false,
          });
        }
      } catch {
        setAuth({
          email: null,
          role: null,
          userId: null,
          firstName: null,
          isAuthenticated: false,
        });
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

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
    await SecureStore.setItemAsync('accessToken', params.accessToken);
    await SecureStore.setItemAsync('refreshToken', params.refreshToken);

    const authData: AuthState = {
      email: params.email,
      role: (params.role as Role) || 'user',
      userId: params.userId || null,
      firstName: params.firstName || null,
      isAuthenticated: true,
    };

    await SecureStore.setItemAsync(AUTH_STORAGE_KEY, JSON.stringify(authData));
    setAuth(authData);

    if (params.userId) {
      try {
        await SecureStore.setItemAsync('userId', params.userId);
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
    await SecureStore.deleteItemAsync('accessToken');
    await SecureStore.deleteItemAsync('refreshToken');
    await SecureStore.deleteItemAsync(AUTH_STORAGE_KEY);
    await SecureStore.deleteItemAsync('profileAvatarUri');
    setAuth({ email: null, role: null, userId: null, firstName: null, isAuthenticated: false });
  };

  const isAuthenticated = auth.isAuthenticated;

  return (
    <AuthContext.Provider value={{ auth, isLoading, isAuthenticated, signIn, signOut, setAuth }}>
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
