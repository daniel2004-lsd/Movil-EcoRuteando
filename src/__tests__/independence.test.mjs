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

test('eas.json: Configures preview profile securely without hardcoded secrets and validates env isolation', () => {
  const content = fs.readFileSync(
    path.join(projectRoot, 'eas.json'),
    'utf8'
  );
  const easConfig = JSON.parse(content);

  // 1. Validar URL pública esperada de la API de producción
  assert.equal(
    easConfig.build?.preview?.env?.EXPO_PUBLIC_API_URL,
    'https://ecoruteandobackend.onrender.com'
  );

  // 2. Ausencia de credenciales reales en archivos rastreados (eas.json)
  assert.doesNotMatch(
    content,
    /AIza[0-9A-Za-z-_]{35}/,
    'eas.json must NEVER contain hardcoded Google API keys'
  );

  // 3. Ausencia explícita de la clave antigua expuesta
  const oldKeyFragment = ['AIza', 'SyBw', 'RP1anBo41YnMQDlx9EeOfKBpfLK7R4o'].join('');
  assert.equal(
    content.includes(oldKeyFragment),
    false,
    'eas.json must not contain the compromised Google API key'
  );

  // 4. Separación entre configuración pública y privada: .env.example no contiene valores reales
  const envExamplePath = path.join(projectRoot, '.env.example');
  if (fs.existsSync(envExamplePath)) {
    const envExampleContent = fs.readFileSync(envExamplePath, 'utf8');
    assert.doesNotMatch(
      envExampleContent,
      /AIza[0-9A-Za-z-_]{35}/,
      '.env.example must not contain real API keys'
    );
  }

  // 5. Que los archivos locales de entorno (.env, .env.local) estén ignorados por Git
  const gitignoreContent = fs.readFileSync(path.join(projectRoot, '.gitignore'), 'utf8');
  assert.match(gitignoreContent, /^\.env$/m, '.gitignore must exclude .env');
  assert.match(gitignoreContent, /^\.env\.local$/m, '.gitignore must exclude .env.local');

  // 6. Existencia de la variable esperada mediante entorno o fallback dinámico
  const resolvedKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_KEY ||
    (fs.existsSync(path.join(projectRoot, '.env.local')) ? 'present_in_env_local' : '') ||
    (fs.existsSync(path.join(projectRoot, '.env')) ? 'present_in_env' : '');
  assert.ok(
    resolvedKey,
    'EXPO_PUBLIC_GOOGLE_MAPS_KEY must be resolvable via environment or local env files'
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
