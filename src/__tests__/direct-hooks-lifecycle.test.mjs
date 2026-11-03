import test from 'node:test';
import assert from 'node:assert/strict';
import { renderHook, act } from './helpers/hookTestHarness.mjs';
import { loadOriginalHook } from './helpers/loadOriginalHook.mjs';

// ==============================================================================
// DIRECT LIFECYCLE SUITE: EXECUTING THE 6 ORIGINAL TYPESCRIPT HOOK FILES
// ==============================================================================

test('Direct Hook 1: useRoutePlanning.ts (Original TS file mount, update, unmount)', async () => {
  const { useRoutePlanning } = loadOriginalHook('useRoutePlanning.ts');
  assert.equal(typeof useRoutePlanning, 'function', 'useRoutePlanning debe ser una función exportada');

  let clearedCalled = false;
  const harness = renderHook((props) => useRoutePlanning(props), {
    initialProps: {
      t: (k) => k,
      onRouteCleared: () => { clearedCalled = true; },
    },
  });

  // 1. Verificación de montaje
  assert.equal(harness.result.current.mode, 'driving');
  assert.equal(harness.result.current.origin, null);
  assert.equal(harness.result.current.destination, null);
  assert.equal(harness.result.current.loading, false);
  assert.equal(harness.result.current.route, null);

  // 2. Verificación de actualización de estado
  await act(() => harness.result.current.setMode('bicycling'));
  assert.equal(harness.result.current.mode, 'bicycling');

  await act(() => harness.result.current.clearOrigin());
  assert.equal(harness.result.current.origin, null);

  // 3. Verificación de desmontaje limpio
  harness.unmount();
  assert.equal(harness.isMounted, false);
});

test('Direct Hook 2: useTurnByTurnNavigation.ts (Original TS file mount, effect, update, unmount)', async () => {
  let speechStopCount = 0;
  const { useTurnByTurnNavigation } = loadOriginalHook('useTurnByTurnNavigation.ts', {
    'expo-speech': {
      stop: async () => { speechStopCount++; },
      speak: () => {},
    },
  });

  let arrivedTriggered = false;
  const harness = renderHook((props) => useTurnByTurnNavigation(props), {
    initialProps: {
      route: null,
      destination: null,
      t: (k) => k,
      onArrived: () => { arrivedTriggered = true; },
    },
  });

  // 1. Verificación de montaje y estado inicial
  assert.equal(harness.result.current.currentStepIndex, 0);
  assert.equal(harness.result.current.arrived, false);
  assert.equal(harness.result.current.voiceOn, true);

  // 2. Verificación de actualización interactiva
  await act(() => harness.result.current.toggleVoice());
  assert.equal(harness.result.current.voiceOn, false);
  assert.ok(speechStopCount >= 1, 'Debe haber invocado Speech.stop()');

  // 3. Verificación de re-render y efecto de cambio de ruta
  const newRoute = { steps: [{ instruction: 'Siga derecho', endLocation: { latitude: 2.9, longitude: -75.2 } }] };
  await act(() => harness.rerender({ route: newRoute, destination: null, t: (k) => k }));
  assert.equal(harness.result.current.currentStepIndex, 0);

  // 4. Verificación de desmontaje
  harness.unmount();
  assert.equal(harness.isMounted, false);
});

test('Direct Hook 3: useUserLocationTracking.ts (Original TS file mount, tracking, unmount)', async () => {
  let reportedPositions = [];
  const { useUserLocationTracking } = loadOriginalHook('useUserLocationTracking.ts');

  const harness = renderHook((props) => useUserLocationTracking(props), {
    initialProps: {
      activeTripId: null,
      onPositionUpdate: (p) => { reportedPositions.push(p); },
    },
  });

  // 1. Verificación de montaje
  assert.equal(harness.result.current.userPos, null);

  // 2. Verificación de actualización de posición sin viaje
  await act(() => harness.result.current.handlePosition({ latitude: 2.9273, longitude: -75.2819 }));
  assert.ok(harness.result.current.userPos);
  assert.equal(harness.result.current.userPos.latitude, 2.9273);
  assert.equal(reportedPositions.length, 1);

  // 3. Verificación de limpieza
  await act(() => harness.result.current.clearTripTracking());

  // 4. Desmontaje
  harness.unmount();
  assert.equal(harness.isMounted, false);
});

