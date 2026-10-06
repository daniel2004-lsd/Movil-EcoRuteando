// app/(auth)/verify-code.tsx
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
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { colors, spacing } from '../../src/shared/theme';
import { LogoCircle } from '../../src/shared/components/landing/LogoCircle';
import { GradientButton } from '../../src/shared/components/ui/GradientButton';
import { useThemeMode } from '../../src/shared/store/ThemeContext';
import { useLanguage } from '../../src/shared/store/LanguageContext';
import { useAuth } from '../../src/shared/store/AuthContext';
import apiClient from '../../src/shared/services/apiClient';

export default function VerifyCodeScreen() {
  const router = useRouter();
  const { theme } = useThemeMode();
  const { t } = useLanguage();
  const { setAuth } = useAuth();
  const isDark = theme === 'dark';

  // email que viene desde el registro: /verify-code?email=algo@mail.com
  const { email } = useLocalSearchParams<{ email?: string }>();

  const [code, setCode] = useState(['', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

    if (value && index < 3) {
      inputs.current[index + 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const joined = code.join('');
    if (joined.length < 4) {
      setError(t('auth.codeIncomplete'));
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await apiClient.post('/api/auth/verify-email', { code: joined });

      if (email) {
        setAuth({
          email: String(email),
          role: 'user',
        });
      }

      router.replace('/(tabs)');
    } catch (err: any) {
      setError(err?.message || t('auth.codeInvalid'));
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      await apiClient.post('/api/auth/send-verification', { email });
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
      <View style={s.circle1} />
      <View style={s.circle2} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={s.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
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
            <View style={s.logoRow}>
              <LogoCircle size={32} />
              <Text style={s.appName}>{t('common.appName')}</Text>
            </View>

            <Text
              style={[
                s.title,
                isDark && { color: '#e5f9f0' },
              ]}
            >
              {t('auth.verifyCodeTitle')}
            </Text>
            <Text
              style={[
                s.subtitle,
                isDark && { color: '#9ca3af' },
              ]}
            >
              {t('auth.verifyCodeSubtitle')}
            </Text>

            <View style={s.codeRow}>
              {code.map((v, i) => (
                <TextInput
                  key={i}
                  ref={ref => (inputs.current[i] = ref)}
                  style={[
                    s.codeInput,
                    isDark && {
                      backgroundColor: '#020617',
                      color: '#e5e7eb',
                      borderColor: '#475569',
                    },
                  ]}
                  keyboardType="number-pad"
                  maxLength={1}
                  value={v}
                  onChangeText={value => handleChange(value, i)}
                  textAlign="center"
                />
              ))}
            </View>

            {error && <Text style={s.error}>{error}</Text>}

            <GradientButton
              title={t('auth.confirmCodeButton')}
              onPress={handleVerify}
              loading={loading}
              style={{ marginTop: spacing.md }}
            />

            <TouchableOpacity
              style={s.resendRow}
              onPress={handleResend}
            >
              <Ionicons
                name="refresh"
                size={16}
                color={colors.ecoMain}
              />
              <Text style={s.resendText}>{t('auth.resendCode')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={s.backRow}
              onPress={() => router.replace('/(auth)/register')}
            >
              <Ionicons
                name="arrow-back"
                size={18}
                color={colors.textMuted}
              />
              <Text style={s.backText}>{t('auth.backToRegister')}</Text>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  bg: { flex: 1 },
  circle1: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(94,168,122,0.18)',
    top: -80,
    right: -60,
  },
  circle2: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(34,197,94,0.18)',
    bottom: -40,
    left: -40,
  },
  scroll: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderRadius: 28,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.7)',
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: spacing.sm,
  },
  appName: {
    fontFamily: 'Times New Roman',
    fontSize: 18,
    color: '#064e3b',
  },
  title: {
    fontFamily: 'Times New Roman',
    fontSize: 22,
    color: colors.ecoDark,
    marginTop: spacing.sm,
    marginBottom: 4,
  },
  subtitle: {
    fontFamily: 'Times New Roman',
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: spacing.lg,
  },
  codeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  codeInput: {
    width: 52,
    height: 56,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#f9fafb',
    fontFamily: 'Times New Roman',
    fontSize: 20,
    color: '#0f172a',
  },
  error: {
    marginTop: spacing.sm,
    fontFamily: 'Times New Roman',
    fontSize: 12,
    color: '#dc2626',
  },
  resendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: spacing.md,
  },
  resendText: {
    fontFamily: 'Times New Roman',
    fontSize: 13,
    color: colors.ecoMain,
  },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: spacing.md,
  },
  backText: {
    fontFamily: 'Times New Roman',
    fontSize: 13,
    color: colors.textMuted,
  },
});