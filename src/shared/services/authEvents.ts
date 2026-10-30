// src/shared/services/authEvents.ts
// Mecanismo desacoplado para notificar eventos globales de ciclo de vida de autenticación
// sin generar dependencias cíclicas entre apiClient y AuthContext.

type AuthEventListener = () => void;

const sessionExpiredListeners = new Set<AuthEventListener>();
let lastEmittedTimestamp = 0;
const DEDUPLICATION_WINDOW_MS = 1500;

/**
 * Registra un callback que se ejecuta cuando el refresh token falla definitivamente.
 * Retorna una función para cancelar la suscripción.
 */
export const onSessionExpired = (listener: AuthEventListener): (() => void) => {
  sessionExpiredListeners.add(listener);
  return () => {
    sessionExpiredListeners.delete(listener);
  };
};

/**
 * Notifica a todos los escuchas que la sesión ha expirado definitivamente.
 * Cuenta con protección contra disparos concurrentes o redundantes.
 */
export const emitSessionExpired = (): void => {
  const now = Date.now();
  if (now - lastEmittedTimestamp < DEDUPLICATION_WINDOW_MS) {
    return;
  }
  lastEmittedTimestamp = now;

  sessionExpiredListeners.forEach(listener => {
    try {
      listener();
    } catch (e) {
      console.warn('[authEvents] Error ejecutando listener de sesión expirada:', e);
    }
  });
};

/**
 * Función utilitaria para pruebas: limpia los listeners y resetea el timestamp.
 */
export const _resetAuthEvents = (): void => {
  sessionExpiredListeners.clear();
  lastEmittedTimestamp = 0;
};
