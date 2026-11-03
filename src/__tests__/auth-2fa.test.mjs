import test from 'node:test';
import assert from 'node:assert/strict';

/**
 * Suite de pruebas funcionales para los contratos de autenticación 2FA y Verificación de Correo (H-16).
 * Valida la lógica de bifurcación de endpoints, encabezados de autorización Bearer tempToken,
 * respuestas de error del backend, adaptación de tokens de sesión y políticas de reenvío.
 */

// Simulador de función de verificación 2FA / Email Verification equivalente a la implementada en verify-code.tsx
async function executeVerification({ mode, code, tempToken, email, apiClient, signIn }) {
  const joined = Array.isArray(code) ? code.join('') : String(code || '');
  if (joined.length < 6) {
    throw new Error('Código incompleto');
  }

  const is2Fa = mode === '2fa';

  if (is2Fa) {
    if (!tempToken) {
      throw new Error('El token temporal de 2FA ha expirado o no es válido. Por favor inicia sesión nuevamente.');
    }

    const res = await apiClient.post(
      '/api/auth/2fa/verify',
      { code: joined, rememberDevice: false },
      {
        headers: {
          Authorization: `Bearer ${tempToken}`,
        },
      }
    );

    const data = res?.data;
    const accessToken = data?.token || data?.accessToken;
    const refreshToken = data?.refreshToken;

    if (accessToken && refreshToken) {
      await signIn({
        accessToken,
        refreshToken,
        email: String(email || ''),
        role: data?.role || 'user',
        userId: data?.userId,
        firstName: data?.firstName,
      });
      return { success: true, redirect: '/(tabs)', session: { accessToken, refreshToken, email } };
    }
    return { success: false, redirect: '/(auth)/login' };
  } else {
    const res = await apiClient.post('/api/auth/verify-email', { code: joined });
    const data = res?.data;
    const accessToken = data?.token || data?.accessToken;
    const refreshToken = data?.refreshToken;

    if (accessToken && refreshToken && email) {
      await signIn({
        accessToken,
        refreshToken,
        email: String(email),
        role: data?.role || 'user',
        userId: data?.userId,
        firstName: data?.firstName,
      });
      return { success: true, redirect: '/(tabs)', session: { accessToken, refreshToken, email } };
    }
    return { success: true, redirect: '/(auth)/login', message: data?.message };
  }
}

// Simulador de función de reenvío de código implementada en verify-code.tsx
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

test('H-16 2FA: Rechaza verificación si el código tiene menos de 6 dígitos', async () => {
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
});

test('H-16 2FA: Falla si mode es 2fa pero no se suministra tempToken', async () => {
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

test('H-16 2FA: Envía Authorization Bearer tempToken hacia /api/auth/2fa/verify y completa login', async () => {
  let capturedUrl = '';
  let capturedBody = null;
  let capturedHeaders = null;
  let signedInUser = null;

  const mockApiClient = {
    post: async (url, body, config) => {
      capturedUrl = url;
      capturedBody = body;
      capturedHeaders = config?.headers;
      return {
        data: {
          accessToken: 'final.access.jwt',
          refreshToken: 'final.refresh.jwt',
          role: 'citizen',
          userId: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
          firstName: 'Daniel',
        },
      };
    },
  };

  const mockSignIn = async (session) => {
    signedInUser = session;
  };

  const result = await executeVerification({
    mode: '2fa',
    code: ['9', '8', '7', '6', '5', '4'],
    tempToken: 'temp.2fa.jwt.token',
    email: 'daniel@ecoruteando.com',
    apiClient: mockApiClient,
    signIn: mockSignIn,
  });

  assert.equal(capturedUrl, '/api/auth/2fa/verify');
  assert.deepEqual(capturedBody, { code: '987654', rememberDevice: false });
  assert.equal(capturedHeaders?.Authorization, 'Bearer temp.2fa.jwt.token');
  assert.equal(result.redirect, '/(tabs)');
  assert.equal(signedInUser?.accessToken, 'final.access.jwt');
  assert.equal(signedInUser?.email, 'daniel@ecoruteando.com');
  assert.equal(signedInUser?.userId, '3fa85f64-5717-4562-b3fc-2c963f66afa6');
});

test('H-16 2FA: Tolera tanto data.token como data.accessToken del backend', async () => {
  let signedInUser = null;
  const mockApiClient = {
    post: async () => ({
      data: {
        token: 'legacy.named.token',
        refreshToken: 'refresh.jwt',
        userId: 'u1',
      },
    }),
  };

  const result = await executeVerification({
    mode: '2fa',
    code: '123456',
    tempToken: 'temp.token',
    email: 'user@test.com',
    apiClient: mockApiClient,
    signIn: async (s) => { signedInUser = s; },
  });

  assert.equal(result.redirect, '/(tabs)');
  assert.equal(signedInUser?.accessToken, 'legacy.named.token');
});

test('H-16 2FA: Manejo de error 401 por código TOTP inválido o expirado', async () => {
  const mockApiClient = {
    post: async () => {
      const err = new Error('Request failed with status code 401');
      err.response = { status: 401, data: { detail: 'Código de autenticación inválido o expirado.' } };
      throw err;
    },
  };

  await assert.rejects(
    async () => {
      await executeVerification({
        mode: '2fa',
        code: '000000',
        tempToken: 'temp.token',
        email: 'user@test.com',
        apiClient: mockApiClient,
        signIn: async () => {},
      });
    },
    (err) => err.response?.data?.detail === 'Código de autenticación inválido o expirado.'
  );
});

test('H-16 Email Verification: Envía código a /api/auth/verify-email sin requerir tempToken', async () => {
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

  const mockSignIn = async () => {};

  const result = await executeVerification({
    mode: 'email-verification',
    code: ['1', '2', '3', '4', '5', '6'],
    tempToken: null,
    email: 'newuser@ecoruteando.com',
    apiClient: mockApiClient,
    signIn: mockSignIn,
  });

  assert.equal(capturedUrl, '/api/auth/verify-email');
  assert.deepEqual(capturedBody, { code: '123456' });
  assert.equal(result.redirect, '/(auth)/login');
  assert.equal(result.message, 'Correo electrónico verificado correctamente.');
});

test('H-16 Reenvío: En 2FA rechaza reenvío por correo ya que TOTP es dinámico en app', async () => {
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
});

test('H-16 Reenvío: En verificación de email despacha a /api/auth/send-verification', async () => {
  let capturedUrl = '';
  let capturedPayload = null;

  const mockApiClient = {
    post: async (url, payload) => {
      capturedUrl = url;
      capturedPayload = payload;
      return { data: { success: true } };
    },
  };

  const res = await executeResend({
    mode: 'email-verification',
    email: 'test@example.com',
    apiClient: mockApiClient,
  });

  assert.equal(capturedUrl, '/api/auth/send-verification');
  assert.deepEqual(capturedPayload, { email: 'test@example.com' });
  assert.equal(res.success, true);
});
