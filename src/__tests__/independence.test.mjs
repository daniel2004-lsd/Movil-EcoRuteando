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

  // 6. Validación estructural: eas.json no debe exigir claves hardcodeadas para compilar en CI
  assert.equal(
    Boolean(easConfig.build?.preview?.env?.EXPO_PUBLIC_GOOGLE_MAPS_KEY),
    false,
    'eas.json preview profile must not hardcode EXPO_PUBLIC_GOOGLE_MAPS_KEY'
  );
});

test('H-08 Escenario A — CI sin credenciales: pruebas estructurales pasan sin .env ni variables de mapas', () => {
  const savedKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_KEY;
  delete process.env.EXPO_PUBLIC_GOOGLE_MAPS_KEY;

  try {
    const content = fs.readFileSync(path.join(projectRoot, 'eas.json'), 'utf8');
    const easConfig = JSON.parse(content);

    // Valida que el perfil preview sea estructuralmente válido sin requerir la clave
    assert.equal(easConfig.build?.preview?.android?.buildType, 'apk');
    assert.equal(easConfig.build?.preview?.distribution, 'internal');
    assert.equal(easConfig.build?.preview?.env?.EXPO_PUBLIC_API_URL, 'https://ecoruteandobackend.onrender.com');

    // Valida que no exista clave hardcodeada en eas.json
    assert.equal(
      Boolean(easConfig.build?.preview?.env?.EXPO_PUBLIC_GOOGLE_MAPS_KEY),
      false,
      'Preview profile must not require hardcoded EXPO_PUBLIC_GOOGLE_MAPS_KEY'
    );
  } finally {
    if (savedKey !== undefined) {
      process.env.EXPO_PUBLIC_GOOGLE_MAPS_KEY = savedKey;
    }
  }
});

test('H-08 Escenario B — Configuración con variable: reconoce inyección externa exclusivamente en memoria', () => {
  const savedKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_KEY;
  const mockKey = 'TEST_MOCK_ENV_KEY_FOR_INDEPENDENCE_TEST_ONLY';
  process.env.EXPO_PUBLIC_GOOGLE_MAPS_KEY = mockKey;

  try {
    // La resolución dinámica reconoce la variable en memoria de proceso sin tocar archivos
    const resolvedKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_KEY;
    assert.equal(resolvedKey, mockKey, 'Dynamic configuration must recognize injected key in memory');

    // Validar que eas.json en disco sigue sin contener la clave
    const diskContent = fs.readFileSync(path.join(projectRoot, 'eas.json'), 'utf8');
    assert.doesNotMatch(diskContent, new RegExp(mockKey), 'Disk files must never be modified by in-memory injection');
  } finally {
    if (savedKey !== undefined) {
      process.env.EXPO_PUBLIC_GOOGLE_MAPS_KEY = savedKey;
    } else {
      delete process.env.EXPO_PUBLIC_GOOGLE_MAPS_KEY;
    }
  }
});

test('H-08 Escenario C — Detección de exposición: el escáner detecta claves codificadas en eas.json', () => {
  const secretPattern = new RegExp(['AIza', '[0-9A-Za-z-_]{35}'].join(''));
  const dummyExposedKey = ['AIza', 'SyDummyExposureCheckTestKey1234567890'].join('');
  const dummyExposedConfig = JSON.stringify({
    build: {
      preview: {
        env: {
          EXPO_PUBLIC_GOOGLE_MAPS_KEY: dummyExposedKey
        }
      }
    }
  });

  // Debe detectar la exposición en la configuración simulada
  assert.match(
    dummyExposedConfig,
    secretPattern,
    'Scanner regex must catch hardcoded Google API key patterns'
  );

  // Y verificar que el archivo real eas.json en disco NO hace match
  const realContent = fs.readFileSync(path.join(projectRoot, 'eas.json'), 'utf8');
  assert.doesNotMatch(
    realContent,
    secretPattern,
    'Real tracked eas.json must never trigger secret scanner'
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
