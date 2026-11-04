import { useState, useRef, useCallback, useEffect } from 'react';
import * as Speech from 'expo-speech';
import { haversineM } from '../../../utils/geo';
import type { PlacePoint } from '../types';

interface NavigationOptions {
  route: any;
  destination: PlacePoint | null;
  t: (key: string) => string;
  onArrived?: () => void;
  onRecenter?: (coords: { latitude: number; longitude: number }, delta: number) => void;
}

export function useTurnByTurnNavigation({
  route,
  destination,
  t,
  onArrived,
  onRecenter,
}: NavigationOptions) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [arrived, setArrived] = useState(false);
  const [voiceOn, setVoiceOn] = useState(true);

  const stepIndexRef = useRef(0);
  const arrivedRef = useRef(false);
  const voiceOnRef = useRef(true);
  const preAlertRef = useRef<Set<number>>(new Set());
  const routeRef = useRef<any>(null);
  const destinationRef = useRef<PlacePoint | null>(null);

  routeRef.current = route;
  destinationRef.current = destination;
  voiceOnRef.current = voiceOn;

  const speak = useCallback((text: string) => {
    if (!voiceOnRef.current || !text) return;
    Speech.stop()
      .catch(() => {})
      .then(() => {
        if (!voiceOnRef.current) return;
        try {
          Speech.speak(text, { language: 'es-ES', rate: 1.05 });
        } catch {}
      });
  }, []);

  const toggleVoice = useCallback(() => {
    const next = !voiceOnRef.current;
    voiceOnRef.current = next;
    setVoiceOn(next);
    if (!next) Speech.stop();
  }, []);

  const resetNavigation = useCallback(() => {
    stepIndexRef.current = 0;
    setCurrentStepIndex(0);
    arrivedRef.current = false;
    setArrived(false);
    preAlertRef.current.clear();
    Speech.stop();
  }, []);

  // Limpiar navegación al cambiar de ruta
  useEffect(() => {
    resetNavigation();
  }, [route, resetNavigation]);

  const updatePosition = useCallback(
    (p: PlacePoint) => {
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
            speak(`En ${m} metros, ${nextS.instruction}`);
          }
        }

        // 2. Avance de maniobra al aproximarse al final del paso actual
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
            speak(steps[newIdx].instruction);
          }
          onRecenter?.(p, 0.006);
          return;
        }
      }

      // 3. Detección de llegada al destino final
      const dest = destinationRef.current;
      if (dest && !arrivedRef.current && haversineM(p, dest) < 40) {
        arrivedRef.current = true;
        setArrived(true);
        stepIndexRef.current = steps.length;
        setCurrentStepIndex(steps.length);
        onRecenter?.(p, 0.005);
        speak(t('planRoute.arrivedSpeak'));
        onArrived?.();
        return;
      }
    },
    [speak, onRecenter, onArrived, t]
  );

  return {
    currentStepIndex,
    setCurrentStepIndex,
    arrived,
    setArrived,
    voiceOn,
    setVoiceOn,
    toggleVoice,
    speak,
    resetNavigation,
    updatePosition,
  };
}
