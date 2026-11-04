import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../../');

/**
 * Carga y transpila en memoria el módulo TypeScript real de hidratación JWT (src/shared/utils/jwtHydration.ts)
 * sin generar archivos residuales en el árbol de trabajo.
 */
async function loadJwtHydrationModule() {
  const tsPath = path.join(projectRoot, 'src/shared/utils/jwtHydration.ts');
  const source = fs.readFileSync(tsPath, 'utf8');
  const transpiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ES2022,
      target: ts.ScriptTarget.ES2022,
    },
  });
  const dataUrl = `data:text/javascript;base64,${Buffer.from(transpiled.outputText, 'utf8').toString('base64')}`;
  return import(dataUrl);
}

const jwtHydrationPromise = loadJwtHydrationModule();

/**
 * Construye un JWT de prueba con la estructura exacta que emite JwtProvider.cs en EcoRuteandoBackend.
 */
function buildTestJwt(payloadObj, headerObj = { alg: 'HS256', typ: 'JWT' }) {
  const b64Url = (obj) =>
    Buffer.from(JSON.stringify(obj), 'utf8')
      .toString('base64')
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');
  return `${b64Url(headerObj)}.${b64Url(payloadObj)}.test_signature_hmac_sha256`;
}

/**
 * Emula JwtProvider.GenerateToken(userId, email, role, sessionId) del backend real (.NET).
 */
function createBackendAccessToken({
  userId = '3fa85f64-5717-4562-b3fc-2c963f66afa6',
  email = 'daniel@ecoruteando.com',
  role = 'user',
  sessionId = '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d',
  expiresInSeconds = 3600,
  useDotNetClaimUris = true,
} = {}) {
  const now = Math.floor(Date.now() / 1000);
  const payload = useDotNetClaimUris
    ? {
        sub: userId,
        'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier': userId,
        'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress': email,
        'http://schemas.microsoft.com/ws/2008/06/identity/claims/role': role,
        token_type: 'access',
        session_id: sessionId,
        exp: now + expiresInSeconds,
        iss: 'EcoRuteando',
        aud: 'EcoRuteandoClient',
      }
    : {
        sub: userId,
        email,
        role,
        token_type: 'access',
        exp: now + expiresInSeconds,
      };
  return buildTestJwt(payload);
}

/**
 * Emula JwtProvider.GenerateTwoFactorToken(userId, email) del backend real (.NET).
 */
function createBackendTwoFactorTempToken({
  userId = '3fa85f64-5717-4562-b3fc-2c963f66afa6',
  email = 'daniel@ecoruteando.com',
  expiresInSeconds = 300,
} = {}) {
  const now = Math.floor(Date.now() / 1000);
  return buildTestJwt({
    sub: userId,
    'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier': userId,
    'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress': email,
    'http://schemas.microsoft.com/ws/2008/06/identity/claims/role': 'two_factor_pending',
    token_type: 'two_factor_temp',
    exp: now + expiresInSeconds,
  });
}

/**
 * Adaptador de almacenamiento seguro en memoria con soporte para inyectar fallos en setItemAsync.
 */
function createMockSecureStorage(initialEntries = {}, failOnKey = null) {
  const map = new Map(Object.entries(initialEntries));
  return {
    map,
    getItemAsync: async (key) => (map.has(key) ? map.get(key) : null),
    setItemAsync: async (key, value) => {
      if (failOnKey && key === failOnKey) {
        throw new Error(`Simulated SecureStore write failure on key: ${key}`);
      }
      map.set(key, String(value));
    },
    deleteItemAsync: async (key) => {
      map.delete(key);
    },
  };
}

/**
 * Simulador del flujo de AuthContext.signIn respaldado por persistValidatedSessionAtomically real.
 */
function createAuthSessionHarness(jwtModule, storageOptions = {}) {
  const { persistValidatedSessionAtomically } = jwtModule;
  const storageAdapter = createMockSecureStorage(storageOptions.initialEntries, storageOptions.failOnKey);
  let pushRegisteredWith = null;
  let authState = {
    email: null,
    role: null,
    userId: null,
    firstName: null,
    isAuthenticated: false,
  };

  const signIn = async (params) => {
    try {
      const validatedSession = await persistValidatedSessionAtomically(storageAdapter, params);
      authState = validatedSession;
      // Registro de notificaciones push SÓLO tras autenticación y persistencia completas
      pushRegisteredWith = {
        userId: validatedSession.userId,
        platform: 'android',
        token: 'EXPO_PUSH_TOKEN_OK',
      };
    } catch (err) {
      authState = {
        email: null,
        role: null,
        userId: null,
        firstName: null,
        isAuthenticated: false,
      };
      throw err;
    }
  };

  return {
    storage: storageAdapter.map,
    storageAdapter,
    getAuthState: () => authState,
    getPushRegistration: () => pushRegisteredWith,
    signIn,
  };
}

// Simulador del flujo de verify-code.tsx alineado con la implementación real
async function executeVerification({
  mode,
  code,
  tempToken,
  email,
  apiClient,
  signIn,
  decodeJwtPayload,
  isTokenExpired,
}) {
  const joined = Array.isArray(code) ? code.join('') : String(code || '');
  if (joined.length < 6) {
    throw new Error('Código incompleto');
  }

  const is2Fa = mode === '2fa';

  if (is2Fa) {
    const cleanTempToken = typeof tempToken === 'string' ? tempToken.trim() : '';
    if (!cleanTempToken) {
      throw new Error('El token temporal de 2FA ha expirado o no es válido. Por favor inicia sesión nuevamente.');
    }

    if (decodeJwtPayload && isTokenExpired) {
      const hasJwtStructure = cleanTempToken.split('.').length === 3;
      const decodedTemp = decodeJwtPayload(cleanTempToken);
      if (!hasJwtStructure || !decodedTemp || isTokenExpired(cleanTempToken, 0)) {
        throw new Error('El token temporal de 2FA ha expirado o no es válido. Por favor inicia sesión nuevamente.');
      }
    }

    const res = await apiClient.post(
      '/api/auth/2fa/verify',
      { code: joined, rememberDevice: false },
      {
        headers: {
          Authorization: `Bearer ${cleanTempToken}`,
        },
      }
    );

    const data = res?.data;
    const accessToken = data?.accessToken || data?.token;
    const refreshToken = data?.refreshToken;

    if (accessToken && refreshToken) {
      if (accessToken === cleanTempToken) {
        throw new Error('El token temporal de 2FA no puede guardarse como token de acceso.');
      }
      await signIn({
        accessToken,
        refreshToken,
        email: String(email || ''),
        role: data?.role,
        userId: data?.userId,
        firstName: data?.firstName,
      });
      return { success: true, redirect: '/(tabs)', session: { accessToken, refreshToken, email } };
    }
    return { success: false, redirect: '/(auth)/login' };
  } else {
    const res = await apiClient.post('/api/auth/verify-email', { code: joined });
    const data = res?.data;
    const accessToken = data?.accessToken || data?.token;
    const refreshToken = data?.refreshToken;

    if (accessToken && refreshToken && email) {
      await signIn({
        accessToken,
        refreshToken,
        email: String(email),
        role: data?.role,
        userId: data?.userId,
        firstName: data?.firstName,
      });
      return { success: true, redirect: '/(tabs)', session: { accessToken, refreshToken, email } };
    }
    return { success: true, redirect: '/(auth)/login', message: data?.message };
  }
}

