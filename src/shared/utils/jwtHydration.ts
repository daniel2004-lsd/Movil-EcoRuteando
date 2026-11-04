/**
 * Utilidades de decodificación, hidratación atómica y ciclo de vida de sesión JWT
 * para EcoRuteando Móvil (H-16).
 *
 * NOTA ARQUITECTÓNICA DE SEGURIDAD:
 * Decodificar el payload de un JWT en el cliente móvil NO equivale a validar criptográficamente
 * su firma ni su autenticidad. El propósito exclusivo de este módulo es leer los claims emitidos
 * por el backend (sub/NameIdentifier, email/Email, role/Role, token_type, exp) para hidratar el
 * estado de sesión local cuando el endpoint (POST /api/auth/2fa/verify, POST /api/auth/login o
 * POST /api/auth/refresh) retorna únicamente { accessToken, refreshToken } sin duplicar userId
 * o role en el cuerpo JSON. La validación criptográfica (HMAC-SHA256) y el control de autorización
 * ([Authorize], permisos) corresponden exclusivamente al backend.
 *
 * LIMITACIÓN DOCUMENTADA DEL CONTRATO BACKEND:
 * JwtProvider.GenerateToken(userId, email, role, sessionId) incluye los claims 'sub',
 * ClaimTypes.NameIdentifier, ClaimTypes.Email, ClaimTypes.Role y 'token_type' = 'access',
 * pero NO incluye 'firstName'. Si 'firstName' no viene explícito en la respuesta ni en el token,
 * se conserva como null sin inventar valores ficticios.
 */

export type HydratedRole = 'user' | 'admin';

export interface DecodedJwtClaims {
  sub?: string;
  nameid?: string;
  NameIdentifier?: string;
  email?: string;
  Email?: string;
  upn?: string;
  role?: string | string[];
  Role?: string | string[];
  roles?: string | string[];
  given_name?: string;
  firstName?: string;
  token_type?: string;
  session_id?: string;
  exp?: number;
  iat?: number;
  iss?: string;
  aud?: string;
  [key: string]: unknown;
}

export interface ExtractedAccessTokenClaims {
  userId: string | null;
  email: string | null;
  rawRole: string | null;
  firstName: string | null;
  tokenType: string | null;
  exp: number | null;
}

export interface HydratedSessionData {
  userId: string;
  email: string;
  role: HydratedRole;
  firstName: string | null;
}

export interface SessionHydrationResult {
  isValid: boolean;
  session: HydratedSessionData | null;
  error: string | null;
}

export interface KeyValueSecureStorage {
  getItemAsync(key: string): Promise<string | null>;
  setItemAsync(key: string, value: string): Promise<void>;
  deleteItemAsync(key: string): Promise<void>;
}

export interface RestoredSessionState {
  email: string | null;
  role: HydratedRole | null;
  userId: string | null;
  firstName: string | null;
  isAuthenticated: boolean;
}

export interface SessionRestorationResult {
  authState: RestoredSessionState;
  connectionStatus: 'online' | 'offline-degraded' | 'offline-unvalidated';
  connectionMessage: string | null;
}

export type RefreshErrorCategory =
  | 'definitive_unauthorized_401'
  | 'definitive_bad_request_400'
  | 'user_missing_role_400_preserve'
  | 'missing_token_in_request_preserve'
  | 'missing_token_in_storage_preserve'
  | 'non_definitive_bad_request_400'
  | 'forbidden_403_preserve'
  | 'transient_network_or_server'
  | 'unclassified_preserve';

export interface RefreshErrorClassification {
  category: RefreshErrorCategory;
  shouldPurgeSession: boolean;
  status: number | null;
  reason: string;
}

export const AUTH_STORAGE_KEY = 'ecoruteando_auth';

const CLAIM_NAME_IDENTIFIER = 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier';
const CLAIM_EMAIL_ADDRESS = 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress';
const CLAIM_MICROSOFT_ROLE = 'http://schemas.microsoft.com/ws/2008/06/identity/claims/role';
const CLAIM_GIVEN_NAME = 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname';

const UNAUTHENTICATED_STATE: RestoredSessionState = {
  email: null,
  role: null,
  userId: null,
  firstName: null,
  isAuthenticated: false,
};

/**
 * Decodifica una cadena Base64URL a UTF-8 sin depender de APIs nativas ausentes en Hermes.
 */
