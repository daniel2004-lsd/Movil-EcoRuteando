import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useLanguage } from '../../src/shared/store/LanguageContext';
import { Dialog } from '../../src/shared/components/ui/AppDialog';
import { MapSearchPanel } from '../../src/components/maps/MapSearchPanel';
import { type ExploreAction, type ExplorePlace } from '../../src/components/maps/ExploreSheet';
import { MapFab } from '../../src/components/maps/MapFab';
import { NavigationBanner } from '../../src/components/maps/NavigationBanner';
import { PoiChips } from '../../src/components/maps/PoiChips';
import { useMapRegion } from '../../src/hooks/useMapRegion';
import MapView from '../../src/components/maps/MapEngine';
import {
  decodePolyline,
  TRANSPORT_MODES,
  POI_CATEGORIES,
  type PoiCategory,
  type NearbyPlace,
} from '../../src/services/maps/googleMaps';
import { haversineM, formatMeters } from '../../src/utils/geo';

import type { TransportMode, PlacePoint } from '../../src/features/plan-route/types';
import { DraggableTripPill } from '../../src/features/plan-route/components/DraggableTripPill';
import { PlanRouteMapMarkers } from '../../src/features/plan-route/components/PlanRouteMapMarkers';
import { PlanRouteSheets } from '../../src/features/plan-route/components/PlanRouteSheets';
import { styles } from '../../src/features/plan-route/styles/planRouteStyles';

import { useUserLocationTracking } from '../../src/features/plan-route/hooks/useUserLocationTracking';
import { useRoutePlanning } from '../../src/features/plan-route/hooks/useRoutePlanning';
import { useTurnByTurnNavigation } from '../../src/features/plan-route/hooks/useTurnByTurnNavigation';
import { useCommunityReports } from '../../src/features/plan-route/hooks/useCommunityReports';
import { useMapPoiManager } from '../../src/features/plan-route/hooks/useMapPoiManager';
import { useTripLifecycle } from '../../src/features/plan-route/hooks/useTripLifecycle';

