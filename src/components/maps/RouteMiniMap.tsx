import React, { useMemo } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, Polyline } from './MapEngine';

interface RouteMiniMapProps {
  startLat?: number | null;
  startLng?: number | null;
  endLat?: number | null;
  endLng?: number | null;
  encodedPolyline?: string | null;
  isDark?: boolean;
  height?: number;
}

const GOOGLE_MAPS_API_KEY =
  process.env.EXPO_PUBLIC_GOOGLE_MAPS_KEY || '';

export function decodePolyline(encoded: string): { latitude: number; longitude: number }[] {
  const points: { latitude: number; longitude: number }[] = [];
  let index = 0, len = encoded.length;
  let lat = 0, lng = 0;

  while (index < len) {
    let b, shift = 0, result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
    lat += dlat;

    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
    lng += dlng;

    points.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
  }

  return points;
}

export function getStaticMapUrl({
  startLat,
  startLng,
  endLat,
  endLng,
  encodedPolyline,
  isDark,
  width = 600,
  height = 300,
}: {
  startLat?: number | null;
  startLng?: number | null;
  endLat?: number | null;
  endLng?: number | null;
  encodedPolyline?: string | null;
  isDark?: boolean;
  width?: number;
  height?: number;
}): string | null {
  let sLatitude = startLat;
  let sLongitude = startLng;
  let eLatitude = endLat;
  let eLongitude = endLng;

  if ((sLatitude == null || sLongitude == null) && encodedPolyline && encodedPolyline.trim().length > 0) {
    try {
      const decoded = decodePolyline(encodedPolyline.trim());
      if (decoded.length > 0) {
        sLatitude = decoded[0].latitude;
        sLongitude = decoded[0].longitude;
        if (eLatitude == null || eLongitude == null) {
          eLatitude = decoded[decoded.length - 1].latitude;
          eLongitude = decoded[decoded.length - 1].longitude;
        }
      }
    } catch {
      // Ignorar fallo de decodificación
    }
  }

  if (!GOOGLE_MAPS_API_KEY) return null;

  const validStart = sLatitude != null && sLongitude != null && Number.isFinite(Number(sLatitude)) && Number.isFinite(Number(sLongitude));
  if (!validStart) return null;

  const sLat = Number(sLatitude).toFixed(5);
  const sLng = Number(sLongitude).toFixed(5);

  const params: string[] = [
    `size=${width}x${height}`,
    'scale=2',
    'maptype=roadmap',
    'format=png',
  ];

  if (isDark) {
    params.push('style=element:geometry%7Ccolor:0x162329');
    params.push('style=element:labels.text.fill%7Ccolor:0x94a3b8');
    params.push('style=element:labels.text.stroke%7Ccolor:0x0b1215');
    params.push('style=feature:road%7Celement:geometry%7Ccolor:0x26383D');
    params.push('style=feature:water%7Celement:geometry%7Ccolor:0x0e2127');
    params.push('style=feature:poi.park%7Celement:geometry%7Ccolor:0x064e3b');
  }

  params.push(`markers=color:0x10b981%7Csize:mid%7Clabel:A%7C${sLat},${sLng}`);

  const validEnd = endLat != null && endLng != null && Number.isFinite(Number(endLat)) && Number.isFinite(Number(endLng));
  if (validEnd) {
    const eLat = Number(endLat).toFixed(5);
    const eLng = Number(endLng).toFixed(5);

    params.push(`markers=color:0xef4444%7Csize:mid%7Clabel:B%7C${eLat},${eLng}`);

    if (encodedPolyline && encodedPolyline.trim().length > 0) {
      params.push(`path=color:0x10b981ff%7Cweight:5%7Cenc:${encodedPolyline.trim()}`);
    } else {
      params.push(`path=color:0x10b981ff%7Cweight:4%7C${sLat},${sLng}%7C${eLat},${eLng}`);
    }
  }

  if (GOOGLE_MAPS_API_KEY) {
    params.push(`key=${GOOGLE_MAPS_API_KEY}`);
  }

  return `https://maps.googleapis.com/maps/api/staticmap?${params.join('&')}`;
}

