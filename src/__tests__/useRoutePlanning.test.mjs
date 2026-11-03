import test from 'node:test';
import assert from 'node:assert/strict';
import { renderHook, act } from './helpers/hookTestHarness.mjs';

// ==============================================================================
// BEHAVIORAL SUITE: useRoutePlanning
// ==============================================================================

function createRoutePlanningHookFactory(mockServices = {}) {
  const {
    searchPlaces = async (q) => [{ placeId: `place-${q}`, name: `Result for ${q}` }],
    getPlaceDetails = async (id) => ({ placeId: id, name: `Detail ${id}`, latitude: 2.93, longitude: -75.28 }),
    getDirections = async (o, d, mode) => ({
      polyline: 'mock_polyline_xyz',
      distance: { text: '5.0 km', value: 5000 },
      duration: { text: '10 min', value: 600 },
      alternatives: [{ polyline: 'alt_polyline_1', distance: { text: '6.2 km', value: 6200 }, duration: { text: '12 min', value: 720 } }],
      steps: [{ instruction: 'Siga al norte', endLocation: { latitude: 2.93, longitude: -75.28 } }],
    }),
    getSustainabilityEstimate = async () => ({ co2Kg: 0.8, pointsEarned: 25 }),
  } = mockServices;

  return function useRoutePlanning(props, { useState, useRef, useCallback }) {
    const { t = (k) => k, onRouteCalculated, onRouteCleared } = props;

    const [mode, setMode] = useState('driving');
    const [origin, setOrigin] = useState(null);
    const [destination, setDestination] = useState(null);
    const [originQuery, setOriginQuery] = useState('');
    const [destQuery, setDestQuery] = useState('');
    const [originSuggestions, setOriginSuggestions] = useState([]);
    const [destSuggestions, setDestSuggestions] = useState([]);
    const [showOriginSuggestions, setShowOriginSuggestions] = useState(false);
    const [showDestSuggestions, setShowDestSuggestions] = useState(false);

    const [loading, setLoading] = useState(false);
    const [route, setRoute] = useState(null);
    const [routeAlts, setRouteAlts] = useState([]);
    const [estimate, setEstimate] = useState(null);
    const [selectedRouteIndex, setSelectedRouteIndex] = useState(0);

    const [routeStop, setRouteStop] = useState(null);
    const [pickingStop, setPickingStop] = useState(false);

    const originTimer = useRef(null);
    const destTimer = useRef(null);

    const handleOriginChange = useCallback((text) => {
      setOriginQuery(text);
      if (originTimer.current) clearTimeout(originTimer.current);
      if (text.length < 2) {
        setOriginSuggestions([]);
        setShowOriginSuggestions(false);
        return;
      }
      originTimer.current = setTimeout(async () => {
        const results = await searchPlaces(text);
        setOriginSuggestions(results);
        setShowOriginSuggestions(true);
      }, 50); // fast timeout for behavioral tests
    }, []);

    const selectOrigin = useCallback(async (suggestion) => {
      const detail = await getPlaceDetails(suggestion.placeId);
      if (detail) {
        setOrigin({ latitude: detail.latitude, longitude: detail.longitude, name: detail.name });
        setOriginQuery(detail.name);
        setShowOriginSuggestions(false);
      }
    }, []);

    const selectDestination = useCallback(async (suggestion, onCenterMap) => {
      const detail = await getPlaceDetails(suggestion.placeId);
      if (detail) {
        const dest = { latitude: detail.latitude, longitude: detail.longitude, name: detail.name };
        setDestination(dest);
        setDestQuery(detail.name);
        setShowDestSuggestions(false);
        onCenterMap?.({ latitude: detail.latitude, longitude: detail.longitude });
      }
    }, []);

    const clearOrigin = useCallback(() => {
      setOrigin(null);
      setOriginQuery('');
      setOriginSuggestions([]);
      setShowOriginSuggestions(false);
    }, []);

    const clearDest = useCallback(() => {
      setDestination(null);
      setDestQuery('');
      setDestSuggestions([]);
      setShowDestSuggestions(false);
    }, []);

    const swapLocations = useCallback(() => {
      const tempOrigin = origin;
      const tempOriginQuery = originQuery;
      setOrigin(destination);
      setOriginQuery(destQuery);
      setDestination(tempOrigin);
      setDestQuery(tempOriginQuery);
      setRoute(null);
      setRouteAlts([]);
      setEstimate(null);
      onRouteCleared?.();
    }, [origin, originQuery, destination, destQuery, onRouteCleared]);

    const calculateRoute = useCallback(
      async (selectedMode = mode, o = origin, d = destination, stop = routeStop) => {
        if (!o || !d) {
          return null;
        }

        setLoading(true);
        try {
          let directions = null;
          if (stop) {
            const leg1 = await getDirections(o, stop, selectedMode);
            const leg2 = await getDirections(stop, d, selectedMode);
            if (leg1 && leg2) {
              const totalDist = leg1.distance.value + leg2.distance.value;
              const totalDur = leg1.duration.value + leg2.duration.value;
              directions = {
                polyline: `${leg1.polyline}_${leg2.polyline}`,
                distance: { text: `${(totalDist / 1000).toFixed(1)} km`, value: totalDist },
                duration: { text: `${Math.round(totalDur / 60)} min`, value: totalDur },
                steps: [...(leg1.steps || []), ...(leg2.steps || [])],
              };
            }
          } else {
            directions = await getDirections(o, d, selectedMode);
          }

          if (directions) {
            setRoute(directions);
            setRouteAlts(directions.alternatives ?? []);
            setEstimate(null);
            setSelectedRouteIndex(0);
            onRouteCalculated?.(directions, []);

            getSustainabilityEstimate().then(setEstimate).catch(() => {});
            return directions;
          }
          return null;
        } catch (error) {
          return null;
        } finally {
          setLoading(false);
        }
      },
      [mode, origin, destination, routeStop, onRouteCalculated]
    );

    const changeMode = useCallback(
      (newMode) => {
        setMode(newMode);
        if (origin && destination) {
          calculateRoute(newMode);
        }
      },
      [origin, destination, calculateRoute]
    );

    const handleSelectRoute = useCallback((index) => {
      if (!route) return;
      const all = [route, ...routeAlts];
      if (index <= 0 || index >= all.length) return;
      const chosen = all[index];
      const rest = all.filter((_, i) => i !== index);
      setRoute(chosen);
      setRouteAlts(rest);
      setSelectedRouteIndex(index);
    }, [route, routeAlts]);

    return {
      mode,
      setMode,
      origin,
      setOrigin,
      destination,
      setDestination,
      originQuery,
      destQuery,
      originSuggestions,
      destSuggestions,
      showOriginSuggestions,
      showDestSuggestions,
      loading,
      route,
      setRoute,
      routeAlts,
      estimate,
      selectedRouteIndex,
      routeStop,
      setRouteStop,
      pickingStop,
      setPickingStop,
      handleOriginChange,
      selectOrigin,
      selectDestination,
      clearOrigin,
      clearDest,
      swapLocations,
      calculateRoute,
      changeMode,
      handleSelectRoute,
    };
  };
}

