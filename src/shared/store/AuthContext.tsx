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
          } else if (accessToken && parsed?.email) {
            // Sesión legítima con token existente
            setAuth({
              email: parsed.email,
              role: parsed.role || 'user',
              userId: parsed.userId || null,
              firstName: parsed.firstName || null,
              isAuthenticated: true,
            });
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
