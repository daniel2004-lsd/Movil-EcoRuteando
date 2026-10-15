// app/(tabs)/saved-routes.tsx — «Mis rutas»: lista unificada de rutas creadas y favoritas.
// Estilo alineado al dashboard (inicio): fondo #f0fdf4, tarjetas blancas, selector tipo pestañas (Google Maps).
import { Dialog } from '../../src/shared/components/ui/AppDialog';
import React, { useCallback, useState } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, TextInput, 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect, useLocalSearchParams } from 'expo-router';

import { useThemeMode } from '../../src/shared/store/ThemeContext';
import { useLanguage } from '../../src/shared/store/LanguageContext';
import { useAuth } from '../../src/shared/store/AuthContext';
import apiClient from '../../src/shared/services/apiClient';

type SavedRoute = {
  id: string;
  name: string;
  transportType: string;
  status: string;
  startName: string;
  destinationName: string;
  distanceKm: number | null;
  estimatedTimeMin: number | null;
  co2SavedKg: number | null;
  startLat?: number | null;
  startLng?: number | null;
  endLat?: number | null;
  endLng?: number | null;
  isFavorite?: boolean;
};

const TRANSPORT_ICON: Record<string, string> = {
  walking: 'walk-outline',
  car: 'car-outline',
  bike: 'bicycle-outline',
  public_transport: 'bus-outline',
  mixed: 'git-merge-outline',
};

