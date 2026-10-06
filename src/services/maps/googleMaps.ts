import axios from 'axios';
import apiClient from '../../shared/services/apiClient';

const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_KEY || '';
const BASE_URL = 'https://maps.googleapis.com/maps/api';

export interface PlaceSuggestion {
  placeId: string;
  description: string;
  mainText: string;
  secondaryText: string;
}

export interface PlaceDetail {
  placeId: string;
  name: string;
  formattedAddress: string;
  latitude: number;
  longitude: number;
  types: string[];
}

export interface DirectionsResult {
  polyline: string;
  distance: { text: string; value: number };
  duration: { text: string; value: number };
  steps: DirectionsStep[];
  bounds: {
    northeast: { latitude: number; longitude: number };
    southwest: { latitude: number; longitude: number };
  };
  alternatives?: DirectionsResult[];
}

export interface DirectionsStep {
  instruction: string;
  distance: { text: string; value: number };
  duration: { text: string; value: number };
  startLocation: { latitude: number; longitude: number };
  endLocation: { latitude: number; longitude: number };
  polyline: string;
  travelMode: string;
}

export interface RouteMode {
  id: 'driving' | 'walking';
  label: string;
  icon: string;
  color: string;
  googleMode: string;
}

export const TRANSPORT_MODES: RouteMode[] = [
  { id: 'driving', label: 'Auto', icon: 'car-outline', color: '#3b82f6', googleMode: 'driving' },
  { id: 'walking', label: 'Caminar', icon: 'walk-outline', color: '#6366f1', googleMode: 'walking' },
];

export async function searchPlaces(query: string, location?: { latitude: number; longitude: number }): Promise<PlaceSuggestion[]> {
  if (query.length < 2) return [];
  
  try {
    const params = new URLSearchParams({
      input: query,
      key: GOOGLE_MAPS_API_KEY,
      language: 'es',
      components: 'country:co',
    });
    
    if (location) {
      params.append('location', `${location.latitude},${location.longitude}`);
      params.append('radius', '50000');
    }

    const response = await axios.get(`${BASE_URL}/place/autocomplete/json`, { params });
    return response.data.predictions.map((p: any) => ({
      placeId: p.place_id,
      description: p.description,
      mainText: p.structured_formatting?.main_text || '',
      secondaryText: p.structured_formatting?.secondary_text || '',
    }));
  } catch (error) {
    console.error('Error searching places:', error);
    return [];
  }
}

