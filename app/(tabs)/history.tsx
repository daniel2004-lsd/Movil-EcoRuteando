// app/(tabs)/history.tsx — Historial de Viajes con Minimapa enriquecido (estilo web).
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';

import { useAuth } from '../../src/shared/store/AuthContext';
import { useThemeMode } from '../../src/shared/store/ThemeContext';
import { useLanguage } from '../../src/shared/store/LanguageContext';
import apiClient from '../../src/shared/services/apiClient';
import { AccountRequired } from '../../src/shared/components/ui/AccountRequired';
import { RouteMiniMap } from '../../src/components/maps/RouteMiniMap';
import { Dialog } from '../../src/shared/components/ui/AppDialog';
import { exportHtmlToPdf, exportCsvOrExcel } from '../../src/shared/utils/exportUtils';

type Trip = {
  id: string;
  usageId: string;
  routeId?: string;
  routeName: string;
  originAddress: string;
  destinationAddress: string;
  transportMode: string;
  source: string;
  co2SavedKg: number;
  distanceKm: number;
  durationMin: number;
  estimatedCalories: number | null;
  startedAt: string;
  endedAt?: string | null;
  completed: boolean;
  interrupted: boolean;
  startLat?: number | null;
  startLng?: number | null;
  endLat?: number | null;
  endLng?: number | null;
  encodedPolyline?: string | null;
};

