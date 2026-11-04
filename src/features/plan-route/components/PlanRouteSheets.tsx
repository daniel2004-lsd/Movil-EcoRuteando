import React from 'react';
import BottomSheet from '@gorhom/bottom-sheet';
import { RouteBottomSheet } from '../../../components/maps/RouteBottomSheet';
import { PoiResultsSheet } from '../../../components/maps/PoiResultsSheet';
import { AddStopSheet } from '../../../components/maps/AddStopSheet';
import { ReportVoteSheet } from '../../../components/maps/ReportVoteSheet';
import { ReportFormSheet } from '../../../components/maps/ReportFormSheet';
import { ExploreSheet, type ExploreAction, type ExplorePlace } from '../../../components/maps/ExploreSheet';
import { MapPoiDetailSheet } from './MapPoiDetailSheet';
import { TAB_BAR_HEIGHT } from '../../../shared/theme';
import { styles } from '../styles/planRouteStyles';
import type { PlacePoint, TransportMode } from '../types';
import type { NearbyPlace, PoiCategory } from '../../../services/maps/googleMaps';
import type { NearbyReport } from '../../../services/reports';

interface PlanRouteSheetsProps {
  pickingStop: boolean;
  addStopSnapPoints: (string | number)[];
  onCancelPickStop: () => void;
  origin: PlacePoint | null;
  destination: PlacePoint | null;
  mode: TransportMode;
  activePoiCategory: PoiCategory | null;
  poiPlaces: NearbyPlace[];
  loadingPois: boolean;
  searchCenter: { latitude: number; longitude: number };
  onSelectCategory: (c: PoiCategory) => void;
  onSelectPoiPlace: (p: NearbyPlace) => void;
  onAddStop: (p: NearbyPlace) => void;
  addStopScrollRef: any;

  reportSheetOpen: boolean;
  reportFormSnapPoints: (string | number)[];
  onCloseReportForm: () => void;
  onReportSubmitted: () => void;

  selectedReport: NearbyReport | null;
  reportSnapPoints: (string | number)[];
  votingId: string | null;
  onCloseReportVote: () => void;
  onVoteReport: (confirm: boolean) => void;

  showBottomSheet: boolean;
  route: any;
  bottomSheetRef: any;
  routeSnapPoints: (string | number)[];
  onSheetChange: (index: number) => void;
  estimate: any;
  activeTripId: string | null;
  startingTrip: boolean;
  completing: boolean;
  tripError: string | null;
  routeSheetContentHeight: number;
  onStartTrip: () => void;
  onCompleteTrip: () => void;
  onCloseRouteSheet: () => void;
  onSelectRoute: (index: number) => void;
  selectedRouteIndex: number;
  routeAlts: any[];
  onStartPickStop: () => void;
  onShareRoute: () => void;
  onSaveCurrentRoute: () => void;
  onToggleFavorite: () => void;
  routeFav: boolean;
  onOpenReportForm: () => void;
  routeSaved: boolean;
  routeStopName: string | null;
  onRemoveStop: () => void;
  onChangeMode: (m: TransportMode) => void;

  poiSheetOpen: boolean;
  poiSnapPoints: (string | number)[];
  onPoiSheetChange: (index: number) => void;
  region: { latitude: number; longitude: number };
  selectedPoiId: string | null;
  onClosePoiSheet: () => void;
  onRouteToPoi: (p: NearbyPlace) => void;
  onStartTripToPoi: (p: NearbyPlace) => void;

  selectedMapPoi: NearbyPlace | null;
  mapPoiSnapPoints: (string | number)[];
  onCloseMapPoiSheet: () => void;

  exploreVisible: boolean;
  exploreSnapPoints: (string | number)[];
  onExploreAction: (action: ExploreAction) => void;
  onQuickPlace: (place: ExplorePlace) => void;
  popularPlaces: ExplorePlace[];
}

