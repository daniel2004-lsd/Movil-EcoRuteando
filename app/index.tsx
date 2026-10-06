  // app/index.tsx
  import React, { useState, useRef, useEffect } from 'react';
  import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Modal,
    Animated,
    Easing,
  } from 'react-native';
  import { LinearGradient } from 'expo-linear-gradient';
  import { Ionicons } from '@expo/vector-icons';
  import { useRouter } from 'expo-router';
  import { colors, spacing } from '../src/shared/theme';

  import { LogoCircle } from '../src/shared/components/landing/LogoCircle';
  import { FeatureCard } from '../src/shared/components/landing/FeatureCard';
  import { WhyItem } from '../src/shared/components/landing/WhyItem';

  import { useLanguage } from '../src/shared/store/LanguageContext';
  import { useThemeMode } from '../src/shared/store/ThemeContext';

  const LANGS = [
    { code: 'es', label: 'Español', tag: 'ES' },
    { code: 'en', label: 'English', tag: 'EN' },
    { code: 'fr', label: 'Français', tag: 'FR' },
    { code: 'pt', label: 'Português', tag: 'PT' },
  ];

  export default function LandingScreen() {
    const router = useRouter();
    const [menuOpen, setMenuOpen] = useState(false);

    const { t, lang, setLang } = useLanguage();
    const { theme, toggleTheme } = useThemeMode();
    const isDark = theme === 'dark';

    const heroOpacity = useRef(new Animated.Value(0)).current;
    const heroTranslateY = useRef(new Animated.Value(20)).current;

    const scrollRef = useRef<ScrollView | null>(null);
    const featuresRef = useRef<View | null>(null);
    const whyRef = useRef<View | null>(null);
    const joinRef = useRef<View | null>(null);

    const [featuresY, setFeaturesY] = useState(0);
    const [whyY, setWhyY] = useState(0);
    const [joinY, setJoinY] = useState(0);

    useEffect(() => {
      Animated.parallel([
        Animated.timing(heroOpacity, {
          toValue: 1,
          duration: 550,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(heroTranslateY, {
          toValue: 0,
          duration: 550,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    }, [heroOpacity, heroTranslateY]);

    const scrollToY = (y: number) => {
      if (scrollRef.current) {
        scrollRef.current.scrollTo({ y, animated: true });
      }
    };

    const handleLayoutFeatures = () => {
      featuresRef.current?.measure((x, y, w, h, px, py) => {
        setFeaturesY(py - 80);
      });
    };

    const handleLayoutWhy = () => {
      whyRef.current?.measure((x, y, w, h, px, py) => {
        setWhyY(py - 80);
      });
    };

    const handleLayoutJoin = () => {
      joinRef.current?.measure((x, y, w, h, px, py) => {
        setJoinY(py - 80);
      });
    };

    return (
      <>
        {/* Header fijo */}
        <View
          style={[
            s.fixedHeader,
            {
              backgroundColor: isDark
                ? 'rgba(6,78,59,0.98)'
                : 'rgba(6,78,59,0.96)',
            },
          ]}
        >
          <View style={s.logoRow}>
            <LogoCircle size={24} />
            <Text style={s.logoText}>{t('common.appName')}</Text>
          </View>

          <View style={s.headerRight}>
            <TouchableOpacity
              onPress={toggleTheme}
              style={s.themeBtn}
            accessibilityLabel={`${t('landing.changeLanguage')} ${lang.toUpperCase()}`}
            >
              <Ionicons
                name={isDark ? 'sunny-outline' : 'moon-outline'}
                size={18}
                color="#ecfdf5"
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={s.menuBtn}
              onPress={() => setMenuOpen(true)}
              accessibilityLabel={t('landing.openMenu')}
            >
              <View style={s.menuLine} />
              <View style={s.menuLine} />
              <View style={s.menuLine} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Contenido */}
        <ScrollView
          ref={scrollRef}
          style={{
            flex: 1,
            backgroundColor: isDark ? '#01120c' : '#f3f4f0',
          }}
          contentContainerStyle={{
            paddingBottom: spacing.xl,
            paddingTop: 80,
          }}
          showsVerticalScrollIndicator={false}
        >
          {/* HERO */}
          <LinearGradient
            colors={
              isDark
                ? ['#022c22', '#064e3b', '#15803d']
                : ['#0f172a', '#064e3b', '#15803d']
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={s.heroWrapper}
          >
            <View style={s.bubbleOne} />
            <View style={s.bubbleTwo} />
            <View style={s.bubbleThree} />

            <Animated.View
              style={{
                opacity: heroOpacity,
                transform: [{ translateY: heroTranslateY }],
              }}
            >
              <View style={s.tagPill}>
                <Text style={s.tagPillText}>{t('landing.tagline')}</Text>
              </View>

              <Text style={s.heroTitle}>{t('landing.heroTitle')}</Text>
              <Text style={s.heroSlogan}>{t('landing.heroSlogan')}</Text>
              <Text style={s.heroDesc}>{t('landing.heroDesc')}</Text>

              <View style={s.heroButtons}>
                <TouchableOpacity
                  style={s.heroBtnSecondary}
                  activeOpacity={0.9}
                  onPress={() => router.push('/(auth)/guest')}
                >
                  <Text style={s.heroBtnSecondaryText}>
                    {t('landing.guestButton')}
                  </Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </LinearGradient>



          {/* Características */}
          <View
            ref={featuresRef}
            onLayout={handleLayoutFeatures}
            style={[
              s.section,
              { backgroundColor: isDark ? '#021811' : '#f9f6f0' },
            ]}
          >
            <Text style={s.sectionTitle}> {t('landing.mobilityTitle')}</Text>
            <Text style={s.sectionSubtitle}>
                {t('landing.mobilityDesc')}
            </Text>

            <View style={s.cardGrid}>
              <FeatureCard
                icon="map-outline"
                title={t('landing.optimizedRoutes')}
                desc={t('landing.optimizedRoutesDesc')}
              />
              <FeatureCard
                icon="pulse-outline"
                title={t('landing.environmentalImpact')}
                desc={t('landing.environmentalImpactDesc')}
              />
              <FeatureCard
                icon="heart-outline"
                title={t('landing.easyUse')}
                desc={t('landing.easyUseDesc')}
              />
            </View>
          </View>

          {/* ¿Por qué EcoRuteando? */}
          <View
            ref={whyRef}
            onLayout={handleLayoutWhy}
            style={[
              s.section,
              { backgroundColor: isDark ? '#020c09' : '#ffffff' },
            ]}
          >
            <Text style={s.sectionTitle}>  {t('landing.whyTitle')}</Text>

            <View style={{ marginTop: spacing.md }}>
            <WhyItem
              icon="time-outline"
              title={t('landing.whyRealtime')}
              desc={t('landing.whyRealtimeDesc')}
            />

            <WhyItem
              icon="leaf-outline"
              title={t('landing.whyGreen')}
              desc={t('landing.whyGreenDesc')}
            />
            </View>

            <View style={s.whyGraphicWrapper}>
              <View style={s.whyCircle}>
                <Ionicons name="leaf-outline" size={40} color="#166534" />
              </View>
              <View style={[s.badge, { top: -10, right: 0 }]}>
                <Text style={s.badgeNumber}>34+</Text>
                <Text style={s.badgeText}>{t('landing.routes')}</Text>
              </View>
            </View>
          </View>

          {/* Footer / Únete */}
          <View
            ref={joinRef}
            onLayout={handleLayoutJoin}
            style={[
              s.footerWrapper,
              { backgroundColor: isDark ? '#01120c' : '#022c22' },
            ]}
          >
            <View style={s.footerLogoRow}>
              <LogoCircle size={28} />
              <Text style={s.footerLogoText}>{t('common.appName')}</Text>
            </View>

            <Text style={s.footerText}>
              {t('landing.footerText')}
            </Text>

            <View style={s.footerLinksRow}>
              <Text style={s.footerLink}> {t('landing.privacy')}</Text>
              <Text style={s.footerDot}>·</Text>
              <Text style={s.footerLink}>{t('landing.terms')}</Text>
              <Text style={s.footerDot}>·</Text>
              <Text style={s.footerLink}>{t('landing.contact')}</Text>
            </View>

            <TouchableOpacity
              style={s.footerBtn}
              activeOpacity={0.9}
              onPress={() => router.push('/(auth)/register')}
            >
              <Text style={s.footerBtnText}>
                {t('landing.guestButton')}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Drawer */}
        <Modal visible={menuOpen} animationType="slide" transparent>
          <View style={s.overlay}>
            <View
              style={[
                s.drawer,
                { backgroundColor: isDark ? '#020617' : '#f9fafb' },
              ]}
            >
              <View style={s.drawerHeader}>
                <View style={s.logoRow}>
                  <LogoCircle size={26} />
                  <Text
                    style={[
                      s.logoText,
                      { color: isDark ? '#e5f9f0' : colors.ecoDark },
                    ]}
                  >
                    {t('common.appName')}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setMenuOpen(false)}>
                  <Ionicons
                    name="close"
                    size={22}
                    color={isDark ? '#9ca3af' : '#64748b'}
                  />
                </TouchableOpacity>
              </View>

              <ScrollView
                contentContainerStyle={{ paddingBottom: 24, flexGrow: 1 }}
                showsVerticalScrollIndicator={false}
              >
                {/* Navegación principal */}
                <View style={s.drawerSection}>
                  <DrawerItem
                    label={t('landing.features')}
                    icon="map-outline"
                    dark={isDark}
                    onPress={() => {
                      setMenuOpen(false);
                      scrollToY(featuresY || 0);
                    }}
                  />
                  <DrawerItem
                    label={t('landing.whyMenu')}
                    icon="pulse-outline"
                    dark={isDark}
                    onPress={() => {
                      setMenuOpen(false);
                      scrollToY(whyY || 0);
                    }}
                  />
                  <DrawerItem
                    label={t('landing.join')}
                    icon="heart-outline"
                    dark={isDark}
                    onPress={() => {
                      setMenuOpen(false);
                      scrollToY(joinY || 0);
                    }}
                  />
                </View>

                {/* Idioma */}
                <View style={s.drawerSection}>
                  <Text style={s.drawerSubtitle}>
                    {t('landing.drawerLanguage') ?? 'IDIOMA'}
                  </Text>
                  <View style={s.langGrid}>
                    {LANGS.map(l => {
                      const active = l.code === lang;
                      return (
                        <TouchableOpacity
                          key={l.code}
                          style={[
                            s.langChip,
                            active && s.langChipActive,
                          ]}
                          onPress={() => setLang(l.code as any)}
                          accessibilityLabel={t('landing.changeTheme')}
                        >
                          <Text
                            style={[
                              s.langCode,
                              active && s.langCodeActive,
                            ]}
                          >
                            {l.tag}
                          </Text>
                          <Text
                            style={[
                              s.langLabel,
                              active && s.langLabelActive,
                            ]}
                          >
                            {l.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* Acceso rápido */}
                <View style={[s.drawerSection, s.drawerBottomSection]}>
                  <Text style={s.drawerSubtitle}>
                    {t('landing.drawerAccess') ?? 'ACCESO RÁPIDO'}
                  </Text>

                  <TouchableOpacity
                    style={s.drawerPrimary}
                    onPress={() => {
                      setMenuOpen(false);
                      router.push('/(auth)/register');
                    }}
                  >
                    <Ionicons
                      name="person-add-outline"
                      size={18}
                      color="#f9fafb"
                      style={{ marginRight: 6 }}
                    />
                    <Text style={s.drawerPrimaryText}>
                      {t('auth.registerButton') ?? 'Registrarse'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={s.drawerSecondary}
                    onPress={() => {
                      setMenuOpen(false);
                      router.push('/(auth)/login');
                    }}
                  >
                    <Ionicons
                      name="log-in-outline"
                      size={18}
                      color="#0f172a"
                      style={{ marginRight: 6 }}
                    />
                    <Text style={s.drawerSecondaryText}>
                      {t('auth.loginButton') ?? 'Iniciar sesión'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={s.drawerGhost}
                    onPress={() => {
                      setMenuOpen(false);
                      router.push('/(auth)/guest');
                    }}
                  >
                    <Ionicons
                      name="walk-outline"
                      size={18}
                      color="#15803d"
                      style={{ marginRight: 6 }}
                    />
                    <Text style={s.drawerGhostText}>
                      {t('landing.guestButton') ?? 'Modo invitado'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>
      </>
    );
  }

  function DrawerItem({
    label,
    icon,
    onPress,
    dark,
  }: {
    label: string;
    icon: any;
    onPress?: () => void;
    dark?: boolean;
  }) {
    return (
      <TouchableOpacity
        style={s.drawerItem}
        onPress={onPress}
        activeOpacity={0.8}
      >
        <Ionicons
          name={icon}
          size={20}
          color={dark ? '#e5f9f0' : '#0f172a'}
        />
        <Text
          style={[
            s.drawerItemText,
            dark && { color: '#e5f9f0' },
          ]}
        >
          {label}
        </Text>
      </TouchableOpacity>
    );
  }

  const s = StyleSheet.create({
    fixedHeader: {
      position: 'absolute',
      top: 8,
      left: 0,
      right: 0,
      height: 72,
      paddingHorizontal: spacing.lg,
      paddingTop: 12,
      paddingBottom: 8,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      zIndex: 20,
    },
    logoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    logoText: {
      fontFamily: 'Times New Roman',
      fontSize: 18,
      color: '#ecfdf5',
    },
    headerRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    themeBtn: {
      width: 30,
      height: 30,
      borderRadius: 15,
      borderWidth: 1,
      borderColor: 'rgba(148,163,184,0.7)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    menuBtn: { gap: 4 },
    menuLine: {
      width: 22,
      height: 2,
      borderRadius: 1,
      backgroundColor: '#ecfdf5',
    },

    heroWrapper: {
      paddingTop: spacing.xl * 1.2,
      paddingBottom: spacing.lg,
      paddingHorizontal: spacing.lg,
      borderBottomLeftRadius: 24,
      borderBottomRightRadius: 24,
      overflow: 'hidden',
    },
    bubbleOne: {
      position: 'absolute',
      width: 180,
      height: 180,
      borderRadius: 90,
      backgroundColor: 'rgba(34,197,94,0.18)',
      top: -40,
      right: -30,
    },
    bubbleTwo: {
      position: 'absolute',
      width: 140,
      height: 140,
      borderRadius: 70,
      backgroundColor: 'rgba(16,185,129,0.16)',
      bottom: -20,
      left: -30,
    },
    bubbleThree: {
      position: 'absolute',
      width: 90,
      height: 90,
      borderRadius: 45,
      backgroundColor: 'rgba(22,163,74,0.18)',
      top: 120,
      left: -10,
    },

    tagPill: {
      alignSelf: 'center',
      paddingHorizontal: 16,
      paddingVertical: 6,
      borderRadius: 999,
      backgroundColor: '#c5e8d4',
      marginBottom: 18,
    },
    tagPillText: {
      fontFamily: 'Times New Roman',
      fontSize: 11,
      fontWeight: '700',
      color: '#1f2933',
    },
    heroTitle: {
      fontFamily: 'Times New Roman',
      fontSize: 32,
      color: '#f9fafb',
      textAlign: 'center',
    },
    heroSlogan: {
      fontFamily: 'Times New Roman',
      fontSize: 18,
      color: '#e2f3e8',
      textAlign: 'center',
      marginTop: 4,
    },
    heroDesc: {
      fontFamily: 'Times New Roman',
      fontSize: 13,
      color: 'rgba(234,248,240,0.95)',
      textAlign: 'center',
      marginTop: 10,
      lineHeight: 20,
    },
    heroButtons: {
      marginTop: spacing.md,
      alignItems: 'center',
    },
    heroBtnSecondary: {
      paddingVertical: 11,
      paddingHorizontal: 32,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.4)',
      backgroundColor: 'rgba(255,255,255,0.15)',
    },
    heroBtnSecondaryText: {
      fontFamily: 'Times New Roman',
      fontSize: 14,
      color: '#f1f5f9',
    },

    section: {
      marginTop: spacing.lg,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
    },
    sectionTitle: {
      fontFamily: 'Times New Roman',
      fontSize: 20,
      color: colors.ecoDark,
      marginBottom: 4,
    },
    sectionSubtitle: {
      fontFamily: 'Times New Roman',
      fontSize: 13,
      color: colors.textMuted,
      marginBottom: spacing.md,
    },
    cardGrid: { gap: spacing.md },

    whyGraphicWrapper: {
      marginTop: spacing.lg,
      alignItems: 'center',
      justifyContent: 'center',
    },
    whyCircle: {
      width: 150,
      height: 150,
      borderRadius: 75,
      backgroundColor: '#dcfce7',
      alignItems: 'center',
      justifyContent: 'center',
      elevation: 6,
    },
    badge: {
      position: 'absolute',
      backgroundColor: '#ffffff',
      borderRadius: 16,
      paddingHorizontal: 12,
      paddingVertical: 6,
      elevation: 4,
    },
    badgeNumber: {
      fontFamily: 'Times New Roman',
      fontSize: 16,
      color: '#166534',
      textAlign: 'center',
    },
    badgeText: {
      fontFamily: 'Times New Roman',
      fontSize: 11,
      color: '#6b7280',
      textAlign: 'center',
    },

    footerWrapper: {
      marginTop: spacing.lg,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.lg,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      alignItems: 'center',
      gap: 8,
    },
    footerLogoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    footerLogoText: {
      fontFamily: 'Times New Roman',
      fontSize: 16,
      color: '#ffffff',
    },
    footerText: {
      fontFamily: 'Times New Roman',
      fontSize: 12,
      color: '#d1fae5',
    },
    footerLinksRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginTop: 4,
    },
    footerLink: {
      fontFamily: 'Times New Roman',
      fontSize: 11,
      color: '#a7f3d0',
    },
    footerDot: {
      fontFamily: 'Times New Roman',
      fontSize: 11,
      color: '#6ee7b7',
    },
    footerBtn: {
      marginTop: spacing.md,
      paddingVertical: 10,
      paddingHorizontal: 24,
      borderRadius: 20,
      backgroundColor: '#f9fafb',
    },
    footerBtnText: {
      fontFamily: 'Times New Roman',
      fontSize: 13,
      color: '#064e3b',
    },

    overlay: {
      flex: 1,
      backgroundColor: 'rgba(15,23,42,0.55)',
      flexDirection: 'row',
      justifyContent: 'flex-end',
    },
    drawer: {
      width: '78%',
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.lg,
      paddingBottom: spacing.md,
    },
    drawerHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.lg,
    },
    drawerSection: {
      marginBottom: spacing.lg,
    },
    drawerBottomSection: {
      marginTop: 'auto',
    },

    drawerItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingVertical: 12,
    },
    drawerItemText: {
      fontFamily: 'Times New Roman',
      fontSize: 16,
      color: '#0f172a',
    },

    drawerSubtitle: {
      fontFamily: 'Times New Roman',
      fontSize: 12,
      color: '#94a3b8',
      letterSpacing: 1,
      marginBottom: 10,
    },

    langGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    langChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: '#e2e8f0',
      backgroundColor: '#ffffff',
    },
    langChipActive: {
      backgroundColor: '#bbf7d0',
      borderColor: '#16a34a',
    },
    langCode: {
      fontFamily: 'Times New Roman',
      fontSize: 12,
      color: '#64748b',
    },
    langCodeActive: { color: '#064e3b' },
    langLabel: {
      fontFamily: 'Times New Roman',
      fontSize: 13,
      color: '#64748b',
    },
    langLabelActive: { color: '#064e3b' },

    drawerPrimary: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 999,
      backgroundColor: '#16a34a',
      paddingVertical: 11,
      marginBottom: 8,
    },
    drawerPrimaryText: {
      fontFamily: 'Times New Roman',
      fontSize: 15,
      color: '#f9fafb',
    },
    drawerSecondary: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 999,
      backgroundColor: '#ffffff',
      paddingVertical: 10,
      borderWidth: 1,
      borderColor: '#e2e8f0',
      marginBottom: 8,
    },
    drawerSecondaryText: {
      fontFamily: 'Times New Roman',
      fontSize: 14,
      color: '#0f172a',
    },
    drawerGhost: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 999,
      backgroundColor: '#ecfdf5',
      paddingVertical: 10,
    },
    drawerGhostText: {
      fontFamily: 'Times New Roman',
      fontSize: 14,
      color: '#15803d',
    },
  });