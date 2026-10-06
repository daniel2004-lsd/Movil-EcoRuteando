// app/(tabs)/stats.tsx
import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import {
  LineChart,
  BarChart,
  ProgressChart,
} from 'react-native-chart-kit';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { spacing } from '../../src/shared/theme';
import apiClient from '../../src/shared/services/apiClient';
import { useThemeMode } from '../../src/shared/store/ThemeContext';

const screenWidth = Dimensions.get('window').width;

export default function StatsScreen() {
  const router = useRouter();
  const { theme } = useThemeMode();
  const isDark = theme === 'dark';

  const insets = useSafeAreaInsets();

  const chartWidth = Math.min(screenWidth - 32, 900 - 32);

  const [liveStats, setLiveStats] = useState<any>(null);
  const fetchStats = useCallback(async () => {
    try {
      const { data } = await apiClient.get('/api/admin/stats');
      setLiveStats(data);
    } catch {}
    try {
      const { data } = await apiClient.get('/api/exports/trips', { params: { format: 'json' } });
      if (data?.items && !liveStats) setLiveStats((s:any) => s || { trips: data.items });
    } catch {}
  }, []);
  useEffect(() => { fetchStats(); }, [fetchStats]);

  // 1) Línea: CO₂ por mes
  const co2Data = {
    labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'],
    datasets: [
      {
        data: [3.2, 4.1, 5.0, 4.6, 6.2, 5.8],
        color: (opacity = 1) => `rgba(22, 163, 74, ${opacity})`,
        strokeWidth: 2,
      },
    ],
  };

  // 2) Barra vertical: número de trayectos
  const tripsData = {
    labels: ['Caminar', 'Taxi'],
    datasets: [{ data: [7, 5] }],
  };

  // 3) Anillo de progreso: tiempo relativo por modo
  const timeProgressData = {
    labels: ['Caminar', 'Taxi'],
    data: [0.61, 0.39],
  };

  // 4) Anillos eco vs carro (proporción de CO₂)
  const co2CompareProgressData = {
    labels: ['Ruta eco', 'Carro'],
    data: [0.21, 0.79], // 0.9 frente a 3.4 aprox
  };

  const baseChartConfig = {
    backgroundColor: '#0f172a',
    backgroundGradientFrom: isDark ? '#020617' : '#f9fafb',
    backgroundGradientTo: isDark ? '#020617' : '#f9fafb',
    decimalPlaces: 1,
    color: (opacity = 1) => `rgba(15, 118, 110, ${opacity})`,
    labelColor: (opacity = 1) =>
      isDark
        ? `rgba(226,232,240,${opacity})`
        : `rgba(71,85,105,${opacity})`,
    propsForBackgroundLines: {
      stroke: isDark
        ? 'rgba(51,65,85,0.6)'
        : 'rgba(203,213,225,0.7)',
      strokeDasharray: '4 6',
    },
  };

  const lineChartConfig = {
    ...baseChartConfig,
    propsForDots: {
      r: '3',
      strokeWidth: '2',
      stroke: '#16a34a',
    },
  };

  const barChartConfig = {
    ...baseChartConfig,
    barPercentage: 0.6,
  };

  const progressChartConfig = {
    ...baseChartConfig,
    decimalPlaces: 0,
  };

  return (
    <LinearGradient
      colors={
        isDark
          ? ['#022c22', '#064e3b', '#14532d']
          : ['#1a3d2b', '#2c5f3f', '#4a8f65']
      }
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
        <View style={s.circle1} />
        <View style={s.circle2} />
        <View style={s.circle3} />

        <ScrollView
          contentContainerStyle={s.scroll}
          showsVerticalScrollIndicator={false}
        >
          <View style={s.wrapper}>
            {/* Header con botón de volver */}
            <View style={[s.headerRow, { marginTop: -4 }]}>
              <View style={s.headerLeft}>
                <TouchableOpacity
                  style={s.backBtn}
                  onPress={() => router.back()}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons
                    name="arrow-back"
                    size={18}
                    color="#bbf7d0"
                  />
                  <Text style={s.backText}>Volver</Text>
                </TouchableOpacity>

                <View style={s.headerTextBlock}>
                  <Text style={s.title}>
                    Estadísticas de tu movilidad
                  </Text>
                  <Text style={s.subtitle}>
                    Visualiza tu impacto ecológico, tus hábitos de trayectos y
                    descarga tus datos para reportes.
                  </Text>
                </View>
              </View>

              <View style={s.exportIconRow}>
                <TouchableOpacity
                  style={s.exportIconBtn}
                  onPress={async () => {
                    try { const { data } = await apiClient.get('/api/exports/trips', { params: { format: 'pdf' }, responseType: 'blob' }); } catch {}
                  }}
                >
                  <Ionicons
                    name="document-text-outline"
                    size={18}
                    color="#022c22"
                  />
                </TouchableOpacity>

                <TouchableOpacity
                  style={s.exportIconBtn}
                  onPress={async () => {
                    try { const { data } = await apiClient.get('/api/exports/trips', { params: { format: 'xlsx' }, responseType: 'blob' }); } catch {}
                  }}
                >
                  <Ionicons
                    name="grid-outline"
                    size={18}
                    color="#022c22"
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Resumen rápido */}
            <View style={s.summaryRow}>
              <View style={s.summaryCard}>
                <Ionicons
                  name="leaf-outline"
                  size={20}
                  color="#16a34a"
                />
                <View style={s.summaryTextBlock}>
                  <Text style={s.summaryLabel}>
                    CO₂ evitado este mes
                  </Text>
                  <Text style={s.summaryValue}>{liveStats?.co2SavedKg ? `${Number(liveStats.co2SavedKg).toFixed(1)} kg` : '6.2 kg'}</Text>
                </View>
              </View>

              <View style={s.summaryCard}>
                <Ionicons
                  name="walk-outline"
                  size={20}
                  color="#2563eb"
                />
                <View style={s.summaryTextBlock}>
                  <Text style={s.summaryLabel}>
                    Trayectos ecológicos
                  </Text>
                  <Text style={s.summaryValue}>{liveStats?.totalTrips ?? 24}</Text>
                </View>
              </View>
            </View>

            {/* 1. Línea: CO₂ en el tiempo */}
            <View
              style={[
                s.chartCard,
                isDark && s.chartCardDark,
              ]}
            >
              <Text
                style={[
                  s.sectionTitle,
                  isDark && s.sectionTitleDark,
                ]}
              >
                CO₂ evitado por mes (kg)
              </Text>
              <Text
                style={[
                  s.sectionHelp,
                  isDark && s.sectionHelpDark,
                ]}
              >
                Seguimiento de cuánto CO₂ has dejado de emitir gracias a tus
                rutas sostenibles.
              </Text>

              <View style={s.chartWrapper}>
                <LineChart
                  data={co2Data}
                  width={chartWidth}
                  height={220}
                  chartConfig={lineChartConfig}
                  bezier
                  style={s.chart}
                />
              </View>
            </View>

            {/* 2. Barra vertical: distribución de trayectos */}
            <View
              style={[
                s.chartCard,
                isDark && s.chartCardDark,
              ]}
            >
              <Text
                style={[
                  s.sectionTitle,
                  isDark && s.sectionTitleDark,
                ]}
              >
                Distribución de trayectos por modo
              </Text>
              <Text
                style={[
                  s.sectionHelp,
                  isDark && s.sectionHelpDark,
                ]}
              >
                Comparación de cuántos trayectos realizas
                caminando y en taxi.
              </Text>

              <View style={s.chartWrapper}>
                <BarChart
                  data={tripsData}
                  width={chartWidth}
                  height={220}
                  chartConfig={barChartConfig}
                  fromZero
                  showValuesOnTopOfBars
                  style={s.chart}
                />
              </View>
            </View>

            {/* 3. ProgressChart: tiempo relativo por modo */}
            <View
              style={[
                s.chartCard,
                isDark && s.chartCardDark,
              ]}
            >
              <Text
                style={[
                  s.sectionTitle,
                  isDark && s.sectionTitleDark,
                ]}
              >
                Tiempo relativo por modo
              </Text>
              <Text
                style={[
                  s.sectionHelp,
                  isDark && s.sectionHelpDark,
                ]}
              >
                Proporción aproximada del tiempo total que dedicas a cada modo
                de transporte.
              </Text>

              <View style={s.chartWrapperCenter}>
                <ProgressChart
                  data={timeProgressData}
                  width={chartWidth > 380 ? 320 : chartWidth - 16}
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
            <View
              style={[
                s.chartCard,
                isDark && s.chartCardDark,
              ]}
            >
              <Text
                style={[
                  s.sectionTitle,
                  isDark && s.sectionTitleDark,
                ]}
              >
                CO₂ por trayecto: eco vs carro
              </Text>
              <Text
                style={[
                  s.sectionHelp,
                  isDark && s.sectionHelpDark,
                ]}
              >
                Proporción de emisiones en una ruta promedio usando opciones
                eco frente a un carro particular.
              </Text>

              <View style={s.chartWrapperCenter}>
                <ProgressChart
                  data={co2CompareProgressData}
                  width={chartWidth > 380 ? 260 : chartWidth - 32}
                  height={200}
                  strokeWidth={12}
                  radius={32}
                  chartConfig={{
                    ...progressChartConfig,
                    color: (opacity = 1) =>
                      `rgba(22,163,74,${opacity})`,
                    labelColor: (opacity = 1) =>
                      isDark
                        ? `rgba(226,232,240,${opacity})`
                        : `rgba(30,64,175,${opacity})`,
                  }}
                  hideLegend={false}
                  style={s.chart}
                />
              </View>
            </View>

            {/* Detalle numérico */}
            <View
              style={[
                s.detailCard,
                isDark && s.detailCardDark,
              ]}
            >
              <Text
                style={[
                  s.sectionTitle,
                  isDark && s.sectionTitleDark,
                ]}
              >
                Resumen detallado (ejemplo)
              </Text>

              <View style={s.detailRow}>
                <Ionicons
                  name="car-outline"
                  size={18}
                  color="#f97316"
                />
                <View style={s.detailTextBlock}>
                  <Text style={s.detailLabel}>
                    Kilómetros en taxi
                  </Text>
                  <Text style={s.detailValue}>15.4 km</Text>
                </View>
              </View>

              <View style={s.detailRow}>
                <Ionicons
                  name="time-outline"
                  size={18}
                  color="#6b7280"
                />
                <View style={s.detailTextBlock}>
                  <Text style={s.detailLabel}>
                    Tiempo total en trayectos
                  </Text>
                  <Text style={s.detailValue}>18 h 24 min</Text>
                </View>
              </View>

              <Text
                style={[
                  s.sectionHelp,
                  isDark && s.sectionHelpDark,
                ]}
              >

              </Text>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  bg: { flex: 1 },
  safeArea: { flex: 1 },

  circle1: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(94,168,122,0.16)',
    top: -80,
    right: -80,
  },
  circle2: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(44,95,63,0.26)',
    bottom: 80,
    left: -60,
  },
  circle3: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(168,217,188,0.16)',
    top: 220,
    left: 20,
  },

  scroll: {
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
  },
  wrapper: {
    width: '100%',
    maxWidth: 900,
  },

  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  headerLeft: {
    flex: 1,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  backText: {
    fontFamily: 'Times New Roman',
    fontSize: 13,
    color: '#bbf7d0',
  },
  headerTextBlock: {
    flex: 1,
  },
  title: {
    fontFamily: 'Times New Roman',
    fontSize: 24,
    color: '#f9fafb',
  },
  subtitle: {
    fontFamily: 'Times New Roman',
    fontSize: 13,
    color: 'rgba(241,245,249,0.9)',
    marginTop: 4,
    lineHeight: 18,
    textAlign: 'left',
  },
  exportIconRow: {
    flexDirection: 'row',
    gap: 6,
  },
  exportIconBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(249,250,251,0.96)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.6)',
  },

  summaryRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: spacing.md,
  },
  summaryCard: {
    flex: 1,
    borderRadius: 18,
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(249,250,251,0.92)',
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.35)',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  summaryTextBlock: { flex: 1 },
  summaryLabel: {
    fontFamily: 'Times New Roman',
    fontSize: 11,
    color: '#4b5563',
  },
  summaryValue: {
    fontFamily: 'Times New Roman',
    fontSize: 16,
    color: '#022c22',
  },

  chartCard: {
    borderRadius: 22,
    backgroundColor: '#f9fafb',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.35)',
  },
  chartCardDark: {
    backgroundColor: 'rgba(15,23,23,0.97)',
    borderColor: 'rgba(148,163,184,0.4)',
  },
  sectionTitle: {
    fontFamily: 'Times New Roman',
    fontSize: 17,
    color: '#0f172a',
    marginBottom: 4,
  },
  sectionTitleDark: { color: '#e5f9f0' },
  sectionHelp: {
    fontFamily: 'Times New Roman',
    fontSize: 12,
    color: '#6b7280',
    marginBottom: spacing.sm,
  },
  sectionHelpDark: { color: '#9ca3af' },

  chartWrapper: {
    width: '100%',
    overflow: 'hidden',
    borderRadius: 16,
  },
  chartWrapperCenter: {
    width: '100%',
    alignItems: 'center',
    overflow: 'hidden',
    borderRadius: 16,
  },
  chart: {
    borderRadius: 16,
  },

  detailCard: {
    borderRadius: 22,
    backgroundColor: '#ecfdf5',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  detailCardDark: {
    backgroundColor: 'rgba(15,23,23,0.97)',
  },
  detailRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    marginTop: 6,
  },
  detailTextBlock: { flex: 1 },
  detailLabel: {
    fontFamily: 'Times New Roman',
    fontSize: 12,
    color: '#6b7280',
  },
  detailValue: {
    fontFamily: 'Times New Roman',
    fontSize: 13,
    color: '#0f172a',
  },
});