import axios from 'axios';
import apiClient from '../../shared/services/apiClient';
import * as SecureStore from '../../shared/services/keyStorage';

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

const backendGeocodeCache = new Map<string, PlaceDetail>();

export async function tryBackendGeocode(query: string): Promise<PlaceSuggestion[]> {
  try {
    const token = await SecureStore.getItemAsync('accessToken');
    if (!token) return [];

    // Limitar y priorizar búsquedas en Colombia
    const addressQuery = /colombia/i.test(query.trim()) ? query.trim() : `${query.trim()}, Colombia`;
    const { data } = await apiClient.get('/api/maps/geocode', {
      params: { address: addressQuery },
    });

    const results = Array.isArray(data?.results) ? data.results : Array.isArray(data) ? data : [];
    if (!results.length) return [];

    const suggestions: PlaceSuggestion[] = [];
    for (const r of results) {
      const placeId = r.place_id || r.placeId || `${r.geometry?.location?.lat ?? 0},${r.geometry?.location?.lng ?? 0}`;
      const description = r.formatted_address || r.formattedAddress || r.name || query;
      const parts = description.split(',');
      const mainText = parts[0]?.trim() || description;
      const secondaryText = parts.slice(1).join(',').trim();

      const detail: PlaceDetail = {
        placeId,
        name: r.name || mainText,
        formattedAddress: description,
        latitude: r.geometry?.location?.lat ?? r.lat ?? r.latitude ?? 0,
        longitude: r.geometry?.location?.lng ?? r.lng ?? r.longitude ?? 0,
        types: Array.isArray(r.types) ? r.types : [],
      };
      backendGeocodeCache.set(placeId, detail);
      suggestions.push({
        placeId,
        description,
        mainText,
        secondaryText,
      });
    }
    return suggestions;
  } catch (e: any) {
    if (e?.response?.status !== 401) {
      console.warn('Backend geocode failed:', e);
    }
    return [];
  }
}

export async function searchNominatimPlaces(
  query: string,
  location?: { latitude: number; longitude: number }
): Promise<PlaceSuggestion[]> {
  try {
    const cleanQuery = query.trim();
    const q = /colombia/i.test(cleanQuery) ? cleanQuery : `${cleanQuery}, Colombia`;
    const params: Record<string, any> = {
      q,
      format: 'json',
      addressdetails: 1,
      countrycodes: 'co',
      limit: 8,
    };

    if (location) {
      const delta = 0.5;
      params.viewbox = `${location.longitude - delta},${location.latitude + delta},${location.longitude + delta},${location.latitude - delta}`;
    }

    const res = await axios.get('https://nominatim.openstreetmap.org/search', {
      params,
      headers: {
        'User-Agent': 'EcoRuteandoApp/1.0',
        'Accept-Language': 'es',
      },
      timeout: 8000,
    });

    if (!Array.isArray(res.data) || !res.data.length) {
      return [];
    }

    const suggestions: PlaceSuggestion[] = [];
    for (const item of res.data) {
      const placeId = String(item.place_id || `${item.lat},${item.lon}`);
      const rawName = item.name || item.address?.road || item.address?.suburb || item.display_name.split(',')[0];
      const cityOrState = item.address?.city || item.address?.town || item.address?.municipality || item.address?.state || 'Colombia';
      const mainText = rawName ? String(rawName).trim() : item.display_name.split(',')[0].trim();
      const secondaryText = `${cityOrState}, Colombia`;
      const description = `${mainText}, ${secondaryText}`;

      const detail: PlaceDetail = {
        placeId,
        name: mainText,
        formattedAddress: item.display_name,
        latitude: parseFloat(item.lat),
        longitude: parseFloat(item.lon),
        types: item.type ? [item.type] : [],
      };
      backendGeocodeCache.set(placeId, detail);

      suggestions.push({
        placeId,
        description,
        mainText,
        secondaryText,
      });
    }

    return suggestions;
  } catch (err) {
    console.warn('Nominatim geocode failed:', err);
    return [];
  }
}

