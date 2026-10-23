import React, { useState } from 'react';
import { View, Image, StyleSheet, Text, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

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

  // Si no hay coordenadas pero sí polyline, decodificar primer y último punto
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

  // Pin verde de origen
  params.push(`markers=color:0x10b981%7Csize:mid%7Clabel:A%7C${sLat},${sLng}`);

  const validEnd = endLat != null && endLng != null && Number.isFinite(Number(endLat)) && Number.isFinite(Number(endLng));
  if (validEnd) {
    const eLat = Number(endLat).toFixed(5);
    const eLng = Number(endLng).toFixed(5);

    // Pin rojo de destino
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
  height = 148,
}: RouteMiniMapProps) {
  const [imageError, setImageError] = useState(false);
  const [loading, setLoading] = useState(true);

  const mapUrl = getStaticMapUrl({
    startLat,
    startLng,
    endLat,
    endLng,
    encodedPolyline,
    isDark,
  });

  if (!mapUrl || imageError) {
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
            {startLat && endLat ? 'Recorrido trazado' : 'Coordenadas no disponibles'}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { height }, isDark && styles.containerDark]}>
      <Image
        source={{ uri: mapUrl }}
        style={styles.image}
        resizeMode="cover"
        onLoadEnd={() => setLoading(false)}
        onError={() => {
          setImageError(true);
          setLoading(false);
        }}
      />
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="small" color="#10b981" />
        </View>
      )}
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
  image: {
    width: '100%',
    height: '100%',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(15, 23, 42, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
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