async function executeResend({ mode, email, apiClient }) {
  if (mode === '2fa') {
    throw new Error('Los códigos 2FA se generan automáticamente en tu aplicación autenticadora cada 30 segundos.');
  }
  if (!email) {
    throw new Error('No se identificó el correo electrónico.');
  }
  const res = await apiClient.post('/api/auth/send-verification', { email: String(email).trim() });
  return res.data;
}

test('H-16 2FA: Rechaza verificación si el código tiene menos de 6 dígitos o falta tempToken', async () => {
  await assert.rejects(
    async () => {
      await executeVerification({
        mode: '2fa',
        code: ['1', '2', '3'],
        tempToken: 'valid.temp.token',
        email: 'user@test.com',
      });
    },
    { message: 'Código incompleto' }
  );

  await assert.rejects(
    async () => {
      await executeVerification({
        mode: '2fa',
        code: ['1', '2', '3', '4', '5', '6'],
        tempToken: '',
        email: 'user@test.com',
      });
    },
    { message: 'El token temporal de 2FA ha expirado o no es válido. Por favor inicia sesión nuevamente.' }
  );
});

test('H-16 Contrato Real Backend: VerifyTwoFactorAuthResponse sin userId/role en JSON hidrata sesión completa desde claims del accessToken y registra push tras persistir', async () => {
  const jwtModule = await jwtHydrationPromise;
  const { decodeJwtPayload, isTokenExpired } = jwtModule;
  const harness = createAuthSessionHarness(jwtModule);

  const expectedUserId = 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d';
  const expectedEmail = 'ciudadano2fa@ecoruteando.com';
  const temp2FaToken = createBackendTwoFactorTempToken({ userId: expectedUserId, email: expectedEmail });
  const finalAccessToken = createBackendAccessToken({
    userId: expectedUserId,
    email: expectedEmail,
    role: 'admin',
    useDotNetClaimUris: true,
  });

  let capturedUrl = '';
  let capturedBody = null;
  let capturedHeaders = null;

  const mockApiClient = {
    post: async (url, body, config) => {
      capturedUrl = url;
      capturedBody = body;
      capturedHeaders = config?.headers;
      return {
        data: {
          message: '2FA verificado correctamente.',
          accessToken: finalAccessToken,
          refreshToken: 'refresh-token-real-98765',
          trustedDeviceToken: null,
        },
      };
    },
  };

  const result = await executeVerification({
    mode: '2fa',
    code: ['9', '8', '7', '6', '5', '4'],
    tempToken: temp2FaToken,
    email: '',
    apiClient: mockApiClient,
    signIn: harness.signIn,
    decodeJwtPayload,
    isTokenExpired,
  });

  assert.equal(capturedUrl, '/api/auth/2fa/verify');
  assert.deepEqual(capturedBody, { code: '987654', rememberDevice: false });
  assert.equal(capturedHeaders?.Authorization, `Bearer ${temp2FaToken}`);
  assert.equal(result.redirect, '/(tabs)');

  const authState = harness.getAuthState();
  assert.equal(authState.isAuthenticated, true);
  assert.equal(authState.userId, expectedUserId, 'Debe hidratar userId desde el claim sub/NameIdentifier del JWT');
  assert.equal(authState.email, expectedEmail, 'Debe hidratar email desde el claim Email del JWT');
  assert.equal(authState.role, 'admin', 'Debe hidratar y normalizar el rol real desde el claim Role del JWT');
  assert.equal(authState.firstName, null, 'No debe inventar firstName cuando el backend no lo emite');

  assert.equal(harness.storage.get('accessToken'), finalAccessToken);
  assert.equal(harness.storage.get('refreshToken'), 'refresh-token-real-98765');
  assert.equal(harness.storage.get('userId'), expectedUserId);
  assert.ok(harness.getPushRegistration(), 'Debe registrar notificaciones push al hidratar userId');
  assert.equal(harness.getPushRegistration().userId, expectedUserId);
});

test('H-16 Coherencia Login Tradicional vs 2FA: Ambos flujos producen exactamente el mismo estado de sesión', async () => {
  const jwtModule = await jwtHydrationPromise;
  const userId = '3fa85f64-5717-4562-b3fc-2c963f66afa6';
  const email = 'usuario@ecoruteando.com';
  const accessToken = createBackendAccessToken({ userId, email, role: 'user' });

  const traditionalHarness = createAuthSessionHarness(jwtModule);
  const twoFactorHarness = createAuthSessionHarness(jwtModule);

  await traditionalHarness.signIn({
    accessToken,
    refreshToken: 'refresh-tradicional',
    email,
  });

  await twoFactorHarness.signIn({
    accessToken,
    refreshToken: 'refresh-2fa',
    email,
    role: undefined,
    userId: undefined,
    firstName: undefined,
  });

  assert.deepEqual(twoFactorHarness.getAuthState(), traditionalHarness.getAuthState());
  assert.equal(twoFactorHarness.getAuthState().userId, userId);
  assert.equal(twoFactorHarness.getAuthState().role, 'user');
  assert.equal(twoFactorHarness.getAuthState().isAuthenticated, true);
});

test('H-16 Aislamiento de Token Temporal: El twoFactorToken (two_factor_temp / two_factor_pending) NUNCA se acepta como accessToken ni como refreshToken', async () => {
  const jwtModule = await jwtHydrationPromise;
  const { isTemporaryTwoFactorToken } = jwtModule;
  const harness = createAuthSessionHarness(jwtModule);

  const tempToken = createBackendTwoFactorTempToken({
    userId: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
    email: 'user@ecoruteando.com',
  });
  const validAccess = createBackendAccessToken({
    userId: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
    email: 'user@ecoruteando.com',
    role: 'user',
  });

  assert.equal(isTemporaryTwoFactorToken(tempToken), true);

  // 1. Intento de guardar tempToken como accessToken
  await assert.rejects(
    async () => {
      await harness.signIn({
        accessToken: tempToken,
        refreshToken: 'some-refresh-token',
        email: 'user@ecoruteando.com',
      });
    },
    /token temporal de verificaci[oó]n 2FA/i
  );

  // 2. Intento de guardar tempToken como refreshToken
  await assert.rejects(
    async () => {
      await harness.signIn({
        accessToken: validAccess,
        refreshToken: tempToken,
        email: 'user@ecoruteando.com',
      });
    },
    /token temporal de 2FA no puede utilizarse ni almacenarse como refreshToken/i
  );

  assert.equal(harness.storage.get('accessToken'), undefined);
  assert.equal(harness.getAuthState().isAuthenticated, false);
  assert.equal(harness.getAuthState().userId, null);
  assert.equal(harness.getPushRegistration(), null);
});

