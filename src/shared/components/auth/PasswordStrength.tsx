import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts } from '../../theme';
import { useLanguage } from '../../store/LanguageContext';

export type PwChecks = {
  length:  boolean;
  upper:   boolean;
  number:  boolean;
  special: boolean;
};

export const getPwChecks = (pw: string): PwChecks => ({
  length:  pw.length >= 8,
  upper:   /[A-Z]/.test(pw),
  number:  /[0-9]/.test(pw),
  special: /[^A-Za-z0-9]/.test(pw),
});

export function PwRequirements({ checks }: { checks: PwChecks }) {
  const { t } = useLanguage();
  return (
    <View style={s.reqs}>
      <Req ok={checks.length}  label={t('auth.passwordMin')} />
      <Req ok={checks.upper}   label={t('auth.pwCheckUppercase')} />
      <Req ok={checks.number}  label={t('auth.pwCheckNumber')} />
      <Req ok={checks.special} label={t('auth.pwCheckSpecial')} />
    </View>
  );
}

export function PasswordStrengthBar({ checks }: { checks: PwChecks }) {
  const { t } = useLanguage();
  const score = Object.values(checks).filter(Boolean).length;
  const labels    = ['', t('pw.weak'), t('pw.regular'), t('pw.strong'), t('pw.veryStrong')];
  const barColors = ['#e5e7eb', '#ef4444', '#f97316', '#22c55e', '#16a34a'];
  return (
    <View style={s.strengthRow}>
      <View style={s.bars}>
        {[1, 2, 3, 4].map(i => (
          <View key={i} style={[s.bar, { backgroundColor: i <= score ? barColors[score] : '#e5e7eb' }]} />
        ))}
      </View>
      <Text style={[s.scoreLabel, { color: barColors[score] }]}>{labels[score]}</Text>
    </View>
  );
}

function Req({ ok, label }: { ok: boolean; label: string }) {
  return (
    <View style={s.item}>
      <Ionicons name={ok ? 'checkmark-circle' : 'ellipse-outline'} size={14} color={ok ? '#22c55e' : '#aaa'} />
      <Text style={[s.label, ok && { color: '#22c55e' }]}>{label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  reqs: { gap: 5, paddingLeft: 4, marginBottom: 10 },
  item: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  label: { fontFamily: fonts.serif, fontSize: 12, color: '#aaa' },
  strengthRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  bars: { flexDirection: 'row', gap: 4, flex: 1 },
  bar: { flex: 1, height: 4, borderRadius: 2 },
  scoreLabel: { fontFamily: fonts.serifBold, fontSize: 11, minWidth: 60 },
});