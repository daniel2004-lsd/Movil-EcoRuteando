import React from 'react';
import { TouchableOpacity, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface MapFabProps {
  icon?: string;
  onPress: () => void;
  size?: number;
  backgroundColor?: string;
  iconColor?: string;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

export function MapFab({
  icon,
  onPress,
  size = 50,
  backgroundColor = '#fff',
  iconColor = '#57a83a',
  disabled = false,
  style,
  children,
}: MapFabProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.fab,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor,
          opacity: disabled ? 0.65 : 1,
        },
        style,
      ]}
    >
      {children ?? <Ionicons name={(icon as any) ?? 'ellipse'} size={22} color={iconColor} />}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  fab: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 5,
  },
});
