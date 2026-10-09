import React from 'react';
import { ScrollView, TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { POI_CATEGORIES, type PoiCategory } from '../../services/maps/googleMaps';
import { useLanguage } from '../../shared/store/LanguageContext';

interface Props {
  active: string | null;
  onSelect: (category: PoiCategory | null) => void;
}

export function PoiChips({ active, onSelect }: Props) {
  const { t } = useLanguage();
  return (
    <View style={styles.wrap}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        {POI_CATEGORIES.map(category => {
          const on = active === category.id;
          return (
            <TouchableOpacity
              key={category.id}
              style={[styles.chip, on && { backgroundColor: category.color, borderColor: category.color }]}
              onPress={() => onSelect(on ? null : category)}
              activeOpacity={0.85}
            >
              <Ionicons
                name={category.icon as any}
                size={15}
                color={on ? '#ffffff' : '#5f6368'}
              />
              <Text style={[styles.label, on && styles.labelOn]}>{t(`poiCats.${category.id}`)}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    paddingVertical: 4,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  row: {
    paddingHorizontal: 6,
    gap: 6,
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
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#5f6368',
  },
  labelOn: {
    color: '#ffffff',
  },
});