test('H-16 Caso Negativo: Claims faltantes (sub, email, role), JWT malformado o sin exp NO producen sesión incompleta ni permiten userId: null', async () => {
  const jwtModule = await jwtHydrationPromise;
  const harness = createAuthSessionHarness(jwtModule);
  const now = Math.floor(Date.now() / 1000);

  // 1. Token JWT sin claim sub ni nameidentifier y sin userId en respuesta
  const tokenWithoutUserId = buildTestJwt({
    email: 'sin-id@ecoruteando.com',
    role: 'user',
    token_type: 'access',
    exp: now + 3600,
  });

  await assert.rejects(
    async () => {
      await harness.signIn({
        accessToken: tokenWithoutUserId,
        refreshToken: 'refresh-1',
        email: 'sin-id@ecoruteando.com',
      });
    },
    /identificador de usuario/i
  );
  assert.equal(harness.getAuthState().isAuthenticated, false);
  assert.equal(harness.getAuthState().userId, null);
  assert.equal(harness.storage.get('ecoruteando_auth'), undefined);

  // 2. Token JWT sin email ni parámetro email
  const tokenWithoutEmail = buildTestJwt({
    sub: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
    role: 'user',
    token_type: 'access',
    exp: now + 3600,
  });

  await assert.rejects(
    async () => {
      await harness.signIn({
        accessToken: tokenWithoutEmail,
        refreshToken: 'refresh-email',
        email: '',
      });
    },
    /correo electr[oó]nico/i
  );

  // 3. Token JWT sin rol válido
  const tokenWithoutRole = buildTestJwt({
    sub: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
    email: 'sin-rol@ecoruteando.com',
    token_type: 'access',
    exp: now + 3600,
  });

  await assert.rejects(
    async () => {
      await harness.signIn({
        accessToken: tokenWithoutRole,
        refreshToken: 'refresh-2',
        email: 'sin-rol@ecoruteando.com',
      });
    },
    /rol de autorizaci[oó]n/i
  );

  // 4. Token JWT sin claim exp (expiración obligatoria)
  const tokenWithoutExp = buildTestJwt({
    sub: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
    email: 'sin-exp@ecoruteando.com',
    role: 'user',
    token_type: 'access',
  });

  await assert.rejects(
    async () => {
      await harness.signIn({
        accessToken: tokenWithoutExp,
        refreshToken: 'refresh-exp',
        email: 'sin-exp@ecoruteando.com',
      });
    },
    /expiraci[oó]n \(exp\) v[aá]lida/i
  );

  // 5. Token definitivo malformado
  await assert.rejects(
    async () => {
      await harness.signIn({
        accessToken: 'not.a.valid_base64_json_jwt',
        refreshToken: 'refresh-3',
        email: 'corrupt@ecoruteando.com',
      });
    },
    /formato JWT v[aá]lido/i
  );
  assert.equal(harness.getAuthState().isAuthenticated, false);
  assert.equal(harness.getPushRegistration(), null);
});

test('H-16 Token Temporal Expirado o Malformado y Códigos TOTP Incorrecto (401/400) o Reutilizado (400)', async () => {
  const jwtModule = await jwtHydrationPromise;
  const { decodeJwtPayload, isTokenExpired } = jwtModule;
  const harness = createAuthSessionHarness(jwtModule);

  // 1. Token temporal expirado
  const expiredTempToken = createBackendTwoFactorTempToken({ expiresInSeconds: -120 });
  await assert.rejects(
    async () => {
      await executeVerification({
        mode: '2fa',
        code: '123456',
        tempToken: expiredTempToken,
        email: 'user@test.com',
        apiClient: { post: async () => ({ data: {} }) },
        signIn: harness.signIn,
        decodeJwtPayload,
        isTokenExpired,
      });
    },
    /expirado o no es v[aá]lido/i
  );

  // 2. Token temporal malformado
  await assert.rejects(
    async () => {
      await executeVerification({
        mode: '2fa',
        code: '123456',
        tempToken: 'malformed.temp.token_not_json',
        email: 'user@test.com',
        apiClient: { post: async () => ({ data: {} }) },
        signIn: harness.signIn,
        decodeJwtPayload,
        isTokenExpired,
      });
    },
    /expirado o no es v[aá]lido/i
  );

  // 3. TOTP incorrecto (HTTP 400 / 401)
  const validTempToken = createBackendTwoFactorTempToken({ expiresInSeconds: 300 });
  const mockInvalidTotp = {
    post: async () => {
      const err = new Error('Request failed with status code 400');
      err.response = { status: 400, data: { detail: 'El código de verificación es incorrecto.' } };
      throw err;
    },
  };

  await assert.rejects(
    async () => {
      await executeVerification({
        mode: '2fa',
        code: '000000',
        tempToken: validTempToken,
        email: 'user@test.com',
        apiClient: mockInvalidTotp,
        signIn: harness.signIn,
        decodeJwtPayload,
        isTokenExpired,
      });
    },
    (err) => err.response?.data?.detail === 'El código de verificación es incorrecto.'
  );
  assert.equal(harness.getAuthState().isAuthenticated, false);

  // 4. TOTP reutilizado (HTTP 400 replay protection del backend)
  const mockReusedTotp = {
    post: async () => {
      const err = new Error('Request failed with status code 400');
      err.response = {
        status: 400,
        data: { detail: 'Este código ya fue utilizado. Espera al siguiente código de tu aplicación.' },
      };
      throw err;
    },
  };

  await assert.rejects(
    async () => {
      await executeVerification({
        mode: '2fa',
        code: '123456',
        tempToken: validTempToken,
        email: 'user@test.com',
        apiClient: mockReusedTotp,
        signIn: harness.signIn,
        decodeJwtPayload,
        isTokenExpired,
      });
    },
    (err) => /ya fue utilizado/i.test(err.response?.data?.detail)
  );
  assert.equal(harness.getAuthState().isAuthenticated, false);
  assert.equal(harness.getPushRegistration(), null);
});

test('H-16 Atomicidad en SecureStore: Fallo de escritura revierte estado parcial y evita registro push', async () => {
  const jwtModule = await jwtHydrationPromise;
  const validAccess = createBackendAccessToken({
    userId: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
    email: 'atomic@ecoruteando.com',
    role: 'user',
  });

  // Simular que SecureStore falla al escribir la cuarta clave ('ecoruteando_auth') después de haber escrito 'accessToken', 'refreshToken' y 'userId'
  const harness = createAuthSessionHarness(jwtModule, {
    failOnKey: 'ecoruteando_auth',
  });

  await assert.rejects(
    async () => {
      await harness.signIn({
        accessToken: validAccess,
        refreshToken: 'refresh-atomic-123',
        email: 'atomic@ecoruteando.com',
      });
    },
    /Error al persistir la sesi[oó]n en almacenamiento seguro/i
  );

  // Todas las claves escritas antes del fallo deben haber sido purgadas en el rollback
  assert.equal(harness.storage.get('accessToken'), undefined);
  assert.equal(harness.storage.get('refreshToken'), undefined);
  assert.equal(harness.storage.get('userId'), undefined);
  assert.equal(harness.storage.get('ecoruteando_auth'), undefined);
  assert.equal(harness.getAuthState().isAuthenticated, false);
  assert.equal(harness.getPushRegistration(), null, 'No debe registrar notificaciones push si falla SecureStore');
});

