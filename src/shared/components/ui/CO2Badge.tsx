import { LinearGradient } from 'expo-linear-gradient';
import { Text, StyleSheet } from 'react-native';
import { gradients, fonts, colors } from '../../theme';

export function CO2Badge({ value }: { value: string }) {
  return (
    <LinearGradient colors={gradients.tag} style={styles.badge} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
      <Text style={styles.icon}>🌿</Text>
      <Text style={styles.text}>{value} kg CO₂</Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  badge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 5, paddingHorizontal: 12, borderRadius: 20, alignSelf: 'flex-start' },
  icon:  { fontSize: 13 },
  text:  { color: colors.ecoDark, fontFamily: fonts.serifBold, fontSize: 12 },
});