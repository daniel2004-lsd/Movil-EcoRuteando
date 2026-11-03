import test from 'node:test';
import assert from 'node:assert/strict';
import { renderHook, act } from './helpers/hookTestHarness.mjs';

// ==============================================================================
// BEHAVIORAL SUITE: useMapPoiManager
// ==============================================================================

function createMapPoiManagerHookFactory(mockServices = {}) {
  const {
    getNearbyPlaces = async (center, type, radius) => [
      { placeId: `poi-${type}-1`, name: `Lugar ${type} 1`, latitude: 2.93, longitude: -75.28 },
    ],
  } = mockServices;

  return function useMapPoiManager(props, { useState, useRef, useCallback }) {
    const { getCenterCoords = () => ({ latitude: 2.9273, longitude: -75.2819 }), pickingStop = false } = props;

    const [activePoiCategory, setActivePoiCategory] = useState(null);
    const [poiPlaces, setPoiPlaces] = useState([]);
    const [popularPlaces, setPopularPlaces] = useState([]);
    const [loadingPois, setLoadingPois] = useState(false);
    const [selectedPoiId, setSelectedPoiId] = useState(null);
    const [selectedMapPoi, setSelectedMapPoi] = useState(null);
    const [showPoiSheet, setShowPoiSheet] = useState(false);

    const poiRequestIdRef = useRef(0);

    const closePoiSheet = useCallback(() => {
      poiRequestIdRef.current++;
      setActivePoiCategory(null);
      setPoiPlaces([]);
      setSelectedPoiId(null);
      setShowPoiSheet(false);
    }, []);

    const handlePoiCategory = useCallback(
      async (category, centerOverride) => {
        if (!category) {
          closePoiSheet();
          return;
        }
        const currentReqId = ++poiRequestIdRef.current;
        setActivePoiCategory(category);
        setSelectedPoiId(null);
        setShowPoiSheet(!pickingStop);
        setLoadingPois(true);
        try {
          const center = centerOverride ?? getCenterCoords();
          const places = await getNearbyPlaces(center, category.placeType, 5000);
          if (poiRequestIdRef.current !== currentReqId) {
            return;
          }
          setPoiPlaces(places);
        } catch (err) {
          if (poiRequestIdRef.current === currentReqId) {
            setPoiPlaces([]);
          }
        } finally {
          if (poiRequestIdRef.current === currentReqId) {
            setLoadingPois(false);
          }
        }
      },
      [closePoiSheet, getCenterCoords, pickingStop]
    );

    const selectPoiPlace = useCallback(
      (place, animateRegion) => {
        setSelectedPoiId(place.placeId);
        animateRegion?.(
          {
            latitude: place.latitude,
            longitude: place.longitude,
            latitudeDelta: 0.006,
            longitudeDelta: 0.006,
          },
          400
        );
      },
      []
    );

    return {
      activePoiCategory,
      poiPlaces,
      loadingPois,
      selectedPoiId,
      showPoiSheet,
      poiRequestIdRef,
      closePoiSheet,
      handlePoiCategory,
      selectPoiPlace,
    };
  };
}

test('useMapPoiManager: 1. Inicialización con estado limpio', () => {
  const hook = createMapPoiManagerHookFactory();
  const harness = renderHook((props, hooks) => hook(props, hooks), {
    initialProps: { pickingStop: false },
  });

  assert.equal(harness.result.current.activePoiCategory, null);
  assert.deepEqual(harness.result.current.poiPlaces, []);
  assert.equal(harness.result.current.loadingPois, false);
  assert.equal(harness.result.current.showPoiSheet, false);
  assert.equal(harness.result.current.selectedPoiId, null);
});

