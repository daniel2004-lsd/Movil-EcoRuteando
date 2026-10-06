import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
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
  const { t, t: tr } = useLanguage();

  const userEmail = auth.email ?? 'usuario@ecoruteando.com';
  const insets = useSafeAreaInsets();

  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTrips = useCallback(async () => {
    try {
      const { data } = await apiClient.get('/api/trips');
      const items: any[] = Array.isArray(data) ? data : data?.items ?? [];
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
                t.actualDistanceKm != null
                  ? t.actualDistanceKm * 1000
                  : (t.distanceMeters ?? 0),
            };
          })
      );
    } catch {} finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTrips();
  }, [fetchTrips]);

  const totalCo2 = trips.reduce((sum, t) => sum + (t.co2SavedKg ?? 0), 0);

  const handleExportPDF = () => {
    console.log('Exportar historial a PDF');
  };

  const handleExportExcel = () => {
    console.log('Exportar historial a Excel');
  };

  return (
    <LinearGradient
      colors={['#1a3d2b', '#2c5f3f', '#4a8f65']}
      style={s.bg}
    >
      <SafeAreaView style={[s.safeArea, { paddingTop: insets.top }]}>

        {/* Burbujas */}
        <View style={s.circle1} />
        <View style={s.circle2} />
        <View style={s.circle3} />

        <ScrollView contentContainerStyle={s.scroll}>
          <View style={s.wrapper}>

            {/* HEADER */}
            <View style={s.headerRow}>
              <TouchableOpacity
                style={s.backBtn}
                onPress={() => router.back()}
              >
                <Ionicons
                  name="arrow-back"
                  size={18}
                  color={colors.ecoMain}
                />
                <Text style={s.backText}>
                    {t('auth.back')}
                </Text>
              </TouchableOpacity>

              <View style={s.headerTextBlock}>
                <Text style={s.title}>
                  {t('history.title')}
                </Text>
                <Text style={s.subtitle}>
                  {userEmail}
                </Text>
              </View>
            </View>

            {/* RESUMEN + EXPORT */}
            <View style={s.topRow}>

              <View style={s.summaryRow}>
                <View style={s.summaryCard}>
                  <Ionicons name="trail-sign-outline" size={18} color="#047857" />
                  <View style={{ flex: 1 }}>
                    <Text style={s.summaryLabel}>
                      {t('history.tripsRegistered')}
                    </Text>
                    <Text style={s.summaryNumber}>
                      {loading ? '...' : trips.length}
                    </Text>
                  </View>
                </View>

                <View style={s.summaryCard}>
                  <Ionicons name="leaf-outline" size={18} color="#16a34a" />
                  <View style={{ flex: 1 }}>
                    <Text style={s.summaryLabel}>
                      {t('history.totalCO2')}
                    </Text>
                    <Text style={s.summaryNumber}>
                      {loading ? '...' : `${totalCo2.toFixed(1)} kg`}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={s.exportCol}>
                <TouchableOpacity
                  style={s.exportBtnPdf}
                  onPress={handleExportPDF}
                >
                  <Ionicons name="document-text-outline" size={16} color="#fff" />
                  <Text style={s.exportBtnPdfText}>
                    {t('history.exportPdf')}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={s.exportBtnExcel}
                  onPress={handleExportExcel}
                >
                  <Ionicons name="download-outline" size={16} color="#166534" />
                  <Text style={s.exportBtnExcelText}>
                    {t('history.exportExcel')}
                  </Text>
                </TouchableOpacity>
              </View>

            </View>

            {/* LISTA */}
            <View style={s.list}>
              {loading ? (
                <ActivityIndicator color="#fff" size="large" style={{ marginTop: 40 }} />
              ) : trips.length === 0 ? (
                <View style={{ alignItems: 'center', marginTop: 40 }}>
                  <Ionicons name="time-outline" size={48} color="rgba(255,255,255,0.5)" />
                  <Text style={{ color: 'rgba(255,255,255,0.7)', marginTop: 12, fontFamily: 'Times New Roman' }}>
                    {t('history.empty')}
                  </Text>
                </View>
              ) : trips.map((trip, index) => (
                <View key={trip.id} style={s.tripRowWrapper}>

                  <View style={s.timelineCol}>
                    <View style={s.timelineCircle} />
                    {index < trips.length - 1 && (
                      <View style={s.timelineLine} />
                    )}
                  </View>

                  <View style={s.tripCard}>

                    <View style={s.tripHeaderRow}>
                      <View style={s.tripTitleBlock}>
                        <Text style={s.tripTitle}>
                          {trip.originAddress}
                        </Text>

                        <View style={s.tripArrowRow}>
                          <Ionicons
                            name="arrow-forward-outline"
                            size={14}
                            color="#6b7280"
                          />
                          <Text style={s.tripTitleDest}>
                            {trip.destinationAddress}
                          </Text>
                        </View>
                      </View>

                      <Text style={s.tripDate}>
                        {new Date(trip.startedAt).toLocaleDateString()}
                      </Text>
                    </View>

                    <View style={s.tripMetaRow}>
                      <View style={s.chip}>
                        <Ionicons name={trip.transportMode?.toLowerCase() === 'walking' ? 'walk-outline' : 'car-outline'} size={14} color="#065f46" />
                        <Text style={s.chipText}>
                          {trip.transportMode}
                        </Text>
                      </View>

                      <View style={s.co2Pill}>
                        <Ionicons name="cloud-outline" size={14} color="#16a34a" />
                        <Text style={s.co2Text}>
                          {`${(trip.co2SavedKg ?? 0).toFixed(1)} kg`}
                        </Text>
                      </View>
                    </View>

                    <View style={s.tripFooterRow}>
                      <TouchableOpacity style={s.linkBtn}>
                        <Ionicons
                          name="map-outline"
                          size={14}
                          color="#047857"
                        />
                        <Text style={s.linkText}>
                          {t('history.viewDetails')}
                        </Text>
                      </TouchableOpacity>
                    </View>

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
    width: 200,
    height: 200,
    borderRadius: 100,
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
    paddingTop: spacing.sm,
    // Deja pasar la última tarjeta por encima de la barra de pestañas (60px).
    paddingBottom: 100,
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
    marginTop: -4,
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

  /* nueva fila top: resumen + export */
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  summaryRow: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
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

  exportCol: {
    width: 130,
    gap: 8,
  },
  exportBtnPdf: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: '#1f2937',
  },
  exportBtnPdfText: {
    fontFamily: 'Times New Roman',
    fontSize: 12,
    color: '#f9fafb',
  },
  exportBtnExcel: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#16a34a',
  },
  exportBtnExcelText: {
    fontFamily: 'Times New Roman',
    fontSize: 12,
    color: '#166534',
  },

  list: {
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  tripRowWrapper: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  timelineCol: {
    width: 24,
    alignItems: 'center',
  },
  timelineCircle: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#bbf7d0',
    borderWidth: 2,
    borderColor: '#16a34a',
    marginTop: spacing.md,
  },
  timelineLine: {
    flex: 1,
    width: 2,
    backgroundColor: 'rgba(163,230,207,0.8)',
    marginTop: 2,
    marginBottom: spacing.md,
  },

  tripCard: {
    flex: 1,
    borderRadius: 18,
    padding: spacing.md,
    marginLeft: 4,
    backgroundColor: 'rgba(249,250,251,0.98)',
    borderWidth: 1,
    borderColor: 'rgba(209,213,219,0.8)',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  tripHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  tripTitleBlock: {
    flex: 1,
  },
  tripTitle: {
    fontFamily: 'Times New Roman',
    fontSize: 14,
    color: '#111827',
  },
  tripArrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  tripTitleDest: {
    fontFamily: 'Times New Roman',
    fontSize: 13,
    color: '#4b5563',
  },
  tripDate: {
    fontFamily: 'Times New Roman',
    fontSize: 11,
    color: '#6b7280',
    textAlign: 'right',
  },

  tripMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xs,
    flexWrap: 'wrap',
    gap: 8,
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

  tripFooterRow: {
    marginTop: spacing.sm,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  linkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  linkText: {
    fontFamily: 'Times New Roman',
    fontSize: 11,
    color: '#047857',
    textDecorationLine: 'underline',
  },
});