test('H-16 Ciclo de Vida de Restauración y Renovación según Contrato Real: 401 invalida, 400 analiza cuerpo, 403 preserva sesión, Timeout/Red preserva credenciales, Refresh exitoso guarda sesión y offline-unvalidated bloquea rutas protegidas', async () => {
  const jwtModule = await jwtHydrationPromise;
  const {
    restoreOrRefreshSessionLifecycle,
    executeSingleFlightRefresh,
    classifyRefreshError,
    canAccessProtectedRoutes,
  } = jwtModule;

  const userId = '99887766-5544-4321-8765-1029384756ab';
  const email = 'ciclo@ecoruteando.com';
  const validAccess = createBackendAccessToken({ userId, email, role: 'user', expiresInSeconds: 3600 });
  const expiredAccess = createBackendAccessToken({ userId, email, role: 'user', expiresInSeconds: -600 });
  const refreshedAccess = createBackendAccessToken({ userId, email, role: 'user', expiresInSeconds: 3600 });

  // 1. Restauración tras reinicio con accessToken vigente (no invoca refresh endpoint)
  const storageValid = createMockSecureStorage({
    accessToken: validAccess,
    refreshToken: 'refresh-1',
    userId,
    ecoruteando_auth: JSON.stringify({ email, role: 'user', userId, firstName: 'Daniel', isAuthenticated: true }),
  });
  let refreshCallsCount = 0;
  const resValid = await restoreOrRefreshSessionLifecycle({
    storage: storageValid,
    refreshCall: async () => {
      refreshCallsCount++;
      return { accessToken: refreshedAccess, refreshToken: 'refresh-2' };
    },
  });
  assert.equal(resValid.authState.isAuthenticated, true);
  assert.equal(resValid.connectionStatus, 'online');
  assert.equal(resValid.authState.userId, userId);
  assert.equal(resValid.authState.firstName, 'Daniel');
  assert.equal(canAccessProtectedRoutes({ authState: resValid.authState, connectionStatus: resValid.connectionStatus }), true);
  assert.equal(refreshCallsCount, 0);

  // 2. Refresh exitoso: Access token expirado con refresh válido -> Guarda la sesión renovada atómicamente
  const storageExpiredWithValidRefresh = createMockSecureStorage({
    accessToken: expiredAccess,
    refreshToken: 'refresh-old',
    userId,
    ecoruteando_auth: JSON.stringify({ email, role: 'user', userId, firstName: 'Daniel', isAuthenticated: true }),
  });
  const resRefreshed = await restoreOrRefreshSessionLifecycle({
    storage: storageExpiredWithValidRefresh,
    refreshCall: async (rt) => {
      assert.equal(rt, 'refresh-old');
      return { accessToken: refreshedAccess, refreshToken: 'refresh-rotated-new' };
    },
  });
  assert.equal(resRefreshed.authState.isAuthenticated, true);
  assert.equal(resRefreshed.connectionStatus, 'online');
  assert.equal(resRefreshed.authState.userId, userId);
  assert.equal(storageExpiredWithValidRefresh.map.get('accessToken'), refreshedAccess);
  assert.equal(storageExpiredWithValidRefresh.map.get('refreshToken'), 'refresh-rotated-new');
  assert.equal(canAccessProtectedRoutes({ authState: resRefreshed.authState, connectionStatus: resRefreshed.connectionStatus }), true);

  // 3. 401 en refresh (contrato RefreshTokenCommandHandler -> UnauthorizedException): Invalida sesión y purga credenciales
  const storageRejected401 = createMockSecureStorage({
    accessToken: expiredAccess,
    refreshToken: 'refresh-revoked',
    userId,
    ecoruteando_auth: JSON.stringify({ email, role: 'user', userId, firstName: null, isAuthenticated: true }),
  });
  const resRejected401 = await restoreOrRefreshSessionLifecycle({
    storage: storageRejected401,
    refreshCall: async () => {
      const err = new Error('Refresh token expirado o revocado.');
      err.response = {
        status: 401,
        data: { status: 401, title: 'Unauthorized', detail: 'Refresh token expirado o revocado.' },
      };
      throw err;
    },
  });
  assert.equal(resRejected401.authState.isAuthenticated, false);
  assert.equal(resRejected401.authState.userId, null);
  assert.equal(storageRejected401.map.size, 0, '401 en refresh debe purgar todas las claves de SecureStore');
  assert.equal(canAccessProtectedRoutes({ authState: resRejected401.authState, connectionStatus: resRejected401.connectionStatus }), false);

  // 4. 400 en refresh: Analizar código y cuerpo de error
  // 4a. 400 con cuerpo que confirma invalidez del refreshToken enviado -> Invalida sesión
  const storage400InvalidToken = createMockSecureStorage({
    accessToken: expiredAccess,
    refreshToken: 'refresh-corrupted-token',
    userId,
    ecoruteando_auth: JSON.stringify({ email, role: 'user', userId, firstName: null, isAuthenticated: true }),
  });
  const res400Confirmed = await restoreOrRefreshSessionLifecycle({
    storage: storage400InvalidToken,
    refreshCall: async () => {
      const err = new Error('Validation Error');
      err.response = {
        status: 400,
        data: {
          status: 400,
          title: 'Validation Error',
          detail: 'Refresh token inválido o revocado.',
        },
      };
      throw err;
    },
  });
  assert.equal(res400Confirmed.authState.isAuthenticated, false);
  assert.equal(storage400InvalidToken.map.size, 0, '400 con error contractual de invalidez de RefreshToken debe invalidar y purgar la sesión');

  // 4b. 400 cuyo cuerpo NO demuestra que el refreshToken sea inválido -> NO elimina automáticamente las credenciales
  const storage400NonDefinitive = createMockSecureStorage({
    accessToken: expiredAccess,
    refreshToken: 'refresh-still-valid-400',
    userId,
    ecoruteando_auth: JSON.stringify({ email, role: 'user', userId, firstName: null, isAuthenticated: true }),
  });
  const res400NonDefinitive = await restoreOrRefreshSessionLifecycle({
    storage: storage400NonDefinitive,
    refreshCall: async () => {
      const err = new Error('Bad Request');
      err.response = {
        status: 400,
        data: {
          status: 400,
          title: 'Bad Request',
          detail: 'Cabecera X-Custom-Trace con formato inválido en el gateway.',
        },
      };
      throw err;
    },
  });
  assert.equal(
    storage400NonDefinitive.map.get('refreshToken'),
    'refresh-still-valid-400',
    '400 sin evidencia de invalidez del refreshToken en el cuerpo NO debe borrar las credenciales'
  );
  assert.equal(res400NonDefinitive.connectionStatus, 'offline-unvalidated');
  assert.equal(res400NonDefinitive.authState.isAuthenticated, false);
  assert.equal(
    canAccessProtectedRoutes({
      authState: res400NonDefinitive.authState,
      connectionStatus: res400NonDefinitive.connectionStatus,
    }),
    false
  );

  // 5. 403 en refresh: NO eliminar automáticamente la sesión (403 no demuestra invalidez del refreshToken)
  const storage403 = createMockSecureStorage({
    accessToken: expiredAccess,
    refreshToken: 'refresh-preserved-on-403',
    userId,
    ecoruteando_auth: JSON.stringify({ email, role: 'user', userId, firstName: 'Daniel', isAuthenticated: true }),
  });
  const err403 = new Error('Forbidden');
  err403.response = {
    status: 403,
    data: { error: 'Operación o política no autorizada.' },
  };
  const class403 = classifyRefreshError(err403);
  assert.equal(class403.category, 'forbidden_403_preserve');
  assert.equal(class403.shouldPurgeSession, false, 'Un HTTP 403 nunca debe marcarse para eliminar automáticamente la sesión');

  const res403 = await restoreOrRefreshSessionLifecycle({
    storage: storage403,
    refreshCall: async () => {
      throw err403;
    },
  });
  assert.equal(
    storage403.map.get('refreshToken'),
    'refresh-preserved-on-403',
    'HTTP 403 NO debe eliminar el refreshToken de SecureStore'
  );
  assert.equal(storage403.map.get('userId'), userId, 'HTTP 403 NO debe eliminar userId de SecureStore');
  assert.equal(res403.connectionStatus, 'offline-unvalidated');
  assert.equal(res403.authState.isAuthenticated, false, 'No debe autenticar una sesión cuyo accessToken expiró y no pudo renovarse');
  assert.equal(canAccessProtectedRoutes({ authState: res403.authState, connectionStatus: res403.connectionStatus }), false);

  // 6. Timeout o error de red durante refresh: Preservar credenciales y bloquear pantallas protegidas con offline-unvalidated
  const storageOffline = createMockSecureStorage({
    accessToken: expiredAccess,
    refreshToken: 'refresh-valid-offline',
    userId,
    ecoruteando_auth: JSON.stringify({ email, role: 'user', userId, firstName: 'Daniel', isAuthenticated: true }),
  });
  const resOffline = await restoreOrRefreshSessionLifecycle({
    storage: storageOffline,
    refreshCall: async () => {
      const err = new Error('timeout of 10000ms exceeded');
      err.code = 'ECONNABORTED';
      throw err;
    },
  });
  assert.equal(resOffline.connectionStatus, 'offline-unvalidated');
  assert.equal(
    storageOffline.map.get('refreshToken'),
    'refresh-valid-offline',
    'Timeout o error de red debe preservar intactas las credenciales en SecureStore'
  );
  assert.equal(
    resOffline.authState.isAuthenticated,
    false,
    'offline-unvalidated NO debe marcar isAuthenticated: true antes de validar la sesión'
  );
  assert.equal(
    canAccessProtectedRoutes({
      authState: resOffline.authState,
      connectionStatus: resOffline.connectionStatus,
    }),
    false,
    'offline-unvalidated no debe permitir acceder a pantallas protegidas'
  );
  // Incluso si un objeto authState tuviese campos poblados, connectionStatus === 'offline-unvalidated' bloquea el acceso
  assert.equal(
    canAccessProtectedRoutes({
      authState: { email, role: 'user', userId, firstName: 'Daniel', isAuthenticated: true },
      connectionStatus: 'offline-unvalidated',
    }),
    false,
    'canAccessProtectedRoutes debe rechazar siempre cualquier acceso cuando connectionStatus es offline-unvalidated'
  );

  // 7. Dos solicitudes concurrentes que requieren refresh -> Ejecuta exactamente 1 solicitud de refresh (single-flight)
  let concurrentRefreshCalls = 0;
  const slowRefreshTask = async (rt) => {
    concurrentRefreshCalls++;
    await new Promise((r) => setTimeout(r, 25));
    return { accessToken: refreshedAccess, refreshToken: `rotated-${rt}` };
  };

  const [r1, r2, r3] = await Promise.all([
    executeSingleFlightRefresh('rt-1', slowRefreshTask),
    executeSingleFlightRefresh('rt-1', slowRefreshTask),
    executeSingleFlightRefresh('rt-1', slowRefreshTask),
  ]);
  assert.equal(concurrentRefreshCalls, 1, 'Debe compartir la misma promesa de refresh para llamadas concurrentes');
  assert.deepEqual(r1, r2);
  assert.deepEqual(r2, r3);
});

