import { View, TextInput, Text, StyleSheet, TextInputProps, TouchableOpacity } from 'react-native';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, fonts } from '../../theme';

interface Props extends TextInputProps {
  label: string;
  error?: string;
  success?: boolean;
  isPassword?: boolean;
}

export function InputField({ label, error, success, isPassword, ...props }: Props) {
  const [visible, setVisible] = useState(false);
  const borderColor = error ? colors.error : success ? colors.success : 'transparent';
  const bg = error ? colors.errorBg : success ? colors.inputFocus : colors.inputBg;

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputRow, { borderColor, backgroundColor: bg }]}>
        <TextInput
          style={styles.input}
          placeholderTextColor={colors.textMuted}
          secureTextEntry={isPassword && !visible}
          {...props}
        />
        {isPassword && (
          <TouchableOpacity onPress={() => setVisible(!visible)} style={styles.eye}>
            <Ionicons name={visible ? 'eye' : 'eye-off'} size={20} color={colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>
      {error && <Text style={styles.error}>⚠ {error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 16,
  },
  label: {
    fontFamily: fonts.serifBold,
    fontSize: 13,
    color: colors.ecoDark,
    marginBottom: 6,
    letterSpacing: 0.3,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderRadius: radii.input,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 15,
    fontFamily: fonts.serif,
    color: colors.ecoDark,
  },
  eye: {
    paddingRight: 14,
  },
  error: {
    fontSize: 12,
    color: colors.error,
    fontFamily: fonts.serifBold,
    marginTop: 4,
  },
});