export function decodeBase64UrlToUtf8(input: string): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
  let b64 = input.replace(/-/g, '+').replace(/_/g, '/');
  while (b64.length % 4 !== 0) {
    b64 += '=';
  }
  const str = b64.replace(/=+$/, '');
  if (str.length % 4 === 1) {
    throw new Error('Invalid base64url string');
  }

  let output = '';
  for (let bc = 0, bs = 0, buffer: string, idx = 0; (buffer = str.charAt(idx++)); ) {
    const charIndex = chars.indexOf(buffer);
    if (charIndex === -1) {
      throw new Error('Invalid character in base64url string');
    }
    bs = bc % 4 ? bs * 64 + charIndex : charIndex;
    if (bc++ % 4) {
      output += String.fromCharCode(255 & (bs >> ((-2 * bc) & 6)));
    }
  }

  return decodeURIComponent(
    output
      .split('')
      .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
      .join('')
  );
}

/**
 * Decodifica la sección de payload de un JWT (formato header.payload.signature).
 * Retorna null si la estructura no corresponde a un JWT válido de 3 segmentos o si el JSON es inválido.
 */
export function decodeJwtPayload(token: string | null | undefined): DecodedJwtClaims | null {
  if (!token || typeof token !== 'string') {
    return null;
  }

  const trimmed = token.trim();
  const parts = trimmed.split('.');
  if (parts.length !== 3 || !parts[0] || !parts[1] || !parts[2]) {
    return null;
  }

  try {
    const headerJson = decodeBase64UrlToUtf8(parts[0]);
    const headerParsed = JSON.parse(headerJson);
    if (!headerParsed || typeof headerParsed !== 'object' || Array.isArray(headerParsed)) {
      return null;
    }

    const jsonStr = decodeBase64UrlToUtf8(parts[1]);
    const parsed = JSON.parse(jsonStr);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return null;
    }
    return parsed as DecodedJwtClaims;
  } catch {
    return null;
  }
}

function asNonEmptyString(value: unknown): string | null {
  if (typeof value === 'string') {
    const clean = value.trim();
    return clean.length > 0 ? clean : null;
  }
  if (Array.isArray(value) && value.length > 0) {
    return asNonEmptyString(value[0]);
  }
  return null;
}

/**
 * Extrae los claims relevantes de sesión desde el payload de un JWT emitido por EcoRuteandoBackend.
 * Soporta nombres cortos RFC 7519 (sub, email, role), variantes PascalCase (NameIdentifier, Email, Role)
 * y URIs completas de esquemas .NET ClaimTypes.
 */
export function extractClaimsFromAccessToken(
  tokenOrClaims: string | DecodedJwtClaims | null | undefined
): ExtractedAccessTokenClaims {
  const claims =
    typeof tokenOrClaims === 'string' ? decodeJwtPayload(tokenOrClaims) : tokenOrClaims;

  if (!claims) {
    return {
      userId: null,
      email: null,
      rawRole: null,
      firstName: null,
      tokenType: null,
      exp: null,
    };
  }

  const userId =
    asNonEmptyString(claims.sub) ||
    asNonEmptyString(claims[CLAIM_NAME_IDENTIFIER]) ||
    asNonEmptyString(claims.NameIdentifier) ||
    asNonEmptyString(claims.nameid) ||
    asNonEmptyString(claims.userId);

  const email =
    asNonEmptyString(claims.email) ||
    asNonEmptyString(claims[CLAIM_EMAIL_ADDRESS]) ||
    asNonEmptyString(claims.Email) ||
    asNonEmptyString(claims.upn);

  const rawRole =
    asNonEmptyString(claims.role) ||
    asNonEmptyString(claims[CLAIM_MICROSOFT_ROLE]) ||
    asNonEmptyString(claims.Role) ||
    asNonEmptyString(claims.roles);

  const firstName =
    asNonEmptyString(claims.given_name) ||
    asNonEmptyString(claims[CLAIM_GIVEN_NAME]) ||
    asNonEmptyString(claims.firstName);

  const tokenType = asNonEmptyString(claims.token_type);
  const exp =
    typeof claims.exp === 'number' && Number.isFinite(claims.exp) && claims.exp > 0
      ? claims.exp
      : null;

  return {
    userId,
    email,
    rawRole,
    firstName,
    tokenType,
    exp,
  };
}

/**
 * Determina si un JWT o conjunto de claims corresponde al token temporal de desafío 2FA
 * (token_type === 'two_factor_temp' o role === 'two_factor_pending').
 * Este token NUNCA debe persistirse como accessToken ni como refreshToken.
 */
