// src/shared/components/landing/FeatureCard.tsx
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, spacing } from '../../theme';

type Props = {
  icon: any;
  title: string;
  desc: string;
};

export function FeatureCard({ icon, title, desc }: Props) {
  const [pressed, setPressed] = useState(false);

  return (
    <TouchableOpacity
      activeOpacity={0.95}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      style={[
        styles.card,
        pressed && { transform: [{ translateY: -3 }], elevation: 5 },
      ]}
    >
      <View style={styles.cardIcon}>
        <Ionicons name={icon} size={20} color={colors.ecoMain} />
      </View>
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.cardDesc}>{desc}</Text>
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
  cardIcon: {
    width: 40,
    height: 40,
    borderRadius: 16,
    backgroundColor: '#f3f4ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    fontFamily: fonts.serifBold,
    fontSize: 14,
    color: colors.ecoDark,
    marginBottom: 4,
  },
  cardDesc: {
    fontFamily: fonts.serif,
    fontSize: 12,
    color: colors.textMuted,
    lineHeight: 18,
  },
});