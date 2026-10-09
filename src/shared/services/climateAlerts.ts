// src/shared/services/climateAlerts.ts
// Consulta las alertas meteorológicas del backend (Google Weather API) para la
// posición del usuario y avisa con una notificación local cuando entra a una
// zona con alerta activa. La misma alerta no se repite mientras siga dentro
// (la clave deja de existir cuando Google ya no la devuelve en su posición).
import * as Location from 'expo-location';
import * as SecureStore from './keyStorage';
import apiClient from './apiClient';

export type ClimateAlert = {
  alertTitle: string;
  eventType?: string;
  severity?: string;
  description?: string;
  instruction?: string;
  areaName?: string;
  startTime?: string;
  expirationTime?: string;
  dataSource?: string;
};

const STORE_KEY = 'climateAlertNotified';
const CHECK_MIN_INTERVAL_MS = 45_000;
// Canal v2: el v1 quedó persistido en el dispositivo con un sonido inválido
// (error "Custom sound 'default' not found") y Android no permite editar canales.
const CHANNEL_ID = 'climate-alerts-v2';

let subscription: Location.LocationSubscription | null = null;
let starting = false;
let notified: Set<string> = new Set();
let lastCheckAt = 0;

const alertKey = (a: ClimateAlert) =>
  `${a.alertTitle ?? ''}|${a.areaName ?? ''}|${a.expirationTime ?? ''}`;

async function getNotificationsModule(): Promise<any | null> {
  try {
    return await import('expo-notifications');
  } catch {
    return null;
  }
}

async function ensureChannel(mod: any) {
  if (mod?.setNotificationChannelAsync && mod?.AndroidImportance) {
    try {
      await mod.setNotificationChannelAsync(CHANNEL_ID, {
        name: 'Alertas climáticas',
        importance: mod.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#10b981',
      });
    } catch {}
  }
}

/** Pide permiso de notificaciones (Android 13+), crea el canal y muestra
 *  las notificaciones aunque la app esté abierta (foreground). */
export async function ensureNotificationPermission(): Promise<boolean> {
  const mod = await getNotificationsModule();
  if (!mod) return false;
  try {
    await ensureChannel(mod);
    if (typeof mod.setNotificationHandler === 'function') {
      mod.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowBanner: true,
          shouldShowList: true,
          shouldPlaySound: true,
          shouldSetBadge: false,
        }),
      });
    }
    const { status } = await mod.requestPermissionsAsync();
    return status === 'granted';
  } catch {
    return false;
  }
}

/** Muestra una notificación inmediata de alerta climática. */
export async function notifyClimateAlert(alert: ClimateAlert, options?: { test?: boolean }): Promise<void> {
  const mod = await getNotificationsModule();
  if (!mod) return;
  try {
    await ensureChannel(mod);
    const title = alert.alertTitle || 'Alerta climática';
    const body = options?.test
      ? 'Estás entrando en una zona con alerta de lluvias intensas. Conduce con precaución.'
      : `Estás entrando en una zona con alerta de ${title.toLowerCase()}. ${alert.instruction || 'Conduce con precaución.'}`;
    await mod.scheduleNotificationAsync({
      content: {
        title: '🔔 Alerta climática',
        body,
        data: { type: 'climate-alert', actionUrl: '/(tabs)/alerts' },
      },
      // Entrega inmediata usando nuestro canal (Android exige channelId).
      trigger: { channelId: CHANNEL_ID },
    });
    console.log('[climate] notificación enviada:', body.slice(0, 50));
  } catch (e: any) {
    console.warn('[climate] notify error:', e?.message);
  }
}

/** Notificación de prueba (para verificar cómo llega en el teléfono). */
export async function sendTestClimateAlert() {
  await notifyClimateAlert(
    { alertTitle: 'Lluvias intensas', areaName: 'Neiva', severity: 'Moderate' },
    { test: true }
  );
}

async function loadNotified() {
  try {
    const raw = await SecureStore.getItemAsync(STORE_KEY);
    notified = new Set<string>(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    notified = new Set();
  }
}

async function saveNotified() {
  try {
    await SecureStore.setItemAsync(STORE_KEY, JSON.stringify([...notified]));
  } catch {}
}

/** Consulta clima + alertas de un punto y notifica las alertas que sean nuevas. */
export async function checkAlertsAt(
  lat: number,
  lng: number
): Promise<{ alerts: ClimateAlert[]; weather: any | null; forecast: any[] }> {
  const { data } = await apiClient.get('/api/weather/current', { params: { lat, lng } });
  const alerts: ClimateAlert[] = Array.isArray(data?.alerts) ? data.alerts : [];

  const currentKeys = new Set(alerts.map(alertKey));
  for (const a of alerts) {
    const k = alertKey(a);
    if (!notified.has(k)) {
      notified.add(k);
      await notifyClimateAlert(a);
    }
  }
  // Salió de la zona: la clave desaparece y volverá a avisar si re-entra.
  for (const k of [...notified]) {
    if (!currentKeys.has(k)) notified.delete(k);
  }
  await saveNotified();
  return {
    alerts,
    weather: data?.weather ?? null,
    forecast: Array.isArray(data?.forecast) ? data.forecast : [],
  };
}

/**
 * Arranca la vigilancia: cada ~45-60 s (o cada 300 m de movimiento) consulta si
 * la posición actual tiene alertas activas y avisa solo una vez por alerta.
 */
export async function startClimateAlertWatcher(): Promise<boolean> {
  if (subscription || starting) return true;
  starting = true;
  try {
    let perm = await Location.getForegroundPermissionsAsync();
    if (perm.status !== 'granted') {
      perm = await Location.requestForegroundPermissionsAsync();
      if (perm.status !== 'granted') {
        console.warn('[climate] ubicación no concedida');
        return false;
      }
    }
    await ensureNotificationPermission();
    await loadNotified();

    subscription = await Location.watchPositionAsync(
      { accuracy: Location.Accuracy.Balanced, timeInterval: 60_000, distanceInterval: 300 },
      pos => {
        const now = Date.now();
        if (now - lastCheckAt < CHECK_MIN_INTERVAL_MS) return;
        lastCheckAt = now;
        checkAlertsAt(pos.coords.latitude, pos.coords.longitude).catch((e: any) =>
          console.warn('[climate] check error:', e?.message, e?.response?.status)
        );
      }
    );
    console.log('[climate] watcher iniciado');
    return true;
  } finally {
    starting = false;
  }
}

export function stopClimateAlertWatcher() {
  subscription?.remove();
  subscription = null;
}

export function isWatcherRunning(): boolean {
  return !!subscription;
}