export function PlanRouteSheets(props: PlanRouteSheetsProps) {
  const {
    pickingStop,
    addStopSnapPoints,
    onCancelPickStop,
    origin,
    destination,
    mode,
    activePoiCategory,
    poiPlaces,
    loadingPois,
    searchCenter,
    onSelectCategory,
    onSelectPoiPlace,
    onAddStop,
    addStopScrollRef,

    reportSheetOpen,
    reportFormSnapPoints,
    onCloseReportForm,
    onReportSubmitted,

    selectedReport,
    reportSnapPoints,
    votingId,
    onCloseReportVote,
    onVoteReport,

    showBottomSheet,
    route,
    bottomSheetRef,
    routeSnapPoints,
    onSheetChange,
    estimate,
    activeTripId,
    startingTrip,
    completing,
    tripError,
    routeSheetContentHeight,
    onStartTrip,
    onCompleteTrip,
    onCloseRouteSheet,
    onSelectRoute,
    selectedRouteIndex,
    routeAlts,
    onStartPickStop,
    onShareRoute,
    onSaveCurrentRoute,
    onToggleFavorite,
    routeFav,
    onOpenReportForm,
    routeSaved,
    routeStopName,
    onRemoveStop,
    onChangeMode,

    poiSheetOpen,
    poiSnapPoints,
    onPoiSheetChange,
    region,
    selectedPoiId,
    onClosePoiSheet,
    onRouteToPoi,
    onStartTripToPoi,

    selectedMapPoi,
    mapPoiSnapPoints,
    onCloseMapPoiSheet,

    exploreVisible,
    exploreSnapPoints,
    onExploreAction,
    onQuickPlace,
    popularPlaces,
  } = props;

  if (pickingStop) {
    return (
      <BottomSheet
        key="addStopSheet"
        snapPoints={addStopSnapPoints}
        index={0}
        onChange={index => {
          if (index === -1) onCancelPickStop();
        }}
        enablePanDownToClose
        enableDynamicSizing={false}
        enableContentPanningGesture={false}
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
          searchCenter={searchCenter}
          onSelectCategory={onSelectCategory}
          onSelectPlace={onSelectPoiPlace}
          onAddPlace={onAddStop}
          onClose={onCancelPickStop}
          scrollRef={addStopScrollRef}
        />
      </BottomSheet>
    );
  }

  if (reportSheetOpen) {
    return (
      <BottomSheet
        key="reportFormSheet"
        snapPoints={reportFormSnapPoints}
        index={0}
        onChange={index => {
          if (index === -1) onCloseReportForm();
        }}
        enablePanDownToClose
        enableDynamicSizing={false}
        handleIndicatorStyle={styles.sheetHandle}
        backgroundStyle={styles.sheetBg}
      >
        <ReportFormSheet
          onClose={onCloseReportForm}
          onSubmitted={onReportSubmitted}
        />
      </BottomSheet>
    );
  }

  if (selectedReport) {
    return (
      <BottomSheet
        key="reportVoteSheet"
        snapPoints={reportSnapPoints}
        index={0}
        onChange={index => {
          if (index === -1) onCloseReportVote();
        }}
        enablePanDownToClose
        enableDynamicSizing={false}
        handleIndicatorStyle={styles.sheetHandle}
        backgroundStyle={styles.sheetBg}
      >
        <ReportVoteSheet
          report={selectedReport}
          voting={votingId === selectedReport.id}
          onClose={onCloseReportVote}
          onVote={onVoteReport}
        />
      </BottomSheet>
    );
  }

  if (showBottomSheet && route) {
    return (
      <BottomSheet
        key="routeSheet"
        ref={bottomSheetRef}
        snapPoints={routeSnapPoints}
        index={0}
        onChange={onSheetChange}
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
          onStartTrip={onStartTrip}
          onCompleteTrip={onCompleteTrip}
          onClose={onCloseRouteSheet}
          onSelectRoute={onSelectRoute}
          selectedRouteIndex={selectedRouteIndex}
          routes={route ? [route, ...routeAlts] : []}
          onAddStop={onStartPickStop}
          onShare={onShareRoute}
          onSave={onSaveCurrentRoute}
          onToggleFavorite={onToggleFavorite}
          routeFavorited={routeFav}
          onReport={onOpenReportForm}
          routeSaved={routeSaved}
          stopName={routeStopName}
          onRemoveStop={onRemoveStop}
          activeMode={mode}
          onModePress={id => onChangeMode(id as TransportMode)}
          bottomInset={TAB_BAR_HEIGHT}
        />
      </BottomSheet>
    );
  }

  if (poiSheetOpen && activePoiCategory) {
    return (
      <BottomSheet
        key="poiSheet"
        snapPoints={poiSnapPoints}
        index={0}
        onChange={onPoiSheetChange}
        enablePanDownToClose
        enableDynamicSizing={false}
        handleIndicatorStyle={styles.sheetHandle}
        backgroundStyle={styles.sheetBg}
      >
        <PoiResultsSheet
          category={activePoiCategory}
          places={poiPlaces}
          loading={loadingPois}
          center={searchCenter}
          selectedPlaceId={selectedPoiId}
          onClose={onClosePoiSheet}
          onSelectPlace={onSelectPoiPlace}
          onRoute={onRouteToPoi}
          onStartTrip={onStartTripToPoi}
        />
      </BottomSheet>
    );
  }

  if (selectedMapPoi && !route) {
    return (
      <BottomSheet
        key="mapPoiSheet"
        snapPoints={mapPoiSnapPoints}
        index={0}
        onChange={index => {
          if (index === -1) onCloseMapPoiSheet();
        }}
        enablePanDownToClose
        enableDynamicSizing={false}
        handleIndicatorStyle={styles.sheetHandle}
        backgroundStyle={styles.sheetBg}
      >
        <MapPoiDetailSheet
          place={selectedMapPoi}
          onClose={onCloseMapPoiSheet}
          onRoute={p => {
            onCloseMapPoiSheet();
            onRouteToPoi(p);
          }}
          onStartTrip={p => {
            onCloseMapPoiSheet();
            onStartTripToPoi(p);
          }}
        />
      </BottomSheet>
    );
  }

  if (exploreVisible) {
    return (
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
          onModePress={id => onChangeMode(id as TransportMode)}
          onAction={onExploreAction}
          onPlaceSelect={onQuickPlace}
          places={popularPlaces}
        />
      </BottomSheet>
    );
  }

  return null;
}
