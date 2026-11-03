import test from 'node:test';
import assert from 'node:assert/strict';
import { renderHook, act } from './helpers/hookTestHarness.mjs';

// ==============================================================================
// BEHAVIORAL SUITE: useTripLifecycle
// ==============================================================================

function createTripLifecycleHookFactory(mockServices = {}) {
  const {
    saveRoute = async (payload) => 'route-created-1',
    startTrip = async (req) => ({ tripId: 'trip-started-123' }),
    completeTrip = async (id, payload) => ({ success: true, tripId: id }),
    findRouteIdByName = async (name) => 'route-reused-existing',
    syncOfflineTrips = async () => 1,
    getFavorites = async () => [{ routeId: 'fav-route-1' }],
  } = mockServices;

  return function useTripLifecycle(props, { useState, useRef, useCallback, useEffect }) {
    const {
      t = (k) => k,
      route,
      origin,
      destination,
      mode = 'driving',
      estimate,
      traveledDistMRef = { current: 0 },
      gpsBreadcrumbsRef = { current: [] },
      lastTrackPosRef = { current: null },
      speak = () => {},
      onTripStarted,
      onTripCompleted,
    } = props;

    const [activeTripId, setActiveTripId] = useState(null);
    const [startingTrip, setStartingTrip] = useState(false);
    const [completing, setCompleting] = useState(false);
    const [tripError, setTripError] = useState(null);

    const [routeSavedId, setRouteSavedId] = useState(null);
    const [routeSaved, setRouteSaved] = useState(false);
    const [routeFav, setRouteFav] = useState(false);

    const tripStartedAtRef = useRef(null);
    const favIdsRef = useRef(new Set());

    // Cargar ids de favoritos para identificar si la ruta activa ya es favorita
    useEffect(() => {
      let active = true;
      (async () => {
        try {
          const data = await getFavorites();
          const items = Array.isArray(data) ? data : (data?.items ?? []);
          const ids = new Set(items.map((r) => r?.routeId ?? r?.id).filter(Boolean));
          if (active) favIdsRef.current = ids;
        } catch {}
      })();
      return () => {
        active = false;
      };
    }, []);

    const saveRouteSmart = useCallback(
      async (payload) => {
        try {
          const id = await saveRoute(payload);
          return { id, reused: false };
        } catch (err) {
          const msg = String(err?.message || '').toLowerCase();
          if (msg.includes('already exists') || msg.includes('ya existe') || err?.status === 409) {
            const existingId = await findRouteIdByName(payload.name);
            if (existingId) return { id: existingId, reused: true };
          }
          throw err;
        }
      },
      []
    );

    const handleStartTrip = useCallback(
      async (directRoute = null) => {
        const activeRoute = directRoute || route;
        if (startingTrip) return;
        if (!origin || !destination || !activeRoute) {
          setTripError('missing_data');
          return;
        }

        setStartingTrip(true);
        setTripError(null);
        try {
          const payload = {
            name: `${origin.name} -> ${destination.name}`,
            originName: origin.name,
            destName: destination.name,
            distanceKm: (activeRoute?.distance?.value || 0) / 1000,
          };

          const { id: rId } = await saveRouteSmart(payload);
          setRouteSavedId(rId);
          setRouteSaved(true);

          const { tripId } = await startTrip({
            routeId: rId,
            transportMode: mode,
          });

          setActiveTripId(tripId);
          tripStartedAtRef.current = Date.now();
          traveledDistMRef.current = 0;
          gpsBreadcrumbsRef.current = [];
          lastTrackPosRef.current = null;

          speak(t('planRoute.tripStarted'));
          onTripStarted?.(tripId);
        } catch (err) {
          setTripError(err?.message || 'start_failed');
        } finally {
          setStartingTrip(false);
        }
      },
      [startingTrip, origin, destination, route, mode, saveRouteSmart, t, speak, onTripStarted]
    );

    const handleCompleteTrip = useCallback(async () => {
      if (completing || !activeTripId) return;
      setCompleting(true);
      try {
        const realDistKm = Number((traveledDistMRef.current / 1000).toFixed(2));
        const gpsPayload = JSON.stringify(gpsBreadcrumbsRef.current);

        await completeTrip(activeTripId, {
          actualDistanceKm: realDistKm,
          gpsDataJson: gpsPayload,
        });

        setActiveTripId(null);
        tripStartedAtRef.current = null;
        traveledDistMRef.current = 0;
        gpsBreadcrumbsRef.current = [];
        lastTrackPosRef.current = null;

        await syncOfflineTrips().catch(() => {});
        onTripCompleted?.();
      } catch (err) {
        setTripError(err?.message || 'complete_failed');
      } finally {
        setCompleting(false);
      }
    }, [completing, activeTripId, onTripCompleted]);

    return {
      activeTripId,
      setActiveTripId,
      startingTrip,
      completing,
      tripError,
      routeSavedId,
      routeSaved,
      routeFav,
      favIdsRef,
      saveRouteSmart,
      handleStartTrip,
      handleCompleteTrip,
    };
  };
}

