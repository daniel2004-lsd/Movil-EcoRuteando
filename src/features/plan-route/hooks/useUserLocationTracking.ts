import { useState, useRef, useEffect, useCallback } from 'react';
import * as Location from 'expo-location';
import { haversineM } from '../../../utils/geo';
import type { PlacePoint } from '../types';
import type { GpsBreadcrumb } from '../../../services/trips';
import { tripTelemetryService } from '../services/tripTelemetryService';
import { tripLocationTask } from '../services/tripLocationTask';

interface Options {
  activeTripId: string | null;
  onPositionUpdate?: (pos: PlacePoint) => void;
  onInitialLocation?: (pos: PlacePoint) => void;
  isMountedRef?: React.MutableRefObject<boolean>;
}

export function useUserLocationTracking({
  activeTripId,
  onPositionUpdate,
  onInitialLocation,
  isMountedRef,
}: Options) {
  const [userPos, setUserPos] = useState<PlacePoint | null>(null);

  // Distancia real acumulada (m) y rastro GPS certificado para el backend
  const traveledDistMRef = useRef<number>(0);
  const gpsBreadcrumbsRef = useRef<GpsBreadcrumb[]>([]);
  const lastTrackPosRef = useRef<{ latitude: number; longitude: number } | null>(null);

  const clearTripTracking = useCallback(() => {
    traveledDistMRef.current = 0;
    gpsBreadcrumbsRef.current = [];
    lastTrackPosRef.current = null;
    tripLocationTask.resetTrackingMetrics();
  }, []);

  const handlePosition = useCallback(
    (coords: { latitude: number; longitude: number }) => {
      const p: PlacePoint = {
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
        const crumb: GpsBreadcrumb = {
          lat: p.latitude,
          lng: p.longitude,
          timestamp: Date.now(),
        };
        gpsBreadcrumbsRef.current.push(crumb);

        // Persistir periódicamente cada 5 muestras para resiliencia offline via servicio
        if (gpsBreadcrumbsRef.current.length % 5 === 0) {
          void tripTelemetryService.saveOfflineBreadcrumbs(activeTripId, gpsBreadcrumbsRef.current);
        }
      }

      onPositionUpdate?.(p);
    },
    [activeTripId, onPositionUpdate]
  );

  const getCurrentLocation = useCallback(
    async (isSilent = false) => {
      try {
        const servicesEnabled = await Location.hasServicesEnabledAsync().catch(() => true);
        if (!servicesEnabled) {
          return null;
        }

        const { status } = await Location.getForegroundPermissionsAsync();
        if (status !== 'granted') {
          const request = await Location.requestForegroundPermissionsAsync();
          if (request.status !== 'granted') {
            return null;
          }
        }

        const lastKnown = await Location.getLastKnownPositionAsync().catch(() => null);
        if (lastKnown?.coords) {
          const lastUserLocation: PlacePoint = {
            latitude: lastKnown.coords.latitude,
            longitude: lastKnown.coords.longitude,
            name: 'Mi ubicación',
          };
          setUserPos(lastUserLocation);
          onInitialLocation?.(lastUserLocation);
        }

        const freshLocation = await Promise.race([
          Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }).catch(() => null),
          new Promise<null>(resolve => setTimeout(() => resolve(null), 6000)),
        ]);

        if (isMountedRef && !isMountedRef.current) return null;

        if (freshLocation?.coords) {
          const userLocation: PlacePoint = {
            latitude: freshLocation.coords.latitude,
            longitude: freshLocation.coords.longitude,
            name: 'Mi ubicación',
          };
          setUserPos(userLocation);
          onInitialLocation?.(userLocation);
          return userLocation;
        }
        return null;
      } catch (error) {
        if (!isSilent) {
          console.error('[GPS] Error obteniendo ubicación:', error);
        }
        return null;
      }
    },
    [isMountedRef, onInitialLocation]
  );

  // Cargar evidencia offline previa si se está reanudando o recuperando un viaje activo
  useEffect(() => {
    if (!activeTripId) return;
    void tripTelemetryService.getOfflineBreadcrumbs(activeTripId).then(crumbs => {
      if (crumbs.length > 0 && gpsBreadcrumbsRef.current.length === 0) {
        gpsBreadcrumbsRef.current = crumbs;
      }
    }).catch(() => {});
  }, [activeTripId]);

  // Suscripción a GPS con Foreground Service persistente mientras el viaje está activo
  // Garantiza MUTUA EXCLUSIÓN: si el servicio de segundo plano está activo, watchPositionAsync NO se ejecuta.
  useEffect(() => {
    if (!activeTripId) {
      void tripLocationTask.stopTracking();
      return;
    }

    let isMounted = true;
    let fallbackSub: Location.LocationSubscription | null = null;
    let unsubscribeTask: (() => void) | null = null;

    void (async () => {
      const perm = await Location.getForegroundPermissionsAsync();
      if (perm.status !== 'granted') {
        const req = await Location.requestForegroundPermissionsAsync();
        if (req.status !== 'granted') return;
      }

      if (!isMounted) return;

      try {
        // 1. Intentar iniciar el Foreground Service persistente en segundo plano
        await tripLocationTask.startTracking(activeTripId);

        // 2. Suscribirse a las actualizaciones despachadas por la tarea
        unsubscribeTask = tripLocationTask.subscribe(update => {
          if (!isMounted) return;
          const p: PlacePoint = {
            latitude: update.latitude,
            longitude: update.longitude,
            name: 'Mi ubicación',
          };
          setUserPos(p);
          traveledDistMRef.current = update.totalDistanceM;
          gpsBreadcrumbsRef.current.push({
            lat: update.latitude,
            lng: update.longitude,
            timestamp: update.timestamp,
          });
          lastTrackPosRef.current = { latitude: update.latitude, longitude: update.longitude };
          onPositionUpdate?.(p);
        });
      } catch (taskErr) {
        // Fallback defensivo únicamente si el Foreground Service no puede ser iniciado (ej. simulador o sin task manager)
        if (!isMounted) return;
        console.warn('[GPS] Foreground service no disponible, usando fallback watchPositionAsync:', taskErr);
        fallbackSub = await Location.watchPositionAsync(
          { accuracy: Location.Accuracy.Balanced, timeInterval: 3000, distanceInterval: 10 },
          pos => handlePosition(pos.coords)
        );
      }
    })();

    return () => {
      isMounted = false;
      if (unsubscribeTask) {
        unsubscribeTask();
        unsubscribeTask = null;
      }
      if (fallbackSub) {
        fallbackSub.remove();
        fallbackSub = null;
      }
      void tripLocationTask.stopTracking();
    };
  }, [activeTripId, handlePosition, onPositionUpdate]);

  return {
    userPos,
    setUserPos,
    traveledDistMRef,
    gpsBreadcrumbsRef,
    lastTrackPosRef,
    clearTripTracking,
    getCurrentLocation,
    handlePosition,
  };
}
