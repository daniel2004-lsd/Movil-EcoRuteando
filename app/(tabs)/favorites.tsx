// app/(tabs)/favorites.tsx
import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { spacing, colors } from '../../src/shared/theme';
import { useAuth } from '../../src/shared/store/AuthContext';
import { useLanguage } from '../../src/shared/store/LanguageContext';
import apiClient from '../../src/shared/services/apiClient';

type Favorite = {
  id: string;
  routeName: string;
  originAddress: string;
  destinationAddress: string;
  transportMode: string;
};

export default function FavoritesScreen() {
  const router = useRouter();
  const { auth } = useAuth();
  const { t } = useLanguage();

  const userEmail = auth.email ?? 'usuario@ecoruteando.com';

  const insets = useSafeAreaInsets();

  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFavorites = useCallback(async () => {
    try {
      const { data } = await apiClient.get('/api/favorites');
      const items: any[] = Array.isArray(data) ? data : data?.items ?? [];
      setFavorites(
        items
          .filter(r => r && (r.routeId || r.id))
          .map((r, i) => {
            const name: string = r.routeName || '';
            const parts = name.split(/\s*→\s*/);
            return {
              id: r.routeId ?? r.id ?? `fav-${i}`,
              routeName: name || t('favorites.defaultName'),
              originAddress: r.originAddress ?? (parts[0] || name || t('favorites.origin')),
              destinationAddress:
                r.destinationAddress ?? (parts[parts.length - 1] || t('favorites.destination')),
              transportMode: r.transportMode ?? r.transportType ?? 'car',
            };
          })
      );
    } catch {} finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  return (
    <LinearGradient
      colors={['#1a3d2b', '#2c5f3f', '#4a8f65']}
      style={s.bg}
      start={{ x: 0.1, y: 0 }}
      end={{ x: 0.9, y: 1 }}
    >
      <SafeAreaView
        style={[
          s.safeArea,
          {
            paddingTop: insets.top,
          },
        ]}
      >
        {/* burbujas */}
        <View style={s.circle1} />
        <View style={s.circle2} />
        <View style={s.circle3} />

        <ScrollView
          contentContainerStyle={s.scroll}
          showsVerticalScrollIndicator={false}
        >
          <View style={s.wrapper}>
            {/* Header */}
            <View style={s.headerRow}>
              <TouchableOpacity
                style={s.backBtn}
                onPress={() => router.back()}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons
                  name="arrow-back"
                  size={18}
                  color={colors.ecoMain}
                />
                <Text style={s.backText}>
                  {t('favorites.back')}
                </Text>
              </TouchableOpacity>

              <View style={s.headerTextBlock}>
                <Text style={s.title}>
                  {t('favorites.title')}
                </Text>
                <Text style={s.subtitle}>{userEmail}</Text>
              </View>
            </View>

            {/* Resumen */}
            <View style={s.summaryRow}>
              <View style={s.summaryCard}>
                <Ionicons
                  name="heart-outline"
                  size={18}
                  color="#b91c1c"
                />
                <View style={{ flex: 1 }}>
                  <Text style={s.summaryLabel}>
                    {t('favorites.savedRoutes')}
                  </Text>
                  <Text style={s.summaryNumber}>
                    {loading ? '...' : favorites.length}
                  </Text>
                </View>
              </View>

              <View style={s.summaryCard}>
                <Ionicons
                  name="leaf-outline"
                  size={18}
                  color="#16a34a"
                />
                <View style={{ flex: 1 }}>
                  <Text style={s.summaryLabel}>
                    {t('favorites.ecoFocus')}
                  </Text>
                  <Text style={s.summaryNumber}>
                    {t('favorites.ecoRoutes')}
                  </Text>
                </View>
              </View>
            </View>

            {/* Lista de favoritas */}
            <View style={s.list}>
              {loading ? (
                <ActivityIndicator color="#fff" size="large" style={{ marginTop: 40 }} />
              ) : favorites.length === 0 ? (
                <View style={{ alignItems: 'center', marginTop: 40 }}>
                  <Ionicons name="heart-outline" size={48} color="rgba(255,255,255,0.5)" />
                  <Text style={{ color: 'rgba(255,255,255,0.7)', marginTop: 12, fontFamily: 'Times New Roman' }}>
                    {t('favorites.empty')}
                  </Text>
                </View>
              ) : favorites.map(route => (
                <View key={route.id} style={s.routeCard}>
                  <View style={s.routeHeader}>
                    <View style={s.routeNameBlock}>
                      <Ionicons
                        name="heart"
                        size={18}
                        color="#ef4444"
                      />
                      <Text style={s.routeName}>
                        {route.routeName}
                      </Text>
                    </View>

                    <View style={s.badge}>
                      <Ionicons
                        name="sparkles-outline"
                        size={14}
                        color="#047857"
                      />
                      <Text style={s.badgeText}>
                        {route.transportMode}
                      </Text>
                    </View>
                  </View>

                  <View style={s.routeMainRow}>
                    <View style={s.routeLineCol}>
                      <View style={s.routeDot} />
                      <View style={s.routeLine} />
                      <View
                        style={[
                          s.routeDot,
                          { backgroundColor: '#0f172a' },
                        ]}
                      />
                    </View>

                    <View style={s.routeTextCol}>
                      <Text style={s.routeLabel}>
                        {t('favorites.origin')}
                      </Text>

                      <Text style={s.routeValue}>
                        {route.originAddress}
                      </Text>

                      <Text
                        style={[
                          s.routeLabel,
                          { marginTop: 6 },
                        ]}
                      >
                        {t('favorites.destination')}
                      </Text>

                      <Text style={s.routeValue}>
                        {route.destinationAddress}
                      </Text>
                    </View>
                  </View>

                  <View style={s.metaRow}>
                    <View style={s.chip}>
                      <Ionicons
                        name={route.transportMode?.toLowerCase() === 'walking' ? 'walk-outline' : 'car-outline'}
                        size={14}
                        color="#065f46"
                      />
                      <Text style={s.chipText}>
                        {route.transportMode}
                      </Text>
                    </View>

                    <View style={s.co2Pill}>
                      <Ionicons
                        name="cloud-outline"
                        size={14}
                        color="#16a34a"
                      />
                      <Text style={s.co2Text}>
                        {'eco'}
                      </Text>
                    </View>
                  </View>

                  <View style={s.actionsRow}>
                    <TouchableOpacity
                      style={s.secondaryBtn}
                      onPress={() => {
                        // abrir detalle más adelante
                      }}
                    >
                      <Ionicons
                        name="information-circle-outline"
                        size={14}
                        color="#047857"
                      />

                      <Text style={s.secondaryBtnText}>
                        {t('favorites.detailsButton')}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={s.primaryBtn}
                      onPress={() => {
                        // usar esta ruta más adelante
                      }}
                    >
                      <Text style={s.primaryBtnText}>
                        {t('favorites.useRouteButton')}
                      </Text>

                      <Ionicons
                        name="arrow-forward"
                        size={14}
                        color="#ffffff"
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}
const s = StyleSheet.create({
  bg: {
    flex: 1,
    paddingTop: Platform.OS === 'web' ? 24 : 0,
  },
  safeArea: {
    flex: 1,
  },
  circle1: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(94,168,122,0.18)',
    top: -80,
    right: -60,
  },
  circle2: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(44,95,63,0.25)',
    bottom: -60,
    left: -60,
  },
  circle3: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(168,217,188,0.18)',
    top: 220,
    left: 10,
  },
  scroll: {
    flexGrow: 1,
    paddingTop: spacing.sm,     // igual que history / plan-route
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.md,
  },
  wrapper: {
    width: '100%',
    maxWidth: 900,
    alignSelf: 'center',
  },

  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    justifyContent: 'space-between',
    marginTop: -4, // lo sube un pelito
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(15,23,42,0.25)',
  },
  backText: {
    fontFamily: 'Times New Roman',
    fontSize: 13,
    color: colors.ecoMain,
  },
  headerTextBlock: {
    flex: 1,
    marginLeft: spacing.md,
  },
  title: {
    fontFamily: 'Times New Roman',
    fontSize: 22,
    color: '#f9fafb',
    textAlign: 'right',
  },
  subtitle: {
    fontFamily: 'Times New Roman',
    fontSize: 12,
    color: 'rgba(226,232,240,0.9)',
    textAlign: 'right',
  },

  summaryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginVertical: spacing.md,
  },
  summaryCard: {
    flex: 1,
    minWidth: 150,
    borderRadius: 18,
    backgroundColor: 'rgba(249,250,251,0.96)',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.45)',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  summaryLabel: {
    fontFamily: 'Times New Roman',
    fontSize: 11,
    color: '#047857',
  },
  summaryNumber: {
    fontFamily: 'Times New Roman',
    fontSize: 18,
    color: '#022c22',
  },

  list: {
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  routeCard: {
    borderRadius: 20,
    padding: spacing.md,
    backgroundColor: 'rgba(249,250,251,0.98)',
    borderWidth: 1,
    borderColor: 'rgba(209,213,219,0.8)',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  routeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  routeNameBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 1,
  },
  routeName: {
    fontFamily: 'Times New Roman',
    fontSize: 15,
    color: '#111827',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: '#dcfce7',
  },
  badgeText: {
    fontFamily: 'Times New Roman',
    fontSize: 11,
    color: '#047857',
  },

  routeMainRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  routeLineCol: {
    alignItems: 'center',
    paddingTop: 2,
  },
  routeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#16a34a',
  },
  routeLine: {
    width: 2,
    flex: 1,
    marginVertical: 4,
    backgroundColor: 'rgba(148,163,184,0.8)',
  },
  routeTextCol: {
    flex: 1,
  },
  routeLabel: {
    fontFamily: 'Times New Roman',
    fontSize: 11,
    color: '#6b7280',
  },
  routeValue: {
    fontFamily: 'Times New Roman',
    fontSize: 13,
    color: '#111827',
  },

  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#bbf7d0',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  chipText: {
    fontFamily: 'Times New Roman',
    fontSize: 11,
    color: '#065f46',
  },
  co2Pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: 'rgba(240,253,250,0.9)',
    borderWidth: 1,
    borderColor: 'rgba(45,212,191,0.7)',
  },
  co2Text: {
    fontFamily: 'Times New Roman',
    fontSize: 11,
    color: '#047857',
  },

  actionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: spacing.sm,
    flexWrap: 'wrap',
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    backgroundColor: colors.ecoMain,
    paddingVertical: 7,
    paddingHorizontal: 14,
    flexShrink: 0,
  },
  primaryBtnText: {
    fontFamily: 'Times New Roman',
    fontSize: 12,
    color: '#ffffff',
  },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 999,
    paddingVertical: 7,
    paddingHorizontal: 12,
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
    flexShrink: 0,
  },
  secondaryBtnText: {
    fontFamily: 'Times New Roman',
    fontSize: 12,
    color: '#047857',
  },
});
