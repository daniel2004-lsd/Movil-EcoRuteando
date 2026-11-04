import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
} from 'react-native';
import { ScrollView as GHScrollView } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TRANSPORT_MODES } from '../../services/maps/googleMaps';
import { useLanguage } from '../../shared/store/LanguageContext';

export interface ExplorePlace {
  name: string;
  lat: number;
  lng: number;
  photoUrl?: string;
  category?: string;
}

export type ExploreAction = 'plan' | 'favorites' | 'history';

interface ExploreSheetProps {
  activeMode: string;
  onModePress: (id: string) => void;
  onAction: (key: ExploreAction) => void;
  onPlaceSelect: (place: ExplorePlace) => void;
  places: ExplorePlace[];
}

export const HUILA_POPULAR_PLACES: ExplorePlace[] = [
  {
    name: 'Malecón del Río Magdalena',
    lat: 2.9279889,
    lng: -75.2956024,
    photoUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=500&q=80',
    category: 'Neiva · Paseo turístico',
  },
  {
    name: 'Monumento a La Gaitana',
    lat: 2.930467,
    lng: -75.298124,
    photoUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=500&q=80',
    category: 'Neiva · Escultura histórica',
  },
  {
    name: 'Desierto de la Tatacoa',
    lat: 3.2333,
    lng: -75.1667,
    photoUrl: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=500&q=80',
    category: 'Villavieja · Ecoturismo',
  },
  {
    name: 'Parque Santander y Catedral',
    lat: 2.9262767,
    lng: -75.2892111,
    photoUrl: 'https://images.unsplash.com/photo-1548625361-195973b069fa?w=500&q=80',
    category: 'Neiva · Centro histórico',
  },
  {
    name: 'Torre Mirador del Mohán',
    lat: 2.9272137,
    lng: -75.2949786,
    photoUrl: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=500&q=80',
    category: 'Neiva · Mirador del río',
  },
  {
    name: 'Edificio Nacional de Neiva',
    lat: 2.9266362,
    lng: -75.2869439,
    photoUrl: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=500&q=80',
    category: 'Neiva · Patrimonio cultural',
  },
  {
    name: 'Termales de Rivera',
    lat: 2.7756,
    lng: -75.2572,
    photoUrl: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=500&q=80',
    category: 'Rivera · Balneario termal',
  },
  {
    name: 'Parque San Agustín',
    lat: 1.8883,
    lng: -76.2972,
    photoUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=500&q=80',
    category: 'San Agustín · Arqueología',
  },
  {
    name: 'Represa de Betania',
    lat: 2.6933,
    lng: -75.4383,
    photoUrl: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=500&q=80',
    category: 'Yaguará · Embalse náutico',
  },
  {
    name: 'Estrecho del Magdalena',
    lat: 1.8906,
    lng: -76.3217,
    photoUrl: 'https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?w=500&q=80',
    category: 'San Agustín · Cañón natural',
  },
];

const ACTIONS: { key: ExploreAction; labelKey: string; icon: string }[] = [
  { key: 'plan', labelKey: 'home.modPlan', icon: 'navigate-outline' },
  { key: 'history', labelKey: 'tabs.history', icon: 'time-outline' },
];

function getDestinationPhoto(p: ExplorePlace): string {
  if (
    p.photoUrl &&
    p.photoUrl.startsWith('http') &&
    !p.photoUrl.includes('generic_business-71.png') &&
    !p.photoUrl.includes('lodging-71.png') &&
    !p.photoUrl.includes('pinlet')
  ) {
    return p.photoUrl;
  }
  const name = (p.name || '').toLowerCase();
  if (name.includes('gaitana')) {
    return 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=500&q=80';
  }
  if (name.includes('tatacoa')) {
    return 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=500&q=80';
  }
  if (name.includes('malecón') || name.includes('malecon') || name.includes('magdalena')) {
    return 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=500&q=80';
  }
  if (name.includes('parque') || name.includes('santander') || name.includes('catedral')) {
    return 'https://images.unsplash.com/photo-1548625361-195973b069fa?w=500&q=80';
  }
  if (name.includes('mohán') || name.includes('mohan')) {
    return 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=500&q=80';
  }
  if (name.includes('edificio') || name.includes('nacional')) {
    return 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=500&q=80';
  }
  if (name.includes('termales') || name.includes('rivera')) {
    return 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=500&q=80';
  }
  if (name.includes('agustín') || name.includes('agustin')) {
    return 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=500&q=80';
  }
  if (name.includes('betania')) {
    return 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=500&q=80';
  }
  if (name.includes('estrecho')) {
    return 'https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?w=500&q=80';
  }
  if (name.includes('hotel') || name.includes('milán')) {
    return 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=500&q=80';
  }
  return 'https://images.unsplash.com/photo-1477959858617-67f30bc75b82?w=500&q=80';
}

