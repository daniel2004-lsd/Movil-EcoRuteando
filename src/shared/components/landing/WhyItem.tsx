// src/shared/components/landing/WhyItem.tsx
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, spacing } from '../../theme';

type Props = {
  icon: any;
  title: string;
  desc: string;
};

export function WhyItem({ icon, title, desc }: Props) {
  const [pressed, setPressed] = useState(false);

  return (
    <TouchableOpacity
      activeOpacity={0.95}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      style={[
        styles.whyItem,
        pressed && { transform: [{ translateY: -2 }], elevation: 4 },
      ]}
    >
      <View style={styles.whyIcon}>
        <Ionicons name={icon} size={18} color={colors.ecoMain} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.whyTitle}>{title}</Text>
        <Text style={styles.whyDesc}>{desc}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  whyItem: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
    padding: spacing.sm,
    borderRadius: 16,
    backgroundColor: '#f9f6f0',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  whyIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ecfdf5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  whyTitle: {
    fontFamily: fonts.serifBold,
    fontSize: 13,
    color: colors.ecoDark,
  },
  whyDesc: {
    fontFamily: fonts.serif,
    fontSize: 12,
    color: colors.textMuted,
    lineHeight: 18,
  },
});