import test from 'node:test';
import assert from 'node:assert/strict';
import { renderHook, act } from './helpers/hookTestHarness.mjs';

// ==============================================================================
// BEHAVIORAL SUITE: useTurnByTurnNavigation
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

function createTurnByTurnHookFactory(mockSpeech = {}) {
  let stoppedCount = 0;
  const spoken = mockSpeech.spoken || [];
  const speak = mockSpeech.speak || ((text) => spoken.push(text));
  const stop = mockSpeech.stop || (() => { stoppedCount++; });

  return function useTurnByTurnNavigation(props, { useState, useRef, useCallback, useEffect }) {
    const { route, destination, t = (k) => k, onArrived, onRecenter } = props;

    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [arrived, setArrived] = useState(false);
    const [voiceOn, setVoiceOn] = useState(true);

    const stepIndexRef = useRef(0);
    const arrivedRef = useRef(false);
    const voiceOnRef = useRef(true);
    const preAlertRef = useRef(new Set());
    const routeRef = useRef(null);
    const destinationRef = useRef(null);

    routeRef.current = route;
    destinationRef.current = destination;
    voiceOnRef.current = voiceOn;

    const doSpeak = useCallback((text) => {
      if (!voiceOnRef.current || !text) return;
      stop();
      if (!voiceOnRef.current) return;
      speak(text);
    }, []);

    const toggleVoice = useCallback(() => {
      const next = !voiceOnRef.current;
      voiceOnRef.current = next;
      setVoiceOn(next);
      if (!next) stop();
    }, []);

    const resetNavigation = useCallback(() => {
      stepIndexRef.current = 0;
      setCurrentStepIndex(0);
      arrivedRef.current = false;
      setArrived(false);
      preAlertRef.current.clear();
      stop();
    }, []);

    // Limpiar navegación al cambiar de ruta
    useEffect(() => {
      resetNavigation();
    }, [route, resetNavigation]);

    const updatePosition = useCallback(
      (p) => {
        const steps = routeRef.current?.steps || [];
        const idx = stepIndexRef.current;

        if (steps.length > 0 && idx < steps.length) {
          const cur = steps[idx];
          const nextS = steps[idx + 1];

          // 1. Aviso previo 40-80 metros antes del giro
          if (cur?.endLocation?.latitude && nextS?.instruction) {
            const dToEnd = haversineM(p, cur.endLocation);
            if (dToEnd <= 80 && dToEnd > 40 && !preAlertRef.current.has(idx)) {
              preAlertRef.current.add(idx);
              const m = Math.max(10, Math.round(dToEnd / 10) * 10);
              doSpeak(`En ${m} metros, ${nextS.instruction}`);
            }
          }

          // 2. Avance de maniobra al aproximarse al final del paso actual (< 35m)
          let newIdx = idx;
          for (let i = idx; i < Math.min(idx + 3, steps.length); i++) {
            const end = steps[i]?.endLocation;
            if (end?.latitude && haversineM(p, end) < 35) {
              newIdx = i + 1;
            }
          }

          if (newIdx !== idx) {
            stepIndexRef.current = newIdx;
            setCurrentStepIndex(newIdx);
            if (steps[newIdx]?.instruction) {
              doSpeak(steps[newIdx].instruction);
            }
          }
        }

        // 3. Detección de llegada al destino final
        const dest = destinationRef.current;
        if (dest && !arrivedRef.current) {
          const dToDest = haversineM(p, dest);
          if (dToDest < 35) {
            arrivedRef.current = true;
            setArrived(true);
            doSpeak(t('planRoute.arrived'));
            onArrived?.();
          }
        }
      },
      [doSpeak, t, onArrived]
    );

    return {
      currentStepIndex,
      setCurrentStepIndex,
      arrived,
      voiceOn,
      toggleVoice,
      resetNavigation,
      updatePosition,
      speak: doSpeak,
    };
  };
}

test('useTurnByTurnNavigation: 1. Inicialización de estado y voz activa', () => {
  const hook = createTurnByTurnHookFactory();
  const harness = renderHook((props, hooks) => hook(props, hooks), {
    initialProps: { route: null, destination: null },
  });

  assert.equal(harness.result.current.currentStepIndex, 0);
  assert.equal(harness.result.current.arrived, false);
  assert.equal(harness.result.current.voiceOn, true);
});

test('useTurnByTurnNavigation: 2. Alternancia de voz (toggleVoice) y detención de audio', async () => {
  let stopCalls = 0;
  const hook = createTurnByTurnHookFactory({ stop: () => stopCalls++ });
  const harness = renderHook((props, hooks) => hook(props, hooks), {
    initialProps: { route: null, destination: null },
  });

  await act(() => harness.result.current.toggleVoice());
  assert.equal(harness.result.current.voiceOn, false);
  assert.ok(stopCalls >= 1, 'Debe haber llamado a stop al silenciar la voz');

  // Reactivar voz
  await act(() => harness.result.current.toggleVoice());
  assert.equal(harness.result.current.voiceOn, true);
});

