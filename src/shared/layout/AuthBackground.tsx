// src/shared/layout/AuthBackground.tsx
import React from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeMode } from '../store/ThemeContext';
import { spacing } from '../theme';

type Props = {
  children: React.ReactNode;
};

export function AuthBackground({ children }: Props) {
  const { theme } = useThemeMode();
  const isDark = theme === 'dark';

  return (
    <LinearGradient
      colors={
        isDark
          ? ['#022c22', '#064e3b', '#14532d']
          : ['#e6f4ec', '#e8f6ee', '#eaf7f0']
      }
      style={s.bg}
      start={{ x: 0.1, y: 0 }}
      end={{ x: 0.9, y: 1 }}
    >
      <View style={s.bubble1} />
      <View style={s.bubble2} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={s.scroll}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

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
});