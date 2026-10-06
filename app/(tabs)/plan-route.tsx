import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Keyboard,
  Platform,
  ToastAndroid,
  Share,
  PanResponder,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import * as Speech from 'expo-speech';
import MapView, { Marker, Polyline, UrlTile, Callout, PROVIDER_GOOGLE } from '../../src/components/maps/MapEngine';
import Constants from 'expo-constants';
import BottomSheet from '@gorhom/bottom-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeMode } from '../../src/shared/store/ThemeContext';
import { useLanguage } from '../../src/shared/store/LanguageContext';
import { TAB_BAR_HEIGHT } from '../../src/shared/theme';
import { useAuth } from '../../src/shared/store/AuthContext';
import { MapSearchPanel } from '../../src/components/maps/MapSearchPanel';
import { ExploreSheet, type ExploreAction, type ExplorePlace } from '../../src/components/maps/ExploreSheet';
import { MapFab } from '../../src/components/maps/MapFab';
import { RouteBottomSheet } from '../../src/components/maps/RouteBottomSheet';
import { NavigationBanner } from '../../src/components/maps/NavigationBanner';
import { PoiChips } from '../../src/components/maps/PoiChips';
import { PoiResultsSheet } from '../../src/components/maps/PoiResultsSheet';
import { AddStopSheet } from '../../src/components/maps/AddStopSheet';
import { ReportVoteSheet } from '../../src/components/maps/ReportVoteSheet';
import { ReportFormSheet } from '../../src/components/maps/ReportFormSheet';
import { useMapRegion } from '../../src/hooks/useMapRegion';
import {
  searchPlaces,
  getPlaceDetails,
  getDirections,
  getSustainabilityEstimate,
  getNearbyPlaces,
  decodePolyline,
  encodePolyline,
  TRANSPORT_MODES,
  POI_CATEGORIES,
  type PlaceSuggestion,
  type SustainabilityEstimate,
  type PoiCategory,
  type NearbyPlace,
} from '../../src/services/maps/googleMaps';
import { saveRoute, startTrip, completeTrip, findRouteIdByName } from '../../src/services/trips';
import {
  getNearbyReports,
  voteReport,
  type NearbyReport,
} from '../../src/services/reports';
import { haversineM, formatMeters } from '../../src/utils/geo';

type TransportMode = 'driving' | 'walking';

interface PlacePoint {
  latitude: number;
  longitude: number;
  name: string;
}

const NEIVA_PLACES = [
  { name: 'Parque Santander', lat: 2.9273, lng: -75.2819 },
  { name: 'Terminal de Transporte', lat: 2.9150, lng: -75.285 },
  { name: 'CC Unicentro', lat: 2.94, lng: -75.28 },
  { name: 'Universidad Surcolombiana', lat: 2.945, lng: -75.283 },
];

const EXPLORE_PEEK = 190;

const ROUTE_SHEET_MIN_SNAP = 0.68;
const ROUTE_SNAP_PERCENTS = [ROUTE_SHEET_MIN_SNAP, 0.82, 0.95];
const SHEET_CONTENT_RESERVE = 0;
const SCREEN_H = Dimensions.get('window').height;
const SCREEN_W = Dimensions.get('window').width;
const ROUTE_FIT_PADDING = {
  top: 120,
  right: 60,
  bottom: Math.round(SCREEN_H * ROUTE_SHEET_MIN_SNAP) + 20,
  left: 60,
};

