import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../../');

test('apiClient.ts: Configures 45s timeout for backend cold-start tolerance', () => {
  const content = fs.readFileSync(
    path.join(projectRoot, 'src/shared/services/apiClient.ts'),
    'utf8'
  );

  assert.match(content, /timeout:\s*45000/);
});

test('googleMaps.ts: searchPlaces and getPlaceDetails integrate backend geocode and cache', () => {
  const content = fs.readFileSync(
    path.join(projectRoot, 'src/services/maps/googleMaps.ts'),
    'utf8'
  );

  // Must define backendGeocodeCache
  assert.match(content, /const backendGeocodeCache = new Map<string, PlaceDetail>\(\)/);

  // Must export tryBackendGeocode querying /api/maps/geocode
  assert.match(content, /apiClient\.get\(['"]\/api\/maps\/geocode['"]/);
  assert.match(content, /export async function tryBackendGeocode/);

  // searchPlaces must try backend geocode first
  assert.match(content, /await tryBackendGeocode\(query\)/);

  // getPlaceDetails must check backendGeocodeCache
  assert.match(content, /backendGeocodeCache\.has\(placeId\)/);
});

test('googleMaps.ts: tryBackendDirections skips unauthenticated 401 calls without accessToken', () => {
  const content = fs.readFileSync(
    path.join(projectRoot, 'src/services/maps/googleMaps.ts'),
    'utf8'
  );

  // Must check accessToken before invoking /api/maps/directions
  assert.match(content, /SecureStore\.getItemAsync\(['"]accessToken['"]\)/);
});

test('googleMaps.ts: Avoids incompatible REST fallback when key is restricted to Android SDK', () => {
  const content = fs.readFileSync(
    path.join(projectRoot, 'src/services/maps/googleMaps.ts'),
    'utf8'
  );

  // searchPlaces must check hasWebCompatibleKey before invoking Axios
  assert.match(content, /const hasWebCompatibleKey = Boolean\(process\.env\.EXPO_PUBLIC_GOOGLE_MAPS_WEB_KEY\)/);
  assert.match(content, /if\s*\(!hasWebCompatibleKey\)\s*\{\s*return\s*\[\];\s*\}/);

  // getPlaceDetails must also guard against incompatible key
  assert.match(content, /if\s*\(!hasWebCompatibleKey\)\s*\{\s*return\s*null;\s*\}/);
});

test('googleMaps.ts: tryBackendGeocode requires accessToken and handles errors cleanly', () => {
  const content = fs.readFileSync(
    path.join(projectRoot, 'src/services/maps/googleMaps.ts'),
    'utf8'
  );

  // Must verify accessToken before making request
  assert.match(content, /const token = await SecureStore\.getItemAsync\(['"]accessToken['"]\);\s*if\s*\(!token\)\s*return\s*\[\];/);

  // Must handle errors cleanly without exposing secrets
  assert.match(content, /console\.warn\(['"]Backend geocode failed:['"],\s*e\);/);
});

test('eas.json: Preview build profile includes EXPO_PUBLIC_GOOGLE_MAPS_KEY and EXPO_PUBLIC_API_URL', () => {
  const content = fs.readFileSync(
    path.join(projectRoot, 'eas.json'),
    'utf8'
  );
  const easConfig = JSON.parse(content);

  assert.equal(
    easConfig.build?.preview?.env?.EXPO_PUBLIC_API_URL,
    'https://ecoruteandobackend.onrender.com'
  );
  assert.ok(
    easConfig.build?.preview?.env?.EXPO_PUBLIC_GOOGLE_MAPS_KEY,
    'preview profile must define EXPO_PUBLIC_GOOGLE_MAPS_KEY'
  );
});

test('MapEngine.tsx: Configures googleRenderer LEGACY for Mali GPU and HONOR compatibility', () => {
  const content = fs.readFileSync(
    path.join(projectRoot, 'src/components/maps/MapEngine.tsx'),
    'utf8'
  );

  assert.match(
    content,
    /googleRenderer:\s*['"]LEGACY['"]/,
    'MapEngine must configure googleRenderer LEGACY'
  );
});
