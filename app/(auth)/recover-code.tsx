// app/(auth)/recover-code.tsx — estilo web VerifyCode.jsx
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, TextInput, TouchableOpacity, Animated, Image } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useThemeMode } from '../../src/shared/store/ThemeContext';
import { useLanguage } from '../../src/shared/store/LanguageContext';
import apiClient from '../../src/shared/services/apiClient';

function formatWait(sec: number) {
  if (sec < 60) return `${sec}s`;
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return s > 0 ? `${m}:${String(s).padStart(2, '0')}` : `${m}m`;
}

export default function RecoverCodeScreen() {
  const router = useRouter();
  const { theme, toggleTheme } = useThemeMode();
  const { t } = useLanguage();
  const isDark = theme === 'dark';
  const { email } = useLocalSearchParams<{ email?: string }>();

  const [code, setCode] = useState(Array(6).fill(''));
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState('');
  const [resending, setResending] = useState(false);
  const [retrySeconds, setRetrySeconds] = useState(0);

  const inputs = useRef<Array<TextInput | null>>([]);
  const fadeIn = useRef(new Animated.Value(0)).current;
  const slideUp = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeIn, { toValue: 1, duration: 600, useNativeDriver: false }),
      Animated.spring(slideUp, { toValue: 0, tension: 50, friction: 9, useNativeDriver: false }),
    ]).start();
  }, [fadeIn, slideUp]);

  useEffect(() => {
    if (retrySeconds <= 0) return;
    const id = setInterval(() => setRetrySeconds(s => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, [retrySeconds]);

  const handleChange = (value: string, index: number) => {
    if (!/^[0-9]?$/.test(value)) return;
    const next = [...code];
    next[index] = value.slice(-1);
    setCode(next);
    if (value && index < 5) inputs.current[index + 1]?.focus();
  };

  const handleKey = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !code[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const handleVerify = () => {
    const joined = code.join('');
    if (joined.length < 6) {
      setError('Por favor introduce los 6 dígitos del código.');
      return;
    }
    const targetEmail = (email || (globalThis as any).__recoveryEmail || '').trim();
    if (!targetEmail) {
      setError('No se identificó el correo electrónico. Vuelve a iniciar la recuperación.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      router.push({ pathname: '/(auth)/recover-new-password', params: { token: joined, email: targetEmail } });
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (retrySeconds > 0) return;
    const targetEmail = email || (globalThis as any).__recoveryEmail || '';
    if (!targetEmail) { setResendMessage('No se encontró el correo. Vuelve a intentarlo.'); return; }
    setResending(true);
    setResendMessage('');
    try {
      await apiClient.post('/api/auth/forgot-password', { email: targetEmail });
      setResendMessage('Código reenviado. Revisa tu correo.');
    } catch (err: any) {
      if (err.response?.status === 429) {
        const d = err.response.data || {};
        const retryAfter = Number(d.retryAfterSeconds) || parseInt(err.response?.headers?.['retry-after'], 10) || 60;
        setRetrySeconds(retryAfter);
        setResendMessage('Demasiadas solicitudes. Espera antes de reintentar.');
      } else {
        setResendMessage('No fue posible reenviar el código.');
      }
    } finally { setResending(false); }
  };

  return (
    <View style={[s.bg, isDark && s.bgDark]}>
      <TouchableOpacity onPress={toggleTheme} style={[s.themeBtn, isDark && s.themeBtnDark]}><Text>{isDark ? '☀️' : '🌙'}</Text></TouchableOpacity>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={s.logoWrap}>
            <View style={[s.logoBox, isDark && s.logoBoxDark]}><Image source={require("../../assets/logo.png")} style={{ width: 40, height: 40, resizeMode: "contain" }} /></View>
            <Text style={[s.appName, isDark && { color: '#e2e8f0' }]}>{t('common.appName')}</Text>
          </View>

          <Animated.View style={[s.centerContent, { opacity: fadeIn, transform: [{ translateY: slideUp }] }]}>
            <View style={s.stepsRow}>
              <StepDot label={t('auth.stepEmail') ?? 'CORREO'} done />
              <StepLine active />
              <StepDot label={t('auth.stepCode') ?? 'CÓDIGO'} index={2} active />
              <StepLine />
              <StepDot label={t('auth.stepPassword') ?? 'CONTRASEÑA'} index={3} />
            </View>

            <View style={[s.iconCircle, isDark && { backgroundColor: '#064e3b' }]}>
              <Ionicons name="shield-checkmark-outline" size={28} color={isDark ? '#34D399' : '#059669'} />
            </View>

            <Text style={[s.title, isDark && { color: '#e2e8f0' }]}>{t('auth.recoverCodeTitle') ?? 'Verificar código'}</Text>
            <Text style={[s.sub, isDark && { color: '#94a3b8' }]}>
              {t('auth.recoverCodeSubtitle') ?? 'Introduce el código de 6 dígitos que recibiste en tu correo.'}
            </Text>

            <View style={s.codeRow}>
              {code.map((v, i) => (
                <TextInput
                  key={i}
                  ref={ref => { inputs.current[i] = ref; }}
                  style={[
                    s.codeInput,
                    activeIndex === i && { borderColor: '#059669', backgroundColor: '#fff' },
                    isDark && { backgroundColor: '#111C20', color: '#e2e8f0', borderColor: activeIndex === i ? '#34D399' : '#26383D' },
                  ]}
                  keyboardType="number-pad"
                  maxLength={1}
                  value={v}
                  onChangeText={val => handleChange(val, i)}
                  onKeyPress={e => handleKey(e, i)}
                  textAlign="center"
                  onFocus={() => setActiveIndex(i)}
                  onBlur={() => setActiveIndex(null)}
                />
              ))}
            </View>

            {error && <Text style={s.error}>{error}</Text>}

            <Text style={[s.resendHint, isDark && { color: '#94a3b8' }]}>
              ¿No recibiste el código?{' '}
            </Text>
            <TouchableOpacity onPress={handleResend} disabled={resending || retrySeconds > 0}>
              <Text style={[s.resendLink, (resending || retrySeconds > 0) && { opacity: 0.5 }]}>
                {retrySeconds > 0 ? `Reintentar en ${formatWait(retrySeconds)}` : resending ? 'Reenviando...' : 'Reenviar'}
              </Text>
            </TouchableOpacity>
            {resendMessage ? (
              <View style={[s.resendMsgBox, resendMessage.includes('reenviado') ? s.resendMsgOk : s.resendMsgErr]}>
                <Ionicons name={resendMessage.includes('reenviado') ? 'checkmark-circle-outline' : 'alert-circle-outline'} size={14} color={resendMessage.includes('reenviado') ? '#10b981' : '#dc2626'} style={{ marginRight: 4, marginTop: 1 }} />
                <Text style={[s.resendMsg, resendMessage.includes('reenviado') ? { color: '#10b981' } : { color: '#dc2626' }]}>{resendMessage}</Text>
              </View>
            ) : null}

            <TouchableOpacity
              onPress={handleVerify}
              disabled={code.includes('') || loading}
              style={[s.primaryBtn, (code.includes('') || loading) && { opacity: 0.5 }]}
            >
              <Text style={s.primaryText}>{loading ? 'Verificando...' : (t('auth.recoverCodeButton') ?? 'Verificar código')}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={s.backRowGreen} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={14} color="#059669" />
              <Text style={s.backGreen}>{t('auth.back') ?? 'Volver'}</Text>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

function StepDot({ label, index, active, done }: { label: string; index?: number; active?: boolean; done?: boolean }) {
  return (
    <View style={sStep.container}>
      <View style={[sStep.circle, done && sStep.circleDone, active && !done && sStep.circleActive]}>
        {done ? <Ionicons name="checkmark" size={12} color="#fff" /> : <Text style={[sStep.index, active && { color: '#166534' }]}>{index}</Text>}
      </View>
      <Text style={[sStep.label, (active || done) && { color: '#059669' }]}>{label}</Text>
    </View>
  );
}

function StepLine({ active }: { active?: boolean }) {
  return <View style={[sStep.separator, active && { backgroundColor: '#a7f3d0' }]} />;
}

const s = StyleSheet.create({
  bg: { flex: 1, backgroundColor: '#ffffff' },
  bgDark: { backgroundColor: '#0B1215' },
  themeBtn: { position: 'absolute', bottom: 24, right: 24, zIndex: 50, width: 48, height: 48, borderRadius: 24, backgroundColor: '#059669', alignItems: 'center', justifyContent: 'center' },
  themeBtnDark: { backgroundColor: '#162329', borderWidth: 1, borderColor: '#26383D' },
  scroll: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: 16 },
  logoWrap: { alignItems: 'center', marginBottom: 20 },
  logoBox: { width: 56, height: 56, borderRadius: 16, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#f3f4f6' },
  logoBoxDark: { backgroundColor: '#162329', borderColor: '#26383D' },
  appName: { fontSize: 24, fontWeight: '700', color: '#047857', marginTop: 8 },
  centerContent: { width: '100%', maxWidth: 384 },
  stepsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  iconCircle: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#f0fdf4', alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: 12 },
  title: { fontSize: 20, fontWeight: '700', color: '#14532d', textAlign: 'center', marginBottom: 4 },
  sub: { fontSize: 13, color: '#6b7280', textAlign: 'center', marginBottom: 20 },
  codeRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', columnGap: 6, marginBottom: 16 },
  codeInput: { width: 42, height: 52, borderRadius: 12, borderWidth: 2, borderColor: 'transparent', backgroundColor: '#f9f6f0', fontSize: 20, fontWeight: '700', color: '#111827' },
  error: { fontSize: 12, color: '#dc2626', textAlign: 'center', marginBottom: 8 },
  resendHint: { fontSize: 12, color: '#6b7280', textAlign: 'center' },
  resendLink: { color: '#059669', fontWeight: '700', textDecorationLine: 'underline', textAlign: 'center', marginBottom: 8, fontSize: 12 },
  resendMsgBox: { flexDirection: 'row', alignItems: 'flex-start', borderRadius: 8, padding: 8, marginBottom: 8 },
  resendMsgOk: { backgroundColor: '#ecfdf5', borderWidth: 1, borderColor: '#a7f3d0' },
  resendMsgErr: { backgroundColor: '#fef2f2', borderWidth: 1, borderColor: '#fecaca' },
  resendMsg: { fontSize: 12, flex: 1 },
  primaryBtn: { backgroundColor: '#059669', borderRadius: 8, paddingVertical: 12, alignItems: 'center', marginTop: 8 },
  primaryText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  backRowGreen: { flexDirection: 'row', gap: 4, alignItems: 'center', justifyContent: 'center', marginTop: 20 },
  backGreen: { fontSize: 12, color: '#059669', fontWeight: '600' },
});

const sStep = StyleSheet.create({
  container: { alignItems: 'center' },
  circle: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: '#d1d5db', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f9fafb' },
  circleActive: { borderColor: '#059669', backgroundColor: '#f0fdf4' },
  circleDone: { backgroundColor: '#059669', borderColor: '#059669' },
  index: { fontSize: 12, fontWeight: '700', color: '#6b7280' },
  label: { marginTop: 4, fontSize: 10, fontWeight: '700', color: '#6b7280' },
  separator: { width: 28, height: 2, marginHorizontal: 4, backgroundColor: '#e5e7eb', marginBottom: 16 },
});
