import { LinearGradient } from 'expo-linear-gradient';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet, ViewStyle } from 'react-native';
import { gradients, shadows, radii, fonts, colors } from '../../theme';

interface Props {
  title: string;
  onPress: () => void;
  loading?: boolean;
  variant?: 'primary' | 'outline';
  disabled?: boolean;
  style?: ViewStyle;
}

export function GradientButton({ title, onPress, loading, variant = 'primary', disabled, style }: Props) {
  if (variant === 'outline') {
    return (
      <TouchableOpacity style={[styles.outline, style]} onPress={onPress} disabled={disabled} activeOpacity={0.75}>
        <Text style={styles.outlineText}>{title}</Text>
      </TouchableOpacity>
    );
  }
  return (
    <TouchableOpacity onPress={onPress} disabled={disabled || loading} activeOpacity={0.82} style={[shadows.button, style]}>
      <LinearGradient
        colors={disabled ? [colors.ecoSoft, colors.ecoSoft] : gradients.button}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        {loading
          ? <ActivityIndicator color={colors.white} />
          : <Text style={styles.text}>{title}</Text>
        }
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  gradient: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: radii.button,
    alignItems: 'center',
  },
  text: {
    color: colors.white,
    fontFamily: fonts.serifBold,
    fontSize: 16,
    letterSpacing: 0.4,
  },
  outline: {
    borderWidth: 2,
    borderColor: colors.ecoMain,
    borderRadius: radii.button,
    paddingVertical: 14,
    paddingHorizontal: 32,
    alignItems: 'center',
  },
  outlineText: {
    color: colors.ecoMain,
    fontFamily: fonts.serifBold,
    fontSize: 16,
  },
});