test('H-16 apiClient.ts y _layout.tsx: Preservan Authorization explícito, usan classifyRefreshError (sin purgar en 403) y bloquean offline-unvalidated en rutas protegidas', () => {
  const apiClientPath = path.join(projectRoot, 'src/shared/services/apiClient.ts');
  const content = fs.readFileSync(apiClientPath, 'utf8');

  // Debe respetar Authorization explícito cuando ya viene en la petición (ej. Bearer <twoFactorToken>)
  assert.match(content, /existingAuth/);

  // Debe excluir /api/auth/2fa/verify de los endpoints que disparan refresh automático en un 401
  assert.match(content, /\/api\/auth\/2fa\/verify/);

  // Debe impedir que un token temporal two_factor_temp se adjunte como accessToken o se use como refreshToken
  assert.match(content, /isTemporaryTwoFactorToken/);

  // Debe usar classifyRefreshError y NO purgar sesión ante un 403
  assert.match(content, /classifyRefreshError/);
  assert.doesNotMatch(content, /refreshError\.response\?\.status\s*===\s*403/);

  // El guard de rutas protegidas en app/(tabs)/_layout.tsx debe bloquear explícitamente offline-unvalidated
  const tabsLayoutPath = path.join(projectRoot, 'app/(tabs)/_layout.tsx');
  const tabsLayoutContent = fs.readFileSync(tabsLayoutPath, 'utf8');
  assert.match(tabsLayoutContent, /connectionStatus\s*===\s*['"]offline-unvalidated['"]/);
});

test('H-16 2FA: Tolera tanto data.token como data.accessToken del backend cuando el JWT es válido', async () => {
  const jwtModule = await jwtHydrationPromise;
  const harness = createAuthSessionHarness(jwtModule);
  const validJwt = createBackendAccessToken({
    userId: 'u1-uuid-valid',
    email: 'user@test.com',
    role: 'citizen',
  });
  const validTemp = createBackendTwoFactorTempToken({
    userId: 'u1-uuid-valid',
    email: 'user@test.com',
  });

  const mockApiClient = {
    post: async () => ({
      data: {
        token: validJwt,
        refreshToken: 'refresh.jwt',
      },
    }),
  };

  const result = await executeVerification({
    mode: '2fa',
    code: '123456',
    tempToken: validTemp,
    email: 'user@test.com',
    apiClient: mockApiClient,
    signIn: harness.signIn,
    decodeJwtPayload: jwtModule.decodeJwtPayload,
    isTokenExpired: jwtModule.isTokenExpired,
  });

  assert.equal(result.redirect, '/(tabs)');
  assert.equal(harness.storage.get('accessToken'), validJwt);
  assert.equal(harness.getAuthState().userId, 'u1-uuid-valid');
  assert.equal(harness.getAuthState().role, 'user');
});

test('H-16 Email Verification y Reenvío: Envía código a /api/auth/verify-email y maneja reenvío según modo', async () => {
  let capturedUrl = '';
  let capturedBody = null;

  const mockApiClient = {
    post: async (url, body) => {
      capturedUrl = url;
      capturedBody = body;
      return {
        data: {
          message: 'Correo electrónico verificado correctamente.',
        },
      };
    },
  };

  const result = await executeVerification({
    mode: 'email-verification',
    code: ['1', '2', '3', '4', '5', '6'],
    tempToken: null,
    email: 'newuser@ecoruteando.com',
    apiClient: mockApiClient,
    signIn: async () => {},
  });

  assert.equal(capturedUrl, '/api/auth/verify-email');
  assert.deepEqual(capturedBody, { code: '123456' });
  assert.equal(result.redirect, '/(auth)/login');
  assert.equal(result.message, 'Correo electrónico verificado correctamente.');

  await assert.rejects(
    async () => {
      await executeResend({
        mode: '2fa',
        email: 'user@test.com',
        apiClient: {},
      });
    },
    { message: 'Los códigos 2FA se generan automáticamente en tu aplicación autenticadora cada 30 segundos.' }
  );

  let resendUrl = '';
  let resendPayload = null;
  const res = await executeResend({
    mode: 'email-verification',
    email: 'test@example.com',
    apiClient: {
      post: async (url, payload) => {
        resendUrl = url;
        resendPayload = payload;
        return { data: { success: true } };
      },
    },
  });

  assert.equal(resendUrl, '/api/auth/send-verification');
  assert.deepEqual(resendPayload, { email: 'test@example.com' });
  assert.equal(res.success, true);
});

// ============================================================================
// PRUEBAS OBLIGATORIAS AUDITORÍA FINAL H-16 (CLASIFICACIÓN DE REFRESH TOKEN)
// ============================================================================

test('H-16 [1/8] HTTP 400 por usuario sin rol ("El usuario no tiene un rol asignado."): preserva credenciales en SecureStore y bloquea acceso protegido', async () => {
  const jwtModule = await jwtHydrationPromise;
  const { restoreOrRefreshSessionLifecycle, classifyRefreshError, canAccessProtectedRoutes } = jwtModule;

  const userId = '11112222-3333-4444-5555-666677778888';
  const email = 'sinrol@ecoruteando.com';
  const expiredAccess = createBackendAccessToken({ userId, email, role: 'user', expiresInSeconds: -300 });

  // Contrato real: RefreshTokenCommandHandler.cs línea 71 + ExceptionMiddleware.cs línea 107
  const missingRoleError = new Error('Bad Request');
  missingRoleError.response = {
    status: 400,
    data: {
      status: 400,
      title: 'Bad Request',
      detail: 'El usuario no tiene un rol asignado.',
    },
  };

  const classification = classifyRefreshError(missingRoleError, {
    sentRefreshToken: 'valid-refresh-token-in-db',
  });
  assert.equal(classification.category, 'user_missing_role_400_preserve');
  assert.equal(
    classification.shouldPurgeSession,
    false,
    'La falta de rol (HTTP 400) NO debe clasificarse como token inválido ni eliminar las credenciales'
  );

  const storage = createMockSecureStorage({
    accessToken: expiredAccess,
    refreshToken: 'valid-refresh-token-in-db',
    userId,
    ecoruteando_auth: JSON.stringify({ email, role: 'user', userId, firstName: 'Ana', isAuthenticated: true }),
  });

  const result = await restoreOrRefreshSessionLifecycle({
    storage,
    refreshCall: async () => {
      throw missingRoleError;
    },
  });

  assert.equal(
    storage.map.get('refreshToken'),
    'valid-refresh-token-in-db',
    'Debe preservar el refreshToken en SecureStore cuando el backend devuelve 400 por usuario sin rol'
  );
  assert.equal(storage.map.get('userId'), userId, 'Debe preservar userId en SecureStore');
  assert.equal(result.connectionStatus, 'offline-unvalidated');
  assert.equal(result.authState.isAuthenticated, false, 'Debe mantener isAuthenticated en false');
  assert.equal(
    canAccessProtectedRoutes({
      authState: result.authState,
      connectionStatus: result.connectionStatus,
    }),
    false,
    'Debe mantener bloqueado el acceso a pantallas protegidas'
  );
});

test('H-16 [2/8] HTTP 400 por refresh token inválido vs petición mal construida: aplica únicamente la política contractual comprobada', async () => {
  const jwtModule = await jwtHydrationPromise;
  const { restoreOrRefreshSessionLifecycle, classifyRefreshError } = jwtModule;

  const userId = '22223333-4444-5555-6666-777788889999';
  const email = 'politica400@ecoruteando.com';
  const expiredAccess = createBackendAccessToken({ userId, email, role: 'user', expiresInSeconds: -300 });

  // Caso A: Petición mal construida / token ausente en la solicitud (RefreshTokenCommandValidator: "El refresh token es obligatorio.")
  // NO debe borrar credenciales válidas en SecureStore
  const validatorEmptyTokenError = new Error('Validation Error');
  validatorEmptyTokenError.response = {
    status: 400,
    data: {
      status: 400,
      title: 'Validation Error',
      detail: 'Se encontraron uno o más errores de validación.',
      errors: {
        RefreshToken: ['El refresh token es obligatorio.'],
      },
    },
  };

  const classMalformed = classifyRefreshError(validatorEmptyTokenError, {
    sentRefreshToken: 'valid-stored-refresh-token',
  });
  assert.equal(classMalformed.category, 'missing_token_in_request_preserve');
  assert.equal(
    classMalformed.shouldPurgeSession,
    false,
    'Un 400 por petición mal construida ("El refresh token es obligatorio.") NO debe eliminar credenciales válidas de SecureStore'
  );

  const storageMalformed = createMockSecureStorage({
    accessToken: expiredAccess,
    refreshToken: 'valid-stored-refresh-token',
    userId,
    ecoruteando_auth: JSON.stringify({ email, role: 'user', userId, firstName: 'Luis', isAuthenticated: true }),
  });

  const resMalformed = await restoreOrRefreshSessionLifecycle({
    storage: storageMalformed,
    refreshCall: async () => {
      throw validatorEmptyTokenError;
    },
  });
  assert.equal(storageMalformed.map.get('refreshToken'), 'valid-stored-refresh-token');
  assert.equal(resMalformed.authState.isAuthenticated, false);
  assert.equal(resMalformed.connectionStatus, 'offline-unvalidated');

  // Caso B: HTTP 400 donde se envió el refresh token y el cuerpo confirma explícitamente su invalidez/expiración/revocación
  const invalidToken400Error = new Error('Bad Request');
  invalidToken400Error.response = {
    status: 400,
    data: {
      status: 400,
      title: 'Bad Request',
      detail: 'Refresh token inválido.',
    },
  };

  const classInvalid400 = classifyRefreshError(invalidToken400Error, {
    sentRefreshToken: 'bad-refresh-token',
  });
  assert.equal(classInvalid400.category, 'definitive_bad_request_400');
  assert.equal(classInvalid400.shouldPurgeSession, true);

  const storageInvalid400 = createMockSecureStorage({
    accessToken: expiredAccess,
    refreshToken: 'bad-refresh-token',
    userId,
    ecoruteando_auth: JSON.stringify({ email, role: 'user', userId, firstName: 'Luis', isAuthenticated: true }),
  });

  const resInvalid400 = await restoreOrRefreshSessionLifecycle({
    storage: storageInvalid400,
    refreshCall: async () => {
      throw invalidToken400Error;
    },
  });
  assert.equal(resInvalid400.authState.isAuthenticated, false);
  assert.equal(storageInvalid400.map.size, 0, '400 con rechazo confirmado del refresh token enviado debe purgar la sesión');
});

test('H-16 [3/8] HTTP 401 por refresh token enviado y rechazado vs ausencia accidental del token en la solicitud', async () => {
  const jwtModule = await jwtHydrationPromise;
  const { restoreOrRefreshSessionLifecycle, classifyRefreshError } = jwtModule;

  const userId = '33334444-5555-6666-7777-888899990000';
  const email = 'rechazo401@ecoruteando.com';
  const expiredAccess = createBackendAccessToken({ userId, email, role: 'user', expiresInSeconds: -300 });

  // Caso A: Refresh token enviado y rechazado por RefreshTokenCommandHandler.cs (líneas 46, 51, 64)
  for (const detailMsg of [
    'Refresh token inválido.',
    'Refresh token expirado o revocado.',
    'La sesión ha sido revocada.',
  ]) {
    const storageRejected = createMockSecureStorage({
      accessToken: expiredAccess,
      refreshToken: 'sent-and-rejected-token',
      userId,
      ecoruteando_auth: JSON.stringify({ email, role: 'user', userId, firstName: 'Carlos', isAuthenticated: true }),
    });

    const err401Rejected = new Error(detailMsg);
    err401Rejected.response = {
      status: 401,
      data: {
        status: 401,
        title: 'Unauthorized',
        detail: detailMsg,
      },
    };

    const classRejected = classifyRefreshError(err401Rejected, {
      sentRefreshToken: 'sent-and-rejected-token',
    });
    assert.equal(classRejected.category, 'definitive_unauthorized_401');
    assert.equal(classRejected.shouldPurgeSession, true);

    const resRejected = await restoreOrRefreshSessionLifecycle({
      storage: storageRejected,
      refreshCall: async () => {
        throw err401Rejected;
      },
    });
    assert.equal(resRejected.authState.isAuthenticated, false);
    assert.equal(
      storageRejected.map.size,
      0,
      `401 con "${detailMsg}" para un token enviado debe invalidar y purgar la sesión`
    );
  }

  // Caso B: 401 por ausencia accidental del token en la solicitud (AuthController.cs línea 122: "Refresh token no proporcionado o cookie ausente.")
  const err401MissingInRequest = new Error('Unauthorized');
  err401MissingInRequest.response = {
    status: 401,
    data: {
      message: 'Refresh token no proporcionado o cookie ausente.',
    },
  };

  const classMissingInReq = classifyRefreshError(err401MissingInRequest, {
    sentRefreshToken: 'valid-token-in-storage',
  });
  assert.equal(classMissingInReq.category, 'missing_token_in_request_preserve');
  assert.equal(
    classMissingInReq.shouldPurgeSession,
    false,
    '401 por ausencia accidental del token en la petición NO debe eliminar credenciales válidas en SecureStore'
  );

  // También si sentRefreshToken fue vacío/null al construir la petición
  const classEmptySent = classifyRefreshError(
    { response: { status: 401, data: { detail: 'Unauthorized' } } },
    { sentRefreshToken: '' }
  );
  assert.equal(classEmptySent.category, 'missing_token_in_request_preserve');
  assert.equal(classEmptySent.shouldPurgeSession, false);
});

test('H-16 [4/8] Refresh token ausente en SecureStore: no provoca una eliminación indiscriminada ni llamadas vacías al backend', async () => {
  const jwtModule = await jwtHydrationPromise;
  const { restoreOrRefreshSessionLifecycle, classifyRefreshError } = jwtModule;

  const userId = '44445555-6666-7777-8888-999900001111';
  const email = 'sinrefresh@ecoruteando.com';
  const expiredAccess = createBackendAccessToken({ userId, email, role: 'user', expiresInSeconds: -300 });

  // Almacenamiento sin refreshToken pero con otras claves persistidas
  const storageWithoutRefresh = createMockSecureStorage({
    accessToken: expiredAccess,
    userId,
    ecoruteando_auth: JSON.stringify({ email, role: 'user', userId, firstName: 'Elena', isAuthenticated: true }),
    profileAvatarUri: 'file:///avatar.png',
  });

  let refreshEndpointCalled = false;
  const res = await restoreOrRefreshSessionLifecycle({
    storage: storageWithoutRefresh,
    refreshCall: async () => {
      refreshEndpointCalled = true;
      throw new Error('No debería invocarse refreshCall cuando no hay refreshToken en SecureStore');
    },
  });

  assert.equal(refreshEndpointCalled, false, 'No debe enviar petición de refresh si no existe refreshToken en SecureStore');
  assert.equal(res.authState.isAuthenticated, false, 'No debe autenticar la sesión si el accessToken expiró y no hay refreshToken');
  assert.equal(
    storageWithoutRefresh.map.get('userId'),
    userId,
    'La ausencia de refreshToken en SecureStore NO debe provocar una eliminación indiscriminada del almacenamiento'
  );
  assert.equal(
    storageWithoutRefresh.map.get('profileAvatarUri'),
    'file:///avatar.png',
    'No debe borrar claves existentes por ausencia de refreshToken'
  );

  // Verificar también classifyRefreshError cuando apiClient detecta MISSING_REFRESH_TOKEN_IN_STORAGE
  const missingStorageErr = new Error('No has iniciado sesión o tu sesión ha expirado.');
  missingStorageErr.code = 'MISSING_REFRESH_TOKEN_IN_STORAGE';
  const classification = classifyRefreshError(missingStorageErr, { sentRefreshToken: null });
  assert.equal(classification.category, 'missing_token_in_storage_preserve');
  assert.equal(classification.shouldPurgeSession, false);
});

test('H-16 [5/8] HTTP 403 en refresh: preserva credenciales y mantiene bloqueadas las pantallas protegidas', async () => {
  const jwtModule = await jwtHydrationPromise;
  const { restoreOrRefreshSessionLifecycle, classifyRefreshError, canAccessProtectedRoutes } = jwtModule;

  const userId = '55556666-7777-8888-9999-000011112222';
  const email = 'forbidden403@ecoruteando.com';
  const expiredAccess = createBackendAccessToken({ userId, email, role: 'user', expiresInSeconds: -300 });

  const storage = createMockSecureStorage({
    accessToken: expiredAccess,
    refreshToken: 'refresh-token-403-intact',
    userId,
    ecoruteando_auth: JSON.stringify({ email, role: 'user', userId, firstName: 'Pedro', isAuthenticated: true }),
  });

  const err403 = new Error('Forbidden');
  err403.response = {
    status: 403,
    data: { status: 403, title: 'Forbidden', detail: 'Acceso denegado por política de WAF o permisos.' },
  };

  const classification = classifyRefreshError(err403, { sentRefreshToken: 'refresh-token-403-intact' });
  assert.equal(classification.category, 'forbidden_403_preserve');
  assert.equal(classification.shouldPurgeSession, false);

  const res = await restoreOrRefreshSessionLifecycle({
    storage,
    refreshCall: async () => {
      throw err403;
    },
  });

  assert.equal(storage.map.get('refreshToken'), 'refresh-token-403-intact');
  assert.equal(storage.map.get('userId'), userId);
  assert.equal(res.connectionStatus, 'offline-unvalidated');
  assert.equal(res.authState.isAuthenticated, false);
  assert.equal(
    canAccessProtectedRoutes({ authState: res.authState, connectionStatus: res.connectionStatus }),
    false
  );
});

test('H-16 [6/8] Timeout, error de red, 429 y 5xx: preservan credenciales en SecureStore', async () => {
  const jwtModule = await jwtHydrationPromise;
  const { restoreOrRefreshSessionLifecycle, classifyRefreshError, canAccessProtectedRoutes } = jwtModule;

  const userId = '66667777-8888-9999-0000-111122223333';
  const email = 'transitorios@ecoruteando.com';
  const expiredAccess = createBackendAccessToken({ userId, email, role: 'user', expiresInSeconds: -300 });

  const transientErrors = [
    Object.assign(new Error('timeout of 10000ms exceeded'), { code: 'ECONNABORTED' }),
    Object.assign(new Error('Network Error'), { code: 'ERR_NETWORK' }),
    Object.assign(new Error('Too Many Requests'), {
      response: { status: 429, data: { detail: 'Rate limit exceeded' } },
    }),
    Object.assign(new Error('Internal Server Error'), {
      response: { status: 500, data: { detail: 'Database timeout' } },
    }),
    Object.assign(new Error('Bad Gateway'), {
      response: { status: 502, data: { detail: 'Render proxy error' } },
    }),
    Object.assign(new Error('Service Unavailable'), {
      response: { status: 503, data: { detail: 'Service waking up' } },
    }),
  ];

  for (const transientErr of transientErrors) {
    const classification = classifyRefreshError(transientErr, {
      sentRefreshToken: 'refresh-token-transient-safe',
    });
    assert.equal(classification.category, 'transient_network_or_server');
    assert.equal(
      classification.shouldPurgeSession,
      false,
      `Error transitorio (${transientErr.message}) debe preservar las credenciales`
    );

    const storage = createMockSecureStorage({
      accessToken: expiredAccess,
      refreshToken: 'refresh-token-transient-safe',
      userId,
      ecoruteando_auth: JSON.stringify({ email, role: 'user', userId, firstName: 'Sofía', isAuthenticated: true }),
    });

    const res = await restoreOrRefreshSessionLifecycle({
      storage,
      refreshCall: async () => {
        throw transientErr;
      },
    });

    assert.equal(storage.map.get('refreshToken'), 'refresh-token-transient-safe');
    assert.equal(storage.map.get('userId'), userId);
    assert.equal(res.connectionStatus, 'offline-unvalidated');
    assert.equal(res.authState.isAuthenticated, false);
    assert.equal(
      canAccessProtectedRoutes({ authState: res.authState, connectionStatus: res.connectionStatus }),
      false
    );
  }
});

test('H-16 [7/8] Recuperación desde offline-unvalidated: conserva credenciales y al volver la conexión renueva y habilita la sesión', async () => {
  const jwtModule = await jwtHydrationPromise;
  const { restoreOrRefreshSessionLifecycle, canAccessProtectedRoutes } = jwtModule;

  const userId = '77778888-9999-0000-1111-222233334444';
  const email = 'recuperacion@ecoruteando.com';
  const expiredAccess = createBackendAccessToken({ userId, email, role: 'user', expiresInSeconds: -300 });
  const freshAccess = createBackendAccessToken({ userId, email, role: 'user', expiresInSeconds: 3600 });

  const storage = createMockSecureStorage({
    accessToken: expiredAccess,
    refreshToken: 'refresh-token-before-reconnect',
    userId,
    ecoruteando_auth: JSON.stringify({ email, role: 'user', userId, firstName: 'Mateo', isAuthenticated: true }),
  });

  // Paso 1: Falla la red -> entra en offline-unvalidated conservando las credenciales
  const offlineResult = await restoreOrRefreshSessionLifecycle({
    storage,
    refreshCall: async () => {
      const netErr = new Error('Network Error');
      netErr.code = 'ERR_NETWORK';
      throw netErr;
    },
  });

  assert.equal(offlineResult.connectionStatus, 'offline-unvalidated');
  assert.equal(offlineResult.authState.isAuthenticated, false);
  assert.equal(
    canAccessProtectedRoutes({
      authState: offlineResult.authState,
      connectionStatus: offlineResult.connectionStatus,
    }),
    false,
    'Mientras está en offline-unvalidated las rutas protegidas están bloqueadas'
  );
  assert.equal(storage.map.get('refreshToken'), 'refresh-token-before-reconnect');

  // Paso 2: Vuelve la conexión y se reintenta la validación (retrySessionValidation / restoreOrRefreshSessionLifecycle)
  let usedRefreshToken = null;
  const recoveredResult = await restoreOrRefreshSessionLifecycle({
    storage,
    refreshCall: async (rt) => {
      usedRefreshToken = rt;
      return {
        accessToken: freshAccess,
        refreshToken: 'refresh-token-after-reconnect',
      };
    },
  });

  assert.equal(usedRefreshToken, 'refresh-token-before-reconnect');
  assert.equal(recoveredResult.connectionStatus, 'online');
  assert.equal(recoveredResult.connectionMessage, null);
  assert.equal(recoveredResult.authState.isAuthenticated, true);
  assert.equal(recoveredResult.authState.userId, userId);
  assert.equal(recoveredResult.authState.email, email);
  assert.equal(recoveredResult.authState.firstName, 'Mateo');
  assert.equal(storage.map.get('accessToken'), freshAccess);
  assert.equal(storage.map.get('refreshToken'), 'refresh-token-after-reconnect');
  assert.equal(
    canAccessProtectedRoutes({
      authState: recoveredResult.authState,
      connectionStatus: recoveredResult.connectionStatus,
    }),
    true,
    'Tras validar y renovar exitosamente la sesión, se habilita el acceso a rutas protegidas'
  );
});

test('H-16 [8/8] Ningún acceso protegido antes de validar la sesión (isLoading, offline-unvalidated o claims incompletos)', async () => {
  const jwtModule = await jwtHydrationPromise;
  const { canAccessProtectedRoutes } = jwtModule;

  const completeAuthState = {
    email: 'seguro@ecoruteando.com',
    role: 'user',
    userId: '88889999-0000-1111-2222-333344445555',
    firstName: 'Lucía',
    isAuthenticated: true,
  };

  // 1. Mientras isLoading es true (hidratación/validación en curso), ningún acceso protegido está permitido
  assert.equal(
    canAccessProtectedRoutes({
      authState: completeAuthState,
      connectionStatus: 'online',
      isLoading: true,
    }),
    false,
    'No debe permitir acceso a rutas protegidas mientras isLoading === true'
  );

  // 2. Mientras connectionStatus es offline-unvalidated, ningún acceso protegido está permitido
  assert.equal(
    canAccessProtectedRoutes({
      authState: completeAuthState,
      connectionStatus: 'offline-unvalidated',
      isLoading: false,
    }),
    false,
    'No debe permitir acceso a rutas protegidas cuando connectionStatus === "offline-unvalidated"'
  );

  // 3. Si falta userId, email, role o isAuthenticated === false, ningún acceso protegido está permitido
  assert.equal(
    canAccessProtectedRoutes({
      authState: { ...completeAuthState, isAuthenticated: false },
      connectionStatus: 'online',
      isLoading: false,
    }),
    false
  );
  assert.equal(
    canAccessProtectedRoutes({
      authState: { ...completeAuthState, userId: null },
      connectionStatus: 'online',
      isLoading: false,
    }),
    false
  );
  assert.equal(
    canAccessProtectedRoutes({
      authState: { ...completeAuthState, role: null },
      connectionStatus: 'online',
      isLoading: false,
    }),
    false
  );

  // 4. Solo cuando la sesión fue validada (isLoading: false, connectionStatus !== 'offline-unvalidated', claims completos) se permite el acceso
  assert.equal(
    canAccessProtectedRoutes({
      authState: completeAuthState,
      connectionStatus: 'online',
      isLoading: false,
    }),
    true
  );
});
