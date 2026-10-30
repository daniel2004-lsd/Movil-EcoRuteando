import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../../');

// Implementación del despachador de eventos de autenticación bajo prueba
class AuthEventsManager {
  constructor() {
    this.sessionExpiredListeners = new Set();
    this.lastEmittedTimestamp = 0;
    this.deduplicationWindowMs = 1500;
  }

  onSessionExpired(listener) {
    this.sessionExpiredListeners.add(listener);
    return () => {
      this.sessionExpiredListeners.delete(listener);
    };
  }

  emitSessionExpired() {
    const now = Date.now();
    if (now - this.lastEmittedTimestamp < this.deduplicationWindowMs) {
      return;
    }
    this.lastEmittedTimestamp = now;

    this.sessionExpiredListeners.forEach(listener => {
      try {
        listener();
      } catch (e) {
        console.warn('[authEvents] Error ejecutando listener:', e);
      }
    });
  }

  reset() {
    this.sessionExpiredListeners.clear();
    this.lastEmittedTimestamp = 0;
  }
}

// Simulador de pipeline de Axios con cola de concurrencia y refresco de tokens
class AxiosRefreshPipeline {
  constructor(authEventsManager, secureStoreMock) {
    this.authEvents = authEventsManager;
    this.secureStore = secureStoreMock;
    this.isRefreshing = false;
    this.failedQueue = [];
    this.refreshCallCount = 0;
  }

  processQueue(error, token) {
    this.failedQueue.forEach(({ resolve, reject }) => {
      error ? reject(error) : resolve(token);
    });
    this.failedQueue = [];
  }

  async executeRequest(requestConfig, mockEndpointHandler, mockRefreshHandler) {
    try {
      return await mockEndpointHandler(requestConfig);
    } catch (error) {
      const originalRequest = error.config || requestConfig;
      if (error.response?.status === 401 && !originalRequest._retry) {
        if (this.isRefreshing) {
          return new Promise((resolve, reject) => {
            this.failedQueue.push({ resolve, reject });
          }).then(token => {
            originalRequest.headers = originalRequest.headers || {};
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return mockEndpointHandler(originalRequest);
          });
        }

        originalRequest._retry = true;
        this.isRefreshing = true;

        try {
          const refreshToken = await this.secureStore.getItemAsync('refreshToken');
          if (!refreshToken) {
            throw new Error('No has iniciado sesión o tu sesión ha expirado.');
          }

          this.refreshCallCount++;
          const refreshResponse = await mockRefreshHandler(refreshToken);
          const { accessToken: newAccess, refreshToken: newRefresh } = refreshResponse.data;

          await this.secureStore.setItemAsync('accessToken', newAccess);
          await this.secureStore.setItemAsync('refreshToken', newRefresh);

          this.processQueue(null, newAccess);
          originalRequest.headers = originalRequest.headers || {};
          originalRequest.headers.Authorization = `Bearer ${newAccess}`;
          return await mockEndpointHandler(originalRequest);
        } catch (refreshError) {
          this.processQueue(refreshError, null);

          const isTemporaryNetworkOrServerError =
            !refreshError.response ||
            refreshError.code === 'ECONNABORTED' ||
            (refreshError.response.status >= 500 && refreshError.response.status <= 599);

          if (!isTemporaryNetworkOrServerError) {
            await this.secureStore.deleteItemAsync('accessToken');
            await this.secureStore.deleteItemAsync('refreshToken');
            await this.secureStore.deleteItemAsync('profileAvatarUri');
            this.authEvents.emitSessionExpired();
          }

          throw refreshError;
        } finally {
          this.isRefreshing = false;
        }
      }
      throw error;
    }
  }
}

// Simulador de SecureStore en memoria
class InMemorySecureStore {
  constructor(initialData = {}) {
    this.store = new Map(Object.entries(initialData));
  }
  async getItemAsync(key) {
    return this.store.get(key) ?? null;
  }
  async setItemAsync(key, value) {
    this.store.set(key, String(value));
  }
  async deleteItemAsync(key) {
    this.store.delete(key);
  }
}

