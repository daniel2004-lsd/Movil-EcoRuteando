import { useState, useRef, useCallback } from 'react';
import { Platform, ToastAndroid } from 'react-native';
import { Dialog } from '../../../shared/components/ui/AppDialog';
import {
  searchPlaces,
  getPlaceDetails,
  getDirections,
  getSustainabilityEstimate,
  decodePolyline,
  encodePolyline,
  type PlaceSuggestion,
  type SustainabilityEstimate,
  type NearbyPlace,
} from '../../../services/maps/googleMaps';
import { haversineM } from '../../../utils/geo';
import type { PlacePoint, TransportMode, RouteFitPadding } from '../types';

interface RoutePlanningCallbacks {
  t: (key: string) => string;
  onRouteCalculated?: (route: any, coords: any[]) => void;
  onRouteCleared?: () => void;
  fitPadding?: RouteFitPadding;
}

export function useRoutePlanning({ t, onRouteCalculated, onRouteCleared, fitPadding }: RoutePlanningCallbacks) {
  const [mode, setMode] = useState<TransportMode>('driving');
  const [origin, setOrigin] = useState<PlacePoint | null>(null);
  const [destination, setDestination] = useState<PlacePoint | null>(null);
  const [originQuery, setOriginQuery] = useState('');
  const [destQuery, setDestQuery] = useState('');
  const [originSuggestions, setOriginSuggestions] = useState<PlaceSuggestion[]>([]);
  const [destSuggestions, setDestSuggestions] = useState<PlaceSuggestion[]>([]);
  const [showOriginSuggestions, setShowOriginSuggestions] = useState(false);
  const [showDestSuggestions, setShowDestSuggestions] = useState(false);

  const [loading, setLoading] = useState(false);
  const [route, setRoute] = useState<any>(null);
  const [routeAlts, setRouteAlts] = useState<any[]>([]);
  const [estimate, setEstimate] = useState<SustainabilityEstimate | null>(null);
  const [selectedRouteIndex, setSelectedRouteIndex] = useState(0);

  const [routeStop, setRouteStop] = useState<PlacePoint | null>(null);
  const [pickingStop, setPickingStop] = useState(false);

  const originTimer = useRef<any>(null);
  const destTimer = useRef<any>(null);

  const handleOriginChange = useCallback((text: string) => {
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
    }, 350);
  }, []);

  const handleDestChange = useCallback((text: string) => {
    setDestQuery(text);
    if (destTimer.current) clearTimeout(destTimer.current);
    if (text.length < 2) {
      setDestSuggestions([]);
      setShowDestSuggestions(false);
      return;
    }
    destTimer.current = setTimeout(async () => {
      const results = await searchPlaces(text);
      setDestSuggestions(results);
      setShowDestSuggestions(true);
    }, 350);
  }, []);

  const selectOrigin = useCallback(async (suggestion: PlaceSuggestion) => {
    const detail = await getPlaceDetails(suggestion.placeId);
    if (detail) {
      setOrigin({ latitude: detail.latitude, longitude: detail.longitude, name: detail.name });
      setOriginQuery(detail.name);
      setShowOriginSuggestions(false);
    }
  }, []);

  const selectDestination = useCallback(async (suggestion: PlaceSuggestion, onCenterMap?: (coords: { latitude: number; longitude: number }) => void) => {
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
    async (
      selectedMode: TransportMode = mode,
      o: PlacePoint | null = origin,
      d: PlacePoint | null = destination,
      stop: PlacePoint | null = routeStop
    ) => {
      if (!o || !d) {
        Dialog.alert(t('auth.errorTitle'), t('planRoute.selectOriginDest'), { tone: 'error' });
        return null;
      }

      setLoading(true);
      try {
        let directions: any = null;

        if (stop) {
          const leg1 = await getDirections(
            { latitude: o.latitude, longitude: o.longitude },
            { latitude: stop.latitude, longitude: stop.longitude },
            selectedMode
          );
          const leg2 = await getDirections(
            { latitude: stop.latitude, longitude: stop.longitude },
            { latitude: d.latitude, longitude: d.longitude },
            selectedMode
          );

          if (leg1 && leg2) {
            const coords = [
              ...decodePolyline(leg1.polyline),
              ...decodePolyline(leg2.polyline),
            ];
            const totalValue = leg1.distance.value + leg2.distance.value;
            const totalDuration = leg1.duration.value + leg2.duration.value;
            directions = {
              polyline: encodePolyline(coords),
              distance: {
                text: `${(totalValue / 1000).toFixed(1)} km`,
                value: totalValue,
              },
              duration: {
                text: `${Math.round(totalDuration / 60)} min`,
                value: totalDuration,
              },
              steps: [...(leg1.steps || []), ...(leg2.steps || [])],
              bounds: leg1.bounds,
            };
          }
        } else {
          directions = await getDirections(
            { latitude: o.latitude, longitude: o.longitude },
            { latitude: d.latitude, longitude: d.longitude },
            selectedMode
          );
        }

        if (directions) {
          const coords = decodePolyline(directions.polyline);
          setRoute(directions);
          setRouteAlts(directions.alternatives ?? []);
          setEstimate(null);
          setSelectedRouteIndex(0);

          onRouteCalculated?.(directions, coords);

          void getSustainabilityEstimate(
            { latitude: o.latitude, longitude: o.longitude },
            { latitude: d.latitude, longitude: d.longitude },
            selectedMode
          ).then(setEstimate).catch(() => {});

          return directions;
        } else {
          Dialog.alert(t('auth.errorTitle'), t('planRoute.routeNotFound'), { tone: 'error' });
          return null;
        }
      } catch (error) {
        console.error('Error calculating route:', error);
        Dialog.alert(t('auth.errorTitle'), t('planRoute.routeCalcError'), { tone: 'error' });
        return null;
      } finally {
        setLoading(false);
      }
    },
    [mode, origin, destination, routeStop, onRouteCalculated, t]
  );

  const changeMode = useCallback(
    (newMode: TransportMode) => {
      setMode(newMode);
      if (origin && destination) {
        calculateRoute(newMode);
      }
    },
    [origin, destination, calculateRoute]
  );

  const handleSelectRoute = useCallback(
    (index: number, onFit?: (coords: any[]) => void) => {
      if (!route) return;
      const all = [route, ...routeAlts];
      if (index <= 0 || index >= all.length) return;
      const chosen = all[index];
      const rest = all.filter((_, i) => i !== index);
      setRoute(chosen);
      setRouteAlts(rest.slice(1));
      setSelectedRouteIndex(0);

      const coords = decodePolyline(chosen.polyline);
      if (coords.length) {
        onFit?.(coords);
      }
    },
    [route, routeAlts]
  );

  const routeMetrics = useCallback(() => {
    if (!route?.distance?.value || !route?.duration?.value) {
      return { distanceKm: 0, durationMin: 0 };
    }
    return {
      distanceKm: Number((route.distance.value / 1000).toFixed(2)),
      durationMin: Math.round(route.duration.value / 60),
    };
  }, [route]);

  const routeMidpoint = useCallback((): { latitude: number; longitude: number } | null => {
    if (!route?.polyline) return null;
    const pts = decodePolyline(route.polyline);
    if (!pts.length) return null;
    return pts[Math.floor(pts.length / 2)] ?? null;
  }, [route]);

  const addStop = useCallback(
    async (place: NearbyPlace) => {
      const stop: PlacePoint = {
        latitude: place.latitude,
        longitude: place.longitude,
        name: place.name,
      };
      setPickingStop(false);
      setRouteStop(stop);
      if (Platform.OS === 'android') {
        ToastAndroid.show(`Parada agregada: ${place.name}`, ToastAndroid.SHORT);
      }
      if (origin && destination) {
        await calculateRoute(mode, origin, destination, stop);
      }
    },
    [origin, destination, mode, calculateRoute]
  );

  const removeStop = useCallback(async () => {
    setRouteStop(null);
    if (origin && destination) {
      await calculateRoute(mode, origin, destination, null);
    }
  }, [origin, destination, mode, calculateRoute]);

  const resetRoute = useCallback(() => {
    setRoute(null);
    setRouteAlts([]);
    setEstimate(null);
    setRouteStop(null);
    setPickingStop(false);
    setSelectedRouteIndex(0);
    onRouteCleared?.();
  }, [onRouteCleared]);

  return {
    mode,
    setMode,
    changeMode,
    origin,
    setOrigin,
    destination,
    setDestination,
    originQuery,
    setOriginQuery,
    destQuery,
    setDestQuery,
    originSuggestions,
    destSuggestions,
    showOriginSuggestions,
    setShowOriginSuggestions,
    showDestSuggestions,
    setShowDestSuggestions,
    handleOriginChange,
    handleDestChange,
    selectOrigin,
    selectDestination,
    clearOrigin,
    clearDest,
    swapLocations,
    loading,
    route,
    setRoute,
    routeAlts,
    setRouteAlts,
    estimate,
    setEstimate,
    selectedRouteIndex,
    setSelectedRouteIndex,
    handleSelectRoute,
    calculateRoute,
    routeMetrics,
    routeMidpoint,
    routeStop,
    setRouteStop,
    pickingStop,
    setPickingStop,
    addStop,
    removeStop,
    resetRoute,
  };
}
