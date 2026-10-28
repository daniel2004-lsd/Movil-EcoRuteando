/**
 * Utilitarios de validación y formateo para el flujo de recuperación de contraseña móvil (H-41, H-60)
 * Alineado estrictamente con los contratos de EcoRuteandoBackend:
 * - POST /api/auth/forgot-password (ForgotPasswordRequest: Email)
 * - POST /api/auth/reset-password (ResetPasswordRequest: Token, NewPassword, Email)
 */

export interface PasswordCheckItem {
  key: string;
  label: string;
  ok: boolean;
}

export interface PasswordValidationResult {
  isValid: boolean;
  error: string | null;
  checks: PasswordCheckItem[];
}

export interface TokenValidationResult {
  isValid: boolean;
  error: string | null;
  cleanToken: string;
}

export interface EmailValidationResult {
  isValid: boolean;
  error: string | null;
  normalizedEmail: string;
}

export interface ResetPasswordPayload {
  token: string;
  newPassword: string;
  email: string;
}

/**
 * Valida y normaliza el correo electrónico para recuperación.
 */
export function validateRecoveryEmail(email: string | null | undefined): EmailValidationResult {
  if (!email || !email.trim()) {
    return {
      isValid: false,
      error: 'Ingresa tu correo electrónico.',
      normalizedEmail: '',
    };
  }

  const clean = email.trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(clean)) {
    return {
      isValid: false,
      error: 'Ingresa un correo electrónico válido.',
      normalizedEmail: clean,
    };
  }

  return {
    isValid: true,
    error: null,
    normalizedEmail: clean,
  };
}

/**
 * Valida el código/token OTP de recuperación.
 * Backend requiere código de 6 dígitos no vacío.
 */
export function validateRecoveryToken(token: string | null | undefined): TokenValidationResult {
  const clean = (token || '').trim();

  if (!clean) {
    return {
      isValid: false,
      error: 'El código de verificación es obligatorio.',
      cleanToken: '',
    };
  }

  if (clean.length !== 6 || !/^\d{6}$/.test(clean)) {
    return {
      isValid: false,
      error: 'El código debe contener exactamente 6 dígitos.',
      cleanToken: clean,
    };
  }

  return {
    isValid: true,
    error: null,
    cleanToken: clean,
  };
}

/**
 * Valida la nueva contraseña según las políticas de seguridad del backend (PasswordPolicy):
 * - Mínimo 8 caracteres
 * - Al menos una mayúscula
 * - Al menos un número
 * - Al menos un carácter especial
 * - Coincidencia de confirmación
 */
export function validateNewPassword(
  password: string | null | undefined,
  confirmPassword?: string | null
): PasswordValidationResult {
  const pw = password || '';
  const checks: PasswordCheckItem[] = [
    { key: 'min', label: 'Mínimo 8 caracteres', ok: pw.length >= 8 },
    { key: 'upper', label: 'Al menos una mayúscula', ok: /[A-Z]/.test(pw) },
    { key: 'number', label: 'Al menos un número', ok: /\d/.test(pw) },
    { key: 'special', label: 'Al menos un carácter especial', ok: /[^A-Za-z0-9]/.test(pw) },
  ];

  if (!pw) {
    return {
      isValid: false,
      error: 'La nueva contraseña es obligatoria.',
      checks,
    };
  }

  if (pw.length < 8) {
    return {
      isValid: false,
      error: 'La contraseña debe tener al menos 8 caracteres.',
      checks,
    };
  }

  if (!/[A-Z]/.test(pw)) {
    return {
      isValid: false,
      error: 'La contraseña debe contener al menos una mayúscula.',
      checks,
    };
  }

  if (!/\d/.test(pw)) {
    return {
      isValid: false,
      error: 'La contraseña debe contener al menos un número.',
      checks,
    };
  }

  if (!/[^A-Za-z0-9]/.test(pw)) {
    return {
      isValid: false,
      error: 'La contraseña debe contener al menos un carácter especial.',
      checks,
    };
  }

  if (confirmPassword !== undefined && confirmPassword !== null) {
    if (pw !== confirmPassword) {
      return {
        isValid: false,
        error: 'Las contraseñas no coinciden.',
        checks,
      };
    }
  }

  return {
    isValid: true,
    error: null,
    checks,
  };
}

/**
 * Construye y valida estrictamente el payload para POST /api/auth/reset-password.
 * Lanza un error si el token o el email están ausentes o vacíos para prevenir envíos inválidos.
 */
export function buildResetPasswordPayload(
  token: string | null | undefined,
  newPassword: string,
  email: string | null | undefined
): ResetPasswordPayload {
  const tokenValidation = validateRecoveryToken(token);
  if (!tokenValidation.isValid) {
    throw new Error(tokenValidation.error || 'Código de verificación inválido.');
  }

  const emailValidation = validateRecoveryEmail(email);
  if (!emailValidation.isValid) {
    throw new Error(emailValidation.error || 'Correo electrónico inválido.');
  }

  const passwordValidation = validateNewPassword(newPassword);
  if (!passwordValidation.isValid) {
    throw new Error(passwordValidation.error || 'Contraseña inválida.');
  }

  return {
    token: tokenValidation.cleanToken,
    newPassword,
    email: emailValidation.normalizedEmail,
  };
}

/**
 * Mapea respuestas de error de red o backend a mensajes comprensibles para el usuario.
 */
export function mapRecoveryApiError(error: any, fallbackMessage: string = 'Ocurrió un error en la operación.'): string {
  if (!error) return fallbackMessage;

  // Error de conexión o red
  if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
    return 'Tiempo de espera agotado. Verifica tu conexión a internet.';
  }

  if (error.message === 'Network Error' || !error.response) {
    return 'Error de conexión. Verifica tu conexión a internet.';
  }

  const status = error.response?.status;
  const data = error.response?.data;
  const serverMsg = typeof data === 'string' ? data : data?.message || data?.detail;

  if (status === 429) {
    const retrySec = Number(data?.retryAfterSeconds) || 60;
    return `Demasiadas solicitudes. Por favor espera ${retrySec} segundos antes de intentar nuevamente.`;
  }

  if (status === 400) {
    if (serverMsg) return serverMsg;
    return 'Datos inválidos. Verifica el código e intenta nuevamente.';
  }

  if (status === 401) {
    if (serverMsg) return serverMsg;
    return 'El código ha expirado o no es válido.';
  }

  if (status === 404) {
    if (serverMsg) return serverMsg;
    return 'Usuario no encontrado.';
  }

  return serverMsg || fallbackMessage;
}
