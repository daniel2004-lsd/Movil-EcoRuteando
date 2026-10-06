// src/shared/components/landing/LogoCircle.tsx
import React from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type Props = {
  size?: number;
};

export function LogoCircle({ size = 32 }: Props) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: '#f9fafb',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Ionicons name="leaf-outline" size={size * 0.6} color="#166534" />
    </View>
  );
}