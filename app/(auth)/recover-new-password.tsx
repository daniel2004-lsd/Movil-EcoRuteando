// app/(auth)/recover-new-password.tsx
import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { InputField } from '../../src/shared/components/ui/InputField';
import { GradientButton } from '../../src/shared/components/ui/GradientButton';
import { colors, spacing } from '../../src/shared/theme';
import { LogoCircle } from '../../src/shared/components/landing/LogoCircle';
import { useThemeMode } from '../../src/shared/store/ThemeContext';
import { useLanguage } from '../../src/shared/store/LanguageContext';
import apiClient from '../../src/shared/services/apiClient';

export default function RecoverNewPasswordScreen() {
  const router = useRouter();
  const { email, token } = useLocalSearchParams<{ email?: string; token?: string }>();
  const { theme } = useThemeMode();
  const { t } = useLanguage();
  const isDark = theme === 'dark';

  const [pass, setPass] = useState('');
  const [pass2, setPass2] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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

  const handleSubmit = async () => {
    if (!pass || !pass2) {
      setError(t('auth.fillBothFields'));
      return;
    }
    if (pass.length < 8) {
      setError(t('auth.passwordMin8Error'));
      return;
    }
    if (pass !== pass2) {
      setError(t('auth.passwordMismatch'));
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await apiClient.post('/api/auth/reset-password', {
        token,
        newPassword: pass,
      });
      router.replace('/(auth)/login');
    } catch (err: any) {
      setError(err?.message || t('auth.resetPassError'));
    } finally {
      setLoading(false);
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
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={s.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={s.logoTop}>
            <View style={s.logoCircleOuter}>
              <LogoCircle size={42} />
            </View>
            <Text style={s.logoTitle}>{t('common.appName')}</Text>
          </View>

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
            <View style={s.stepsRow}>
              <StepDot label={t('auth.stepEmailLabel')} index={1} done />
              <StepSeparator />
              <StepDot label={t('auth.stepCodeLabel')} index={2} done />
              <StepSeparator />
              <StepDot label={t('auth.stepPasswordLabel')} index={3} active />
            </View>

            <View style={s.iconCircle}>
              <Ionicons
                name="key-outline"
                size={32}
                color={colors.ecoMain}
              />
            </View>

            <Text style={s.title}>{t('auth.newPasswordTitle')}</Text>
            <Text style={s.subtitle}>
              {t('auth.newPasswordSubtitle')}
              {email ? ` (${email})` : ''}.
            </Text>

            <InputField
              label={t('auth.newPasswordTitle')}
              value={pass}
              onChangeText={setPass}
              placeholder={t('auth.passwordMinShort')}
              isPassword
            />
            <InputField
              label={t('auth.confirmNewPasswordLabel')}
              value={pass2}
              onChangeText={setPass2}
              placeholder={t('auth.confirmPasswordPlaceholder')}
              isPassword
            />
            {error && <Text style={s.error}>{error}</Text>}

            <GradientButton
              title={t('auth.resetPasswordButton')}
              onPress={handleSubmit}
              loading={loading}
              style={{ marginTop: spacing.md }}
            />

            <TouchableOpacity
              style={s.backRow}
              onPress={() => router.push('/(auth)/login')}
            >
              <Ionicons
                name="arrow-back"
                size={18}
                color={colors.textMuted}
              />
              <Text style={s.backText}>{t('auth.backToLogin')}</Text>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

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

const s = StyleSheet.create({
  bg: { flex: 1 },
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
  error: {
    marginTop: spacing.sm,
    fontFamily: 'Times New Roman',
    fontSize: 12,
    color: '#dc2626',
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