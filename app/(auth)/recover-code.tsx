// app/(auth)/recover-code.tsx
import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { colors, spacing } from '../../src/shared/theme';
import { LogoCircle } from '../../src/shared/components/landing/LogoCircle';
import { GradientButton } from '../../src/shared/components/ui/GradientButton';
import { useThemeMode } from '../../src/shared/store/ThemeContext';
import { useLanguage } from '../../src/shared/store/LanguageContext';
import apiClient from '../../src/shared/services/apiClient';

export default function RecoverCodeScreen() {
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email?: string }>();
  const { theme } = useThemeMode();
  const { t } = useLanguage();
  const isDark = theme === 'dark';

  const [code, setCode] = useState(Array(6).fill(''));
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const inputs = useRef<Array<TextInput | null>>([]);
  const fadeIn = useRef(new Animated.Value(0)).current;
  const slideUp = useRef(new Animated.Value(60)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeIn, {
        toValue: 1,
        duration: 700,
        useNativeDriver: false,
      }),
      Animated.spring(slideUp, {
        toValue: 0,
        tension: 50,
        friction: 9,
        useNativeDriver: false,
      }),
    ]).start();
  }, [fadeIn, slideUp]);

  const handleChange = (value: string, index: number) => {
    const next = [...code];
    next[index] = value.slice(-1);
    setCode(next);
    if (value && index < 5) {
      inputs.current[index + 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const joined = code.join('');
    if (joined.length < 6) {
      setError(
        t('auth.recoverCodeErrorFill') ?? 'Completa los 6 digitos del codigo'
      );
      return;
    }
    setError(null);
    setLoading(true);
    try {
      router.push({
        pathname: '/(auth)/recover-new-password',
        params: { email, token: joined },
      });
    } catch (err: any) {
      setError(err?.message || 'Codigo invalido');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      await apiClient.post('/api/auth/forgot-password', { email });
      setError(null);
    } catch {
      setError(t('auth.resendError'));
    }
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
      {/* burbujas de fondo */}
      <View style={s.bubble1} />
      <View style={s.bubble2} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={s.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Logo superior */}
          <View style={s.logoTop}>
            <View style={s.logoCircleOuter}>
              <LogoCircle size={42} />
            </View>
            <Text style={s.logoTitle}>EcoRuteando</Text>
          </View>

          {/* Tarjeta */}
          <Animated.View
            style={[
              s.card,
              { opacity: fadeIn, transform: [{ translateY: slideUp }] },
              isDark && {
                backgroundColor: 'rgba(15,23,23,0.97)',
                borderColor: 'rgba(148,163,184,0.4)',
              },
            ]}
          >
            {/* Pasos */}
            <View style={s.stepsRow}>
              <StepDot label={t('auth.stepEmail') ?? 'CORREO'} index={1} done />
              <StepSeparator />
              <StepDot
                label={t('auth.stepCode') ?? 'CÓDIGO'}
                index={2}
                active
              />
              <StepSeparator />
              <StepDot
                label={t('auth.stepPassword') ?? 'CONTRASEÑA'}
                index={3}
              />
            </View>

            {/* Icono */}
            <View style={s.iconCircle}>
              <Ionicons
                name="shield-checkmark-outline"
                size={32}
                color={colors.ecoMain}
              />
            </View>

            <Text
              style={[
                s.title,
                isDark && { color: '#e5f9f0' },
              ]}
            >
              {t('auth.recoverCodeTitle') ?? 'Verificar código'}
            </Text>
            <Text
              style={[
                s.subtitle,
                isDark && { color: '#9ca3af' },
              ]}
            >
              {t('auth.recoverCodeSubtitle') ??
                'Hemos enviado un código de 6 dígitos a tu correo registrado'}{' '}
              {email ? `(${String(email)}).` : ''}
            </Text>

            {/* Inputs de código más pequeños */}
            <View style={s.codeRow}>
              {code.map((v, i) => (
                <TextInput
                  key={i}
                  ref={ref => {
                    inputs.current[i] = ref;
                  }}
                  style={[
                    s.codeInput,
                    activeIndex === i && {
                      borderColor: colors.ecoMain,
                      shadowOpacity: 0.07,
                      shadowRadius: 8,
                    },
                    isDark && {
                      backgroundColor: '#020617',
                      color: '#e5e7eb',
                      borderColor:
                        activeIndex === i ? colors.ecoMain : '#475569',
                    },
                  ]}
                  keyboardType="number-pad"
                  maxLength={1}
                  value={v}
                  onChangeText={value => handleChange(value, i)}
                  textAlign="center"
                  onFocus={() => setActiveIndex(i)}
                  onBlur={() => setActiveIndex(null)}
                />
              ))}
            </View>

            {error && <Text style={s.error}>{error}</Text>}

            <Text style={s.resendHint}>
              {t('auth.recoverCodeNotReceived') ?? '¿No recibiste el código?'}{' '}
              <Text style={s.resendLink} onPress={handleResend}>
                {t('auth.recoverCodeResend') ?? 'Reenviar'}
              </Text>
            </Text>

            <GradientButton
              title={t('auth.recoverCodeButton') ?? 'Verificar código'}
              onPress={handleVerify}
              loading={loading}
              style={{ marginTop: spacing.md }}
            />

            <TouchableOpacity
              style={s.backRow}
              onPress={() => router.back()}
            >
              <Ionicons
                name="arrow-back"
                size={18}
                color={colors.textMuted}
              />
              <Text style={s.backText}>
                {t('auth.back') ?? 'Volver'}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

/* Componentes de pasos */
function StepDot({
  label,
  index,
  active,
  done,
}: {
  label: string;
  index: number;
  active?: boolean;
  done?: boolean;
}) {
  return (
    <View style={sStep.container}>
      <View
        style={[
          sStep.circle,
          done && sStep.circleDone,
          active && !done && sStep.circleActive,
        ]}
      >
        {done ? (
          <Ionicons name="checkmark" size={14} color="#ecfdf5" />
        ) : (
          <Text
            style={[
              sStep.index,
              active && { color: '#166534' },
            ]}
          >
            {index}
          </Text>
        )}
      </View>
      <Text
        style={[
          sStep.label,
          (active || done) && { color: '#166534' },
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

function StepSeparator() {
  return <View style={sStep.separator} />;
}

/* Estilos */
const s = StyleSheet.create({
  bg: { flex: 1 },
  bubble1: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(94,168,122,0.14)',
    top: -80,
    right: -80,
  },
  bubble2: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(44,95,63,0.18)',
    bottom: -60,
    left: -80,
  },
  scroll: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  logoTop: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  logoCircleOuter: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 2,
    borderColor: '#ccead7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  logoTitle: {
    fontFamily: 'Times New Roman',
    fontSize: 22,
    color: '#022c22',
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#ffffff',
    borderRadius: 28,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: '#e5f0e9',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  stepsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#e9f7ef',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontFamily: 'Times New Roman',
    fontSize: 20,
    color: colors.ecoDark,
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontFamily: 'Times New Roman',
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  codeRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    columnGap: 6,
    marginBottom: spacing.md,
  },
  codeInput: {
    width: 36,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d9e8dd',
    backgroundColor: '#fbfdfb',
    fontFamily: 'Times New Roman',
    fontSize: 18,
    color: '#0f172a',
    textAlignVertical: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  error: {
    marginTop: spacing.xs,
    fontFamily: 'Times New Roman',
    fontSize: 12,
    color: '#dc2626',
    textAlign: 'center',
  },
  resendHint: {
    marginTop: spacing.sm,
    fontFamily: 'Times New Roman',
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
  },
  resendLink: {
    color: colors.ecoMain,
    textDecorationLine: 'underline',
  },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: spacing.lg,
  },
  backText: {
    fontFamily: 'Times New Roman',
    fontSize: 13,
    color: colors.textMuted,
  },
});

const sStep = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  circle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: '#9ca3af',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f9fafb',
  },
  circleActive: {
    borderColor: '#16a34a',
  },
  circleDone: {
    backgroundColor: '#16a34a',
    borderColor: '#16a34a',
  },
  index: {
    fontFamily: 'Times New Roman',
    fontSize: 13,
    color: '#6b7280',
  },
  label: {
    marginTop: 4,
    fontFamily: 'Times New Roman',
    fontSize: 11,
    color: '#6b7280',
  },
  separator: {
    width: 32,
    height: 2,
    marginHorizontal: 6,
    backgroundColor: '#d1d5db',
  },
});