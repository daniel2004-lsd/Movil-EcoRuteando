// app/(auth)/guest.tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useLanguage } from '../../src/shared/store/LanguageContext';
import { useAuth } from '../../src/shared/store/AuthContext';
import { colors, spacing } from '../../src/shared/theme';
import { LogoCircle } from '../../src/shared/components/landing/LogoCircle';
import { useThemeMode } from '../../src/shared/store/ThemeContext';
export default function GuestScreen() {
  const router = useRouter();
  const { theme, toggleTheme } = useThemeMode();
  const isDark = theme === 'dark';
  const { t } = useLanguage();
  const { enterGuest } = useAuth();

  const enterMap = async () => {
    await enterGuest();
    router.replace('/(tabs)/plan-route');
  };

  const bgGradient: [string, string, string] = isDark
    ? ['#022c22', '#064e3b', '#14532d']
    : ['#1a3d2b', '#2c5f3f', '#4a8f65'];

  return (
    <LinearGradient
      colors={bgGradient}
      style={s.bg}
      start={{ x: 0.1, y: 0 }}
      end={{ x: 0.9, y: 1 }}
    >
      {/* Header */}
      <View style={s.header}>
        <View style={s.logoRow}>
          <LogoCircle size={32} />
          <Text style={s.appName}>EcoRuteando</Text>
        </View>
        <View style={s.headerActions}>
          <TouchableOpacity
            style={s.themeBtn}
            onPress={toggleTheme}
            activeOpacity={0.7}
          >
            <Text style={{ fontSize: 16 }}>{isDark ? '☀️' : '🌙'}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={s.backRow}
            onPress={() => router.back()}
          >
            <Ionicons
              name="close-outline"
              size={22}
              color="#f9fafb"
            />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={s.wrapper}>
          {/* Título e intro */}
          <View style={s.hero}>
            <Text style={s.heroTitle}>{t('guest.title')}</Text>
            <Text style={s.heroSubtitle}>
              {t('guest.subtitle')}
            </Text>
          </View>

          {/* Capacidades del modo invitado */}
          <View style={[s.card, isDark && s.cardDark]}>
            <Text style={[s.cardTitle, isDark && s.cardTitleDark]}>{t('guest.capabilitiesTitle')}</Text>
            <Text style={[s.cardSubtitle, isDark && s.cardSubtitleDark]}>{t('guest.capabilitiesSubtitle')}</Text>

            {[
              { icon: 'search-outline', key: 'guest.capabilitySearch' },
              { icon: 'location-outline', key: 'guest.capabilityLocation' },
              { icon: 'car-outline', key: 'guest.capabilityDirections' },
              { icon: 'storefront-outline', key: 'guest.capabilityBusiness' },
              { icon: 'planet-outline', key: 'guest.capabilityMapViews' },
              { icon: 'navigate-outline', key: 'guest.capabilityCurrentLocation' },
            ].map(item => (
              <View key={item.key} style={s.capRow}>
                <View style={[s.capIcon, isDark && { backgroundColor: 'rgba(22,163,74,0.25)' }]}>
                  <Ionicons name={item.icon as any} size={15} color={isDark ? '#4ade80' : '#16a34a'} />
                </View>
                <Text style={[s.capText, isDark && s.capTextDark]}>{t(item.key)}</Text>
              </View>
            ))}

            <View style={[s.capNote, isDark && s.capNoteDark]}>
              <Ionicons name="lock-closed-outline" size={13} color={isDark ? '#94a3b8' : '#6b7280'} />
              <Text style={[s.capNoteText, isDark && s.capNoteTextDark]}>{t('guest.guestNote')}</Text>
            </View>

            <TouchableOpacity
              style={s.enterBtn}
              onPress={enterMap}
              activeOpacity={0.85}
            >
              <Ionicons name="map-outline" size={16} color="#f0fdf4" />
              <Text style={s.enterBtnText}>{t('guest.enterMap')}</Text>
            </TouchableOpacity>
          </View>

          {/* Qué datos verás en tu ruta */}
          <View style={[s.card, isDark && s.cardDark]}>
            <Text style={[s.cardTitle, isDark && s.cardTitleDark]}>
              {t('guest.routeTitle')}
            </Text>
            <Text style={[s.cardSubtitle, isDark && s.cardSubtitleDark]}>
              {t('guest.routeSubtitle')}
            </Text>

            {[
              { icon: 'time-outline', key: 'guest.featureTime' },
              { icon: 'map-outline', key: 'guest.featureDistance' },
              { icon: 'leaf-outline', key: 'guest.featureCo2' },
            ].map(item => (
              <View key={item.key} style={s.capRow}>
                <View style={[s.capIcon, isDark && { backgroundColor: 'rgba(22,163,74,0.25)' }]}>
                  <Ionicons name={item.icon as any} size={15} color={isDark ? '#4ade80' : '#16a34a'} />
                </View>
                <Text style={[s.capText, isDark && s.capTextDark]}>{t(item.key)}</Text>
              </View>
            ))}
          </View>

          {/* CTA */}
          <View style={[s.ctaCard, isDark && s.ctaCardDark]}>
            <Text style={[s.ctaTitle, isDark && s.ctaTitleDark]}>
              {t('guest.ctaTitle')}
            </Text>
            <Text style={[s.ctaText, isDark && s.ctaTextDark]}>
              {t('guest.ctaText')}
            </Text>

            <View style={s.ctaButtonsRow}>
              <TouchableOpacity
                style={[s.primaryBtn, isDark && s.primaryBtnDark]}
                onPress={() => router.push('/(auth)/register')}
              >
                <Text style={s.primaryBtnText}>{t('guest.ctaPrimaryBtn')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[s.secondaryBtn, isDark && s.secondaryBtnDark]}
                onPress={() => router.push('/(auth)/login')}
              >
                <Text style={[s.secondaryBtnText, isDark && s.secondaryBtnTextDark]}>{t('guest.ctaSecondaryBtn')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  bg: {
    flex: 1,
    // más aire arriba en móvil para despegar de la barra de estado y notch
    paddingTop: Platform.OS === 'web' ? 24 : 44,
  },
  header: {
    paddingHorizontal: spacing.md,
    paddingTop: Platform.OS === 'android' ? 44 : spacing.xl,     // asegura que no lo tape la barra de estado o notch
    paddingBottom: spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  appName: {
    fontFamily: 'Times New Roman',
    fontSize: 22,
    color: '#f9fafb',
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  themeBtn: {
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(15,23,42,0.35)',
    marginTop: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backRow: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(15,23,42,0.35)',
    marginTop: 4,
  },
  scroll: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl,
    paddingTop: spacing.sm,    // separa header del título “Modo invitado”
  },
  wrapper: {
    width: '100%',
    maxWidth: 900,
    alignSelf: 'center',
  },
  hero: {
    marginBottom: spacing.md,
  },
  heroTitle: {
    fontFamily: 'Times New Roman',
    fontSize: 26,
    color: '#f9fafb',
    marginBottom: 4,
  },
  heroSubtitle: {
    fontFamily: 'Times New Roman',
    fontSize: 13,
    color: '#e5e7eb',
    lineHeight: 18,
  },
  card: {
    borderRadius: 24,
    backgroundColor: '#f9fafb',
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.35)',
    marginBottom: spacing.md,
  },
  cardDark: {
    backgroundColor: 'rgba(15,23,42,0.85)',
    borderColor: 'rgba(51,65,85,0.7)',
  },
  cardTitle: {
    fontFamily: 'Times New Roman',
    fontSize: 18,
    color: '#0f172a',
    marginBottom: 4,
  },
  cardTitleDark: {
    color: '#f1f5f9',
  },
  cardSubtitle: {
    fontFamily: 'Times New Roman',
    fontSize: 12,
    color: '#6b7280',
    marginBottom: spacing.sm,
  },
  cardSubtitleDark: {
    color: '#94a3b8',
  },

  capRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 8,
  },
  capIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#dcfce7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  capText: {
    flex: 1,
    fontFamily: 'Times New Roman',
    fontSize: 13,
    color: '#0f172a',
  },
  capTextDark: {
    color: '#e2e8f0',
  },
  capNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  capNoteDark: {
    backgroundColor: 'rgba(30,41,59,0.7)',
  },
  capNoteText: {
    flex: 1,
    fontFamily: 'Times New Roman',
    fontSize: 12,
    color: '#6b7280',
  },
  capNoteTextDark: {
    color: '#94a3b8',
  },
  enterBtn: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    borderRadius: 999,
    backgroundColor: '#16a34a',
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  enterBtnText: {
    fontFamily: 'Times New Roman',
    fontSize: 15,
    fontWeight: '700',
    color: '#f0fdf4',
  },


  ctaCard: {
    borderRadius: 24,
    backgroundColor: 'rgba(223,238,227,0.96)',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  ctaCardDark: {
    backgroundColor: 'rgba(15,23,42,0.92)',
    borderWidth: 1,
    borderColor: 'rgba(51,65,85,0.7)',
  },
  ctaTitle: {
    fontFamily: 'Times New Roman',
    fontSize: 18,
    color: '#0f172a',
    marginBottom: spacing.xs,
  },
  ctaTitleDark: {
    color: '#f1f5f9',
  },
  ctaText: {
    fontFamily: 'Times New Roman',
    fontSize: 13,
    color: '#0f172a',
    marginBottom: spacing.md,
    lineHeight: 18,
  },
  ctaTextDark: {
    color: '#cbd5e1',
  },
  ctaButtonsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  primaryBtn: {
    flex: 1,
    borderRadius: 999,
    backgroundColor: '#1f2937',
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnDark: {
    backgroundColor: '#10b981',
  },
  primaryBtnText: {
    fontFamily: 'Times New Roman',
    fontSize: 14,
    color: '#f9fafb',
  },
  secondaryBtn: {
    flex: 1,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#1f2937',
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f9fafb',
  },
  secondaryBtnDark: {
    borderColor: '#475569',
    backgroundColor: '#1e293b',
  },
  secondaryBtnText: {
    fontFamily: 'Times New Roman',
    fontSize: 14,
    color: '#1f2937',
  },
  secondaryBtnTextDark: {
    color: '#f1f5f9',
  },
});