export function ExploreSheet({
  activeMode,
  onModePress,
  onAction,
  onPlaceSelect,
  places,
}: ExploreSheetProps) {
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const displayPlaces = places && places.length > 0 ? places : HUILA_POPULAR_PLACES;

  return (
    <GHScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      nestedScrollEnabled={true}
    >
      <View style={styles.grabber} />
      <Text style={styles.title}>{t('map.explore')}</Text>

      <GHScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        nestedScrollEnabled={true}
        directionalLockEnabled={true}
        contentContainerStyle={styles.modesRow}
      >
        {TRANSPORT_MODES.map(m => {
          const active = activeMode === m.id;
          return (
            <TouchableOpacity
              key={m.id}
              activeOpacity={0.8}
              onPress={() => onModePress(m.id)}
              style={[styles.modeChip, active && { backgroundColor: m.color, borderColor: m.color }]}
            >
              <Ionicons
                name={m.icon as any}
                size={16}
                color={active ? '#fff' : '#5f6368'}
              />
              <Text style={[styles.modeLabel, active && { color: '#fff' }]}>{t(`modes.${m.id}`)}</Text>
            </TouchableOpacity>
          );
        })}
      </GHScrollView>

      <View style={styles.actionsRow}>
        {ACTIONS.map(a => (
          <TouchableOpacity
            key={a.key}
            style={styles.actionItem}
            activeOpacity={0.7}
            onPress={() => onAction(a.key)}
          >
            <View style={styles.actionIcon}>
              <Ionicons name={a.icon as any} size={22} color="#57a83a" />
            </View>
            <Text style={styles.actionLabel} numberOfLines={2}>
              {t(a.labelKey)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>Destinos populares del Huila</Text>
        <Text style={styles.sectionSubtitle}>{displayPlaces.length} lugares</Text>
      </View>

      <GHScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        nestedScrollEnabled={true}
        directionalLockEnabled={true}
        contentContainerStyle={styles.placesRow}
      >
        {displayPlaces.map((p, idx) => (
          <TouchableOpacity
            key={idx}
            style={styles.placeCard}
            activeOpacity={0.8}
            onPress={() => onPlaceSelect(p)}
          >
            <Image
              source={{ uri: getDestinationPhoto(p) }}
              style={styles.placeCardImage}
              resizeMode="cover"
            />
            <View style={styles.placeCardBody}>
              <Text style={styles.placeCardName} numberOfLines={1}>
                {p.name}
              </Text>
              <View style={styles.placeCardMeta}>
                <Ionicons name="location-sharp" size={11} color="#57a83a" />
                <Text style={styles.placeCardCategory} numberOfLines={1}>
                  {p.category || 'Huila, Colombia'}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </GHScrollView>
    </GHScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  grabber: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#dadce0',
    marginBottom: 12,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: '#202124',
    marginBottom: 12,
  },
  modesRow: {
    gap: 8,
    paddingRight: 24,
    paddingBottom: 4,
  },
  modeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    backgroundColor: '#f1f3f4',
    borderWidth: 1,
    borderColor: '#e8eaed',
  },
  modeLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#3c4043',
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  actionItem: {
    alignItems: 'center',
    width: '24%',
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#eaf7e4',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  actionLabel: {
    fontSize: 11,
    color: '#5f6368',
    textAlign: 'center',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 18,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#202124',
  },
  sectionSubtitle: {
    fontSize: 11,
    fontWeight: '500',
    color: '#5f6368',
  },
  placesRow: {
    gap: 12,
    paddingRight: 40,
    paddingBottom: 16,
  },
  placeCard: {
    width: 152,
    borderRadius: 14,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e8eaed',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  placeCardImage: {
    width: '100%',
    height: 82,
    backgroundColor: '#e8eaed',
  },
  placeCardBody: {
    paddingHorizontal: 8,
    paddingVertical: 7,
  },
  placeCardName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#202124',
  },
  placeCardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 3,
  },
  placeCardCategory: {
    fontSize: 10,
    color: '#5f6368',
  },
});
