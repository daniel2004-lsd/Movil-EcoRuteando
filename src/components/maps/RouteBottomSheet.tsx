import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TRANSPORT_MODES } from '../../services/maps/googleMaps';

interface RouteInfo {
  distance: { text: string; value: number };
  duration: { text: string; value: number };
  co2?: string;
  steps?: Array<{
    instruction: string;
    distance: { text: string; value: number };
    duration: { text: string; value: number };
    startLocation: { latitude: number; longitude: number };
    endLocation: { latitude: number; longitude: number };
    polyline: string;
    travelMode: string;
  }>;
}

interface RouteBottomSheetProps {
  route: any;
  estimate?: {
    distanceKm?: number;
    estimatedTimeMin?: number;
    co2SavedKg?: number | null;
    estimatedCalories?: number | null;
  } | null;
  activeTripId?: string | null;
  startingTrip?: boolean;
  completing?: boolean;
  tripError?: string | null;
  onStartTrip?: () => void;
  onCompleteTrip?: () => void;
  onClose: () => void;
  onSelectRoute: (index: number) => void;
  routes?: any[];
  selectedRouteIndex?: number;
  onAddStop?: () => void;
  onShare?: () => void;
  onSave?: () => void;
  onReport?: () => void;
  routeSaved?: boolean;
  stopName?: string | null;
  onRemoveStop?: () => void;
  activeMode?: string;
  onModePress?: (mode: string) => void;
  bottomInset?: number;
  contentHeight?: number;
}

const snapPoints = ['25%', '50%', '90%'];

