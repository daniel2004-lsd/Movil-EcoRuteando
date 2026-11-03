import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Marker, Polyline } from '../../../components/maps/MapEngine';
import { decodePolyline } from '../../../services/maps/googleMaps';
import { useLanguage } from '../../../shared/store/LanguageContext';

interface Props {
  route: any;
  routeAlts: any[];
  onSelectRoute: (index: number) => void;
}

export function RouteAlternativesOverlay({ route, routeAlts, onSelectRoute }: Props) {
  const { t } = useLanguage();

  if (!route?.polyline || !routeAlts || routeAlts.length === 0) {
    return null;
  }

  return (
    <>
      {routeAlts.map((alt, ai) => {
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
                onPress={() => onSelectRoute(ai + 1)}
                activeOpacity={0.85}
              >
                <Text style={styles.altPillText}>{label}</Text>
              </TouchableOpacity>
            </Marker>
          </React.Fragment>
        );
      })}
    </>
  );
}

const styles = StyleSheet.create({
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
});
