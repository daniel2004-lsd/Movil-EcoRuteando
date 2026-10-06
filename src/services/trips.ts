import apiClient from '../shared/services/apiClient';

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

/**
 * Regla CU03: el backend no permite rutas duplicadas por nombre.
 * Si saveRoute falla por duplicado, reusamos la ruta existente.
 */
export async function findRouteIdByName(name: string): Promise<string | null> {
  const { data } = await apiClient.get('/api/routes');
  const list = Array.isArray(data) ? data : [];
  const hit = list.find((r: { id?: string; name?: string }) => r?.name === name);
  return hit?.id ?? null;
}

export async function startTrip(payload: {
  routeId: string;
  transportMode: string;
  source: 'mobile';
}): Promise<{ id: string }> {
  const { data } = await apiClient.post('/api/trips', payload);
  return data;
}

export async function completeTrip(
  usageId: string,
  payload: {
    actualDistanceKm?: number;
    actualDurationMin?: number;
    actualCo2Kg?: number | null;
  }
): Promise<void> {
  await apiClient.post(`/api/trips/${usageId}/complete`, { usageId, ...payload });
}
