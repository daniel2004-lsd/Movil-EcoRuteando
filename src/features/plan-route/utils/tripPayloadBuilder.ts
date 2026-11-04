import type { PlacePoint, TransportMode } from '../types';

/**
 * Recorta cadenas respetando límites de validación de backend (name 150, start/dest 200).
 */
export const clip = (v: string, max: number): string => 
  (v.length > max ? v.slice(0, max).trim() : v);

/**
 * Construye el payload canónico para guardar la ruta en el backend (/api/routes).
 */
export function buildSavePayload(
  origin: PlacePoint,
  destination: PlacePoint,
  activeRoute?: any,
  mode: TransportMode = 'driving',
  estimate?: { co2SavedKg?: number | null; estimatedCalories?: number | null } | null,
  fallbackOriginName?: string,
  fallbackDestName?: string,
  fallbackRouteDesc?: string
) {
  let distanceKm = 0;
  let durationMin = 0;

  if (activeRoute?.distance?.value) {
    distanceKm = Number((activeRoute.distance.value / 1000).toFixed(2));
  }
  if (activeRoute?.duration?.value) {
    durationMin = Math.round(activeRoute.duration.value / 60);
  }

  const startName = clip(origin.name || fallbackOriginName || 'Origen', 200);
  const destinationName = clip(destination.name || fallbackDestName || 'Destino', 200);

  return {
    name: clip(`${startName} → ${destinationName}`, 150),
    description: clip(fallbackRouteDesc || 'Ruta calculada desde la app móvil', 1000),
    transportType: mode === 'driving' ? 'car' : 'walking',
    startName,
    destinationName,
    startLat: origin.latitude,
    startLng: origin.longitude,
    endLat: destination.latitude,
    endLng: destination.longitude,
    encodedPolyline: activeRoute?.polyline || '',
    distanceKm,
    estimatedTimeMin: durationMin,
    co2SavedKg: estimate?.co2SavedKg ?? null,
    estimatedCalories: estimate?.estimatedCalories ?? null,
  };
}

/**
 * Normaliza mensajes de error devueltos por Axios y el backend de EcoRuteando.
 */
export function apiErrorMessage(e: any): string {
  const raw = String(e?.message ?? '');
  if (
    raw.includes('refresh token') ||
    raw.includes('iniciado sesión') ||
    raw.includes('sesión ha expirado') ||
    e?.response?.status === 401
  ) {
    return 'Debes iniciar sesión para realizar esta acción.';
  }
  const d = e?.response?.data;
  if (d) {
    if (typeof d.detail === 'string' && d.detail) return d.detail;
    if (typeof d.message === 'string' && d.message) return d.message;
    if (d.errors) {
      const first = Object.values(d.errors)
        .flat()
        .find((v: any) => typeof v === 'string' && v);
      if (first) return String(first);
    }
  }
  return raw;
}