test('Direct Hook 4: useTripLifecycle.ts (Original TS file mount, hydration effect, unmount)', async () => {
  let favEndpointCalled = false;
  const { useTripLifecycle } = loadOriginalHook('useTripLifecycle.ts', {
    apiClient: {
      __esModule: true,
      default: {
        get: async (url) => {
          if (url === '/api/favorites') favEndpointCalled = true;
          return { data: [{ routeId: 'fav-123' }] };
        },
      },
    },
  });

  const traveledDistMRef = { current: 0 };
  const gpsBreadcrumbsRef = { current: [] };
  const lastTrackPosRef = { current: null };

  const harness = renderHook((props) => useTripLifecycle(props), {
    initialProps: {
      t: (k) => k,
      router: { push: () => {} },
      route: null,
      origin: null,
      destination: null,
      mode: 'driving',
      estimate: null,
      traveledDistMRef,
      gpsBreadcrumbsRef,
      lastTrackPosRef,
    },
  });

  // 1. Verificación de montaje
  assert.equal(harness.result.current.activeTripId, null);
  assert.equal(harness.result.current.startingTrip, false);
  assert.equal(harness.result.current.completing, false);

  // 2. Efecto de hidratación en montaje
  await new Promise(r => setTimeout(r, 20));
  assert.equal(favEndpointCalled, true, 'El efecto de montaje debe haber invocado el endpoint de favoritos');

  // 3. Intento de inicio sin ruta: guard de datos faltantes
  await act(() => harness.result.current.startTripFlowWith());
  assert.equal(harness.result.current.activeTripId, null);

  // 4. Desmontaje
  harness.unmount();
  assert.equal(harness.isMounted, false);
});

test('Direct Hook 5: useMapPoiManager.ts (Original TS file mount, category switch, unmount)', async () => {
  let nearbyPlacesRequested = false;
  const { useMapPoiManager } = loadOriginalHook('useMapPoiManager.ts', {
    googleMaps: {
      getNearbyPlaces: async () => {
        nearbyPlacesRequested = true;
        return [{ placeId: 'poi-1', name: 'Gasolinera' }];
      },
    },
  });

  const harness = renderHook((props) => useMapPoiManager(props), {
    initialProps: {
      getCenterCoords: () => ({ latitude: 2.9273, longitude: -75.2819 }),
      pickingStop: false,
    },
  });

  // 1. Verificación de montaje
  assert.equal(harness.result.current.activePoiCategory, null);
  assert.deepEqual(harness.result.current.poiPlaces, []);
  assert.equal(harness.result.current.loadingPois, false);

  // 2. Cambio de categoría
  const cat = { id: 'estaciones', placeType: 'estaciones' };
  await act(async () => {
    await harness.result.current.handlePoiCategory(cat);
  });

  assert.equal(nearbyPlacesRequested, true);
  assert.equal(harness.result.current.activePoiCategory.id, 'estaciones');
  assert.equal(harness.result.current.poiPlaces.length, 1);

  // 3. Cierre de hoja
  await act(() => harness.result.current.closePoiSheet());
  assert.equal(harness.result.current.activePoiCategory, null);
  assert.equal(harness.result.current.poiPlaces.length, 0);

  // 4. Desmontaje
  harness.unmount();
  assert.equal(harness.isMounted, false);
});

test('Direct Hook 6: useCommunityReports.ts (Original TS file mount, voting guard, unmount)', async () => {
  let voteSent = false;
  const { useCommunityReports } = loadOriginalHook('useCommunityReports.ts', {
    reports: {
      getNearbyReports: async () => [{ id: 'rep-1', title: 'Bache' }],
      voteReport: async () => { voteSent = true; return { confidenceScore: 80 }; },
    },
  });

  const harness = renderHook((props) => useCommunityReports(props), {
    initialProps: {
      t: (k) => k,
    },
  });

  // 1. Verificación de montaje
  assert.deepEqual(harness.result.current.nearbyReports, []);
  assert.equal(harness.result.current.votingId, null);

  // 2. Votación sin ubicación GPS: debe abortar sin llamar al backend
  const rep = { id: 'rep-1', title: 'Bache' };
  await act(async () => {
    await harness.result.current.voteOnReport(rep, true, null);
  });
  assert.equal(voteSent, false, 'No debe emitir voto al backend si no hay GPS disponible');

  // 3. Desmontaje
  harness.unmount();
  assert.equal(harness.isMounted, false);
});
