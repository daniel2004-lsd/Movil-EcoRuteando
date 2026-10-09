// app/(tabs)/saved-routes.tsx — «Mis rutas»: lista las rutas guardadas por el usuario.
// Estilo alineado al dashboard (inicio): fondo #f0fdf4, tarjetas blancas, cabecera con la hoja.
import { Dialog } from '../../src/shared/components/ui/AppDialog';
import React, { useCallback, useState } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, TextInput,  } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';

import { useThemeMode } from '../../src/shared/store/ThemeContext';
import { useLanguage } from '../../src/shared/store/LanguageContext';
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
  const { theme } = useThemeMode();
  const { t } = useLanguage();
  const isDark = theme === 'dark';

  const [routes, setRoutes] = useState<SavedRoute[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [query, setQuery] = useState('');

  const fetchRoutes = useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    try {
      // mine=true → el backend devuelve solo las rutas creadas por este usuario.
      const { data } = await apiClient.get('/api/routes', {
        params: { mine: true, includeInactive: true },
      });
      const items: any[] = Array.isArray(data) ? data : [];
      setRoutes(
        items
          .filter(r => r && r.id)
          .map((r, i): SavedRoute => ({
            id: r.id ?? `route-${i}`,
            name: r.name || `${r.startName ?? ''} → ${r.destinationName ?? ''}`,
            transportType: r.transportType || 'walking',
            status: r.status || 'active',
            startName: r.startName || '',
            destinationName: r.destinationName || '',
            distanceKm: r.distanceKm ?? null,
            estimatedTimeMin: r.estimatedTimeMin ?? null,
            co2SavedKg: r.co2SavedKg ?? null,
          }))
      );
    } catch {
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  // Se recarga CADA VEZ que la pantalla gana el foco: si guardas una ruta en el
  // planificador y vuelves, la lista aparece actualizada.
  useFocusEffect(
    useCallback(() => {
      fetchRoutes();
    }, [fetchRoutes])
  );

  const doDelete = async (id: string) => {
    try {
      await apiClient.delete(`/api/routes/${id}`);
      setRoutes(prev => prev.filter(r => r.id !== id));
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

  // Búsqueda local: filtra por nombre, origen o destino.
  const q = query.trim().toLowerCase();
  const visible = q
    ? routes.filter(
        r =>
          r.name.toLowerCase().includes(q) ||
          r.startName.toLowerCase().includes(q) ||
          r.destinationName.toLowerCase().includes(q)
      )
    : routes;

  const totalKm = routes.reduce((sum, r) => sum + (Number(r.distanceKm) || 0), 0);
  const totalCo2 = routes.reduce((sum, r) => sum + (Number(r.co2SavedKg) || 0), 0);

  const stats: { icon: string; color: string; tint: string; value: string; label: string }[] = [
    {
      icon: 'bookmark',
      color: 'rgba(16,185,129,0.2)',
      tint: isDark ? '#34D399' : '#fff',
      value: loading ? '...' : String(routes.length),
      label: t('savedRoutes.countLabel'),
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
        {/* Resumen — misma tarjeta que el saludo del dashboard */}
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

        {/* Cabecera de sección — igual que «Herramientas» */}
        <View style={s.toolsHeader}>
          <Text style={[s.toolsTitle, isDark && { color: '#e2e8f0' }]}>
            {t('savedRoutes.listTitle')}
          </Text>
          <Text style={[s.toolsCount, isDark && { color: '#94a3b8' }]}>
            {loading
              ? '...'
              : q
                ? `${visible.length} / ${routes.length} ${t('savedRoutes.countLabel')}`
                : `${routes.length} ${t('savedRoutes.countLabel')}`}
          </Text>
        </View>

        {/* Buscador — para que una ruta vieja no se pierda entre tantas */}
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
              <TouchableOpacity style={s.retryBtn} onPress={() => void fetchRoutes()}>
                <Text style={s.retryText}>{t('savedRoutes.retry')}</Text>
              </TouchableOpacity>
            </View>
          ) : routes.length === 0 ? (
            <View style={[s.card, isDark && s.cardDark, s.emptyBox]}>
              <View style={s.emptyIcon}>
                <Ionicons name="bookmark-outline" size={30} color="#fff" />
              </View>
              <Text style={[s.emptyText, isDark && { color: '#e2e8f0' }]}>
                {t('savedRoutes.empty')}
              </Text>
              <Text style={[s.emptySub, isDark && { color: '#94a3b8' }]}>
                {t('savedRoutes.emptySub')}
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

                    <View style={s.transportPill}>
                      <Text style={s.transportPillText}>{transportLabel}</Text>
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
  // —— mismos tokens que app/(tabs)/index.tsx (dashboard) ——
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
  logoIcon: { fontSize: 20, color: '#fff' },
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

  toolsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 24,
    marginBottom: 12,
  },
  toolsTitle: { fontSize: 20, fontWeight: '800', color: '#1f2937' },
  toolsCount: { fontSize: 10, color: '#9ca3af', fontWeight: '600' },

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

  actionsRow: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 12 },
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
