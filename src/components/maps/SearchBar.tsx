import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import Animated, { useSharedValue, withTiming, useAnimatedStyle, interpolate } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  onFocus: () => void;
  onClear: () => void;
  leftIcon?: string;
  rightIcon?: string;
  onRightIconPress?: () => void;
  autoFocus?: boolean;
  isFocused?: boolean;
  onFocusChange?: (focused: boolean) => void;
  plain?: boolean;
}

export function SearchBar({
  value,
  onChangeText,
  placeholder,
  onFocus,
  onClear,
  leftIcon = 'search',
  rightIcon = 'mic',
  onRightIconPress,
  autoFocus = false,
  isFocused = false,
  onFocusChange,
  plain = false,
}: SearchBarProps) {
  const [focused, setFocused] = useState(isFocused);
  const scale = useSharedValue(1);
  const elevation = useSharedValue(3);

  const handleFocus = () => {
    setFocused(true);
    scale.value = withTiming(1.02, { duration: 150 });
    elevation.value = withTiming(6, { duration: 150 });
    onFocus();
    onFocusChange?.(true);
  };

  const handleBlur = () => {
    setFocused(false);
    scale.value = withTiming(1, { duration: 150 });
    elevation.value = withTiming(3, { duration: 150 });
    onFocusChange?.(false);
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    elevation: elevation.value,
    shadowOpacity: interpolate(elevation.value, [3, 6], [0.1, 0.2]),
  }));

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <View style={[styles.inputContainer, plain && styles.inputPlain]}>
        <Ionicons name={leftIcon as any} size={22} color="#70757a" style={styles.icon} />
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          onFocus={handleFocus}
          onBlur={handleBlur}
          autoFocus={autoFocus}
          style={styles.input}
          placeholderTextColor="#80868b"
          returnKeyType="search"
          autoComplete="off"
          autoCorrect={false}
        />
        {!!value && (
          <TouchableOpacity onPress={onClear} style={styles.clearBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="close" size={22} color="#80868b" />
          </TouchableOpacity>
        )}
        <TouchableOpacity onPress={onRightIconPress} style={styles.voiceBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name={rightIcon as any} size={22} color="#1a73e8" />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  icon: {
    marginRight: 12,
  },
  inputPlain: {
    backgroundColor: 'transparent',
    borderWidth: 0,
    paddingHorizontal: 4,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#202124',
  },
  clearBtn: {
    padding: 4,
  },
  voiceBtn: {
    marginLeft: 8,
    padding: 4,
  },
});