export async function searchPlaces(query: string, location?: { latitude: number; longitude: number }): Promise<PlaceSuggestion[]> {
  if (query.length < 2) return [];

  // 1. Intento primario seguro: consultar endpoint de geocodificación del backend
  try {
    const backendResults = await tryBackendGeocode(query);
    if (backendResults.length > 0) {
      return backendResults;
    }
  } catch {
    // Continuar a fallback
  }

  // 2. Fallback autónomo para invitados o sin sesión: OpenStreetMap Nominatim Colombia
  try {
    const nominatimResults = await searchNominatimPlaces(query, location);
    if (nominatimResults.length > 0) {
      return nominatimResults;
    }
  } catch {
    // Continuar a fallback
  }

  // 3. Si la clave está restringida a Android nativo (sin clave web específica),
  // se evita invocar directamente la API REST con Axios para prevenir errores REQUEST_DENIED.
  const hasWebCompatibleKey = Boolean(process.env.EXPO_PUBLIC_GOOGLE_MAPS_WEB_KEY);
  if (!hasWebCompatibleKey) {
    return [];
  }

  // 3. Fallback a Google Maps API si se configuró una clave web compatible
  try {
    const params = new URLSearchParams({
      input: query,
      key: process.env.EXPO_PUBLIC_GOOGLE_MAPS_WEB_KEY || GOOGLE_MAPS_API_KEY,
      language: 'es',
      components: 'country:co',
    });
    
    if (location) {
      params.append('location', `${location.latitude},${location.longitude}`);
      params.append('radius', '50000');
    }

    const response = await axios.get(`${BASE_URL}/place/autocomplete/json`, { params });
    if (response.data?.status !== 'OK' || !Array.isArray(response.data?.predictions)) {
      return [];
    }
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
  // 1. Si fue resuelto y almacenado por backend geocode, resolver directamente de la caché
  if (backendGeocodeCache.has(placeId)) {
    return backendGeocodeCache.get(placeId)!;
  }

  // 2. Si la clave está restringida a Android nativo, se evita la llamada REST web incompatible
  const hasWebCompatibleKey = Boolean(process.env.EXPO_PUBLIC_GOOGLE_MAPS_WEB_KEY);
  if (!hasWebCompatibleKey) {
    return null;
  }

  // 3. Fallback a Google Maps API si se configuró una clave web compatible
  try {
    const response = await axios.get(`${BASE_URL}/place/details/json`, {
      params: {
        place_id: placeId,
        key: process.env.EXPO_PUBLIC_GOOGLE_MAPS_WEB_KEY || GOOGLE_MAPS_API_KEY,
        language: 'es',
        fields: 'place_id,name,formatted_address,geometry,types',
      },
    });
    
    if (response.data?.status !== 'OK' || !response.data?.result) {
      return null;
    }
    const result = response.data.result;
    return {
      placeId: result.place_id,
      name: result.name,
      formattedAddress: result.formatted_address,
      latitude: result.geometry?.location?.lat ?? 0,
      longitude: result.geometry?.location?.lng ?? 0,
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
    // El endpoint /api/maps/directions es público (AllowAnonymous).
    // Si existe accessToken en SecureStore, apiClient lo adjunta automáticamente.
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

export async function getOsrmDirections(
  origin: { latitude: number; longitude: number },
  destination: { latitude: number; longitude: number },
  mode: 'driving' | 'walking' = 'driving',
  alternatives = true
): Promise<DirectionsResult | null> {
  try {
    const profile = mode === 'walking' ? 'foot' : 'car';
    const coords = `${origin.longitude},${origin.latitude};${destination.longitude},${destination.latitude}`;
    const url = `https://router.project-osrm.org/route/v1/${profile}/${coords}`;

    const res = await axios.get(url, {
      params: {
        overview: 'full',
        geometries: 'polyline',
        steps: 'true',
        alternatives: alternatives ? 'true' : 'false',
        annotations: 'false',
      },
      timeout: 12000,
    });

    if (res.data?.code !== 'Ok' || !Array.isArray(res.data?.routes) || !res.data.routes.length) {
      return null;
    }

    const formatMeters = (m: number) => {
      if (m >= 1000) return `${(m / 1000).toFixed(1)} km`;
      return `${Math.round(m)} m`;
    };

    const formatSeconds = (s: number) => {
      const min = Math.round(s / 60);
      if (min >= 60) {
        const hrs = Math.floor(min / 60);
        const remMin = min % 60;
        return remMin > 0 ? `${hrs} h ${remMin} min` : `${hrs} h`;
      }
      return `${Math.max(1, min)} min`;
    };

    const parseOsrmRoute = (r: any): DirectionsResult => {
      const distanceMeters = Math.round(r.distance || 0);
      const durationSeconds = Math.round(r.duration || 0);
      const leg = r.legs?.[0];

      const steps: DirectionsStep[] = (leg?.steps || []).map((step: any) => {
        const stepDist = Math.round(step.distance || 0);
        const stepDur = Math.round(step.duration || 0);
        const streetName = step.name ? ` en ${step.name}` : '';
        let instruction = 'Continúa';
        const type = step.maneuver?.type;
        const modifier = step.maneuver?.modifier;

        if (type === 'depart') instruction = 'Inicia tu recorrido';
        else if (type === 'arrive') instruction = 'Llegada a tu destino';
        else if (modifier) {
          const modMap: Record<string, string> = {
            left: 'Gira a la izquierda',
            right: 'Gira a la derecha',
            'sharp left': 'Gira pronunciado a la izquierda',
            'sharp right': 'Gira pronunciado a la derecha',
            'slight left': 'Mantente a la izquierda',
            'slight right': 'Mantente a la derecha',
            straight: 'Continúa recto',
            uturn: 'Da vuelta en U',
          };
          instruction = modMap[modifier] || `Gira hacia ${modifier}`;
        }
        instruction += streetName;

        const loc = step.maneuver?.location;
        const startLat = loc ? loc[1] : origin.latitude;
        const startLng = loc ? loc[0] : origin.longitude;

        return {
          instruction,
          distance: { text: formatMeters(stepDist), value: stepDist },
          duration: { text: formatSeconds(stepDur), value: stepDur },
          startLocation: { latitude: startLat, longitude: startLng },
          endLocation: { latitude: startLat, longitude: startLng },
          polyline: step.geometry || '',
          travelMode: mode === 'walking' ? 'WALKING' : 'DRIVING',
        };
      });

      const minLat = Math.min(origin.latitude, destination.latitude);
      const maxLat = Math.max(origin.latitude, destination.latitude);
      const minLng = Math.min(origin.longitude, destination.longitude);
      const maxLng = Math.max(origin.longitude, destination.longitude);

      return {
        polyline: r.geometry || '',
        distance: { text: formatMeters(distanceMeters), value: distanceMeters },
        duration: { text: formatSeconds(durationSeconds), value: durationSeconds },
        steps,
        bounds: {
          northeast: { latitude: maxLat + 0.005, longitude: maxLng + 0.005 },
          southwest: { latitude: minLat - 0.005, longitude: minLng - 0.005 },
        },
      };
    };

    const primary = parseOsrmRoute(res.data.routes[0]);
    const altRoutes = res.data.routes.slice(1, 3).map(parseOsrmRoute);

    return { ...primary, alternatives: altRoutes };
  } catch (err) {
    console.warn('OSRM directions failed:', err);
    return null;
  }
}

export async function getDirections(
  origin: { latitude: number; longitude: number },
  destination: { latitude: number; longitude: number },
  mode: 'driving' | 'walking' = 'driving',
  alternatives = true
): Promise<DirectionsResult | null> {
  // 1. Try backend first (authenticated users)
  const backendResult = await tryBackendDirections(origin, destination, mode);
  if (backendResult) {
    return backendResult;
  }

  // 2. Fallback to Google Maps Directions API (if key is unrestricted)
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

    if (response.data.status === 'OK' && Array.isArray(response.data.routes) && response.data.routes.length) {
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
    }
  } catch (error) {
    console.warn('Google Maps REST directions failed, attempting OSRM routing fallback:', error);
  }

  // 3. Fallback universal y autónomo para contingencias de red: OSRM
  return await getOsrmDirections(origin, destination, mode, alternatives);
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
    if (data) return data;
  } catch (e) {
    // Continuar a fallback de estimación local para invitados
  }

  // Estimación local resiliente para invitados o contingencias de conexión
  try {
    const latDiff = (destination.latitude - origin.latitude) * 111.32;
    const lngDiff = (destination.longitude - origin.longitude) * 111.32 * Math.cos(origin.latitude * (Math.PI / 180));
    const directKm = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff);
    const distanceKm = Math.max(0.1, Math.round(directKm * 1.3 * 10) / 10);
    const speed = mode === 'walking' ? 4.5 : 30;
    const estimatedTimeMin = Math.max(1, Math.round((distanceKm / speed) * 60));
    const co2EmissionsKg = mode === 'driving' ? +(distanceKm * 0.17).toFixed(2) : 0;
    const co2SavedKg = mode === 'walking' ? +(distanceKm * 0.17).toFixed(2) : 0;
    const estimatedCalories = mode === 'walking' ? Math.round(distanceKm * 55) : null;

    return {
      transportType: ESTIMATE_MODE_MAP[mode] || 'walking',
      distanceKm,
      estimatedTimeMin,
      co2EmissionsKg,
      co2SavedKg,
      estimatedCalories,
    };
  } catch {
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

export function mapBackendPlace(p: any): NearbyPlace {
  return {
    placeId: p.placeId || p.place_id || `${p.lat ?? p.latitude ?? 0}-${p.lng ?? p.longitude ?? 0}-${p.name ?? ''}`,
    name: p.name || '',
    latitude: p.lat ?? p.latitude ?? 0,
    longitude: p.lng ?? p.longitude ?? 0,
    rating: typeof p.rating === 'number' ? p.rating : undefined,
    userRatingCount:
      typeof p.userRatingCount === 'number'
        ? p.userRatingCount
        : typeof p.user_ratings_total === 'number'
        ? p.user_ratings_total
        : undefined,
    vicinity: p.vicinity || p.formatted_address || '',
    openNow: p.openNow ?? p.opening_hours?.open_now,
  };
}

export async function tryBackendNearbyPlaces(
  center: { latitude: number; longitude: number },
  placeType: string,
  radius = 2500
): Promise<NearbyPlace[] | null> {
  try {
    const { data } = await apiClient.get('/api/maps/places', {
      params: {
        lat: center.latitude,
        lng: center.longitude,
        type: placeType,
        radius,
      },
    });

    if (data?.status && data.status !== 'OK') {
      return [];
    }

    const items: any[] = Array.isArray(data?.results)
      ? data.results
      : Array.isArray(data)
      ? data
      : [];

    return items.map(mapBackendPlace);
  } catch (e) {
    console.warn('Backend nearby places failed:', e);
    return null;
  }
}

export async function getNearbyPlaces(
  center: { latitude: number; longitude: number },
  placeType: string,
  radius = 2500
): Promise<NearbyPlace[]> {
  // 1. Vía principal: consulta a través del endpoint del backend EcoRuteando
  const backendResults = await tryBackendNearbyPlaces(center, placeType, radius);
  if (backendResults !== null) {
    return backendResults;
  }

  // 2. Si el backend no está disponible, no llamamos a la API Web de Places
  // directamente con Axios para evitar REQUEST_DENIED con la clave restringida a Android.
  console.warn('getNearbyPlaces: servicio no disponible.');
  return [];
}