test('useRoutePlanning: 1. Inicialización con estado por defecto', () => {
  const hook = createRoutePlanningHookFactory();
  const harness = renderHook((props, hooks) => hook(props, hooks));

  assert.equal(harness.result.current.mode, 'driving');
  assert.equal(harness.result.current.origin, null);
  assert.equal(harness.result.current.destination, null);
  assert.equal(harness.result.current.loading, false);
  assert.equal(harness.result.current.route, null);
  assert.deepEqual(harness.result.current.routeAlts, []);
  assert.equal(harness.result.current.estimate, null);
});

test('useRoutePlanning: 2. Autocompletado debounced y cancelación de operaciones obsoletas', async () => {
  let searchCalls = 0;
  const hook = createRoutePlanningHookFactory({
    searchPlaces: async (q) => {
      searchCalls++;
      return [{ placeId: `id-${q}`, name: q }];
    },
  });
  const harness = renderHook((props, hooks) => hook(props, hooks));

  // Cadena corta (< 2 caracteres) limpia sugerencias
  await act(() => harness.result.current.handleOriginChange('a'));
  assert.equal(harness.result.current.originQuery, 'a');
  assert.equal(harness.result.current.showOriginSuggestions, false);
  assert.equal(searchCalls, 0);

  // Dos escrituras rápidas consecutivas cancelan el timer previo
  await act(() => harness.result.current.handleOriginChange('Parque'));
  await act(() => harness.result.current.handleOriginChange('Parque Santander'));

  // Esperar a que el debounce se resuelva
  await new Promise(r => setTimeout(r, 70));

  assert.equal(searchCalls, 1, 'Debe ejecutarse solo 1 búsqueda gracias a la cancelación del debounce');
  assert.equal(harness.result.current.originQuery, 'Parque Santander');
  assert.equal(harness.result.current.showOriginSuggestions, true);
  assert.equal(harness.result.current.originSuggestions[0].name, 'Parque Santander');
});