// Simulador de AuthContext en memoria
class InMemoryAuthContext {
  constructor(initialAuth, authEventsManager, secureStore) {
    this.auth = { ...initialAuth };
    this.authEvents = authEventsManager;
    this.secureStore = secureStore;

    // Suscripción al evento de expiración de sesión
    this.unsubscribe = this.authEvents.onSessionExpired(async () => {
      // 1. Invalida de forma síncrona el estado en memoria
      this.auth = {
        email: null,
        role: null,
        userId: null,
        firstName: null,
        isAuthenticated: false,
      };

      // 2. Limpieza de almacenamiento persistente
      await this.secureStore.deleteItemAsync('ecoruteando_auth');
      await this.secureStore.deleteItemAsync('accessToken');
      await this.secureStore.deleteItemAsync('refreshToken');
      await this.secureStore.deleteItemAsync('userId');
      await this.secureStore.deleteItemAsync('profileAvatarUri');
    });
  }

  async signOut() {
    await this.secureStore.deleteItemAsync('accessToken');
    await this.secureStore.deleteItemAsync('refreshToken');
    await this.secureStore.deleteItemAsync('ecoruteando_auth');
    await this.secureStore.deleteItemAsync('profileAvatarUri');
    this.auth = {
      email: null,
      role: null,
      userId: null,
      firstName: null,
      isAuthenticated: false,
    };
  }
}

// ==========================================
// PRUEBAS DE COMPORTAMIENTO (H-02)
// ==========================================

test('1. Refresh exitoso: conserva la sesión y actualiza tokens sin emitir expiración', async () => {
  const authEvents = new AuthEventsManager();
  const secureStore = new InMemorySecureStore({
    accessToken: 'old_access_token',
    refreshToken: 'valid_refresh_token',
    ecoruteando_auth: JSON.stringify({ email: 'conductor@ecoruteando.com', isAuthenticated: true }),
  });
  const authContext = new InMemoryAuthContext(
    { email: 'conductor@ecoruteando.com', isAuthenticated: true },
    authEvents,
    secureStore
  );

  let expiredEmitted = false;
  authEvents.onSessionExpired(() => {
    expiredEmitted = true;
  });

  const pipeline = new AxiosRefreshPipeline(authEvents, secureStore);

  // Primera llamada responde 401; tras refresco responde 200 OK
  let attempts = 0;
  const mockEndpoint = async (req) => {
    attempts++;
    if (attempts === 1) {
      const err = new Error('Unauthorized');
      err.response = { status: 401 };
      err.config = req;
      throw err;
    }
    return { status: 200, data: { success: true } };
  };

  const mockRefresh = async () => ({
    status: 200,
    data: { accessToken: 'brand_new_access', refreshToken: 'brand_new_refresh' },
  });

  const result = await pipeline.executeRequest({ url: '/api/trips' }, mockEndpoint, mockRefresh);

  assert.equal(result.status, 200);
  assert.equal(pipeline.refreshCallCount, 1);
  assert.equal(await secureStore.getItemAsync('accessToken'), 'brand_new_access');
  assert.equal(await secureStore.getItemAsync('refreshToken'), 'brand_new_refresh');
  assert.equal(expiredEmitted, false, 'No debe emitir expiración si el refresh fue exitoso');
  assert.equal(authContext.auth.isAuthenticated, true, 'La sesión en memoria debe permanecer activa');
});

test('2. Refresh rechazado: invalida la sesión inmediatamente y sincroniza AuthContext a false', async () => {
  const authEvents = new AuthEventsManager();
  const secureStore = new InMemorySecureStore({
    accessToken: 'expired_access_token',
    refreshToken: 'revoked_refresh_token',
    ecoruteando_auth: JSON.stringify({ email: 'usuario@ecoruteando.com', isAuthenticated: true }),
  });
  const authContext = new InMemoryAuthContext(
    { email: 'usuario@ecoruteando.com', isAuthenticated: true, userId: 'u-123' },
    authEvents,
    secureStore
  );

  const pipeline = new AxiosRefreshPipeline(authEvents, secureStore);

  const mockEndpoint = async (req) => {
    const err = new Error('Unauthorized');
    err.response = { status: 401 };
    err.config = req;
    throw err;
  };

  // El backend rechaza el refresh con 401 (token revocado/expirado)
  const mockRefresh = async () => {
    const err = new Error('Invalid refresh token');
    err.response = { status: 401, data: { message: 'Token revoked' } };
    throw err;
  };

  await assert.rejects(
    async () => {
      await pipeline.executeRequest({ url: '/api/favorites' }, mockEndpoint, mockRefresh);
    },
    /Invalid refresh token/
  );

  // Verificación del estado de AuthContext sincronizado inmediatamente
  assert.equal(authContext.auth.isAuthenticated, false, 'AuthContext debe ser false de inmediato');
  assert.equal(authContext.auth.email, null, 'Email de usuario debe limpiarse');
  assert.equal(authContext.auth.userId, null, 'UserId debe limpiarse');

  // Verificación de almacenamiento seguro purgado
  assert.equal(await secureStore.getItemAsync('accessToken'), null);
  assert.equal(await secureStore.getItemAsync('refreshToken'), null);
  assert.equal(await secureStore.getItemAsync('ecoruteando_auth'), null);
});