export function isTemporaryTwoFactorToken(
  tokenOrClaims: string | DecodedJwtClaims | null | undefined
): boolean {
  const extracted = extractClaimsFromAccessToken(tokenOrClaims);
  if (extracted.tokenType?.toLowerCase() === 'two_factor_temp') {
    return true;
  }
  if (extracted.rawRole?.toLowerCase() === 'two_factor_pending') {
    return true;
  }
  return false;
}

/**
 * Verifica si un JWT está expirado, carece de expiración numérica válida o es estructuralmente inválido.
 */
export function isTokenExpired(token: string, bufferSeconds = 60): boolean {
  const claims = decodeJwtPayload(token);
  if (!claims) {
    return true;
  }
  if (claims.exp === undefined || claims.exp === null) {
    return true;
  }
  if (typeof claims.exp !== 'number' || !Number.isFinite(claims.exp) || claims.exp <= 0) {
    return true;
  }
  const now = Math.floor(Date.now() / 1000);
  return claims.exp <= now + bufferSeconds;
}

/**
 * Normaliza el rol proveniente del backend o del JWT al dominio móvil ('user' | 'admin').
 * Retorna null si el rol está ausente, es inválido o corresponde a un estado pendiente ('two_factor_pending').
 */
export function normalizeSessionRole(rawRole: string | null | undefined): HydratedRole | null {
  const clean = asNonEmptyString(rawRole)?.toLowerCase();
  if (!clean) {
    return null;
  }
  if (clean === 'two_factor_pending') {
    return null;
  }
  if (clean === 'admin' || clean === 'administrator' || clean === 'administrador') {
    return 'admin';
  }
  if (clean === 'user' || clean === 'citizen' || clean === 'cyclist' || clean === 'ciudadano') {
    return 'user';
  }
  return null;
}

/**
 * Hidrata y valida los datos indispensables de sesión combinando los claims del accessToken JWT
 * y los parámetros recibidos en el flujo de autenticación (login tradicional, 2FA o refresh).
 *
 * Garantías de seguridad (H-16):
 * 1. Rechaza tokens vacíos, malformados o con expiración ausente/inválida/vencida.
 * 2. Rechaza tokens temporales de 2FA (token_type = 'two_factor_temp' o role = 'two_factor_pending'),
 *    tanto en accessToken como en refreshToken.
 * 3. Hidrata userId, email y role desde los claims del accessToken cuando no vienen en la respuesta JSON.
 * 4. Falla de forma cerrada (isValid: false) si falta userId, email o un rol válido; nunca permite
 *    una sesión autenticada con userId: null ni inventa claims ausentes.
 */
export function hydrateSessionFromTokens(params: {
  accessToken: string | null | undefined;
  refreshToken: string | null | undefined;
  email?: string | null;
  role?: string | null;
  userId?: string | null;
  firstName?: string | null;
}): SessionHydrationResult {
  const accessToken = asNonEmptyString(params?.accessToken);
  const refreshToken = asNonEmptyString(params?.refreshToken);

  if (!accessToken || !refreshToken) {
    return {
      isValid: false,
      session: null,
      error: 'Los tokens de acceso y actualización son obligatorios para iniciar sesión.',
    };
  }

  if (isTemporaryTwoFactorToken(refreshToken)) {
    return {
      isValid: false,
      session: null,
      error: 'El token temporal de 2FA no puede utilizarse ni almacenarse como refreshToken.',
    };
  }

  const decodedClaims = decodeJwtPayload(accessToken);
  if (!decodedClaims) {
    return {
      isValid: false,
      session: null,
      error: 'El token de acceso recibido no tiene un formato JWT válido.',
    };
  }

  if (isTemporaryTwoFactorToken(decodedClaims)) {
    return {
      isValid: false,
      session: null,
      error: 'El token temporal de verificación 2FA no puede utilizarse ni guardarse como token de acceso.',
    };
  }

  const paramRoleClean = asNonEmptyString(params?.role)?.toLowerCase();
  if (paramRoleClean === 'two_factor_pending') {
    return {
      isValid: false,
      session: null,
      error: 'El rol temporal two_factor_pending no permite establecer una sesión autenticada.',
    };
  }

  if (
    decodedClaims.exp === undefined ||
    decodedClaims.exp === null ||
    typeof decodedClaims.exp !== 'number' ||
    !Number.isFinite(decodedClaims.exp) ||
    decodedClaims.exp <= 0
  ) {
    return {
      isValid: false,
      session: null,
      error: 'El token de acceso no contiene una fecha de expiración (exp) válida.',
    };
  }

  if (isTokenExpired(accessToken, 0)) {
    return {
      isValid: false,
      session: null,
      error: 'El token de acceso recibido ha expirado.',
    };
  }

  const extracted = extractClaimsFromAccessToken(decodedClaims);

  if (extracted.tokenType && extracted.tokenType.toLowerCase() !== 'access') {
    return {
      isValid: false,
      session: null,
      error: `Tipo de token no válido para sesión autenticada: ${extracted.tokenType}.`,
    };
  }

  const userId = extracted.userId || asNonEmptyString(params?.userId);
  if (!userId) {
    return {
      isValid: false,
      session: null,
      error: 'El token de acceso no contiene el identificador de usuario (claim sub/nameidentifier) indispensable.',
    };
  }

  const email = extracted.email || asNonEmptyString(params?.email);
  if (!email) {
    return {
      isValid: false,
      session: null,
      error: 'No fue posible determinar el correo electrónico del usuario desde el token ni la respuesta.',
    };
  }

  const rawRole = extracted.rawRole || asNonEmptyString(params?.role);
  const role = normalizeSessionRole(rawRole);
  if (!role) {
    return {
      isValid: false,
      session: null,
      error: 'El token de acceso no contiene un rol de autorización válido.',
    };
  }

  // firstName es opcional: no se incluye en JwtProvider.GenerateToken ni en VerifyTwoFactorAuthResponse.
  // Si no está presente, se mantiene como null sin inventar valores.
  const firstName = asNonEmptyString(params?.firstName) || extracted.firstName || null;

  return {
    isValid: true,
    session: {
      userId,
      email,
      role,
      firstName,
    },
    error: null,
  };
}

