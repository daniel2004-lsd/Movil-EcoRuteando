// app/(auth)/recover-new-password.tsx — estilo web NewPassword.jsx
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity, TextInput, Animated, Image } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useThemeMode } from '../../src/shared/store/ThemeContext';
import { useLanguage } from '../../src/shared/store/LanguageContext';
import apiClient from '../../src/shared/services/apiClient';

export default function RecoverNewPasswordScreen() {
  const router = useRouter();
  const { token, email } = useLocalSearchParams<{ token?: string; email?: string }>();
  const { theme, toggleTheme } = useThemeMode();
  const { t } = useLanguage();
  const isDark = theme === 'dark';

  const [pass, setPass] = useState('');
  const [pass2, setPass2] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const fadeIn = useRef(new Animated.Value(0)).current;
  const slideUp = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeIn, { toValue: 1, duration: 600, useNativeDriver: false }),
      Animated.spring(slideUp, { toValue: 0, tension: 50, friction: 9, useNativeDriver: false }),
    ]).start();
  }, [fadeIn, slideUp]);

  // Indicador de fuerza igual que web
  const pwStrength = pass.length === 0 ? 0 : pass.length < 6 ? 1 : pass.length < 10 ? 2 : /[A-Z]/.test(pass) && /[0-9]/.test(pass) ? 4 : 3;
  const strengthColors = ['#e5e7eb', '#f87171', '#facc15', '#22c55e', '#059669'];
  const strengthLabels = ['', 'Muy débil', 'Media', 'Fuerte', 'Muy fuerte'];
  const strengthTextColors = ['', '#ef4444', '#eab308', '#16a34a', '#059669'];

  const handleSubmit = async () => {
    setError(null);
    const resolvedToken = token || (globalThis as any).__recoveryToken || '';
    if (!resolvedToken) {
      setError('No se encontró el código de verificación. Vuelve a solicitarlo.');
      return;
    }
    if (pass.length < 8) { setError(t('auth.passwordMin8Error')); return; }
    if (pass !== pass2) { setError(t('auth.passwordMismatch')); return; }
    setLoading(true);
    try {
      await apiClient.post('/api/auth/reset-password', {
        token: resolvedToken,
        newPassword: pass,
        email: email || (globalThis as any).__recoveryEmail || undefined
      });
      setSuccess(true);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.response?.data?.detail || t('auth.resetPassError'));
    } finally { setLoading(false); }
  };

  if (success) {
    return (
      <View style={[s.bg, isDark && s.bgDark]}>
        <TouchableOpacity onPress={toggleTheme} style={[s.themeBtn, isDark && s.themeBtnDark]}><Text>{isDark ? '☀️' : '🌙'}</Text></TouchableOpacity>
        <ScrollView contentContainerStyle={s.scrollCenter}>
          <View style={s.logoWrap}>
            <View style={[s.logoBox, isDark && s.logoBoxDark]}><Image source={require("../../assets/logo.png")} style={{ width: 40, height: 40, resizeMode: "contain" }} /></View>
            <Text style={[s.appName, isDark && { color: '#e2e8f0' }]}>{t('common.appName')}</Text>
          </View>
          <View style={[s.successCircle, isDark && { backgroundColor: '#064e3b' }]}>
            <Ionicons name="checkmark-circle" size={36} color={isDark ? '#34D399' : '#059669'} />
          </View>
          <Text style={[s.successTitle, isDark && { color: '#e2e8f0' }]}>¡Contraseña actualizada!</Text>
          <Text style={[s.successMsg, isDark && { color: '#94a3b8' }]}>
            Tu contraseña ha sido restablecida exitosamente. Ya puedes iniciar sesión con tu nueva contraseña.
          </Text>
          <TouchableOpacity onPress={() => router.replace('/(auth)/login')} style={s.primaryBtn}>
            <Text style={s.primaryText}>{t('auth.loginButton') ?? 'Iniciar sesión'}</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

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
            {/* Barra de progreso estilo web */}
            <View style={s.stepsRow}>
              <StepDot label={t('auth.stepEmail') ?? 'CORREO'} done />
              <StepLine active />
              <StepDot label={t('auth.stepCode') ?? 'CÓDIGO'} done />
              <StepLine active />
              <StepDot label={t('auth.stepPassword') ?? 'CONTRASEÑA'} index={3} active />
            </View>

            {/* Icono */}
            <View style={[s.iconCircle, isDark && { backgroundColor: '#064e3b' }]}>
              <Ionicons name="key-outline" size={28} color={isDark ? '#34D399' : '#059669'} />
            </View>

            <Text style={[s.title, isDark && { color: '#e2e8f0' }]}>{t('auth.newPasswordTitle')}</Text>
            <Text style={[s.sub, isDark && { color: '#94a3b8' }]}>{t('auth.newPasswordSubtitle')}</Text>

            {/* Nueva contraseña */}
            <Text style={[s.label, isDark && { color: '#34D399' }]}>{t('auth.newPasswordTitle')}</Text>
            <View style={[s.inputWrap, isDark && s.inputWrapDark]}>
              <TextInput
                value={pass}
                onChangeText={setPass}
                placeholder={t('auth.passwordMinShort') ?? 'Mín. 8 caracteres'}
                placeholderTextColor={isDark ? '#94a3b8' : '#9ca3af'}
                secureTextEntry={!showPass}
                style={[s.input, isDark && s.inputDark]}
              />
              <TouchableOpacity onPress={() => setShowPass(v => !v)}>
                <Ionicons name={showPass ? 'eye-off-outline' : 'eye-outline'} size={18} color={isDark ? '#94a3b8' : '#6b7280'} />
              </TouchableOpacity>
            </View>
            <Text style={[s.hint, isDark && { color: '#64748b' }]}>Usa mayúsculas y números</Text>

            {/* Indicador de fuerza estilo web */}
            {pass.length > 0 && (
              <View style={s.strengthWrap}>
                <View style={s.strengthBars}>
                  {[1, 2, 3, 4].map(i => (
                    <View key={i} style={[s.strengthBar, { backgroundColor: i <= pwStrength ? strengthColors[pwStrength] : (isDark ? '#26383D' : '#e5e7eb') }]} />
                  ))}
                </View>
                <Text style={[s.strengthLabel, { color: strengthTextColors[pwStrength] }]}>{strengthLabels[pwStrength]}</Text>
              </View>
            )}

            {/* Confirmar contraseña */}
            <Text style={[s.label, isDark && { color: '#34D399', marginTop: 16 }]}>{t('auth.confirmNewPasswordLabel') ?? 'Confirmar nueva contraseña'}</Text>
            <View style={[s.inputWrap, isDark && s.inputWrapDark]}>
              <TextInput
                value={pass2}
                onChangeText={setPass2}
                placeholder={t('auth.confirmPasswordPlaceholder') ?? 'Repite tu contraseña'}
                placeholderTextColor={isDark ? '#94a3b8' : '#9ca3af'}
                secureTextEntry={!showPass}
                style={[s.input, isDark && s.inputDark]}
              />
            </View>
            {pass2.length > 0 && pass !== pass2 && <Text style={s.errText}>Las contraseñas no coinciden</Text>}
            {pass2.length > 0 && pass === pass2 && pass.length > 0 && <Text style={s.okText}>Las contraseñas coinciden</Text>}

            {error && <Text style={s.errText}>{error}</Text>}

            <TouchableOpacity
              onPress={handleSubmit}
              disabled={loading || pass.length < 8 || pass !== pass2}
              style={[s.primaryBtn, (loading || pass.length < 8 || pass !== pass2) && { opacity: 0.5 }]}
            >
              <Text style={s.primaryText}>{loading ? 'Restableciendo...' : (t('auth.resetPasswordButton') ?? 'Restablecer contraseña')}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={s.backRowGreen} onPress={() => router.push('/(auth)/login')}>
              <Ionicons name="arrow-back" size={14} color="#059669" />
              <Text style={s.backGreen}>{t('auth.backToLogin')}</Text>
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
  scrollCenter: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: 16 },
  logoWrap: { alignItems: 'center', marginBottom: 20 },
  logoBox: { width: 56, height: 56, borderRadius: 16, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#f3f4f6' },
  logoBoxDark: { backgroundColor: '#162329', borderColor: '#26383D' },
  appName: { fontSize: 24, fontWeight: '700', color: '#047857', marginTop: 8 },
  centerContent: { width: '100%', maxWidth: 384 },
  stepsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  iconCircle: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#f0fdf4', alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: 12 },
  title: { fontSize: 20, fontWeight: '700', color: '#14532d', textAlign: 'center', marginBottom: 4 },
  sub: { fontSize: 13, color: '#6b7280', textAlign: 'center', marginBottom: 20 },
  label: { fontSize: 12, fontWeight: '500', color: '#4b5563', marginBottom: 4 },
  inputWrap: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, backgroundColor: '#fff', paddingHorizontal: 12 },
  inputWrapDark: { backgroundColor: 'rgba(22,35,41,0.5)', borderColor: '#26383D' },
  input: { flex: 1, paddingVertical: 10, fontSize: 14, color: '#111827' },
  inputDark: { color: '#e2e8f0' },
  hint: { fontSize: 10, color: '#9ca3af', marginTop: 4 },
  strengthWrap: { marginTop: 8 },
  strengthBars: { flexDirection: 'row', gap: 4, marginBottom: 4 },
  strengthBar: { flex: 1, height: 6, borderRadius: 3 },
  strengthLabel: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
  okText: { fontSize: 10, color: '#10b981', marginTop: 4 },
  errText: { fontSize: 12, color: '#dc2626', marginTop: 8 },
  primaryBtn: { backgroundColor: '#059669', borderRadius: 8, paddingVertical: 12, alignItems: 'center', marginTop: 20 },
  primaryText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  backRowGreen: { flexDirection: 'row', gap: 4, alignItems: 'center', justifyContent: 'center', marginTop: 20 },
  backGreen: { fontSize: 12, color: '#059669', fontWeight: '600' },
  successCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#f0fdf4', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  successTitle: { fontSize: 22, fontWeight: '700', color: '#14532d', textAlign: 'center', marginBottom: 8 },
  successMsg: { fontSize: 13, color: '#6b7280', textAlign: 'center', marginBottom: 24, lineHeight: 20, paddingHorizontal: 20 },
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
