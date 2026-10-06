import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TRANSPORT_MODES } from '../../services/maps/googleMaps';

export interface ExplorePlace {
  name: string;
  lat: number;
  lng: number;
}

export type ExploreAction = 'plan' | 'favorites' | 'history';

interface ExploreSheetProps {
  activeMode: string;
  onModePress: (id: string) => void;
  onAction: (key: ExploreAction) => void;
  onPlaceSelect: (place: ExplorePlace) => void;
  places: ExplorePlace[];
}

const ACTIONS: { key: ExploreAction; label: string; icon: string }[] = [
  { key: 'plan', label: 'Planificar ruta', icon: 'navigate-outline' },
  { key: 'favorites', label: 'Favoritos', icon: 'heart-outline' },
  { key: 'history', label: 'Historial', icon: 'time-outline' },
];

export function ExploreSheet({
  activeMode,
  onModePress,
  onAction,
  onPlaceSelect,
  places,
}: ExploreSheetProps) {
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 16 }]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.grabber} />
      <Text style={styles.title}>Explora EcoRuteando</Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
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
              <Text style={[styles.modeLabel, active && { color: '#fff' }]}>{m.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

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
              {a.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Destinos populares</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.placesRow}
      >
        {places.map((p, idx) => (
          <TouchableOpacity
            key={idx}
            style={styles.placeChip}
            activeOpacity={0.7}
            onPress={() => onPlaceSelect(p)}
          >
            <Ionicons name="location-outline" size={14} color="#57a83a" />
            <Text style={styles.placeChipText}>{p.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </ScrollView>
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
    paddingRight: 8,
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
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#5f6368',
    marginTop: 18,
    marginBottom: 8,
  },
  placesRow: {
    gap: 8,
    paddingRight: 8,
  },
  placeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  placeChipText: {
    fontSize: 13,
    color: '#3c4043',
    fontWeight: '500',
  },
});