export function RouteBottomSheet({
  route,
  estimate,
  activeTripId,
  startingTrip = false,
  completing = false,
  tripError,
  onStartTrip,
  onCompleteTrip,
  onClose,
  onSelectRoute,
  routes,
  selectedRouteIndex = 0,
  onAddStop,
  onShare,
  onSave,
  onReport,
  routeSaved = false,
  stopName = null,
  onRemoveStop,
  activeMode,
  onModePress,
  bottomInset = 0,
  contentHeight,
}: RouteBottomSheetProps) {
  const handleModePress = (mode: string) => {
    console.log('[SHEET] modo solicitado:', mode);
    onModePress?.(mode);
  };

  console.log('[SHEET] render | hasRoute=', !!route, 'steps=', route?.steps?.length ?? 0, 'activeTrip=', activeTripId ?? 'null', 'onStartTrip=', !!onStartTrip, 'starting=', startingTrip);

  const durationText =
    route?.duration?.text ||
    (estimate?.estimatedTimeMin != null ? `${estimate.estimatedTimeMin} min` : '--');
  const distanceText =
    route?.distance?.text ||
    (estimate?.distanceKm != null ? `${estimate.distanceKm} km` : '--');

  // ETA estilo Google Maps: hora de llegada estimada.
  const arrivalText = (() => {
    const secs =
      route?.duration?.value ??
      (estimate?.estimatedTimeMin != null ? estimate.estimatedTimeMin * 60 : null);
    if (!secs) return null;
    const d = new Date(Date.now() + secs * 1000);
    let h = d.getHours();
    const m = d.getMinutes().toString().padStart(2, '0');
    const period = h >= 12 ? 'p. m.' : 'a. m.';
    h = h % 12 || 12;
    return `${h}:${m} ${period}`;
  })();
  const co2Label =
    estimate?.co2SavedKg != null ? `-${estimate.co2SavedKg} kg` : route?.co2;

  return (
    <View
      style={[
        styles.container,
        contentHeight != null ? { height: contentHeight } : null,
        { paddingBottom: bottomInset },
      ]}
      onLayout={e =>
        console.log(
          '[SHEET] layout h=',
          Math.round(e.nativeEvent.layout.height),
          '| inset=',
          bottomInset,
          '| target=',
          contentHeight != null ? Math.round(contentHeight) : null
        )
      }
    >
        {/* Drag Handle - Google Maps Style */}
        <TouchableOpacity onPress={onClose} style={styles.handleWrapper} activeOpacity={1}>
          <View style={styles.handle} />
        </TouchableOpacity>

        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Route summary - Google Maps Style */}
          <View style={styles.routeSummary}>
            <View style={styles.routeHeader}>
              <View style={styles.routeInfo}>
                <Text style={styles.duration}>{durationText}</Text>
                <Text style={styles.distance}>
                  {distanceText}
                  {arrivalText ? ` • Llegada ${arrivalText}` : ''}
                </Text>
              </View>
              {co2Label && (
                <View style={styles.co2Badge}>
                  <Ionicons name="leaf-outline" size={16} color="#16a34a" />
                  <Text style={styles.co2Text}>{co2Label}</Text>
                </View>
              )}
            </View>

            {/* Transport modes - Google style pills */}
            <View style={styles.modesRow}>
              {TRANSPORT_MODES.map(mode => {
                const isActive = activeMode === mode.id;
                return (
                <TouchableOpacity
                  key={mode.id}
                  onPress={() => handleModePress(mode.id)}
                  style={[styles.modeChip, isActive && styles.modeChipActive]}
                >
                  <Ionicons
                    name={mode.id === 'walking' ? 'walk-outline' : 'car-outline'}
                    size={18}
                    color={isActive ? '#16a34a' : '#6b7280'}
                  />
                <Text style={[styles.modeLabel, isActive && styles.modeLabelActive]}>
                  {mode.label}
                </Text>
              </TouchableOpacity>
                );
              })}
              {onReport && (
                <TouchableOpacity
                  style={styles.modeChip}
                  onPress={onReport}
                  activeOpacity={0.7}
                >
                  <Ionicons name="warning-outline" size={18} color="#d93025" />
                  <Text style={[styles.modeLabel, styles.modeLabelReport]}>Reportar</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Alternative routes */}
            {routes && routes.length > 1 && (
              <View style={styles.alternativesSection}>
                <Text style={styles.alternativesTitle}>Otras rutas</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.alternativesScroll}>
                  {routes.map((r, i) => {
                    const baseDur = routes[selectedRouteIndex]?.duration?.value;
                    const diffMin =
                      i !== selectedRouteIndex &&
                      baseDur != null &&
                      r.duration?.value != null
                        ? Math.round((r.duration.value - baseDur) / 60)
                        : null;
                    const diffText =
                      diffMin == null
                        ? null
                        : diffMin > 0
                        ? `+${diffMin} min más lento`
                        : diffMin < 0
                        ? `${-diffMin} min más rápido`
                        : 'Mismo tiempo';
                    return (
                    <TouchableOpacity
                      key={i}
                      onPress={() => onSelectRoute(i)}
                      style={[
                        styles.altRouteCard,
                        i === selectedRouteIndex && styles.altRouteCardActive,
                      ]}
                    >
                      <Text style={styles.altDuration}>{r.duration?.text || '--'}</Text>
                      <Text style={styles.altDistance}>{r.distance?.text || '--'}</Text>
                      {diffText ? <Text style={styles.altDiff}>{diffText}</Text> : null}
                    </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            )}
          </View>

          {/* Turn by turn */}
          {route?.steps && route.steps.length > 0 && (
            <View style={styles.stepsSection}>
              <Text style={styles.stepsTitle}>Indicaciones</Text>
              {route.steps.map((step: any, i: number) => (
                <TouchableOpacity key={i} style={styles.stepItem} onPress={() => {}}>
                  <View style={styles.stepIconWrapper}>
                    <Ionicons
                      name={step.travelMode === 'WALKING' ? 'walk-outline' : 'car-outline'}
                      size={20}
                      color="#16a34a"
                    />
                  </View>
                  <View style={styles.stepContent}>
                    <Text style={styles.stepInstruction}>{step.instruction}</Text>
                    <Text style={styles.stepMeta}>
                      {step.distance?.text} • {step.duration?.text}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>

        {/* Parada intermedia (estilo Google Maps) */}
        {stopName && (
          <View style={styles.stopChip}>
            <Ionicons name="location" size={14} color="#f59e0b" />
            <Text style={styles.stopChipText} numberOfLines={1}>
              Parada: {stopName}
            </Text>
            <TouchableOpacity onPress={onRemoveStop} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close-circle" size={18} color="#9ca3af" />
            </TouchableOpacity>
          </View>
        )}

        {/* Acciones rápidas estilo Google Maps: Agregar paradas / Compartir / Guardar */}
        {!activeTripId && (onAddStop || onShare || onSave) && (
          <View style={styles.actionRow}>
            {onAddStop && (
              <TouchableOpacity style={styles.actionItem} onPress={onAddStop} activeOpacity={0.7}>
                <View style={styles.actionCircle}>
                  <Ionicons name="location" size={20} color="#1a73e8" />
                </View>
                <Text style={styles.actionLabel}>Agregar paradas</Text>
              </TouchableOpacity>
            )}
            {onShare && (
              <TouchableOpacity style={styles.actionItem} onPress={onShare} activeOpacity={0.7}>
                <View style={styles.actionCircle}>
                  <Ionicons name="share-outline" size={20} color="#1a73e8" />
                </View>
                <Text style={styles.actionLabel}>Compartir</Text>
              </TouchableOpacity>
            )}
            {onSave && (
              <TouchableOpacity style={styles.actionItem} onPress={onSave} activeOpacity={0.7}>
                <View style={styles.actionCircle}>
                  <Ionicons
                    name={routeSaved ? 'bookmark' : 'bookmark-outline'}
                    size={20}
                    color={routeSaved ? '#16a34a' : '#1a73e8'}
                  />
                </View>
                <Text style={[styles.actionLabel, routeSaved && { color: '#16a34a' }]}>
                  {routeSaved ? 'Guardada' : 'Guardar'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Trip error + acciones: fijos abajo, fuera del área scrolleable */}
        {tripError ? <Text style={styles.tripError}>{tripError}</Text> : null}
        <View style={styles.actions}>
            {activeTripId ? (
              <>
                <View style={styles.inProgressChip}>
                  <View style={styles.inProgressDot} />
                  <Text style={styles.inProgressText}>En curso</Text>
                </View>
                <TouchableOpacity
                  style={[styles.primaryBtn, styles.completeBtn]}
                  onPress={onCompleteTrip}
                  disabled={completing}
                  activeOpacity={0.9}
                >
                  <Ionicons name="checkmark-circle-outline" size={22} color="#fff" />
                  <Text style={styles.primaryBtnText}>
                    {completing ? 'Completando...' : 'Completar'}
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity
                  style={styles.primaryBtn}
                  onPress={() => {
                    console.log('[SHEET] BOTON Iniciar viaje PRESIONADO');
                    onStartTrip?.();
                  }}
                  disabled={startingTrip}
                  activeOpacity={0.9}
                >
                  <Ionicons name="navigate-outline" size={22} color="#fff" />
                  <Text style={styles.primaryBtnText}>
                    {startingTrip ? 'Iniciando...' : 'Iniciar viaje'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.secondaryBtn} onPress={onClose} activeOpacity={0.9}>
                  <Text style={styles.secondaryBtnText}>Cancelar</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: -4 },
    elevation: 10,
  },
  handleWrapper: {
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: '#e8eaed',
  },
  handle: {
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#dadce0',
  },
  scrollArea: {
    flex: 1,
    minHeight: 0,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  routeSummary: {
    marginBottom: 12,
  },
  routeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  routeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  duration: {
    fontSize: 28,
    fontWeight: '700',
    color: '#202124',
    fontFamily: 'Times New Roman',
  },
  distance: {
    fontSize: 16,
    color: '#5f6368',
    fontFamily: 'Times New Roman',
  },
  co2Badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: '#e8f0fe',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#16a34a',
  },
  co2Text: {
    fontSize: 13,
    fontWeight: '600',
    color: '#16a34a',
    fontFamily: 'Times New Roman',
  },
  modesRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  modeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#dadce0',
    backgroundColor: '#fff',
  },
  modeLabel: {
    fontSize: 12,
    color: '#3c4043',
    fontFamily: 'Times New Roman',
  },
  modeChipActive: {
    borderColor: '#16a34a',
    backgroundColor: '#e6f4ea',
  },
  modeLabelActive: {
    color: '#16a34a',
    fontWeight: '700',
  },
  modeLabelReport: {
    color: '#d93025',
    fontWeight: '700',
  },
  alternativesSection: {
    marginBottom: 20,
  },
  alternativesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#202124',
    fontFamily: 'Times New Roman',
    marginBottom: 12,
  },
  alternativesScroll: {
    gap: 10,
    paddingBottom: 8,
  },
  altRouteCard: {
    minWidth: 140,
    padding: 14,
    borderRadius: 16,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e8eaed',
  },
  altRouteCardActive: {
    borderColor: '#1a73e8',
    borderWidth: 2,
    backgroundColor: '#e8f0fe',
  },
  altDuration: {
    fontSize: 18,
    fontWeight: '700',
    color: '#202124',
    fontFamily: 'Times New Roman',
  },
  altDistance: {
    fontSize: 13,
    color: '#5f6368',
    fontFamily: 'Times New Roman',
    marginTop: 2,
  },
  altDiff: {
    fontSize: 11,
    color: '#d97706',
    fontWeight: '600',
    marginTop: 2,
  },
  altCo2: {
    fontSize: 11,
    color: '#16a34a',
    fontWeight: '600',
    marginTop: 4,
    fontFamily: 'Times New Roman',
  },
  stepsSection: {
    marginBottom: 8,
  },
  stepsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#202124',
    fontFamily: 'Times New Roman',
    marginBottom: 12,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e8eaed',
  },
  stepIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#e8f0fe',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  stepContent: {
    flex: 1,
    gap: 2,
  },
  stepInstruction: {
    fontSize: 14,
    color: '#202124',
    fontFamily: 'Times New Roman',
    lineHeight: 20,
  },
  stepMeta: {
    fontSize: 12,
    color: '#80868b',
    fontFamily: 'Times New Roman',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 16,
    paddingBottom: 14,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: '#e8eaed',
  },
  primaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 24,
    backgroundColor: '#1a73e8',
  },
  primaryBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    fontFamily: 'Times New Roman',
  },
  secondaryBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#dadce0',
    backgroundColor: '#fff',
  },
  secondaryBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a73e8',
    fontFamily: 'Times New Roman',
  },
  tripError: {
    color: '#d93025',
    fontSize: 13,
    textAlign: 'center',
    paddingTop: 14,
    paddingHorizontal: 20,
    fontFamily: 'Times New Roman',
  },
  completeBtn: {
    backgroundColor: '#16a34a',
  },
  inProgressChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#16a34a',
    backgroundColor: '#ecfdf5',
  },
  inProgressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#16a34a',
  },
  inProgressText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#16a34a',
    fontFamily: 'Times New Roman',
  },
  stopChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fff7ed',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#f59e0b',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 8,
    marginHorizontal: 16,
  },
  stopChipText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#92400e',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
    borderTopWidth: 1,
    borderTopColor: '#f1f3f4',
    marginTop: 12,
  },
  actionItem: {
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  actionCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f1f3f4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: {
    fontSize: 12,
    color: '#3c4043',
  },
});

export default RouteBottomSheet;