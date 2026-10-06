// app/(tabs)/profile.tsx
  import React, { useState, useEffect, useCallback } from 'react';
  import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Platform,
    Image,
  } from 'react-native';
  import { LinearGradient } from 'expo-linear-gradient';
  import { useRouter } from 'expo-router';
  import { Ionicons } from '@expo/vector-icons';
  import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
  import { useLanguage } from '../../src/shared/store/LanguageContext';

  import { useThemeMode } from '../../src/shared/store/ThemeContext';
  import { useAuth } from '../../src/shared/store/AuthContext';
  import { colors, spacing } from '../../src/shared/theme';
  import apiClient from '../../src/shared/services/apiClient';

  type TabKey = 'personal' | 'security' | 'support';

  export default function ProfileScreen() {
    const router = useRouter();
    const { theme, toggleTheme } = useThemeMode();
    const { auth, signOut } = useAuth();
    const { t } = useLanguage();
    
    const isDark = theme === 'dark';

    const [activeTab, setActiveTab] = useState<TabKey>('personal');

    const [fullName, setFullName] = useState('');
    const [phone, setPhone] = useState('');
    const [city, setCity] = useState('');
    const [birthdate, setBirthdate] = useState('');
    const [bio, setBio] = useState('');
    const [documentId, setDocumentId] = useState('');
    const [gender, setGender] = useState<'m' | 'f' | 'o' | null>(null);
    const [mainTransport, setMainTransport] = useState<
      'walk' | 'taxi' | null
    >(null);

    const [avatarUri, setAvatarUri] = useState<string | null>(null);

    const [newPass, setNewPass] = useState('');
    const [confirmPass, setConfirmPass] = useState('');

    const [supportMessage, setSupportMessage] = useState('');
    const [supportPriority, setSupportPriority] = useState<
      'low' | 'medium' | 'high'
    >('low');

    const [language, setLanguage] = useState<'es' | 'en' | 'pt'>('es');

    const insets = useSafeAreaInsets();

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
      } catch {}
    };

    const handleChangePassword = async () => {
      if (!newPass || newPass !== confirmPass) return;
      try {
        await apiClient.post('/api/auth/change-password', {
          currentPassword: '',
          newPassword: newPass,
        });
        setNewPass('');
        setConfirmPass('');
      } catch {}
    };

    const handleSendSupport = () => {
      // RF30 soporte técnico
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

    const bgGradient = isDark
      ? ['#022c22', '#064e3b', '#052e16']
      : ['#e0f2f1', '#d1fae5', '#ecfdf5'];

    return (
      <LinearGradient
        colors={bgGradient}
        style={s.bg}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <SafeAreaView
          style={[
            s.safeArea,
            {
              paddingTop: insets.top, // respeta notch
            },
          ]}
        >
          {/* Header */}
          <View style={[s.header, { marginTop: -4 }]}>
            <View style={s.headerLeft}>
              <TouchableOpacity
                style={s.backBtn}
                onPress={() => router.back()}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons
                  name="arrow-back"
                  size={20}
                  color={isDark ? '#bbf7d0' : '#065f46'}
                />
                <Text style={[s.backText, isDark && { color: '#bbf7d0' }]}>
                  Volver
                </Text>
              </TouchableOpacity>
              <Text style={[s.screenTitle, isDark && { color: '#e5f9f0' }]}>
                Mi perfil
              </Text>
            </View>

            <View style={s.headerRight}>
              <TouchableOpacity
                style={s.themeBtn}
                onPress={toggleTheme}
              >
                <Ionicons
                  name={isDark ? 'sunny-outline' : 'moon-outline'}
                  size={18}
                  color={isDark ? '#facc15' : '#0f172a'}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Badge usuario + foto */}
          <View style={s.userSection}>
            <TouchableOpacity
              style={s.avatarWrapper}
              onPress={handlePickAvatar}
            >
              {avatarUri ? (
                <Image source={{ uri: avatarUri }} style={s.avatar} />
              ) : (
                <View style={s.avatarPlaceholder}>
                  <Ionicons
                    name="person-outline"
                    size={38}
                    color={isDark ? '#e5e7eb' : '#065f46'}
                  />
                </View>
              )}
              <View style={s.avatarBadge}>
                <Ionicons
                  name="camera-outline"
                  size={14}
                  color="#ecfdf5"
                />
              </View>
            </TouchableOpacity>

            <View style={s.userInfo}>
              <Text style={[s.userName, isDark && { color: '#e5e7eb' }]}>
                {fullName || 'Usuario EcoRuteando'}
              </Text>
              <Text style={[s.userEmail, isDark && { color: '#9ca3af' }]}>
                {auth.email ?? 'usuario@ecoruteando.com'}
              </Text>
            </View>
          </View>

          {/* Tabs */}
          <View style={s.tabsRow}>
            <TouchableOpacity
              style={[s.tab, activeTab === 'personal' && s.tabActive]}
              onPress={() => setActiveTab('personal')}
            >
              <Ionicons
                name="person-outline"
                size={16}
                color={activeTab === 'personal' ? '#ecfdf5' : '#065f46'}
              />
              <Text
                style={[
                  s.tabText,
                  activeTab === 'personal' && s.tabTextActive,
                ]}
              >
                Perfil y ajustes
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[s.tab, activeTab === 'security' && s.tabActive]}
              onPress={() => setActiveTab('security')}
            >
              <Ionicons
                name="shield-checkmark-outline"
                size={16}
                color={activeTab === 'security' ? '#ecfdf5' : '#065f46'}
              />
              <Text
                style={[
                  s.tabText,
                  activeTab === 'security' && s.tabTextActive,
                ]}
              >
                Seguridad
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[s.tab, activeTab === 'support' && s.tabActive]}
              onPress={() => setActiveTab('support')}
            >
              <Ionicons
                name="chatbubbles-outline"
                size={16}
                color={activeTab === 'support' ? '#ecfdf5' : '#065f46'}
              />
              <Text
                style={[
                  s.tabText,
                  activeTab === 'support' && s.tabTextActive,
                ]}
              >
                Soporte
              </Text>
            </TouchableOpacity>
          </View>

          {/* Contenido */}
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={s.scroll}
            showsVerticalScrollIndicator={false}
          >
            {activeTab === 'personal' && (
              <View style={s.cardWrapper}>
                {/* Datos personales */}
                <View style={[s.card, isDark && s.cardDark]}>
                  <Text
                    style={[
                      s.cardTitle,
                      isDark && { color: '#e5f9f0' },
                    ]}
                  >
                    Información personal
                  </Text>
                  <Text
                    style={[
                      s.cardSubtitle,
                      isDark && { color: '#9ca3af' },
                    ]}
                  >
                    Actualiza tus datos básicos. Estos ayudan a personalizar tus rutas y estadísticas.
                  </Text>

                  <View style={s.fieldRow}>
                    <View style={s.fieldCol}>
                      <Text style={s.fieldLabel}>Nombre completo</Text>
                      <TextInput
                        value={fullName}
                        onChangeText={setFullName}
                        placeholder="Tu nombre y apellidos"
                        placeholderTextColor="#9ca3af"
                        style={[s.input, isDark && s.inputDark]}
                      />
                    </View>
                    <View style={s.fieldCol}>
                      <Text style={s.fieldLabel}>Documento (opcional)</Text>
                      <TextInput
                        value={documentId}
                        onChangeText={setDocumentId}
                        placeholder="CC / TI / Pasaporte"
                        placeholderTextColor="#9ca3af"
                        style={[s.input, isDark && s.inputDark]}
                      />
                    </View>
                  </View>

                  <View style={s.fieldRow}>
                    <View style={s.fieldCol}>
                      <Text style={s.fieldLabel}>Teléfono</Text>
                      <TextInput
                        value={phone}
                        onChangeText={setPhone}
                        placeholder="Ej: 310 000 0000"
                        placeholderTextColor="#9ca3af"
                        keyboardType="phone-pad"
                        style={[s.input, isDark && s.inputDark]}
                      />
                    </View>
                    <View style={s.fieldCol}>
                      <Text style={s.fieldLabel}>Ciudad</Text>
                      <TextInput
                        value={city}
                        onChangeText={setCity}
                        placeholder="Ciudad, país"
                        placeholderTextColor="#9ca3af"
                        style={[s.input, isDark && s.inputDark]}
                      />
                    </View>
                  </View>

                  <View style={s.fieldRow}>
                    <View style={s.fieldCol}>
                      <Text style={s.fieldLabel}>Fecha de nacimiento</Text>
                      <TextInput
                        value={birthdate}
                        onChangeText={setBirthdate}
                        placeholder="dd/mm/aa"
                        placeholderTextColor="#9ca3af"
                        style={[s.input, isDark && s.inputDark]}
                      />
                    </View>
                    <View style={s.fieldCol}>
                      <Text style={s.fieldLabel}>Género (opcional)</Text>
                      <View style={s.chipRow}>
                        {[
                          { id: 'm', label: 'Masculino' },
                          { id: 'f', label: 'Femenino' },
                          { id: 'o', label: 'Otro' },
                        ].map(opt => {
                          const active = gender === opt.id;
                          return (
                            <TouchableOpacity
                              key={opt.id}
                              style={[
                                s.smallChip,
                                active && s.smallChipActive,
                              ]}
                              onPress={() => setGender(opt.id as any)}
                            >
                              <Text
                                style={[
                                  s.smallChipText,
                                  active && s.smallChipTextActive,
                                ]}
                              >
                                {opt.label}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>
                  </View>

                  <View style={{ marginTop: spacing.sm }}>
                    <Text style={s.fieldLabel}>
                      Medio principal de transporte
                    </Text>
                    <View style={s.chipRow}>
                      {[
                        { id: 'walk', label: 'Caminar' },
                        { id: 'taxi', label: 'Taxi' },
                      ].map(opt => {
                        const active = mainTransport === opt.id;
                        return (
                          <TouchableOpacity
                            key={opt.id}
                            style={[
                              s.smallChip,
                              active && s.smallChipActive,
                            ]}
                            onPress={() =>
                              setMainTransport(opt.id as any)
                            }
                          >
                            <Text
                              style={[
                                s.smallChipText,
                                active && s.smallChipTextActive,
                              ]}
                            >
                              {opt.label}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>

                  <View style={{ marginTop: spacing.sm }}>
                    <Text style={s.fieldLabel}>Biografía</Text>
                    <TextInput
                      value={bio}
                      onChangeText={setBio}
                      placeholder="Cuéntanos cómo te mueves por la ciudad y qué te motiva a usar rutas ecológicas."
                      placeholderTextColor="#9ca3af"
                      multiline
                      style={[s.textArea, isDark && s.inputDark]}
                    />
                  </View>

                  <TouchableOpacity
                    style={s.primaryBtn}
                    onPress={handleSavePersonal}
                  >
                    <Text style={s.primaryBtnText}>Guardar cambios</Text>
                  </TouchableOpacity>
                </View>

                {/* Configuración de cuenta */}
                <View style={[s.card, isDark && s.cardDark]}>
                  <Text
                    style={[
                      s.cardTitle,
                      isDark && { color: '#e5f9f0' },
                    ]}
                  >
                    Configuración de cuenta
                  </Text>
                  <Text
                    style={[
                      s.cardSubtitle,
                      isDark && { color: '#9ca3af' },
                    ]}
                  >
                    Idioma, tema y exportación de información según los requerimientos del SRS.
                  </Text>

                  <View style={s.fieldRowSingle}>
                    <View style={{ flex: 1 }}>
                      <Text style={s.fieldLabel}>Idioma de la interfaz</Text>
                      <View style={s.chipRow}>
                        {[
                          { id: 'es', label: 'Español' },
                          { id: 'en', label: 'Inglés' },
                          { id: 'pt', label: 'Portugués' },
                        ].map(opt => {
                          const active = language === opt.id;
                          return (
                            <TouchableOpacity
                              key={opt.id}
                              style={[
                                s.smallChip,
                                active && s.smallChipActive,
                              ]}
                              onPress={() =>
                                setLanguage(opt.id as any)
                              }
                            >
                              <Text
                                style={[
                                  s.smallChipText,
                                  active && s.smallChipTextActive,
                                ]}
                              >
                                {opt.label}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>
                  </View>

                  <View style={s.exportRow}>
                    <Text style={s.fieldLabel}>Exportar mis datos</Text>
                    <View style={s.exportBtnRow}>
                      <TouchableOpacity
                        style={s.roundIconBtn}
                        onPress={() => handleExportData('pdf')}
                      >
                        <Ionicons
                          name="document-text-outline"
                          size={18}
                          color="#022c22"
                        />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={s.roundIconBtn}
                        onPress={() => handleExportData('excel')}
                      >
                        <Ionicons
                          name="grid-outline"
                          size={18}
                          color="#022c22"
                        />
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={s.dangerBox}>
                    <Text style={s.dangerTitle}>Zona de riesgo</Text>
                    <Text style={s.dangerText}>
                      Si eliminas tu cuenta, se borrarán tus datos personales y no
                      podrás recuperar tu historial de rutas.
                    </Text>
                    <TouchableOpacity
                      style={s.dangerBtn}
                      onPress={handleDeleteAccount}
                    >
                      <Ionicons
                        name="trash-outline"
                        size={16}
                        color="#fee2e2"
                      />
                      <Text style={s.dangerBtnText}>Eliminar cuenta</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}

            {activeTab === 'security' && (
              <View style={[s.card, isDark && s.cardDark]}>
                <Text
                  style={[
                    s.cardTitle,
                    isDark && { color: '#e5f9f0' },
                  ]}
                >
                  Seguridad de la cuenta
                </Text>
                <Text
                  style={[
                    s.cardSubtitle,
                    isDark && { color: '#9ca3af' },
                  ]}
                >
                  Actualiza tu contraseña y protege tu acceso según los requisitos de autenticación segura.
                </Text>

                <View style={{ marginBottom: spacing.sm }}>
                  <Text style={s.fieldLabel}>Correo electrónico</Text>
                  <View style={s.disabledInput}>
                    <Text style={s.disabledText}>
                      {auth.email ?? 'usuario@ecoruteando.com'}
                    </Text>
                  </View>
                </View>

                <View style={{ marginBottom: spacing.sm }}>
                  <Text style={s.fieldLabel}>Nueva contraseña</Text>
                  <TextInput
                    value={newPass}
                    onChangeText={setNewPass}
                    placeholder="********"
                    placeholderTextColor="#9ca3af"
                    secureTextEntry
                    style={[s.input, isDark && s.inputDark]}
                  />
                </View>

                <View style={{ marginBottom: spacing.sm }}>
                  <Text style={s.fieldLabel}>Confirmar contraseña</Text>
                  <TextInput
                    value={confirmPass}
                    onChangeText={setConfirmPass}
                    placeholder="********"
                    placeholderTextColor="#9ca3af"
                    secureTextEntry
                    style={[s.input, isDark && s.inputDark]}
                  />
                </View>

                <Text style={s.securityHint}>
                  La contraseña debe tener mínimo 8 caracteres, una mayúscula, un número y un carácter especial.
                </Text>

                <TouchableOpacity
                  style={[s.primaryBtn, { marginTop: spacing.sm }]}
                  onPress={handleChangePassword}
                >
                  <Text style={s.primaryBtnText}>Actualizar contraseña</Text>
                </TouchableOpacity>
              </View>
            )}

            {activeTab === 'support' && (
              <View style={[s.card, isDark && s.cardDark]}>
                <Text
                  style={[
                    s.cardTitle,
                    isDark && { color: '#e5f9f0' },
                  ]}
                >
                  Soporte técnico
                </Text>
                <Text
                  style={[
                    s.cardSubtitle,
                    isDark && { color: '#9ca3af' },
                  ]}
                >
                  ¿Tienes un problema o sugerencia? Envía un mensaje y el administrador revisará tu caso.
                </Text>

                <Text style={s.fieldLabel}>Prioridad</Text>
                <View style={s.priorityRow}>
                  {[
                    { id: 'low', label: 'Baja' },
                    { id: 'medium', label: 'Media' },
                    { id: 'high', label: 'Alta' },
                  ].map(option => {
                    const active = supportPriority === option.id;
                    return (
                      <TouchableOpacity
                        key={option.id}
                        style={[
                          s.priorityChip,
                          active && s.priorityChipActive,
                        ]}
                        onPress={() =>
                          setSupportPriority(option.id as any)
                        }
                      >
                        <Text
                          style={[
                            s.priorityChipText,
                            active && s.priorityChipTextActive,
                          ]}
                        >
                          {option.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <View style={{ marginTop: spacing.sm }}>
                  <Text style={s.fieldLabel}>Mensaje</Text>
                  <TextInput
                    value={supportMessage}
                    onChangeText={setSupportMessage}
                    placeholder="Describe el problema, la ruta afectada o la mejora que te gustaría ver."
                    placeholderTextColor="#9ca3af"
                    multiline
                    style={[s.textArea, isDark && s.inputDark]}
                  />
                </View>

                <TouchableOpacity
                  style={[s.primaryBtn, { marginTop: spacing.sm }]}
                  onPress={handleSendSupport}
                >
                  <Ionicons
                    name="send-outline"
                    size={18}
                    color="#ecfdf5"
                  />
                  <Text style={s.primaryBtnText}>Enviar mensaje</Text>
                </TouchableOpacity>

                <Text style={s.supportHint}>
                  Más adelante podrás chatear en tiempo real con el equipo de soporte desde esta sección.
                </Text>
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    );
  }

const s = StyleSheet.create({
  bg: {
    flex: 1,
    paddingTop: Platform.OS === 'web' ? 24 : 0,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'column',
    gap: 6,
  },
  headerRight: {
    flexDirection: 'row',
    gap: 8,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  backText: {
    fontFamily: 'Times New Roman',
    fontSize: 14,
    color: '#065f46',
  },
  screenTitle: {
    fontFamily: 'Times New Roman',
    fontSize: 20,
    color: '#022c22',
  },
  themeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(248,250,252,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.5)',
  },

  userSection: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarWrapper: {
    width: 64,
    height: 64,
    borderRadius: 32,
    position: 'relative',
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  avatarPlaceholder: {
    flex: 1,
    borderRadius: 32,
    backgroundColor: 'rgba(15,118,110,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#16a34a',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#ecfdf5',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontFamily: 'Times New Roman',
    fontSize: 16,
    color: '#0f172a',
  },
  userEmail: {
    fontFamily: 'Times New Roman',
    fontSize: 12,
    color: '#4b5563',
  },

  tabsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(209,250,229,0.9)',
  },
  tabActive: {
    backgroundColor: '#16a34a',
  },
  tabText: {
    fontFamily: 'Times New Roman',
    fontSize: 12,
    color: '#065f46',
  },
  tabTextActive: {
    color: '#ecfdf5',
  },

  scroll: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl,
  },
  cardWrapper: {
    gap: spacing.md,
  },
  card: {
    borderRadius: 24,
    backgroundColor: '#f9fafb',
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.35)',
    marginBottom: spacing.md,
  },
  cardDark: {
    backgroundColor: 'rgba(15,23,23,0.97)',
    borderColor: 'rgba(148,163,184,0.4)',
  },
  cardTitle: {
    fontFamily: 'Times New Roman',
    fontSize: 18,
    color: '#0f172a',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontFamily: 'Times New Roman',
    fontSize: 12,
    color: '#6b7280',
    marginBottom: spacing.sm,
  },

  fieldRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  fieldRowSingle: {
    marginTop: spacing.sm,
  },
  fieldCol: {
    flex: 1,
  },
  fieldLabel: {
    fontFamily: 'Times New Roman',
    fontSize: 12,
    color: '#4b5563',
    marginBottom: 4,
  },
  input: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#f9fafb',
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontFamily: 'Times New Roman',
    fontSize: 13,
    color: '#111827',
  },
  textArea: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#f9fafb',
    paddingHorizontal: 14,
    paddingVertical: 10,
    minHeight: 90,
    fontFamily: 'Times New Roman',
    fontSize: 13,
    color: '#111827',
    textAlignVertical: 'top',
  },
  inputDark: {
    backgroundColor: '#020617',
    borderColor: '#1f2937',
    color: '#e5e7eb',
  },

  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  smallChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#f9fafb',
  },
  smallChipActive: {
    borderColor: '#16a34a',
    backgroundColor: 'rgba(22,163,74,0.12)',
  },
  smallChipText: {
    fontFamily: 'Times New Roman',
    fontSize: 11,
    color: '#374151',
  },
  smallChipTextActive: {
    color: '#166534',
  },

  exportRow: {
    marginTop: spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  exportBtnRow: {
    flexDirection: 'row',
    gap: 6,
  },
  roundIconBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(249,250,251,0.96)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.6)',
  },

  dangerBox: {
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: 18,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  dangerTitle: {
    fontFamily: 'Times New Roman',
    fontSize: 13,
    color: '#b91c1c',
    marginBottom: 4,
  },
  dangerText: {
    fontFamily: 'Times New Roman',
    fontSize: 11,
    color: '#7f1d1d',
    marginBottom: spacing.sm,
  },
  dangerBtn: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#b91c1c',
  },
  dangerBtnText: {
    fontFamily: 'Times New Roman',
    fontSize: 12,
    color: '#fee2e2',
  },

  disabledInput: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  disabledText: {
    fontFamily: 'Times New Roman',
    fontSize: 13,
    color: '#6b7280',
  },
  securityHint: {
    fontFamily: 'Times New Roman',
    fontSize: 11,
    color: '#6b7280',
    marginTop: 4,
  },
  priorityRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  priorityChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  priorityChipActive: {
    borderColor: '#16a34a',
    backgroundColor: 'rgba(22,163,74,0.12)',
  },
  priorityChipText: {
    fontFamily: 'Times New Roman',
    fontSize: 12,
    color: '#374151',
  },
  priorityChipTextActive: {
    color: '#166534',
  },
  supportHint: {
    marginTop: spacing.sm,
    fontFamily: 'Times New Roman',
    fontSize: 11,
    color: '#6b7280',
  },
});