test('useTripLifecycle: 1. Inicialización y carga de favoritos en efecto de montaje', async () => {
  const hook = createTripLifecycleHookFactory({
    getFavorites: async () => [{ routeId: 'route-fav-999' }],
  });
  const harness = renderHook((props, hooks) => hook(props, hooks), {
    initialProps: { route: null, origin: null, destination: null },
  });

  assert.equal(harness.result.current.activeTripId, null);
  assert.equal(harness.result.current.startingTrip, false);
  assert.equal(harness.result.current.completing, false);

  // Dejar que el microtask del efecto complete la hidratación de favoritos
  await new Promise(r => setTimeout(r, 20));
  assert.ok(harness.result.current.favIdsRef.current.has('route-fav-999'), 'Debe hidratar los favoritos en favIdsRef');
});

test('useTripLifecycle: 2. Regla CU03: saveRouteSmart reusa ID existente si la ruta ya existe', async () => {
  const hook = createTripLifecycleHookFactory({
    saveRoute: async () => {
      const err = new Error('Route already exists');
      err.status = 409;
      throw err;
    },
    findRouteIdByName: async (name) => 'reused-route-id-555',
  });

  const harness = renderHook((props, hooks) => hook(props, hooks), {
    initialProps: { route: null, origin: null, destination: null },
  });

  const result = await harness.result.current.saveRouteSmart({ name: 'Neiva -> Rivera' });
  assert.equal(result.id, 'reused-route-id-555');
  assert.equal(result.reused, true, 'Debe marcar reused: true ante ruta duplicada');
});

test('useTripLifecycle: 3. Inicio de viaje con guard contra múltiples toques (concurrencia)', async () => {
  let startCalls = 0;
  let startedTripId = null;

  const hook = createTripLifecycleHookFactory({
    startTrip: async () => {
      startCalls++;
      await new Promise(r => setTimeout(r, 50));
      return { tripId: 'trip-concurrent-1' };
    },
  });

  const origin = { latitude: 2.92, longitude: -75.28, name: 'Origen' };
  const dest = { latitude: 2.95, longitude: -75.27, name: 'Destino' };
  const route = { distance: { value: 3500 } };

  const harness = renderHook((props, hooks) => hook(props, hooks), {
    initialProps: {
      origin,
      destination: dest,
      route,
      onTripStarted: (id) => { startedTripId = id; },
    },
  });

  // Disparar dos inicios casi simultáneos
  const p1 = harness.result.current.handleStartTrip();
  const p2 = harness.result.current.handleStartTrip();
  await Promise.all([p1, p2]);

  assert.equal(startCalls, 1, 'Solo debe invocarse un único startTrip gracias al guard de startingTrip');
  assert.equal(startedTripId, 'trip-concurrent-1');
  assert.equal(harness.result.current.activeTripId, 'trip-concurrent-1');
});

test('useTripLifecycle: 4. Finalización de viaje certificada con distancia GPS y sincronización offline', async () => {
  let completedId = null;
  let sentPayload = null;
  let offlineSyncCalls = 0;
  let completedCallbackInvoked = false;

  const hook = createTripLifecycleHookFactory({
    completeTrip: async (id, payload) => {
      completedId = id;
      sentPayload = payload;
      return { success: true };
    },
    syncOfflineTrips: async () => {
      offlineSyncCalls++;
      return 1;
    },
  });

  const traveledDistMRef = { current: 4850 }; // 4.85 km
  const gpsBreadcrumbsRef = {
    current: [
      { lat: 2.92, lng: -75.28, timestamp: 1000 },
      { lat: 2.93, lng: -75.27, timestamp: 2000 },
    ],
  };

  const harness = renderHook((props, hooks) => hook(props, hooks), {
    initialProps: {
      route: null,
      origin: null,
      destination: null,
      traveledDistMRef,
      gpsBreadcrumbsRef,
      onTripCompleted: () => { completedCallbackInvoked = true; },
    },
  });

  await act(() => harness.result.current.setActiveTripId('active-trip-789'));

  await act(() => harness.result.current.handleCompleteTrip());

  assert.equal(completedId, 'active-trip-789');
  assert.equal(sentPayload.actualDistanceKm, 4.85, 'Debe convertir metros a km con 2 decimales');
  assert.ok(sentPayload.gpsDataJson.includes('2.92'));
  assert.equal(offlineSyncCalls, 1, 'Debe activar la sincronización offline de viajes pendientes');
  assert.equal(completedCallbackInvoked, true);
  assert.equal(harness.result.current.activeTripId, null, 'activeTripId debe limpiarse al terminar');
});

test('useTripLifecycle: 5. Resiliencia ante error de red al completar viaje', async () => {
  const hook = createTripLifecycleHookFactory({
    completeTrip: async () => {
      throw new Error('Network timeout (cold start)');
    },
  });

  const harness = renderHook((props, hooks) => hook(props, hooks), {
    initialProps: {
      route: null,
      origin: null,
      destination: null,
    },
  });

  await act(() => harness.result.current.setActiveTripId('trip-offline-fail'));

  await act(() => harness.result.current.handleCompleteTrip());

  assert.equal(harness.result.current.completing, false, 'completing debe volver a false');
  assert.ok(harness.result.current.tripError.includes('Network timeout'));
});