export async function getPlaceDetails(placeId: string): Promise<PlaceDetail | null> {
  try {
    const response = await axios.get(`${BASE_URL}/place/details/json`, {
      params: {
        place_id: placeId,
        key: GOOGLE_MAPS_API_KEY,
        language: 'es',
        fields: 'place_id,name,formatted_address,geometry,types',
      },
    });
    
    const result = response.data.result;
    return {
      placeId: result.place_id,
      name: result.name,
      formattedAddress: result.formatted_address,
      latitude: result.geometry.location.lat,
      longitude: result.geometry.location.lng,
      types: result.types || [],
    };
  } catch (error) {
    console.error('Error getting place details:', error);
    return null;
  }
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

async function tryBackendDirections(
  origin: { latitude: number; longitude: number },
  destination: { latitude: number; longitude: number },
  mode: string
): Promise<DirectionsResult | null> {
  try {
    const { data } = await apiClient.get('/api/maps/directions', {
      params: {
        originLat: origin.latitude,
        originLng: origin.longitude,
        destinationLat: destination.latitude,
        destinationLng: destination.longitude,
        travelMode: mode,
      },
    });

    if (data?.status && data.status !== 'OK') {
      return null;
    }

    const polyline: string = data.encodedPolyline || data.polyline || '';
    if (!polyline && !data?.distance) {
      return null;
    }

    const mapStep = (step: any): DirectionsStep => ({
      instruction: stripHtml(step.htmlInstructions || step.instruction || ''),
      distance: {
        text: step.distance?.text || '',
        value: step.distance?.valueMeters ?? step.distance?.value ?? 0,
      },
      duration: {
        text: step.duration?.text || '',
        value: step.duration?.valueSeconds ?? step.duration?.value ?? 0,
      },
      startLocation: {
        latitude: step.startLocation?.latitude ?? step.startLocation?.lat ?? 0,
        longitude: step.startLocation?.longitude ?? step.startLocation?.lng ?? 0,
      },
      endLocation: {
        latitude: step.endLocation?.latitude ?? step.endLocation?.lat ?? 0,
        longitude: step.endLocation?.longitude ?? step.endLocation?.lng ?? 0,
      },
      polyline: step.polyline || '',
      travelMode: step.travelMode || 'DRIVING',
    });

    const mapBounds = (b: any) => ({
      northeast: {
        latitude: b?.northeast?.latitude ?? b?.northeast?.lat ?? destination.latitude + 0.01,
        longitude: b?.northeast?.longitude ?? b?.northeast?.lng ?? destination.longitude + 0.01,
      },
      southwest: {
        latitude: b?.southwest?.latitude ?? b?.southwest?.lat ?? origin.latitude - 0.01,
        longitude: b?.southwest?.longitude ?? b?.southwest?.lng ?? origin.longitude - 0.01,
      },
    });

    const mapAlt = (a: any): DirectionsResult => ({
      polyline: a?.encodedPolyline || a?.polyline || '',
      distance: {
        text: a?.distance?.text || '',
        value: a?.distance?.valueMeters ?? a?.distance?.value ?? 0,
      },
      duration: {
        text: a?.duration?.text || '',
        value: a?.duration?.valueSeconds ?? a?.duration?.value ?? 0,
      },
      steps: (a?.steps || []).map(mapStep),
      bounds: mapBounds(a?.bounds),
    });

    const steps = (data.steps || []).map(mapStep);
    const alternatives: DirectionsResult[] = (Array.isArray(data.alternatives) ? data.alternatives : [])
      .map(mapAlt)
      .filter((a: DirectionsResult) => a.polyline);

    return {
      polyline,
      distance: {
        text: data.distance?.text || '',
        value: data.distance?.valueMeters ?? data.distance?.value ?? 0,
      },
      duration: {
        text: data.duration?.text || '',
        value: data.duration?.valueSeconds ?? data.duration?.value ?? 0,
      },
      steps,
      bounds: mapBounds(data.bounds),
      alternatives,
    };
  } catch (e) {
    console.warn('Backend directions failed, falling back to Google Maps API', e);
  }
  return null;
}

export async function getDirections(
  origin: { latitude: number; longitude: number },
  destination: { latitude: number; longitude: number },
  mode: 'driving' | 'walking' = 'driving',
  alternatives = true
): Promise<DirectionsResult | null> {
  // Try backend first
  const backendResult = await tryBackendDirections(origin, destination, mode);
  if (backendResult) {
    return backendResult;
  }

  // Fallback to Google Maps Directions API
  try {
    const response = await axios.get(`${BASE_URL}/directions/json`, {
      params: {
        origin: `${origin.latitude},${origin.longitude}`,
        destination: `${destination.latitude},${destination.longitude}`,
        mode,
        alternatives,
        key: GOOGLE_MAPS_API_KEY,
        language: 'es',
      },
    });

    if (response.data.status !== 'OK' || !response.data.routes?.length) {
      return null;
    }

    const mapGoogleRoute = (r: any): DirectionsResult => {
      const leg = r.legs[0];
      return {
        polyline: r.overview_polyline?.points || '',
        distance: leg.distance,
        duration: leg.duration,
        steps: leg.steps.map((step: any) => ({
          instruction: step.html_instructions.replace(/<[^>]*>/g, ''),
          distance: step.distance,
          duration: step.duration,
          startLocation: step.start_location,
          endLocation: step.end_location,
          polyline: step.polyline?.points || '',
          travelMode: step.travel_mode,
        })),
        bounds: r.bounds,
      };
    };

    const primary = mapGoogleRoute(response.data.routes[0]);
    const altRoutes: DirectionsResult[] = response.data.routes
      .slice(1, 3)
      .map(mapGoogleRoute)
      .filter((r: DirectionsResult) => r.polyline);

    return { ...primary, alternatives: altRoutes };
  } catch (error) {
    console.error('Error getting directions:', error);
    return null;
  }
}

export function decodePolyline(encoded: string): { latitude: number; longitude: number }[] {
  if (!encoded) return [];
  let index = 0, lat = 0, lng = 0;
  const coordinates: { latitude: number; longitude: number }[] = [];

  while (index < encoded.length) {
    let b, shift = 0, result = 0;
    do { b = encoded.charCodeAt(index++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
    const dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
    lat += dlat;
    shift = 0; result = 0;
    do { b = encoded.charCodeAt(index++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
    const dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
    lng += dlng;
    coordinates.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
  }
  return coordinates;
}

export function encodePolyline(
  coordinates: { latitude: number; longitude: number }[]
): string {
  if (!coordinates.length) return '';
  let output = '';
  let prevLat = 0;
  let prevLng = 0;

  const encodeValue = (value: number): string => {
    let v = value < 0 ? ~(value << 1) : value << 1;
    let chunk = '';
    while (v >= 0x20) {
      chunk += String.fromCharCode((0x20 | (v & 0x1f)) + 63);
      v >>= 5;
    }
    return chunk + String.fromCharCode(v + 63);
  };

  for (const point of coordinates) {
    const lat = Math.round(point.latitude * 1e5);
    const lng = Math.round(point.longitude * 1e5);
    output += encodeValue(lat - prevLat);
    output += encodeValue(lng - prevLng);
    prevLat = lat;
    prevLng = lng;
  }
  return output;
}

export function calculateEcoImpact(mode: string, distanceKm: number): { co2: string; saved: string } {
  const factors: Record<string, number> = {
    driving: 0.21,
    walking: 0,
  };
  const factor = factors[mode] || 0;
  const co2 = (distanceKm * factor).toFixed(1);
  const saved = mode === 'driving' ? '0' : (distanceKm * 0.21).toFixed(1);
  return { co2: `${co2} kg`, saved: `${saved} kg` };
}

export interface SustainabilityEstimate {
  transportType: string;
  distanceKm: number;
  estimatedTimeMin: number;
  co2EmissionsKg: number | null;
  co2SavedKg: number | null;
  estimatedCalories: number | null;
}

const ESTIMATE_MODE_MAP: Record<string, string> = {
  driving: 'car',
  walking: 'walking',
};

export async function getSustainabilityEstimate(
  origin: { latitude: number; longitude: number },
  destination: { latitude: number; longitude: number },
  mode: 'driving' | 'walking'
): Promise<SustainabilityEstimate | null> {
  try {
    const { data } = await apiClient.get('/api/sustainability/estimate', {
      params: {
        originLat: origin.latitude,
        originLng: origin.longitude,
        destinationLat: destination.latitude,
        destinationLng: destination.longitude,
        transportMode: ESTIMATE_MODE_MAP[mode] || 'walking',
      },
    });
    return data ?? null;
  } catch (e) {
    console.warn('Sustainability estimate not available:', e);
    return null;
  }
}

export interface NearbyPlace {
  placeId: string;
  name: string;
  latitude: number;
  longitude: number;
  rating?: number;
  userRatingCount?: number;
  vicinity?: string;
  openNow?: boolean;
}

export interface PoiCategory {
  id: string;
  label: string;
  icon: string;
  placeType: string;
  color: string;
}

export const POI_CATEGORIES: PoiCategory[] = [
  { id: 'restaurant', label: 'Restaurantes', icon: 'restaurant', placeType: 'restaurant', color: '#ea4335' },
  { id: 'cafe', label: 'Cafés', icon: 'cafe', placeType: 'cafe', color: '#a5673f' },
  { id: 'lodging', label: 'Hoteles', icon: 'bed', placeType: 'lodging', color: '#4285f4' },
  { id: 'atm', label: 'Cajeros', icon: 'cash', placeType: 'atm', color: '#34a853' },
  { id: 'gas', label: 'Gasolineras', icon: 'flame', placeType: 'gas_station', color: '#fbbc04' },
  { id: 'pharmacy', label: 'Farmacias', icon: 'medkit', placeType: 'pharmacy', color: '#e91e63' },
  { id: 'supermarket', label: 'Supermercados', icon: 'cart', placeType: 'supermarket', color: '#ff6d00' },
  { id: 'bar', label: 'Bares', icon: 'wine', placeType: 'bar', color: '#7c4dff' },
];

export async function getNearbyPlaces(
  center: { latitude: number; longitude: number },
  placeType: string,
  radius = 2500
): Promise<NearbyPlace[]> {
  try {
    const response = await axios.get(`${BASE_URL}/place/nearbysearch/json`, {
      params: {
        location: `${center.latitude},${center.longitude}`,
        radius,
        type: placeType,
        language: 'es',
        key: GOOGLE_MAPS_API_KEY,
      },
    });

    if (response.data.status !== 'OK') {
      console.warn('Nearby search status:', response.data.status);
      return [];
    }

    return (response.data.results || []).map((r: any) => ({
      placeId: r.place_id,
      name: r.name,
      latitude: r.geometry?.location?.lat ?? 0,
      longitude: r.geometry?.location?.lng ?? 0,
      rating: r.rating,
      userRatingCount: r.user_ratings_total,
      vicinity: r.vicinity || r.formatted_address,
      openNow: r.opening_hours?.open_now,
    }));
  } catch (error) {
    console.error('Error getting nearby places:', error);
    return [];
  }
}