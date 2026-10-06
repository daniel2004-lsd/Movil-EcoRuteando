// app/(tabs)/profile.tsx — rediseñado con el sistema de diseño del Dashboard (index.tsx)
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLanguage } from '../../src/shared/store/LanguageContext';
import { useThemeMode } from '../../src/shared/store/ThemeContext';
import { useAuth } from '../../src/shared/store/AuthContext';
import apiClient from '../../src/shared/services/apiClient';

type TabKey = 'personal' | 'security' | 'support';

const TABS: { key: TabKey; icon: any; labelKey: string }[] = [
  { key: 'personal', icon: 'person-outline', labelKey: 'profile.tabs.personal' },
  { key: 'security', icon: 'shield-checkmark-outline', labelKey: 'profile.tabs.security' },
  { key: 'support', icon: 'chatbubbles-outline', labelKey: 'profile.tabs.support' },
];

const GENDER_OPTIONS = [
  { id: 'm', labelKey: 'profile.personal.gender.male' },
  { id: 'f', labelKey: 'profile.personal.gender.female' },
  { id: 'o', labelKey: 'profile.personal.gender.other' },
];
const TRANSPORT_OPTIONS = [
  { id: 'walk', labelKey: 'profile.personal.transport.walk' },
  { id: 'taxi', labelKey: 'profile.personal.transport.taxi' },
];
const LANG_OPTIONS = [
  { id: 'es', labelKey: 'profile.languages.es' },
  { id: 'en', labelKey: 'profile.languages.en' },
  { id: 'fr', labelKey: 'profile.languages.fr' },
  { id: 'pt', labelKey: 'profile.languages.pt' },
];
const PRIORITY_OPTIONS = [
  { id: 'low', labelKey: 'profile.support.priorities.low' },
  { id: 'medium', labelKey: 'profile.support.priorities.medium' },
  { id: 'high', labelKey: 'profile.support.priorities.high' },
];

function CardHeader({
  icon, color, title, subtitle, isDark,
}: { icon: any; color: string; title: string; subtitle: string; isDark: boolean }) {
  return (
    <View style={s.cardHead}>
      <View style={[s.cardIcon, { backgroundColor: color }, isDark && { backgroundColor: `${color}33` }]}>
        <Ionicons name={icon} size={20} color={isDark ? color : '#fff'} />
      </View>
      <View style={s.cardHeadText}>
        <Text style={[s.cardTitle, isDark && { color: '#e2e8f0' }]}>{title}</Text>
        <Text style={[s.cardSubtitle, isDark && { color: '#94a3b8' }]}>{subtitle}</Text>
      </View>
    </View>
  );
}

