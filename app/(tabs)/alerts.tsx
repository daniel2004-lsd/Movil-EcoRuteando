// app/(tabs)/alerts.tsx — Alertas climáticas (estilo dashboard)
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
import * as Location from 'expo-location';

import { useAuth } from '../../src/shared/store/AuthContext';
import { useThemeMode } from '../../src/shared/store/ThemeContext';
import { useLanguage } from '../../src/shared/store/LanguageContext';
import { AccountRequired } from '../../src/shared/components/ui/AccountRequired';
import {
  checkAlertsAt,
  ensureNotificationPermission,
  sendTestClimateAlert,
  startClimateAlertWatcher,
  type ClimateAlert,
} from '../../src/shared/services/climateAlerts';

const FORECAST_ICONS: Record<string, string> = {
  SUNNY: '☀️',
  CLOUDY: '☁️',
  PARTLY_CLOUDY: '⛅',
  RAIN: '🌧️',
  THUNDERSTORM: '⛈️',
  OVERCAST: '☁️',
  MOSTLY_CLOUDY: '⛅',
  PARTLY_SUNNY: '⛅',
  SHOWERS: '🌧️',
};
const mapConditionIcon = (c?: string) => FORECAST_ICONS[String(c ?? '').toUpperCase()] || '🌤️';

const LOCALES: Record<string, string> = { es: 'es-CO', en: 'en-US', fr: 'fr-FR', pt: 'pt-BR' };

