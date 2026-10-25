import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  validateRecoveryEmail,
  validateRecoveryToken,
  validateNewPassword,
  buildResetPasswordPayload,
  mapRecoveryApiError,
} from '../passwordRecoveryValidation.js';

// ── 1. Solicitud de recuperación de contraseña ──────────────────────

test('validateRecoveryEmail accepts valid emails and normalizes casing/whitespace', () => {
  const result = validateRecoveryEmail('  Carlos.Perez@EcoRuteando.com  ');
  assert.equal(result.isValid, true);
  assert.equal(result.normalizedEmail, 'carlos.perez@ecoruteando.com');
  assert.equal(result.error, null);
});

test('validateRecoveryEmail rejects empty, whitespace, or malformed email', () => {
  const empty = validateRecoveryEmail('');
  assert.equal(empty.isValid, false);
  assert.ok(empty.error);

  const spaces = validateRecoveryEmail('   ');
  assert.equal(spaces.isValid, false);

  const malformed = validateRecoveryEmail('invalid-email-without-at');
  assert.equal(malformed.isValid, false);
  assert.ok(malformed.error);
});

// ── 2. Validación de código / token OTP ──────────────────────────────

test('validateRecoveryToken rejects empty or whitespace token (root cause prevention)', () => {
  const emptyToken = validateRecoveryToken('');
  assert.equal(emptyToken.isValid, false);
  assert.equal(emptyToken.cleanToken, '');
  assert.ok(emptyToken.error.includes('obligatorio'));

  const whitespaceToken = validateRecoveryToken('   ');
  assert.equal(whitespaceToken.isValid, false);
  assert.equal(whitespaceToken.cleanToken, '');
});

test('validateRecoveryToken rejects token with less or more than 6 digits', () => {
  const shortToken = validateRecoveryToken('12345');
  assert.equal(shortToken.isValid, false);
  assert.ok(shortToken.error.includes('6 dígitos'));

  const longToken = validateRecoveryToken('1234567');
  assert.equal(longToken.isValid, false);

  const lettersToken = validateRecoveryToken('12A456');
  assert.equal(lettersToken.isValid, false);
});

test('validateRecoveryToken accepts exactly 6 numeric digits', () => {
  const valid = validateRecoveryToken('654321');
  assert.equal(valid.isValid, true);
  assert.equal(valid.cleanToken, '654321');
  assert.equal(valid.error, null);
});

// ── 3. Validación de nueva contraseña y políticas de seguridad ───────

test('validateNewPassword enforces minimum length of 8 characters', () => {
  const short = validateNewPassword('Ab1!', 'Ab1!');
  assert.equal(short.isValid, false);
  assert.ok(short.error.includes('8'));
});

test('validateNewPassword enforces uppercase letter', () => {
  const noUpper = validateNewPassword('password123!', 'password123!');
  assert.equal(noUpper.isValid, false);
  assert.ok(noUpper.error.includes('mayúscula'));
});

test('validateNewPassword enforces number', () => {
  const noNum = validateNewPassword('PasswordSpecial!', 'PasswordSpecial!');
  assert.equal(noNum.isValid, false);
  assert.ok(noNum.error.includes('número'));
});

test('validateNewPassword enforces special character', () => {
  const noSpec = validateNewPassword('Password123456', 'Password123456');
  assert.equal(noSpec.isValid, false);
  assert.ok(noSpec.error.includes('carácter especial'));
});

test('validateNewPassword detects password confirmation mismatch', () => {
  const mismatch = validateNewPassword('SecurePass123!', 'DifferentPass123!');
  assert.equal(mismatch.isValid, false);
  assert.ok(mismatch.error.includes('coinciden'));
});

test('validateNewPassword passes when all complexity criteria and confirmation match', () => {
  const valid = validateNewPassword('EcoRuteando2026!', 'EcoRuteando2026!');
  assert.equal(valid.isValid, true);
  assert.equal(valid.error, null);
  assert.equal(valid.checks.every(c => c.ok), true);
});

// ── 4. Construcción segura de payload (DTO contract) ─────────────────

test('buildResetPasswordPayload prevents empty token and throws error', () => {
  assert.throws(() => {
    buildResetPasswordPayload('', 'NewPassword123!', 'test@ecoruteando.com');
  }, /obligatorio|inválido/i);

  assert.throws(() => {
    buildResetPasswordPayload('   ', 'NewPassword123!', 'test@ecoruteando.com');
  }, /obligatorio|inválido/i);
});

test('buildResetPasswordPayload prevents empty email and throws error', () => {
  assert.throws(() => {
    buildResetPasswordPayload('123456', 'NewPassword123!', '');
  }, /correo/i);
});

test('buildResetPasswordPayload produces exact DTO matching backend ResetPasswordRequest', () => {
  const payload = buildResetPasswordPayload(' 123456 ', 'SecurePassword123!', ' User@EcoRuteando.com ');
  assert.deepEqual(payload, {
    token: '123456',
    newPassword: 'SecurePassword123!',
    email: 'user@ecoruteando.com',
  });
});

// ── 5. Mapeo de errores de red, backend, expiración y reutilización ──

test('mapRecoveryApiError handles network disconnection / offline', () => {
  const netErr = new Error('Network Error');
  const msg = mapRecoveryApiError(netErr);
  assert.ok(msg.includes('conexión'));

  const timeoutErr = { code: 'ECONNABORTED', message: 'timeout of 15000ms exceeded' };
  const timeoutMsg = mapRecoveryApiError(timeoutErr);
  assert.ok(timeoutMsg.includes('conexión') || timeoutMsg.includes('espera'));
});

test('mapRecoveryApiError handles 429 Too Many Requests with retry-after', () => {
  const err429 = {
    response: {
      status: 429,
      data: { retryAfterSeconds: 45 },
    },
  };
  const msg = mapRecoveryApiError(err429);
  assert.ok(msg.includes('45 segundos'));
});

test('mapRecoveryApiError surfaces backend unauthorized messages (expired, used, invalid token)', () => {
  const errExpired = {
    response: {
      status: 401,
      data: { message: 'El token ha expirado.' },
    },
  };
  assert.equal(mapRecoveryApiError(errExpired), 'El token ha expirado.');

  const errUsed = {
    response: {
      status: 401,
      data: { message: 'El token ya fue utilizado.' },
    },
  };
  assert.equal(mapRecoveryApiError(errUsed), 'El token ya fue utilizado.');

  const errMismatch = {
    response: {
      status: 401,
      data: { message: 'El código no corresponde al correo indicado.' },
    },
  };
  assert.equal(mapRecoveryApiError(errMismatch), 'El código no corresponde al correo indicado.');
});
