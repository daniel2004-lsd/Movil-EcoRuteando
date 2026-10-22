// app/(auth)/recover.tsx — estilo web Recover.jsx
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform, TextInput, Image } from 'react-native';
import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
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

export default function RecoverScreen() {
  const router = useRouter();
  const { theme, toggleTheme } = useThemeMode();
  const { t } = useLanguage();
  const isDark = theme === 'dark';
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [retrySeconds, setRetrySeconds] = useState(0);

  useEffect(() => {
    if (retrySeconds <= 0) return;
    const id = setInterval(() => setRetrySeconds(s => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, [retrySeconds]);

  const validateEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

  const handleSend = async () => {
    if (retrySeconds > 0) return;
    if (!validateEmail(email)) { setError(t('auth.invalidEmailMsg')); return; }
    setError(''); setLoading(true);
    try {
      await apiClient.post('/api/auth/forgot-password', { email: email.trim() });
      setSent(true);
    } catch (err: any) {
      if (err.response?.status === 429) {
        const d = err.response.data || {};
        const retryAfter = Number(d.retryAfterSeconds) || parseInt(err.response?.headers?.['retry-after'], 10) || 60;
        setRetrySeconds(retryAfter);
        setError(t('auth.tooManyRequests'));
      } else {
        setError(err.response?.data?.message || t('auth.sendCodeError'));
      }
    } finally { setLoading(false); }
  };

  if (sent) {
    return (
      <View style={[s.bg, isDark && s.bgDark]}>
        <TouchableOpacity onPress={toggleTheme} style={[s.themeBtn, isDark && s.themeBtnDark]}><Text>{isDark ? '☀️' : '🌙'}</Text></TouchableOpacity>
        <ScrollView contentContainerStyle={s.scrollCenter}>
          <View style={s.logoWrap}>
            <View style={[s.logoBox, isDark && s.logoBoxDark]}><Image source={require("../../assets/logo.png")} style={{ width: 40, height: 40, resizeMode: "contain" }} /></View>
            <Text style={[s.appName, isDark && { color: '#e2e8f0' }]}>{t('common.appName')}</Text>
          </View>
          <View style={[s.iconCircle, isDark && { backgroundColor: '#064e3b' }]}>
            <Ionicons name="mail" size={32} color={isDark ? '#34D399' : '#059669'} />
          </View>
          <Text style={[s.title, isDark && { color: '#e2e8f0' }]}>{t('auth.recoverSentTitle')}</Text>
          <Text style={[s.sub, isDark && { color: '#94a3b8' }]}>{t('auth.recoverSentSubtitle')}</Text>
          <Text style={[s.emailText, isDark && { color: '#e2e8f0' }]}>{email}</Text>
          <TouchableOpacity onPress={() => router.push({ pathname: '/(auth)/recover-code', params: { email } })} style={s.primaryBtn}>
            <Text style={s.primaryText}>{t('auth.recoverHaveCode')}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setSent(false)}>
            <Text style={[s.linkGreen, isDark && { color: '#34D399' }]}>{t('auth.recoverWrongEmail')}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/(auth)/login')} style={s.backRow}>
            <Ionicons name="arrow-back" size={14} color={isDark ? '#94a3b8' : '#6b7280'} />
            <Text style={[s.backText, isDark && { color: '#94a3b8' }]}>{t('auth.backToLogin')}</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={[s.bg, isDark && s.bgDark]}>
      <TouchableOpacity onPress={toggleTheme} style={[s.themeBtn, isDark && s.themeBtnDark]}><Text>{isDark ? '☀️' : '🌙'}</Text></TouchableOpacity>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
          <View style={s.logoWrap}>
            <View style={[s.logoBox, isDark && s.logoBoxDark]}><Image source={require("../../assets/logo.png")} style={{ width: 40, height: 40, resizeMode: "contain" }} /></View>
            <Text style={[s.appName, isDark && { color: '#e2e8f0' }]}>{t('common.appName')}</Text>
          </View>
          <View style={s.centerContent}>
            <Text style={[s.title, isDark && { color: '#e2e8f0' }]}>{t('auth.recoverTitle')}</Text>
            <Text style={[s.sub, isDark && { color: '#94a3b8' }]}>{t('auth.recoverSubtitle')}</Text>

            {error ? (
              <View style={[s.errorBox, retrySeconds > 0 && s.errorBoxWarn]}>
                <Ionicons name={retrySeconds > 0 ? 'time-outline' : 'alert-circle-outline'} size={16} color={retrySeconds > 0 ? '#b45309' : '#dc2626'} style={{ marginRight: 6, marginTop: 1 }} />
                <View style={{ flex: 1 }}>
                  <Text style={[s.errorText, retrySeconds > 0 && { color: '#b45309' }]}>{error}</Text>
                  {retrySeconds > 0 && (
                    <Text style={s.errorCountdown}>
                      Puedes intentarlo de nuevo en {formatWait(retrySeconds)}
                    </Text>
                  )}
                </View>
              </View>
            ) : null}

            <Text style={[s.label, isDark && { color: '#34D399' }]}>{t('auth.emailLabel')}</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder={t('auth.emailPlaceholder')}
              placeholderTextColor={isDark ? '#94a3b8' : '#9ca3af'}
              keyboardType="email-address"
              autoCapitalize="none"
              style={[s.input, isDark && s.inputDark]}
            />
            {email.length > 0 && validateEmail(email) && !error && <Text style={s.okText}>{t('auth.emailValid')}</Text>}

            <TouchableOpacity
              onPress={handleSend}
              disabled={loading || retrySeconds > 0 || !validateEmail(email)}
              style={[s.primaryBtn, (loading || retrySeconds > 0 || !validateEmail(email)) && { opacity: 0.5 }]}
            >
              <Text style={s.primaryText}>
                {retrySeconds > 0 ? `Espera ${formatWait(retrySeconds)}` : loading ? t('auth.sendingCode') : t('auth.sendCode')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.push('/(auth)/login')} style={s.backRowGreen}>
              <Ionicons name="arrow-back" size={14} color="#059669" />
              <Text style={s.backGreen}>{t('auth.backToLogin')}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const s = StyleSheet.create({
  bg: { flex: 1, backgroundColor: '#ffffff' },
  bgDark: { backgroundColor: '#0B1215' },
  themeBtn: { position: 'absolute', bottom: 24, right: 24, zIndex: 50, width: 48, height: 48, borderRadius: 24, backgroundColor: '#059669', alignItems: 'center', justifyContent: 'center' },
  themeBtnDark: { backgroundColor: '#162329', borderWidth: 1, borderColor: '#26383D' },
  scroll: { flexGrow: 1, alignItems: 'center', padding: 16, paddingTop: 60 },
  scrollCenter: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: 16 },
  logoWrap: { alignItems: 'center', marginBottom: 24 },
  logoBox: { width: 56, height: 56, borderRadius: 16, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#f3f4f6' },
  logoBoxDark: { backgroundColor: '#162329', borderColor: '#26383D' },
  appName: { fontSize: 24, fontWeight: '700', color: '#047857', marginTop: 8 },
  centerContent: { width: '100%', maxWidth: 384 },
  title: { fontSize: 24, fontWeight: '700', color: '#1f2937', textAlign: 'center', marginBottom: 8 },
  sub: { fontSize: 14, color: '#6b7280', textAlign: 'center', marginBottom: 24, lineHeight: 20 },
  errorBox: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#fef2f2', borderWidth: 1, borderColor: '#fecaca', borderRadius: 8, padding: 10, marginBottom: 16 },
  errorBoxWarn: { backgroundColor: '#fffbeb', borderColor: '#fde68a' },
  errorText: { fontSize: 13, color: '#dc2626', lineHeight: 18 },
  errorCountdown: { fontSize: 12, color: '#b45309', fontWeight: '600', marginTop: 2 },
  label: { fontSize: 12, fontWeight: '500', color: '#4b5563', marginBottom: 4 },
  input: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: '#111827', backgroundColor: '#fff' },
  inputDark: { backgroundColor: 'rgba(22,35,41,0.5)', borderColor: '#26383D', color: '#e2e8f0' },
  okText: { fontSize: 10, color: '#10b981', marginTop: 4 },
  primaryBtn: { backgroundColor: '#059669', borderRadius: 8, paddingVertical: 12, alignItems: 'center', marginTop: 20 },
  primaryText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  backRow: { flexDirection: 'row', gap: 4, alignItems: 'center', justifyContent: 'center', marginTop: 16 },
  backRowGreen: { flexDirection: 'row', gap: 4, alignItems: 'center', justifyContent: 'center', marginTop: 24 },
  backText: { fontSize: 12, color: '#94a3b8' },
  backGreen: { fontSize: 12, color: '#059669', fontWeight: '600' },
  iconCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#ecfdf5', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emailText: { fontWeight: '700', color: '#1f2937', marginTop: 8, fontSize: 14 },
  linkGreen: { fontSize: 12, color: '#059669', fontWeight: '600', marginTop: 12 },
});