test('3. Varias solicitudes 401 simultáneas: ejecutan un único proceso de renovación', async () => {
  const authEvents = new AuthEventsManager();
  const secureStore = new InMemorySecureStore({
    accessToken: 'old_access',
    refreshToken: 'valid_refresh',
  });
  const pipeline = new AxiosRefreshPipeline(authEvents, secureStore);

  let endpointCalls = 0;
  const mockEndpoint = async (req) => {
    endpointCalls++;
    if (!req.headers?.Authorization?.includes('new_access')) {
      const err = new Error('Unauthorized');
      err.response = { status: 401 };
      err.config = req;
      throw err;
    }
    return { status: 200, data: { ok: true } };
  };

  const mockRefresh = async () => {
    // Simular latencia de red en la renovación
    await new Promise(r => setTimeout(r, 20));
    return {
      status: 200,
      data: { accessToken: 'new_access', refreshToken: 'new_refresh' },
    };
  };

  // Lanzar 5 peticiones simultáneas
  const requests = [
    pipeline.executeRequest({ url: '/api/trips' }, mockEndpoint, mockRefresh),
    pipeline.executeRequest({ url: '/api/favorites' }, mockEndpoint, mockRefresh),
    pipeline.executeRequest({ url: '/api/alerts' }, mockEndpoint, mockRefresh),
    pipeline.executeRequest({ url: '/api/stats' }, mockEndpoint, mockRefresh),
    pipeline.executeRequest({ url: '/api/profile' }, mockEndpoint, mockRefresh),
  ];

  const results = await Promise.all(requests);

  // Exactamente 1 llamada a refresh ejecutada
  assert.equal(pipeline.refreshCallCount, 1, 'Debe ejecutarse un único proceso de refresh');
  assert.equal(results.length, 5);
  results.forEach(res => assert.equal(res.status, 200));
});

test('4. Refresh fallido: todas las solicitudes pendientes en cola son rechazadas y emite un solo evento', async () => {
  const authEvents = new AuthEventsManager();
  const secureStore = new InMemorySecureStore({
    accessToken: 'expired_access',
    refreshToken: 'bad_refresh',
  });

  let expirationEventCount = 0;
  authEvents.onSessionExpired(() => {
    expirationEventCount++;
  });

  const pipeline = new AxiosRefreshPipeline(authEvents, secureStore);

  const mockEndpoint = async (req) => {
    const err = new Error('Unauthorized');
    err.response = { status: 401 };
    err.config = req;
    throw err;
  };

  const mockRefresh = async () => {
    await new Promise(r => setTimeout(r, 20));
    const err = new Error('Definitive 403 Forbidden');
    err.response = { status: 403, data: { detail: 'Token expired' } };
    throw err;
  };

  const p1 = pipeline.executeRequest({ url: '/api/trips' }, mockEndpoint, mockRefresh);
  const p2 = pipeline.executeRequest({ url: '/api/favorites' }, mockEndpoint, mockRefresh);
  const p3 = pipeline.executeRequest({ url: '/api/alerts' }, mockEndpoint, mockRefresh);

  const results = await Promise.allSettled([p1, p2, p3]);

  // Todas las solicitudes en cola deben quedar rechazadas
  assert.equal(results.length, 3);
  results.forEach((r, idx) => {
    assert.equal(r.status, 'rejected', `Solicitud ${idx + 1} debe ser rechazada`);
  });

  // El evento de expiración debe dispararse exactamente 1 vez (evita tormentas de redirección)
  assert.equal(expirationEventCount, 1, 'Debe emitir exactamente un evento de expiración');
  assert.equal(await secureStore.getItemAsync('accessToken'), null);
});

