// app/(tabs)/favorites.tsx — estilo dashboard (mismo look que Inicio / Mis rutas)
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';

import { useAuth } from '../../src/shared/store/AuthContext';
import { useThemeMode } from '../../src/shared/store/ThemeContext';
import { useLanguage } from '../../src/shared/store/LanguageContext';
import apiClient from '../../src/shared/services/apiClient';
import { AccountRequired } from '../../src/shared/components/ui/AccountRequired';
import { Dialog } from '../../src/shared/components/ui/AppDialog';

type Favorite = {
  id: string;
  routeName: string;
  originAddress: string;
  destinationAddress: string;
  transportMode: string;
  description?: string | null;
  createdAt?: string | null;
  distanceKm?: number | null;
  estimatedTimeMin?: number | null;
  co2SavedKg?: number | null;
  difficultyLevel?: number | null;
  startLat?: number | null;
  startLng?: number | null;
  endLat?: number | null;
  endLng?: number | null;
};

export default function FavoritesScreen() {
  const router = useRouter();
  const { auth } = useAuth();
  const { theme } = useThemeMode();
  const { t, lang } = useLanguage();
  const isDark = theme === 'dark';

  const isGuest = !!auth.guest;

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
              description: r.description ?? null,
              createdAt: r.createdAt ?? null,
              distanceKm: r.distanceKm ?? null,
              estimatedTimeMin: r.estimatedTimeMin ?? null,
              co2SavedKg: r.co2SavedKg ?? null,
              difficultyLevel: r.difficultyLevel ?? null,
              startLat: r.startLat ?? null,
              startLng: r.startLng ?? null,
              endLat: r.endLat ?? null,
              endLng: r.endLng ?? null,
            };
          })
      );
    } catch (e: any) {
      console.warn('[favorites] error:', e?.message, e?.response?.status);
    } finally {
      setLoading(false);
    }
  }, []);

  // Recarga cada vez que entras a la pantalla: así siempre ves los favoritos nuevos.
  useFocusEffect(
    useCallback(() => {
      // Invitado: nunca llamamos a la API (no hay sesión propia que mostrar).
      if (isGuest) {
        setLoading(false);
        return;
      }
      fetchFavorites();
    }, [fetchFavorites, isGuest])
  );

  const removeFavorite = (route: Favorite) => {
    Dialog.alert(
      t('savedRoutes.deleteTitle'),
      t('savedRoutes.deleteMessage'),
      [
        { text: t('savedRoutes.deleteCancel'), style: 'cancel' },
        {
          text: t('savedRoutes.deleteConfirm'),
          style: 'destructive',
          onPress: async () => {
            try {
              await apiClient.delete(`/api/favorites/${route.id}`);
              setFavorites(prev => prev.filter(f => f.id !== route.id));
            } catch (e: any) {
              Dialog.alert(t('savedRoutes.deleteError'), e?.message ?? t('planRoute.unexpectedError'), { tone: 'error' });
            }
          },
        },
      ],
      { tone: 'warning', icon: 'heart' }
    );
  };

  const modeLabel = (mode: string) => t(`savedRoutes.transport.${mode}`);

  const LOCALE_BY_LANG: Record<string, string> = {
    es: 'es-CO',
    en: 'en-US',
    fr: 'fr-FR',
    pt: 'pt-BR',
  };
  const locale = LOCALE_BY_LANG[lang] ?? 'es-CO';

  const difficultyLabel = (level: number) =>
    level <= 2
      ? t('favorites.difficultyEasy')
      : level === 3
        ? t('favorites.difficultyMedium')
        : t('favorites.difficultyHard');

  const fmtDate = (iso?: string | null) => {
    if (!iso) return t('favorites.noData');
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return t('favorites.noData');
    return d.toLocaleDateString(locale, { dateStyle: 'medium' });
  };

  // Abre el mapa (plan-route) con el origen/destino de la ruta favorita.
  const openRouteInMap = (route: Favorite) => {
    if (route.startLat == null || route.startLng == null) {
      Dialog.alert(
        t('favorites.noCoordsTitle'),
        t('favorites.noCoordsMsg'),
        [{ text: t('common.ok') }],
        { tone: 'warning', icon: 'map' }
      );
      return;
    }
    const parts: string[] = [
      `originLat=${encodeURIComponent(String(route.startLat))}`,
      `originLng=${encodeURIComponent(String(route.startLng))}`,
    ];
    if (route.endLat != null && route.endLng != null) {
      parts.push(`destLat=${encodeURIComponent(String(route.endLat))}`);
      parts.push(`destLng=${encodeURIComponent(String(route.endLng))}`);
    }
    if (route.originAddress) {
      parts.push(`originName=${encodeURIComponent(route.originAddress)}`);
    }
    if (route.destinationAddress) {
      parts.push(`destName=${encodeURIComponent(route.destinationAddress)}`);
    }
    if (route.transportMode) {
      parts.push(`mode=${encodeURIComponent(route.transportMode)}`);
    }
    router.push(`/(tabs)/plan-route?${parts.join('&')}`);
  };

  // Detalle completo de la ruta: distancia, tiempo, CO₂ y dificultad.
  const showRouteInfo = (route: Favorite) => {
    const lines: string[] = [];
    if (route.description) {
      lines.push(`${t('favorites.infoDescription')}: ${route.description}`);
    }
    lines.push(`${t('favorites.infoOrigin')}: ${route.originAddress}`);
    lines.push(`${t('favorites.infoDestination')}: ${route.destinationAddress}`);
    lines.push(`${t('favorites.infoMode')}: ${modeLabel(route.transportMode)}`);
    if (route.distanceKm != null) {
      lines.push(
        `${t('favorites.infoDistance')}: ${Number(route.distanceKm).toLocaleString(locale, { maximumFractionDigits: 1 })} ${t('favorites.kmUnit')}`
      );
    }
    if (route.estimatedTimeMin != null) {
      lines.push(
        `${t('favorites.infoDuration')}: ${route.estimatedTimeMin} ${t('favorites.minUnit')}`
      );
    }
    if (route.co2SavedKg != null) {
      lines.push(
        `${t('favorites.infoCo2Saved')}: ${Number(route.co2SavedKg).toFixed(2)} ${t('favorites.kgUnit')}`
      );
    }
    if (route.difficultyLevel != null) {
      lines.push(`${t('favorites.infoDifficulty')}: ${difficultyLabel(route.difficultyLevel)}`);
    }
    lines.push(`${t('favorites.infoSavedOn')}: ${fmtDate(route.createdAt)}`);

    Dialog.alert(
      t('favorites.routeInfoTitle'),
      lines.join('\n'),
      [
        { text: t('favorites.menuViewMap'), onPress: () => openRouteInMap(route) },
        { text: t('common.close'), style: 'cancel' },
      ],
      { tone: 'info', icon: 'information-circle' }
    );
  };

  // Menú de tres puntos: ver en el mapa, información de la ruta o eliminar.
  const showRouteMenu = (route: Favorite) => {
    Dialog.alert(
      route.routeName,
      t('favorites.menuHint'),
      [
        { text: t('favorites.menuViewMap'), onPress: () => openRouteInMap(route) },
        { text: t('favorites.menuRouteInfo'), onPress: () => showRouteInfo(route) },
        {
          text: t('savedRoutes.delete'),
          style: 'destructive',
          onPress: () => removeFavorite(route),
        },
        { text: t('common.cancel'), style: 'cancel' },
      ],
      { tone: 'info', icon: 'ellipsis-horizontal' }
    );
  };

  return (
    <View style={[s.page, isDark && s.pageDark]}>
      {/* Cabecera — igual que el dashboard */}
      <View style={[s.header, isDark && s.headerDark]}>
        <View style={s.headerLeft}>
          <TouchableOpacity
            style={[s.pillBtn, isDark && { backgroundColor: '#162329', borderColor: '#26383D' }]}
            onPress={() => router.back()}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="arrow-back" size={16} color={isDark ? '#e2e8f0' : '#4b5563'} />
          </TouchableOpacity>
          <View style={s.logoBox}>
            <Ionicons name="leaf" size={20} color="#fff" />
          </View>
          <Text style={[s.headerTitle, isDark && { color: '#e2e8f0' }]}>
            {t('favorites.title')}
          </Text>
        </View>

        <TouchableOpacity
          style={[s.pillBtn, isDark && { backgroundColor: '#162329', borderColor: '#26383D' }]}
          onPress={() => router.replace('/(tabs)')}
        >
          <Ionicons name="home-outline" size={16} color={isDark ? '#e2e8f0' : '#4b5563'} />
          <Text style={[s.pillText, isDark && { color: '#e2e8f0' }]}>{t('tabs.home')}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        {isGuest ? (
          <AccountRequired action={t('favorites.title')} />
        ) : (
          <>
            {/* Resumen — misma tarjeta que el saludo del dashboard */}
            <View style={[s.card, isDark && s.cardDark]}>
              <Text style={[s.cardTitle, isDark && { color: '#e2e8f0' }]}>
                {t('favorites.savedRoutes')}
              </Text>
              <Text style={[s.cardSub, isDark && { color: '#94a3b8' }]}>
                {t('favorites.refreshNote')}
              </Text>
              <Text style={[s.tapHint, isDark && { color: '#64748b' }]}>
                {t('favorites.tapHint')}
              </Text>

              <View style={s.statsGrid}>
                <View style={[s.statCard, isDark && s.statCardDark]}>
                  <View style={[s.statIcon, { backgroundColor: 'rgba(244,63,94,0.15)' }]}>
                    <Ionicons name="heart" size={20} color="#f43f5e" />
                  </View>
                  <Text style={[s.statValue, isDark && { color: '#e2e8f0' }]}>
                    {loading ? '...' : favorites.length}
                  </Text>
                  <Text style={[s.statLabel, isDark && { color: '#94a3b8' }]}>
                    {t('favorites.savedRoutes')}
                  </Text>
                </View>

                <View style={[s.statCard, isDark && s.statCardDark]}>
                  <View style={[s.statIcon, { backgroundColor: 'rgba(16,185,129,0.15)' }]}>
                    <Ionicons name="leaf" size={20} color="#10b981" />
                  </View>
                  <Text style={[s.statValue, isDark && { color: '#e2e8f0' }]}>
                    {t('favorites.ecoRoutes')}
                  </Text>
                  <Text style={[s.statLabel, isDark && { color: '#94a3b8' }]}>
                    {t('favorites.ecoFocus')}
                  </Text>
                </View>
              </View>
            </View>

            {/* Lista de favoritas */}
            <View style={s.list}>
              {loading ? (
                <ActivityIndicator color="#10b981" size="large" style={{ marginTop: 40 }} />
              ) : favorites.length === 0 ? (
                <View style={[s.card, isDark && s.cardDark, s.emptyBox]}>
                  <Ionicons name="heart-outline" size={44} color={isDark ? '#4b5563' : '#d1d5db'} />
                  <Text style={[s.emptyText, isDark && { color: '#94a3b8' }]}>
                    {t('favorites.empty')}
                  </Text>
                </View>
              ) : (
                favorites.map(route => (
                  <TouchableOpacity
                    key={route.id}
                    style={[s.routeCard, isDark && s.routeCardDark]}
                    activeOpacity={0.8}
                    onPress={() => openRouteInMap(route)}
                  >
                    <View style={s.routeHeader}>
                      <View style={s.routeNameBlock}>
                        <Ionicons name="heart" size={16} color="#ef4444" />
                        <Text style={[s.routeName, isDark && { color: '#e2e8f0' }]} numberOfLines={1}>
                          {route.routeName}
                        </Text>
                      </View>

                      <View style={s.routeHeaderRight}>
                        <View style={s.badge}>
                          <Ionicons name="sparkles-outline" size={12} color="#047857" />
                          <Text style={{ fontSize: 11, fontWeight: '600', color: '#047857' }}>{modeLabel(route.transportMode)}</Text>
                        </View>

                        <TouchableOpacity
                          style={[s.menuBtn, isDark && s.menuBtnDark]}
                          onPress={() => showRouteMenu(route)}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <Ionicons
                            name="ellipsis-horizontal"
                            size={16}
                            color={isDark ? '#e2e8f0' : '#4b5563'}
                          />
                        </TouchableOpacity>
                      </View>
                    </View>

                    <View style={s.routeMainRow}>
                      <View style={s.routeLineCol}>
                        <View style={s.routeDot} />
                        <View style={s.routeLine} />
                        <View style={[s.routeDot, { backgroundColor: '#0f172a' }]} />
                      </View>

                      <View style={s.routeTextCol}>
                        <Text style={[s.routeLabel, isDark && { color: '#94a3b8' }]}>
                          {t('favorites.origin')}
                        </Text>
                        <Text style={[s.routeValue, isDark && { color: '#e2e8f0' }]} numberOfLines={2}>
                          {route.originAddress}
                        </Text>

                        <Text style={[s.routeLabel, { marginTop: 6 }, isDark && { color: '#94a3b8' }]}>
                          {t('favorites.destination')}
                        </Text>
                        <Text style={[s.routeValue, isDark && { color: '#e2e8f0' }]} numberOfLines={2}>
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
                        <Text style={s.chipText}>{modeLabel(route.transportMode)}</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#f0fdf4' },
  pageDark: { backgroundColor: '#0B1215' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  headerDark: { backgroundColor: 'rgba(22,35,41,0.95)', borderBottomColor: '#26383D' },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 1 },
  logoBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#10b981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#1f2937', flexShrink: 1 },
  pillBtn: {
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
  },
  pillText: { fontSize: 12, fontWeight: '600', color: '#4b5563' },

  scroll: { padding: 16, paddingBottom: 32 },

  card: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#dcfce7',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  cardDark: { backgroundColor: '#162329', borderColor: '#26383D' },
  cardTitle: { fontSize: 20, fontWeight: '800', color: '#1f2937' },
  cardSub: { fontSize: 12, color: '#6b7280', marginTop: 4 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 16 },
  statCard: {
    flex: 1,
    minWidth: 140,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#f3f4f6',
    alignItems: 'center',
  },
  statCardDark: { backgroundColor: 'rgba(11,18,21,0.4)', borderColor: '#26383D' },
  statIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statValue: { fontSize: 18, fontWeight: '800', color: '#1f2937' },
  statLabel: { fontSize: 10, color: '#6b7280', textAlign: 'center', marginTop: 2 },

  list: { marginTop: 16, gap: 12 },

  emptyBox: { alignItems: 'center', paddingVertical: 32 },
  emptyText: { fontSize: 14, color: '#6b7280', marginTop: 12, textAlign: 'center' },

  routeCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#f3f4f6',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  routeCardDark: { backgroundColor: '#1f2937', borderColor: '#26383D' },
  routeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    gap: 8,
  },
  routeNameBlock: { flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 1 },
  routeName: { fontSize: 15, fontWeight: '700', color: '#111827', flexShrink: 1 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: '#dcfce7',
  },
  routeHeaderRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  menuBtn: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuBtnDark: { backgroundColor: '#162329', borderColor: '#26383D' },
  tapHint: { fontSize: 11, color: '#059669', marginTop: 6, fontWeight: '600' },

  routeMainRow: { flexDirection: 'row', gap: 12 },
  routeLineCol: { alignItems: 'center', paddingTop: 4 },
  routeDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#10b981' },
  routeLine: { width: 2, flex: 1, marginVertical: 4, backgroundColor: '#d1d5db' },
  routeTextCol: { flex: 1 },
  routeLabel: { fontSize: 11, color: '#6b7280' },
  routeValue: { fontSize: 13, color: '#111827', marginTop: 1 },

  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#dcfce7',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  chipText: { fontSize: 11, fontWeight: '600', color: '#065f46' },
});
