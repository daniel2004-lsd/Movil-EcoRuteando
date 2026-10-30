import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../../');

test('apiClient: Production URL and customApiUrl purge', () => {
  const apiClientPath = path.join(projectRoot, 'src/shared/services/apiClient.ts');
  const content = fs.readFileSync(apiClientPath, 'utf8');

  // Must define validated production backend URL
  assert.match(content, /https:\/\/ecoruteandobackend\.onrender\.com/);

  // Must ensure !__DEV__ uses PRODUCTION_API_URL
  assert.match(content, /!__DEV__\s*\?\s*PRODUCTION_API_URL/);

  // Must purge any legacy customApiUrl from SecureStore
  assert.match(content, /deleteItemAsync\(['"]customApiUrl['"]\)/);

  // Must NOT assign config.baseURL = customUrl
  assert.doesNotMatch(content, /config\.baseURL\s*=\s*customUrl/);
});

test('login.tsx: Server configuration modal and button are removed', () => {
  const loginPath = path.join(projectRoot, 'app/(auth)/login.tsx');
  const content = fs.readFileSync(loginPath, 'utf8');

  assert.doesNotMatch(content, /showServerModal/);
  assert.doesNotMatch(content, /serverUrlInput/);
  assert.doesNotMatch(content, /handleTestConnection/);
  assert.doesNotMatch(content, /handleSaveServerUrl/);
  assert.doesNotMatch(content, /Configurar servidor/);
  assert.doesNotMatch(content, /serverBtn/);
});

test('MapEngine.tsx: Base map displays without requiring location permission', () => {
  const mapEnginePath = path.join(projectRoot, 'src/components/maps/MapEngine.tsx');
  const content = fs.readFileSync(mapEnginePath, 'utf8');

  // Must check Location.getForegroundPermissionsAsync
  assert.match(content, /Location\.getForegroundPermissionsAsync/);

  // Must sanitize showsUserLocation based on permission
  assert.match(content, /showsUserLocation:\s*Boolean\(props\.showsUserLocation\s*&&\s*hasLocationPermission\)/);

  // Must have DEFAULT_REGION fallback
  assert.match(content, /DEFAULT_REGION/);
});

test('plan-route.tsx: Does not block users with location permission error on mount', () => {
  const planRoutePath = path.join(projectRoot, 'app/(tabs)/plan-route.tsx');
  const content = fs.readFileSync(planRoutePath, 'utf8');

  // Mount effect calls getCurrentLocation(true) (silent mode)
  assert.match(content, /getCurrentLocation\(true\)/);

  // getCurrentLocation supports silent parameter to avoid alert
  assert.match(content, /const getCurrentLocation = async \(\s*silent\s*=\s*false\s*\)/);
});

test('android/app/build.gradle: Dynamically resolves MAPS_API_KEY from env / .env without hardcoding', () => {
  const gradlePath = path.join(projectRoot, 'android/app/build.gradle');
  const content = fs.readFileSync(gradlePath, 'utf8');

  assert.match(content, /def getGoogleMapsApiKey\(\)/);
  assert.match(content, /MAPS_API_KEY:\s*getGoogleMapsApiKey\(\)/);

  // Must not hardcode AIza... into build.gradle
  assert.doesNotMatch(content, /AIzaSy/);
});