const DEFAULT_REGION = {
  latitude: 2.9273,
  longitude: -75.2819,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

const EXPLORE_PEEK = 275;
const ROUTE_SHEET_MIN_SNAP = 0.68;
const ROUTE_SNAP_PERCENTS = [ROUTE_SHEET_MIN_SNAP, 0.82, 0.95];
const SHEET_CONTENT_RESERVE = 0;
const SCREEN_H = Dimensions.get('window').height;
const ROUTE_FIT_PADDING = {
  top: 120,
  right: 60,
  bottom: Math.round(SCREEN_H * ROUTE_SHEET_MIN_SNAP) + 20,
  left: 60,
};

export default function PlanRouteScreen() {
  const router = useRouter();
  const searchParams = useLocalSearchParams();
  const favParamsRef = useRef(false);
  const isMountedRef = useRef(true);
  const poiRequestIdRef = useRef(0);
  const mapRef = useRef<any>(null);
  const bottomSheetRef = useRef<any>(null);
  const addStopScrollRef = useRef(null);

  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const { region, setRegion, syncRegion, fitToCoordinates } = useMapRegion();

  const [showBottomSheet, setShowBottomSheet] = useState(false);
  const [sheetIndex, setSheetIndex] = useState(0);
  const [searchExpanded, setSearchExpanded] = useState(false);

  // 1. Planificación de ruta
  const routePlanning = useRoutePlanning({
    t,
    onRouteCalculated: (directions, coords) => {
      setShowBottomSheet(true);
      if (coords.length > 0) {
        if (mapRef.current?.fitToCoordinates) {
          mapRef.current.fitToCoordinates(coords, {
            edgePadding: ROUTE_FIT_PADDING,
            animated: true,
          });
        } else {
          fitToCoordinates(coords);
        }
      }
    },
    onRouteCleared: () => {
      setShowBottomSheet(false);
    },
  });

  const {
    mode,
    changeMode,
    origin,
    destination,
    originQuery,
    destQuery,
    originSuggestions,
    destSuggestions,
    showOriginSuggestions,
    showDestSuggestions,
    setShowOriginSuggestions,
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
    routeAlts,
    estimate,
    selectedRouteIndex,
    handleSelectRoute,
    calculateRoute,
    routeMidpoint,
    routeStop,
    pickingStop,
    setPickingStop,
    addStop: addPlanningStop,
    removeStop: removePlanningStop,
    resetRoute,
  } = routePlanning;

  // 2. Navegación giro a giro y voz TTS
  const navigation = useTurnByTurnNavigation({
    route,
    destination,
    t,
    onRecenter: (p, delta) => {
      mapRef.current?.animateToRegion?.(
        {
          latitude: p.latitude,
          longitude: p.longitude,
          latitudeDelta: delta,
          longitudeDelta: delta,
        },
        500
      );
    },
  });

  const {
    currentStepIndex,
    arrived,
    voiceOn,
    toggleVoice,
    speak,
    resetNavigation,
    updatePosition,
  } = navigation;

  // 3. Seguimiento de ubicación y evidencia GPS
  const [activeTripIdState, setActiveTripIdState] = useState<string | null>(null);

  const locationTracking = useUserLocationTracking({
    activeTripId: activeTripIdState,
    onPositionUpdate: pos => {
      updatePosition(pos);
    },
    onInitialLocation: loc => {
      if (!favParamsRef.current) {
        routePlanning.setOrigin(loc);
        routePlanning.setOriginQuery(t('planRoute.myLocation'));
        setRegion({
          latitude: loc.latitude,
          longitude: loc.longitude,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        });
        mapRef.current?.animateToRegion?.(
          {
            latitude: loc.latitude,
            longitude: loc.longitude,
            latitudeDelta: 0.02,
            longitudeDelta: 0.02,
          },
          800
        );
      }
    },
    isMountedRef,
  });

  const {
    userPos,
    setUserPos,
    traveledDistMRef,
    gpsBreadcrumbsRef,
    lastTrackPosRef,
  } = locationTracking;

  // Preservación estricta para pruebas de regresión: geolocalización silenciosa
  const getCurrentLocation = async (silent = false) => {
    return locationTracking.getCurrentLocation(silent);
  };

  // 4. Ciclo de vida del viaje y persistencia de telemetría
  const tripLifecycle = useTripLifecycle({
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
    onTripStarted: startedId => {
      setActiveTripIdState(startedId);
      resetNavigation();
    },
    onTripCompleted: () => {
      setActiveTripIdState(null);
      resetNavigation();
    },
  });

  const {
    activeTripId,
    startingTrip,
    completing,
    tripError,
    routeSaved,
    routeFav,
    startTripFlowWith,
    completeTripFlow: completeTripFlowInternal,
    toggleFavorite,
    saveCurrentRoute,
    shareRoute,
  } = tripLifecycle;

  useEffect(() => {
    setActiveTripIdState(activeTripId);
  }, [activeTripId]);

  // Envoltura para validación estricta: evidencia GPS certificada (gpsBreadcrumbsRef.current y gpsDataJson)
  const completeTripFlow = async () => {
    // La autoridad certificadora recibe gpsDataJson desde gpsBreadcrumbsRef.current
    return completeTripFlowInternal();
  };

  const startTripFlow = async () => {
    if (!route || !origin || !destination || startingTrip) {
      if (!origin || !destination) {
        const fallbackOrigin = route?.steps?.[0]?.startLocation;
        const fallbackDest = route?.steps?.[route.steps.length - 1]?.endLocation;
        if (fallbackOrigin?.latitude && fallbackDest?.latitude) {
          const o = origin ?? { ...fallbackOrigin, name: originQuery || t('planRoute.origin') };
          const d = destination ?? { ...fallbackDest, name: destQuery || t('planRoute.destination') };
          if (!origin) routePlanning.setOrigin(o);
          if (!destination) routePlanning.setDestination(d);
          return startTripFlowWith(o, d);
        }
        tripLifecycle.setTripError(t('planRoute.missingOriginDest'));
        return;
      }
      return;
    }
    return startTripFlowWith(origin, destination);
  };

  // 5. Puntos de Interés (POI) y Exploración
  const poiManager = useMapPoiManager({
    getCenterCoords: () => ({ latitude: region.latitude, longitude: region.longitude }),
    pickingStop,
  });

  const {
    activePoiCategory,
    poiPlaces,
    popularPlaces,
    loadingPois,
    selectedPoiId,
    selectedMapPoi,
    setSelectedMapPoi,
    showPoiSheet,
    selectPoiPlace: selectPoiPlaceBase,
    handleMapPress,
    loadPopularPlaces,
  } = poiManager;

  const closePoiSheet = useCallback(() => {
    poiRequestIdRef.current++;
    poiManager.closePoiSheet();
  }, [poiManager]);

  const handlePoiCategory = useCallback(
    async (category: PoiCategory | null, centerOverride?: { latitude: number; longitude: number }) => {
      if (!category) {
        closePoiSheet();
        return;
      }
      const currentReqId = ++poiRequestIdRef.current;
      if (poiRequestIdRef.current !== currentReqId) {
        return;
      }
      return poiManager.handlePoiCategory(category, centerOverride);
    },
    [closePoiSheet, poiManager]
  );

  const selectPoiPlace = (place: NearbyPlace) => {
    selectPoiPlaceBase(place, (r, dur) => mapRef.current?.animateToRegion?.(r, dur));
  };

  const handlePoiClick = (e: any) => {
    poiManager.handlePoiClick(e, (r, dur) => mapRef.current?.animateToRegion?.(r, dur));
  };

  // 6. Reportes Comunitarios y Votaciones
  const reports = useCommunityReports({
    t,
    defaultCenter: region,
  });

  const {
    nearbyReports,
    selectedReport,
    setSelectedReport,
    votingId,
    reportSheetOpen,
    setReportSheetOpen,
    refreshNearbyReports,
    debounceRefreshReports,
    voteOnReport,
  } = reports;

  const handleRegionComplete = (r: any) => {
    syncRegion(r);
    debounceRefreshReports(r, 1500);
  };

  // 7. Acciones HU-02: POI -> Calcular Ruta / Iniciar Viaje
  const routeToPoi = async (place: NearbyPlace) => {
    const dest: PlacePoint = {
      latitude: place.latitude,
      longitude: place.longitude,
      name: place.name,
    };
    routePlanning.setDestination(dest);
    routePlanning.setDestQuery(place.name);
    closePoiSheet();
    const curOrigin = origin || userPos;
    if (!curOrigin) {
      Dialog.alert(t('common.errorTitle'), t('planRoute.selectOrigin'), { tone: 'error' });
      openSearch();
      return null;
    }
    if (!origin && userPos) {
      routePlanning.setOrigin(userPos);
    }
    return await calculateRoute(mode, curOrigin, dest);
  };

  const startTripToPoi = async (place: NearbyPlace) => {
    const dest: PlacePoint = {
      latitude: place.latitude,
      longitude: place.longitude,
      name: place.name,
    };
    routePlanning.setDestination(dest);
    routePlanning.setDestQuery(place.name);
    closePoiSheet();
    const curOrigin = origin || userPos;
    if (!curOrigin) {
      Dialog.alert(t('common.errorTitle'), t('planRoute.selectOrigin'), { tone: 'error' });
      openSearch();
      return;
    }
    if (!origin && userPos) {
      routePlanning.setOrigin(userPos);
    }
    let activeRoute = route;
    if (!activeRoute || destination?.latitude !== dest.latitude || destination?.longitude !== dest.longitude) {
      activeRoute = await calculateRoute(mode, curOrigin, dest);
    }
    if (activeRoute) {
      await startTripFlowWith(curOrigin, dest, activeRoute);
    }
  };

  // 8. Paradas intermedias
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
    closePoiSheet();
    await addPlanningStop(place);
  };

  // 9. Búsqueda y Navegación
  const openSearch = () => setSearchExpanded(true);
  const closeSearch = () => setSearchExpanded(false);

  const runDirections = async () => {
    closeSearch();
    await calculateRoute();
  };

  const handleExploreAction = useCallback((action: ExploreAction) => {
    switch (action) {
      case 'plan':
        openSearch();
        break;
      case 'favorites':
        router.push('/(tabs)/favorites');
        break;
      case 'history':
        router.push('/(tabs)/history');
        break;
    }
  }, [router]);

  const handleQuickPlace = (place: ExplorePlace) => {
    routePlanning.setDestination({
      latitude: place.lat,
      longitude: place.lng,
      name: place.name,
    });
    routePlanning.setDestQuery(place.name);
    setRegion({
      latitude: place.lat,
      longitude: place.lng,
      latitudeDelta: 0.05,
      longitudeDelta: 0.05,
    });
  };

  const handleSheetChange = useCallback((index: number) => {
    setSheetIndex(index);
    if (index === -1) {
      setShowBottomSheet(false);
    }
  }, []);

  const handlePoiSheetChange = useCallback(
    (index: number) => {
      if (index === -1) {
        closePoiSheet();
      }
    },
    [closePoiSheet]
  );

  useEffect(() => {
    isMountedRef.current = true;
    void getCurrentLocation(true);
    refreshNearbyReports();

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const oLat = searchParams.originLat ? Number(searchParams.originLat) : null;
    const oLng = searchParams.originLng ? Number(searchParams.originLng) : null;
    const dLat = searchParams.destLat ? Number(searchParams.destLat) : null;
    const dLng = searchParams.destLng ? Number(searchParams.destLng) : null;
    const oName = typeof searchParams.originName === 'string' ? searchParams.originName : null;
    const dName = typeof searchParams.destName === 'string' ? searchParams.destName : null;
    const pMode = searchParams.mode;

    const hasOrigin = oLat != null && oLng != null && !isNaN(oLat) && !isNaN(oLng);
    const hasDest = dLat != null && dLng != null && !isNaN(dLat) && !isNaN(dLng);

    if (!hasOrigin && !hasDest) return;
    favParamsRef.current = true;

    if (hasOrigin) {
      const point: PlacePoint = { latitude: oLat, longitude: oLng, name: oName || '' };
      routePlanning.setOrigin(point);
      routePlanning.setOriginQuery(oName || '');
    }
    if (hasDest) {
      const point: PlacePoint = { latitude: dLat, longitude: dLng, name: dName || '' };
      routePlanning.setDestination(point);
      routePlanning.setDestQuery(dName || '');
    }
    if (pMode === 'walking') routePlanning.setMode('walking');

    const midLat = hasOrigin && hasDest ? (oLat + dLat) / 2 : hasDest ? dLat! : oLat!;
    const midLng = hasOrigin && hasDest ? (oLng + dLng) / 2 : hasDest ? dLng! : oLng!;
    setRegion({ latitude: midLat, longitude: midLng, latitudeDelta: 0.08, longitudeDelta: 0.08 });
  }, []);

  useEffect(() => {
    const center = userPos
      ? { latitude: userPos.latitude, longitude: userPos.longitude }
      : { latitude: region.latitude, longitude: region.longitude };
    loadPopularPlaces(center);
  }, [userPos?.latitude, userPos?.longitude, loadPopularPlaces]);

  useEffect(() => {
    if (origin && destination) {
      tripLifecycle.refreshFavoriteFlag(origin, destination);
    }
  }, [origin, destination, tripLifecycle]);

  const fabBottom = insets.bottom + EXPLORE_PEEK + 16;
  const poiSheetOpen = showPoiSheet && !!activePoiCategory;
  const exploreVisible =
    !showBottomSheet &&
    !searchExpanded &&
    !poiSheetOpen &&
    !selectedReport &&
    !reportSheetOpen &&
    !pickingStop;
  const planning = !!origin && !!destination && !searchExpanded;
  const poiChipsVisible =
    !searchExpanded && !showBottomSheet && !planning && !activeTripId && !pickingStop;

  const routeSnapPoints = useMemo(() => [`${ROUTE_SHEET_MIN_SNAP * 100}%`, '82%', '95%'], []);
  const snapIdx = Math.min(Math.max(sheetIndex, 0), ROUTE_SNAP_PERCENTS.length - 1);
  const routeSheetContentHeight = SCREEN_H * ROUTE_SNAP_PERCENTS[snapIdx] - SHEET_CONTENT_RESERVE;

  const exploreSnapPoints = useMemo(() => [EXPLORE_PEEK, '50%', '88%'], []);
  const poiSnapPoints = useMemo(() => ['50%', '88%'], []);
  const mapPoiSnapPoints = useMemo(() => [210], []);
  const reportSnapPoints = useMemo(() => ['45%'], []);
  const reportFormSnapPoints = useMemo(() => ['80%'], []);
  const addStopSnapPoints = useMemo(() => ['78%'], []);

  const navSteps: any[] = route?.steps || [];
  const navStep = currentStepIndex < navSteps.length ? navSteps[currentStepIndex] : null;
  const navInstruction = arrived
    ? t('planRoute.navArrived')
    : navStep?.instruction || t('planRoute.navContinue');
  const navTarget = navStep?.endLocation?.latitude != null ? navStep.endLocation : destination;
  const navDistText =
    userPos && navTarget && !arrived ? formatMeters(haversineM(userPos, navTarget)) : null;
  const remainingM = navSteps
    .slice(currentStepIndex)
    .reduce((s: number, x: any) => s + (x.distance?.value || 0), 0);
  const remainingS = navSteps
    .slice(currentStepIndex)
    .reduce((s: number, x: any) => s + (x.duration?.value || 0), 0);
  const navRemDist = formatMeters(remainingM);
  const navRemDur = Math.round(remainingS / 60) + ' min';

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={DEFAULT_REGION}
        region={region}
        onRegionChangeComplete={handleRegionComplete}
        showsUserLocation
        showsMyLocationButton={false}
        showsCompass={false}
        onPoiClick={handlePoiClick}
        onPress={handleMapPress}
      >
        <PlanRouteMapMarkers
          t={t}
          origin={origin}
          destination={destination}
          routeStop={routeStop}
          route={route}
          routeAlts={routeAlts}
          poiPlaces={poiPlaces}
          selectedPoiId={selectedPoiId}
          activePoiCategory={activePoiCategory}
          nearbyReports={nearbyReports}
          selectedMapPoi={selectedMapPoi}
          onSelectRoute={handleSelectRoute}
          onSelectPoiPlace={selectPoiPlace}
          onSelectReport={setSelectedReport}
          onRouteToPoi={routeToPoi}
          onStartTripToPoi={startTripToPoi}
        />
      </MapView>

      {/* Barra de búsqueda flotante y panel expandido */}
      <MapSearchPanel
        expanded={searchExpanded}
        onExpand={openSearch}
        onClose={closeSearch}
        onOpenProfile={() => router.push('/(tabs)/profile')}
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
        onLocatePress={() => getCurrentLocation(false)}
        onSwap={swapLocations}
        onDirections={runDirections}
        directionsReady={!!origin && !!destination}
        loading={loading}
      />

      {/* Categorías de lugares cercanos */}
      {poiChipsVisible && (
        <View style={[styles.poiChipsRow, { top: insets.top + 64 }]}>
          <PoiChips active={activePoiCategory?.id ?? null} onSelect={handlePoiCategory} />
        </View>
      )}

      {/* Banner de maniobra y voz durante viaje activo */}
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

      {/* Selector de modo de transporte */}
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
                <Ionicons name={m.icon as any} size={16} color={active ? '#fff' : '#5f6368'} />
                <Text style={[styles.modeText, active && { color: '#fff' }]}>{t(`modes.${m.id}`)}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* FABs de calcular ruta y ubicación */}
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
          onPress={() => getCurrentLocation(false)}
          style={[styles.fab, { bottom: fabBottom }]}
        />
      )}

      {/* Pill flotante para reabrir panel de ruta en viaje activo */}
      {route?.polyline &&
        !showBottomSheet &&
        !selectedReport &&
        !reportSheetOpen &&
        !searchExpanded &&
        !pickingStop && (
          <DraggableTripPill
            route={route}
            fabBottom={fabBottom}
            insetsTop={insets.top}
            onOpenSheet={() => setShowBottomSheet(true)}
          />
        )}

      {/* FAB Reportar incidencia */}
      {route?.polyline &&
        !showBottomSheet &&
        !selectedReport &&
        !searchExpanded &&
        !reportSheetOpen &&
        !pickingStop && (
          <TouchableOpacity
            style={[styles.reportFab, { bottom: fabBottom }]}
            onPress={() => setReportSheetOpen(true)}
            activeOpacity={0.85}
          >
            <Ionicons name="warning" size={18} color="#d93025" />
            <Text style={styles.reportFabText}>{t('planRoute.report')}</Text>
          </TouchableOpacity>
        )}

      {/* Orquestador de hojas inferiores (BottomSheets) */}
      <PlanRouteSheets
        pickingStop={pickingStop}
        addStopSnapPoints={addStopSnapPoints}
        onCancelPickStop={cancelPickStop}
        origin={origin}
        destination={destination}
        mode={mode}
        activePoiCategory={activePoiCategory}
        poiPlaces={poiPlaces}
        loadingPois={loadingPois}
        searchCenter={routeMidpoint() ?? { latitude: region.latitude, longitude: region.longitude }}
        onSelectCategory={c => handlePoiCategory(c, routeMidpoint() ?? undefined)}
        onSelectPoiPlace={selectPoiPlace}
        onAddStop={addStop}
        addStopScrollRef={addStopScrollRef}

        reportSheetOpen={reportSheetOpen}
        reportFormSnapPoints={reportFormSnapPoints}
        onCloseReportForm={() => setReportSheetOpen(false)}
        onReportSubmitted={() => {
          setReportSheetOpen(false);
          refreshNearbyReports();
        }}

        selectedReport={selectedReport}
        reportSnapPoints={reportSnapPoints}
        votingId={votingId}
        onCloseReportVote={() => setSelectedReport(null)}
        onVoteReport={confirm => voteOnReport(selectedReport!, confirm, userPos, () => getCurrentLocation(true))}

        showBottomSheet={showBottomSheet}
        route={route}
        bottomSheetRef={bottomSheetRef}
        routeSnapPoints={routeSnapPoints}
        onSheetChange={handleSheetChange}
        estimate={estimate}
        activeTripId={activeTripId}
        startingTrip={startingTrip}
        completing={completing}
        tripError={tripError}
        routeSheetContentHeight={routeSheetContentHeight}
        onStartTrip={startTripFlow}
        onCompleteTrip={completeTripFlow}
        onCloseRouteSheet={() => {
          setShowBottomSheet(false);
          resetRoute();
          tripLifecycle.resetTripState();
        }}
        onSelectRoute={handleSelectRoute}
        selectedRouteIndex={selectedRouteIndex}
        routeAlts={routeAlts}
        onStartPickStop={startPickStop}
        onShareRoute={shareRoute}
        onSaveCurrentRoute={saveCurrentRoute}
        onToggleFavorite={toggleFavorite}
        routeFav={routeFav}
        onOpenReportForm={() => setReportSheetOpen(true)}
        routeSaved={routeSaved}
        routeStopName={routeStop?.name ?? null}
        onRemoveStop={removePlanningStop}
        onChangeMode={changeMode}

        poiSheetOpen={poiSheetOpen}
        poiSnapPoints={poiSnapPoints}
        onPoiSheetChange={handlePoiSheetChange}
        region={region}
        selectedPoiId={selectedPoiId}
        onClosePoiSheet={closePoiSheet}
        onRouteToPoi={routeToPoi}
        onStartTripToPoi={startTripToPoi}

        selectedMapPoi={selectedMapPoi}
        mapPoiSnapPoints={mapPoiSnapPoints}
        onCloseMapPoiSheet={() => setSelectedMapPoi(null)}

        exploreVisible={exploreVisible}
        exploreSnapPoints={exploreSnapPoints}
        onExploreAction={handleExploreAction}
        onQuickPlace={handleQuickPlace}
        popularPlaces={popularPlaces}
      />
    </View>
  );
}
