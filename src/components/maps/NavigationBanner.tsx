import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../../shared/store/LanguageContext';

export interface NavStepLike {
  instruction?: string;
}

function parseManeuver(instruction: string): { name: string; rotate: string } {
  const t = (instruction || '').toLowerCase();
  if (/lleg|destino|arrive|alcanc|termin/.test(t)) return { name: 'flag', rotate: '0deg' };
  if (/u-?turn|en u\b|regres/.test(t)) return { name: 'arrow-undo', rotate: '0deg' };
  if (/derecha/.test(t)) return { name: 'arrow-up', rotate: '90deg' };
  if (/izquierda/.test(t)) return { name: 'arrow-up', rotate: '-90deg' };
  if (/contin|segu|adelante|straight|manteng/.test(t)) return { name: 'arrow-up', rotate: '0deg' };
  if (/cruce|cruzar|cross/.test(t)) return { name: 'git-merge', rotate: '0deg' };
  return { name: 'navigate', rotate: '0deg' };
}

interface NavigationBannerProps {
  insetTop: number;
  instruction: string;
  distanceToManeuverText: string | null;
  remainingDistanceText: string;
  remainingDurationText: string;
  stepIndex: number;
  totalSteps: number;
  arrived: boolean;
  voiceEnabled?: boolean;
  onToggleVoice?: () => void;
  onOpenSheet?: () => void;
}

export function NavigationBanner({
  insetTop,
  instruction,
  distanceToManeuverText,
  remainingDistanceText,
  remainingDurationText,
  stepIndex,
  totalSteps,
  arrived,
  voiceEnabled = true,
  onToggleVoice,
  onOpenSheet,
}: NavigationBannerProps) {
  const { t } = useLanguage();
  const maneuver = parseManeuver(instruction);

  if (arrived) {
    return (
      <TouchableOpacity
        style={[styles.card, { top: insetTop + 64 }]}
        onPress={onOpenSheet}
        activeOpacity={0.9}
      >
        <View style={styles.row}>
          <View style={[styles.iconBox, { backgroundColor: '#16a34a' }]}>
            <Ionicons name="flag" size={24} color="#fff" />
          </View>
          <View style={styles.info}>
            <Text style={styles.arrivedTitle}>{t('planRoute.arrivedAlertTitle')}</Text>
            <Text style={styles.instruction} numberOfLines={2}>
              {instruction}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={[styles.card, { top: insetTop + 64 }]}
      onPress={onOpenSheet}
      activeOpacity={0.9}
    >
      <View style={styles.row}>
        <View style={styles.iconBox}>
          <Ionicons
            name={maneuver.name as any}
            size={24}
            color="#fff"
            style={{ transform: [{ rotate: maneuver.rotate }] }}
          />
        </View>
        <View style={styles.info}>
          {distanceToManeuverText ? (
            <Text style={styles.distance}>En {distanceToManeuverText}</Text>
          ) : null}
          <Text style={styles.instruction} numberOfLines={2}>
            {instruction}
          </Text>
        </View>
      </View>
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Quedan {remainingDistanceText} · {remainingDurationText}
        </Text>
        <View style={styles.footerRight}>
          <View style={styles.progressPill}>
            <Text style={styles.progressText}>
              {Math.min(stepIndex + 1, totalSteps)} / {totalSteps}
            </Text>
          </View>
          <TouchableOpacity
            onPress={onToggleVoice}
            style={styles.voiceBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            activeOpacity={0.7}
          >
            <Ionicons
              name={voiceEnabled ? 'volume-high' : 'volume-mute'}
              size={20}
              color={voiceEnabled ? '#fff' : '#9ca3af'}
            />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    position: 'absolute',
    left: 12,
    right: 12,
    zIndex: 96,
    backgroundColor: '#1b5e20',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#2e7d32',
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
  },
  distance: {
    color: '#a5d6a7',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 2,
  },
  instruction: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 21,
  },
  arrivedTitle: {
    color: '#a5d6a7',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  footer: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.15)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  footerText: {
    color: '#c8e6c9',
    fontSize: 13,
    flex: 1,
  },
  progressPill: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  progressText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  footerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  voiceBtn: {
    padding: 4,
  },
});
