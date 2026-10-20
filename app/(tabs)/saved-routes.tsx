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
import { RouteMiniMap } from '../../src/components/maps/RouteMiniMap';

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
  encodedPolyline?: string | null;
  estimatedCalories?: number | null;
  isFavorite?: boolean;
};

const TRANSPORT_CONFIG: Record<string, { icon: any; label: string; emoji: string }> = {
  walking: { icon: 'walk-outline', label: 'A pie', emoji: '🚶' },
  bike: { icon: 'bicycle-outline', label: 'Bicicleta', emoji: '🚲' },
  car: { icon: 'car-outline', label: 'Automóvil', emoji: '🚗' },
  public_transport: { icon: 'bus-outline', label: 'Transporte', emoji: '🚌' },
  mixed: { icon: 'git-merge-outline', label: 'Mixto', emoji: '🔄' },
};

const STATUS_BADGE: Record<string, { label: string; bg: string; text: string }> = {
  active: { label: 'Activo', bg: '#dcfce7', text: '#059669' },
  inactive: { label: 'Inactivo', bg: '#f1f5f9', text: '#64748b' },
  planned: { label: 'Planificada', bg: '#eff6ff', text: '#2563eb' },
  completed: { label: 'Completada', bg: '#f0fdf4', text: '#16a34a' },
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

  const fetchData = useCallback(async (isSilent = false) => {
    if (!isSilent) {
      setLoading(true);
      setLoadError(false);
    }
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
            encodedPolyline: r.encodedPolyline || null,
            estimatedCalories: r.estimatedCalories != null ? Number(r.estimatedCalories) : null,
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
            encodedPolyline: f.encodedPolyline || null,
            estimatedCalories: f.estimatedCalories != null ? Number(f.estimatedCalories) : null,
            isFavorite: true,
          });
        }
      });

      setRoutes(parsedRoutes);
    } catch {
      if (!isSilent) setLoadError(true);
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, [t]);

  useFocusEffect(
    useCallback(() => {
      fetchData();
      // Auto-sincronización periódica en segundo plano para reflejar cambios creados en la web
      const interval = setInterval(() => {
        fetchData(true);
      }, 3500);
      return () => clearInterval(interval);
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
              const config = TRANSPORT_CONFIG[route.transportType] || TRANSPORT_CONFIG.walking;
              const transportLabel = labelOf(
                `savedRoutes.transport.${route.transportType}`,
                config.label
              );
              const statusKey = (route.status || 'active').toLowerCase();
              const statusInfo = STATUS_BADGE[statusKey] || {
                label: route.status || 'Activo',
                bg: '#ecfdf5',
                text: '#059669',
              };
              const isFav = favoriteIds.has(route.id) || !!route.isFavorite;

              // Calorías estimadas (de BD o cálculo estándar por km)
              const calories =
                route.estimatedCalories != null
                  ? Math.round(Number(route.estimatedCalories))
                  : route.distanceKm != null
                    ? Math.round(
                        Number(route.distanceKm) * (route.transportType === 'car' ? 0 : 45)
                      )
                    : null;

              return (
                <View key={route.id} style={[s.routeCard, isDark && s.routeCardDark]}>
                  {/* MINIMAPA SUPERIOR */}
                  <TouchableOpacity
                    activeOpacity={0.92}
                    onPress={() => useRouteInMap(route)}
                    style={s.mapWrapper}
                  >
                    <RouteMiniMap
                      startLat={route.startLat}
                      startLng={route.startLng}
                      endLat={route.endLat}
                      endLng={route.endLng}
                      encodedPolyline={route.encodedPolyline}
                      isDark={isDark}
                      height={155}
                    />

                    {/* Badges superiores sobre el mapa */}
                    <View style={s.mapOverlayTop} pointerEvents="box-none">
                      <View style={s.mapOverlayLeftBadges}>
                        <View
                          style={[
                            s.mapStatusBadge,
                            { backgroundColor: isDark ? 'rgba(16,185,129,0.3)' : statusInfo.bg },
                          ]}
                        >
                          <Text
                            style={[
                              s.mapStatusBadgeText,
                              { color: isDark ? '#34d399' : statusInfo.text },
                            ]}
                          >
                            {statusInfo.label}
                          </Text>
                        </View>
                        <View style={s.mapTransportBadge}>
                          <Text style={s.mapTransportEmoji}>{config.emoji}</Text>
                          <Text style={s.mapTransportText}>{transportLabel}</Text>
                        </View>
                      </View>

                      {/* Botón flotante de favorito */}
                      <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => toggleFavorite(route)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        disabled={togglingFavId === route.id}
                        style={[s.mapFavBtn, isFav && s.mapFavBtnActive]}
                      >
                        <Ionicons
                          name={isFav ? 'heart' : 'heart-outline'}
                          size={17}
                          color="#fff"
                        />
                      </TouchableOpacity>
                    </View>

                    {/* Badges inferiores sobre el mapa */}
                    <View style={s.mapOverlayBottom} pointerEvents="box-none">
                      <View style={s.mapExpandHint}>
                        <Ionicons name="map-outline" size={11} color="#fff" />
                        <Text style={s.mapExpandHintText}>Ver recorrido</Text>
                      </View>

                      <View style={s.mapMetricsPill}>
                        <Text style={s.mapMetricsPillText}>
                          📏 {route.distanceKm != null ? `${Number(route.distanceKm).toFixed(1)} km` : '--'}
                        </Text>
                        <Text style={s.mapMetricsPillDivider}>•</Text>
                        <Text style={s.mapMetricsPillText}>
                          ⏱️ {route.estimatedTimeMin != null ? `${route.estimatedTimeMin} min` : '--'}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>

                  {/* CUERPO DE LA TARJETA */}
                  <View style={s.cardBody}>
                    <Text
                      style={[s.routeName, isDark && { color: '#e2e8f0' }]}
                      numberOfLines={1}
                    >
                      {route.name}
                    </Text>

                    {/* Origen y Destino destacados */}
                    <TouchableOpacity
                      activeOpacity={0.85}
                      onPress={() => useRouteInMap(route)}
                      style={[s.originDestBox, isDark && s.originDestBoxDark]}
                    >
                      <View style={s.originDestRow}>
                        <View style={[s.pointDot, { backgroundColor: '#10b981' }]} />
                        <View style={s.pointTextCol}>
                          <Text style={[s.pointTag, { color: isDark ? '#34d399' : '#059669' }]}>
                            ORIGEN (Partida)
                          </Text>
                          <Text
                            style={[s.pointAddress, isDark && { color: '#e2e8f0' }]}
                            numberOfLines={1}
                          >
                            {route.startName || 'Mi ubicación'}
                          </Text>
                        </View>
                      </View>

                      <View style={[s.originDestDivider, isDark && { backgroundColor: '#26383D' }]} />

                      <View style={s.originDestRow}>
                        <View style={[s.pointDot, { backgroundColor: '#ef4444' }]} />
                        <View style={s.pointTextCol}>
                          <Text style={[s.pointTag, { color: isDark ? '#fb7185' : '#e11d48' }]}>
                            DESTINO (Llegada)
                          </Text>
                          <Text
                            style={[s.pointAddress, isDark && { color: '#e2e8f0' }]}
                            numberOfLines={1}
                          >
                            {route.destinationName || 'Destino seleccionado'}
                          </Text>
                        </View>
                      </View>
                    </TouchableOpacity>

                    {/* Grilla de Métricas Enriquecidas 2x2 */}
                    <View style={s.metricsGrid}>
                      <View style={[s.metricBox, isDark && s.metricBoxDark]}>
                        <Text style={s.metricIcon}>📏</Text>
                        <View style={s.metricContent}>
                          <Text style={[s.metricLabel, isDark && { color: '#94a3b8' }]}>
                            {t('savedRoutes.distanceLabel')}
                          </Text>
                          <Text style={[s.metricVal, isDark && { color: '#e2e8f0' }]}>
                            {route.distanceKm != null ? `${Number(route.distanceKm).toFixed(1)} km` : '--'}
                          </Text>
                        </View>
                      </View>

                      <View style={[s.metricBox, isDark && s.metricBoxDark]}>
                        <Text style={s.metricIcon}>⏱️</Text>
                        <View style={s.metricContent}>
                          <Text style={[s.metricLabel, isDark && { color: '#94a3b8' }]}>
                            Tiempo
                          </Text>
                          <Text style={[s.metricVal, isDark && { color: '#e2e8f0' }]}>
                            {route.estimatedTimeMin != null ? `${route.estimatedTimeMin} min` : '--'}
                          </Text>
                        </View>
                      </View>

                      <View style={[s.metricBox, s.metricBoxEco, isDark && s.metricBoxEcoDark]}>
                        <Text style={s.metricIcon}>🌱</Text>
                        <View style={s.metricContent}>
                          <Text style={[s.metricLabel, { color: isDark ? '#34d399' : '#059669' }]}>
                            CO₂ Ahorrado
                          </Text>
                          <Text style={[s.metricVal, { color: isDark ? '#34d399' : '#059669' }]}>
                            {route.co2SavedKg != null ? `${Number(route.co2SavedKg).toFixed(2)} kg` : '0.00 kg'}
                          </Text>
                        </View>
                      </View>

                      <View style={[s.metricBox, s.metricBoxCal, isDark && s.metricBoxCalDark]}>
                        <Text style={s.metricIcon}>🔥</Text>
                        <View style={s.metricContent}>
                          <Text style={[s.metricLabel, { color: isDark ? '#fb923c' : '#ea580c' }]}>
                            Calorías
                          </Text>
                          <Text style={[s.metricVal, { color: isDark ? '#fb923c' : '#ea580c' }]}>
                            {calories != null ? `${calories} kcal` : '--'}
                          </Text>
                        </View>
                      </View>
                    </View>

                    {/* Acciones principales */}
                    <View style={s.actionsRow}>
                      <TouchableOpacity
                        style={s.useRouteBtn}
                        onPress={() => useRouteInMap(route)}
                        activeOpacity={0.8}
                      >
                        <Ionicons name="navigate" size={15} color="#fff" />
                        <Text style={s.useRouteBtnText}>
                          {t('savedRoutes.useRoute')}
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[
                          s.mapBtn,
                          isDark && {
                            backgroundColor: 'rgba(16,185,129,0.15)',
                            borderColor: 'rgba(16,185,129,0.35)',
                          },
                        ]}
                        onPress={() => useRouteInMap(route)}
                        activeOpacity={0.8}
                      >
                        <Ionicons name="map-outline" size={15} color="#10b981" />
                        <Text style={[s.mapBtnText, isDark && { color: '#34d399' }]}>
                          Mapa
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[
                          s.deleteBtn,
                          isDark && {
                            backgroundColor: 'rgba(239,68,68,0.15)',
                            borderColor: 'rgba(239,68,68,0.3)',
                          },
                        ]}
                        onPress={() => askDelete(route)}
                        activeOpacity={0.8}
                      >
                        <Ionicons name="trash-outline" size={16} color="#ef4444" />
                      </TouchableOpacity>
                    </View>
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
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  routeCardDark: { backgroundColor: '#162329', borderColor: '#26383D' },

  mapWrapper: {
    width: '100%',
    height: 155,
    backgroundColor: '#0f172a',
    position: 'relative',
    overflow: 'hidden',
  },
  mapOverlayTop: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10,
  },
  mapOverlayLeftBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  mapStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  mapStatusBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  mapTransportBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  mapTransportEmoji: {
    fontSize: 11,
  },
  mapTransportText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#ffffff',
  },
  mapFavBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapFavBtnActive: {
    backgroundColor: 'rgba(244, 63, 94, 0.9)',
    borderColor: '#f43f5e',
  },
  mapOverlayBottom: {
    position: 'absolute',
    bottom: 8,
    left: 10,
    right: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10,
  },
  mapExpandHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(5, 150, 105, 0.9)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
  },
  mapExpandHintText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#ffffff',
  },
  mapMetricsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  mapMetricsPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#ffffff',
  },
  mapMetricsPillDivider: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.5)',
  },

  cardBody: {
    padding: 16,
  },
  routeName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1f2937',
    marginBottom: 10,
  },

  originDestBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 10,
  },
  originDestBoxDark: {
    backgroundColor: 'rgba(11, 18, 21, 0.6)',
    borderColor: '#26383D',
  },
  originDestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pointDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  pointTextCol: {
    flex: 1,
  },
  pointTag: {
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  pointAddress: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
    marginTop: 1,
  },
  originDestDivider: {
    height: 1,
    backgroundColor: '#e2e8f0',
    marginVertical: 6,
    marginLeft: 16,
  },

  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  metricBox: {
    width: '48.5%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 8,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  metricBoxDark: {
    backgroundColor: 'rgba(11, 18, 21, 0.4)',
    borderColor: '#26383D',
  },
  metricBoxEco: {
    backgroundColor: '#ecfdf5',
    borderColor: '#a7f3d0',
  },
  metricBoxEcoDark: {
    backgroundColor: 'rgba(6, 78, 59, 0.25)',
    borderColor: 'rgba(5, 150, 105, 0.4)',
  },
  metricBoxCal: {
    backgroundColor: '#fff7ed',
    borderColor: '#fed7aa',
  },
  metricBoxCalDark: {
    backgroundColor: 'rgba(124, 45, 18, 0.25)',
    borderColor: 'rgba(234, 88, 12, 0.4)',
  },
  metricIcon: {
    fontSize: 16,
  },
  metricContent: {
    flex: 1,
  },
  metricLabel: {
    fontSize: 9,
    color: '#64748b',
    fontWeight: '600',
  },
  metricVal: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1f2937',
    marginTop: 1,
  },

  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  useRouteBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#059669',
    borderRadius: 12,
    paddingVertical: 9,
    paddingHorizontal: 12,
    shadowColor: '#059669',
    shadowOpacity: 0.25,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  useRouteBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
  },
  mapBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    borderRadius: 12,
    paddingVertical: 9,
    paddingHorizontal: 12,
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  mapBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#059669',
  },
  deleteBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
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
