// app/(tabs)/stats.tsx — estilo dashboard (mismo look que Inicio / Historial / Favoritos)
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LineChart, BarChart, ProgressChart } from 'react-native-chart-kit';
import { useRouter, useFocusEffect } from 'expo-router';

import apiClient from '../../src/shared/services/apiClient';
import { useThemeMode } from '../../src/shared/store/ThemeContext';
import { useLanguage } from '../../src/shared/store/LanguageContext';
import { useAuth } from '../../src/shared/store/AuthContext';

const screenWidth = Dimensions.get('window').width;

export default function StatsScreen() {
  const router = useRouter();
  const { theme } = useThemeMode();
  const { t } = useLanguage();
  const isDark = theme === 'dark';

  const chartWidth = Math.min(screenWidth - 32, 900 - 32);

  const { auth } = useAuth();
  const isGuest = !!auth.guest;

  // Viajes reales del usuario (GET /api/trips).
  const [trips, setTrips] = useState<any[]>([]);
  const fetchStats = useCallback(async () => {
    if (isGuest) return;
    try {
      const { data } = await apiClient.get('/api/trips');
      const items: any[] = Array.isArray(data) ? data : (data?.items ?? []);
      setTrips(items.filter(x => x && (x.usageId || x.id)));
    } catch (e: any) {
      console.warn('[stats] error:', e?.message, e?.response?.status);
    }
  }, [isGuest]);

  // Recarga cada vez que entras a la pantalla.
  useFocusEffect(
    useCallback(() => {
      fetchStats();
    }, [fetchStats])
  );

  // Helpers sobre los viajes reales
  const modeOf = (x: any) => String(x?.transportMode ?? '').toLowerCase();
  const kmOf = (x: any) => Number(x?.actualDistanceKm ?? 0) || 0;
  const minOf = (x: any) => Number(x?.actualDurationMin ?? 0) || 0;
  const co2Of = (x: any) => Number(x?.actualCo2Kg ?? 0) || 0;
  const hasTrips = trips.length > 0;

  const walkList = trips.filter(x => modeOf(x) === 'walking' || modeOf(x) === 'walk');
  const bikeList = trips.filter(x => modeOf(x) === 'bike' || modeOf(x) === 'bicycle');
  const carList = trips.filter(x => modeOf(x) === 'car' || modeOf(x) === 'driving' || modeOf(x) === 'taxi');

  const taxiKm = carList.reduce((a, x) => a + kmOf(x), 0);
  const totalMin = trips.reduce((a, x) => a + minOf(x), 0);
  const modeLabels = [t('stats.modeWalk'), t('savedRoutes.transport.bike'), t('stats.modeCar')];

  // 1) Línea: CO₂ de los últimos 6 meses (datos del usuario)
  const MONTH_KEYS = ['stats.jan','stats.feb','stats.mar','stats.apr','stats.may','stats.jun',
                      'stats.jul','stats.aug','stats.sep','stats.oct','stats.nov','stats.dec'];
  const now = new Date();
  const lastMonths = Array.from({ length: 6 }, (_, i) => new Date(now.getFullYear(), now.getMonth() - (5 - i), 1));
  const monthCo2 = lastMonths.map(d =>
    trips
      .filter(x => { const s = new Date(x?.startedAt ?? 0); return s.getFullYear() === d.getFullYear() && s.getMonth() === d.getMonth(); })
      .reduce((a, x) => a + co2Of(x), 0)
  );
  const thisMonthCo2 = monthCo2[monthCo2.length - 1] || 0;

  const co2Data = {
    labels: lastMonths.map(d => t(MONTH_KEYS[d.getMonth()])),
    datasets: [
      {
        data: monthCo2.map(v => Number(v.toFixed(2))),
        color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})`,
        strokeWidth: 2,
      },
    ],
  };

  // 2) Barra vertical: trayectos por modo
  const tripsData = {
    labels: modeLabels,
    datasets: [{ data: [walkList.length, bikeList.length, carList.length] }],
  };

  // 3) Anillo de progreso: tiempo relativo por modo
  const modeMin = [walkList, bikeList, carList].map(list => list.reduce((a, x) => a + minOf(x), 0));
  const sumMin = modeMin.reduce((a, b) => a + b, 0);
  const timeProgressData = {
    labels: modeLabels,
    data: sumMin > 0 ? modeMin.map(m => m / sumMin) : [0, 0, 0],
  };

  // 4) Anillos eco vs carro (proporción de CO₂)
  const ecoCo2 = [...walkList, ...bikeList].reduce((a, x) => a + co2Of(x), 0);
  const carCo2 = carList.reduce((a, x) => a + co2Of(x), 0);
  const sumCo2 = ecoCo2 + carCo2;
  const co2CompareProgressData = {
    labels: [t('stats.routeEco'), t('stats.modeCar')],
    data: sumCo2 > 0 ? [ecoCo2 / sumCo2, carCo2 / sumCo2] : [0, 0],
  };

  const baseChartConfig = {
    backgroundColor: '#ffffff',
    backgroundGradientFrom: isDark ? '#1f2937' : '#ffffff',
    backgroundGradientTo: isDark ? '#1f2937' : '#ffffff',
    decimalPlaces: 1,
    color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})`,
    labelColor: (opacity = 1) =>
      isDark ? `rgba(226,232,240,${opacity})` : `rgba(107,114,128,${opacity})`,
    propsForBackgroundLines: {
      stroke: isDark ? 'rgba(51,65,85,0.6)' : 'rgba(209,213,219,0.7)',
      strokeDasharray: '4 6',
    },
  };

  const lineChartConfig = {
    ...baseChartConfig,
    propsForDots: { r: '3', strokeWidth: '2', stroke: '#10b981' },
  };

  const barChartConfig = { ...baseChartConfig, barPercentage: 0.6 };
  const progressChartConfig = { ...baseChartConfig, decimalPlaces: 0 };

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
            {t('stats.title')}
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
        {/* Resumen rápido */}
        <View style={[s.card, isDark && s.cardDark]}>
          <Text style={[s.cardTitle, isDark && { color: '#e2e8f0' }]}>{t('stats.subtitle')}</Text>

          <View style={s.statsGrid}>
            <View style={[s.statCard, isDark && s.statCardDark]}>
              <View style={[s.statIcon, { backgroundColor: 'rgba(16,185,129,0.15)' }]}>
                <Ionicons name="leaf" size={20} color="#10b981" />
              </View>
              <Text style={[s.statValue, isDark && { color: '#e2e8f0' }]}>
                {hasTrips ? `${thisMonthCo2.toFixed(1)} kg` : '—'}
              </Text>
              <Text style={[s.statLabel, isDark && { color: '#94a3b8' }]}>{t('stats.co2ThisMonth')}</Text>
            </View>

            <View style={[s.statCard, isDark && s.statCardDark]}>
              <View style={[s.statIcon, { backgroundColor: 'rgba(59,130,246,0.15)' }]}>
                <Ionicons name="walk-outline" size={20} color="#3b82f6" />
              </View>
              <Text style={[s.statValue, isDark && { color: '#e2e8f0' }]}>
                {hasTrips ? trips.length : '—'}
              </Text>
              <Text style={[s.statLabel, isDark && { color: '#94a3b8' }]}>{t('stats.ecoTrips')}</Text>
            </View>
          </View>
        </View>

        {/* 1. Línea: CO₂ en el tiempo */}
        <View style={[s.chartCard, isDark && s.chartCardDark]}>
          <Text style={[s.sectionTitle, isDark && s.sectionTitleDark]}>{t('stats.co2PerMonth')}</Text>
          <Text style={[s.sectionHelp, isDark && s.sectionHelpDark]}>{t('stats.co2PerMonthDesc')}</Text>
          <View style={s.chartWrapper}>
            <LineChart
              data={co2Data}
              width={chartWidth - 32}
              height={220}
              chartConfig={lineChartConfig}
              bezier
              style={s.chart}
            />
          </View>
        </View>

        {/* 2. Barra vertical: distribución de trayectos */}
        <View style={[s.chartCard, isDark && s.chartCardDark]}>
          <Text style={[s.sectionTitle, isDark && s.sectionTitleDark]}>{t('stats.modeDistribution')}</Text>
          <Text style={[s.sectionHelp, isDark && s.sectionHelpDark]}>{t('stats.modeDistributionDesc')}</Text>
          <View style={s.chartWrapper}>
            <BarChart
              data={tripsData}
              width={chartWidth - 32}
              height={220}
              chartConfig={barChartConfig}
              yAxisLabel=""
              yAxisSuffix=""
              fromZero
              showValuesOnTopOfBars
              style={s.chart}
            />
          </View>
        </View>

        {/* 3. ProgressChart: tiempo relativo por modo */}
        <View style={[s.chartCard, isDark && s.chartCardDark]}>
          <Text style={[s.sectionTitle, isDark && s.sectionTitleDark]}>{t('stats.timePerMode')}</Text>
          <Text style={[s.sectionHelp, isDark && s.sectionHelpDark]}>{t('stats.timePerModeDesc')}</Text>
          <View style={s.chartWrapperCenter}>
            <ProgressChart
              data={timeProgressData}
              width={chartWidth > 380 ? 320 : chartWidth - 48}
              height={220}
              strokeWidth={10}
              radius={40}
              chartConfig={progressChartConfig}
              hideLegend={false}
              style={s.chart}
            />
          </View>
        </View>

        {/* 4. ProgressChart: eco vs carro */}
        <View style={[s.chartCard, isDark && s.chartCardDark]}>
          <Text style={[s.sectionTitle, isDark && s.sectionTitleDark]}>{t('stats.co2PerTrip')}</Text>
          <Text style={[s.sectionHelp, isDark && s.sectionHelpDark]}>{t('stats.co2PerTripDesc')}</Text>
          <View style={s.chartWrapperCenter}>
            <ProgressChart
              data={co2CompareProgressData}
              width={chartWidth > 380 ? 260 : chartWidth - 48}
              height={200}
              strokeWidth={12}
              radius={32}
              chartConfig={{
                ...progressChartConfig,
                color: (opacity = 1) => `rgba(16,185,129,${opacity})`,
              }}
              hideLegend={false}
              style={s.chart}
            />
          </View>
        </View>

        {/* Detalle numérico */}
        <View style={[s.detailCard, isDark && s.detailCardDark]}>
          <Text style={[s.sectionTitle, isDark && s.sectionTitleDark]}>{t('stats.detailedSummary')}</Text>

          <View style={s.detailRow}>
            <View style={[s.detailIcon, { backgroundColor: 'rgba(249,115,22,0.15)' }]}>
              <Ionicons name="car-outline" size={18} color="#f97316" />
            </View>
            <View style={s.detailTextBlock}>
              <Text style={[s.detailLabel, isDark && { color: '#94a3b8' }]}>{t('stats.taxiKm')}</Text>
              <Text style={[s.detailValue, isDark && { color: '#e2e8f0' }]}>
                {hasTrips ? `${taxiKm.toFixed(1)} km` : '—'}
              </Text>
            </View>
          </View>

          <View style={s.detailRow}>
            <View style={[s.detailIcon, { backgroundColor: 'rgba(16,185,129,0.15)' }]}>
              <Ionicons name="time-outline" size={18} color="#10b981" />
            </View>
            <View style={s.detailTextBlock}>
              <Text style={[s.detailLabel, isDark && { color: '#94a3b8' }]}>{t('stats.totalTime')}</Text>
              <Text style={[s.detailValue, isDark && { color: '#e2e8f0' }]}>
                {hasTrips ? `${Math.floor(totalMin / 60)} h ${Math.round(totalMin % 60)} min` : '—'}
              </Text>
            </View>
          </View>
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

  scroll: { padding: 16, paddingBottom: 100, gap: 16 },

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
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#1f2937', marginBottom: 4 },
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

  chartCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: '#dcfce7',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  chartCardDark: { backgroundColor: '#162329', borderColor: '#26383D' },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#1f2937', marginBottom: 4 },
  sectionTitleDark: { color: '#e2e8f0' },
  sectionHelp: { fontSize: 12, color: '#6b7280', marginBottom: 12 },
  sectionHelpDark: { color: '#94a3b8' },

  chartWrapper: { width: '100%', overflow: 'hidden', borderRadius: 16, alignItems: 'center' },
  chartWrapperCenter: {
    width: '100%',
    alignItems: 'center',
    overflow: 'hidden',
    borderRadius: 16,
  },
  chart: { borderRadius: 16 },

  detailCard: {
    backgroundColor: '#ecfdf5',
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: '#dcfce7',
  },
  detailCardDark: { backgroundColor: 'rgba(11,18,21,0.4)', borderColor: '#26383D' },
  detailRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    marginTop: 12,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  detailIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailTextBlock: { flex: 1 },
  detailLabel: { fontSize: 11, color: '#6b7280' },
  detailValue: { fontSize: 15, fontWeight: '700', color: '#111827', marginTop: 2 },
});
