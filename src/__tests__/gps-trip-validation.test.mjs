import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

test('Mobile GPS Validation: plan-route.tsx eliminates fallback and sends real evidence', () => {
  const planRoutePath = path.resolve('app/(tabs)/plan-route.tsx');
  const content = fs.readFileSync(planRoutePath, 'utf8');

  // Verifica que se eliminó el fallback de planKm
  assert.ok(
    !content.includes('finalDistKm = useReal ? Number(realDistKm.toFixed(2)) : planKm;'),
    'El fallback permisivo planKm debe estar eliminado'
  );

  // Verifica que la recolección de breadcrumbs está presente
  assert.ok(
    content.includes('gpsBreadcrumbsRef.current'),
    'gpsBreadcrumbsRef debe almacenar la evidencia'
  );

  // Verifica que envía gpsDataJson
  assert.ok(
    content.includes('gpsDataJson'),
    'completeTrip debe enviar gpsDataJson al backend'
  );
});

test('Mobile GPS Validation: trips.ts includes offline queue and telemetry', () => {
  const tripsPath = path.resolve('src/services/trips.ts');
  const content = fs.readFileSync(tripsPath, 'utf8');

  assert.ok(content.includes('GpsBreadcrumb'), 'GpsBreadcrumb interface debe estar definida');
  assert.ok(content.includes('syncOfflineTrips'), 'syncOfflineTrips debe existir para reintento de red');
  assert.ok(content.includes('@ecoruteando_pending_completed_trips'), 'Cola offline debe estar configurada');
});

test('Dashboard: EcoPoints is completely removed from mobile home stats', () => {
  const indexPath = path.resolve('app/(tabs)/index.tsx');
  const content = fs.readFileSync(indexPath, 'utf8');

  assert.ok(!content.includes('ecoPoints:'), 'Home stats no debe consumir ecoPoints');
});
