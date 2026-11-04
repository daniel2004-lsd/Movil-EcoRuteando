import React from 'react';
import { View, Text, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Marker, Callout, CalloutSubview, Polyline } from '../../../components/maps/MapEngine';
import { decodePolyline, type NearbyPlace, type PoiCategory } from '../../../services/maps/googleMaps';
import type { NearbyReport } from '../../../services/reports';
import type { PlacePoint } from '../types';
import { RouteAlternativesOverlay } from './RouteAlternativesOverlay';
import { styles } from '../styles/planRouteStyles';

interface PlanRouteMapMarkersProps {
  t: (key: string) => string;
  origin: PlacePoint | null;
  destination: PlacePoint | null;
  routeStop: PlacePoint | null;
  route: any;
  routeAlts: any[];
  poiPlaces: NearbyPlace[];
  selectedPoiId: string | null;
  activePoiCategory: PoiCategory | null;
  nearbyReports: NearbyReport[];
  selectedMapPoi: NearbyPlace | null;
  onSelectRoute: (index: number) => void;
  onSelectPoiPlace: (place: NearbyPlace) => void;
  onSelectReport: (report: NearbyReport) => void;
  onRouteToPoi: (place: NearbyPlace) => void;
  onStartTripToPoi: (place: NearbyPlace) => void;
}

export function PlanRouteMapMarkers({
  t,
  origin,
  destination,
  routeStop,
  route,
  routeAlts,
  poiPlaces,
  selectedPoiId,
  activePoiCategory,
  nearbyReports,
  selectedMapPoi,
  onSelectRoute,
  onSelectPoiPlace,
  onSelectReport,
  onRouteToPoi,
  onStartTripToPoi,
}: PlanRouteMapMarkersProps) {
  return (
    <>
      {origin && (
        <Marker coordinate={origin} title={t('planRoute.origin')}>
          <View style={styles.originMarker}>
            <View style={styles.markerPin} />
          </View>
        </Marker>
      )}

      {destination && (
        <Marker coordinate={destination} title={t('planRoute.destination')}>
          <View style={styles.destMarker}>
            <View style={styles.markerPinRed} />
          </View>
        </Marker>
      )}

      {routeStop && (
        <Marker coordinate={routeStop} title={routeStop.name || t('planRoute.stop')}>
          <View style={[styles.destMarker, { backgroundColor: '#f59e0b' }]}>
            <Ionicons name="flag" size={16} color="#fff" />
          </View>
        </Marker>
      )}

      {route?.polyline && (
        <Polyline
          coordinates={decodePolyline(route.polyline)}
          strokeColor="#1a73e8"
          strokeWidth={5}
          lineCap="round"
          lineJoin="round"
        />
      )}

      <RouteAlternativesOverlay
        route={route}
        routeAlts={routeAlts}
        onSelectRoute={onSelectRoute}
      />

      {poiPlaces.map(place => (
        <Marker
          key={place.placeId}
          coordinate={{ latitude: place.latitude, longitude: place.longitude }}
          onPress={() => onSelectPoiPlace(place)}
        >
          <View
            style={[
              styles.poiMarker,
              selectedPoiId === place.placeId && styles.poiMarkerSelected,
              { borderColor: activePoiCategory?.color ?? '#1a73e8' },
            ]}
          >
            <Ionicons
              name={(activePoiCategory?.icon as any) ?? 'location'}
              size={selectedPoiId === place.placeId ? 18 : 14}
              color={activePoiCategory?.color ?? '#1a73e8'}
            />
          </View>
        </Marker>
      ))}

      {nearbyReports.map(rep => (
        <Marker
          key={rep.id}
          coordinate={{ latitude: rep.latitude, longitude: rep.longitude }}
          onPress={() => onSelectReport(rep)}
        >
          <View
            style={[
              styles.reportMarker,
              {
                backgroundColor:
                  rep.reportType === 'closure'
                    ? '#d93025'
                    : rep.reportType === 'accident'
                    ? '#ea4335'
                    : '#f29900',
              },
            ]}
          >
            <Ionicons
              name={
                rep.reportType === 'closure'
                  ? 'hand-left'
                  : rep.reportType === 'accident'
                  ? 'car'
                  : 'warning'
              }
              size={14}
              color="#ffffff"
            />
          </View>
        </Marker>
      ))}

      {selectedMapPoi && (
        <Marker
          key={selectedMapPoi.placeId}
          coordinate={{
            latitude: selectedMapPoi.latitude,
            longitude: selectedMapPoi.longitude,
          }}
        >
          <View style={styles.selectedMapPoiPin}>
            <Ionicons name="location" size={26} color="#10b981" />
          </View>
          {Platform.OS === 'ios' && (
            <Callout tooltip>
              <View style={styles.poiCallout}>
                <Text style={styles.poiCalloutName} numberOfLines={1}>
                  {selectedMapPoi.name}
                </Text>
                <View style={styles.poiCalloutActionsRow}>
                  <CalloutSubview
                    style={styles.poiCalloutBtnRoute}
                    onPress={() => onRouteToPoi(selectedMapPoi)}
                  >
                    <Ionicons name="navigate" size={12} color="#ffffff" />
                    <Text style={styles.poiCalloutBtnText}>{t('planRoute.howToGet') || 'Cómo llegar'}</Text>
                  </CalloutSubview>
                  <CalloutSubview
                    style={styles.poiCalloutBtnTrip}
                    onPress={() => onStartTripToPoi(selectedMapPoi)}
                  >
                    <Ionicons name="play" size={12} color="#ffffff" />
                    <Text style={styles.poiCalloutBtnText}>{t('planRoute.startTripBtn') || 'Iniciar viaje'}</Text>
                  </CalloutSubview>
                </View>
              </View>
            </Callout>
          )}
        </Marker>
      )}
    </>
  );
}
