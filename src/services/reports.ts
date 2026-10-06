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
 * Reportes de obstáculos cercanos visibles en el mapa (HU-22 / CU22):
 * confianza >= 40, activos y no expirados.
 */
export const getNearbyReports = async (
  latitude: number,
  longitude: number,
  radiusMeters?: number
): Promise<NearbyReport[]> => {
  const { data } = await apiClient.get('/api/obstacle-reports/nearby', {
    params: { latitude, longitude, radiusMeters },
  });
  return data as NearbyReport[];
};

/**
 * Voto "¿Sigue ocurriendo?" (HU-22 / CU22). 1 voto por usuario por reporte,
 * el usuario debe estar a <= 500 m del incidente.
 */
export const voteReport = async (
  reportId: string,
  confirm: boolean,
  latitude: number,
  longitude: number
): Promise<VoteResult> => {
  const { data } = await apiClient.post(`/api/obstacle-reports/${reportId}/vote`, {
    confirm,
    latitude,
    longitude,
  });
  return data as VoteResult;
};