test('useMapPoiManager: 2. Prevención de condiciones de carrera (race conditions) ante cambios rápidos de categoría', async () => {
  const hook = createMapPoiManagerHookFactory({
    getNearbyPlaces: async (center, type) => {
      // Simular que categoría "talleres" tarda 80ms pero "parques" tarda 10ms
      const delay = type === 'talleres' ? 80 : 10;
      await new Promise(r => setTimeout(r, delay));
      return [{ placeId: `poi-${type}`, name: `Lugares de ${type}` }];
    },
  });

  const harness = renderHook((props, hooks) => hook(props, hooks), {
    initialProps: { pickingStop: false },
  });

  const catA = { id: 'talleres', placeType: 'talleres' };
  const catB = { id: 'parques', placeType: 'parques' };

  // El usuario toca "talleres" y casi inmediatamente "parques"
  const pA = harness.result.current.handlePoiCategory(catA);
  const pB = harness.result.current.handlePoiCategory(catB);
  await Promise.all([pA, pB]);

  // Al finalizar ambas, los resultados mostrados DEBEN ser los de catB ("parques"), nunca los de catA
  assert.equal(harness.result.current.activePoiCategory.id, 'parques');
  assert.equal(harness.result.current.poiPlaces[0].placeId, 'poi-parques');
  assert.equal(harness.result.current.loadingPois, false);
});

test('useMapPoiManager: 3. Modo elegir parada (pickingStop: true) suprime el bottom sheet', async () => {
  const hook = createMapPoiManagerHookFactory();
  const harness = renderHook((props, hooks) => hook(props, hooks), {
    initialProps: { pickingStop: true },
  });

  const cat = { id: 'recarga', placeType: 'recarga' };
  await act(() => harness.result.current.handlePoiCategory(cat));

  assert.ok(harness.result.current.poiPlaces.length > 0);
  assert.equal(harness.result.current.showPoiSheet, false, 'En modo pickingStop el bottom sheet no debe abrirse para no tapar el mapa');
});

test('useMapPoiManager: 4. Cierre de bottom sheet invalida peticiones pendientes y resetea estado', async () => {
  const hook = createMapPoiManagerHookFactory();
  const harness = renderHook((props, hooks) => hook(props, hooks), {
    initialProps: { pickingStop: false },
  });

  const cat = { id: 'restaurante', placeType: 'restaurante' };
  await act(() => harness.result.current.handlePoiCategory(cat));
  assert.equal(harness.result.current.showPoiSheet, true);

  await act(() => harness.result.current.closePoiSheet());
  assert.equal(harness.result.current.activePoiCategory, null);
  assert.equal(harness.result.current.poiPlaces.length, 0);
  assert.equal(harness.result.current.showPoiSheet, false);
});

test('useMapPoiManager: 5. Selección de POI y animación de cámara del mapa', async () => {
  const hook = createMapPoiManagerHookFactory();
  const harness = renderHook((props, hooks) => hook(props, hooks), {
    initialProps: { pickingStop: false },
  });

  let animatedRegion = null;
  const mockPlace = { placeId: 'poi-mirador-1', latitude: 2.95, longitude: -75.26 };

  await act(() => harness.result.current.selectPoiPlace(mockPlace, (reg) => { animatedRegion = reg; }));

  assert.equal(harness.result.current.selectedPoiId, 'poi-mirador-1');
  assert.ok(animatedRegion);
  assert.equal(animatedRegion.latitude, 2.95);
  assert.equal(animatedRegion.latitudeDelta, 0.006);
});

test('useMapPoiManager: 6. Tolerancia a fallos de red al consultar POIs', async () => {
  const hook = createMapPoiManagerHookFactory({
    getNearbyPlaces: async () => {
      throw new Error('Service Unavailable 503');
    },
  });

  const harness = renderHook((props, hooks) => hook(props, hooks), {
    initialProps: { pickingStop: false },
  });

  const cat = { id: 'estaciones', placeType: 'estaciones' };
  await act(() => harness.result.current.handlePoiCategory(cat));

  assert.equal(harness.result.current.loadingPois, false, 'loading debe terminar limpiamente');
  assert.deepEqual(harness.result.current.poiPlaces, [], 'No debe corromper la lista de POIs ante fallo de red');
});
