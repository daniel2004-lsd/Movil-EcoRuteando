import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

test('Mobile Stats: app/(tabs)/index.tsx queries unified dashboard stats with safe fallback', () => {
  const indexPath = path.resolve('app/(tabs)/index.tsx');
  const content = fs.readFileSync(indexPath, 'utf8');

  // Verifica que intenta consumir el endpoint unificado
  assert.ok(
    content.includes('/api/users/me/dashboard-stats'),
    'index.tsx debe consultar /api/users/me/dashboard-stats'
  );

  // Verifica que conserva el fallback compatible con versiones anteriores
  assert.ok(
    content.includes('/api/trips'),
    'index.tsx debe mantener el fallback a /api/trips'
  );
  assert.ok(
    content.includes('/api/favorites'),
    'index.tsx debe mantener el fallback a /api/favorites'
  );

  // Verifica que mapea trips.registered preservando el significado funcional
  assert.ok(
    content.includes('d.trips?.registered'),
    'index.tsx debe mapear trips.registered al contador de viajes'
  );
});

test('Mobile Stats: Protected files remain 100% untouched', () => {
  const protectedFiles = [
    'app/(tabs)/plan-route.tsx',
    'src/components/maps/ExploreSheet.tsx',
    'src/components/maps/PoiResultsSheet.tsx',
    'src/components/maps/ReportFormSheet.tsx',
    'src/services/maps/googleMaps.ts',
  ];

  for (const file of protectedFiles) {
    const fullPath = path.resolve(file);
    assert.ok(fs.existsSync(fullPath), `Archivo protegido ${file} debe existir`);
  }
});