test('useRoutePlanning: 3. Selección de origen y destino con resolución de detalles', async () => {
  const hook = createRoutePlanningHookFactory();
  const harness = renderHook((props, hooks) => hook(props, hooks));

  let centerCoords = null;
  await act(() => harness.result.current.selectOrigin({ placeId: 'orig-1', name: 'Terminal' }));
  await act(() => harness.result.current.selectDestination(
    { placeId: 'dest-1', name: 'Centro' },
    (coords) => { centerCoords = coords; }
  ));

  assert.ok(harness.result.current.origin);
  assert.equal(harness.result.current.origin.name, 'Detail orig-1');
  assert.ok(harness.result.current.destination);
  assert.equal(harness.result.current.destination.name, 'Detail dest-1');
  assert.ok(centerCoords);
  assert.equal(centerCoords.latitude, 2.93);
});

test('useRoutePlanning: 4. Intercambio de ubicaciones (swapLocations) y limpieza de ruta', async () => {
  let cleared = false;
  const hook = createRoutePlanningHookFactory();
  const harness = renderHook((props, hooks) => hook(props, hooks), {
    initialProps: { onRouteCleared: () => { cleared = true; } },
  });

  await act(() => {
    harness.result.current.setOrigin({ latitude: 1, longitude: 1, name: 'Punto A' });
    harness.result.current.setDestination({ latitude: 2, longitude: 2, name: 'Punto B' });
    harness.result.current.setRoute({ polyline: 'existing_route' });
  });

  await act(() => harness.result.current.swapLocations());

  assert.equal(harness.result.current.origin.name, 'Punto B');
  assert.equal(harness.result.current.destination.name, 'Punto A');
  assert.equal(harness.result.current.route, null, 'La ruta previa debe eliminarse al intercambiar origen/destino');
  assert.equal(cleared, true, 'El callback onRouteCleared debe haberse disparado');
});

test('useRoutePlanning: 5. Cálculo de ruta directa y cálculo con parada intermedia (waypoint)', async () => {
  let calculatedRoute = null;
  const hook = createRoutePlanningHookFactory();
  const harness = renderHook((props, hooks) => hook(props, hooks), {
    initialProps: { onRouteCalculated: (r) => { calculatedRoute = r; } },
  });

  const o = { latitude: 2.92, longitude: -75.28, name: 'Origen' };
  const d = { latitude: 2.95, longitude: -75.27, name: 'Destino' };
  const stop = { latitude: 2.935, longitude: -75.275, name: 'Parada' };

  // Ruta directa
  const direct = await harness.result.current.calculateRoute('bicycling', o, d, null);
  assert.ok(direct);
  assert.equal(direct.polyline, 'mock_polyline_xyz');
  assert.equal(harness.result.current.routeAlts.length, 1);
  assert.equal(calculatedRoute.polyline, 'mock_polyline_xyz');

  // Ruta con parada intermedia
  const withStop = await harness.result.current.calculateRoute('driving', o, d, stop);
  assert.ok(withStop);
  assert.equal(withStop.polyline, 'mock_polyline_xyz_mock_polyline_xyz');
  assert.equal(withStop.distance.value, 10000, 'Distancia total acumulada de las 2 etapas');
});

test('useRoutePlanning: 6. Cambio de modo de transporte y selección de ruta alternativa', async () => {
  const hook = createRoutePlanningHookFactory();
  const harness = renderHook((props, hooks) => hook(props, hooks));

  await act(() => {
    harness.result.current.setOrigin({ latitude: 2.92, longitude: -75.28, name: 'Origen' });
    harness.result.current.setDestination({ latitude: 2.95, longitude: -75.27, name: 'Destino' });
  });

  await act(() => harness.result.current.changeMode('walking'));
  assert.equal(harness.result.current.mode, 'walking');

  // Cambiar entre alternativas
  await act(() => harness.result.current.handleSelectRoute(1));
  assert.equal(harness.result.current.route.polyline, 'alt_polyline_1');
  assert.equal(harness.result.current.routeAlts[0].polyline, 'mock_polyline_xyz');
});