export default function SavedRoutesScreen() {
  const router = useRouter();
  const searchParams = useLocalSearchParams();
  const { auth } = useAuth();
  const isGuest = !!auth.guest;
  const { theme } = useThemeMode();
  const { t } = useLanguage();
  const isDark = theme === 'dark';

  const [activeTab, setActiveTab] = useState<'all' | 'favorites'>(
    searchParams.tab === 'favorites' ? 'favorites' : 'all'
  );
  const [routes, setRoutes] = useState<SavedRoute[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [query, setQuery] = useState('');
  const [togglingFavId, setTogglingFavId] = useState<string | null>(null);

  // Sincronizar parámetro de búsqueda de tab si cambia
  React.useEffect(() => {
    if (searchParams.tab === 'favorites') {
      setActiveTab('favorites');
    } else if (searchParams.tab === 'all') {
      setActiveTab('all');
    }
  }, [searchParams.tab]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const [routesRes, favsRes] = await Promise.all([
        apiClient.get('/api/routes', {
          params: { mine: true, includeInactive: true },
        }),
        apiClient.get('/api/favorites').catch(() => ({ data: [] })),
      ]);

      const items: any[] = Array.isArray(routesRes.data) ? routesRes.data : [];
      const favItems: any[] = Array.isArray(favsRes.data)
        ? favsRes.data
        : (favsRes.data?.items ?? []);

      const favSet = new Set<string>();
      favItems.forEach((f: any) => {
        const id = f.routeId || f.id;
        if (id) favSet.add(String(id));
      });
      setFavoriteIds(favSet);

      const parsedRoutes: SavedRoute[] = items
        .filter(r => r && r.id)
        .map((r, i): SavedRoute => {
          const rId = String(r.id ?? `route-${i}`);
          return {
            id: rId,
            name: r.name || `${r.startName ?? ''} → ${r.destinationName ?? ''}`,
            transportType: r.transportType || 'walking',
            status: r.status || 'active',
            startName: r.startName || '',
            destinationName: r.destinationName || '',
            distanceKm: r.distanceKm ?? null,
            estimatedTimeMin: r.estimatedTimeMin ?? null,
            co2SavedKg: r.co2SavedKg ?? null,
            startLat: r.startLatitude ?? r.startLat ?? null,
            startLng: r.startLongitude ?? r.startLng ?? null,
            endLat: r.endLatitude ?? r.endLat ?? null,
            endLng: r.endLongitude ?? r.endLng ?? null,
            isFavorite: favSet.has(rId),
          };
        });

      // Incluir también las rutas de favoritos que no estén ya en la lista de creadas
      favItems.forEach((f: any, i: number) => {
        const fId = String(f.routeId || f.id || `fav-${i}`);
        const alreadyExists = parsedRoutes.some(pr => pr.id === fId);
        if (!alreadyExists && fId) {
          const name: string = f.routeName || '';
          const parts = name.split(/\s*→\s*/);
          parsedRoutes.push({
            id: fId,
            name: name || t('favorites.defaultName'),
            transportType: f.transportMode ?? f.transportType ?? 'car',
            status: 'active',
            startName: f.originAddress ?? (parts[0] || name || t('savedRoutes.origin')),
            destinationName: f.destinationAddress ?? (parts[parts.length - 1] || t('savedRoutes.destination')),
            distanceKm: f.distanceKm ?? null,
            estimatedTimeMin: f.estimatedTimeMin ?? null,
            co2SavedKg: f.co2SavedKg ?? null,
            startLat: f.startLat ?? null,
            startLng: f.startLng ?? null,
            endLat: f.endLat ?? null,
            endLng: f.endLng ?? null,
            isFavorite: true,
          });
        }
      });

      setRoutes(parsedRoutes);
    } catch {
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  const toggleFavorite = async (route: SavedRoute) => {
    if (isGuest) {
      Dialog.alert(
        t('planRoute.needAccountTitle'),
        t('planRoute.needAccountMsg').replace('{action}', t('savedRoutes.favoritesTab')),
        [
          { text: t('planRoute.notNow'), style: 'cancel' },
          { text: t('auth.loginButton'), onPress: () => router.push('/(auth)/login') },
        ],
        { tone: 'info', icon: 'person-circle' }
      );
      return;
    }

    const isFav = favoriteIds.has(route.id);
    setTogglingFavId(route.id);

    // Optimistic update
    const nextSet = new Set(favoriteIds);
    if (isFav) {
      nextSet.delete(route.id);
    } else {
      nextSet.add(route.id);
    }
    setFavoriteIds(nextSet);
    setRoutes(prev =>
      prev.map(r => (r.id === route.id ? { ...r, isFavorite: !isFav } : r))
    );

    try {
      if (isFav) {
        await apiClient.delete(`/api/favorites/${route.id}`);
      } else {
        await apiClient.post('/api/favorites', { routeId: route.id });
      }
    } catch {
      // Revertir si falla
      setFavoriteIds(favoriteIds);
      setRoutes(prev =>
        prev.map(r => (r.id === route.id ? { ...r, isFavorite: isFav } : r))
      );
      Dialog.alert(
        t('planRoute.saveError'),
        t('planRoute.unexpectedError'),
        [{ text: t('common.ok') }],
        { tone: 'error' }
      );
    } finally {
      setTogglingFavId(null);
    }
  };

  const useRouteInMap = (route: SavedRoute) => {
    const parts: string[] = [];
    if (route.startLat != null && route.startLng != null) {
      parts.push(`originLat=${encodeURIComponent(String(route.startLat))}`);
      parts.push(`originLng=${encodeURIComponent(String(route.startLng))}`);
    }
    if (route.endLat != null && route.endLng != null) {
      parts.push(`destLat=${encodeURIComponent(String(route.endLat))}`);
      parts.push(`destLng=${encodeURIComponent(String(route.endLng))}`);
    }
    if (route.startName) {
      parts.push(`originName=${encodeURIComponent(route.startName)}`);
    }
    if (route.destinationName) {
      parts.push(`destName=${encodeURIComponent(route.destinationName)}`);
    }
    if (route.transportType) {
      parts.push(`mode=${encodeURIComponent(route.transportType)}`);
    }
    router.push(`/(tabs)/plan-route?${parts.join('&')}`);
  };

  const doDelete = async (id: string) => {
    try {
      await apiClient.delete(`/api/routes/${id}`);
      setRoutes(prev => prev.filter(r => r.id !== id));
      if (favoriteIds.has(id)) {
        const nextSet = new Set(favoriteIds);
        nextSet.delete(id);
        setFavoriteIds(nextSet);
      }
    } catch {
      Dialog.alert(t('savedRoutes.deleteTitle'), t('savedRoutes.deleteError'), {
        tone: 'error',
        icon: 'trash',
      });
    }
  };

  const askDelete = (route: SavedRoute) => {
    Dialog.alert(
      t('savedRoutes.deleteTitle'),
      `${route.name}\n\n${t('savedRoutes.deleteMessage')}`,
      [
        { text: t('savedRoutes.deleteCancel'), style: 'cancel' },
        {
          text: t('savedRoutes.deleteConfirm'),
          style: 'destructive',
          onPress: () => void doDelete(route.id),
        },
      ]
    );
  };

  const labelOf = (path: string, fallback: string) => {
    const value = t(path);
    return value === path ? fallback : value;
  };

  // Filtrado según pestaña activa
  const tabFilteredRoutes = routes.filter(r => {
    if (activeTab === 'favorites') {
      return favoriteIds.has(r.id) || r.isFavorite;
    }
    return true;
  });

  // Búsqueda local: filtra por nombre, origen o destino.
  const q = query.trim().toLowerCase();
  const visible = q
    ? tabFilteredRoutes.filter(
        r =>
          r.name.toLowerCase().includes(q) ||
          r.startName.toLowerCase().includes(q) ||
          r.destinationName.toLowerCase().includes(q)
      )
    : tabFilteredRoutes;

  const totalKm = routes.reduce((sum, r) => sum + (Number(r.distanceKm) || 0), 0);
  const totalCo2 = routes.reduce((sum, r) => sum + (Number(r.co2SavedKg) || 0), 0);
  const favCount = routes.filter(r => favoriteIds.has(r.id) || r.isFavorite).length;

  const stats: { icon: string; color: string; tint: string; value: string; label: string }[] = [
    {
      icon: 'bookmark',
      color: 'rgba(16,185,129,0.2)',
      tint: isDark ? '#34D399' : '#fff',
      value: loading ? '...' : String(routes.length),
      label: t('savedRoutes.countLabel'),
    },
    {
      icon: 'heart',
      color: 'rgba(244,63,94,0.2)',
      tint: isDark ? '#fb7185' : '#fff',
      value: loading ? '...' : String(favCount),
      label: t('savedRoutes.favoritesTab'),
    },
    {
      icon: 'navigate',
      color: 'rgba(6,182,214,0.2)',
      tint: isDark ? '#22d3ee' : '#fff',
      value: loading ? '...' : `${totalKm.toFixed(1)} ${t('savedRoutes.kmSuffix')}`,
      label: t('savedRoutes.distanceLabel'),
    },
    {
      icon: 'leaf',
      color: 'rgba(168,85,247,0.2)',
      tint: isDark ? '#c084fc' : '#fff',
      value: loading ? '...' : `${totalCo2.toFixed(2)} kg`,
      label: t('savedRoutes.co2Label'),
    },
  ];

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
            {t('savedRoutes.title')}
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
        {/* Resumen */}
        <View style={[s.card, isDark && s.cardDark]}>
          <Text style={[s.cardTitle, isDark && { color: '#e2e8f0' }]}>
            {t('savedRoutes.subtitle')}
          </Text>
          <Text style={[s.cardSub, isDark && { color: '#94a3b8' }]}>
            {t('savedRoutes.refreshNote')}
          </Text>

          <View style={s.statsGrid}>
            {stats.map((stat, i) => (
              <View key={i} style={[s.statCard, isDark && s.statCardDark]}>
                <View style={[s.statIcon, { backgroundColor: stat.color }]}>
                  <Ionicons name={stat.icon as any} size={20} color={stat.tint} />
                </View>
                <Text style={[s.statValue, isDark && { color: '#e2e8f0' }]}>{stat.value}</Text>
                <Text style={[s.statLabel, isDark && { color: '#94a3b8' }]}>{stat.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Selector de pestañas unificado estilo Google Maps */}
        <View style={[s.tabSelectorContainer, isDark && s.tabSelectorContainerDark]}>
          <TouchableOpacity
            style={[
              s.tabButton,
              activeTab === 'all' && s.tabButtonActive,
              activeTab === 'all' && isDark && s.tabButtonActiveDark,
            ]}
            onPress={() => setActiveTab('all')}
            activeOpacity={0.8}
          >
            <Ionicons
              name="navigate"
              size={16}
              color={activeTab === 'all' ? '#10b981' : isDark ? '#94a3b8' : '#6b7280'}
            />
            <Text
              style={[
                s.tabButtonText,
                isDark && { color: '#94a3b8' },
                activeTab === 'all' && s.tabButtonTextActive,
                activeTab === 'all' && isDark && { color: '#34d399' },
              ]}
            >
              {t('savedRoutes.allRoutesTab')} ({routes.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              s.tabButton,
              activeTab === 'favorites' && s.tabButtonActive,
              activeTab === 'favorites' && isDark && s.tabButtonActiveDark,
            ]}
            onPress={() => setActiveTab('favorites')}
            activeOpacity={0.8}
          >
            <Ionicons
              name="heart"
              size={16}
              color={activeTab === 'favorites' ? '#f43f5e' : isDark ? '#94a3b8' : '#6b7280'}
            />
            <Text
              style={[
                s.tabButtonText,
                isDark && { color: '#94a3b8' },
                activeTab === 'favorites' && s.tabButtonTextActiveFav,
                activeTab === 'favorites' && isDark && { color: '#fb7185' },
              ]}
            >
              {t('savedRoutes.favoritesTab')} ({favCount})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Cabecera de sección */}
        <View style={s.toolsHeader}>
          <Text style={[s.toolsTitle, isDark && { color: '#e2e8f0' }]}>
            {activeTab === 'favorites' ? t('savedRoutes.favoritesTab') : t('savedRoutes.listTitle')}
          </Text>
          <Text style={[s.toolsCount, isDark && { color: '#94a3b8' }]}>
            {loading
              ? '...'
              : q
                ? `${visible.length} / ${tabFilteredRoutes.length}`
                : `${tabFilteredRoutes.length} ${t('savedRoutes.countLabel')}`}
          </Text>
        </View>

        {/* Buscador */}
        <View style={[s.searchBox, isDark && s.searchBoxDark]}>
          <Ionicons name="search-outline" size={16} color={isDark ? '#94a3b8' : '#9ca3af'} />
          <TextInput
            style={[s.searchInput, isDark && { color: '#e2e8f0' }]}
            value={query}
            onChangeText={setQuery}
            placeholder={t('savedRoutes.searchPlaceholder')}
            placeholderTextColor={isDark ? '#64748b' : '#9ca3af'}
            autoCorrect={false}
            returnKeyType="search"
          />
          {query.length > 0 && (
            <TouchableOpacity
              onPress={() => setQuery('')}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="close-circle" size={16} color={isDark ? '#94a3b8' : '#9ca3af'} />
            </TouchableOpacity>
          )}
        </View>

        {/* Lista */}
        <View style={s.list}>
          {loading ? (
            <ActivityIndicator size="large" color="#10b981" style={{ marginTop: 40 }} />
          ) : loadError ? (
            <View style={[s.card, isDark && s.cardDark, s.emptyBox]}>
              <Ionicons name="cloud-offline-outline" size={44} color="#9ca3af" />
              <Text style={[s.emptyText, isDark && { color: '#e2e8f0' }]}>
                {t('savedRoutes.loadError')}
              </Text>
              <TouchableOpacity style={s.retryBtn} onPress={() => void fetchData()}>
                <Text style={s.retryText}>{t('savedRoutes.retry')}</Text>
              </TouchableOpacity>
            </View>
          ) : tabFilteredRoutes.length === 0 ? (
            <View style={[s.card, isDark && s.cardDark, s.emptyBox]}>
              <View
                style={[
                  s.emptyIcon,
                  activeTab === 'favorites' && { backgroundColor: '#f43f5e' },
                ]}
              >
                <Ionicons
                  name={activeTab === 'favorites' ? 'heart-outline' : 'bookmark-outline'}
                  size={30}
                  color="#fff"
                />
              </View>
              <Text style={[s.emptyText, isDark && { color: '#e2e8f0' }]}>
                {activeTab === 'favorites'
                  ? t('savedRoutes.emptyFavorites')
                  : t('savedRoutes.empty')}
              </Text>
              <Text style={[s.emptySub, isDark && { color: '#94a3b8' }]}>
                {activeTab === 'favorites'
                  ? t('savedRoutes.emptyFavoritesSub')
                  : t('savedRoutes.emptySub')}
              </Text>
            </View>
          ) : visible.length === 0 ? (
            <View style={[s.card, isDark && s.cardDark, s.emptyBox]}>
              <View style={s.emptyIcon}>
                <Ionicons name="search-outline" size={30} color="#fff" />
              </View>
              <Text style={[s.emptyText, isDark && { color: '#e2e8f0' }]}>
                {t('savedRoutes.noResults')}
              </Text>
              <Text style={[s.emptySub, isDark && { color: '#94a3b8' }]}>
                {t('savedRoutes.noResultsSub')}
              </Text>
            </View>
          ) : (
            visible.map(route => {
              const transportLabel = labelOf(
                `savedRoutes.transport.${route.transportType}`,
                route.transportType
              );
              const showStatus = route.status && route.status !== 'active';
              const statusLabel = showStatus
                ? labelOf(`savedRoutes.status.${route.status}`, route.status)
                : '';
              const isFav = favoriteIds.has(route.id) || !!route.isFavorite;

              return (
                <View key={route.id} style={[s.routeCard, isDark && s.routeCardDark]}>
                  <View style={s.routeHeader}>
                    <View style={s.routeNameBlock}>
                      <View style={s.routeBadgeIcon}>
                        <Ionicons
                          name={(TRANSPORT_ICON[route.transportType] as any) || 'walk-outline'}
                          size={16}
                          color="#fff"
                        />
                      </View>
                      <Text
                        style={[s.routeName, isDark && { color: '#e2e8f0' }]}
                        numberOfLines={2}
                      >
                        {route.name}
                      </Text>
                    </View>

                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <View style={s.transportPill}>
                        <Text style={s.transportPillText}>{transportLabel}</Text>
                      </View>
                      {/* Botón de favorito interactivo */}
                      <TouchableOpacity
                        onPress={() => toggleFavorite(route)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        disabled={togglingFavId === route.id}
                        style={[
                          s.favCircleBtn,
                          isFav && s.favCircleBtnActive,
                          isDark && { backgroundColor: isFav ? 'rgba(244,63,94,0.2)' : '#1e293b' },
                        ]}
                      >
                        <Ionicons
                          name={isFav ? 'heart' : 'heart-outline'}
                          size={18}
                          color={isFav ? '#f43f5e' : isDark ? '#94a3b8' : '#9ca3af'}
                        />
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={s.routeMainRow}>
                    <View style={s.routeLineCol}>
                      <View style={s.routeDot} />
                      <View style={[s.routeLine, isDark && { backgroundColor: '#374151' }]} />
                      <View style={[s.routeDot, { backgroundColor: '#0f172a' }]} />
                    </View>

                    <View style={s.routeTextCol}>
                      <Text style={[s.routeLabel, isDark && { color: '#94a3b8' }]}>
                        {t('savedRoutes.origin')}
                      </Text>
                      <Text style={[s.routeValue, isDark && { color: '#e2e8f0' }]}>
                        {route.startName || route.name}
                      </Text>

                      <Text style={[s.routeLabel, { marginTop: 6 }, isDark && { color: '#94a3b8' }]}>
                        {t('savedRoutes.destination')}
                      </Text>
                      <Text style={[s.routeValue, isDark && { color: '#e2e8f0' }]}>
                        {route.destinationName || route.name}
                      </Text>
                    </View>
                  </View>

                  <View style={s.metaRow}>
                    {route.distanceKm != null && (
                      <View style={s.chip}>
                        <Ionicons name="navigate-outline" size={13} color="#065f46" />
                        <Text style={s.chipText}>
                          {Number(route.distanceKm).toFixed(1)} {t('savedRoutes.kmSuffix')}
                        </Text>
                      </View>
                    )}

                    {route.estimatedTimeMin != null && (
                      <View style={s.chip}>
                        <Ionicons name="time-outline" size={13} color="#065f46" />
                        <Text style={s.chipText}>
                          {route.estimatedTimeMin} {t('savedRoutes.minSuffix')}
                        </Text>
                      </View>
                    )}

                    {route.co2SavedKg != null && Number(route.co2SavedKg) > 0 && (
                      <View style={s.chip}>
                        <Ionicons name="leaf-outline" size={13} color="#065f46" />
                        <Text style={s.chipText}>{Number(route.co2SavedKg).toFixed(2)} kg</Text>
                      </View>
                    )}

                    {showStatus && (
                      <View style={s.statusPill}>
                        <Text style={s.statusText}>{statusLabel}</Text>
                      </View>
                    )}
                  </View>

                  <View style={s.actionsRow}>
                    <TouchableOpacity
                      style={[
                        s.useRouteBtn,
                        isDark && { backgroundColor: '#064e3b', borderColor: '#059669' },
                      ]}
                      onPress={() => useRouteInMap(route)}
                    >
                      <Ionicons name="map-outline" size={14} color="#059669" />
                      <Text style={[s.useRouteBtnText, isDark && { color: '#34d399' }]}>
                        {t('savedRoutes.useRoute')}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[s.deleteBtn, isDark && { backgroundColor: '#3f1d1d', borderColor: '#7f1d1d' }]}
                      onPress={() => askDelete(route)}
                    >
                      <Ionicons name="trash-outline" size={14} color="#b91c1c" />
                      <Text style={[s.deleteBtnText, isDark && { color: '#fca5a5' }]}>
                        {t('savedRoutes.delete')}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )}
        </View>
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
  cardTitle: { fontSize: 22, fontWeight: '800', color: '#1f2937' },
  cardSub: { fontSize: 12, color: '#6b7280', marginTop: 4 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 16 },
  statCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 12,
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
  statLabel: { fontSize: 10, color: '#6b7280', textAlign: 'center' },

  tabSelectorContainer: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: 16,
    padding: 4,
    marginTop: 18,
    gap: 4,
  },
  tabSelectorContainerDark: { backgroundColor: '#162329' },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
  },
  tabButtonActive: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  tabButtonActiveDark: {
    backgroundColor: '#1f2937',
  },
  tabButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6b7280',
  },
  tabButtonTextActive: {
    color: '#059669',
    fontWeight: '700',
  },
  tabButtonTextActiveFav: {
    color: '#e11d48',
    fontWeight: '700',
  },

  toolsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 20,
    marginBottom: 12,
  },
  toolsTitle: { fontSize: 20, fontWeight: '800', color: '#1f2937' },
  toolsCount: { fontSize: 11, color: '#9ca3af', fontWeight: '600' },

  list: { gap: 12 },

  routeCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#f3f4f6',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  routeCardDark: { backgroundColor: '#1f2937', borderColor: '#374151' },

  routeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  routeNameBlock: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, flexShrink: 1 },
  routeBadgeIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#10b981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  routeName: { fontSize: 14, fontWeight: '700', color: '#1f2937', flexShrink: 1 },
  transportPill: {
    backgroundColor: '#dcfce7',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  transportPillText: { fontSize: 11, fontWeight: '600', color: '#047857' },

  favCircleBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  favCircleBtnActive: {
    backgroundColor: '#ffe4e6',
  },

  routeMainRow: { flexDirection: 'row', gap: 12 },
  routeLineCol: { alignItems: 'center', paddingTop: 2 },
  routeDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#10b981' },
  routeLine: { width: 2, flex: 1, marginVertical: 4, backgroundColor: '#e5e7eb' },
  routeTextCol: { flex: 1 },
  routeLabel: { fontSize: 11, color: '#6b7280' },
  routeValue: { fontSize: 13, color: '#1f2937', fontWeight: '500' },

  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
    alignItems: 'center',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f0fdf4',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#dcfce7',
  },
  chipText: { fontSize: 11, fontWeight: '600', color: '#065f46' },
  statusPill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: '#fef3c7',
    borderWidth: 1,
    borderColor: '#fcd34d',
  },
  statusText: { fontSize: 11, fontWeight: '600', color: '#92400e' },

  actionsRow: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 8, marginTop: 12 },
  useRouteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  useRouteBtnText: { fontSize: 12, fontWeight: '600', color: '#059669' },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  deleteBtnText: { fontSize: 12, fontWeight: '600', color: '#b91c1c' },

  emptyBox: { alignItems: 'center', paddingVertical: 32 },
  emptyIcon: {
    width: 60,
    height: 60,
    borderRadius: 16,
    backgroundColor: '#10b981',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyText: { fontSize: 15, fontWeight: '700', color: '#1f2937', textAlign: 'center' },
  emptySub: { fontSize: 12, color: '#6b7280', textAlign: 'center', marginTop: 6 },
  retryBtn: {
    marginTop: 14,
    borderRadius: 12,
    backgroundColor: '#10b981',
    paddingHorizontal: 18,
    paddingVertical: 9,
  },
  retryText: { fontSize: 13, fontWeight: '700', color: '#ffffff' },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#f3f4f6',
    paddingHorizontal: 14,
    height: 44,
    marginBottom: 12,
  },
  searchBoxDark: { backgroundColor: '#162329', borderColor: '#26383D' },
  searchInput: { flex: 1, fontSize: 14, color: '#1f2937', paddingVertical: 0 },
});
