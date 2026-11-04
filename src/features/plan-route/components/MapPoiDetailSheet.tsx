import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NearbyPlace } from '../../../services/maps/googleMaps';
import { useLanguage } from '../../../shared/store/LanguageContext';

interface Props {
  place: NearbyPlace;
  onClose: () => void;
  onRoute: (place: NearbyPlace) => void;
  onStartTrip: (place: NearbyPlace) => void;
}

export function MapPoiDetailSheet({ place, onClose, onRoute, onStartTrip }: Props) {
  const { t } = useLanguage();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.iconWrap}>
          <Ionicons name="location" size={20} color="#10b981" />
        </View>
        <View style={styles.info}>
          <Text style={styles.title} numberOfLines={1}>
            {place.name}
          </Text>
          <Text style={styles.subtitle} numberOfLines={1}>
            {t('planRoute.mapPoiSelected') || 'Punto seleccionado en el mapa'}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.closeBtn}
          onPress={onClose}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityRole="button"
          accessibilityLabel={t('common.close') || 'Cerrar'}
          accessibilityHint="Cierra los detalles del punto de interés"
        >
          <Ionicons name="close" size={22} color="#5f6368" />
        </TouchableOpacity>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionBtn, styles.routeBtn]}
          onPress={() => onRoute(place)}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel={`${t('planRoute.howToGet') || 'Cómo llegar'} a ${place.name}`}
          accessibilityHint="Calcula la ruta hacia este punto de interés y la dibuja en el mapa"
        >
          <Ionicons name="navigate-outline" size={16} color="#10b981" />
          <Text style={styles.routeBtnText} numberOfLines={1}>
            {t('planRoute.howToGet') || 'Cómo llegar'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, styles.tripBtn]}
          onPress={() => onStartTrip(place)}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel={`${t('planRoute.startTripBtn') || 'Iniciar viaje'} hacia ${place.name}`}
          accessibilityHint="Crea el viaje en el servidor y activa el seguimiento GPS con navegación"
        >
          <Ionicons name="play" size={16} color="#ffffff" />
          <Text style={styles.tripBtnText} numberOfLines={1}>
            {t('planRoute.startTripBtn') || 'Iniciar viaje'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#ecfdf5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  info: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
  },
  subtitle: {
    fontSize: 12.5,
    color: '#64748b',
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 14,
  },
  routeBtn: {
    borderWidth: 1.5,
    borderColor: '#10b981',
    backgroundColor: '#ffffff',
  },
  routeBtnText: {
    color: '#10b981',
    fontSize: 13.5,
    fontWeight: '700',
  },
  tripBtn: {
    backgroundColor: '#10b981',
  },
  tripBtnText: {
    color: '#ffffff',
    fontSize: 13.5,
    fontWeight: '700',
  },
});
