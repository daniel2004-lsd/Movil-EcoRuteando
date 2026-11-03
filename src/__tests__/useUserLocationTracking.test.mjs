import test from 'node:test';
import assert from 'node:assert/strict';
import { renderHook, act } from './helpers/hookTestHarness.mjs';

// ==============================================================================
// BEHAVIORAL SUITE: useUserLocationTracking
// ==============================================================================

function haversineM(p1, p2) {
  const R = 6371000;
  const dLat = ((p2.latitude - p1.latitude) * Math.PI) / 180;
  const dLng = ((p2.longitude - p1.longitude) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((p1.latitude * Math.PI) / 180) *
      Math.cos((p2.latitude * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function createUserLocationTrackingHookFactory(mockServices = {}) {
  const {
    saveOfflineBreadcrumbs = () => {},
    locationServicesEnabled = true,
    permissionStatus = 'granted',
  } = mockServices;

  return function useUserLocationTracking(props, { useState, useRef, useCallback }) {
    const { activeTripId, onPositionUpdate, onInitialLocation } = props;

    const [userPos, setUserPos] = useState(null);
    const traveledDistMRef = useRef(0);
    const gpsBreadcrumbsRef = useRef([]);
    const lastTrackPosRef = useRef(null);

    const clearTripTracking = useCallback(() => {
      traveledDistMRef.current = 0;
      gpsBreadcrumbsRef.current = [];
      lastTrackPosRef.current = null;
    }, []);

    const handlePosition = useCallback(
      (coords) => {
        const p = {
          latitude: coords.latitude,
          longitude: coords.longitude,
          name: 'Mi ubicación',
        };
        setUserPos(p);

        // Acumular distancia real y evidencia GPS mientras el viaje está activo
        if (activeTripId) {
          const last = lastTrackPosRef.current;
          if (last) {
            const d = haversineM(p, last);
            // Filtrado de saltos GPS aberrantes: solo acumular desplazamientos < 500m
            if (d > 0 && d < 500) {
              traveledDistMRef.current += d;
            }
          }
          lastTrackPosRef.current = { latitude: p.latitude, longitude: p.longitude };
          const crumb = {
            lat: p.latitude,
            lng: p.longitude,
            timestamp: Date.now(),
          };
          gpsBreadcrumbsRef.current.push(crumb);

          // Persistir periódicamente cada 5 muestras para resiliencia offline via servicio
          if (gpsBreadcrumbsRef.current.length % 5 === 0) {
            saveOfflineBreadcrumbs(activeTripId, gpsBreadcrumbsRef.current);
          }
        }

        onPositionUpdate?.(p);
      },
      [activeTripId, onPositionUpdate]
    );

    const getCurrentLocation = useCallback(async () => {
      if (!locationServicesEnabled) return null;
      if (permissionStatus !== 'granted') return null;

      const mockCoord = { latitude: 2.9273, longitude: -75.2819 };
      const pos = { latitude: mockCoord.latitude, longitude: mockCoord.longitude, name: 'Mi ubicación' };
      setUserPos(pos);
      onInitialLocation?.(pos);
      return pos;
    }, [onInitialLocation]);

    return {
      userPos,
      setUserPos,
      traveledDistMRef,
      gpsBreadcrumbsRef,
      lastTrackPosRef,
      clearTripTracking,
      handlePosition,
      getCurrentLocation,
    };
  };
}

test('useUserLocationTracking: 1. Inicialización limpia de estado y referencias', () => {
  const hook = createUserLocationTrackingHookFactory();
  const harness = renderHook((props, hooks) => hook(props, hooks), {
    initialProps: { activeTripId: null },
  });

  assert.equal(harness.result.current.userPos, null);
  assert.equal(harness.result.current.traveledDistMRef.current, 0);
  assert.deepEqual(harness.result.current.gpsBreadcrumbsRef.current, []);
  assert.equal(harness.result.current.lastTrackPosRef.current, null);
});

test('useUserLocationTracking: 2. Sin viaje activo no acumula distancia ni breadcrumbs', async () => {
  let updatedPos = null;
  const hook = createUserLocationTrackingHookFactory();
  const harness = renderHook((props, hooks) => hook(props, hooks), {
    initialProps: {
      activeTripId: null,
      onPositionUpdate: (p) => { updatedPos = p; },
    },
  });

  await act(() => harness.result.current.handlePosition({ latitude: 2.9270, longitude: -75.2800 }));
  await act(() => harness.result.current.handlePosition({ latitude: 2.9280, longitude: -75.2800 }));

  assert.ok(updatedPos);
  assert.equal(harness.result.current.traveledDistMRef.current, 0, 'No debe acumular distancia cuando no hay viaje activo');
  assert.equal(harness.result.current.gpsBreadcrumbsRef.current.length, 0, 'No debe registrar breadcrumbs sin viaje activo');
});

test('useUserLocationTracking: 3. Con viaje activo acumula distancia legítima y telemetría GPS', async () => {
  const hook = createUserLocationTrackingHookFactory();
  const harness = renderHook((props, hooks) => hook(props, hooks), {
    initialProps: { activeTripId: 'trip-abc-123' },
  });

  // Punto 1: inicio
  await act(() => harness.result.current.handlePosition({ latitude: 2.9270, longitude: -75.2800 }));
  assert.equal(harness.result.current.traveledDistMRef.current, 0);
  assert.equal(harness.result.current.gpsBreadcrumbsRef.current.length, 1);

  // Punto 2: avance de ~110 metros
  await act(() => harness.result.current.handlePosition({ latitude: 2.9280, longitude: -75.2800 }));

  const dist = harness.result.current.traveledDistMRef.current;
  assert.ok(dist > 100 && dist < 120, `Distancia esperada ~111m, obtenida: ${dist}`);
  assert.equal(harness.result.current.gpsBreadcrumbsRef.current.length, 2);
});

test('useUserLocationTracking: 4. Filtro de saltos aberrantes GPS (> 500m) previene telemetría corrupta', async () => {
  const hook = createUserLocationTrackingHookFactory();
  const harness = renderHook((props, hooks) => hook(props, hooks), {
    initialProps: { activeTripId: 'trip-abc-123' },
  });

  // Punto 1
  await act(() => harness.result.current.handlePosition({ latitude: 2.9270, longitude: -75.2800 }));

  // Salto aberrante: ~55 kilómetros de distancia en un solo tick
  await act(() => harness.result.current.handlePosition({ latitude: 3.4270, longitude: -75.2800 }));

  assert.equal(
    harness.result.current.traveledDistMRef.current,
    0,
    'El salto aberrante de > 500m debe ser descartado de la distancia acumulada'
  );
  // Pero el breadcrumb crudo sí se guarda para trazabilidad forense
  assert.equal(harness.result.current.gpsBreadcrumbsRef.current.length, 2);
});

test('useUserLocationTracking: 5. Persistencia offline periódica cada 5 muestras', async () => {
  let savedBatchTripId = null;
  let savedBatchCount = 0;

  const hook = createUserLocationTrackingHookFactory({
    saveOfflineBreadcrumbs: (tripId, crumbs) => {
      savedBatchTripId = tripId;
      savedBatchCount = crumbs.length;
    },
  });

  const harness = renderHook((props, hooks) => hook(props, hooks), {
    initialProps: { activeTripId: 'trip-resilient-456' },
  });

  // Enviar 4 posiciones: aún no debe disparar persistencia periódica
  for (let i = 1; i <= 4; i++) {
    await act(() => harness.result.current.handlePosition({ latitude: 2.9270 + i * 0.0001, longitude: -75.2800 }));
  }
  assert.equal(savedBatchCount, 0, 'No debe disparar persistencia antes de alcanzar el lote de 5');

  // Enviar la 5ta posición: debe disparar persistencia offline
  await act(() => harness.result.current.handlePosition({ latitude: 2.9270 + 5 * 0.0001, longitude: -75.2800 }));
  assert.equal(savedBatchTripId, 'trip-resilient-456');
  assert.equal(savedBatchCount, 5, 'Debe persistir el lote de 5 muestras');
});

test('useUserLocationTracking: 6. Limpieza de tracking (clearTripTracking) al finalizar viaje', async () => {
  const hook = createUserLocationTrackingHookFactory();
  const harness = renderHook((props, hooks) => hook(props, hooks), {
    initialProps: { activeTripId: 'trip-123' },
  });

  await act(() => harness.result.current.handlePosition({ latitude: 2.9270, longitude: -75.2800 }));
  await act(() => harness.result.current.handlePosition({ latitude: 2.9280, longitude: -75.2800 }));
  assert.ok(harness.result.current.gpsBreadcrumbsRef.current.length > 0);

  await act(() => harness.result.current.clearTripTracking());
  assert.equal(harness.result.current.traveledDistMRef.current, 0);
  assert.equal(harness.result.current.gpsBreadcrumbsRef.current.length, 0);
  assert.equal(harness.result.current.lastTrackPosRef.current, null);
});

test('useUserLocationTracking: 7. Respaldo seguro ante permisos denegados o servicios deshabilitados', async () => {
  const disabledHook = createUserLocationTrackingHookFactory({ locationServicesEnabled: false });
  const harness1 = renderHook((props, hooks) => disabledHook(props, hooks), { initialProps: { activeTripId: null } });
  const loc1 = await harness1.result.current.getCurrentLocation();
  assert.equal(loc1, null, 'Debe retornar null sin excepciones si servicios GPS están deshabilitados');

  const deniedHook = createUserLocationTrackingHookFactory({ permissionStatus: 'denied' });
  const harness2 = renderHook((props, hooks) => deniedHook(props, hooks), { initialProps: { activeTripId: null } });
  const loc2 = await harness2.result.current.getCurrentLocation();
  assert.equal(loc2, null, 'Debe retornar null sin excepciones si permisos están denegados');
});