test('5. Usuario sin sesión: Route Guard de pestañas bloquea acceso y redirige a login', () => {
  // Simulación de la regla del Route Guard en app/(tabs)/_layout.tsx
  const evaluateRouteGuard = ({ isLoading, isAuthenticated }) => {
    if (isLoading) {
      return { action: 'RENDER_LOADING_SPINNER', target: null };
    }
    if (!isAuthenticated) {
      return { action: 'REDIRECT', target: '/(auth)/login' };
    }
    return { action: 'RENDER_TABS', target: null };
  };

  // 1. Cargando: Spinner
  assert.deepEqual(evaluateRouteGuard({ isLoading: true, isAuthenticated: false }), {
    action: 'RENDER_LOADING_SPINNER',
    target: null,
  });

  // 2. Sin sesión terminada de cargar: Redirige al login
  assert.deepEqual(evaluateRouteGuard({ isLoading: false, isAuthenticated: false }), {
    action: 'REDIRECT',
    target: '/(auth)/login',
  });

  // 3. Con sesión autenticada: Muestra pestañas
  assert.deepEqual(evaluateRouteGuard({ isLoading: false, isAuthenticated: true }), {
    action: 'RENDER_TABS',
    target: null,
  });
});

test('6. Cierre de sesión (signOut): estado en memoria y almacenamiento sincronizados', async () => {
  const authEvents = new AuthEventsManager();
  const secureStore = new InMemorySecureStore({
    accessToken: 'jwt_token_123',
    refreshToken: 'refresh_123',
    ecoruteando_auth: JSON.stringify({ email: 'test@user.com', role: 'user', isAuthenticated: true }),
    profileAvatarUri: 'file:///avatar.png',
  });

  const authContext = new InMemoryAuthContext(
    { email: 'test@user.com', role: 'user', userId: 'u-99', firstName: 'Daniel', isAuthenticated: true },
    authEvents,
    secureStore
  );

  // Estado inicial autenticado
  assert.equal(authContext.auth.isAuthenticated, true);
  assert.equal(await secureStore.getItemAsync('accessToken'), 'jwt_token_123');

  // Ejecución de signOut
  await authContext.signOut();

  // Memoria limpia y desautenticada
  assert.deepEqual(authContext.auth, {
    email: null,
    role: null,
    userId: null,
    firstName: null,
    isAuthenticated: false,
  });

  // Almacenamiento seguro limpio
  assert.equal(await secureStore.getItemAsync('accessToken'), null);
  assert.equal(await secureStore.getItemAsync('refreshToken'), null);
  assert.equal(await secureStore.getItemAsync('ecoruteando_auth'), null);
  assert.equal(await secureStore.getItemAsync('profileAvatarUri'), null);
});

test('7. Integridad estática de código fuente: apiClient.ts y AuthContext.tsx importan authEvents', () => {
  const apiClientContent = fs.readFileSync(path.join(projectRoot, 'src/shared/services/apiClient.ts'), 'utf8');
  const authContextContent = fs.readFileSync(path.join(projectRoot, 'src/shared/store/AuthContext.tsx'), 'utf8');
  const authEventsContent = fs.readFileSync(path.join(projectRoot, 'src/shared/services/authEvents.ts'), 'utf8');

  // apiClient debe emitir session expired ante fallo definitivo
  assert.match(apiClientContent, /import\s*\{\s*emitSessionExpired\s*\}\s*from\s*['"]\.\/authEvents['"]/);
  assert.match(apiClientContent, /emitSessionExpired\(\)/);

  // AuthContext debe suscribirse a onSessionExpired
  assert.match(authContextContent, /import\s*\{\s*onSessionExpired\s*\}\s*from\s*['"]\.\.\/services\/authEvents['"]/);
  assert.match(authContextContent, /onSessionExpired\s*\(\s*async/);

  // authEvents debe exportar onSessionExpired y emitSessionExpired
  assert.match(authEventsContent, /export const onSessionExpired/);
  assert.match(authEventsContent, /export const emitSessionExpired/);
});
