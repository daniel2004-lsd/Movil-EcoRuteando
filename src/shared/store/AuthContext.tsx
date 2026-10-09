import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as SecureStore from '../services/keyStorage';
import { requestPushPermissions, getExpoPushToken, registerDeviceOnBackend, isExpoGo } from '../services/pushNotificationService';

type Role = 'user' | 'admin';

type AuthState = {
  email: string | null;
  role: Role | null;
  userId: string | null;
  firstName: string | null;
  guest?: boolean;
};

type AuthContextType = {
  auth: AuthState;
  isLoading: boolean;
  signIn: (params: {
    accessToken: string;
    refreshToken: string;
    email: string;
    role?: string;
    userId?: string;
    firstName?: string;
  }) => Promise<void>;
  signOut: () => Promise<void>;
  enterGuest: () => Promise<void>;
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
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const stored = await SecureStore.getItemAsync(AUTH_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          const accessToken = await SecureStore.getItemAsync('accessToken');
          if (parsed?.guest) {
            // Invitado = sin sesión. Si quedó un token de un inicio de sesión
            // anterior, lo borramos: si no, apiClient seguiría mandando
            // Authorization con la cuenta real y el invitado vería los datos
            // de esa persona (historial, favoritos, etc.).
            if (accessToken) {
              await SecureStore.deleteItemAsync('accessToken');
              await SecureStore.deleteItemAsync('refreshToken');
              await SecureStore.deleteItemAsync('userId');
            }
            setAuth(parsed);
          } else if (accessToken) {
            setAuth(parsed);
          }
        }
      } catch {} finally {
        setIsLoading(false);
      }
    })();
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
    setAuth({ email: null, role: null, userId: null, firstName: null });
  };

  const enterGuest = async () => {
    // Primero cerramos cualquier sesión guardada: entrar de invitado debe
    // dejar la app SIN token, o la API seguiría actuando como el usuario
    // que había entrado antes (bug: el invitado veía la cuenta real).
    await SecureStore.deleteItemAsync('accessToken');
    await SecureStore.deleteItemAsync('refreshToken');
    await SecureStore.deleteItemAsync('userId');

    const authData: AuthState = {
      email: null,
      role: null,
      userId: null,
      firstName: null,
      guest: true,
    };
    await SecureStore.setItemAsync(AUTH_STORAGE_KEY, JSON.stringify(authData));
    setAuth(authData);
  };

  return (
    <AuthContext.Provider value={{ auth, isLoading, signIn, signOut, enterGuest, setAuth }}>
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