const TRANSPORT_CONFIG: Record<string, { icon: any; label: string; emoji: string }> = {
  walking: { icon: 'walk-outline', label: 'Caminata', emoji: '🚶' },
  bike: { icon: 'bicycle-outline', label: 'Bicicleta', emoji: '🚲' },
  car: { icon: 'car-outline', label: 'Automóvil', emoji: '🚗' },
  public_transport: { icon: 'bus-outline', label: 'Transporte', emoji: '🚌' },
  mixed: { icon: 'git-merge-outline', label: 'Mixto', emoji: '🔄' },
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
  const [query, setQuery] = useState('');

  const fetchTrips = useCallback(async (isSilent = false) => {
    if (!isSilent) {
      setLoading(true);
      setLoadError(false);
    }
    try {
      const [tripsRes, routesRes] = await Promise.all([
        apiClient.get('/api/trips'),
        apiClient.get('/api/routes', { params: { mine: true, includeInactive: true } }).catch(() => ({ data: [] })),
      ]);

      const items: any[] = Array.isArray(tripsRes.data) ? tripsRes.data : tripsRes.data?.items ?? [];
      const routeItems: any[] = Array.isArray(routesRes.data) ? routesRes.data : routesRes.data?.items ?? [];

      const routesMap = new Map<string, any>();
      routeItems.forEach(r => {
        if (r && r.id) {
          routesMap.set(String(r.id), r);
        }
      });

      setTrips(
        items
          .filter(t => t && (t.usageId || t.id))
          .map((t, i) => {
            const rawName: string = t.routeName || '';
            const parts = rawName.split(/\s*→\s*/);
            const routeMatch = t.routeId ? routesMap.get(String(t.routeId)) : null;

            const distKm =
              t.actualDistanceKm != null
                ? Number(t.actualDistanceKm)
                : t.estimatedDistanceKm != null
                ? Number(t.estimatedDistanceKm)
                : routeMatch?.distanceKm != null
                ? Number(routeMatch.distanceKm)
                : t.distanceMeters != null
                ? Number(t.distanceMeters) / 1000
                : 0;

            const durMin =
              t.actualDurationMin != null
                ? Number(t.actualDurationMin)
                : t.estimatedDurationMin != null
                ? Number(t.estimatedDurationMin)
                : routeMatch?.estimatedTimeMin != null
                ? Number(routeMatch.estimatedTimeMin)
                : 0;

            const co2 =
              t.actualCo2Kg != null
                ? Number(t.actualCo2Kg)
                : t.estimatedCo2Kg != null
                ? Number(t.estimatedCo2Kg)
                : routeMatch?.co2SavedKg != null
                ? Number(routeMatch.co2SavedKg)
                : Number(t.co2SavedKg ?? 0);

            const cleanName =
              rawName.replace(/^Viaje:\s*/i, '').replace(/\s*\(\d+\)$/, '') || rawName;

            const startLat =
              t.startLat ??
              t.startLatitude ??
              routeMatch?.startLatitude ??
              routeMatch?.startLat ??
              null;
            const startLng =
              t.startLng ??
              t.startLongitude ??
              routeMatch?.startLongitude ??
              routeMatch?.startLng ??
              null;
            const endLat =
              t.endLat ??
              t.endLatitude ??
              routeMatch?.endLatitude ??
              routeMatch?.endLat ??
              null;
            const endLng =
              t.endLng ??
              t.endLongitude ??
              routeMatch?.endLongitude ??
              routeMatch?.endLng ??
              null;
            const encodedPolyline =
              t.encodedPolyline ?? routeMatch?.encodedPolyline ?? null;

            return {
              id: String(t.usageId ?? t.id ?? `trip-${i}`),
              usageId: String(t.usageId ?? t.id ?? `trip-${i}`),
              routeId: t.routeId ? String(t.routeId) : undefined,
              routeName: cleanName || tr('history.origin'),
              originAddress:
                t.startName ||
                routeMatch?.startName ||
                t.originAddress ||
                (parts[0] || cleanName || tr('history.origin')),
              destinationAddress:
                t.destinationName ||
                routeMatch?.destinationName ||
                t.destinationAddress ||
                (parts[1] || tr('history.destination')),
              transportMode: t.transportMode ?? routeMatch?.transportType ?? 'car',
              source: t.source || 'mobile',
              co2SavedKg: co2,
              distanceKm: distKm,
              durationMin: durMin,
              estimatedCalories:
                t.estimatedCalories != null
                  ? Number(t.estimatedCalories)
                  : routeMatch?.estimatedCalories != null
                  ? Number(routeMatch.estimatedCalories)
                  : null,
              startedAt: t.startedAt ?? new Date().toISOString(),
              endedAt: t.endedAt,
              completed: t.completed ?? true,
              interrupted: t.interrupted ?? false,
              startLat,
              startLng,
              endLat,
              endLng,
              encodedPolyline,
            };
          })
      );
    } catch (e: any) {
      if (!isSilent) setLoadError(true);
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, [tr]);

  // Recarga al enfocar y auto-sincronización periódica en segundo plano
  useFocusEffect(
    useCallback(() => {
      if (isGuest) {
        setLoading(false);
        return;
      }
      fetchTrips();
      const interval = setInterval(() => {
        fetchTrips(true);
      }, 3500);
      return () => clearInterval(interval);
    }, [fetchTrips, isGuest])
  );

  const totalCo2 = trips.reduce((sum, t) => sum + (t.co2SavedKg ?? 0), 0);
  const totalKm = trips.reduce((sum, t) => sum + (t.distanceKm ?? 0), 0);
  const completedCount = trips.filter(t => t.completed).length;

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return isNaN(d.getTime())
      ? dateStr
      : d.toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const formatTime = (dateStr: string) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return isNaN(d.getTime())
      ? ''
      : d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
  };

  const modeLabel = (mode: string) => {
    const config = TRANSPORT_CONFIG[mode] || TRANSPORT_CONFIG.walking;
    const key = `savedRoutes.transport.${mode}`;
    const translated = t(key);
    return translated === key ? config.label : translated;
  };

  const handleReuseRoute = (trip: Trip) => {
    const parts: string[] = [];
    if (trip.startLat != null && trip.startLng != null) {
      parts.push(`originLat=${encodeURIComponent(String(trip.startLat))}`);
      parts.push(`originLng=${encodeURIComponent(String(trip.startLng))}`);
    }
    if (trip.endLat != null && trip.endLng != null) {
      parts.push(`destLat=${encodeURIComponent(String(trip.endLat))}`);
      parts.push(`destLng=${encodeURIComponent(String(trip.endLng))}`);
    }
    if (trip.originAddress) {
      parts.push(`originName=${encodeURIComponent(trip.originAddress)}`);
    }
    if (trip.destinationAddress) {
      parts.push(`destName=${encodeURIComponent(trip.destinationAddress)}`);
    }
    if (trip.transportMode) {
      parts.push(`mode=${encodeURIComponent(trip.transportMode)}`);
    }
    router.push(`/(tabs)/plan-route?${parts.join('&')}`);
  };

  const buildHtmlTable = () => {
    const rows = trips
      .map(
        trip => `
      <tr>
        <td>${trip.originAddress}</td>
        <td>${trip.destinationAddress}</td>
        <td>${modeLabel(trip.transportMode)}</td>
        <td>${trip.distanceKm.toFixed(2)} km</td>
        <td>${trip.durationMin} min</td>
        <td>${trip.co2SavedKg.toFixed(3)} kg</td>
        <td>${formatDate(trip.startedAt)} ${formatTime(trip.startedAt)}</td>
      </tr>`
      )
      .join('');

    return `
      <html><head><meta charset="utf-8"><style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; padding: 24px; color: #1f2937; }
        .header { display: flex; align-items: center; gap: 12px; margin-bottom: 20px; border-bottom: 2px solid #059669; padding-bottom: 12px; }
        h1 { color: #059669; font-size: 24px; margin: 0; }
        .subtitle { color: #6b7280; font-size: 13px; margin-top: 4px; }
        .summary-box { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 14px 18px; margin-bottom: 20px; }
        .summary-title { font-weight: bold; color: #065f46; font-size: 14px; margin-bottom: 6px; }
        .summary-stats { font-size: 13px; color: #047857; display: flex; gap: 20px; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 12px; }
        th { background: #059669; color: #fff; padding: 10px 8px; text-align: left; font-size: 12px; }
        td { padding: 9px 8px; border-bottom: 1px solid #e5e7eb; font-size: 12px; }
        tr:nth-child(even) td { background: #f9fafb; }
        .footer { margin-top: 24px; font-size: 11px; color: #9ca3af; text-align: center; }
      </style></head><body>
        <div class="header">
          <div>
            <h1>🌿 EcoRuteando — Historial de Trayectos</h1>
            <div class="subtitle">Reporte oficial generado el ${new Date().toLocaleDateString('es-CO')} a las ${new Date().toLocaleTimeString('es-CO')}</div>
          </div>
        </div>
        <div class="summary-box">
          <div class="summary-title">Resumen de Impacto Ecológico</div>
          <div class="summary-stats">
            <span>Trayectos: <strong>${trips.length}</strong></span>
            <span>Distancia: <strong>${totalKm.toFixed(2)} km</strong></span>
            <span>CO₂ Ahorrado: <strong>${totalCo2.toFixed(3)} kg</strong></span>
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th>Origen</th>
              <th>Destino</th>
              <th>Modo</th>
              <th>Distancia</th>
              <th>Duración</th>
              <th>CO₂</th>
              <th>Fecha</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
        <div class="footer">Generado por EcoRuteando Móvil · Sostenibilidad y Movilidad Limpia</div>
      </body></html>`;
  };

  const [exporting, setExporting] = useState<'pdf' | 'excel' | null>(null);

  const handleExportPDF = async () => {
    if (trips.length === 0) {
      Dialog.alert('Historial vacío', 'No hay viajes registrados para exportar.', [{ text: 'OK' }], { tone: 'info' });
      return;
    }
    setExporting('pdf');
    try {
      const html = buildHtmlTable();
      await exportHtmlToPdf(html, `ecoruteando-historial-${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (e: any) {
      console.warn('[export PDF]', e);
      Dialog.alert('Error al exportar', e?.message || 'No se pudo generar el documento PDF.', [{ text: 'OK' }], { tone: 'error' });
    } finally {
      setExporting(null);
    }
  };

  const handleExportExcel = async () => {
    if (trips.length === 0) {
      Dialog.alert('Historial vacío', 'No hay viajes registrados para exportar.', [{ text: 'OK' }], { tone: 'info' });
      return;
    }
    setExporting('excel');
    try {
      const header = '"Origen","Destino","Modo de transporte","Distancia (km)","Duracion (min)","CO2 (kg)","Fecha"';
      const csvRows = trips.map(
        trip =>
          `"${trip.originAddress.replace(/"/g, '""')}","${trip.destinationAddress.replace(/"/g, '""')}","${modeLabel(trip.transportMode)}",${trip.distanceKm.toFixed(2)},${trip.durationMin},${trip.co2SavedKg.toFixed(3)},"${formatDate(trip.startedAt)} ${formatTime(trip.startedAt)}"`
      );
      const csv = [header, ...csvRows].join('\n');
      await exportCsvOrExcel(csv, `ecoruteando-historial-${new Date().toISOString().slice(0, 10)}.csv`);
    } catch (e: any) {
      console.warn('[export Excel]', e);
      Dialog.alert('Error al exportar', e?.message || 'No se pudo exportar el archivo Excel.', [{ text: 'OK' }], { tone: 'error' });
    } finally {
      setExporting(null);
    }
  };

  const q = query.trim().toLowerCase();
  const visibleTrips = q
    ? trips.filter(
        t =>
          t.routeName.toLowerCase().includes(q) ||
          t.originAddress.toLowerCase().includes(q) ||
          t.destinationAddress.toLowerCase().includes(q)
      )
    : trips;

  return (
    <View style={[s.page, isDark && s.pageDark]}>
      {/* Cabecera */}
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
            <Ionicons name="time" size={20} color="#fff" />
          </View>
          <View style={{ flexShrink: 1 }}>
            <Text style={[s.headerTitle, isDark && { color: '#e2e8f0' }]} numberOfLines={1}>
              {t('history.title')}
            </Text>
            <Text style={[s.headerSub, isDark && { color: '#34d399' }]}>
              Tus trayectos realizados
            </Text>
          </View>
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
            {/* Resumen de Impacto estilo Web */}
            <View style={s.impactGrid}>
              {/* Tarjeta CO2 */}
              <View style={[s.impactCard, s.impactCardEco, isDark && s.impactCardEcoDark]}>
                <View style={[s.impactIconBox, { backgroundColor: 'rgba(16,185,129,0.18)' }]}>
                  <Ionicons name="leaf" size={26} color="#10b981" />
                </View>
                <Text style={[s.impactLabel, { color: isDark ? '#34d399' : '#059669' }]}>
                  CO₂ Ahorrado
                </Text>
                <Text style={[s.impactValue, { color: isDark ? '#34d399' : '#047857' }]}>
                  {loading ? '...' : `${totalCo2.toFixed(2)} kg`}
                </Text>
                <Text style={[s.impactHint, isDark && { color: '#94a3b8' }]}>
                  Equivale a plantar ~{Math.round(totalCo2 * 2)} árboles 🌱
                </Text>
              </View>

              {/* Tarjeta Distancia */}
              <View style={[s.impactCard, s.impactCardDist, isDark && s.impactCardDistDark]}>
                <View style={[s.impactIconBox, { backgroundColor: 'rgba(6,182,212,0.18)' }]}>
                  <Ionicons name="map" size={26} color="#06b6d4" />
                </View>
                <Text style={[s.impactLabel, { color: isDark ? '#22d3ee' : '#0891b2' }]}>
                  Distancia Recorrida
                </Text>
                <Text style={[s.impactValue, { color: isDark ? '#22d3ee' : '#0e7490' }]}>
                  {loading ? '...' : `${totalKm.toFixed(2)} km`}
                </Text>
                <Text style={[s.impactHint, isDark && { color: '#94a3b8' }]}>
                  {completedCount} viaje(s) completado(s) 🚀
                </Text>
              </View>
            </View>

            {/* Fila de Exportación */}
            <View style={[s.card, isDark && s.cardDark, { marginTop: 12, padding: 14 }]}>
              <View style={s.exportRow}>
                <TouchableOpacity
                  style={[s.exportBtnPdf, exporting !== null && { opacity: 0.6 }]}
                  onPress={handleExportPDF}
                  disabled={exporting !== null}
                >
                  <Ionicons name="document-text-outline" size={16} color="#fff" />
                  <Text style={s.exportBtnPdfText}>
                    {exporting === 'pdf' ? 'Generando...' : 'PDF'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[s.exportBtnExcel, exporting !== null && { opacity: 0.6 }]}
                  onPress={handleExportExcel}
                  disabled={exporting !== null}
                >
                  <Ionicons name="download-outline" size={16} color="#166534" />
                  <Text style={s.exportBtnExcelText}>
                    {exporting === 'excel' ? 'Generando...' : 'Excel'}
                  </Text>
                </TouchableOpacity>

                <Text style={[s.exportStatsText, isDark && { color: '#94a3b8' }]}>
                  {trips.length} {trips.length === 1 ? 'viaje' : 'viajes'}
                </Text>
              </View>
            </View>

            {/* Buscador de Historial */}
            <View style={[s.searchBox, isDark && s.searchBoxDark]}>
              <Ionicons name="search-outline" size={16} color={isDark ? '#94a3b8' : '#9ca3af'} />
              <TextInput
                style={[s.searchInput, isDark && { color: '#e2e8f0' }]}
                value={query}
                onChangeText={setQuery}
                placeholder="Buscar por trayecto, origen o destino..."
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

            {/* Listado de Trayectos */}
            <View style={s.list}>
              {loading ? (
                <ActivityIndicator color="#10b981" size="large" style={{ marginTop: 40 }} />
              ) : loadError ? (
                <View style={[s.card, isDark && s.cardDark, s.emptyBox]}>
                  <Ionicons
                    name="cloud-offline-outline"
                    size={44}
                    color={isDark ? '#4b5563' : '#d1d5db'}
                  />
                  <Text style={[s.emptyText, isDark && { color: '#94a3b8' }]}>
                    {t('savedRoutes.loadError')}
                  </Text>
                  <TouchableOpacity style={s.retryBtn} onPress={() => fetchTrips()}>
                    <Ionicons name="refresh" size={14} color="#ffffff" />
                    <Text style={s.retryBtnText}>{t('savedRoutes.retry')}</Text>
                  </TouchableOpacity>
                </View>
              ) : trips.length === 0 ? (
                <View style={[s.card, isDark && s.cardDark, s.emptyBox]}>
                  <Ionicons name="time-outline" size={44} color={isDark ? '#4b5563' : '#d1d5db'} />
                  <Text style={[s.emptyText, isDark && { color: '#e2e8f0' }]}>
                    Aún no tienes viajes registrados
                  </Text>
                  <Text style={[s.emptySub, isDark && { color: '#94a3b8' }]}>
                    Planea y completa una ruta para ver aquí tu historial y CO₂ ahorrado.
                  </Text>
                  <TouchableOpacity
                    style={s.planFirstBtn}
                    onPress={() => router.push('/(tabs)/plan-route')}
                  >
                    <Ionicons name="navigate-outline" size={15} color="#fff" />
                    <Text style={s.planFirstBtnText}>Planear mi primera ruta</Text>
                  </TouchableOpacity>
                </View>
              ) : visibleTrips.length === 0 ? (
                <View style={[s.card, isDark && s.cardDark, s.emptyBox]}>
                  <Ionicons name="search-outline" size={36} color={isDark ? '#64748b' : '#9ca3af'} />
                  <Text style={[s.emptyText, isDark && { color: '#e2e8f0' }]}>
                    Sin resultados para "{query}"
                  </Text>
                  <TouchableOpacity style={s.clearBtn} onPress={() => setQuery('')}>
                    <Text style={s.clearBtnText}>Limpiar búsqueda</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                visibleTrips.map(trip => {
                  const config =
                    TRANSPORT_CONFIG[trip.transportMode] || TRANSPORT_CONFIG.walking;
                  const calories =
                    trip.estimatedCalories != null
                      ? Math.round(Number(trip.estimatedCalories))
                      : trip.distanceKm > 0
                      ? Math.round(
                          trip.distanceKm * (trip.transportMode === 'car' ? 0 : 45)
                        )
                      : null;

                  return (
                    <View key={trip.id} style={[s.routeCard, isDark && s.routeCardDark]}>
                      {/* MINIMAPA SUPERIOR */}
                      <TouchableOpacity
                        activeOpacity={0.92}
                        onPress={() => handleReuseRoute(trip)}
                        style={s.mapWrapper}
                      >
                        <RouteMiniMap
                          startLat={trip.startLat}
                          startLng={trip.startLng}
                          endLat={trip.endLat}
                          endLng={trip.endLng}
                          encodedPolyline={trip.encodedPolyline}
                          isDark={isDark}
                          height={155}
                        />

                        {/* Badges superiores sobre el mapa */}
                        <View style={s.mapOverlayTop} pointerEvents="box-none">
                          <View style={s.mapOverlayLeftBadges}>
                            <View
                              style={[
                                s.mapStatusBadge,
                                {
                                  backgroundColor: trip.completed
                                    ? isDark
                                      ? 'rgba(16,185,129,0.3)'
                                      : '#dcfce7'
                                    : isDark
                                    ? 'rgba(245,158,11,0.3)'
                                    : '#fef3c7',
                                },
                              ]}
                            >
                              <Text
                                style={[
                                  s.mapStatusBadgeText,
                                  {
                                    color: trip.completed
                                      ? isDark
                                        ? '#34d399'
                                        : '#059669'
                                      : isDark
                                      ? '#fbbf24'
                                      : '#d97706',
                                  },
                                ]}
                              >
                                {trip.completed ? '● Completado' : '● En curso'}
                              </Text>
                            </View>

                            <View style={s.mapTransportBadge}>
                              <Text style={s.mapTransportEmoji}>{config.emoji}</Text>
                              <Text style={s.mapTransportText}>{modeLabel(trip.transportMode)}</Text>
                            </View>
                          </View>

                          {/* Badge de fuente: Móvil vs Web */}
                          <View
                            style={[
                              s.sourceBadge,
                              trip.source === 'mobile' ? s.sourceMobile : s.sourceWeb,
                            ]}
                          >
                            <Text style={s.sourceBadgeText}>
                              {trip.source === 'mobile' ? '📱 Móvil' : '💻 Web'}
                            </Text>
                          </View>
                        </View>

                        {/* Badges inferiores sobre el mapa */}
                        <View style={s.mapOverlayBottom} pointerEvents="box-none">
                          <View style={s.mapExpandHint}>
                            <Ionicons name="map-outline" size={11} color="#fff" />
                            <Text style={s.mapExpandHintText}>Ver recorrido</Text>
                          </View>

                          <View style={s.mapMetricsPill}>
                            <Text style={s.mapMetricsPillText}>
                              📏 {trip.distanceKm.toFixed(1)} km
                            </Text>
                            <Text style={s.mapMetricsPillDivider}>•</Text>
                            <Text style={s.mapMetricsPillText}>
                              ⏱️ {trip.durationMin} min
                            </Text>
                          </View>
                        </View>
                      </TouchableOpacity>

                      {/* CUERPO DE LA TARJETA */}
                      <View style={s.cardBody}>
                        {/* Nombre y Fecha */}
                        <View style={s.cardHeaderRow}>
                          <Text
                            style={[s.routeName, isDark && { color: '#e2e8f0' }]}
                            numberOfLines={1}
                          >
                            {trip.routeName}
                          </Text>
                        </View>

                        <View style={s.dateTimeRow}>
                          <Ionicons name="calendar-outline" size={12} color="#10b981" />
                          <Text style={[s.dateTimeText, isDark && { color: '#94a3b8' }]}>
                            {formatDate(trip.startedAt)} · {formatTime(trip.startedAt)}
                          </Text>
                        </View>

                        {/* Origen y Destino destacados */}
                        <TouchableOpacity
                          activeOpacity={0.85}
                          onPress={() => handleReuseRoute(trip)}
                          style={[s.originDestBox, isDark && s.originDestBoxDark]}
                        >
                          <View style={s.originDestRow}>
                            <View style={[s.pointDot, { backgroundColor: '#10b981' }]} />
                            <View style={s.pointTextCol}>
                              <Text
                                style={[s.pointTag, { color: isDark ? '#34d399' : '#059669' }]}
                              >
                                ORIGEN (Partida)
                              </Text>
                              <Text
                                style={[s.pointAddress, isDark && { color: '#e2e8f0' }]}
                                numberOfLines={1}
                              >
                                {trip.originAddress}
                              </Text>
                            </View>
                          </View>

                          <View
                            style={[s.originDestDivider, isDark && { backgroundColor: '#26383D' }]}
                          />

                          <View style={s.originDestRow}>
                            <View style={[s.pointDot, { backgroundColor: '#ef4444' }]} />
                            <View style={s.pointTextCol}>
                              <Text
                                style={[s.pointTag, { color: isDark ? '#fb7185' : '#e11d48' }]}
                              >
                                DESTINO (Llegada)
                              </Text>
                              <Text
                                style={[s.pointAddress, isDark && { color: '#e2e8f0' }]}
                                numberOfLines={1}
                              >
                                {trip.destinationAddress}
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
                                Distancia
                              </Text>
                              <Text style={[s.metricVal, isDark && { color: '#e2e8f0' }]}>
                                {trip.distanceKm.toFixed(2)} km
                              </Text>
                            </View>
                          </View>

                          <View style={[s.metricBox, isDark && s.metricBoxDark]}>
                            <Text style={s.metricIcon}>⏱️</Text>
                            <View style={s.metricContent}>
                              <Text style={[s.metricLabel, isDark && { color: '#94a3b8' }]}>
                                Duración
                              </Text>
                              <Text style={[s.metricVal, isDark && { color: '#e2e8f0' }]}>
                                {trip.durationMin} min
                              </Text>
                            </View>
                          </View>

                          <View
                            style={[
                              s.metricBox,
                              s.metricBoxEco,
                              isDark && s.metricBoxEcoDark,
                            ]}
                          >
                            <Text style={s.metricIcon}>🌱</Text>
                            <View style={s.metricContent}>
                              <Text
                                style={[
                                  s.metricLabel,
                                  { color: isDark ? '#34d399' : '#059669' },
                                ]}
                              >
                                CO₂ Ahorrado
                              </Text>
                              <Text
                                style={[
                                  s.metricVal,
                                  { color: isDark ? '#34d399' : '#059669' },
                                ]}
                              >
                                {trip.co2SavedKg.toFixed(2)} kg
                              </Text>
                            </View>
                          </View>

                          <View
                            style={[
                              s.metricBox,
                              s.metricBoxCal,
                              isDark && s.metricBoxCalDark,
                            ]}
                          >
                            <Text style={s.metricIcon}>🔥</Text>
                            <View style={s.metricContent}>
                              <Text
                                style={[
                                  s.metricLabel,
                                  { color: isDark ? '#fb923c' : '#ea580c' },
                                ]}
                              >
                                Calorías
                              </Text>
                              <Text
                                style={[
                                  s.metricVal,
                                  { color: isDark ? '#fb923c' : '#ea580c' },
                                ]}
                              >
                                {calories != null ? `${calories} kcal` : '--'}
                              </Text>
                            </View>
                          </View>
                        </View>

                        {/* Acciones principales */}
                        <View style={s.actionsRow}>
                          <TouchableOpacity
                            style={s.useRouteBtn}
                            onPress={() => handleReuseRoute(trip)}
                            activeOpacity={0.8}
                          >
                            <Ionicons name="repeat-outline" size={15} color="#fff" />
                            <Text style={s.useRouteBtnText}>Reutilizar ruta</Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={[
                              s.mapBtn,
                              isDark && {
                                backgroundColor: 'rgba(16,185,129,0.15)',
                                borderColor: 'rgba(16,185,129,0.35)',
                              },
                            ]}
                            onPress={() => handleReuseRoute(trip)}
                            activeOpacity={0.8}
                          >
                            <Ionicons name="map-outline" size={15} color="#10b981" />
                            <Text style={[s.mapBtnText, isDark && { color: '#34d399' }]}>
                              Mapa
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </View>
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
  headerTitle: { fontSize: 17, fontWeight: '800', color: '#1f2937' },
  headerSub: { fontSize: 10, fontWeight: '600', color: '#059669', marginTop: 1 },
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

  /* Resumen de Impacto estilo Web */
  impactGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  impactCard: {
    flex: 1,
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    alignItems: 'center',
  },
  impactCardEco: {
    backgroundColor: '#f0fdf4',
    borderColor: '#bbf7d0',
  },
  impactCardEcoDark: {
    backgroundColor: 'rgba(6, 78, 59, 0.25)',
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  impactCardDist: {
    backgroundColor: '#ecfeff',
    borderColor: '#a5f3fc',
  },
  impactCardDistDark: {
    backgroundColor: 'rgba(8, 145, 178, 0.22)',
    borderColor: 'rgba(6, 182, 212, 0.3)',
  },
  impactIconBox: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  impactLabel: {
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
  impactValue: {
    fontSize: 20,
    fontWeight: '900',
    marginTop: 2,
    textAlign: 'center',
  },
  impactHint: {
    fontSize: 9,
    color: '#6b7280',
    marginTop: 4,
    textAlign: 'center',
  },

  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#dcfce7',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  cardDark: { backgroundColor: '#162329', borderColor: '#26383D' },

  exportRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  exportBtnPdf: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: '#ef4444',
  },
  exportBtnPdfText: { fontSize: 11, fontWeight: '800', color: '#ffffff' },
  exportBtnExcel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#10b981',
  },
  exportBtnExcelText: { fontSize: 11, fontWeight: '700', color: '#047857' },
  exportStatsText: {
    flex: 1,
    fontSize: 11,
    fontWeight: '700',
    color: '#6b7280',
    textAlign: 'right',
  },

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
    marginTop: 12,
    marginBottom: 4,
  },
  searchBoxDark: { backgroundColor: '#162329', borderColor: '#26383D' },
  searchInput: { flex: 1, fontSize: 13, color: '#1f2937', paddingVertical: 0 },

  list: { marginTop: 12, gap: 14 },
  emptyBox: { alignItems: 'center', paddingVertical: 32, paddingHorizontal: 20 },
  emptyText: { fontSize: 15, fontWeight: '800', color: '#1f2937', textAlign: 'center' },
  emptySub: { fontSize: 12, color: '#6b7280', textAlign: 'center', marginTop: 4 },
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
  planFirstBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 14,
    paddingVertical: 9,
    paddingHorizontal: 18,
    borderRadius: 12,
    backgroundColor: '#059669',
  },
  planFirstBtnText: { fontSize: 13, fontWeight: '700', color: '#ffffff' },
  clearBtn: {
    marginTop: 12,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: '#10b981',
  },
  clearBtnText: { fontSize: 12, fontWeight: '700', color: '#ffffff' },

  /* Tarjeta de Ruta enriquecida */
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
    fontWeight: '800',
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
  sourceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
  },
  sourceMobile: {
    backgroundColor: 'rgba(2, 132, 199, 0.85)',
    borderColor: 'rgba(56, 189, 248, 0.4)',
  },
  sourceWeb: {
    backgroundColor: 'rgba(126, 34, 206, 0.85)',
    borderColor: 'rgba(192, 132, 252, 0.4)',
  },
  sourceBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#ffffff',
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
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  routeName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1f2937',
    flex: 1,
  },
  dateTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 4,
    marginBottom: 10,
  },
  dateTimeText: {
    fontSize: 11,
    color: '#6b7280',
    fontWeight: '500',
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
});