export default function PlanRouteScreen() {
  const router = useRouter();
  const { theme } = useThemeMode();
  const { t } = useLanguage();
  const { auth } = useAuth();
  const isGuest = !!auth.guest;
  const isDark = theme === 'dark';
  const insets = useSafeAreaInsets();

  const requireAccount = (action: string) => {
    Alert.alert(
      t('planRoute.needAccountTitle'),
      t('planRoute.needAccountMsg').replace('{action}', action),
      [
        { text: t('planRoute.notNow'), style: 'cancel' },
        { text: t('auth.loginButton'), onPress: () => router.push('/(auth)/login') },
      ]
    );
  };

  const isExpoGo = Constants.executionEnvironment === 'storeClient';
  console.log('[MAPA] execEnv =', Constants.executionEnvironment, '| isExpoGo =', isExpoGo, '| tema =', theme);

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
  const [routeSavedId, setRouteSavedId] = useState<string | null>(null);
  const [activeTripId, setActiveTripId] = useState<string | null>(null);
  const [startingTrip, setStartingTrip] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [tripError, setTripError] = useState<string | null>(null);
  const [userPos, setUserPos] = useState<PlacePoint | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [arrived, setArrived] = useState(false);
  const [voiceOn, setVoiceOn] = useState(true);
  const [selectedRouteIndex, setSelectedRouteIndex] = useState(0);
  const [showBottomSheet, setShowBottomSheet] = useState(false);
  const [sheetIndex, setSheetIndex] = useState(0);
  const [pillPos, setPillPos] = useState<{ left: number; top: number } | null>(null);
  const pillPosRef = useRef<{ left: number; top: number } | null>(null);
  const pillStartRef = useRef<{ left: number; top: number } | null>(null);
  const pillSizeRef = useRef({ w: 210, h: 44 });
  const pillRef = useRef<any>(null);
  const insetsRef = useRef(insets.top);
  insetsRef.current = insets.top;
  const [searchExpanded, setSearchExpanded] = useState(false);
  const [activePoiCategory, setActivePoiCategory] = useState<PoiCategory | null>(null);
  const [poiPlaces, setPoiPlaces] = useState<NearbyPlace[]>([]);
  const [loadingPois, setLoadingPois] = useState(false);
  const [selectedPoiId, setSelectedPoiId] = useState<string | null>(null);
  const [showPoiSheet, setShowPoiSheet] = useState(false);
  const [nearbyReports, setNearbyReports] = useState<NearbyReport[]>([]);
  const [votingId, setVotingId] = useState<string | null>(null);
  const [selectedReport, setSelectedReport] = useState<NearbyReport | null>(null);
  const [routeStop, setRouteStop] = useState<PlacePoint | null>(null);
  const [pickingStop, setPickingStop] = useState(false);
  const [routeSaved, setRouteSaved] = useState(false);
  const [reportSheetOpen, setReportSheetOpen] = useState(false);

  const { region, setRegion, syncRegion, fitToCoordinates } = useMapRegion();
  const mapRef = useRef<any>(null);
  const bottomSheetRef = useRef<any>(null);
  const originTimer = useRef<any>(null);
  const destTimer = useRef<any>(null);
  const routeRef = useRef<any>(null);
  const destinationRef = useRef<PlacePoint | null>(null);
  const stepIndexRef = useRef(0);
  const arrivedRef = useRef(false);
  const lastRecenterRef = useRef<{ latitude: number; longitude: number } | null>(null);
  const completeTripFlowRef = useRef<() => void>(() => {});
  const voiceOnRef = useRef(true);
  const preAlertRef = useRef<Set<number>>(new Set());
  const reportRefreshTimer = useRef<any>(null);

  useEffect(() => {
    getCurrentLocation();
    refreshNearbyReports();
  }, []);

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(t('planRoute.permissionDeniedTitle'), t('planRoute.locationDeniedMsg'));
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const userLocation: PlacePoint = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        name: t('planRoute.myLocation'),
      };
      setUserPos(userLocation);
      setOrigin(userLocation);
      setOriginQuery(t('planRoute.myLocation'));
      setRegion({
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      });
    } catch (error) {
      console.error('Error getting location:', error);
    }
  };

  const handleOriginChange = (text: string) => {
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
  };

  const handleDestChange = (text: string) => {
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
  };

  const selectOrigin = async (suggestion: PlaceSuggestion) => {
    const detail = await getPlaceDetails(suggestion.placeId);
    if (detail) {
      setOrigin({ latitude: detail.latitude, longitude: detail.longitude, name: detail.name });
      setOriginQuery(detail.name);
      setShowOriginSuggestions(false);
    }
  };

  const selectDestination = async (suggestion: PlaceSuggestion) => {
    const detail = await getPlaceDetails(suggestion.placeId);
    if (detail) {
      setDestination({ latitude: detail.latitude, longitude: detail.longitude, name: detail.name });
      setDestQuery(detail.name);
      setShowDestSuggestions(false);
      setRegion({
        latitude: detail.latitude,
        longitude: detail.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      });
    }
  };

  const swapLocations = () => {
    const tempOrigin = origin;
    const tempOriginQuery = originQuery;
    setOrigin(destination);
    setOriginQuery(destQuery);
    setDestination(tempOrigin);
    setDestQuery(tempOriginQuery);
    setRoute(null);
    setRouteAlts([]);
    setEstimate(null);
    setRouteSavedId(null);
    setTripError(null);
    setShowBottomSheet(false);
  };

  const calculateRoute = async (
    selectedMode: TransportMode = mode,
    o: PlacePoint | null = origin,
    d: PlacePoint | null = destination,
    stop: PlacePoint | null = routeStop
  ) => {
    if (!o || !d) {
      console.log('[RUTA] calculateRoute sin origen/destino | o=', !!o, 'd=', !!d);
      Alert.alert(t('auth.errorTitle'), t('planRoute.selectOriginDest'));
      return;
    }

    console.log('[RUTA] calculateRoute INICIA | mode=', selectedMode, 'stop=', !!stop);
    setLoading(true);
    try {
      let directions: any = null;

      if (stop) {
        // Parada intermedia: origen → parada → destino (estilo Google Maps)
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
        console.log('[RUTA] directions OK | steps=', directions.steps?.length ?? 0, 'dist=', directions.distance?.text);
        const coords = decodePolyline(directions.polyline);
        setRoute(directions);
        setRouteAlts(directions.alternatives ?? []);
        setEstimate(null);
        setRouteSavedId(null);
        setRouteSaved(false);
        setTripError(null);
        if (coords.length > 0) {
          // Zoom interactivo estilo Google Maps: encuadre animado de la ruta
          // con espacio para la barra superior y el panel de ruta.
          if (mapRef.current?.fitToCoordinates) {
            mapRef.current.fitToCoordinates(coords, {
              edgePadding: ROUTE_FIT_PADDING,
              animated: true,
            });
          } else {
            fitToCoordinates(coords);
          }
        }
        setSelectedRouteIndex(0);
        setShowBottomSheet(true);
        getSustainabilityEstimate(
          { latitude: o.latitude, longitude: o.longitude },
          { latitude: d.latitude, longitude: d.longitude },
          selectedMode
        ).then(setEstimate);
      } else {
        Alert.alert(t('auth.errorTitle'), t('planRoute.routeNotFound'));
      }
    } catch (error) {
      console.error('Error calculating route:', error);
      console.log('[RUTA] ERROR:', JSON.stringify((error as any)?.message ?? String(error)));
      Alert.alert(t('auth.errorTitle'), t('planRoute.routeCalcError'));
    } finally {
      setLoading(false);
    }
  };

  const changeMode = (newMode: TransportMode) => {
    setMode(newMode);
    if (origin && destination) {
      calculateRoute(newMode);
    }
  };

  const routeMetrics = () => ({
    distanceKm: Number((route.distance.value / 1000).toFixed(2)),
    durationMin: Math.round(route.duration.value / 60),
  });

  // Selección de una ruta alternativa (estilo Google Maps): la elegida pasa a
  // ser la principal y las demás quedan como alternativas.
  const handleSelectRoute = (index: number) => {
    if (!route) return;
    const all = [route, ...routeAlts];
    if (index <= 0 || index >= all.length) return;
    const chosen = all[index];
    const rest = all.filter((_, i) => i !== index);
    setRoute(chosen);
    setRouteAlts(rest.slice(1));
    setSelectedRouteIndex(0);
    const coords = decodePolyline(chosen.polyline);
    if (coords.length && mapRef.current?.fitToCoordinates) {
      mapRef.current.fitToCoordinates(coords, {
        edgePadding: ROUTE_FIT_PADDING,
        animated: true,
      });
    }
    console.log('[RUTA] alternativa elegida →', chosen.duration?.text, '| otras:', rest.length - 1);
  };

  const buildSavePayload = (o: PlacePoint, d: PlacePoint) => {
    const { distanceKm, durationMin } = routeMetrics();
    return {
      name: `${o.name || t('planRoute.origin')} → ${d.name || t('planRoute.destination')}`,
      description: t('planRoute.routeFromApp'),
      transportType: mode === 'driving' ? 'car' : 'walking',
      startName: o.name || t('planRoute.origin'),
      destinationName: d.name || t('planRoute.destination'),
      startLat: o.latitude,
      startLng: o.longitude,
      endLat: d.latitude,
      endLng: d.longitude,
      encodedPolyline: route.polyline,
      distanceKm,
      estimatedTimeMin: durationMin,
      co2SavedKg: estimate?.co2SavedKg ?? null,
      estimatedCalories: estimate?.estimatedCalories ?? null,
    };
  };

  // Regla CU03: si la ruta ya existe por nombre, se reusa en vez de fallar.
  const saveRouteSmart = async (payload: ReturnType<typeof buildSavePayload>) => {
    try {
      return await saveRoute(payload);
    } catch (saveErr: any) {
      const msg = String(saveErr?.message ?? '');
      if (msg.includes('Ya existe una ruta con el nombre')) {
        const rid = await findRouteIdByName(payload.name);
        console.log('[RUTA] duplicada, se reusa:', rid);
        if (rid) return rid;
      }
      throw saveErr;
    }
  };

  const startTripFlow = async () => {
    console.log('[VIAJE] tap Iniciar viaje | route=', !!route, 'origin=', !!origin, 'dest=', !!destination, 'starting=', startingTrip);
    if (isGuest) return requireAccount(t('planRoute.actionStartTrips'));
    if (!route || !origin || !destination || startingTrip) {
      if (!origin || !destination) {
        const fallbackOrigin = route?.steps?.[0]?.startLocation;
        const fallbackDest = route?.steps?.[route.steps.length - 1]?.endLocation;
        if (fallbackOrigin?.latitude && fallbackDest?.latitude) {
          const o = origin ?? { ...fallbackOrigin, name: originQuery || t('planRoute.origin') };
          const d = destination ?? { ...fallbackDest, name: destQuery || t('planRoute.destination') };
          if (!origin) setOrigin(o);
          if (!destination) setDestination(d);
          return startTripFlowWith(o, d);
        }
        setTripError(t('planRoute.missingOriginDest'));
        return;
      }
      return;
    }
    return startTripFlowWith(origin, destination);
  };

  const startTripFlowWith = async (o: PlacePoint, d: PlacePoint) => {
    if (!route || startingTrip) return;
    setStartingTrip(true);
    setTripError(null);
    try {
      let rid = routeSavedId;
      if (!rid) {
        const payload = buildSavePayload(o, d);
        console.log('[VIAJE] saveRoute payload:', JSON.stringify(payload).slice(0, 400));
        rid = await saveRouteSmart(payload);
        setRouteSavedId(rid);
      }
      const started = await startTrip({
        routeId: rid,
        transportMode: mode === 'driving' ? 'car' : 'walking',
        source: 'mobile',
      });
      setActiveTripId(started.id);
      stepIndexRef.current = 0;
      setCurrentStepIndex(0);
      arrivedRef.current = false;
      setArrived(false);
      lastRecenterRef.current = null;
      preAlertRef.current.clear();
      const firstStep = route?.steps?.[0];
      speak(t('planRoute.navStartedSpeak').replace('{name}', d.name) + (firstStep?.instruction ? ' ' + firstStep.instruction : ''));
      console.log('[VIAJE] iniciado id=', started.id, 'steps=', route?.steps?.length ?? 0);
    } catch (err: any) {
      console.log('[VIAJE] ERROR iniciar:', JSON.stringify(err?.response?.data ?? err?.message));
      setTripError(err?.response?.data?.detail || err?.response?.data?.message || err?.message || t('planRoute.startTripError'));
    } finally {
      setStartingTrip(false);
    }
  };

  const completeTripFlow = async () => {
    if (!activeTripId || !route || completing) return;
    setCompleting(true);
    setTripError(null);
    try {
      const { distanceKm, durationMin } = routeMetrics();
      await completeTrip(activeTripId, {
        actualDistanceKm: distanceKm,
        actualDurationMin: durationMin,
        actualCo2Kg: estimate?.co2SavedKg ?? null,
      });
      setActiveTripId(null);
      stepIndexRef.current = 0;
      setCurrentStepIndex(0);
      arrivedRef.current = false;
      setArrived(false);
      lastRecenterRef.current = null;
      Speech.stop();
      Alert.alert(
        t('planRoute.tripCompletedTitle'),
        t('planRoute.tripCompletedMsg'),
        [
          { text: t('planRoute.close') },
          { text: t('planRoute.viewHistory'), onPress: () => router.push('/(tabs)/history') },
        ]
      );
    } catch (err: any) {
      setTripError(err?.response?.data?.message || err?.message || t('planRoute.tripErrorFallback'));
    } finally {
      setCompleting(false);
    }
  };

  completeTripFlowRef.current = completeTripFlow;

  useEffect(() => {
    console.log('[VIAJE] estado: activeTripId =', activeTripId, '| route steps =', route?.steps?.length ?? 0, '| arrived =', arrived, '| sheet =', showBottomSheet);
  }, [activeTripId, route, arrived, showBottomSheet]);

  useEffect(() => {
    stepIndexRef.current = 0;
    setCurrentStepIndex(0);
    arrivedRef.current = false;
    setArrived(false);
    lastRecenterRef.current = null;
    preAlertRef.current.clear();
    Speech.stop();
  }, [route]);

  const speak = (text: string) => {
    if (!voiceOnRef.current || !text) return;
    Speech.stop()
      .catch(() => {})
      .then(() => {
        if (!voiceOnRef.current) return;
        try {
          Speech.speak(text, { language: 'es-ES', rate: 1.05 });
        } catch {}
      });
  };

  const toggleVoice = () => {
    const next = !voiceOnRef.current;
    voiceOnRef.current = next;
    setVoiceOn(next);
    if (!next) Speech.stop();
  };

  const handlePosition = (coords: { latitude: number; longitude: number }) => {
    const p: PlacePoint = {
      latitude: coords.latitude,
      longitude: coords.longitude,
      name: t('planRoute.myLocation'),
    };
    setUserPos(p);

    const steps = routeRef.current?.steps || [];
    const idx = stepIndexRef.current;

    if (steps.length > 0 && idx < steps.length) {
      const cur = steps[idx];
      const nextS = steps[idx + 1];

      if (cur?.endLocation?.latitude && nextS?.instruction) {
        const dToEnd = haversineM(p, cur.endLocation);
        if (dToEnd <= 80 && dToEnd > 40 && !preAlertRef.current.has(idx)) {
          preAlertRef.current.add(idx);
          const m = Math.max(10, Math.round(dToEnd / 10) * 10);
          speak(`En ${m} metros, ${nextS.instruction}`);
        }
      }

      let newIdx = idx;
      for (let i = idx; i < Math.min(idx + 3, steps.length); i++) {
        const end = steps[i]?.endLocation;
        if (end?.latitude && haversineM(p, end) < 35) newIdx = i + 1;
      }
      if (newIdx !== idx) {
        stepIndexRef.current = newIdx;
        setCurrentStepIndex(newIdx);
        if (steps[newIdx]?.instruction) speak(steps[newIdx].instruction);
        setRegion({ ...p, latitudeDelta: 0.006, longitudeDelta: 0.006 });
        lastRecenterRef.current = p;
        return;
      }
    }

    const dest = destinationRef.current;
    if (dest && !arrivedRef.current && haversineM(p, dest) < 40) {
      arrivedRef.current = true;
      setArrived(true);
      stepIndexRef.current = steps.length;
      setCurrentStepIndex(steps.length);
      setRegion({ ...p, latitudeDelta: 0.005, longitudeDelta: 0.005 });
      lastRecenterRef.current = p;
      speak(t('planRoute.arrivedSpeak'));
      Alert.alert(t('planRoute.arrivedAlertTitle'), t('planRoute.arrivedAlertMsg'), [
        { text: t('planRoute.later') },
        { text: t('planRoute.completeTrip'), onPress: () => completeTripFlowRef.current() },
      ]);
      return;
    }

    const last = lastRecenterRef.current;
    if (!last || haversineM(p, last) > 150) {
      setRegion({
        latitude: p.latitude,
        longitude: p.longitude,
        latitudeDelta: 0.008,
        longitudeDelta: 0.008,
      });
      lastRecenterRef.current = p;
    }
  };

  useEffect(() => {
    if (!activeTripId) return;
    let sub: Location.LocationSubscription | null = null;
    (async () => {
      const perm = await Location.getForegroundPermissionsAsync();
      if (perm.status !== 'granted') {
        const req = await Location.requestForegroundPermissionsAsync();
        if (req.status !== 'granted') return;
      }
      sub = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.Balanced, timeInterval: 3000, distanceInterval: 10 },
        pos => handlePosition(pos.coords)
      );
    })();
    return () => {
      sub?.remove();
      sub = null;
      Speech.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTripId]);

  const handleSheetChange = (index: number) => {
    console.log('[SHEET] onChange index=', index);
    if (index === -1) {
      setShowBottomSheet(false);
      setSheetIndex(0);
    } else {
      setSheetIndex(index);
    }
  };

  const handlePoiSheetChange = (index: number) => {
    if (index === -1) closePoiSheet();
  };

  const openSearch = () => setSearchExpanded(true);

  const closeSearch = () => {
    setSearchExpanded(false);
    Keyboard.dismiss();
    setShowOriginSuggestions(false);
    setShowDestSuggestions(false);
  };

  const runDirections = async () => {
    closeSearch();
    await calculateRoute();
  };

  const handleExploreAction = (key: ExploreAction) => {
    if (key === 'plan') openSearch();
    else if (key === 'favorites') router.push('/(tabs)/favorites');
    else if (key === 'history') router.push('/(tabs)/history');
  };

  const handleQuickPlace = (place: ExplorePlace) => {
    setDestination({ latitude: place.lat, longitude: place.lng, name: place.name });
    setDestQuery(place.name);
  };

  const routeMidpoint = (): { latitude: number; longitude: number } | null => {
    if (route?.polyline) {
      const pts = decodePolyline(route.polyline);
      if (pts.length > 0) return pts[Math.floor(pts.length / 2)];
    }
    return null;
  };

  const closePoiSheet = () => {
    setActivePoiCategory(null);
    setPoiPlaces([]);
    setSelectedPoiId(null);
    setShowPoiSheet(false);
  };

  const handlePoiCategory = async (
    category: PoiCategory | null,
    centerOverride?: { latitude: number; longitude: number }
  ) => {
    if (!category) {
      closePoiSheet();
      return;
    }
    setActivePoiCategory(category);
    setSelectedPoiId(null);
    // En modo "elegir parada" solo se muestran los markers en el mapa.
    setShowPoiSheet(!pickingStop);
    setLoadingPois(true);
    try {
      const center =
        centerOverride ?? { latitude: region.latitude, longitude: region.longitude };
      const places = await getNearbyPlaces(center, category.placeType);
      setPoiPlaces(places);
      console.log('[POI]', category.id, '→', places.length, 'lugares');
    } finally {
      setLoadingPois(false);
    }
  };

  const selectPoiPlace = (place: NearbyPlace) => {
    setSelectedPoiId(place.placeId);
    mapRef.current?.animateToRegion?.(
      {
        latitude: place.latitude,
        longitude: place.longitude,
        latitudeDelta: 0.006,
        longitudeDelta: 0.006,
      },
      400
    );
  };

  const routeToPoi = async (place: NearbyPlace) => {
    const dest: PlacePoint = {
      latitude: place.latitude,
      longitude: place.longitude,
      name: place.name,
    };
    setDestination(dest);
    setDestQuery(place.name);
    closePoiSheet();
    if (!origin) {
      Alert.alert(t('common.errorTitle'), t('planRoute.selectOrigin'));
      openSearch();
      return;
    }
    await calculateRoute(mode, origin, dest);
  };

  // --- Acciones del sheet de ruta: paradas / compartir / guardar ---

  const startPickStop = () => {
    setPickingStop(true);
    setShowBottomSheet(false);
    const cat = POI_CATEGORIES.find(c => c.id === 'restaurant');
    if (cat) void handlePoiCategory(cat, routeMidpoint() ?? undefined);
  };

  const cancelPickStop = () => {
    setPickingStop(false);
    closePoiSheet();
    if (route) setShowBottomSheet(true);
  };

  const addStop = async (place: NearbyPlace) => {
    const stop: PlacePoint = {
      latitude: place.latitude,
      longitude: place.longitude,
      name: place.name,
    };
    setPickingStop(false);
    closePoiSheet();
    setRouteStop(stop);
    if (Platform.OS === 'android') {
      ToastAndroid.show(`Parada agregada: ${place.name}`, ToastAndroid.SHORT);
    }
    if (origin && destination) {
      await calculateRoute(mode, origin, destination, stop);
    }
  };

  const removeStop = async () => {
    setRouteStop(null);
    if (origin && destination) {
      await calculateRoute(mode, origin, destination, null);
    }
  };

  const shareRoute = async () => {
    if (isGuest) return requireAccount(t('planRoute.actionShare'));
    if (!route || !origin || !destination) return;
    try {
      await Share.share({
        message:
          `Ruta en EcoRuteando\n` +
          `${origin.name} → ${destination.name}\n` +
          `${Math.round(route.duration.value / 60)} min • ${(route.distance.value / 1000).toFixed(1)} km` +
          (routeStop ? `\nParada: ${routeStop.name}` : '') +
          `\n\nReporta obstáculos en el camino con EcoRuteando`,
      });
    } catch {}
  };

  const saveCurrentRoute = async () => {
    if (isGuest) return requireAccount(t('planRoute.actionSave'));
    if (!route || !origin || !destination || routeSaved) return;
    try {
      const rid = routeSavedId ?? (await saveRouteSmart(buildSavePayload(origin, destination)));
      setRouteSavedId(rid);
      setRouteSaved(true);
      if (Platform.OS === 'android') {
        ToastAndroid.show(t('planRoute.routeSaved'), ToastAndroid.SHORT);
      } else {
        Alert.alert(t('planRoute.routeSaved'), t('planRoute.routeSavedMsg'));
      }
    } catch (e: any) {
      Alert.alert(t('planRoute.saveError'), e?.message ?? t('planRoute.unexpectedError'));
    }
  };

  const refreshNearbyReports = async (center?: { latitude: number; longitude: number }) => {
    try {
      const c = center ?? region;
      const reports = await getNearbyReports(c.latitude, c.longitude, 2000);
      setNearbyReports(reports);
      console.log('[REPORTS]', reports.length, 'reportes cercanos');
    } catch (e: any) {
      console.log('[REPORTS] error:', e?.message);
    }
  };

  const handleRegionComplete = (r: any) => {
    syncRegion(r);
    if (reportRefreshTimer.current) clearTimeout(reportRefreshTimer.current);
    reportRefreshTimer.current = setTimeout(() => refreshNearbyReports(r), 1500);
  };

  const voteOnReport = async (report: NearbyReport, confirm: boolean) => {
    if (isGuest) return requireAccount(t('planRoute.actionVote'));
    if (votingId) return;
    let pos = userPos;
    if (!pos) {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const loc = await Location.getCurrentPositionAsync({});
          pos = {
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
            name: t('planRoute.myLocation'),
          };
          setUserPos(pos);
        }
      } catch {}
    }
    if (!pos) {
      Alert.alert(t('planRoute.locationRequiredTitle'), t('planRoute.voteLocationMsg'));
      return;
    }
    setVotingId(report.id);
    try {
      const result = await voteReport(report.id, confirm, pos.latitude, pos.longitude);
      setNearbyReports(prev =>
        prev
          .map(r =>
            r.id === report.id
              ? {
                  ...r,
                  confidenceScore: result.confidenceScore,
                  confirmCount: result.confirmCount,
                  rejectCount: result.rejectCount,
                  state: result.state,
                }
              : r
          )
          .filter(r => r.confidenceScore >= 40 && r.state !== 'disputed')
      );
      setSelectedReport(null);
      const msg = confirm
        ? t('planRoute.voteConfirmed')
        : t('planRoute.voteRejected');
      if (Platform.OS === 'android') {
        ToastAndroid.show(msg, ToastAndroid.SHORT);
      } else {
        Alert.alert(t('planRoute.voteThanks'), msg);
      }
      console.log('[REPORTS] voto', confirm ? '👍' : '👎', report.id, '→', result.state, result.confidenceScore);
    } catch (e: any) {
      Alert.alert(t('planRoute.voteError'), e?.message ?? t('planRoute.unexpectedError'));
    } finally {
      setVotingId(null);
    }
  };

  const clearOrigin = () => {
    setOriginQuery('');
    setOrigin(null);
    setOriginSuggestions([]);
    setShowOriginSuggestions(false);
  };

  const clearDest = () => {
    setDestQuery('');
    setDestination(null);
    setDestSuggestions([]);
    setShowDestSuggestions(false);
  };

  const openProfile = () => router.push('/(tabs)/profile');

  const fabBottom = insets.bottom + EXPLORE_PEEK + 16;
  const poiSheetOpen = showPoiSheet && !!activePoiCategory;
  const exploreVisible = !showBottomSheet && !searchExpanded && !poiSheetOpen && !selectedReport && !reportSheetOpen && !pickingStop;
  const planning = !!origin && !!destination && !searchExpanded;
  const poiChipsVisible = !searchExpanded && !showBottomSheet && !planning && !activeTripId && !pickingStop;

  const routeSnapPoints = useMemo(
    () => [`${ROUTE_SHEET_MIN_SNAP * 100}%`, '82%', '95%'],
    []
  );

  const snapIdx = Math.min(Math.max(sheetIndex, 0), ROUTE_SNAP_PERCENTS.length - 1);
  const routeSheetContentHeight =
    SCREEN_H * ROUTE_SNAP_PERCENTS[snapIdx] - SHEET_CONTENT_RESERVE;

  console.log(
    '[STATE] sheet=', showBottomSheet, '| route=', !!route, '| search=', searchExpanded,
    '| poiSheet=', poiSheetOpen, '| report=', reportSheetOpen, '| selRep=', !!selectedReport,
    '| pick=', pickingStop, '| loading=', loading, '| origin=', !!origin, '| dest=', !!destination,
    '| explore=', exploreVisible, '| snaps=', routeSnapPoints.join('/'),
    '| screenH=', SCREEN_H, '| idx=', sheetIndex, '| contentH=', Math.round(routeSheetContentHeight),
    '| winScale=', Dimensions.get('window').scale, '| insets=', insets.bottom
  );

  const exploreSnapPoints = useMemo(() => [EXPLORE_PEEK, '50%', '88%'], []);
  const poiSnapPoints = useMemo(() => ['50%', '88%'], []);
  const reportSnapPoints = useMemo(() => ['45%'], []);
  const reportFormSnapPoints = useMemo(() => ['80%'], []);
  const addStopSnapPoints = useMemo(() => ['78%'], []);

  const dragPillPan = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, g) =>
          Math.abs(g.dx) > 5 || Math.abs(g.dy) > 5,
        onPanResponderGrant: () => {
          pillStartRef.current = pillPosRef.current;
        },
        onPanResponderMove: (_, g) => {
          const start = pillStartRef.current;
          if (!start) return;
          const { w, h } = pillSizeRef.current;
          const minX = 8;
          const maxX = Math.max(minX, SCREEN_W - w - 8);
          const minY = insetsRef.current + 56;
          const maxY = Math.max(
            minY,
            SCREEN_H - TAB_BAR_HEIGHT - h - 12
          );
          const next = {
            left: Math.min(Math.max(minX, start.left + g.dx), maxX),
            top: Math.min(Math.max(minY, start.top + g.dy), maxY),
          };
          pillPosRef.current = next;
          setPillPos(next);
        },
      }),
    []
  );

  routeRef.current = route;
  destinationRef.current = destination;

  const navSteps: any[] = route?.steps || [];
  const navStep = currentStepIndex < navSteps.length ? navSteps[currentStepIndex] : null;
  const navInstruction = arrived
    ? t('planRoute.navArrived')
    : navStep?.instruction || t('planRoute.navContinue');
  const navTarget =
    navStep?.endLocation?.latitude != null ? navStep.endLocation : destination;
  const navDistText =
    userPos && navTarget && !arrived ? formatMeters(haversineM(userPos, navTarget)) : null;
  const remainingM = navSteps
    .slice(currentStepIndex)
    .reduce((s: number, x: any) => s + (x.distance?.value || 0), 0);
  const remainingS = navSteps
    .slice(currentStepIndex)
    .reduce((s: number, x: any) => s + (x.duration?.value || 0), 0);
  const navRemDist = formatMeters(remainingM);
  const navRemDur =
    remainingS >= 60
      ? `${Math.max(1, Math.round(remainingS / 60))} min`
      : `${Math.max(1, Math.round(remainingS))} s`;

  return (
    <View style={[styles.container, isDark && { backgroundColor: '#1c1c1e' }]}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={{
          latitude: region.latitude,
          longitude: region.longitude,
          latitudeDelta: region.latitudeDelta,
          longitudeDelta: region.longitudeDelta,
        }}
        region={region}
        provider={PROVIDER_GOOGLE}
        showsUserLocation={true}
        showsMyLocationButton={false}
        showsCompass={true}
        rotateEnabled={true}
        pitchEnabled={true}
        onRegionChangeComplete={handleRegionComplete}
        onMapReady={() => console.log('[MAPA] onMapReady - MapView montado')}
        onMapLoaded={() => console.log('[MAPA] onMapLoaded - teselas cargadas')}
      >
        {/*
          Expo Go (SDK 55+) trae una API key de Google Maps expirada y no usa
          la del proyecto, asi que las teselas de Google nunca cargan.
          En Expo Go superponemos OpenStreetMap; en dev build se ve Google Maps.
        */}
        {isExpoGo && (
          <UrlTile
            urlTemplate="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
            maximumZ={19}
            flipY={false}
          />
        )}
        {origin && (
          <Marker coordinate={origin} title={t('planRoute.origin')} description={origin.name}>
            <View style={styles.originMarker}>
              <View style={styles.markerPin} />
            </View>
          </Marker>
        )}
        {destination && (
          <Marker coordinate={destination} title={t('planRoute.destination')} description={destination.name}>
            <View style={styles.destMarker}>
              <View style={styles.markerPinRed} />
            </View>
          </Marker>
        )}
        {activePoiCategory &&
          poiPlaces.map(place => (
            <Marker
              key={place.placeId}
              coordinate={{ latitude: place.latitude, longitude: place.longitude }}
              onPress={() => setSelectedPoiId(place.placeId)}
            >
              <View
                style={[
                  styles.poiMarker,
                  { borderColor: activePoiCategory.color },
                  selectedPoiId === place.placeId && styles.poiMarkerSelected,
                ]}
              >
                <Ionicons
                  name={activePoiCategory.icon as any}
                  size={selectedPoiId === place.placeId ? 16 : 13}
                  color={activePoiCategory.color}
                />
              </View>
              <Callout
                tooltip
                onPress={() => (pickingStop ? addStop(place) : routeToPoi(place))}
              >
                <View style={styles.poiCallout}>
                  <Text style={styles.poiCalloutName} numberOfLines={1}>
                    {place.name}
                  </Text>
                  <View style={styles.poiCalloutRow}>
                    <Ionicons
                      name={pickingStop ? 'add-circle' : 'navigate'}
                      size={12}
                      color="#1a73e8"
                    />
                    <Text style={styles.poiCalloutAction}>
                      {pickingStop ? t('planRoute.addAsStop') : t('planRoute.howToGet')}
                    </Text>
                  </View>
                </View>
              </Callout>
            </Marker>
          ))}
        {/* HU-22 / CU22: reportes de obstáculos con confianza comunitaria */}
        {nearbyReports.map(rep => (
          <Marker
            key={`report-${rep.id}`}
            coordinate={{ latitude: rep.latitude, longitude: rep.longitude }}
            anchor={{ x: 0.5, y: 0.5 }}
            zIndex={1000}
            onPress={() => setSelectedReport(rep)}
          >
            <View
              style={[
                styles.reportMarker,
                {
                  backgroundColor:
                    rep.confidenceScore >= 70 ? '#16a34a' : '#d97706',
                },
              ]}
            >
              <Ionicons name="warning" size={14} color="#ffffff" />
            </View>
          </Marker>
        ))}
        {route?.polyline && (
          <Polyline
            coordinates={decodePolyline(route.polyline)}
            strokeColor="#16a34a"
            strokeWidth={5}
            geodesic
          />
        )}
        {/* Rutas alternativas: líneas finas + pastilla "X min más lento/rápido" */}
        {route?.polyline &&
          !selectedReport &&
          !reportSheetOpen &&
          routeAlts.map((alt, ai) => {
            const pts = decodePolyline(alt.polyline);
            if (pts.length < 2) return null;
            const mid = pts[Math.floor(pts.length / 2)];
            const diffMin = Math.round(
              ((alt.duration?.value ?? 0) - (route.duration?.value ?? 0)) / 60
            );
            const label =
              diffMin > 0
                ? t('planRoute.minSlower').replace('{n}', String(diffMin))
                : diffMin < 0
                ? t('planRoute.minFaster').replace('{n}', String(-diffMin))
                : t('planRoute.sameTime');
            return (
              <React.Fragment key={`alt-${ai}`}>
                <Polyline
                  coordinates={pts}
                  strokeColor={ai === 0 ? '#8ab4f8' : '#bdc1c6'}
                  strokeWidth={4}
                  geodesic
                  zIndex={1}
                />
                <Marker coordinate={mid} zIndex={500} anchor={{ x: 0.5, y: 0.5 }}>
                  <TouchableOpacity
                    style={styles.altPill}
                    onPress={() => handleSelectRoute(ai + 1)}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.altPillText}>{label}</Text>
                  </TouchableOpacity>
                </Marker>
              </React.Fragment>
            );
          })}
      </MapView>

      {Constants.executionEnvironment === 'storeClient' && (
        <Text style={styles.osmAttribution}>© OpenStreetMap</Text>
      )}

      {/* Barra de búsqueda flotante / panel expandido */}
      <MapSearchPanel
        expanded={searchExpanded}
        onExpand={openSearch}
        onClose={closeSearch}
        onOpenProfile={openProfile}
        originQuery={originQuery}
        onOriginChange={handleOriginChange}
        onOriginFocus={() => setShowOriginSuggestions(true)}
        onClearOrigin={clearOrigin}
        originSuggestions={originSuggestions}
        showOriginSuggestions={showOriginSuggestions}
        onSelectOrigin={selectOrigin}
        destQuery={destQuery}
        onDestChange={handleDestChange}
        onDestFocus={() => setShowDestSuggestions(true)}
        onClearDest={clearDest}
        destSuggestions={destSuggestions}
        showDestSuggestions={showDestSuggestions}
        onSelectDest={selectDestination}
        onLocatePress={getCurrentLocation}
        onSwap={swapLocations}
        onDirections={runDirections}
        directionsReady={!!origin && !!destination}
        loading={loading}
      />

      {/* Categorías de lugares cercanos estilo Google Maps */}
      {poiChipsVisible && (
        <View style={[styles.poiChipsRow, { top: insets.top + 64 }]}>
          <PoiChips active={activePoiCategory?.id ?? null} onSelect={handlePoiCategory} />
        </View>
      )}

      {/* Modo "elegir parada": la hoja Agregar paradas maneja el flujo */}

      {/* Navegación in-app: guía de maniobra mientras el viaje está activo */}
      {activeTripId && route && navSteps.length > 0 && (
        <NavigationBanner
          insetTop={insets.top}
          instruction={navInstruction}
          distanceToManeuverText={navDistText}
          remainingDistanceText={navRemDist}
          remainingDurationText={navRemDur}
          stepIndex={currentStepIndex}
          totalSteps={navSteps.length}
          arrived={arrived}
          voiceEnabled={voiceOn}
          onToggleVoice={toggleVoice}
          onOpenSheet={() => setShowBottomSheet(true)}
        />
      )}

      {/* Modo de transporte (solo en fase de planificación, fuera de viaje activo) */}
      {planning && !activeTripId && (
        <View style={[styles.modeRow, { top: insets.top + 72 }]}>
          {TRANSPORT_MODES.map(m => {
            const active = mode === m.id;
            return (
              <TouchableOpacity
                key={m.id}
                style={[styles.modePill, active && { backgroundColor: m.color, borderColor: m.color }]}
                onPress={() => changeMode(m.id)}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={m.icon as any}
                  size={16}
                  color={active ? '#fff' : '#5f6368'}
                />
                <Text style={[styles.modeText, active && { color: '#fff' }]}>{t(`modes.${m.id}`)}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* Controles flotantes */}
      {exploreVisible && origin && destination && (
        <MapFab
          onPress={() => calculateRoute()}
          disabled={loading}
          backgroundColor="#77D353"
          iconColor="#fff"
          style={[styles.fab, { bottom: fabBottom + 62 }]}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Ionicons name="navigate" size={22} color="#fff" />
          )}
        </MapFab>
      )}

      {exploreVisible && (
        <MapFab
          icon="locate"
          onPress={getCurrentLocation}
          style={[styles.fab, { bottom: fabBottom }]}
        />
      )}

      {/* Botón para reabrir el panel de ruta cuando está cerrado (viaje activo o planificación) */}
      {route?.polyline &&
        !showBottomSheet &&
        !selectedReport &&
        !reportSheetOpen &&
        !searchExpanded &&
        !pickingStop && (
          <View
            style={
              pillPos
                ? [styles.expandSheetWrapPos, { left: pillPos.left, top: pillPos.top }]
                : [styles.expandSheetWrap, { bottom: fabBottom }]
            }
            {...dragPillPan.panHandlers}
          >
            <TouchableOpacity
              ref={pillRef}
              style={styles.expandSheetFab}
              onPress={() => setShowBottomSheet(true)}
              activeOpacity={0.85}
              onLayout={e => {
                const { width, height, x, y } = e.nativeEvent.layout;
                pillSizeRef.current = { w: Math.round(width), h: Math.round(height) };
                if (!pillPosRef.current) {
                  requestAnimationFrame(() => {
                    pillRef.current?.measureInWindow((mx: number, my: number) => {
                      if (mx == null || my == null || pillPosRef.current) return;
                      const p = { left: Math.round(mx), top: Math.round(my) };
                      pillPosRef.current = p;
                      setPillPos(p);
                    });
                  });
                }
              }}
            >
              <Ionicons name="chevron-up" size={18} color="#16a34a" />
              <Text style={styles.expandSheetFabText}>
                {route?.duration?.text ? `${route.duration.text} · ${t('planRoute.viewRoute')}` : t('planRoute.viewRoute')}
              </Text>
            </TouchableOpacity>
          </View>
        )}

      {/* Botón Reportar estilo Google Maps: flotante solo con la hoja de ruta cerrada */}
      {route?.polyline && !showBottomSheet && !selectedReport && !searchExpanded && !reportSheetOpen && !pickingStop && (
        <TouchableOpacity
          style={[styles.reportFab, { bottom: fabBottom }]}
          onPress={() => {
            if (isGuest) return requireAccount(t('planRoute.actionReport'));
            setReportSheetOpen(true);
          }}
          activeOpacity={0.85}
        >
          <Ionicons name="warning" size={18} color="#d93025" />
          <Text style={styles.reportFabText}>{t('planRoute.report')}</Text>
        </TouchableOpacity>
      )}

      {/* Bottom sheet: agregar parada > reporte (form) > detalle/voto de reporte > detalles de ruta > POI > panel Explora */}
      {pickingStop ? (
        <BottomSheet
          key="addStopSheet"
          snapPoints={addStopSnapPoints}
          index={0}
          onChange={index => {
            if (index === -1) cancelPickStop();
          }}
          enablePanDownToClose
          enableDynamicSizing={false}
          handleIndicatorStyle={styles.sheetHandle}
          backgroundStyle={styles.sheetBg}
        >
          <AddStopSheet
            origin={origin}
            destination={destination}
            mode={mode}
            activeCategoryId={activePoiCategory?.id ?? null}
            places={poiPlaces}
            loading={loadingPois}
            searchCenter={routeMidpoint() ?? { latitude: region.latitude, longitude: region.longitude }}
            onSelectCategory={c => handlePoiCategory(c, routeMidpoint() ?? undefined)}
            onSelectPlace={selectPoiPlace}
            onAddPlace={addStop}
            onClose={cancelPickStop}
          />
        </BottomSheet>
      ) : reportSheetOpen ? (
        <BottomSheet
          key="reportFormSheet"
          snapPoints={reportFormSnapPoints}
          index={0}
          onChange={index => {
            if (index === -1) setReportSheetOpen(false);
          }}
          enablePanDownToClose
          enableDynamicSizing={false}
          handleIndicatorStyle={styles.sheetHandle}
          backgroundStyle={styles.sheetBg}
        >
          <ReportFormSheet
            onClose={() => setReportSheetOpen(false)}
            onSubmitted={() => {
              setReportSheetOpen(false);
              refreshNearbyReports();
            }}
          />
        </BottomSheet>
      ) : selectedReport ? (
        <BottomSheet
          key="reportVoteSheet"
          snapPoints={reportSnapPoints}
          index={0}
          onChange={index => {
            if (index === -1) setSelectedReport(null);
          }}
          enablePanDownToClose
          enableDynamicSizing={false}
          handleIndicatorStyle={styles.sheetHandle}
          backgroundStyle={styles.sheetBg}
        >
          <ReportVoteSheet
            report={selectedReport}
            voting={votingId === selectedReport.id}
            onClose={() => setSelectedReport(null)}
            onVote={confirm => voteOnReport(selectedReport, confirm)}
          />
        </BottomSheet>
      ) : showBottomSheet && route ? (
        <BottomSheet
          key="routeSheet"
          ref={bottomSheetRef}
          snapPoints={routeSnapPoints}
          index={0}
          onChange={handleSheetChange}
          enablePanDownToClose
          enableDynamicSizing={false}
          handleComponent={null}
        >
          <RouteBottomSheet
            route={route}
            estimate={estimate}
            activeTripId={activeTripId}
            startingTrip={startingTrip}
            completing={completing}
            tripError={tripError}
            contentHeight={routeSheetContentHeight}
            onStartTrip={startTripFlow}
            onCompleteTrip={completeTripFlow}
            onClose={() => {
              setShowBottomSheet(false);
              setRoute(null);
              setRouteAlts([]);
              setEstimate(null);
              setTripError(null);
              setRouteStop(null);
              setRouteSaved(false);
              setPickingStop(false);
            }}
            onSelectRoute={handleSelectRoute}
            selectedRouteIndex={selectedRouteIndex}
            routes={route ? [route, ...routeAlts] : []}
            onAddStop={startPickStop}
            onShare={shareRoute}
            onSave={saveCurrentRoute}
            onReport={() => {
              if (isGuest) return requireAccount(t('planRoute.actionReport'));
              setReportSheetOpen(true);
            }}
            routeSaved={routeSaved}
            stopName={routeStop?.name ?? null}
            onRemoveStop={removeStop}
            activeMode={mode}
            onModePress={id => changeMode(id as TransportMode)}
            bottomInset={TAB_BAR_HEIGHT}
          />
        </BottomSheet>
      ) : poiSheetOpen && activePoiCategory ? (
        <BottomSheet
          key="poiSheet"
          snapPoints={poiSnapPoints}
          index={0}
          onChange={handlePoiSheetChange}
          enablePanDownToClose
          enableDynamicSizing={false}
          handleIndicatorStyle={styles.sheetHandle}
          backgroundStyle={styles.sheetBg}
        >
          <PoiResultsSheet
            category={activePoiCategory}
            places={poiPlaces}
            loading={loadingPois}
            center={{ latitude: region.latitude, longitude: region.longitude }}
            selectedPlaceId={selectedPoiId}
            onClose={closePoiSheet}
            onSelectPlace={selectPoiPlace}
            onRoute={routeToPoi}
          />
        </BottomSheet>
      ) : (
        exploreVisible && (
          <BottomSheet
            key="exploreSheet"
            snapPoints={exploreSnapPoints}
            index={0}
            enablePanDownToClose={false}
            enableDynamicSizing={false}
            handleIndicatorStyle={styles.sheetHandle}
            backgroundStyle={styles.sheetBg}
          >
            <ExploreSheet
              activeMode={mode}
              onModePress={id => changeMode(id as TransportMode)}
              onAction={handleExploreAction}
              onPlaceSelect={handleQuickPlace}
              places={NEIVA_PLACES}
            />
          </BottomSheet>
        )
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  map: {
    flex: 1,
  },
  osmAttribution: {
    position: 'absolute',
    bottom: 4,
    left: 6,
    fontSize: 10,
    color: '#5f6368',
    backgroundColor: 'rgba(255,255,255,0.75)',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
    zIndex: 80,
  },
  modeRow: {
    position: 'absolute',
    left: 12,
    right: 12,
    zIndex: 90,
    flexDirection: 'row',
    gap: 8,
  },
  modePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#dadce0',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  modeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#5f6368',
  },
  fab: {
    position: 'absolute',
    right: 16,
    zIndex: 95,
  },
  reportFab: {
    position: 'absolute',
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ffffff',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 5,
    zIndex: 95,
  },
  reportFabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#202124',
  },
  altPill: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e8eaed',
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 4,
  },
  altPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3c4043',
  },
  expandSheetWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 95,
  },
  expandSheetWrapPos: {
    position: 'absolute',
    alignItems: 'center',
    zIndex: 95,
  },
  expandSheetFab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ffffff',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#e6f4ea',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 5,
  },
  expandSheetFabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#16a34a',
  },
  sheetHandle: {
    backgroundColor: '#dadce0',
    width: 40,
    height: 4,
  },
  sheetBg: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  originMarker: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#16a34a',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  markerPin: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#fff',
  },
  destMarker: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  markerPinRed: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#fff',
  },
  poiChipsRow: {
    position: 'absolute',
    left: 12,
    right: 12,
    zIndex: 90,
  },
  poiMarker: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 4,
  },
  poiMarkerSelected: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 3,
    shadowRadius: 6,
    elevation: 6,
  },
  poiCallout: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minWidth: 150,
    maxWidth: 220,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  poiCalloutName: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#202124',
  },
  poiCalloutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
  },
  poiCalloutAction: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#1a73e8',
  },
  reportMarker: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 4,
  },
  reportCalloutDesc: {
    fontSize: 12,
    color: '#5f6368',
    marginTop: 2,
  },
  reportCalloutMeta: {
    fontSize: 12,
    color: '#5f6368',
    fontWeight: '600',
  },
  reportCalloutState: {
    fontSize: 12,
    color: '#5f6368',
    fontWeight: '600',
  },
  reportCalloutQuestion: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#202124',
    marginTop: 6,
  },
  reportVoteRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 5,
  },
  voteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    flex: 1,
    borderWidth: 1,
    borderColor: '#dadce0',
    borderRadius: 8,
    paddingVertical: 6,
    backgroundColor: '#f8f9fa',
  },
  voteBtnDisabled: {
    opacity: 0.5,
  },
  voteBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
});