export default function ProfileScreen() {
  const router = useRouter();
  const { theme, toggleTheme } = useThemeMode();
  const { auth, signOut } = useAuth();
  const { t, lang, setLang } = useLanguage();
  const isDark = theme === 'dark';
  const insets = useSafeAreaInsets();

  const [activeTab, setActiveTab] = useState<TabKey>('personal');

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [birthdate, setBirthdate] = useState('');
  const [bio, setBio] = useState('');
  const [documentId, setDocumentId] = useState('');
  const [gender, setGender] = useState<'m' | 'f' | 'o' | null>(null);
  const [mainTransport, setMainTransport] = useState<'walk' | 'taxi' | null>(null);

  const [avatarUri, setAvatarUri] = useState<string | null>(null);

  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  const [supportMessage, setSupportMessage] = useState('');
  const [supportPriority, setSupportPriority] = useState<'low' | 'medium' | 'high'>('low');

  const fetchProfile = useCallback(async () => {
    try {
      const { data } = await apiClient.get('/api/auth/me');
      const user = data.user ?? data;
      setFullName(`${user.firstName ?? ''} ${user.lastName ?? ''}`.trim());
      setPhone(user.phoneNumber ?? '');
    } catch {}
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handlePickAvatar = async () => {
    setAvatarUri('https://via.placeholder.com/120.png?text=Perfil');
  };

  const handleSavePersonal = async () => {
    try {
      const parts = fullName.trim().split(' ');
      const firstName = parts[0] || '';
      const lastName = parts.slice(1).join(' ');
      await apiClient.put('/api/auth/me', {
        firstName,
        lastName,
        phoneNumber: phone || undefined,
      });
      Alert.alert(t('profile.feedback.savedTitle'), t('profile.feedback.savedMsg'));
    } catch (err: any) {
      Alert.alert(
        t('auth.errorTitle'),
        err?.response?.data?.detail || err?.response?.data?.message || t('profile.feedback.error'),
      );
    }
  };

  const handleChangePassword = async () => {
    if (!newPass || newPass !== confirmPass || newPass.length < 8) {
      Alert.alert(t('auth.errorTitle'), t('profile.feedback.invalidPass'));
      return;
    }
    try {
      await apiClient.post('/api/auth/change-password', {
        currentPassword: '',
        newPassword: newPass,
      });
      setNewPass('');
      setConfirmPass('');
      Alert.alert(t('profile.feedback.passTitle'), t('profile.feedback.passMsg'));
    } catch (err: any) {
      Alert.alert(
        t('auth.errorTitle'),
        err?.response?.data?.detail || err?.response?.data?.message || t('profile.feedback.error'),
      );
    }
  };

  const handleSendSupport = () => {
    // RF30 soporte técnico
    if (!supportMessage.trim()) {
      Alert.alert(t('auth.errorTitle'), t('profile.feedback.emptyMessage'));
      return;
    }
    setSupportMessage('');
    Alert.alert(t('profile.feedback.supportTitle'), t('profile.feedback.supportMsg'));
  };

  const handleExportData = (format: 'pdf' | 'excel') => {
    // RF22/RF29 exportación de datos
    console.log('Exportar datos', { format });
  };

  const handleLogout = async () => {
    await signOut();
    router.replace('/(auth)/login');
  };

  const handleDeleteAccount = () => {
    // RF6 eliminación de cuenta
  };

  const inputBoxDark = isDark && s.inputDark;

  return (
    <View style={[s.page, isDark && s.pageDark]}>
      <SafeAreaView style={[s.safeArea, { paddingTop: insets.top }]}>
        {/* Header — idéntico al Dashboard */}
        <View style={[s.header, isDark && s.headerDark]}>
          <View style={s.headerLeft}>
            <View style={s.logoBox}><Text style={s.logoIcon}>🌿</Text></View>
            <Text style={[s.headerTitle, isDark && { color: '#e2e8f0' }]}>{t('home.profileTitle')}</Text>
          </View>
          <View style={s.headerRight}>
            <TouchableOpacity style={[s.iconBtn, isDark && s.iconBtnDark]} onPress={toggleTheme} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name={isDark ? 'sunny-outline' : 'moon-outline'} size={16} color={isDark ? '#facc15' : '#4b5563'} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.logoutBtn, isDark && s.logoutBtnDark]}
              onPress={handleLogout}
            >
              <Ionicons name="log-out-outline" size={16} color={isDark ? '#e2e8f0' : '#4b5563'} />
              <Text style={[s.logoutText, isDark && { color: '#e2e8f0' }]}>{t('home.logoutShort')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
          {/* Tarjeta de usuario (hereda el lenguaje de greetingCard) */}
          <View style={[s.heroCard, isDark && s.heroCardDark]}>
            <View style={s.heroRow}>
              <TouchableOpacity style={s.avatarWrap} onPress={handlePickAvatar} activeOpacity={0.85}>
                {avatarUri ? (
                  <Image source={{ uri: avatarUri }} style={s.avatar} />
                ) : (
                  <View style={s.avatar}>
                    <Ionicons name="person-outline" size={34} color="#fff" />
                  </View>
                )}
                <View style={s.avatarBadge}>
                  <Ionicons name="camera-outline" size={12} color="#fff" />
                </View>
              </TouchableOpacity>

              <View style={s.heroInfo}>
                <Text style={[s.heroName, isDark && { color: '#e2e8f0' }]} numberOfLines={1}>
                  {fullName || t('profile.defaultName')}
                </Text>
                <Text style={[s.heroEmail, isDark && { color: '#94a3b8' }]} numberOfLines={1}>
                  {auth.email ?? t('profile.defaultEmail')}
                </Text>
                <View style={s.heroTags}>
                  <View style={[s.heroTag, isDark && s.heroTagDark]}>
                    <Ionicons name="language-outline" size={11} color={isDark ? '#34D399' : '#059669'} />
                    <Text style={[s.heroTagText, isDark && s.heroTagTextDark]}>
                      {t(`profile.languages.${lang}`)}
                    </Text>
                  </View>
                  <View style={[s.heroTag, isDark && s.heroTagDark]}>
                    <Ionicons name={isDark ? 'moon' : 'sunny'} size={11} color={isDark ? '#34D399' : '#059669'} />
                    <Text style={[s.heroTagText, isDark && s.heroTagTextDark]}>
                      {isDark ? t('profile.theme.dark') : t('profile.theme.light')}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            <TouchableOpacity style={[s.photoBtn, isDark && s.photoBtnDark]} onPress={handlePickAvatar}>
              <Ionicons name="camera-outline" size={14} color={isDark ? '#34D399' : '#059669'} />
              <Text style={[s.photoBtnText, isDark && { color: '#34D399' }]}>{t('profile.changePhoto')}</Text>
            </TouchableOpacity>
          </View>

          {/* Pestañas segmentadas */}
          <View style={s.tabsRow}>
            {TABS.map(tab => {
              const active = activeTab === tab.key;
              return (
                <TouchableOpacity
                  key={tab.key}
                  style={[s.tab, isDark && s.tabDark, active && s.tabActive]}
                  onPress={() => setActiveTab(tab.key)}
                  activeOpacity={0.9}
                >
                  <Ionicons name={tab.icon} size={15} color={active ? '#fff' : isDark ? '#94a3b8' : '#4b5563'} />
                  <Text
                    numberOfLines={1}
                    style={[s.tabText, isDark && s.tabTextDark, active && s.tabTextActive]}
                  >
                    {t(tab.labelKey)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* ===================== PESTAÑA 1 · PERSONAL ===================== */}
          {activeTab === 'personal' && (
            <View>
              <View style={[s.card, isDark && s.cardDark]}>
                <CardHeader
                  icon="person-outline"
                  color="#14b8a6"
                  title={t('profile.personal.title')}
                  subtitle={t('profile.personal.subtitle')}
                  isDark={isDark}
                />

                <View style={s.fieldRow}>
                  <View style={s.fieldCol}>
                    <Text style={s.fieldLabel}>{t('profile.personal.fields.fullName')}</Text>
                    <TextInput
                      value={fullName}
                      onChangeText={setFullName}
                      placeholder={t('profile.personal.placeholders.fullName')}
                      placeholderTextColor="#9ca3af"
                      style={[s.input, inputBoxDark]}
                    />
                  </View>
                  <View style={s.fieldCol}>
                    <Text style={s.fieldLabel}>{t('profile.personal.fields.documentId')}</Text>
                    <TextInput
                      value={documentId}
                      onChangeText={setDocumentId}
                      placeholder={t('profile.personal.placeholders.documentId')}
                      placeholderTextColor="#9ca3af"
                      style={[s.input, inputBoxDark]}
                    />
                  </View>
                </View>

                <View style={s.fieldRow}>
                  <View style={s.fieldCol}>
                    <Text style={s.fieldLabel}>{t('profile.personal.fields.phone')}</Text>
                    <TextInput
                      value={phone}
                      onChangeText={setPhone}
                      placeholder={t('profile.personal.placeholders.phone')}
                      placeholderTextColor="#9ca3af"
                      keyboardType="phone-pad"
                      style={[s.input, inputBoxDark]}
                    />
                  </View>
                  <View style={s.fieldCol}>
                    <Text style={s.fieldLabel}>{t('profile.personal.fields.city')}</Text>
                    <TextInput
                      value={city}
                      onChangeText={setCity}
                      placeholder={t('profile.personal.placeholders.city')}
                      placeholderTextColor="#9ca3af"
                      style={[s.input, inputBoxDark]}
                    />
                  </View>
                </View>

                <View style={s.fieldRow}>
                  <View style={s.fieldCol}>
                    <Text style={s.fieldLabel}>{t('profile.personal.fields.birthdate')}</Text>
                    <TextInput
                      value={birthdate}
                      onChangeText={setBirthdate}
                      placeholder={t('profile.personal.placeholders.birthdate')}
                      placeholderTextColor="#9ca3af"
                      style={[s.input, inputBoxDark]}
                    />
                  </View>
                  <View style={s.fieldCol}>
                    <Text style={s.fieldLabel}>{t('profile.personal.fields.gender')}</Text>
                    <View style={s.chipRow}>
                      {GENDER_OPTIONS.map(opt => {
                        const active = gender === opt.id;
                        return (
                          <TouchableOpacity
                            key={opt.id}
                            style={[s.chip, isDark && s.chipDark, active && s.chipActive]}
                            onPress={() => setGender(opt.id as any)}
                          >
                            <Text style={[s.chipText, isDark && s.chipTextDark, active && s.chipTextActive]}>
                              {t(opt.labelKey)}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                </View>

                <View style={s.block}>
                  <Text style={s.fieldLabel}>{t('profile.personal.fields.transport')}</Text>
                  <View style={s.chipRow}>
                    {TRANSPORT_OPTIONS.map(opt => {
                      const active = mainTransport === opt.id;
                      return (
                        <TouchableOpacity
                          key={opt.id}
                          style={[s.chip, isDark && s.chipDark, active && s.chipActive]}
                          onPress={() => setMainTransport(opt.id as any)}
                        >
                          <Text style={[s.chipText, isDark && s.chipTextDark, active && s.chipTextActive]}>
                            {t(opt.labelKey)}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                <View style={s.block}>
                  <Text style={s.fieldLabel}>{t('profile.personal.fields.bio')}</Text>
                  <TextInput
                    value={bio}
                    onChangeText={setBio}
                    placeholder={t('profile.personal.placeholders.bio')}
                    placeholderTextColor="#9ca3af"
                    multiline
                    style={[s.textArea, isDark && s.textAreaDark]}
                  />
                </View>

                <TouchableOpacity style={[s.primaryBtn, isDark && s.primaryBtnDark]} onPress={handleSavePersonal}>
                  <Ionicons name="checkmark-circle-outline" size={18} color={isDark ? '#06281c' : '#fff'} />
                  <Text style={[s.primaryBtnText, isDark && s.primaryBtnTextDark]}>
                    {t('profile.personal.save')}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={[s.card, isDark && s.cardDark]}>
                <CardHeader
                  icon="options-outline"
                  color="#10b981"
                  title={t('profile.account.title')}
                  subtitle={t('profile.account.subtitle')}
                  isDark={isDark}
                />

                <Text style={s.fieldLabel}>{t('profile.account.language')}</Text>
                <View style={s.chipRow}>
                  {LANG_OPTIONS.map(opt => {
                    const active = lang === opt.id;
                    return (
                      <TouchableOpacity
                        key={opt.id}
                        style={[s.chip, isDark && s.chipDark, active && s.chipActive]}
                        onPress={() => setLang(opt.id as any)}
                      >
                        <Text style={[s.chipText, isDark && s.chipTextDark, active && s.chipTextActive]}>
                          {t(opt.labelKey)}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <View style={s.exportBlock}>
                  <Text style={s.fieldLabel}>{t('profile.account.export')}</Text>
                  <View style={s.exportBtnRow}>
                    <TouchableOpacity style={[s.exportBtn, isDark && s.exportBtnDark]} onPress={() => handleExportData('pdf')}>
                      <Ionicons name="document-text-outline" size={16} color={isDark ? '#34D399' : '#059669'} />
                      <Text style={[s.exportBtnText, isDark && { color: '#34D399' }]}>
                        {t('profile.account.exportOptions.pdf')}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[s.exportBtn, isDark && s.exportBtnDark]} onPress={() => handleExportData('excel')}>
                      <Ionicons name="grid-outline" size={16} color={isDark ? '#34D399' : '#059669'} />
                      <Text style={[s.exportBtnText, isDark && { color: '#34D399' }]}>
                        {t('profile.account.exportOptions.excel')}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              {/* Zona de riesgo — tarjeta propia */}
              <View style={[s.dangerCard, isDark && s.dangerCardDark]}>
                <View style={s.cardHead}>
                  <View style={[s.cardIcon, { backgroundColor: '#ef4444' }]}>
                    <Ionicons name="warning-outline" size={20} color="#fff" />
                  </View>
                  <View style={s.cardHeadText}>
                    <Text style={[s.cardTitle, isDark && { color: '#fca5a5' }]}>
                      {t('profile.account.deleteTitle')}
                    </Text>
                    <Text style={[s.cardSubtitle, isDark && { color: '#fecaca' }]}>
                      {t('profile.account.deleteText')}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity style={s.dangerBtn} onPress={handleDeleteAccount}>
                  <Ionicons name="trash-outline" size={16} color="#fff" />
                  <Text style={s.dangerBtnText}>{t('profile.account.deleteButton')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* ===================== PESTAÑA 2 · SEGURIDAD ===================== */}
          {activeTab === 'security' && (
            <View style={[s.card, isDark && s.cardDark]}>
              <CardHeader
                icon="shield-checkmark-outline"
                color="#06b6d4"
                title={t('profile.security.title')}
                subtitle={t('profile.security.subtitle')}
                isDark={isDark}
              />

              <Text style={s.fieldLabel}>{t('profile.security.email')}</Text>
              <View style={[s.readonlyBox, isDark && s.readonlyBoxDark]}>
                <Ionicons name="mail-outline" size={15} color={isDark ? '#94a3b8' : '#6b7280'} />
                <Text style={[s.readonlyText, isDark && { color: '#e2e8f0' }]} numberOfLines={1}>
                  {auth.email ?? t('profile.defaultEmail')}
                </Text>
              </View>

              <View style={s.block}>
                <Text style={s.fieldLabel}>{t('profile.security.newPassword')}</Text>
                <View style={[s.inputWrap, isDark && s.inputWrapDark]}>
                  <TextInput
                    value={newPass}
                    onChangeText={setNewPass}
                    placeholder="********"
                    placeholderTextColor="#9ca3af"
                    secureTextEntry={!showNewPass}
                    style={[s.inputInline, isDark && { color: '#e2e8f0' }]}
                  />
                  <TouchableOpacity onPress={() => setShowNewPass(v => !v)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Ionicons name={showNewPass ? 'eye-off-outline' : 'eye-outline'} size={18} color={isDark ? '#94a3b8' : '#6b7280'} />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={s.block}>
                <Text style={s.fieldLabel}>{t('profile.security.confirmPassword')}</Text>
                <View style={[s.inputWrap, isDark && s.inputWrapDark]}>
                  <TextInput
                    value={confirmPass}
                    onChangeText={setConfirmPass}
                    placeholder="********"
                    placeholderTextColor="#9ca3af"
                    secureTextEntry={!showConfirmPass}
                    style={[s.inputInline, isDark && { color: '#e2e8f0' }]}
                  />
                  <TouchableOpacity onPress={() => setShowConfirmPass(v => !v)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Ionicons name={showConfirmPass ? 'eye-off-outline' : 'eye-outline'} size={18} color={isDark ? '#94a3b8' : '#6b7280'} />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={s.hintRow}>
                <Ionicons name="information-circle-outline" size={14} color={isDark ? '#94a3b8' : '#6b7280'} />
                <Text style={[s.hintText, isDark && { color: '#94a3b8' }]}>{t('profile.security.hint')}</Text>
              </View>

              <TouchableOpacity style={[s.primaryBtn, isDark && s.primaryBtnDark]} onPress={handleChangePassword}>
                <Ionicons name="lock-closed-outline" size={17} color={isDark ? '#06281c' : '#fff'} />
                <Text style={[s.primaryBtnText, isDark && s.primaryBtnTextDark]}>
                  {t('profile.security.button')}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ===================== PESTAÑA 3 · SOPORTE ===================== */}
          {activeTab === 'support' && (
            <View style={[s.card, isDark && s.cardDark]}>
              <CardHeader
                icon="chatbubbles-outline"
                color="#a855f7"
                title={t('profile.support.title')}
                subtitle={t('profile.support.subtitle')}
                isDark={isDark}
              />

              <Text style={s.fieldLabel}>{t('profile.support.priority')}</Text>
              <View style={s.chipRow}>
                {PRIORITY_OPTIONS.map(option => {
                  const active = supportPriority === option.id;
                  return (
                    <TouchableOpacity
                      key={option.id}
                      style={[s.chip, isDark && s.chipDark, active && s.chipActive]}
                      onPress={() => setSupportPriority(option.id as any)}
                    >
                      <Text style={[s.chipText, isDark && s.chipTextDark, active && s.chipTextActive]}>
                        {t(option.labelKey)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={s.block}>
                <Text style={s.fieldLabel}>{t('profile.support.message')}</Text>
                <TextInput
                  value={supportMessage}
                  onChangeText={setSupportMessage}
                  placeholder={t('profile.support.placeholder')}
                  placeholderTextColor="#9ca3af"
                  multiline
                  style={[s.textArea, isDark && s.textAreaDark]}
                />
              </View>

              <TouchableOpacity style={[s.primaryBtn, isDark && s.primaryBtnDark]} onPress={handleSendSupport}>
                <Ionicons name="send-outline" size={17} color={isDark ? '#06281c' : '#fff'} />
                <Text style={[s.primaryBtnText, isDark && s.primaryBtnTextDark]}>
                  {t('profile.support.button')}
                </Text>
              </TouchableOpacity>

              <View style={s.hintRow}>
                <Ionicons name="information-circle-outline" size={14} color={isDark ? '#94a3b8' : '#6b7280'} />
                <Text style={[s.hintText, isDark && { color: '#94a3b8' }]}>{t('profile.support.hint')}</Text>
              </View>
            </View>
          )}

          {/* Footer — idéntico al Dashboard */}
          <View style={s.footer}>
            <Ionicons name="leaf" size={14} color="#10b981" />
            <Text style={[s.footerText, isDark && { color: '#94a3b8' }]}>{t('home.footerNote')}</Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  // ---------- página / header (tokens del Dashboard) ----------
  page: { flex: 1, backgroundColor: '#f0fdf4' },
  pageDark: { backgroundColor: '#0B1215' },
  safeArea: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderBottomWidth: 1, borderBottomColor: '#f3f4f6',
  },
  headerDark: { backgroundColor: 'rgba(22,35,41,0.95)', borderBottomColor: '#26383D' },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logoBox: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#10b981', alignItems: 'center', justifyContent: 'center' },
  logoIcon: { fontSize: 20, color: '#fff' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#1f2937' },
  iconBtn: {
    width: 36, height: 36, borderRadius: 12, backgroundColor: '#f3f4f6',
    borderWidth: 1, borderColor: '#e5e7eb', alignItems: 'center', justifyContent: 'center',
  },
  iconBtnDark: { backgroundColor: '#162329', borderColor: '#26383D' },
  logoutBtn: {
    flexDirection: 'row', gap: 6, paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 12, backgroundColor: '#f3f4f6', borderWidth: 1, borderColor: '#e5e7eb', alignItems: 'center',
  },
  logoutBtnDark: { backgroundColor: '#162329', borderColor: '#26383D' },
  logoutText: { fontSize: 12, fontWeight: '600', color: '#4b5563' },
  scroll: { padding: 16, paddingBottom: 32 },

  // ---------- tarjeta de usuario ----------
  heroCard: {
    backgroundColor: '#fff', borderRadius: 24, padding: 20,
    borderWidth: 1, borderColor: '#dcfce7',
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 }, elevation: 2,
  },
  heroCardDark: { backgroundColor: '#162329', borderColor: '#26383D' },
  heroRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  avatarWrap: { width: 72, height: 72 },
  avatar: {
    width: 72, height: 72, borderRadius: 20, backgroundColor: '#10b981',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarBadge: {
    position: 'absolute', right: -4, bottom: -4, width: 26, height: 26,
    borderRadius: 13, backgroundColor: '#059669', borderWidth: 2, borderColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
  },
  heroInfo: { flex: 1 },
  heroName: { fontSize: 20, fontWeight: '800', color: '#1f2937' },
  heroEmail: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  heroTags: { flexDirection: 'row', gap: 8, marginTop: 10, flexWrap: 'wrap' },
  heroTag: {
    flexDirection: 'row', gap: 4, alignItems: 'center',
    backgroundColor: '#f3f4f6', borderWidth: 1, borderColor: '#e5e7eb',
    borderRadius: 10, paddingHorizontal: 8, paddingVertical: 4,
  },
  heroTagDark: { backgroundColor: 'rgba(11,18,21,0.4)', borderColor: '#26383D' },
  heroTagText: { fontSize: 10, fontWeight: '600', color: '#4b5563' },
  heroTagTextDark: { color: '#94a3b8' },
  photoBtn: {
    flexDirection: 'row', gap: 6, alignItems: 'center', justifyContent: 'center',
    marginTop: 16, paddingVertical: 10, borderRadius: 12,
    backgroundColor: '#ecfdf5', borderWidth: 1, borderColor: '#d1fae5',
  },
  photoBtnDark: { backgroundColor: 'rgba(52,211,153,0.1)', borderColor: 'rgba(52,211,153,0.25)' },
  photoBtnText: { fontSize: 12, fontWeight: '700', color: '#059669' },

  // ---------- pestañas ----------
  tabsRow: { flexDirection: 'row', gap: 8, marginTop: 16, marginBottom: 4 },
  tab: {
    flex: 1, flexDirection: 'row', gap: 6, alignItems: 'center', justifyContent: 'center',
    paddingVertical: 10, paddingHorizontal: 6, borderRadius: 12,
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e7eb',
  },
  tabDark: { backgroundColor: '#162329', borderColor: '#26383D' },
  tabActive: { backgroundColor: '#059669', borderColor: '#059669' },
  tabText: { fontSize: 11, fontWeight: '700', color: '#4b5563' },
  tabTextDark: { color: '#94a3b8' },
  tabTextActive: { color: '#fff' },

  // ---------- tarjetas ----------
  card: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16, marginTop: 12,
    borderWidth: 1, borderColor: '#f3f4f6',
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 }, elevation: 1,
  },
  cardDark: { backgroundColor: '#1f2937', borderColor: '#374151' },
  cardHead: { flexDirection: 'row', gap: 12, alignItems: 'flex-start', marginBottom: 16 },
  cardHeadText: { flex: 1 },
  cardIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontSize: 16, fontWeight: '800', color: '#1f2937' },
  cardSubtitle: { fontSize: 12, color: '#6b7280', marginTop: 4, lineHeight: 18 },

  // ---------- campos ----------
  fieldRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  fieldCol: { flex: 1 },
  block: { marginTop: 4, marginBottom: 12 },
  fieldLabel: { fontSize: 11, fontWeight: '700', color: '#4b5563', marginBottom: 6 },
  input: {
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12,
    paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: '#111827',
  },
  inputDark: { backgroundColor: 'rgba(11,18,21,0.45)', borderColor: '#26383D', color: '#e2e8f0' },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e7eb',
    borderRadius: 12, paddingHorizontal: 12,
  },
  inputWrapDark: { backgroundColor: 'rgba(11,18,21,0.45)', borderColor: '#26383D' },
  inputInline: { flex: 1, paddingVertical: 10, fontSize: 14, color: '#111827' },
  textArea: {
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12,
    paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: '#111827',
    minHeight: 96, textAlignVertical: 'top',
  },
  textAreaDark: { backgroundColor: 'rgba(11,18,21,0.45)', borderColor: '#26383D', color: '#e2e8f0' },
  readonlyBox: {
    flexDirection: 'row', gap: 8, alignItems: 'center',
    backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#e5e7eb',
    borderRadius: 12, paddingHorizontal: 12, paddingVertical: 11,
  },
  readonlyBoxDark: { backgroundColor: 'rgba(11,18,21,0.45)', borderColor: '#26383D' },
  readonlyText: { fontSize: 13, color: '#6b7280', flex: 1 },

  // ---------- chips ----------
  chipRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  chip: {
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12,
    backgroundColor: '#f3f4f6', borderWidth: 1, borderColor: '#e5e7eb',
  },
  chipDark: { backgroundColor: 'rgba(11,18,21,0.4)', borderColor: '#26383D' },
  chipActive: { backgroundColor: '#059669', borderColor: '#059669' },
  chipText: { fontSize: 12, fontWeight: '600', color: '#4b5563' },
  chipTextDark: { color: '#94a3b8' },
  chipTextActive: { color: '#fff' },

  // ---------- botones ----------
  primaryBtn: {
    flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#059669', borderRadius: 12, paddingVertical: 12, marginTop: 8,
  },
  primaryBtnDark: { backgroundColor: '#34D399' },
  primaryBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },
  primaryBtnTextDark: { color: '#06281c' },
  exportBlock: { marginTop: 16 },
  exportBtnRow: { flexDirection: 'row', gap: 8 },
  exportBtn: {
    flexDirection: 'row', gap: 6, alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12,
    backgroundColor: '#f3f4f6', borderWidth: 1, borderColor: '#e5e7eb',
  },
  exportBtnDark: { backgroundColor: 'rgba(11,18,21,0.4)', borderColor: '#26383D' },
  exportBtnText: { fontSize: 12, fontWeight: '700', color: '#4b5563' },

  // ---------- avisos ----------
  hintRow: { flexDirection: 'row', gap: 6, alignItems: 'flex-start', marginTop: 12 },
  hintText: { fontSize: 11, color: '#6b7280', flex: 1, lineHeight: 16 },

  // ---------- zona de riesgo ----------
  dangerCard: {
    backgroundColor: '#fef2f2', borderRadius: 16, padding: 16, marginTop: 12,
    borderWidth: 1, borderColor: '#fee2e2',
  },
  dangerCardDark: { backgroundColor: 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.28)' },
  dangerBtn: {
    flexDirection: 'row', gap: 6, alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#ef4444', borderRadius: 12, paddingVertical: 11, marginTop: 4,
  },
  dangerBtnText: { fontSize: 13, fontWeight: '700', color: '#fff' },

  // ---------- footer ----------
  footer: { flexDirection: 'row', gap: 6, alignItems: 'center', justifyContent: 'center', marginTop: 24 },
  footerText: { fontSize: 12, color: '#6b7280' },
});