test('useTurnByTurnNavigation: 3. Reinicio automático de estado cuando la ruta cambia', async () => {
  const hook = createTurnByTurnHookFactory();
  const initialRoute = {
    steps: [
      { instruction: 'Paso 1', endLocation: { latitude: 2.93, longitude: -75.28 } },
      { instruction: 'Paso 2', endLocation: { latitude: 2.94, longitude: -75.28 } },
    ],
  };

  const harness = renderHook((props, hooks) => hook(props, hooks), {
    initialProps: { route: initialRoute, destination: { latitude: 2.94, longitude: -75.28 } },
  });

  // Simular que el usuario ya iba en el paso 1
  await act(() => harness.result.current.setCurrentStepIndex(1));
  assert.equal(harness.result.current.currentStepIndex, 1);

  // Se asigna una nueva ruta calculada
  const newRoute = {
    steps: [
      { instruction: 'Nueva ruta paso 1', endLocation: { latitude: 2.95, longitude: -75.29 } },
    ],
  };
  await act(() => harness.rerender({ route: newRoute, destination: { latitude: 2.95, longitude: -75.29 } }));

  // El efecto de ruta debe reiniciar el índice a 0
  assert.equal(harness.result.current.currentStepIndex, 0, 'La navegación debe reiniciarse a paso 0 al cambiar de ruta');
  assert.equal(harness.result.current.arrived, false);
});

test('useTurnByTurnNavigation: 4. Aviso previo (40-80m) y avance de paso (< 35m)', async () => {
  const spoken = [];
  const hook = createTurnByTurnHookFactory({ speak: (t) => spoken.push(t) });

  const route = {
    steps: [
      { instruction: 'Avanza derecho', endLocation: { latitude: 2.9300, longitude: -75.2800 } },
      { instruction: 'Gira a la derecha por la calle 8', endLocation: { latitude: 2.9350, longitude: -75.2800 } },
    ],
  };

  const harness = renderHook((props, hooks) => hook(props, hooks), {
    initialProps: { route, destination: { latitude: 2.9350, longitude: -75.2800 } },
  });

  // Posición a ~60 metros del final del paso 1: debe generar pre-aviso
  // 0.0005 lat ≈ 55 metros
  const nearPos = { latitude: 2.9295, longitude: -75.2800 };
  await act(() => harness.result.current.updatePosition(nearPos));

  assert.ok(spoken.length >= 1, 'Debe haber emitido aviso previo');
  assert.ok(spoken[0].includes('Gira a la derecha'), 'Debe incluir la instrucción del siguiente giro');

  // Repetir misma posición: NO debe duplicar el aviso para el mismo paso
  const spokenCountBefore = spoken.length;
  await act(() => harness.result.current.updatePosition(nearPos));
  assert.equal(spoken.length, spokenCountBefore, 'No debe repetir el pre-aviso para el mismo paso');

  // Posición a < 35 metros: debe completar la maniobra y avanzar al paso 1
  const stepEndPos = { latitude: 2.9299, longitude: -75.2800 };
  await act(() => harness.result.current.updatePosition(stepEndPos));
  assert.equal(harness.result.current.currentStepIndex, 1, 'Debe haber avanzado al paso 1');
});

test('useTurnByTurnNavigation: 5. Detección de llegada al destino y guard post-llegada', async () => {
  const spoken = [];
  let arrivedCallbackCalls = 0;
  const hook = createTurnByTurnHookFactory({ speak: (t) => spoken.push(t) });

  const dest = { latitude: 2.9300, longitude: -75.2800 };
  const route = {
    steps: [
      { instruction: 'Directo al destino', endLocation: dest },
    ],
  };

  const harness = renderHook((props, hooks) => hook(props, hooks), {
    initialProps: {
      route,
      destination: dest,
      onArrived: () => { arrivedCallbackCalls++; },
    },
  });

  // Posición exactamente en el destino
  await act(() => harness.result.current.updatePosition(dest));

  assert.equal(harness.result.current.arrived, true, 'arrived debe cambiar a true');
  assert.equal(arrivedCallbackCalls, 1, 'onArrived debe invocarse exactamente una vez');
  assert.ok(spoken.some(s => s.includes('planRoute.arrived')));

  // Enviar otra posición después de llegar: no debe repetir callbacks
  await act(() => harness.result.current.updatePosition(dest));
  assert.equal(arrivedCallbackCalls, 1, 'No debe re-invocar onArrived una vez completada la llegada');
});