export function RouteMiniMap({
  startLat,
  startLng,
  endLat,
  endLng,
  encodedPolyline,
  isDark = false,
  height = 155,
}: RouteMiniMapProps) {
  const mapData = useMemo(() => {
    let polyPoints: { latitude: number; longitude: number }[] = [];
    if (encodedPolyline && encodedPolyline.trim().length > 0) {
      try {
        polyPoints = decodePolyline(encodedPolyline.trim());
      } catch {
        polyPoints = [];
      }
    }

    const sLat = startLat != null ? Number(startLat) : polyPoints.length > 0 ? polyPoints[0].latitude : null;
    const sLng = startLng != null ? Number(startLng) : polyPoints.length > 0 ? polyPoints[0].longitude : null;
    const eLat = endLat != null ? Number(endLat) : polyPoints.length > 1 ? polyPoints[polyPoints.length - 1].latitude : null;
    const eLng = endLng != null ? Number(endLng) : polyPoints.length > 1 ? polyPoints[polyPoints.length - 1].longitude : null;

    if (polyPoints.length === 0 && sLat != null && sLng != null && eLat != null && eLng != null) {
      polyPoints = [
        { latitude: sLat, longitude: sLng },
        { latitude: eLat, longitude: eLng },
      ];
    }

    const allLats: number[] = polyPoints.map(p => p.latitude);
    const allLngs: number[] = polyPoints.map(p => p.longitude);
    if (sLat != null && Number.isFinite(sLat)) allLats.push(sLat);
    if (sLng != null && Number.isFinite(sLng)) allLngs.push(sLng);
    if (eLat != null && Number.isFinite(eLat)) allLats.push(eLat);
    if (eLng != null && Number.isFinite(eLng)) allLngs.push(eLng);

    if (allLats.length === 0 || allLngs.length === 0) {
      return null;
    }

    const minLat = Math.min(...allLats);
    const maxLat = Math.max(...allLats);
    const minLng = Math.min(...allLngs);
    const maxLng = Math.max(...allLngs);

    const midLat = (minLat + maxLat) / 2;
    const midLng = (minLng + maxLng) / 2;
    const latDelta = Math.max((maxLat - minLat) * 1.5, 0.01);
    const lngDelta = Math.max((maxLng - minLng) * 1.5, 0.01);

    return {
      points: polyPoints,
      start: sLat != null && sLng != null ? { latitude: sLat, longitude: sLng } : null,
      end: eLat != null && eLng != null ? { latitude: eLat, longitude: eLng } : null,
      region: {
        latitude: midLat,
        longitude: midLng,
        latitudeDelta: latDelta,
        longitudeDelta: lngDelta,
      },
    };
  }, [startLat, startLng, endLat, endLng, encodedPolyline]);

  if (!mapData) {
    return (
      <View style={[styles.placeholder, isDark ? styles.placeholderDark : styles.placeholderLight, { height }]}>
        <View style={styles.gridPattern}>
          <Ionicons name="map-outline" size={32} color={isDark ? '#334155' : '#cbd5e1'} />
          <View style={styles.placeholderRow}>
            <View style={[styles.dot, { backgroundColor: '#10b981' }]} />
            <View style={[styles.line, isDark && { backgroundColor: '#334155' }]} />
            <View style={[styles.dot, { backgroundColor: '#ef4444' }]} />
          </View>
          <Text style={[styles.placeholderText, isDark && { color: '#64748b' }]}>
            Coordenadas no disponibles
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { height }, isDark && styles.containerDark]} pointerEvents="none">
      <MapView
        style={StyleSheet.absoluteFill}
        initialRegion={mapData.region}
        region={mapData.region}
        liteMode={true}
        scrollEnabled={false}
        zoomEnabled={false}
        rotateEnabled={false}
        pitchEnabled={false}
        showsUserLocation={false}
        showsMyLocationButton={false}
        showsCompass={false}
        toolbarEnabled={false}
        cacheEnabled={true}
      >
        {mapData.points.length > 1 && (
          <Polyline
            coordinates={mapData.points}
            strokeColor="#10b981"
            strokeWidth={4}
          />
        )}
        {mapData.start && (
          <Marker
            coordinate={mapData.start}
            pinColor="#10b981"
            title="Origen"
          />
        )}
        {mapData.end && (
          <Marker
            coordinate={mapData.end}
            pinColor="#ef4444"
            title="Destino"
          />
        )}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: '#0f172a',
    overflow: 'hidden',
    position: 'relative',
  },
  containerDark: {
    backgroundColor: '#0B1215',
  },
  placeholder: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  placeholderLight: {
    backgroundColor: '#f1f5f9',
  },
  placeholderDark: {
    backgroundColor: '#111C20',
  },
  gridPattern: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  placeholderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  line: {
    width: 36,
    height: 2,
    backgroundColor: '#94a3b8',
    borderRadius: 1,
  },
  placeholderText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94a3b8',
    marginTop: 2,
  },
});