/**
 * Limpia de forma segura todas las claves de sesión en SecureStore.
 */
export async function purgeSessionStorage(
  storage: KeyValueSecureStorage,
  includeAvatar = false
): Promise<void> {
  const keys = [AUTH_STORAGE_KEY, 'accessToken', 'refreshToken', 'userId'];
  if (includeAvatar) {
    keys.push('profileAvatarUri');
  }
  for (const key of keys) {
    try {
      await storage.deleteItemAsync(key);
    } catch {}
  }
}

/**
 * Persiste atómicamente una sesión validada en SecureStore.
 * Si cualquier escritura en SecureStore falla, revierte todas las claves escritas
 * para evitar estados parciales o corruptos en el dispositivo.
 */
export async function persistValidatedSessionAtomically(
  storage: KeyValueSecureStorage,
  params: {
    accessToken: string;
    refreshToken: string;
    email?: string | null;
    role?: string | null;
    userId?: string | null;
    firstName?: string | null;
  }
): Promise<RestoredSessionState> {
  const hydration = hydrateSessionFromTokens(params);
  if (!hydration.isValid || !hydration.session) {
    await purgeSessionStorage(storage);
    throw new Error(
      hydration.error || 'No fue posible establecer una sesión válida: claims indispensables ausentes.'
    );
  }

  const { userId, email, role, firstName } = hydration.session;
  const authState: RestoredSessionState = {
    email,
    role,
    userId,
    firstName,
    isAuthenticated: true,
  };

  try {
    await storage.setItemAsync('accessToken', params.accessToken.trim());
    await storage.setItemAsync('refreshToken', params.refreshToken.trim());
    await storage.setItemAsync('userId', userId);
    await storage.setItemAsync(AUTH_STORAGE_KEY, JSON.stringify(authState));
    return authState;
  } catch (storageErr: any) {
    // Rollback atómico para evitar estados parciales si falla una escritura en SecureStore
    await purgeSessionStorage(storage);
    throw new Error(
      `Error al persistir la sesión en almacenamiento seguro: ${storageErr?.message || 'fallo de escritura'}`
    );
  }
}

/**
 * Determina si un error de red/HTTP durante POST /api/auth/refresh es transitorio
 * (sin respuesta, timeout, red caída, 429 o error 5xx del servidor).
 */
export function isTemporaryRefreshError(error: any): boolean {
  if (!error) return false;
  if (
    error.code === 'ECONNABORTED' ||
    error.code === 'ETIMEDOUT' ||
    error.code === 'ERR_NETWORK' ||
    error.message?.toLowerCase().includes('timeout') ||
    error.message?.toLowerCase().includes('network error')
  ) {
    return true;
  }
  if (!error.response) {
    return true;
  }
  const status = error.response.status;
  return (
    typeof status === 'number' &&
    ((status >= 500 && status <= 599) || status === 429)
  );
}

