import {
  Modal, View, Text, ScrollView,
  TouchableOpacity, StyleSheet,
} from 'react-native';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, spacing } from '../../theme';
import { useLanguage } from '../../store/LanguageContext';
import { useThemeMode } from '../../store/ThemeContext';

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
  const { theme } = useThemeMode();
  const isDark = theme === 'dark';
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
        <View style={[s.box, isDark && s.boxDark]}>

          <View style={s.header}>
            <View style={s.headerIcon}>
              <Ionicons name="document-text" size={24} color="#ffffff" />
            </View>
            <Text style={s.headerTitle}>{t('auth.termsAndConditions')}</Text>
            <Text style={s.headerSub}>{t('auth.termsUpdated')}</Text>
            <TouchableOpacity style={s.closeX} onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close" size={18} color="rgba(255,255,255,0.9)" />
            </TouchableOpacity>
          </View>

          {!hasScrolled && (
            <View style={[s.hint, isDark && s.hintDark]}>
              <Ionicons name="hand-right-outline" size={15} color={isDark ? '#34D399' : '#059669'} />
              <Text style={[s.hintText, isDark && { color: '#34D399' }]}>{t('terms.hint')}</Text>
            </View>
          )}

          <ScrollView style={s.scroll} onScroll={handleScroll} scrollEventThrottle={16} showsVerticalScrollIndicator>
            {getTerms(t).map((item, i) => (
              <View key={i} style={s.section}>
                <View style={s.titleRow}>
                  <View style={s.dot} />
                  <Text style={[s.sectionTitle, isDark && { color: '#e2e8f0' }]}>{item.title}</Text>
                </View>
                <Text style={[s.sectionBody, isDark && { color: '#94a3b8' }]}>{item.body}</Text>
              </View>
            ))}
            <View style={{ height: 8 }} />
          </ScrollView>

          <View style={[s.footer, isDark && { borderTopColor: '#26383D' }]}>
            <TouchableOpacity style={[s.btnClose, isDark && s.btnCloseDark]} onPress={onClose}>
              <Text style={[s.btnCloseText, isDark && { color: '#cbd5e1' }]}>{t('auth.close')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.btnAccept, !hasScrolled && s.btnDisabled]}
              onPress={hasScrolled ? onAccept : undefined}
              activeOpacity={hasScrolled ? 0.8 : 1}
            >
              <Ionicons name={hasScrolled ? 'checkmark-circle' : 'lock-closed'} size={16} color="#fff" />
              <Text style={s.btnAcceptText}>{hasScrolled ? t('auth.acceptTermsButton') : t('terms.readToEnd')}</Text>
            </TouchableOpacity>
          </View>

        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.50)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  box: {
    width: '100%',
    maxWidth: 360,
    maxHeight: '82%',
    backgroundColor: '#ffffff',
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#f3f4f6',
    shadowColor: '#0f172a',
    shadowOpacity: 0.18,
    shadowRadius: 26,
    shadowOffset: { width: 0, height: 14 },
    elevation: 14,
  },
  boxDark: { backgroundColor: '#162329', borderColor: '#26383D', shadowColor: '#000000' },

  // Cabecera plana con el verde de la app
  header: {
    backgroundColor: '#10b981',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    position: 'relative',
  },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.20)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  headerTitle: { fontFamily: fonts.serifBold, fontSize: 17, color: '#ffffff', textAlign: 'center' },
  headerSub: {
    fontFamily: fonts.serif,
    fontSize: 11,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 3,
    textAlign: 'center',
  },
  closeX: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.20)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  hint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ecfdf5',
    paddingHorizontal: spacing.md,
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: '#d1fae5',
  },
  hintDark: { backgroundColor: '#0f2f26', borderBottomColor: '#1d4a3d' },
  hintText: { fontFamily: fonts.serif, fontSize: 11, color: '#059669', flex: 1 },

  scroll: { paddingHorizontal: spacing.md, paddingTop: spacing.sm },
  section: { marginBottom: spacing.md },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#10b981' },
  sectionTitle: { fontFamily: fonts.serifBold, fontSize: 13, color: '#1f2937' },
  sectionBody: { fontFamily: fonts.serif, fontSize: 12, color: '#6b7280', lineHeight: 18, paddingLeft: 12 },

  footer: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  btnClose: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#f9fafb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnCloseDark: { backgroundColor: '#1f2937', borderColor: '#374151' },
  btnCloseText: { fontFamily: fonts.serifBold, fontSize: 13, color: '#4b5563' },
  btnAccept: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 13,
    borderRadius: 14,
    backgroundColor: '#10b981',
  },
  btnAcceptText: { fontFamily: fonts.serifBold, fontSize: 13, color: '#ffffff' },
  btnDisabled: { backgroundColor: '#9ca3af' },
});
