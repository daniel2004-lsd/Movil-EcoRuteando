import test from 'node:test';
import assert from 'node:assert/strict';
import {
  validateApiUrl,
  getSafeBaseUrl,
  isLocalOrPrivateHost,
  isTrustedProductionHost,
  OFFICIAL_PRODUCTION_API_URL,
} from '../urlValidation.js';

test('isLocalOrPrivateHost detects local, IPv4 RFC1918, and IPv6 loopback addresses', () => {
  assert.equal(isLocalOrPrivateHost('localhost'), true);
  assert.equal(isLocalOrPrivateHost('127.0.0.1'), true);
  assert.equal(isLocalOrPrivateHost('::1'), true);
  assert.equal(isLocalOrPrivateHost('[::1]'), true);
  assert.equal(isLocalOrPrivateHost('10.3.234.116'), true);
  assert.equal(isLocalOrPrivateHost('192.168.1.50'), true);
  assert.equal(isLocalOrPrivateHost('172.20.10.2'), true);
  assert.equal(isLocalOrPrivateHost('fe80::1ff:fe00:3a60'), true);
  assert.equal(isLocalOrPrivateHost('ecoruteando-backend.onrender.com'), false);
  assert.equal(isLocalOrPrivateHost('api.ecoruteando.com'), false);
});

test('isTrustedProductionHost matches allowed production domains', () => {
  assert.equal(isTrustedProductionHost('ecoruteando-backend.onrender.com'), true);
  assert.equal(isTrustedProductionHost('ecoruteandobackend.onrender.com'), true);
  assert.equal(isTrustedProductionHost('api.ecoruteando.com'), true);
  assert.equal(isTrustedProductionHost('malicious-site.com'), false);
  assert.equal(isTrustedProductionHost('feeding-irrigation-milk-log.trycloudflare.com'), false);
});

test('validateApiUrl in production rejects plain HTTP URLs', () => {
  const result = validateApiUrl('http://10.3.234.116:3007', true);
  assert.equal(result.isValid, false);
  assert.match(result.error, /HTTPS/);
});

test('validateApiUrl in production rejects private IPs even with HTTPS', () => {
  const result = validateApiUrl('https://10.3.234.116:5124', true);
  assert.equal(result.isValid, false);
  assert.match(result.error, /locales y privadas/);
});

test('validateApiUrl in production accepts secure HTTPS domains', () => {
  const result = validateApiUrl('https://ecoruteando-backend.onrender.com', true);
  assert.equal(result.isValid, true);
  assert.equal(result.normalizedUrl, 'https://ecoruteando-backend.onrender.com');
});

test('validateApiUrl rejects URLs with embedded user credentials', () => {
  const result = validateApiUrl('https://admin:secret@ecoruteando.com', true);
  assert.equal(result.isValid, false);
  assert.match(result.error, /credenciales embebidas/);
});

test('validateApiUrl rejects malformed URLs and invalid ports', () => {
  assert.equal(validateApiUrl('not-a-valid-url', true).isValid, false);
  assert.equal(validateApiUrl('https://example.com:999999', true).isValid, false);
  assert.equal(validateApiUrl('', true).isValid, false);
  assert.equal(validateApiUrl('   ', true).isValid, false);
});

test('validateApiUrl normalizes protocol and host without corrupting legitimate paths, ports, or parameters', () => {
  const input = '  HTTPS://API.ECORUTEANDO.COM:8443/v1/api/?tenant=eco&filter=true#anchor  ';
  const result = validateApiUrl(input, true);
  assert.equal(result.isValid, true);
  assert.equal(
    result.normalizedUrl,
    'https://api.ecoruteando.com:8443/v1/api?tenant=eco&filter=true#anchor'
  );
});

test('validateApiUrl in development allows http local development', () => {
  const result = validateApiUrl('http://10.3.234.116:5124', false);
  assert.equal(result.isValid, true);
  assert.equal(result.normalizedUrl, 'http://10.3.234.116:5124');
});

test('getSafeBaseUrl in production: custom HTTP URL is rejected and valid HTTPS fallback is used', () => {
  const fallback = 'https://ecoruteando-backend.onrender.com';
  const safe = getSafeBaseUrl('http://10.3.234.116:3007', fallback, true);
  assert.equal(safe, fallback);
});

test('getSafeBaseUrl in production: valid HTTPS custom URL is accepted', () => {
  const fallback = 'https://ecoruteando-backend.onrender.com';
  const custom = 'https://staging-backend.onrender.com';
  const safe = getSafeBaseUrl(custom, fallback, true);
  assert.equal(safe, custom);
});

test('getSafeBaseUrl in production: invalid custom URL with valid HTTPS fallback uses validated fallback', () => {
  const fallback = 'https://ecoruteando-backend.onrender.com';
  const safe = getSafeBaseUrl('invalid-custom-url', fallback, true);
  assert.equal(safe, fallback);
});

test('getSafeBaseUrl in production: HTTP fallback is NEVER returned and throws error', () => {
  const insecureFallback = 'http://10.3.234.116:5124';
  assert.throws(
    () => getSafeBaseUrl(null, insecureFallback, true),
    /H-17/
  );
  assert.throws(
    () => getSafeBaseUrl('http://insecure-custom.com', insecureFallback, true),
    /H-17/
  );
});

test('getSafeBaseUrl in production: custom URL and fallback both invalid fails closed', () => {
  assert.throws(
    () => getSafeBaseUrl('bad-custom', 'bad-fallback', true),
    /H-17/
  );
  assert.throws(
    () => getSafeBaseUrl('', '', true),
    /H-17/
  );
  assert.throws(
    () => getSafeBaseUrl('https://admin:pass@bad.com', 'http://127.0.0.1:3000', true),
    /H-17/
  );
});

test('getSafeBaseUrl in development: supports local HTTP workflow', () => {
  const localCustom = 'http://10.3.234.116:5124';
  const localFallback = 'http://localhost:5124';

  assert.equal(getSafeBaseUrl(localCustom, localFallback, false), localCustom);
  assert.equal(getSafeBaseUrl(null, localFallback, false), localFallback);
  assert.equal(getSafeBaseUrl('invalid-url', localFallback, false), localFallback);
});