/**
 * Extrae el texto consolidado del cuerpo de error devuelto por EcoRuteandoBackend
 * (ProblemDetails: detail, message, error, code, title y diccionario errors).
 */
function extractRefreshErrorBodyText(data: any): {
  combinedText: string;
  hasRefreshTokenValidationError: boolean;
} {
  if (!data) {
    return { combinedText: '', hasRefreshTokenValidationError: false };
  }
  if (typeof data === 'string') {
    return { combinedText: data.trim(), hasRefreshTokenValidationError: false };
  }
  if (typeof data !== 'object') {
    return { combinedText: '', hasRefreshTokenValidationError: false };
  }

  const parts: string[] = [];
  for (const key of ['detail', 'message', 'error', 'code', 'title']) {
    if (typeof data[key] === 'string' && data[key].trim()) {
      parts.push(data[key].trim());
    }
  }

  let hasRefreshTokenValidationError = false;
  if (data.errors && typeof data.errors === 'object') {
    for (const [field, messages] of Object.entries(data.errors)) {
      const normalizedField = field.toLowerCase();
      const msgList = Array.isArray(messages) ? messages : [messages];
      for (const m of msgList) {
        if (typeof m === 'string' && m.trim()) {
          parts.push(m.trim());
          if (normalizedField === 'refreshtoken' || normalizedField === 'refresh_token') {
            hasRefreshTokenValidationError = true;
          }
        }
      }
    }
  }

  return {
    combinedText: parts.join(' | '),
    hasRefreshTokenValidationError,
  };
}

/**
 * Clasifica la respuesta de error de POST /api/auth/refresh según el contrato real de EcoRuteandoBackend
 * (AuthController.Refresh, RefreshTokenCommandHandler, RefreshTokenCommandValidator y ExceptionMiddleware):
 *
 * A. HTTP 400 — Usuario sin rol:
 *    - En RefreshTokenCommandHandler.cs línea 71: `throw new DomainException("El usuario no tiene un rol asignado.")`,
 *      mapeado por ExceptionMiddleware.cs a HTTP 400 Bad Request ANTES de revocar el refresh token.
 *    - NO se eliminan las credenciales (`shouldPurgeSession: false`, `user_missing_role_400_preserve`),
 *      pero se mantiene bloqueado el acceso a pantallas protegidas (`offline-unvalidated`).
 *
 * B. HTTP 401 / 400 — Refresh token ausente vs enviado y rechazado:
 *    - Si el refresh token no existe en SecureStore (`MISSING_REFRESH_TOKEN_IN_STORAGE`) o no se envió en la
 *      solicitud (`sentRefreshToken` vacío), o si el backend responde 401 `"Refresh token no proporcionado o cookie ausente."`
 *      (AuthController.cs línea 122) o 400 `"El refresh token es obligatorio."` (RefreshTokenCommandValidator.cs línea 12):
 *      NO se eliminan credenciales válidas por ausencia del token o petición mal construida (`shouldPurgeSession: false`).
 *    - Cuando se envió un refresh token no vacío y el backend lo rechaza efectivamente con 401
 *      (`"Refresh token inválido."`, `"Refresh token expirado o revocado."`, `"La sesión ha sido revocada."` en
 *      RefreshTokenCommandHandler.cs) o con un 400 que explícitamente confirme invalidez/revocación/expiración del token:
 *      se invalida la sesión y se purgan las credenciales (`shouldPurgeSession: true`).
 *
 * C. HTTP 403, Timeout, Red, 429 y 5xx:
 *    - Nunca eliminan automáticamente la sesión (`shouldPurgeSession: false`).
 */
