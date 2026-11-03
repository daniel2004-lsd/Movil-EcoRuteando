import { useState, useRef, useCallback } from 'react';
import {
  getNearbyPlaces,
  type NearbyPlace,
  type PoiCategory,
} from '../../../services/maps/googleMaps';
import {
  HUILA_POPULAR_PLACES,
  type ExplorePlace,
} from '../../../components/maps/ExploreSheet';

interface PoiManagerOptions {
  getCenterCoords: () => { latitude: number; longitude: number };
  pickingStop?: boolean;
}

export function useMapPoiManager({ getCenterCoords, pickingStop = false }: PoiManagerOptions) {
  const [activePoiCategory, setActivePoiCategory] = useState<PoiCategory | null>(null);
  const [poiPlaces, setPoiPlaces] = useState<NearbyPlace[]>([]);
  const [popularPlaces, setPopularPlaces] = useState<ExplorePlace[]>(HUILA_POPULAR_PLACES);
  const [loadingPois, setLoadingPois] = useState(false);
  const [selectedPoiId, setSelectedPoiId] = useState<string | null>(null);
  const [selectedMapPoi, setSelectedMapPoi] = useState<NearbyPlace | null>(null);
  const [showPoiSheet, setShowPoiSheet] = useState(false);

  const poiRequestIdRef = useRef(0);

  const closePoiSheet = useCallback(() => {
    poiRequestIdRef.current++;
    setActivePoiCategory(null);
    setPoiPlaces([]);
    setSelectedPoiId(null);
    setShowPoiSheet(false);
  }, []);

  const handlePoiCategory = useCallback(
    async (
      category: PoiCategory | null,
      centerOverride?: { latitude: number; longitude: number }
    ) => {
      if (!category) {
        closePoiSheet();
        return;
      }
      const currentReqId = ++poiRequestIdRef.current;
      setActivePoiCategory(category);
      setSelectedPoiId(null);
      // En modo "elegir parada" solo se muestran los markers en el mapa.
      setShowPoiSheet(!pickingStop);
      setLoadingPois(true);
      try {
        const center = centerOverride ?? getCenterCoords();
        const places = await getNearbyPlaces(center, category.placeType, 5000);
        if (poiRequestIdRef.current !== currentReqId) {
          return;
        }
        setPoiPlaces(places);
        console.log('[POI]', category.id, '→', places.length, 'lugares');
      } catch (err) {
        if (poiRequestIdRef.current === currentReqId) {
          console.warn('Error fetching POIs:', err);
          setPoiPlaces([]);
        }
      } finally {
        if (poiRequestIdRef.current === currentReqId) {
          setLoadingPois(false);
        }
      }
    },
    [closePoiSheet, getCenterCoords, pickingStop]
  );

  const selectPoiPlace = useCallback(
    (place: NearbyPlace, animateRegion?: (region: any, duration?: number) => void) => {
      setSelectedPoiId(place.placeId);
      animateRegion?.(
        {
          latitude: place.latitude,
          longitude: place.longitude,
          latitudeDelta: 0.006,
          longitudeDelta: 0.006,
        },
        400
      );
    },
    []
  );

  const handlePoiClick = useCallback(
    (e: any, animateRegion?: (region: any, duration?: number) => void) => {
      const poi = e?.nativeEvent;
      if (!poi?.coordinate) return;
      const place: NearbyPlace = {
        placeId: poi.placeId || `poi-${Date.now()}`,
        name: poi.name || 'Punto de interés',
        latitude: poi.coordinate.latitude,
        longitude: poi.coordinate.longitude,
      };
      console.log('[MAPA] POI tocado en el mapa base:', place);
      setSelectedMapPoi(place);
      animateRegion?.(
        {
          latitude: place.latitude,
          longitude: place.longitude,
          latitudeDelta: 0.008,
          longitudeDelta: 0.008,
        },
        350
      );
    },
    []
  );

  const handleMapPress = useCallback(() => {
    if (selectedMapPoi) {
      setSelectedMapPoi(null);
    }
  }, [selectedMapPoi]);

  const loadPopularPlaces = useCallback(async (center: { latitude: number; longitude: number }) => {
    try {
      const places = await getNearbyPlaces(center, 'tourist_attraction', 5000);
      if (places && places.length > 0) {
        setPopularPlaces(
          places.map(p => ({
            name: p.name,
            lat: p.latitude,
            lng: p.longitude,
            photoUrl: p.photoUrl,
          }))
        );
      }
    } catch (err) {
      console.warn('Error loading popular places:', err);
    }
  }, []);

  return {
    activePoiCategory,
    setActivePoiCategory,
    poiPlaces,
    setPoiPlaces,
    popularPlaces,
    setPopularPlaces,
    loadingPois,
    selectedPoiId,
    setSelectedPoiId,
    selectedMapPoi,
    setSelectedMapPoi,
    showPoiSheet,
    setShowPoiSheet,
    closePoiSheet,
    handlePoiCategory,
    selectPoiPlace,
    handlePoiClick,
    handleMapPress,
    loadPopularPlaces,
  };
}
