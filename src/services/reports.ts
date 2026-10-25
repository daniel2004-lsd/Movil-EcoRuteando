import apiClient from '../shared/services/apiClient';

export type ReportState = 'active' | 'confirmed' | 'disputed' | 'expired';

export interface NearbyReport {
  id: string;
  reportType: string;
  description: string;
  latitude: number;
  longitude: number;
  addressText: string | null;
  photoUrl: string | null;
  createdAt: string;
  confidenceScore: number;
  confirmCount: number;
  rejectCount: number;
  state: ReportState;
  distanceMeters: number;
}

export interface VoteResult {
  reportId: string;
  confidenceScore: number;
  confirmCount: number;
  rejectCount: number;
  state: ReportState;
}

/**
 * Cálculo de distancia euclidiana esférica (Haversine) en metros.
 */
function computeHaversineMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3;
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

/**
 * Reportes de obstáculos activos visibles en el mapa (HU-22 / CU22 / H-10):
 * Consume GET /api/obstacle-reports/active pasando radio en kilómetros (radiusKm).
 * Mapea las propiedades del backend (confirmationsCount, rejectionsCount, derivedStatus).
 */
export const getNearbyReports = async (
  latitude: number,
  longitude: number,
  radiusMeters?: number
): Promise<NearbyReport[]> => {
  const radiusKm = radiusMeters ? radiusMeters / 1000 : undefined;
  const { data } = await apiClient.get('/api/obstacle-reports/active', {
    params: { latitude, longitude, radiusKm },
  });

  if (!Array.isArray(data)) {
    return [];
  }

  return data.map((item: any) => {
    const itemLat = typeof item.latitude === 'number' ? item.latitude : Number(item.latitude) || 0;
    const itemLng = typeof item.longitude === 'number' ? item.longitude : Number(item.longitude) || 0;
    const dist = computeHaversineMeters(latitude, longitude, itemLat, itemLng);

    const derivedState = (item.derivedStatus || item.status || 'active').toLowerCase() as ReportState;

    return {
      id: item.id,
      reportType: item.reportType || 'obstruction',
      description: item.description || '',
      latitude: itemLat,
      longitude: itemLng,
      addressText: item.addressText ?? null,
      photoUrl: item.photoUrl ?? null,
      createdAt: item.createdAt || new Date().toISOString(),
      confidenceScore: typeof item.confidenceScore === 'number' ? item.confidenceScore : 40,
      confirmCount: item.confirmationsCount ?? item.confirmCount ?? 0,
      rejectCount: item.rejectionsCount ?? item.rejectCount ?? 0,
      state: derivedState,
      distanceMeters: typeof item.distanceMeters === 'number' ? item.distanceMeters : dist,
    };
  });
};

/**
 * Voto "¿Sigue ocurriendo?" (HU-22 / CU22 / H-10).
 * Consume POST /api/obstacle-reports/{reportId}/vote con payload { confirms, latitude, longitude }.
 */
export const voteReport = async (
  reportId: string,
  confirm: boolean,
  latitude: number,
  longitude: number
): Promise<VoteResult> => {
  const { data } = await apiClient.post(`/api/obstacle-reports/${reportId}/vote`, {
    confirms: confirm,
    latitude,
    longitude,
  });

  const stateStr = (data.status || (confirm ? 'confirmed' : 'disputed')).toLowerCase() as ReportState;

  return {
    reportId: data.reportId || reportId,
    confidenceScore: typeof data.confidenceScore === 'number' ? data.confidenceScore : 50,
    confirmCount: data.confirmationsCount ?? data.confirmCount ?? 0,
    rejectCount: data.rejectionsCount ?? data.rejectCount ?? 0,
    state: stateStr,
  };
};
