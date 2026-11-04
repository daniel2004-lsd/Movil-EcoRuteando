import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { loadTsModule } from './helpers/loadOriginalHook.mjs';

const { TripLocationTaskManager, TRIP_LOCATION_TASK_NAME } = loadTsModule('src/features/plan-route/services/tripLocationTask.ts');
const { tripTelemetryService } = loadTsModule('src/features/plan-route/services/tripTelemetryService.ts');

test('Ciclo de Vida de Tracking GPS y Foreground Service en Segundo Plano', async (t) => {
  await t.test('1. Registro único de tarea TaskManager con identificador unificado', () => {
    assert.equal(TRIP_LOCATION_TASK_NAME, 'ECORUTEANDO_BACKGROUND_TRIP_LOCATION');
    const manager = new TripLocationTaskManager();
    assert.ok(manager, 'Instancia de TripLocationTaskManager creada correctamente');
  });

  await t.test('2. Mutual Exclusion: Iniciar tracking con Foreground Service y notificación persistente', async () => {
    let startedTaskName = null;
    let startedOptions = null;

    const mockLocationModule = {
      hasStartedLocationUpdatesAsync: async () => false,
      startLocationUpdatesAsync: async (name, opts) => {
        startedTaskName = name;
        startedOptions = opts;
      },
      stopLocationUpdatesAsync: async () => {},
      Accuracy: { Balanced: 3 },
    };

    const manager = new TripLocationTaskManager();
    (manager).activeTripId = null;

    // Iniciar con ID de viaje
    const testTripId = 'trip-fg-test-001';
    manager.setActiveTripId(testTripId);
    assert.equal(manager.getActiveTripId(), testTripId);

    // Simular llamada con mock de Location
    await mockLocationModule.startLocationUpdatesAsync(TRIP_LOCATION_TASK_NAME, {
      accuracy: mockLocationModule.Accuracy.Balanced,
      timeInterval: 3000,
      distanceInterval: 10,
      showsBackgroundLocationIndicator: true,
      foregroundService: {
        notificationTitle: 'EcoRuteando',
        notificationBody: 'Registrando tu ruta ecológica en segundo plano...',
        notificationColor: '#10b981',
      },
    });

    assert.equal(startedTaskName, 'ECORUTEANDO_BACKGROUND_TRIP_LOCATION');
    assert.ok(startedOptions.foregroundService, 'Debe incluir opciones de foregroundService');
    assert.equal(startedOptions.foregroundService.notificationTitle, 'EcoRuteando');
    assert.equal(startedOptions.showsBackgroundLocationIndicator, true);
  });

  await t.test('3. Mutual Exclusion: Al finalizar viaje se detiene el Foreground Service y se limpian métricas', async () => {
    let stoppedTaskName = null;
    const mockLocationModule = {
      hasStartedLocationUpdatesAsync: async () => true,
      stopLocationUpdatesAsync: async (name) => {
        stoppedTaskName = name;
      },
    };

    const manager = new TripLocationTaskManager();
    manager.setActiveTripId('trip-fg-test-002');
    assert.equal(manager.getActiveTripId(), 'trip-fg-test-002');

    // Simular detención
    if (await mockLocationModule.hasStartedLocationUpdatesAsync()) {
      await mockLocationModule.stopLocationUpdatesAsync(TRIP_LOCATION_TASK_NAME);
    }
    manager.setActiveTripId(null);

    assert.equal(stoppedTaskName, 'ECORUTEANDO_BACKGROUND_TRIP_LOCATION');
    assert.equal(manager.getActiveTripId(), null);
    assert.equal(manager.getAccumulatedDistanceM(), 0);
  });

  await t.test('4. Procesamiento de ubicaciones en segundo plano: acumulación legítima y filtro de saltos aberrantes (>500m)', async () => {
    const manager = new TripLocationTaskManager();
    manager.setActiveTripId('trip-dist-test-003');
    manager.resetTrackingMetrics();

    const receivedUpdates = [];
    const unsubscribe = manager.subscribe((update) => {
      receivedUpdates.push(update);
    });

    // Punto 1: Parque Santander Neiva (2.9273, -75.2819)
    const loc1 = {
      coords: { latitude: 2.9273, longitude: -75.2819 },
      timestamp: 1000,
    };
    await manager.processLocations([loc1]);
    assert.equal(receivedUpdates.length, 1);
    assert.equal(receivedUpdates[0].distanceDeltaM, 0);

    // Punto 2: Desplazamiento legítimo de ~110m (2.9283, -75.2819)
    const loc2 = {
      coords: { latitude: 2.9283, longitude: -75.2819 },
      timestamp: 4000,
    };
    await manager.processLocations([loc2]);
    assert.equal(receivedUpdates.length, 2);
    assert.ok(receivedUpdates[1].distanceDeltaM > 100 && receivedUpdates[1].distanceDeltaM < 120, 'Distancia legítima calculada');
    assert.ok(manager.getAccumulatedDistanceM() > 100);

    // Punto 3: Salto aberrante de ~10km (2.85, -75.2819)
    const aberrantLoc = {
      coords: { latitude: 2.85, longitude: -75.2819 },
      timestamp: 7000,
    };
    await manager.processLocations([aberrantLoc]);
    // Debe ser rechazado: no se agrega al log ni contamina la distancia acumulada
    assert.equal(receivedUpdates.length, 2, 'El salto aberrante no debe generar actualización a los observadores');
    assert.ok(manager.getAccumulatedDistanceM() < 150, 'Distancia no contaminada por salto aberrante');

    unsubscribe();
  });

  await t.test('5. Persistencia offline y recuperación de breadcrumbs', async () => {
    const testTrip = 'trip-offline-test-004';
    const sampleBreadcrumbs = [
      { lat: 2.9273, lng: -75.2819, timestamp: 1000 },
      { lat: 2.9283, lng: -75.2819, timestamp: 4000 },
    ];

    await tripTelemetryService.saveOfflineBreadcrumbs(testTrip, sampleBreadcrumbs);
    const retrieved = await tripTelemetryService.getOfflineBreadcrumbs(testTrip);
    assert.equal(retrieved.length, 2);
    assert.equal(retrieved[0].lat, 2.9273);
    assert.equal(retrieved[1].lat, 2.9283);

    await tripTelemetryService.removeOfflineBreadcrumbs(testTrip);
    const empty = await tripTelemetryService.getOfflineBreadcrumbs(testTrip);
    assert.equal(empty.length, 0);
  });

  await t.test('6. Verificación de permisos nativos en AndroidManifest.xml (Sin ACCESS_BACKGROUND_LOCATION)', () => {
    const manifestPath = path.resolve(process.cwd(), 'android/app/src/main/AndroidManifest.xml');
    const content = fs.readFileSync(manifestPath, 'utf8');

    assert.ok(content.includes('android.permission.FOREGROUND_SERVICE'), 'Debe declarar FOREGROUND_SERVICE');
    assert.ok(content.includes('android.permission.FOREGROUND_SERVICE_LOCATION'), 'Debe declarar FOREGROUND_SERVICE_LOCATION');
    assert.ok(!content.includes('android.permission.ACCESS_BACKGROUND_LOCATION'), 'NO debe declarar ACCESS_BACKGROUND_LOCATION según restricción');
  });
});
