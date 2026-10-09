// src/shared/components/ui/AccountRequired.tsx
// Aviso para pantallas personales (historial, favoritos, mis rutas…) cuando
// no hay sesión. En modo invitado no se debe mostrar la cuenta de nadie.
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useThemeMode } from '../../store/ThemeContext';
import { useLanguage } from '../../store/LanguageContext';

export function AccountRequired({ action }: { action?: string }) {
  const router = useRouter();
  const { theme } = useThemeMode();
  const { t } = useLanguage();
  const isDark = theme === 'dark';

  const message = action
    ? t('planRoute.needAccountMsg').replace('{action}', action)
    : t('guest.guestNote');

  return (
    <View style={[s.card, isDark && s.cardDark]}>
      <View style={s.icon}>
        <Ionicons name="lock-closed" size={26} color="#10b981" />
      </View>
      <Text style={[s.title, isDark && { color: '#e2e8f0' }]}>
        {t('planRoute.needAccountTitle')}
      </Text>
      <Text style={[s.text, isDark && { color: '#94a3b8' }]}>{message}</Text>

      <TouchableOpacity
        style={s.primary}
        activeOpacity={0.85}
        onPress={() => router.push('/(auth)/login')}
      >
        <Ionicons name="log-in-outline" size={16} color="#ffffff" />
        <Text style={s.primaryText}>{t('auth.loginButton')}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={s.secondary}
        activeOpacity={0.8}
        onPress={() => router.push('/(auth)/register')}
      >
        <Text style={s.secondaryText}>{t('guest.ctaPrimaryBtn')}</Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#f3f4f6',
    padding: 24,
    alignItems: 'center',
    shadowColor: '#0f172a',
    shadowOpacity: 0.18,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 12 },
    elevation: 12,
  },
  cardDark: { backgroundColor: '#162329', borderColor: '#26383D', shadowColor: '#000000' },
  icon: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: 'rgba(16,185,129,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  title: { fontSize: 17, fontWeight: '800', color: '#1f2937', textAlign: 'center' },
  text: { fontSize: 14, color: '#6b7280', textAlign: 'center', marginTop: 8, lineHeight: 21 },
  primary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 18,
    width: '100%',
    height: 46,
    borderRadius: 14,
    backgroundColor: '#10b981',
  },
  primaryText: { color: '#ffffff', fontWeight: '700', fontSize: 14 },
  secondary: {
    marginTop: 10,
    width: '100%',
    height: 46,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#f9fafb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryText: { color: '#4b5563', fontWeight: '700', fontSize: 14 },
});
