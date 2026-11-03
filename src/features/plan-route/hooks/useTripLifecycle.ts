import { useState, useRef, useCallback, useEffect } from 'react';
import { Platform, ToastAndroid, Share } from 'react-native';
import { Dialog } from '../../../shared/components/ui/AppDialog';
import apiClient from '../../../shared/services/apiClient';
import {
  saveRoute,
  startTrip,
  completeTrip,
  findRouteIdByName,
  syncOfflineTrips,
  type GpsBreadcrumb,
} from '../../../services/trips';
import { tripTelemetryService } from '../services/tripTelemetryService';
import { buildSavePayload, apiErrorMessage } from '../utils/tripPayloadBuilder';
import type { PlacePoint, TransportMode } from '../types';

interface TripLifecycleOptions {
  t: (key: string) => string;
  router: any;
  route: any;
  origin: PlacePoint | null;
  destination: PlacePoint | null;
  mode: TransportMode;
  estimate: any;
  traveledDistMRef: React.MutableRefObject<number>;
  gpsBreadcrumbsRef: React.MutableRefObject<GpsBreadcrumb[]>;
  lastTrackPosRef: React.MutableRefObject<{ latitude: number; longitude: number } | null>;
  speak?: (text: string) => void;
  onTripStarted?: (startedTripId: string) => void;
  onTripCompleted?: () => void;
}

