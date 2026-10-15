// src/shared/components/landing/FeatureCard.tsx
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, spacing } from '../../theme';
import { useThemeMode } from '../../store/ThemeContext';

type Props = {
  icon: any;
  title: string;
  desc: string;
};

export function FeatureCard({ icon, title, desc }: Props) {
  const [pressed, setPressed] = useState(false);
  const { theme } = useThemeMode();
  const isDark = theme === 'dark';

  return (
    <TouchableOpacity
      activeOpacity={0.95}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      style={[
        styles.card,
        isDark && styles.cardDark,
        pressed && { transform: [{ translateY: -3 }], elevation: 5 },
      ]}
    >
      <View style={[styles.cardIcon, isDark && styles.cardIconDark]}>
        <Ionicons name={icon} size={20} color={colors.ecoMain} />
      </View>
      <Text style={[styles.cardTitle, isDark && styles.cardTitleDark]}>{title}</Text>
      <Text style={[styles.cardDesc, isDark && styles.cardDescDark]}>{desc}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    elevation: 2,
  },
  cardDark: {
    backgroundColor: '#0d2b1f',
    borderColor: '#1a3a2a',
  },
  cardIcon: {
    width: 40,
    height: 40,
    borderRadius: 16,
    backgroundColor: '#f3f4ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  cardIconDark: {
    backgroundColor: '#132e20',
  },
  cardTitle: {
    fontFamily: fonts.serifBold,
    fontSize: 14,
    color: colors.ecoDark,
    marginBottom: 4,
  },
  cardTitleDark: {
    color: '#e2f3e8',
  },
  cardDesc: {
    fontFamily: fonts.serif,
    fontSize: 12,
    color: colors.textMuted,
    lineHeight: 18,
  },
  cardDescDark: {
    color: '#9ab5a5',
  },
});