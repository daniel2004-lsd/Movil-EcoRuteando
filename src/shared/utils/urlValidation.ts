/**
 * Utilidades de validación y normalización de URLs para EcoRuteando Móvil (H-17).
 * Garantiza que en entornos de producción solo se utilicen conexiones seguras HTTPS
 * y previene la fuga involuntaria de credenciales o tokens a hosts inseguros o no confiables.
 */

export interface UrlValidationResult {
  isValid: boolean;
  normalizedUrl?: string;
  error?: string;
}

// Constante inmutable oficial del backend de producción
export const OFFICIAL_PRODUCTION_API_URL = 'https://ecoruteandobackend.onrender.com';

// Lista de dominios de producción y staging de confianza
const TRUSTED_PRODUCTION_HOST_PATTERNS = [
  /^(.*\.)?onrender\.com$/,
  /^(.*\.)?ecoruteando\.com$/,
  /^(.*\.)?ecoruteando\.app$/,
];

/**
 * Valida si un hostname es considerado seguro para producción.
 */
export function isTrustedProductionHost(hostname: string): boolean {
  if (!hostname) return false;
  const lowerHost = hostname.toLowerCase();
  return TRUSTED_PRODUCTION_HOST_PATTERNS.some(pattern => pattern.test(lowerHost));
}

/**
 * Valida si una dirección es una IP local o privada (10.*, 192.168.*, 172.16-31.*, localhost, 127.0.0.1, IPv6 loopback).
 */
export function isLocalOrPrivateHost(hostname: string): boolean {
  if (!hostname) return false;
  const lower = hostname.toLowerCase().replace(/^\[|\]$/g, '');
  if (lower === 'localhost' || lower === '127.0.0.1' || lower === '0.0.0.0' || lower === '::1') return true;
  if (/^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(lower)) return true;
  if (/^192\.168\.\d{1,3}\.\d{1,3}$/.test(lower)) return true;
  if (/^172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}$/.test(lower)) return true;
  if (lower.startsWith('fe80:') || lower.startsWith('fc') || lower.startsWith('fd')) return true;
  return false;
}

/**
 * Valida sintáctica y semánticamente una URL base de API y produce una versión normalizada canónica.
 * @param inputUrl URL a validar.
 * @param isProduction Si es true, impone requisitos estrictos de HTTPS y rechaza IPs locales/no cifradas.
 */
export function validateApiUrl(inputUrl: string, isProduction: boolean = false): UrlValidationResult {
  if (!inputUrl || typeof inputUrl !== 'string') {
    return { isValid: false, error: 'Por favor introduce una URL válida.' };
  }

  const trimmed = inputUrl.trim().replace(/\/+$/, '');
  if (!trimmed) {
    return { isValid: false, error: 'La URL no puede estar vacía.' };
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return { isValid: false, error: 'El formato de la URL no es válido (ej: https://api.ejemplo.com).' };
  }

  const protocol = parsed.protocol.toLowerCase();

  // En producción, solo se permite HTTPS
  if (isProduction) {
    if (protocol !== 'https:') {
      return {
        isValid: false,
        error: 'En producción solo se permiten conexiones seguras mediante HTTPS (cifrado TLS).',
      };
    }

    if (isLocalOrPrivateHost(parsed.hostname)) {
      return {
        isValid: false,
        error: 'Las direcciones IP locales y privadas no están permitidas en producción.',
      };
    }
  } else {
    // En desarrollo se permite http o https
    if (protocol !== 'http:' && protocol !== 'https:') {
      return {
        isValid: false,
        error: 'El protocolo debe ser http:// o https://.',
      };
    }
  }

  // Prevenir inyección de credenciales en la URL (ej: https://user:pass@host)
  if (parsed.username || parsed.password) {
    return {
      isValid: false,
      error: 'La URL no debe incluir credenciales embebidas (usuario:contraseña).',
    };
  }

  // Normalización canónica usando el analizador estándar sin alterar rutas, puertos ni parámetros legítimos
  const host = parsed.host.toLowerCase();
  const pathname = parsed.pathname === '/' ? '' : parsed.pathname.replace(/\/+$/, '');
  const search = parsed.search || '';
  const hash = parsed.hash || '';
  const normalizedUrl = `${protocol}//${host}${pathname}${search}${hash}`;

  return {
    isValid: true,
    normalizedUrl,
  };
}

/**
 * Resuelve una URL base segura para el cliente HTTP.
 * 1. Valida customUrl según isProduction.
 * 2. Si customUrl falta o no es válida, valida fallbackUrl según isProduction.
 * 3. Nunca devuelve una URL (ni fallback) sin validar.
 * 4. En producción, si ambas URLs son inválidas, falla de forma cerrada lanzando una excepción.
 */
export function getSafeBaseUrl(
  customUrl: string | null | undefined,
  fallbackUrl: string,
  isProduction: boolean = false
): string {
  // 1. Validar URL personalizada si está configurada
  if (customUrl && typeof customUrl === 'string' && customUrl.trim()) {
    const customValidation = validateApiUrl(customUrl, isProduction);
    if (customValidation.isValid && customValidation.normalizedUrl) {
      return customValidation.normalizedUrl;
    }
  }

  // 2. Si la URL personalizada no existe o es inválida, validar fallbackUrl
  if (fallbackUrl && typeof fallbackUrl === 'string' && fallbackUrl.trim()) {
    const fallbackValidation = validateApiUrl(fallbackUrl, isProduction);
    if (fallbackValidation.isValid && fallbackValidation.normalizedUrl) {
      return fallbackValidation.normalizedUrl;
    }
  }

  // 3 & 4. Si ambas son inválidas en producción, fallo cerrado estricto
  if (isProduction) {
    throw new Error(
      'Configuración de seguridad crítica (H-17): No se pudo resolver un endpoint HTTPS seguro para la API en producción. Tanto la URL personalizada como el fallback son inválidos o inseguros.'
    );
  }

  // En desarrollo, validar si el fallback funciona para desarrollo; en caso contrario, fallar
  const devFallback = validateApiUrl(fallbackUrl, false);
  if (devFallback.isValid && devFallback.normalizedUrl) {
    return devFallback.normalizedUrl;
  }

  throw new Error('Configuración de URL inválida: ni la URL personalizada ni el fallback son válidos.');
}