export function useTripLifecycle({
  t,
  router,
  route,
  origin,
  destination,
  mode,
  estimate,
  traveledDistMRef,
  gpsBreadcrumbsRef,
  lastTrackPosRef,
  speak,
  onTripStarted,
  onTripCompleted,
}: TripLifecycleOptions) {
  const [activeTripId, setActiveTripId] = useState<string | null>(null);
  const [startingTrip, setStartingTrip] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [tripError, setTripError] = useState<string | null>(null);

  const [routeSavedId, setRouteSavedId] = useState<string | null>(null);
  const [routeSaved, setRouteSaved] = useState(false);
  const [routeFav, setRouteFav] = useState(false);

  const tripStartedAtRef = useRef<number | null>(null);
  const favIdsRef = useRef<Set<string>>(new Set());

  // Cargar ids de favoritos para identificar si la ruta activa ya es favorita
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const { data } = await apiClient.get('/api/favorites');
        const items: any[] = Array.isArray(data) ? data : (data?.items ?? []);
        const ids = new Set<string>(
          items.map((r: any) => r?.routeId ?? r?.id).filter(Boolean)
        );
        if (active) favIdsRef.current = ids;
      } catch {}
    })();
    return () => {
      active = false;
    };
  }, []);

  const getSavePayload = useCallback(
    (o: PlacePoint, d: PlacePoint, directRoute?: any) => {
      return buildSavePayload(
        o,
        d,
        directRoute || route,
        mode,
        estimate,
        t('planRoute.origin'),
        t('planRoute.destination'),
        t('planRoute.routeFromApp')
      );
    },
    [route, mode, estimate, t]
  );

  // Regla CU03: si la ruta ya existe por nombre, se reusa en vez de fallar.
  const saveRouteSmart = useCallback(
    async (
      payload: ReturnType<typeof buildSavePayload>
    ): Promise<{ id: string; reused: boolean }> => {
      try {
        const id = await saveRoute(payload);
        return { id, reused: false };
      } catch (saveErr: any) {
        const msg = apiErrorMessage(saveErr);
        if (msg.includes('Ya existe una ruta con el nombre')) {
          const rid = await findRouteIdByName(payload.name);
          console.log('[RUTA] duplicada, se reusa:', rid);
          if (rid) return { id: rid, reused: true };
        }
        throw saveErr;
      }
    },
    []
  );

  const refreshFavoriteFlag = useCallback(
    async (o: PlacePoint, d: PlacePoint) => {
      try {
        const rid = await findRouteIdByName(getSavePayload(o, d).name);
        setRouteFav(!!rid && favIdsRef.current.has(rid));
      } catch {
        setRouteFav(false);
      }
    },
    [getSavePayload]
  );

  const startTripFlowWith = useCallback(
    async (o: PlacePoint, d: PlacePoint, directRoute?: any) => {
      const activeRoute = directRoute || route;
      if (!activeRoute || startingTrip) return;
      setStartingTrip(true);
      setTripError(null);
      try {
        let rid = routeSavedId;
        if (!rid) {
          const payload = getSavePayload(o, d, activeRoute);
          console.log('[VIAJE] saveRoute payload:', JSON.stringify(payload).slice(0, 400));
          rid = (await saveRouteSmart(payload)).id;
          setRouteSavedId(rid);
        }
        const started = await startTrip({
          routeId: rid,
          transportMode: mode === 'driving' ? 'car' : 'walking',
          source: 'mobile',
        });

        setActiveTripId(started.id);
        gpsBreadcrumbsRef.current = [];
        syncOfflineTrips().catch(() => {});
        traveledDistMRef.current = 0;
        lastTrackPosRef.current = null;
        tripStartedAtRef.current = Date.now();

        const firstStep = activeRoute?.steps?.[0];
        speak?.(
          t('planRoute.navStartedSpeak').replace('{name}', d.name) +
            (firstStep?.instruction ? ' ' + firstStep.instruction : '')
        );
        console.log('[VIAJE] iniciado id=', started.id, 'steps=', activeRoute?.steps?.length ?? 0);
        onTripStarted?.(started.id);
      } catch (err: any) {
        console.log('[VIAJE] ERROR iniciar:', JSON.stringify(err?.response?.data ?? err?.message));
        setTripError(
          err?.response?.data?.detail ||
            err?.response?.data?.message ||
            err?.message ||
            t('planRoute.startTripError')
        );
      } finally {
        setStartingTrip(false);
      }
    },
    [
      route,
      startingTrip,
      routeSavedId,
      getSavePayload,
      saveRouteSmart,
      mode,
      gpsBreadcrumbsRef,
      traveledDistMRef,
      lastTrackPosRef,
      speak,
      t,
      onTripStarted,
    ]
  );

  const completeTripFlow = useCallback(async () => {
    if (!activeTripId || !route || completing) return;
    setCompleting(true);
    setTripError(null);
    try {
      const realDistKm = Number((traveledDistMRef.current / 1000).toFixed(2));
      const realDurMin = tripStartedAtRef.current
        ? Math.max(1, Math.round((Date.now() - tripStartedAtRef.current) / 60000))
        : 0;

      // ELIMINADO EL FALLBACK: La distancia reportada es ÚNICAMENTE la evidencia real registrada.
      // El backend es la autoridad certificadora que calcula y valida el trayecto.
      const samples = gpsBreadcrumbsRef.current;
      const gpsDataJson = samples.length > 0 ? JSON.stringify(samples) : undefined;

      await completeTrip(activeTripId, {
        actualDistanceKm: realDistKm,
        actualDurationMin: realDurMin,
        actualCo2Kg: null, // Calculado por el backend en base a PostGIS
        endedAt: new Date().toISOString(),
        gpsDataJson,
      });

      // Limpiar rastro de storage local al completar exitosamente mediante servicio
      await tripTelemetryService.removeOfflineBreadcrumbs(activeTripId);
      gpsBreadcrumbsRef.current = [];
      console.log('[VIAJE] completado enviado a validación | realDist=', realDistKm, 'km | durMin=', realDurMin);

      setActiveTripId(null);
      traveledDistMRef.current = 0;
      lastTrackPosRef.current = null;
      tripStartedAtRef.current = null;

      onTripCompleted?.();

      Dialog.alert(
        t('planRoute.tripCompletedTitle'),
        t('planRoute.tripCompletedMsg'),
        [
          { text: t('planRoute.close') },
          { text: t('planRoute.viewHistory'), onPress: () => router.push('/(tabs)/history') },
        ]
      );
    } catch (err: any) {
      setTripError(
        err?.response?.data?.message || err?.message || t('planRoute.tripErrorFallback')
      );
    } finally {
      setCompleting(false);
    }
  }, [
    activeTripId,
    route,
    completing,
    traveledDistMRef,
    gpsBreadcrumbsRef,
    lastTrackPosRef,
    onTripCompleted,
    t,
    router,
  ]);

  const toggleFavorite = useCallback(async () => {
    if (!route || !origin || !destination) return;
    try {
      let rid = routeSavedId;
      if (!rid) {
        const payload = getSavePayload(origin, destination);
        const byName = await findRouteIdByName(payload.name);
        rid = byName ?? (await saveRouteSmart(payload)).id;
        setRouteSavedId(rid);
        setRouteSaved(true);
      }
      const wasFav = favIdsRef.current.has(rid);
      if (wasFav) {
        await apiClient.delete(`/api/favorites/${rid}`);
        favIdsRef.current.delete(rid);
        setRouteFav(false);
        if (Platform.OS === 'android') {
          ToastAndroid.show(t('planRoute.favoriteRemoved'), ToastAndroid.SHORT);
        } else {
          Dialog.alert(t('planRoute.favoriteRemoved'), t('planRoute.favoriteRemovedMsg'));
        }
      } else {
        await apiClient.post('/api/favorites', { routeId: rid });
        favIdsRef.current.add(rid);
        setRouteFav(true);
        if (Platform.OS === 'android') {
          ToastAndroid.show(t('planRoute.favoriteAdded'), ToastAndroid.SHORT);
        } else {
          Dialog.alert(t('planRoute.favoriteAdded'), t('planRoute.favoriteAddedMsg'));
        }
      }
    } catch (e: any) {
      const msg = apiErrorMessage(e);
      Dialog.alert(t('favorites.title'), msg || t('planRoute.unexpectedError'), { tone: 'error' });
    }
  }, [route, origin, destination, routeSavedId, getSavePayload, saveRouteSmart, t]);

  const saveCurrentRoute = useCallback(async () => {
    if (!route || !origin || !destination || routeSaved) return;
    try {
      const payload = getSavePayload(origin, destination);
      console.log(
        '[RUTA] guardar intento:',
        JSON.stringify({
          name: payload.name,
          startName: payload.startName,
          destinationName: payload.destinationName,
          transportType: payload.transportType,
          distanceKm: payload.distanceKm,
          estimatedTimeMin: payload.estimatedTimeMin,
        })
      );
      let rid = routeSavedId;
      let reused = false;
      if (!rid) {
        const res = await saveRouteSmart(payload);
        rid = res.id;
        reused = res.reused;
      }
      setRouteSavedId(rid);
      setRouteSaved(true);
      if (reused) {
        Dialog.alert(
          t('planRoute.routeAlreadySaved'),
          t('planRoute.routeAlreadySavedMsg'),
          { tone: 'info' }
        );
      } else if (Platform.OS === 'android') {
        ToastAndroid.show(t('planRoute.routeSaved'), ToastAndroid.SHORT);
      } else {
        Dialog.alert(t('planRoute.routeSaved'), t('planRoute.routeSavedMsg'));
      }
    } catch (e: any) {
      const msg = apiErrorMessage(e);
      console.log('[RUTA] guardar ERROR:', msg || e?.message);
      Dialog.alert(t('planRoute.saveError'), msg || t('planRoute.unexpectedError'), { tone: 'error' });
    }
  }, [route, origin, destination, routeSaved, getSavePayload, routeSavedId, saveRouteSmart, t]);

  const shareRoute = useCallback(async () => {
    if (!route || !origin || !destination) return;
    try {
      await Share.share({
        message:
          `Ruta en EcoRuteando\n` +
          `Origen: ${origin.name}\n` +
          `Destino: ${destination.name}\n` +
          `Distancia: ${route?.distance?.text || ''}\n` +
          `Tiempo: ${route?.duration?.text || ''}\n\n` +
          `Abre EcoRuteando para seguir este trayecto sostenible.`,
      });
    } catch (e) {
      console.warn('Error sharing route:', e);
    }
  }, [route, origin, destination]);

  const resetTripState = useCallback(() => {
    setActiveTripId(null);
    setStartingTrip(false);
    setCompleting(false);
    setTripError(null);
    setRouteSavedId(null);
    setRouteSaved(false);
    setRouteFav(false);
    tripStartedAtRef.current = null;
  }, []);

  return {
    activeTripId,
    setActiveTripId,
    startingTrip,
    completing,
    tripError,
    setTripError,
    routeSavedId,
    setRouteSavedId,
    routeSaved,
    setRouteSaved,
    routeFav,
    setRouteFav,
    tripStartedAtRef,
    startTripFlowWith,
    completeTripFlow,
    toggleFavorite,
    saveCurrentRoute,
    shareRoute,
    refreshFavoriteFlag,
    getSavePayload,
    saveRouteSmart,
    resetTripState,
  };
}
