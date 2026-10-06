import {
  Modal, View, Text, ScrollView,
  TouchableOpacity, StyleSheet,
} from 'react-native';
import { useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, spacing } from '../../theme';
import { useLanguage } from '../../store/LanguageContext';

const getTerms = (t: (path: string) => string) => [
  { title: t('terms.acceptance.title'), body: t('terms.acceptance.body') },
  { title: t('terms.service.title'), body: t('terms.service.body') },
  { title: t('terms.registration.title'), body: t('terms.registration.body') },
  { title: t('terms.acceptableUse.title'), body: t('terms.acceptableUse.body') },
  { title: t('terms.privacy.title'), body: t('terms.privacy.body') },
  { title: t('terms.routes.title'), body: t('terms.routes.body') },
  { title: t('terms.intellectual.title'), body: t('terms.intellectual.body') },
  { title: t('terms.modifications.title'), body: t('terms.modifications.body') },
  { title: t('terms.liability.title'), body: t('terms.liability.body') },
  { title: t('terms.law.title'), body: t('terms.law.body') },
  { title: t('terms.contact.title'), body: t('terms.contact.body') },
];

interface Props {
  visible: boolean;
  onClose: () => void;
  onAccept: () => void;
}

export function TermsModal({ visible, onClose, onAccept }: Props) {
  const { t } = useLanguage();
  const [hasScrolled, setHasScrolled] = useState(false);

  const handleScroll = (e: any) => {
    const { layoutMeasurement, contentOffset, contentSize } = e.nativeEvent;
    if (layoutMeasurement.height + contentOffset.y >= contentSize.height - 40) {
      setHasScrolled(true);
    }
  };

  return (
    <Modal visible={visible} animationType="fade" transparent statusBarTranslucent>
      <View style={s.overlay}>
        <View style={s.box}>

          <LinearGradient colors={['#1a3d2b', '#2c5f3f']} style={s.header} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            <View style={s.headerIcon}>
              <Text style={{ fontSize: 22 }}>📋</Text>
            </View>
            <Text style={s.headerTitle}>{t('auth.termsAndConditions')}</Text>
            <Text style={s.headerSub}>{t('auth.termsUpdated')}</Text>
            <TouchableOpacity style={s.closeX} onPress={onClose}>
              <Ionicons name="close" size={20} color="rgba(255,255,255,0.8)" />
            </TouchableOpacity>
          </LinearGradient>

          {!hasScrolled && (
            <View style={s.hint}>
              <Ionicons name="hand-right-outline" size={15} color={colors.ecoMain} />
              <Text style={s.hintText}>{t('terms.hint')}</Text>
            </View>
          )}

          <ScrollView style={s.scroll} onScroll={handleScroll} scrollEventThrottle={16} showsVerticalScrollIndicator>
            {getTerms(t).map((item, i) => (
              <View key={i} style={s.section}>
                <View style={s.titleRow}>
                  <View style={s.dot} />
                  <Text style={s.sectionTitle}>{item.title}</Text>
                </View>
                <Text style={s.sectionBody}>{item.body}</Text>
              </View>
            ))}
            <View style={{ height: 8 }} />
          </ScrollView>

          <View style={s.footer}>
            <TouchableOpacity style={s.btnClose} onPress={onClose}>
              <Text style={s.btnCloseText}>{t('auth.close')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.btnAccept, !hasScrolled && s.btnDisabled]}
              onPress={hasScrolled ? onAccept : undefined}
              activeOpacity={hasScrolled ? 0.85 : 1}
            >
              <LinearGradient
                colors={hasScrolled ? ['#2c5f3f', '#4a8f65'] : ['#b0b0b0', '#c8c8c8']}
                style={s.btnGradient}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              >
                <Ionicons name={hasScrolled ? 'checkmark-circle' : 'lock-closed'} size={16} color="#fff" />
                <Text style={s.btnAcceptText}>{hasScrolled ? t('auth.acceptTermsButton') : t('terms.readToEnd')}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 },
  box: { width: '100%', maxWidth: 360, maxHeight: '80%', backgroundColor: '#fff', borderRadius: 24, overflow: 'hidden' },
  header: { padding: spacing.lg, alignItems: 'center', position: 'relative' },
  headerIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  headerTitle: { fontFamily: fonts.serifBold, fontSize: 17, color: '#fff', textAlign: 'center' },
  headerSub: { fontFamily: fonts.serif, fontSize: 11, color: 'rgba(255,255,255,0.65)', marginTop: 3, textAlign: 'center' },
  closeX: { position: 'absolute', top: 14, right: 14, width: 30, height: 30, borderRadius: 15, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  hint: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#edf7f1', paddingHorizontal: spacing.md, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#dde8e1' },
  hintText: { fontFamily: fonts.serif, fontSize: 11, color: colors.ecoMain, flex: 1 },
  scroll: { paddingHorizontal: spacing.md, paddingTop: spacing.sm },
  section: { marginBottom: spacing.md },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.ecoMain },
  sectionTitle: { fontFamily: fonts.serifBold, fontSize: 13, color: colors.ecoDark },
  sectionBody: { fontFamily: fonts.serif, fontSize: 12, color: '#666', lineHeight: 18, paddingLeft: 12 },
  footer: { flexDirection: 'row', gap: spacing.sm, padding: spacing.md, borderTopWidth: 1, borderTopColor: '#e8ede9' },
  btnClose: { flex: 1, paddingVertical: 12, borderRadius: 12, borderWidth: 1.5, borderColor: '#dde8e1', alignItems: 'center', justifyContent: 'center' },
  btnCloseText: { fontFamily: fonts.serifBold, fontSize: 13, color: '#888' },
  btnAccept: { flex: 2, borderRadius: 12, overflow: 'hidden' },
  btnGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12 },
  btnAcceptText: { fontFamily: fonts.serifBold, fontSize: 13, color: '#fff' },
  btnDisabled: { opacity: 0.85 },
});