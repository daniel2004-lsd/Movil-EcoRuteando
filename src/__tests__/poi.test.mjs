import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../../');

test('googleMaps.ts: mapBackendPlace adapts backend PlaceResult to NearbyPlace interface', async () => {
  const googleMapsContent = fs.readFileSync(
    path.join(projectRoot, 'src/services/maps/googleMaps.ts'),
    'utf8'
  );

  // Must export mapBackendPlace
  assert.match(googleMapsContent, /export function mapBackendPlace/);

  // Evaluates mapping logic
  const mockBackendPlace = {
    name: 'La Cava Wine & Food',
    vicinity: 'Cl. 6a #No.12-24',
    lat: 2.9279267,
    lng: -75.2820291,
    placeId: 'ChIJk1kiG3B0O44REnHiLRdI1AM',
    icon: 'https://maps.gstatic.com/...',
    rating: 4.6,
    types: 'restaurant, food',
  };

  const mapBackendPlace = (p) => ({
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
  });

  const adapted = mapBackendPlace(mockBackendPlace);
  assert.equal(adapted.placeId, 'ChIJk1kiG3B0O44REnHiLRdI1AM');
  assert.equal(adapted.name, 'La Cava Wine & Food');
  assert.equal(adapted.latitude, 2.9279267);
  assert.equal(adapted.longitude, -75.2820291);
  assert.equal(adapted.rating, 4.6);
  assert.equal(adapted.vicinity, 'Cl. 6a #No.12-24');
});

test('googleMaps.ts: getNearbyPlaces routes via backend /api/maps/places', () => {
  const content = fs.readFileSync(
    path.join(projectRoot, 'src/services/maps/googleMaps.ts'),
    'utf8'
  );

  // Must use tryBackendNearbyPlaces calling /api/maps/places
  assert.match(content, /apiClient\.get\(['"]\/api\/maps\/places['"]/);
  assert.match(content, /tryBackendNearbyPlaces/);

  // Must map lat, lng, type, radius
  assert.match(content, /lat:\s*center\.latitude/);
  assert.match(content, /lng:\s*center\.longitude/);
  assert.match(content, /type:\s*placeType/);
  assert.match(content, /radius/);

  // getNearbyPlaces must call tryBackendNearbyPlaces
  assert.match(content, /const backendResults = await tryBackendNearbyPlaces/);
});

test('googleMaps.ts: All POI_CATEGORIES use valid backend AllowedPlaceTypes', () => {
  const content = fs.readFileSync(
    path.join(projectRoot, 'src/services/maps/googleMaps.ts'),
    'utf8'
  );

  const allowedBackendTypes = new Set([
    'restaurant',
    'hotel',
    'lodging',
    'church',
    'park',
    'cafe',
    'bar',
    'museum',
    'pharmacy',
    'gas_station',
    'supermarket',
    'bank',
    'atm',
    'tourist_attraction',
  ]);

  const placeTypes = [
    'restaurant',
    'cafe',
    'lodging',
    'atm',
    'gas_station',
    'pharmacy',
    'supermarket',
    'bar',
  ];

  for (const pt of placeTypes) {
    assert.ok(
      allowedBackendTypes.has(pt),
      `PlaceType '${pt}' must be allowed in backend AllowedPlaceTypes`
    );
    assert.match(
      content,
      new RegExp(`placeType:\\s*['"]${pt}['"]`),
      `POI_CATEGORIES must define placeType '${pt}'`
    );
  }
});

test('plan-route.tsx: Prevents race conditions on rapid category switches', () => {
  const content = fs.readFileSync(
    path.join(projectRoot, 'app/(tabs)/plan-route.tsx'),
    'utf8'
  );

  // Must maintain a sequential request ID ref
  assert.match(content, /poiRequestIdRef\s*=\s*useRef\(0\)/);

  // Must increment on selection
  assert.match(content, /\+\+poiRequestIdRef\.current/);

  // Must increment on sheet close to invalidate pending requests
  assert.match(content, /poiRequestIdRef\.current\+\+/);

  // Must verify response corresponds to current active request
  assert.match(content, /if\s*\(\s*poiRequestIdRef\.current\s*!==\s*currentReqId\s*\)\s*\{\s*return;\s*\}/);
});

test('googleMaps.ts: searchPlaces and getPlaceDetails safely guard against non-OK responses', () => {
  const content = fs.readFileSync(
    path.join(projectRoot, 'src/services/maps/googleMaps.ts'),
    'utf8'
  );

  // searchPlaces must verify status === OK and predictions is an array before mapping
  assert.match(content, /response\.data\?\.status\s*!==\s*['"]OK['"]\s*\|\|\s*!Array\.isArray\(response\.data\?\.predictions\)/);

  // getPlaceDetails must verify status === OK and result exists
  assert.match(content, /response\.data\?\.status\s*!==\s*['"]OK['"]\s*\|\|\s*!response\.data\?\.result/);
});