export function classifyRefreshError(
  error: any,
  options?: { sentRefreshToken?: string | null }
): RefreshErrorClassification {
  if (error?.code === 'MISSING_REFRESH_TOKEN_IN_STORAGE') {
    return {
      category: 'missing_token_in_storage_preserve',
      shouldPurgeSession: false,
      status: null,
      reason:
        'Refresh token inexistente en SecureStore; no se ejecuta eliminación indiscriminada de almacenamiento.',
    };
  }

  const hasSentRefreshToken =
    options?.sentRefreshToken === undefined
      ? true
      : Boolean(
          typeof options.sentRefreshToken === 'string' &&
            options.sentRefreshToken.trim().length > 0
        );

  if (!hasSentRefreshToken) {
    return {
      category: 'missing_token_in_request_preserve',
      shouldPurgeSession: false,
      status: typeof error?.response?.status === 'number' ? error.response.status : null,
      reason:
        'No se envió un refresh token en la solicitud; no se eliminan credenciales por petición incompleta o ausencia accidental del token.',
    };
  }

  if (isTemporaryRefreshError(error)) {
    return {
      category: 'transient_network_or_server',
      shouldPurgeSession: false,
      status: typeof error?.response?.status === 'number' ? error.response.status : null,
      reason: 'Timeout, error de red o indisponibilidad temporal del servidor; se preservan las credenciales.',
    };
  }

  const status = typeof error?.response?.status === 'number' ? error.response.status : null;
  const { combinedText, hasRefreshTokenValidationError } = extractRefreshErrorBodyText(
    error?.response?.data
  );

  // Detectar respuesta por omisión del token en la petición (AuthController 401 o Validator 400)
  const isMissingTokenInRequestMessage =
    /refresh\s*token\s*(no\s*proporcionado|es\s*obligatorio|requerido|missing|is\s*required)|cookie\s*ausente/i.test(
      combinedText
    );

  if (isMissingTokenInRequestMessage) {
    return {
      category: 'missing_token_in_request_preserve',
      shouldPurgeSession: false,
      status,
      reason:
        'El servidor indicó ausencia del refresh token en la petición (solicitud mal construida); se preservan las credenciales almacenadas.',
    };
  }

  // HTTP 403 Forbidden: nunca eliminar automáticamente la sesión
  if (status === 403) {
    return {
      category: 'forbidden_403_preserve',
      shouldPurgeSession: false,
      status: 403,
      reason:
        'HTTP 403 indica falta de autorización para una operación; no demuestra que el refreshToken sea inválido.',
    };
  }

  // HTTP 400 Bad Request: analizar código y cuerpo de error según contrato real
  if (status === 400) {
    // Caso A: RefreshTokenCommandHandler.cs línea 71 -> DomainException("El usuario no tiene un rol asignado.")
    // El refresh token sigue activo en BD; NO se deben eliminar las credenciales, pero se bloquean rutas protegidas.
    if (/no\s*tiene\s*un\s*rol\s*asignado|sin\s*rol\s*asignado/i.test(combinedText)) {
      return {
        category: 'user_missing_role_400_preserve',
        shouldPurgeSession: false,
        status: 400,
        reason:
          'El usuario no tiene un rol asignado (DomainException 400); se preservan las credenciales pero se mantiene bloqueado el acceso protegido.',
      };
    }

    // Caso B: Si el validador devolvió error sobre el campo RefreshToken por estar vacío/ausente
    if (
      hasRefreshTokenValidationError &&
      !/inv[aá]lido|expirado|revocado|corrupto|invalid|expired|revoked/i.test(combinedText)
    ) {
      return {
        category: 'missing_token_in_request_preserve',
        shouldPurgeSession: false,
        status: 400,
        reason:
          'Error de validación de formato/presencia en la solicitud de refresh; no se eliminan credenciales almacenadas.',
      };
    }

    // Caso C: 400 cuyo cuerpo confirma explícitamente que el refresh token enviado es inválido, expirado o revocado
    const confirmsInvalidToken400 =
      /refresh\s*token.*(inv[aá]lido|expirado|revocado|malformado|corrupto|invalid|expired|revoked)/i.test(
        combinedText
      ) ||
      /sesi[oó]n.*(revocada|inv[aá]lida|expirada|cerrada)/i.test(combinedText) ||
      /invalid_grant|invalid_refresh_token|token_revoked|token_expired/i.test(combinedText);

    if (confirmsInvalidToken400) {
      return {
        category: 'definitive_bad_request_400',
        shouldPurgeSession: true,
        status: 400,
        reason:
          combinedText ||
          'HTTP 400 con confirmación contractual en el cuerpo de que el refreshToken enviado es inválido.',
      };
    }

    return {
      category: 'non_definitive_bad_request_400',
      shouldPurgeSession: false,
      status: 400,
      reason:
        'HTTP 400 cuyo cuerpo no demuestra que el refreshToken enviado sea inválido; no se elimina la sesión automáticamente.',
    };
  }

  // HTTP 401 Unauthorized con refreshToken efectivamente enviado y rechazado por el backend
  // (RefreshTokenCommandHandler: "Refresh token inválido.", "Refresh token expirado o revocado.", "La sesión ha sido revocada.")
  if (status === 401) {
    return {
      category: 'definitive_unauthorized_401',
      shouldPurgeSession: true,
      status: 401,
      reason:
        combinedText ||
        'HTTP 401 en /api/auth/refresh confirma rechazo definitivo del refreshToken enviado o sesión revocada.',
    };
  }

  return {
    category: 'unclassified_preserve',
    shouldPurgeSession: false,
    status,
    reason: 'Error no clasificado como rechazo definitivo de refreshToken; se preservan las credenciales.',
  };
}

