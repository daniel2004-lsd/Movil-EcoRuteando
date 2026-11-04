import apiClient from '../shared/services/apiClient';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface GpsBreadcrumb {
  lat: number;
  lng: number;
  timestamp: number;
  accuracy?: number;
  speed?: number;
}

export interface SaveRoutePayload {
  name: string;
  description?: string;
  transportType: string;
  startName: string;
  destinationName: string;
  startLat: number;
  startLng: number;
  endLat: number;
  endLng: number;
  encodedPolyline?: string;
  distanceKm?: number;
  estimatedTimeMin?: number;
  co2SavedKg?: number | null;
  estimatedCalories?: number | null;
}

export async function saveRoute(payload: SaveRoutePayload): Promise<string> {
  const { data } = await apiClient.post('/api/routes', payload);
  return data.id;
}

export async function findRouteIdByName(name: string): Promise<string | null> {
  const { data } = await apiClient.get('/api/routes');
  const list = Array.isArray(data) ? data : [];
  const normalized = name.trim().toLowerCase();
  const hit = list.find(
    (r: { id?: string; name?: string }) =>
      (r?.name ?? '').trim().toLowerCase() === normalized
  );
  return hit?.id ?? null;
}

export async function startTrip(payload: {
  routeId: string;
  transportMode: string;
  source: 'mobile';
  gpsDataJson?: string;
}): Promise<{ id: string }> {
  const { data } = await apiClient.post('/api/trips', payload);
  return data;
}

const OFFLINE_QUEUE_KEY = '@ecoruteando_pending_completed_trips';

export async function completeTrip(
  usageId: string,
  payload: {
    actualDistanceKm?: number;
    actualDurationMin?: number;
    actualCo2Kg?: number | null;
    endedAt?: string;
    gpsDataJson?: string;
  }
): Promise<void> {
  const body = { usageId, ...payload };
  try {
    await apiClient.post(`/api/trips/${usageId}/complete`, body);
  } catch (err: any) {
    // Si no hay conexión o falla la red, almacenar en cola local para sincronización posterior
    try {
      const raw = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
      const queue: any[] = raw ? JSON.parse(raw) : [];
      queue.push({ usageId, body, timestamp: Date.now() });
      await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
    } catch {}
    throw err;
  }
}

/**
 * Reintenta sincronizar viajes completados que quedaron pendientes por falla de red
 */
export async function syncOfflineTrips(): Promise<number> {
  try {
    const raw = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
    if (!raw) return 0;
    const queue: any[] = JSON.parse(raw);
    if (!queue.length) return 0;

    const remaining: any[] = [];
    let synced = 0;

    for (const item of queue) {
      try {
        await apiClient.post(`/api/trips/${item.usageId}/complete`, item.body);
        synced++;
      } catch {
        remaining.push(item);
      }
    }

    await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(remaining));
    return synced;
  } catch {
    return 0;
  }
}