export default function AlertsScreen() {
  const router = useRouter();
  const { auth } = useAuth();
  const { theme } = useThemeMode();
  const { t, lang } = useLanguage();
  const isDark = theme === 'dark';

  const isGuest = !!auth.guest;

  const [alerts, setAlerts] = useState<ClimateAlert[]>([]);
  const [weather, setWeather] = useState<any | null>(null);
  const [forecast, setForecast] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [notifOk, setNotifOk] = useState(true);

  // Posición lo más rápido posible: última conocida si es reciente,
  // si no, GPS fresco con tope de 4 s (el GPS frío puede tardar mucho).
  const getFastPosition = async () => {
    const last = await Location.getLastKnownPositionAsync().catch(() => null);
    if (last && Date.now() - last.timestamp < 10 * 60_000) return last;
    const fresh = await Promise.race([
      Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }).catch(() => null),
      new Promise<null>(r => setTimeout(() => r(null), 4_000)),
    ]);
    if (fresh) return fresh;
    if (last) return last;
    throw new Error('no-position');
  };

  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      let perm = await Location.getForegroundPermissionsAsync();
      if (perm.status !== 'granted') {
        perm = await Location.requestForegroundPermissionsAsync();
      }
      if (perm.status !== 'granted') {
        setLoadError(t('alerts.permLocation'));
        setAlerts([]);
        return;
      }
      const pos = await getFastPosition();
      const res = await checkAlertsAt(pos.coords.latitude, pos.coords.longitude);
      setAlerts(res.alerts);
      setWeather(res.weather);
      setForecast(res.forecast);
      // Arranca la vigilancia en vivo (notifica al entrar a una zona).
      startClimateAlertWatcher().catch(() => {});
      ensureNotificationPermission().then(setNotifOk);
    } catch (e: any) {
      console.warn('[alerts] error:', e?.message, e?.response?.status);
      setLoadError(t('alerts.locationError'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useFocusEffect(
    useCallback(() => {
      if (isGuest) {
        setLoading(false);
        return;
      }
      fetchAlerts();
    }, [fetchAlerts, isGuest])
  );

  const severityLabel = (sev?: string) => {
    const k = String(sev ?? '').toLowerCase();
    if (k === 'minor') return 'Leve';
    if (k === 'moderate') return 'Moderada';
    if (k === 'severe') return 'Severa';
    if (k === 'extreme') return 'Extrema';
    return sev ?? '';
  };

  const severityColor = (sev?: string) => {
    const k = String(sev ?? '').toLowerCase();
    if (k === 'extreme' || k === 'severe') return { bg: 'rgba(239,68,68,0.12)', fg: '#ef4444' };
    if (k === 'moderate') return { bg: 'rgba(245,158,11,0.14)', fg: '#d97706' };
    return { bg: 'rgba(16,185,129,0.12)', fg: '#047857' };
  };

  const fmtDate = (iso?: string) => {
    if (!iso) return '';
    const d = new Date(iso);
    return isNaN(d.getTime()) ? '' : d.toLocaleString();
  };

  // Datos del clima actual (igual que la web)
  const temp = weather ? Math.round(weather.temperatureC) : null;
  const feels = weather ? Math.round(weather.feelsLikeC) : null;
  const condition = weather?.conditionDescription || weather?.condition || '—';
  const conditionIcon = mapConditionIcon(weather?.condition);
  const highCount = alerts.filter(a =>
    ['severe', 'extreme'].includes(String(a?.severity ?? '').toLowerCase())
  ).length;
  const dayLabel = (dateStr: string) => {
    const d = new Date(`${String(dateStr).slice(0, 10)}T00:00:00`);
    if (isNaN(d.getTime())) return '';
    const s = d.toLocaleDateString(LOCALES[lang] ?? 'es-CO', { weekday: 'short' });
    return s.charAt(0).toUpperCase() + s.slice(1);
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
            {t('alerts.title')}
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
          <AccountRequired action={t('alerts.title')} />
        ) : (
          <>
            {/* Tarjeta del clima actual — como la web */}
            {weather ? (
              <View style={[s.card, isDark && s.cardDark]}>
                <View style={s.weatherRow}>
                  <Text style={s.weatherIcon}>{conditionIcon}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[s.weatherCondition, isDark && { color: '#94a3b8' }]}>{condition}</Text>
                    <Text style={[s.weatherTemp, isDark && { color: '#e2e8f0' }]}>{temp}°C</Text>
                    <Text style={[s.weatherFeels, isDark && { color: '#94a3b8' }]}>
                      {t('alerts.feelsLike')}: {feels}°C
                    </Text>
                  </View>
                </View>

                <View style={s.weatherMiniRow}>
                  <View style={[s.weatherMini, isDark && s.weatherMiniDark]}>
                    <Text style={[s.weatherMiniLabel, isDark && { color: '#94a3b8' }]}>{t('alerts.humidity')}</Text>
                    <Text style={[s.weatherMiniValue, isDark && { color: '#e2e8f0' }]}>
                      {weather.relativeHumidity}%
                    </Text>
                  </View>
                  <View style={[s.weatherMini, isDark && s.weatherMiniDark]}>
                    <Text style={[s.weatherMiniLabel, isDark && { color: '#94a3b8' }]}>{t('alerts.wind')}</Text>
                    <Text style={[s.weatherMiniValue, isDark && { color: '#e2e8f0' }]}>
                      {Math.round(weather.windKmh)} km/h
                    </Text>
                  </View>
                </View>
              </View>
            ) : null}

            {/* Stats — como la web */}
            {weather ? (
              <View style={s.statsRow}>
                <View style={[s.statBox, isDark && s.statBoxDark]}>
                  <View style={[s.statIcon, { backgroundColor: 'rgba(16,185,129,0.15)' }]}>
                    <Ionicons name="warning-outline" size={16} color="#10b981" />
                  </View>
                  <Text style={[s.statLabel, isDark && { color: '#94a3b8' }]}>{t('alerts.statActiveAlerts')}</Text>
                  <Text style={[s.statValue, isDark && { color: '#e2e8f0' }]}>{alerts.length}</Text>
                </View>

                <View style={[s.statBox, isDark && s.statBoxDark]}>
                  <View style={[s.statIcon, { backgroundColor: 'rgba(239,68,68,0.12)' }]}>
                    <Ionicons name="alert-circle-outline" size={16} color="#ef4444" />
                  </View>
                  <Text style={[s.statLabel, isDark && { color: '#94a3b8' }]}>{t('alerts.statMaxSeverity')}</Text>
                  <Text style={[s.statValue, isDark && { color: '#e2e8f0' }]}>{highCount}</Text>
                </View>

                <View style={[s.statBox, isDark && s.statBoxDark]}>
                  <View style={[s.statIcon, { backgroundColor: 'rgba(245,158,11,0.14)' }]}>
                    <Ionicons name="thermometer-outline" size={16} color="#f59e0b" />
                  </View>
                  <Text style={[s.statLabel, isDark && { color: '#94a3b8' }]}>{t('alerts.statTemperature')}</Text>
                  <Text style={[s.statValue, isDark && { color: '#e2e8f0' }]}>{temp}°C</Text>
                </View>
              </View>
            ) : null}

            {/* Pronóstico extendido — como la web */}
            {forecast.length > 0 ? (
              <View style={[s.card, isDark && s.cardDark]}>
                <Text style={[s.cardTitle, isDark && { color: '#e2e8f0' }]}>{t('alerts.extendedForecast')}</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.forecastRow}>
                  {forecast.map((f: any, i: number) => (
                    <View key={i} style={[s.forecastDay, isDark && s.forecastDayDark]}>
                      <Text style={[s.forecastName, isDark && { color: '#e2e8f0' }]}>{dayLabel(f.date)}</Text>
                      <Text style={s.forecastIcon}>{mapConditionIcon(f.condition)}</Text>
                      <Text style={s.forecastTemp}>{Math.round(f.maxTemperatureC)}°C</Text>
                      <Text style={[s.forecastMin, isDark && { color: '#94a3b8' }]}>
                        {Math.round(f.minTemperatureC)}°C
                      </Text>
                    </View>
                  ))}
                </ScrollView>
              </View>
            ) : null}

            {/* Estado */}
            <View style={[s.card, isDark && s.cardDark]}>
              <View style={s.statusRow}>
                <View style={[s.statusIcon, { backgroundColor: 'rgba(245,158,11,0.14)' }]}>
                  <Ionicons name="warning" size={20} color="#f59e0b" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[s.cardTitle, isDark && { color: '#e2e8f0' }]}>{t('alerts.subtitle')}</Text>
                  {!notifOk && (
                    <Text style={s.warnText}>{t('alerts.permNotifications')}</Text>
                  )}
                </View>
              </View>

              <View style={s.btnRow}>
                <TouchableOpacity style={s.primaryBtn} onPress={fetchAlerts} disabled={loading}>
                  <Ionicons name="refresh" size={14} color="#fff" />
                  <Text style={s.primaryBtnText}>{t('alerts.refresh')}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={s.secondaryBtn}
                  onPress={async () => {
                    await sendTestClimateAlert();
                  }}
                >
                  <Ionicons name="notifications-outline" size={14} color="#b45309" />
                  <Text style={s.secondaryBtnText}>{t('alerts.testButton')}</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Lista de alertas */}
            <View style={s.list}>
              {loading ? (
                <ActivityIndicator color="#10b981" size="large" style={{ marginTop: 40 }} />
              ) : loadError ? (
                <View style={[s.card, isDark && s.cardDark, s.emptyBox]}>
                  <Ionicons name="location-outline" size={44} color={isDark ? '#4b5563' : '#d1d5db'} />
                  <Text style={[s.emptyText, isDark && { color: '#94a3b8' }]}>{loadError}</Text>
                  <TouchableOpacity style={s.primaryBtn} onPress={fetchAlerts}>
                    <Ionicons name="refresh" size={14} color="#fff" />
                    <Text style={s.primaryBtnText}>{t('alerts.refresh')}</Text>
                  </TouchableOpacity>
                </View>
              ) : alerts.length === 0 ? (
                <View style={[s.card, isDark && s.cardDark, s.emptyBox]}>
                  <Ionicons name="shield-checkmark-outline" size={44} color="#10b981" />
                  <Text style={[s.emptyText, isDark && { color: '#94a3b8' }]}>{t('alerts.empty')}</Text>
                </View>
              ) : (
                alerts.map((a, i) => {
                  const sev = severityColor(a.severity);
                  return (
                    <View key={`${a.alertTitle}-${i}`} style={[s.alertCard, isDark && s.alertCardDark]}>
                      <View style={s.alertHeader}>
                        <View style={s.alertTitleBlock}>
                          <View style={[s.sevDot, { backgroundColor: sev.fg }]} />
                          <Text style={[s.alertTitle, isDark && { color: '#e2e8f0' }]} numberOfLines={2}>
                            {a.alertTitle || t('alerts.title')}
                          </Text>
                        </View>
                        <View style={[s.sevBadge, { backgroundColor: sev.bg }]}>
                          <Text style={[s.sevBadgeText, { color: sev.fg }]}>
                            {severityLabel(a.severity)}
                          </Text>
                        </View>
                      </View>

                      {a.areaName ? (
                        <View style={s.infoRow}>
                          <Ionicons name="map-outline" size={14} color="#6b7280" />
                          <Text style={[s.infoLabel, isDark && { color: '#94a3b8' }]}>
                            {t('alerts.area')}:
                          </Text>
                          <Text style={[s.infoValue, isDark && { color: '#e2e8f0' }]}>{a.areaName}</Text>
                        </View>
                      ) : null}

                      {(a.startTime || a.expirationTime) ? (
                        <View style={s.infoRow}>
                          <Ionicons name="time-outline" size={14} color="#6b7280" />
                          <Text style={[s.infoLabel, isDark && { color: '#94a3b8' }]}>
                            {t('alerts.period')}:
                          </Text>
                          <Text style={[s.infoValue, isDark && { color: '#e2e8f0' }]}>
                            {fmtDate(a.startTime)} {a.expirationTime ? `→ ${fmtDate(a.expirationTime)}` : ''}
                          </Text>
                        </View>
                      ) : null}

                      {a.description ? (
                        <Text style={[s.alertDesc, isDark && { color: '#cbd5e1' }]} numberOfLines={4}>
                          {a.description}
                        </Text>
                      ) : null}

                      {a.instruction ? (
                        <View style={[s.instructionBox, isDark && s.instructionBoxDark]}>
                          <Ionicons name="information-circle-outline" size={14} color="#047857" />
                          <Text style={[s.instructionText, isDark && { color: '#a7f3d0' }]} numberOfLines={3}>
                            {a.instruction}
                          </Text>
                        </View>
                      ) : null}

                      {a.dataSource ? (
                        <Text style={[s.sourceText, isDark && { color: '#64748b' }]}>
                          {t('alerts.source')}: {a.dataSource}
                        </Text>
                      ) : null}
                    </View>
                  );
                })
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
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#1f2937', flexShrink: 1 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  statusIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  warnText: { fontSize: 11, color: '#b45309', marginTop: 4 },

  btnRow: { flexDirection: 'row', gap: 8, marginTop: 16, flexWrap: 'wrap' },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 999,
    backgroundColor: '#10b981',
  },
  primaryBtnText: { fontSize: 12, fontWeight: '700', color: '#ffffff' },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 999,
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fcd34d',
  },
  secondaryBtnText: { fontSize: 12, fontWeight: '700', color: '#b45309' },

  list: { gap: 12 },
  emptyBox: { alignItems: 'center', paddingVertical: 32 },
  emptyText: { fontSize: 14, color: '#6b7280', marginTop: 12, textAlign: 'center', paddingHorizontal: 8 },

  alertCard: {
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
  alertCardDark: { backgroundColor: '#1f2937', borderColor: '#26383D' },
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  alertTitleBlock: { flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 1 },
  sevDot: { width: 8, height: 8, borderRadius: 4 },
  alertTitle: { fontSize: 15, fontWeight: '800', color: '#111827', flexShrink: 1 },
  sevBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  sevBadgeText: { fontSize: 10, fontWeight: '800' },

  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4, flexWrap: 'wrap' },
  infoLabel: { fontSize: 11, color: '#6b7280' },
  infoValue: { fontSize: 12, color: '#111827', fontWeight: '600' },

  alertDesc: { fontSize: 12, color: '#4b5563', lineHeight: 17, marginTop: 8 },

  instructionBox: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'flex-start',
    backgroundColor: '#ecfdf5',
    borderRadius: 12,
    padding: 10,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#dcfce7',
  },
  instructionBoxDark: { backgroundColor: 'rgba(16,185,129,0.08)', borderColor: '#26383D' },
  instructionText: { fontSize: 11, color: '#047857', flex: 1, lineHeight: 16 },

  sourceText: { fontSize: 10, color: '#9ca3af', marginTop: 8 },

  weatherRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  weatherIcon: { fontSize: 52 },
  weatherCondition: { fontSize: 13, color: '#6b7280', fontWeight: '600' },
  weatherTemp: { fontSize: 40, fontWeight: '900', color: '#1f2937', lineHeight: 46 },
  weatherFeels: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  weatherMiniRow: { flexDirection: 'row', gap: 12, marginTop: 16 },
  weatherMini: {
    flex: 1,
    backgroundColor: '#f9fafb',
    borderRadius: 14,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  weatherMiniDark: { backgroundColor: 'rgba(11,18,21,0.4)', borderColor: '#26383D' },
  weatherMiniLabel: { fontSize: 11, color: '#6b7280' },
  weatherMiniValue: { fontSize: 17, fontWeight: '800', color: '#1f2937', marginTop: 2 },

  statsRow: { flexDirection: 'row', gap: 10 },
  statBox: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#f3f4f6',
    alignItems: 'center',
  },
  statBoxDark: { backgroundColor: '#162329', borderColor: '#26383D' },
  statIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  statLabel: { fontSize: 9, color: '#6b7280', textAlign: 'center' },
  statValue: { fontSize: 18, fontWeight: '900', color: '#1f2937', marginTop: 2 },

  forecastRow: { gap: 10, paddingTop: 12, paddingRight: 4 },
  forecastDay: {
    width: 74,
    backgroundColor: '#f9fafb',
    borderRadius: 14,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  forecastDayDark: { backgroundColor: 'rgba(11,18,21,0.4)', borderColor: '#26383D' },
  forecastName: { fontSize: 11, fontWeight: '700', color: '#1f2937' },
  forecastIcon: { fontSize: 22, marginVertical: 4 },
  forecastTemp: { fontSize: 15, fontWeight: '800', color: '#10b981' },
  forecastMin: { fontSize: 11, color: '#9ca3af', marginTop: 1 },
});
