import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NearbyPlace, PoiCategory } from '../../services/maps/googleMaps';
import { haversineM, formatMeters } from '../../utils/geo';
import { useLanguage } from '../../shared/store/LanguageContext';

interface Props {
  category: PoiCategory;
  places: NearbyPlace[];
  loading: boolean;
  center: { latitude: number; longitude: number };
  selectedPlaceId: string | null;
  onClose: () => void;
  onSelectPlace: (place: NearbyPlace) => void;
  onRoute: (place: NearbyPlace) => void;
  onStartTrip?: (place: NearbyPlace) => void;
}

export function PoiResultsSheet({
  category,
  places,
  loading,
  center,
  selectedPlaceId,
  onClose,
  onSelectPlace,
  onRoute,
  onStartTrip,
}: Props) {
  const { t } = useLanguage();
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={[styles.headerIcon, { backgroundColor: category.color }]}>
          <Ionicons name={category.icon as any} size={16} color="#ffffff" />
        </View>
        <View style={styles.headerTexts}>
          <Text style={styles.headerTitle}>{t(`poiCats.${category.id}`)}</Text>
          <Text style={styles.headerSubtitle}>
            {loading ? t('map.searching') : t('map.resultsCount').replace('{n}', String(places.length))}
          </Text>
        </View>
        <TouchableOpacity
          onPress={onClose}
          hitSlop={10}
          style={styles.closeBtn}
          accessibilityRole="button"
          accessibilityLabel={t('common.close') || 'Cerrar'}
          accessibilityHint="Cierra la lista de resultados de puntos de interés"
        >
          <Ionicons name="close" size={20} color="#5f6368" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingBox} accessibilityRole="alert" accessibilityLiveRegion="polite">
          <ActivityIndicator size="large" color={category.color} />
          <Text style={styles.loadingText}>{t('map.searchingFor').replace('{name}', t(`poiCats.${category.id}`).toLowerCase())}</Text>
        </View>
      ) : places.length === 0 ? (
        <View style={styles.loadingBox} accessibilityRole="text">
          <Ionicons name="search-outline" size={36} color="#9aa0a6" />
          <Text style={styles.loadingText}>{t('map.noResults')}</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          accessibilityRole="list"
          accessibilityLabel="Resultados de puntos de interés cercanos"
        >
          {places.map(place => {
            const distance = haversineM(center, place);
            const selected = selectedPlaceId === place.placeId;
            return (
              <TouchableOpacity
                key={place.placeId}
                style={[styles.card, selected && styles.cardSelected]}
                onPress={() => onSelectPlace(place)}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel={`${place.name}, a ${formatMeters(distance)}`}
                accessibilityHint="Selecciona este lugar y enfoca el mapa"
                accessibilityState={{ selected }}
              >
                <View style={styles.cardTop}>
                  {place.photoUrl ? (
                    <Image
                      source={{ uri: place.photoUrl }}
                      style={styles.cardThumb}
                      resizeMode="cover"
                      accessibilityLabel={`Foto de ${place.name}`}
                    />
                  ) : (
                    <View style={[styles.cardIcon, { backgroundColor: `${category.color}1f` }]}>
                      <Ionicons name={category.icon as any} size={18} color={category.color} />
                    </View>
                  )}
                  <View style={styles.cardInfo}>
                    <Text style={styles.cardName} numberOfLines={1}>
                      {place.name}
                    </Text>
                    {!!place.rating && (
                      <View style={styles.ratingRow}>
                        <Ionicons name="star" size={13} color="#fbbc04" />
                        <Text style={styles.ratingText}>
                          {place.rating.toFixed(1)}
                          {!!place.userRatingCount && (
                            <Text style={styles.ratingCount}> ({place.userRatingCount})</Text>
                          )}
                        </Text>
                        {place.openNow !== undefined && (
                          <>
                            <Text style={styles.dot}>·</Text>
                            <Text style={[styles.openText, !place.openNow && styles.closedText]}>
                              {place.openNow ? t('map.open') : t('map.closed')}
                            </Text>
                          </>
                        )}
                        <Text style={styles.dot}>·</Text>
                        <Text style={styles.distanceText}>{formatMeters(distance)}</Text>
                      </View>
                    )}
                    {!!place.vicinity && (
                      <Text style={styles.cardAddress} numberOfLines={1}>
                        {place.vicinity}
                      </Text>
                    )}
                  </View>
                </View>

                {/* Acciones directas simultáneas: 1. Calcular ruta  2. Iniciar viaje */}
                <View style={styles.actionsRow}>
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.calcBtn, { borderColor: category.color }]}
                    onPress={() => onRoute(place)}
                    activeOpacity={0.85}
                    accessibilityRole="button"
                    accessibilityLabel={`${t('planRoute.howToGet') || 'Cómo llegar'} a ${place.name}`}
                    accessibilityHint="Calcula la ruta hacia este lugar"
                  >
                    <Ionicons name="navigate-outline" size={15} color={category.color} />
                    <Text style={[styles.calcBtnText, { color: category.color }]} numberOfLines={1}>
                      {t('planRoute.howToGet') || 'Cómo llegar'}
                    </Text>
                  </TouchableOpacity>

                  {onStartTrip && (
                    <TouchableOpacity
                      style={[styles.actionBtn, styles.startBtn, { backgroundColor: '#10b981' }]}
                      onPress={() => onStartTrip(place)}
                      activeOpacity={0.85}
                      accessibilityRole="button"
                      accessibilityLabel={`${t('planRoute.startTripBtn') || 'Iniciar viaje'} hacia ${place.name}`}
                      accessibilityHint="Inicia el viaje y la navegación hacia este lugar"
                    >
                      <Ionicons name="play" size={15} color="#ffffff" />
                      <Text style={styles.startBtnText} numberOfLines={1}>
                        {t('planRoute.startTripBtn') || 'Iniciar viaje'}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    marginBottom: 8,
  },
  headerIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  headerTexts: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#202124',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#5f6368',
    marginTop: 1,
  },
  closeBtn: {
    padding: 4,
  },
  loadingBox: {
    alignItems: 'center',
    paddingTop: 36,
    paddingBottom: 36,
    gap: 10,
  },
  loadingText: {
    fontSize: 14,
    color: '#5f6368',
  },
  list: {
    paddingBottom: 24,
    gap: 10,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e8eaed',
    padding: 12,
    gap: 10,
  },
  cardSelected: {
    borderColor: '#1a73e8',
    borderWidth: 2,
    backgroundColor: '#f8fbff',
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  cardIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  cardThumb: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#e8eaed',
    marginRight: 10,
  },
  cardInfo: {
    flex: 1,
  },
  cardName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#202124',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  ratingText: {
    fontSize: 12.5,
    color: '#5f6368',
  },
  ratingCount: {
    color: '#9aa0a6',
  },
  dot: {
    color: '#bdc1c6',
  },
  openText: {
    fontSize: 12.5,
    color: '#188038',
    fontWeight: '600',
  },
  closedText: {
    color: '#d93025',
  },
  distanceText: {
    fontSize: 12.5,
    color: '#5f6368',
  },
  cardAddress: {
    fontSize: 12.5,
    color: '#70757a',
    marginTop: 2,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: 18,
  },
  calcBtn: {
    borderWidth: 1,
    backgroundColor: '#ffffff',
  },
  calcBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  startBtn: {
    backgroundColor: '#10b981',
  },
  startBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
});
