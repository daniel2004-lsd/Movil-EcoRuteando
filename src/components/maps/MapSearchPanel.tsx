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
import { SearchBar } from './SearchBar';
import type { PlaceSuggestion } from '../../services/maps/googleMaps';

interface MapSearchPanelProps {
  expanded: boolean;
  onExpand: () => void;
  onClose: () => void;
  onOpenProfile: () => void;

  originQuery: string;
  onOriginChange: (text: string) => void;
  onOriginFocus: () => void;
  onClearOrigin: () => void;
  originSuggestions: PlaceSuggestion[];
  showOriginSuggestions: boolean;
  onSelectOrigin: (s: PlaceSuggestion) => void;

  destQuery: string;
  onDestChange: (text: string) => void;
  onDestFocus: () => void;
  onClearDest: () => void;
  destSuggestions: PlaceSuggestion[];
  showDestSuggestions: boolean;
  onSelectDest: (s: PlaceSuggestion) => void;

  onLocatePress: () => void;
  onSwap: () => void;
  onDirections?: () => void;
  directionsReady?: boolean;
  loading?: boolean;
}

export function MapSearchPanel({
  expanded,
  onExpand,
  onClose,
  onOpenProfile,
  originQuery,
  onOriginChange,
  onOriginFocus,
  onClearOrigin,
  originSuggestions,
  showOriginSuggestions,
  onSelectOrigin,
  destQuery,
  onDestChange,
  onDestFocus,
  onClearDest,
  destSuggestions,
  showDestSuggestions,
  onSelectDest,
  onLocatePress,
  onSwap,
  onDirections,
  directionsReady = false,
  loading = false,
}: MapSearchPanelProps) {
  const insets = useSafeAreaInsets();

  if (!expanded) {
    return (
      <View style={[styles.wrap, { top: insets.top + 8 }]} pointerEvents="box-none">
        <View style={styles.barRow}>
          <TouchableOpacity
            style={styles.avatar}
            activeOpacity={0.8}
            onPress={onOpenProfile}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          >
            <Ionicons name="person" size={18} color="#57a83a" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.bar}
            activeOpacity={0.85}
            onPress={onExpand}
          >
            <Ionicons name="search" size={20} color="#5f6368" />
            <Text style={styles.barText} numberOfLines={1}>
              ¿A dónde quieres ir?
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const showOriginList = showOriginSuggestions && originSuggestions.length > 0 && !destQuery;
  const showDestList = showDestSuggestions && destSuggestions.length > 0 && destQuery.length >= 2;

  return (
    <View style={[styles.panel, { top: insets.top + 8 }]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.closeBtn}
          onPress={onClose}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="arrow-back" size={20} color="#3c4043" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Planear ruta</Text>
      </View>

      <View style={styles.row}>
        <SearchBar
          plain
          value={originQuery}
          onChangeText={onOriginChange}
          onFocus={onOriginFocus}
          onClear={onClearOrigin}
          placeholder="¿Dónde estás?"
          leftIcon="ellipse-outline"
          rightIcon="locate"
          onRightIconPress={onLocatePress}
        />
        <TouchableOpacity style={styles.swapBtn} onPress={onSwap} activeOpacity={0.8}>
          <Ionicons name="swap-vertical" size={20} color="#57a83a" />
        </TouchableOpacity>
      </View>

      <View style={styles.row}>
        <SearchBar
          plain
          value={destQuery}
          onChangeText={onDestChange}
          onFocus={onDestFocus}
          onClear={onClearDest}
          placeholder="¿A dónde vas?"
          leftIcon="location-outline"
          rightIcon="mic"
        />
      </View>

      <ScrollView
        style={styles.listScroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {showOriginList &&
          originSuggestions.slice(0, 5).map(item => (
            <TouchableOpacity
              key={item.placeId}
              style={styles.suggestionItem}
              onPress={() => onSelectOrigin(item)}
              activeOpacity={0.6}
            >
              <Ionicons name="search-outline" size={18} color="#5f6368" />
              <View style={styles.suggestionTexts}>
                <Text style={styles.suggestionTitle} numberOfLines={1}>
                  {item.mainText}
                </Text>
                <Text style={styles.suggestionSubtitle} numberOfLines={1}>
                  {item.secondaryText}
                </Text>
              </View>
            </TouchableOpacity>
          ))}

        {showDestList &&
          destSuggestions.slice(0, 5).map(item => (
            <TouchableOpacity
              key={item.placeId}
              style={styles.suggestionItem}
              onPress={() => onSelectDest(item)}
              activeOpacity={0.6}
            >
              <Ionicons name="location-outline" size={18} color="#5f6368" />
              <View style={styles.suggestionTexts}>
                <Text style={styles.suggestionTitle} numberOfLines={1}>
                  {item.mainText}
                </Text>
                <Text style={styles.suggestionSubtitle} numberOfLines={1}>
                  {item.secondaryText}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
      </ScrollView>

      {directionsReady && (
        <TouchableOpacity
          style={styles.directionsBtn}
          activeOpacity={0.85}
          onPress={onDirections}
          disabled={loading}
        >
          <Ionicons name="navigate" size={18} color="#fff" />
          <Text style={styles.directionsText}>
            {loading ? 'Calculando…' : 'Cómo llegar'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 12,
    right: 12,
    zIndex: 100,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  bar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 52,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderRadius: 26,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 5,
  },
  barText: {
    flex: 1,
    fontSize: 15,
    color: '#5f6368',
  },
  panel: {
    position: 'absolute',
    left: 12,
    right: 12,
    zIndex: 100,
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 14,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 6,
    paddingHorizontal: 4,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f1f3f4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#202124',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  swapBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#f1f3f4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  listScroll: {
    maxHeight: 230,
    marginTop: 2,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 11,
    paddingHorizontal: 6,
  },
  suggestionTexts: {
    flex: 1,
  },
  suggestionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#202124',
  },
  suggestionSubtitle: {
    fontSize: 12,
    color: '#5f6368',
    marginTop: 1,
  },
  directionsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#77D353',
    borderRadius: 24,
    paddingVertical: 13,
    marginTop: 10,
  },
  directionsText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
});