/**
 * Determina si el estado actual permite acceder a pantallas protegidas (/(tabs)).
 * Garantiza que 'offline-unvalidated' NUNCA permita acceder a pantallas protegidas
 * antes de haber validado la sesión.
 */
export function canAccessProtectedRoutes(params: {
  authState: RestoredSessionState | null | undefined;
  connectionStatus?: 'online' | 'offline-degraded' | 'offline-unvalidated' | null;
  isLoading?: boolean;
}): boolean {
  if (params.isLoading) {
    return false;
  }
  if (params.connectionStatus === 'offline-unvalidated') {
    return false;
  }
  const state = params.authState;
  if (!state || !state.isAuthenticated) {
    return false;
  }
  if (!asNonEmptyString(state.userId) || !asNonEmptyString(state.email) || !normalizeSessionRole(state.role)) {
    return false;
  }
  return true;
}

// Candado single-flight compartido para evitar llamadas de refresh concurrentes duplicadas
let activeRefreshPromise: Promise<{ accessToken: string; refreshToken: string }> | null = null;

export function executeSingleFlightRefresh(
  refreshToken: string,
  refreshFn: (token: string) => Promise<{ accessToken: string; refreshToken: string }>
): Promise<{ accessToken: string; refreshToken: string }> {
  if (activeRefreshPromise) {
    return activeRefreshPromise;
  }
  activeRefreshPromise = (async () => {
    try {
      return await refreshFn(refreshToken);
    } finally {
      activeRefreshPromise = null;
    }
  })();
  return activeRefreshPromise;
}

/**
 * Ejecuta el flujo completo de restauración y renovación proactiva de sesión al iniciar la app:
 * 1. Lee accessToken, refreshToken y ecoruteando_auth de SecureStore.
 * 2. Rechaza estados de invitado o tokens temporales 2FA (two_factor_temp / two_factor_pending).
 * 3. Si accessToken está vigente y tiene claims completos, restaura la sesión sin llamadas de red.
 * 4. Si accessToken expiró pero existe un refreshToken válido, intenta renovarlo (sin borrar antes el refreshToken).
 * 5. Si el refresh tiene éxito, valida y persiste atómicamente la nueva sesión renovada.
 * 6. Si el refresh recibe 401 o un 400 cuyo cuerpo confirma invalidez del refresh token/sesión,
 *    invalida la sesión y purga credenciales de SecureStore.
 * 7. Si el refresh recibe 403, un 400 no definitivo, timeout o error de red, preserva las credenciales
 *    en SecureStore y retorna estado 'offline-unvalidated' con isAuthenticated: false para impedir
 *    el acceso a pantallas protegidas antes de validar la sesión.
 */
