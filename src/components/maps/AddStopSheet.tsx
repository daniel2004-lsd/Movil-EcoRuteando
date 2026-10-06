import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  POI_CATEGORIES,
  searchPlaces,
  getPlaceDetails,
  type PoiCategory,
  type NearbyPlace,
  type PlaceSuggestion,
} from '../../services/maps/googleMaps';

const CATEGORY_IDS = ['restaurant', 'cafe', 'gas', 'supermarket', 'pharmacy'];
const CATEGORIES = POI_CATEGORIES.filter(c => CATEGORY_IDS.includes(c.id));

interface Props {
  origin: { latitude: number; longitude: number } | null;
  destination: { latitude: number; longitude: number } | null;
  mode: string;
  activeCategoryId: string | null;
  places: NearbyPlace[];
  loading: boolean;
  searchCenter: { latitude: number; longitude: number };
  onSelectCategory: (category: PoiCategory) => void;
  onSelectPlace: (place: NearbyPlace) => void;
  onAddPlace: (place: NearbyPlace) => void;
  onClose: () => void;
}

function haversineKm(
  a: { latitude: number; longitude: number },
  b: { latitude: number; longitude: number }
): number {
  const R = 6371;
  const dLat = ((b.latitude - a.latitude) * Math.PI) / 180;
  const dLng = ((b.longitude - a.longitude) * Math.PI) / 180;
  const la1 = (a.latitude * Math.PI) / 180;
  const la2 = (b.latitude * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

import { useLanguage } from '../../shared/store/LanguageContext';

export function AddStopSheet({
  origin,
  destination,
  mode,
  activeCategoryId,
  places,
  loading,
  searchCenter,
  onSelectCategory,
  onSelectPlace,
  onAddPlace,
  onClose,
}: Props) {
  const { t } = useLanguage();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PlaceSuggestion[]>([]);
  const [searching, setSearching] = useState(false);
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const found = await searchPlaces(q, searchCenter);
        setResults(found.slice(0, 5));
      } finally {
        setSearching(false);
      }
    }, 320);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, searchCenter]);

  const pickSearchResult = async (s: PlaceSuggestion) => {
    if (resolvingId) return;
    setResolvingId(s.placeId);
    try {
      const detail = await getPlaceDetails(s.placeId);
      if (detail) {
        onAddPlace({
          placeId: detail.placeId,
          name: detail.name,
          latitude: detail.latitude,
          longitude: detail.longitude,
          vicinity: detail.formattedAddress,
        });
        setQuery('');
        setResults([]);
      }
    } finally {
      setResolvingId(null);
    }
  };

  const activeCategory = CATEGORIES.find(c => c.id === activeCategoryId) ?? null;

  const detourInfo = (p: NearbyPlace): { text: string; onRoute: boolean } | null => {
    if (!origin || !destination) return null;
    const direct = haversineKm(origin, destination);
    const via =
      haversineKm(origin, p) + haversineKm(p, destination);
    const extraKm = Math.max(0, via - direct) * 1.3;
    if (extraKm < 0.05) return { text: t('addStop.onRoute'), onRoute: true };
    const speed = mode === 'walking' ? 4.5 : 22;
    const min = Math.max(1, Math.round((extraKm / speed) * 60));
    return { text: t('addStop.extraMin').replace('{n}', String(min)), onRoute: false };
  };

  const sectionTitle = activeCategory
    ? ['restaurant', 'cafe'].includes(activeCategory.id)
      ? t('addStop.bestOf').replace('{name}', t(`poiCats.${activeCategory.id}`).toLowerCase())
      : t(`poiCats.${activeCategory.id}`)
    : t('poi.distance.nearRoute');

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.headerText}>
          <Text style={styles.title}>{t('addStop.title')}</Text>
          <Text style={styles.subtitle}>{t('addStop.subtitle')}</Text>
        </View>
        <TouchableOpacity
          onPress={onClose}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={styles.closeBtn}
        >
          <Ionicons name="close" size={20} color="#5f6368" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchWrap}>
        <Ionicons name="search" size={18} color="#5f6368" />
        <TextInput
          style={styles.searchInput}
          placeholder={t('addStop.searchPlaceholder')}
          placeholderTextColor="#9aa0a6"
          value={query}
          onChangeText={setQuery}
          returnKeyType="search"
        />
        {searching ? (
          <ActivityIndicator size="small" color="#5f6368" />
        ) : query.length > 0 ? (
          <TouchableOpacity
            onPress={() => {
              setQuery('');
              setResults([]);
            }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="close-circle" size={18} color="#9aa0a6" />
          </TouchableOpacity>
        ) : null}
      </View>

      {results.length > 0 && (
        <View style={styles.resultsBox}>
          {results.map(r => (
            <TouchableOpacity
              key={r.placeId}
              style={styles.resultRow}
              onPress={() => pickSearchResult(r)}
              disabled={!!resolvingId}
              activeOpacity={0.7}
            >
              {resolvingId === r.placeId ? (
                <ActivityIndicator size="small" color="#16a34a" />
              ) : (
                <Ionicons name="location-outline" size={16} color="#5f6368" />
              )}
              <View style={styles.resultTexts}>
                <Text style={styles.resultMain} numberOfLines={1}>
                  {r.mainText}
                </Text>
                {r.secondaryText ? (
                  <Text style={styles.resultSecondary} numberOfLines={1}>
                    {r.secondaryText}
                  </Text>
                ) : null}
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <View style={styles.chipsRowWrap}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsRow}
        >
          {CATEGORIES.map(c => {
            const on = activeCategoryId === c.id;
            return (
              <TouchableOpacity
                key={c.id}
                style={[styles.chip, on && { backgroundColor: c.color, borderColor: c.color }]}
                onPress={() => onSelectCategory(c)}
                activeOpacity={0.85}
              >
                <Ionicons name={c.icon as any} size={15} color={on ? '#fff' : '#5f6368'} />
                <Text style={[styles.chipLabel, on && styles.chipLabelOn]}>{t(`poiCats.${c.id}`)}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <Text style={styles.sectionTitle}>{sectionTitle}</Text>

      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="small" color="#16a34a" />
        </View>
      ) : places.length === 0 ? (
        <View style={styles.centerBox}>
          <Ionicons name="storefront-outline" size={22} color="#9aa0a6" />
          <Text style={styles.emptyText}>
            {activeCategory ? t('addStop.empty') : t('addStop.hint')}
          </Text>
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.cardsRow}
        >
          {places.map(p => {
            const detour = detourInfo(p);
            const cat = activeCategory;
            return (
              <TouchableOpacity
                key={p.placeId}
                style={styles.card}
                activeOpacity={0.85}
                onPress={() => {
                  onSelectPlace(p);
                  onAddPlace(p);
                }}
              >
                <View style={[styles.cardThumb, { backgroundColor: cat?.color ?? '#16a34a' }]}>
                  <Ionicons name={(cat?.icon ?? 'pin') as any} size={30} color="#fff" />
                  {detour && (
                    <View
                      style={[
                        styles.detourBadge,
                        detour.onRoute && { backgroundColor: '#e6f4ea' },
                      ]}
                    >
                      <Text
                        style={[
                          styles.detourText,
                          detour.onRoute && { color: '#137333' },
                        ]}
                      >
                        {detour.text}
                      </Text>
                    </View>
                  )}
                </View>
                <Text style={styles.cardName} numberOfLines={2}>
                  {p.name}
                </Text>
                {typeof p.rating === 'number' && (
                  <View style={styles.ratingRow}>
                    <Ionicons name="star" size={12} color="#fbbc04" />
                    <Text style={styles.ratingText}>
                      {p.rating.toFixed(1)}
                      {p.userRatingCount ? ` (${p.userRatingCount})` : ''}
                    </Text>
                  </View>
                )}
                <View style={styles.addRow}>
                  <Ionicons name="add-circle" size={14} color="#16a34a" />
                  <Text style={styles.addText}>{t('addStop.add')}</Text>
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
    paddingTop: 4,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontFamily: 'Times New Roman',
    fontSize: 19,
    fontWeight: '700',
    color: '#0f172a',
  },
  subtitle: {
    fontFamily: 'Times New Roman',
    fontSize: 13,
    color: '#5f6368',
    marginTop: 2,
  },
  closeBtn: {
    padding: 4,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#f1f3f4',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    marginTop: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#0f172a',
    paddingVertical: 0,
  },
  resultsBox: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    overflow: 'hidden',
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  resultTexts: {
    flex: 1,
  },
  resultMain: {
    fontSize: 14,
    color: '#0f172a',
    fontFamily: 'Times New Roman',
  },
  resultSecondary: {
    fontSize: 12,
    color: '#80868b',
    fontFamily: 'Times New Roman',
  },
  chipsRowWrap: {
    marginTop: 12,
  },
  chipsRow: {
    gap: 6,
    paddingRight: 8,
    alignItems: 'center',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#f1f3f4',
    borderColor: '#e0e0e0',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 18,
  },
  chipLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#5f6368',
    fontFamily: 'Times New Roman',
  },
  chipLabelOn: {
    color: '#fff',
  },
  sectionTitle: {
    fontFamily: 'Times New Roman',
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    marginTop: 16,
    marginBottom: 8,
  },
  centerBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    gap: 8,
  },
  emptyText: {
    fontSize: 13,
    color: '#80868b',
    fontFamily: 'Times New Roman',
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  cardsRow: {
    gap: 10,
    paddingRight: 8,
    paddingBottom: 8,
  },
  card: {
    width: 150,
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 8,
  },
  cardThumb: {
    height: 84,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  detourBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  detourText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1a73e8',
    fontFamily: 'Times New Roman',
  },
  cardName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0f172a',
    fontFamily: 'Times New Roman',
    marginTop: 8,
    minHeight: 34,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  ratingText: {
    fontSize: 12,
    color: '#5f6368',
    fontFamily: 'Times New Roman',
  },
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  addText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#16a34a',
    fontFamily: 'Times New Roman',
  },
});
