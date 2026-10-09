// app/(tabs)/history.tsx — estilo dashboard (mismo look que Inicio / Mis rutas / Favoritos)
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

type Trip = {
  id: string;
  originAddress: string;
  destinationAddress: string;
  transportMode: string;
  co2SavedKg: number;
  startedAt: string;
  distanceMeters: number;
};

export default function HistoryScreen() {
  const router = useRouter();
  const { auth } = useAuth();
  const { theme } = useThemeMode();
  const { t, t: tr } = useLanguage();
  const isDark = theme === 'dark';

  const isGuest = !!auth.guest;

  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const fetchTrips = useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const { data } = await apiClient.get('/api/trips');
      const items: any[] = Array.isArray(data) ? data : data?.items ?? [];
      console.log('[history] items:', items.length);
      setTrips(
        items
          .filter(t => t && (t.usageId || t.id))
          .map((t, i) => {
            const name: string = t.routeName || '';
            const parts = name.split(/\s*→\s*/);
            return {
              id: t.usageId ?? t.id ?? `trip-${i}`,
              originAddress: t.originAddress ?? (parts[0] || name || tr('history.origin')),
              destinationAddress: t.destinationAddress ?? (parts[1] || tr('history.destination')),
              transportMode: t.transportMode ?? 'car',
              co2SavedKg: t.actualCo2Kg ?? t.co2SavedKg ?? 0,
              startedAt: t.startedAt ?? new Date().toISOString(),
              distanceMeters:
                t.actualDistanceKm != null ? t.actualDistanceKm * 1000 : (t.distanceMeters ?? 0),
            };
          })
      );
    } catch (e: any) {
      console.warn('[history] error:', e?.message, e?.response?.status);
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  // Recarga cada vez que entras a la pantalla: así siempre ves los viajes nuevos.
  useFocusEffect(
    useCallback(() => {
      // Invitado: nunca llamamos a la API (no hay sesión propia que mostrar).
      if (isGuest) {
        setLoading(false);
        return;
      }
      fetchTrips();
    }, [fetchTrips, isGuest])
  );

  const totalCo2 = trips.reduce((sum, t) => sum + (t.co2SavedKg ?? 0), 0);

  const handleExportPDF = () => console.log('Exportar historial a PDF');
  const handleExportExcel = () => console.log('Exportar historial a Excel');

  const modeLabel = (mode: string) => t(`savedRoutes.transport.${mode}`);
  const fmtDate = (iso: string) => {
    const d = new Date(iso);
    return isNaN(d.getTime()) ? '' : d.toLocaleDateString();
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
          <Text style={[s.headerTitle, isDark && { color: '#e2e8f0' }]} numberOfLines={1}>
            {t('history.title')}
          </Text>
        </View>

        <TouchableOpacity
          style={[s.pillBtn, isDark && { backgroundColor: '#162329', borderColor: '#26383D' }]}
          onPress={() => router.replace('/(tabs)')}
        >
          <Ionicons name="home-outline" size={16} color={isDark ? '#e2e8f0' : '#4b5563'} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        {isGuest ? (
          <AccountRequired action={t('history.title')} />
        ) : (
          <>
            {/* Resumen + export */}
            <View style={[s.card, isDark && s.cardDark]}>
              <Text style={[s.cardTitle, isDark && { color: '#e2e8f0' }]}>
                {t('history.tripsRegistered')}
              </Text>

              <View style={s.statsGrid}>
                <View style={[s.statCard, isDark && s.statCardDark]}>
                  <View style={[s.statIcon, { backgroundColor: 'rgba(16,185,129,0.15)' }]}>
                    <Ionicons name="trail-sign-outline" size={20} color="#10b981" />
                  </View>
                  <Text style={[s.statValue, isDark && { color: '#e2e8f0' }]}>
                    {loading ? '...' : trips.length}
                  </Text>
                  <Text style={[s.statLabel, isDark && { color: '#94a3b8' }]}>
                    {t('history.tripsRegistered')}
                  </Text>
                </View>

                <View style={[s.statCard, isDark && s.statCardDark]}>
                  <View style={[s.statIcon, { backgroundColor: 'rgba(16,185,129,0.15)' }]}>
                    <Ionicons name="leaf" size={20} color="#10b981" />
                  </View>
                  <Text style={[s.statValue, isDark && { color: '#e2e8f0' }]}>
                    {loading ? '...' : `${totalCo2.toFixed(1)} kg`}
                  </Text>
                  <Text style={[s.statLabel, isDark && { color: '#94a3b8' }]}>
                    {t('history.totalCO2')}
                  </Text>
                </View>
              </View>

              <View style={s.exportRow}>
                <TouchableOpacity style={s.exportBtnPdf} onPress={handleExportPDF}>
                  <Ionicons name="document-text-outline" size={16} color="#fff" />
                  <Text style={s.exportBtnPdfText}>{t('history.exportPdf')}</Text>
                </TouchableOpacity>

                <TouchableOpacity style={s.exportBtnExcel} onPress={handleExportExcel}>
                  <Ionicons name="download-outline" size={16} color="#166534" />
                  <Text style={s.exportBtnExcelText}>{t('history.exportExcel')}</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Lista */}
            <View style={s.list}>
              {loading ? (
                <ActivityIndicator color="#10b981" size="large" style={{ marginTop: 40 }} />
              ) : loadError ? (
                <View style={[s.card, isDark && s.cardDark, s.emptyBox]}>
                  <Ionicons name="cloud-offline-outline" size={44} color={isDark ? '#4b5563' : '#d1d5db'} />
                  <Text style={[s.emptyText, isDark && { color: '#94a3b8' }]}>
                    {t('savedRoutes.loadError')}
                  </Text>
                  <TouchableOpacity style={s.retryBtn} onPress={fetchTrips}>
                    <Ionicons name="refresh" size={14} color="#ffffff" />
                    <Text style={s.retryBtnText}>{t('savedRoutes.retry')}</Text>
                  </TouchableOpacity>
                </View>
              ) : trips.length === 0 ? (
                <View style={[s.card, isDark && s.cardDark, s.emptyBox]}>
                  <Ionicons name="time-outline" size={44} color={isDark ? '#4b5563' : '#d1d5db'} />
                  <Text style={[s.emptyText, isDark && { color: '#94a3b8' }]}>
                    {t('history.empty')}
                  </Text>
                </View>
              ) : (
                trips.map((trip, index) => (
                  <View key={trip.id} style={s.tripRowWrapper}>
                    <View style={s.timelineCol}>
                      <View style={s.timelineCircle} />
                      {index < trips.length - 1 && <View style={s.timelineLine} />}
                    </View>

                    <View style={[s.tripCard, isDark && s.tripCardDark]}>
                      <View style={s.tripHeaderRow}>
                        <View style={s.tripTitleBlock}>
                          <Text style={[s.tripTitle, isDark && { color: '#e2e8f0' }]} numberOfLines={2}>
                            {trip.originAddress}
                          </Text>
                          <View style={s.tripArrowRow}>
                            <Ionicons name="arrow-forward-outline" size={14} color="#6b7280" />
                            <Text style={[s.tripTitleDest, isDark && { color: '#94a3b8' }]} numberOfLines={2}>
                              {trip.destinationAddress}
                            </Text>
                          </View>
                        </View>

                        <Text style={[s.tripDate, isDark && { color: '#94a3b8' }]}>
                          {fmtDate(trip.startedAt)}
                        </Text>
                      </View>

                      <View style={s.tripMetaRow}>
                        <View style={s.chip}>
                          <Ionicons
                            name={trip.transportMode?.toLowerCase() === 'walking' ? 'walk-outline' : 'car-outline'}
                            size={14}
                            color="#065f46"
                          />
                          <Text style={s.chipText}>{modeLabel(trip.transportMode)}</Text>
                        </View>

                        <View style={s.co2Pill}>
                          <Ionicons name="cloud-outline" size={14} color="#10b981" />
                          <Text style={s.co2Text}>{`${(trip.co2SavedKg ?? 0).toFixed(1)} kg`}</Text>
                        </View>
                      </View>
                    </View>
                  </View>
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

  scroll: { padding: 16, paddingBottom: 100 },

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
  cardTitle: { fontSize: 20, fontWeight: '800', color: '#1f2937', marginBottom: 4 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 12 },
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

  exportRow: { flexDirection: 'row', gap: 8, marginTop: 16, flexWrap: 'wrap' },
  exportBtnPdf: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: '#1f2937',
  },
  exportBtnPdfText: { fontSize: 12, fontWeight: '700', color: '#f9fafb' },
  exportBtnExcel: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#16a34a',
  },
  exportBtnExcelText: { fontSize: 12, fontWeight: '700', color: '#166534' },

  list: { marginTop: 16, gap: 12 },
  emptyBox: { alignItems: 'center', paddingVertical: 32 },
  emptyText: { fontSize: 14, color: '#6b7280', marginTop: 12, textAlign: 'center' },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 14,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 999,
    backgroundColor: '#10b981',
  },
  retryBtnText: { fontSize: 12, fontWeight: '700', color: '#ffffff' },

  tripRowWrapper: { flexDirection: 'row', alignItems: 'stretch' },
  timelineCol: { width: 24, alignItems: 'center' },
  timelineCircle: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#dcfce7',
    borderWidth: 2,
    borderColor: '#10b981',
    marginTop: 18,
  },
  timelineLine: {
    flex: 1,
    width: 2,
    backgroundColor: '#d1d5db',
    marginTop: 2,
    marginBottom: 14,
  },

  tripCard: {
    flex: 1,
    borderRadius: 20,
    padding: 16,
    marginLeft: 4,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#f3f4f6',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  tripCardDark: { backgroundColor: '#1f2937', borderColor: '#26383D' },
  tripHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 4,
  },
  tripTitleBlock: { flex: 1 },
  tripTitle: { fontSize: 14, fontWeight: '700', color: '#111827' },
  tripArrowRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  tripTitleDest: { fontSize: 13, color: '#4b5563', flexShrink: 1 },
  tripDate: { fontSize: 11, color: '#6b7280', textAlign: 'right' },

  tripMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    flexWrap: 'wrap',
    gap: 8,
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
  co2Pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  co2Text: { fontSize: 11, fontWeight: '600', color: '#047857' },
});