export async function restoreOrRefreshSessionLifecycle(options: {
  storage: KeyValueSecureStorage;
  refreshCall: (refreshToken: string) => Promise<{ accessToken: string; refreshToken: string }>;
}): Promise<SessionRestorationResult> {
  const { storage, refreshCall } = options;

  try {
    const storedRaw = await storage.getItemAsync(AUTH_STORAGE_KEY);
    const accessToken = await storage.getItemAsync('accessToken');
    const refreshToken = await storage.getItemAsync('refreshToken');

    let parsed: Record<string, any> | null = null;
    if (storedRaw) {
      try {
        parsed = JSON.parse(storedRaw);
      } catch {
        parsed = null;
      }
    }

    // Invalidar inmediatamente cualquier estado legado de invitado
    if (parsed?.guest) {
      await purgeSessionStorage(storage);
      return {
        authState: { ...UNAUTHENTICATED_STATE },
        connectionStatus: 'online',
        connectionMessage: null,
      };
    }

    // Nunca permitir que un token temporal de 2FA actúe como accessToken o refreshToken
    if (refreshToken && isTemporaryTwoFactorToken(refreshToken)) {
      await purgeSessionStorage(storage);
      return {
        authState: { ...UNAUTHENTICATED_STATE },
        connectionStatus: 'online',
        connectionMessage: null,
      };
    }

    const usableAccessToken =
      accessToken && !isTemporaryTwoFactorToken(accessToken) ? accessToken : null;
    if (accessToken && !usableAccessToken) {
      try {
        await storage.deleteItemAsync('accessToken');
      } catch {}
    }

    if (!storedRaw && !usableAccessToken && !refreshToken) {
      return {
        authState: { ...UNAUTHENTICATED_STATE },
        connectionStatus: 'online',
        connectionMessage: null,
      };
    }

    // Caso 1: accessToken presente y vigente
    const expired = !usableAccessToken || isTokenExpired(usableAccessToken);
    if (!expired && usableAccessToken) {
      const hydration = hydrateSessionFromTokens({
        accessToken: usableAccessToken,
        refreshToken: refreshToken || 'active_session',
        email: parsed?.email,
        role: parsed?.role,
        userId: parsed?.userId,
        firstName: parsed?.firstName,
      });

      if (hydration.isValid && hydration.session) {
        const authState: RestoredSessionState = {
          email: hydration.session.email,
          role: hydration.session.role,
          userId: hydration.session.userId,
          firstName: hydration.session.firstName,
          isAuthenticated: true,
        };
        await storage.setItemAsync('userId', hydration.session.userId);
        await storage.setItemAsync(AUTH_STORAGE_KEY, JSON.stringify(authState));
        return {
          authState,
          connectionStatus: 'online',
          connectionMessage: null,
        };
      }

      // Si el accessToken vigente carece de claims indispensables y no hay refreshToken, mantener desautenticado sin borrado indiscriminado
      if (!refreshToken || !refreshToken.trim()) {
        return {
          authState: { ...UNAUTHENTICATED_STATE },
          connectionStatus: 'online',
          connectionMessage: null,
        };
      }
    }

    // Caso 2: accessToken expirado (o ausente), pero existe refreshToken no vacío -> intentar renovación sin borrarlo antes
    const cleanRefreshToken = typeof refreshToken === 'string' ? refreshToken.trim() : '';
    if (cleanRefreshToken) {
      try {
        const refreshed = await executeSingleFlightRefresh(cleanRefreshToken, refreshCall);
        if (!refreshed?.accessToken || !refreshed?.refreshToken) {
          const invalidErr: any = new Error('Respuesta de refresh incompleta');
          invalidErr.response = {
            status: 502,
            data: { detail: 'Respuesta de renovación incompleta del servidor.' },
          };
          throw invalidErr;
        }

        const newAuthState = await persistValidatedSessionAtomically(storage, {
          accessToken: refreshed.accessToken,
          refreshToken: refreshed.refreshToken,
          email: parsed?.email,
          role: parsed?.role,
          userId: parsed?.userId,
          firstName: parsed?.firstName,
        });

        return {
          authState: newAuthState,
          connectionStatus: 'online',
          connectionMessage: null,
        };
      } catch (refreshErr: any) {
        const classification = classifyRefreshError(refreshErr, {
          sentRefreshToken: cleanRefreshToken,
        });

        // Si el error NO demuestra invalidez definitiva del refreshToken enviado
        // (timeout, red, 429, 5xx, 403, 400 por usuario sin rol, 400/401 por token ausente en request o 400 no definitivo):
        // 1. Preservar intactas las credenciales en SecureStore.
        // 2. Retornar estado 'offline-unvalidated' con isAuthenticated: false para NO permitir acceso
        //    a pantallas protegidas antes de validar la sesión con el servidor.
        if (!classification.shouldPurgeSession) {
          return {
            authState: { ...UNAUTHENTICATED_STATE },
            connectionStatus: 'offline-unvalidated',
            connectionMessage:
              classification.category === 'transient_network_or_server'
                ? 'No se pudo verificar la sesión por falta de conexión o tiempo de espera agotado. Tus credenciales siguen guardadas.'
                : classification.reason,
          };
        }

        // Rechazo definitivo confirmado por contrato de un refreshToken enviado (401 de RefreshTokenCommandHandler,
        // o 400 cuyo cuerpo confirma invalidez del refreshToken): invalidar sesión y limpiar credenciales.
        await purgeSessionStorage(storage, true);
        return {
          authState: { ...UNAUTHENTICATED_STATE },
          connectionStatus: 'online',
          connectionMessage: null,
        };
      }
    }

    // Refresh token inexistente en SecureStore: mantener desautenticado sin provocar una eliminación indiscriminada
    return {
      authState: { ...UNAUTHENTICATED_STATE },
      connectionStatus: 'online',
      connectionMessage: null,
    };
  } catch {
    return {
      authState: { ...UNAUTHENTICATED_STATE },
      connectionStatus: 'online',
      connectionMessage: null,
    };
  }
}
