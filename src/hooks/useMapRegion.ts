import { useState, useCallback } from 'react';

export interface MapRegion {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

const NEIVA_CENTER = { latitude: 2.9273, longitude: -75.2819 };

export function useMapRegion(initialRegion?: MapRegion) {
  const [region, setRegion] = useState<MapRegion>(initialRegion || {
    ...NEIVA_CENTER,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  });

  const animateToRegion = useCallback((newRegion: MapRegion, duration = 500) => {
    setRegion(newRegion);
  }, []);

  // Sincroniza la región del mapa SIN provocar re-render si los valores no
  // cambiaron: rompe el loop infinito evento → setState → re-render → evento
  // que hacía que el mapa "se portara loco" al tocar cualquier cosa.
  const syncRegion = useCallback((r: MapRegion) => {
    setRegion(prev => {
      const same =
        Math.abs(r.latitude - prev.latitude) < 1e-5 &&
        Math.abs(r.longitude - prev.longitude) < 1e-5 &&
        Math.abs((r.latitudeDelta ?? prev.latitudeDelta) - prev.latitudeDelta) < 1e-4 &&
        Math.abs((r.longitudeDelta ?? prev.longitudeDelta) - prev.longitudeDelta) < 1e-4;
      return same ? prev : r;
    });
  }, []);

  const fitToCoordinates = useCallback((coordinates: { latitude: number; longitude: number }[], padding = 0.15) => {
    if (coordinates.length === 0) return;
    if (coordinates.length === 1) {
      setRegion({
        latitude: coordinates[0].latitude,
        longitude: coordinates[0].longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      });
      return;
    }

    const lats = coordinates.map(c => c.latitude);
    const lngs = coordinates.map(c => c.longitude);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);

    const latCenter = (minLat + maxLat) / 2;
    const lngCenter = (minLng + maxLng) / 2;
    const latDelta = (maxLat - minLat) * (1 + padding * 2);
    const lngDelta = (maxLng - minLng) * (1 + padding * 2);

    setRegion({
      latitude: latCenter,
      longitude: lngCenter,
      latitudeDelta: Math.max(latDelta, 0.005),
      longitudeDelta: Math.max(lngDelta, 0.005),
    });
  }, []);

  return { region, setRegion, syncRegion, animateToRegion, fitToCoordinates };
}