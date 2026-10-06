import { TouchableOpacity, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, fonts } from '../../theme';

interface Props {
  icon: any;
  color: string;
  label?: string;
  onPress?: () => void;
  disabled?: boolean;
}

export function SocialBtn({ icon, color, label, onPress, disabled }: Props) {
  return (
    <TouchableOpacity style={[s.btn, disabled && s.disabled]} onPress={onPress} activeOpacity={0.75} disabled={disabled}>
      <Ionicons name={icon} size={18} color={disabled ? '#9ca3af' : color} />
      {label && <Text style={[s.label, disabled && { color: '#9ca3af' }]}>{label}</Text>}
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  btn: {
    flex: 1,
    flexDirection: 'row',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1, borderColor: '#e5e7eb',
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#fff',
  },
  disabled: { opacity: 0.5 },
  label: {
    fontSize: 10,
    fontFamily: fonts.serifBold,
    color: '#6b7280',
  },
});
