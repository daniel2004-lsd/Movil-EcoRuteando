import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, ViewStyle } from 'react-native';
import { gradients, shadows, radii } from '../../theme';

export function EcoCard({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return (
    <LinearGradient colors={gradients.card} style={[styles.card, shadows.card, style]}>
      {children}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radii.card, padding: 16, borderWidth: 1, borderColor: '#ede8df' },
});