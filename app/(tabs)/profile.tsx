// app/(tabs)/profile.tsx — rediseñado con el sistema de diseño del Dashboard (index.tsx)
import { Dialog } from '../../src/shared/components/ui/AppDialog';
import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Image,  } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useLanguage } from '../../src/shared/store/LanguageContext';
import { useThemeMode } from '../../src/shared/store/ThemeContext';
import { useAuth } from '../../src/shared/store/AuthContext';
import apiClient from '../../src/shared/services/apiClient';
import * as ImagePicker from 'expo-image-picker';
import * as SecureStore from '../../src/shared/services/keyStorage';
import { exportHtmlToPdf, exportCsvOrExcel } from '../../src/shared/utils/exportUtils';

const avatarKeyFor = (userId: string | null) =>
  userId ? `profileAvatarUri_${userId}` : 'profileAvatarUri';

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
  const { auth, signOut, setAuth } = useAuth();
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
  const [avatarBroken, setAvatarBroken] = useState(false);

  const [profileEmail, setProfileEmail] = useState('');
  const [hasPassword, setHasPassword] = useState(true);
  const [currentPassForProfile, setCurrentPassForProfile] = useState('');
  const [showCurrentPassForProfile, setShowCurrentPassForProfile] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  const [supportSubject, setSupportSubject] = useState('');
  const [supportProblemType, setSupportProblemType] = useState('routes');
  const [supportMessage, setSupportMessage] = useState('');
  const [submittingTicket, setSubmittingTicket] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);
  const [myTickets, setMyTickets] = useState<any[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [expandedTicketId, setExpandedTicketId] = useState<string | null>(null);
  const [exportingFormat, setExportingFormat] = useState<'pdf' | 'excel' | null>(null);

  const fetchProfile = useCallback(async () => {
    try {
      const { data } = await apiClient.get('/api/auth/me');
      const user = data.user ?? data;
      setFullName(`${user.firstName ?? ''} ${user.lastName ?? ''}`.trim());
      setPhone(user.phoneNumber ?? '');
      setProfileEmail(user.email ?? '');
      if (user.hasPassword !== undefined) {
        setHasPassword(user.hasPassword);
      }
      // Foto desde el backend (base64 data URI)
      if (user.profilePhotoUrl) {
        setAvatarUri(user.profilePhotoUrl);
        await SecureStore.setItemAsync(avatarKeyFor(auth.userId), user.profilePhotoUrl);
      }
    } catch {}
  }, [auth.userId]);

  useEffect(() => {
    fetchProfile();
    // Fallback: foto local si el backend no tiene una
    SecureStore.getItemAsync(avatarKeyFor(auth.userId))
      .then(u => { if (u) setAvatarUri(prev => prev ?? u); })
      .catch(() => {});
  }, [fetchProfile]);

  const handlePickAvatar = async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Dialog.alert(t('planRoute.permissionDeniedTitle'), t('report.gpsMsg'), { tone: 'warning', icon: 'images' });
        return;
      }
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.5,
      });
      if (res.canceled || !res.assets?.[0]?.uri) return;

      const pickedUri = res.assets[0].uri;
      if (!pickedUri) return;

      // Convertir a base64
      const FS: any = await import('expo-file-system/legacy');
      const base64 = await FS.readAsStringAsync(pickedUri, {
        encoding: FS.EncodingType.Base64,
      });
      const dataUri = `data:image/jpeg;base64,${base64}`;

      // Subir al backend
      await apiClient.put('/api/users/me/photo', { photoBase64: dataUri });

      // Guardar localmente tambien (fallback offline)
      let saved = pickedUri;
      try {
        const filename = `avatar_${Date.now()}.jpg`;
        const dest = `${FS.documentDirectory}${filename}`;
        await FS.copyAsync({ from: pickedUri, to: dest });
        saved = dest;
      } catch {}

      setAvatarBroken(false);
      setAvatarUri(saved);
      await SecureStore.setItemAsync(avatarKeyFor(auth.userId), saved);
      Dialog.alert(t('profile.feedback.savedTitle'), 'Foto de perfil actualizada correctamente.', { tone: 'success' });
    } catch (e: any) {
      console.warn('[profile] picker error:', e?.message);
      Dialog.alert(t('auth.errorTitle'), t('profile.feedback.error'), { tone: 'error' });
    }
  };

  const handleSavePersonal = async () => {
    try {
      const parts = fullName.trim().split(/\s+/);
      const firstName = parts[0] || '';
      const lastName = parts.slice(1).join(' ') || '';

      if (hasPassword && !currentPassForProfile) {
        Dialog.alert(
          t('auth.errorTitle'),
          'Por favor ingresa tu contraseña actual para confirmar la actualización de tus datos personales.',
          { tone: 'warning' }
        );
        return;
      }

      await apiClient.put('/api/users/me', {
        firstName,
        lastName,
        email: profileEmail || auth.email,
        phoneNumber: phone || null,
        currentPassword: currentPassForProfile || null,
      });

      // Propaga el nombre nuevo al contexto: el saludo del inicio se actualiza al instante.
      setAuth({ ...auth, firstName });
      setCurrentPassForProfile('');
      Dialog.alert(t('profile.feedback.savedTitle'), t('profile.feedback.savedMsg'));
    } catch (err: any) {
      Dialog.alert(
        t('auth.errorTitle'),
        err?.response?.data?.detail || err?.response?.data?.message || t('profile.feedback.error'),
      { tone: 'error' });
    }
  };

  const handleChangePassword = async () => {
    if (!hasPassword) {
      Dialog.alert('Cuenta vinculada a Google', 'Tu cuenta está vinculada a Google. Administra tu contraseña y seguridad directamente en Google.', { tone: 'info' });
      return;
    }
    if (!currentPassword) {
      Dialog.alert(t('auth.errorTitle'), 'Por favor ingresa tu contraseña actual.', { tone: 'error' });
      return;
    }
    if (!newPass || newPass !== confirmPass || newPass.length < 8) {
      Dialog.alert(t('auth.errorTitle'), t('profile.feedback.invalidPass'), { tone: 'error' });
      return;
    }
    try {
      await apiClient.post('/api/auth/change-password', {
        currentPassword,
        newPassword: newPass,
      });
      setCurrentPassword('');
      setNewPass('');
      setConfirmPass('');
      Dialog.alert(t('profile.feedback.passTitle'), t('profile.feedback.passMsg'));
    } catch (err: any) {
      Dialog.alert(
        t('auth.errorTitle'),
        err?.response?.data?.detail || err?.response?.data?.message || t('profile.feedback.error'),
      { tone: 'error' });
    }
  };

  const PROBLEM_TYPES = [
    { id: 'routes', label: 'Problema con rutas o visualización en mapa' },
    { id: 'profile', label: 'Error en mi cuenta, contraseña o datos de perfil' },
    { id: 'general', label: 'Incidencia o falla técnica general' },
    { id: 'suggestion', label: 'Sugerencia de mejora o felicitación' },
    { id: 'other', label: 'Otro problema' },
  ];

  const TYPE_LABEL_MAP: Record<string, string> = {
    routes: 'Problema con rutas o mapa',
    profile: 'Error en mi cuenta o perfil',
    general: 'Incidencia técnica general',
    suggestion: 'Sugerencia o felicitación',
    other: 'Otro problema',
  };

  const FAQ_ITEMS = [
    {
      id: 'rutas',
      q: '¿Cómo consultar mis rutas?',
      a: "Puedes acceder a tus rutas planificadas desde la opción 'Mis Rutas' en el panel principal. Si deseas guardar una ruta para consultarla frecuentemente, presiona el ícono de corazón ❤️ para enviarla a tu lista de Favoritos.",
    },
    {
      id: 'perfil',
      q: '¿Cómo actualizar mi perfil?',
      a: "En esta misma sección de 'Mi Perfil', ve a la pestaña 'Información Personal' y presiona el botón 'Editar Perfil'. Podrás actualizar tu nombre, número de teléfono, foto y biografía.",
    },
    {
      id: 'error',
      q: '¿Qué hago si ocurre un error?',
      a: 'Si el mapa no carga o experimentas lentitud, intenta reiniciar la app. Si el error persiste al calcular una ruta o iniciar sesión, completa el formulario de soporte detallando lo sucedido.',
    },
    {
      id: 'co2',
      q: '¿Cómo se calcula el ahorro de CO₂?',
      a: 'Al planificar una ruta a pie o en bici, nuestro algoritmo ambiental calcula la distancia y la compara contra las emisiones que generaría un vehículo particular a combustión (aprox. 170 gramos de CO₂ por kilómetro recorrido). Así puedes visualizar tu impacto ambiental positivo.',
    },
  ];

  const loadMyTickets = useCallback(async () => {
    setLoadingTickets(true);
    try {
      const { data } = await apiClient.get('/api/support/tickets/mine');
      setMyTickets(Array.isArray(data) ? data : data?.items ?? []);
    } catch (e) {
      console.warn('[support] error cargando tickets:', e);
    } finally {
      setLoadingTickets(false);
    }
  }, []);

  const handleSendSupport = async () => {
    if (!supportSubject.trim() || !supportMessage.trim()) {
      Dialog.alert(t('auth.errorTitle'), t('profile.feedback.emptyMessage'), { tone: 'error' });
      return;
    }
    setSubmittingTicket(true);
    try {
      const typeLabel = TYPE_LABEL_MAP[supportProblemType] || 'General';
      const formattedMessage = `[Tipo de problema: ${typeLabel}]\n\n${supportMessage.trim()}`;
      await apiClient.post('/api/support/tickets', {
        subject: supportSubject.trim(),
        message: formattedMessage,
        priority: 2,
      });
      setSupportSubject('');
      setSupportMessage('');
      setSupportProblemType('routes');
      Dialog.alert(t('profile.feedback.supportTitle'), t('profile.feedback.supportMsg'));
      await loadMyTickets();
    } catch (err: any) {
      Dialog.alert(
        t('auth.errorTitle'),
        err?.response?.data?.detail || err?.response?.data?.message || t('profile.feedback.error'),
        { tone: 'error' }
      );
    } finally {
      setSubmittingTicket(false);
    }
  };

  const handleExportData = async (format: 'pdf' | 'excel') => {
    setExportingFormat(format);
    try {
      let tripsList: any[] = [];
      try {
        const { data } = await apiClient.get('/api/mobility/trips/history');
        const raw = Array.isArray(data) ? data : (data?.trips ?? data?.items ?? []);
        tripsList = Array.isArray(raw) ? raw : [];
      } catch (err) {
        console.warn('[profile export] No se pudieron cargar viajes:', err);
      }

      const today = new Date().toISOString().slice(0, 10);
      const userDisplay = fullName || `${auth.firstName ?? ''} ${(auth as any).lastName ?? ''}`.trim() || 'Usuario EcoRuteando';
      const emailDisplay = profileEmail || auth.email || '—';
      const phoneDisplay = phone || '—';

      const totalKm = tripsList.reduce((sum, t) => sum + Number(t.distanceKm ?? t.distance ?? 0), 0);
      const totalCo2 = tripsList.reduce((sum, t) => sum + Number(t.actualCo2Kg ?? t.estimatedCo2Kg ?? t.co2SavedKg ?? 0), 0);

      if (format === 'pdf') {
        const tripRows = tripsList.slice(0, 50).map((t, idx) => `
          <tr>
            <td>${idx + 1}</td>
            <td>${t.startName || t.originAddress || 'Origen'}</td>
            <td>${t.destinationName || t.destinationAddress || 'Destino'}</td>
            <td>${t.transportMode || 'A pie'}</td>
            <td>${Number(t.distanceKm ?? 0).toFixed(2)} km</td>
            <td>${Number(t.actualCo2Kg ?? t.estimatedCo2Kg ?? t.co2SavedKg ?? 0).toFixed(3)} kg</td>
            <td>${t.startedAt ? new Date(t.startedAt).toLocaleDateString('es-CO') : '—'}</td>
          </tr>
        `).join('');

        const html = `
          <html><head><meta charset="utf-8"><style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; padding: 24px; color: #1f2937; }
            .header { border-bottom: 2px solid #059669; padding-bottom: 12px; margin-bottom: 16px; }
            h1 { color: #059669; font-size: 22px; margin: 0; }
            .sub { color: #6b7280; font-size: 12px; margin-top: 4px; }
            .card { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 14px; margin-bottom: 16px; }
            .card-title { font-weight: bold; color: #065f46; font-size: 14px; margin-bottom: 8px; }
            .user-info { font-size: 13px; line-height: 1.6; color: #374151; }
            .stats { display: flex; gap: 20px; font-size: 13px; color: #047857; font-weight: 500; margin-top: 6px; }
            table { width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 11px; }
            th { background: #059669; color: #fff; padding: 8px 6px; text-align: left; }
            td { padding: 7px 6px; border-bottom: 1px solid #e5e7eb; }
            tr:nth-child(even) td { background: #f9fafb; }
            .footer { margin-top: 24px; font-size: 10px; color: #9ca3af; text-align: center; }
          </style></head><body>
            <div class="header">
              <h1>🌿 EcoRuteando — Reporte de Datos del Usuario</h1>
              <div class="sub">Generado el ${new Date().toLocaleDateString('es-CO')} a las ${new Date().toLocaleTimeString('es-CO')}</div>
            </div>
            <div class="card">
              <div class="card-title">Información de Perfil</div>
              <div class="user-info">
                <div><strong>Nombre:</strong> ${userDisplay}</div>
                <div><strong>Correo Electrónico:</strong> ${emailDisplay}</div>
                <div><strong>Teléfono:</strong> ${phoneDisplay}</div>
              </div>
              <div class="stats">
                <span>Viajes Registrados: <strong>${tripsList.length}</strong></span>
                <span>Distancia Total: <strong>${totalKm.toFixed(2)} km</strong></span>
                <span>CO₂ Evitado/Ahorrado: <strong>${totalCo2.toFixed(3)} kg</strong></span>
              </div>
            </div>
            ${tripsList.length > 0 ? `
              <div style="font-weight: bold; font-size: 13px; color: #374151; margin-bottom: 4px;">Historial de Trayectos Recientes</div>
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Origen</th>
                    <th>Destino</th>
                    <th>Modo</th>
                    <th>Distancia</th>
                    <th>CO₂</th>
                    <th>Fecha</th>
                  </tr>
                </thead>
                <tbody>${tripRows}</tbody>
              </table>
            ` : '<p style="font-size: 12px; color: #6b7280;">No hay trayectos registrados aún en la cuenta.</p>'}
            <div class="footer">EcoRuteando · Tu plataforma de movilidad inteligente y sostenible</div>
          </body></html>
        `;

        await exportHtmlToPdf(html, `ecoruteando-perfil-${today}.pdf`);
      } else {
        const escapeCsv = (str: any) => `"${String(str ?? '').replace(/"/g, '""')}"`;
        const headers = ['#', 'Origen', 'Destino', 'Modo de Transporte', 'Distancia (km)', 'CO2 (kg)', 'Fecha'];
        const csvRows = tripsList.map((t, idx) => [
          idx + 1,
          escapeCsv(t.startName || t.originAddress || 'Origen'),
          escapeCsv(t.destinationName || t.destinationAddress || 'Destino'),
          escapeCsv(t.transportMode || 'walking'),
          Number(t.distanceKm ?? 0).toFixed(2),
          Number(t.actualCo2Kg ?? t.estimatedCo2Kg ?? t.co2SavedKg ?? 0).toFixed(3),
          escapeCsv(t.startedAt ? new Date(t.startedAt).toLocaleDateString('es-CO') : '')
        ].join(','));

        const csvContent = [
          `"Reporte de Datos de Usuario - EcoRuteando"`,
          `"Usuario",${escapeCsv(userDisplay)}`,
          `"Correo",${escapeCsv(emailDisplay)}`,
          `"Teléfono",${escapeCsv(phoneDisplay)}`,
          `"Fecha de Generación",${escapeCsv(new Date().toLocaleString('es-CO'))}`,
          `"Total Viajes",${tripsList.length}`,
          `"Total Distancia (km)",${totalKm.toFixed(2)}`,
          `"Total CO2 Ahorrado (kg)",${totalCo2.toFixed(3)}`,
          ``,
          headers.join(','),
          ...csvRows
        ].join('\r\n');

        await exportCsvOrExcel(csvContent, `ecoruteando-datos-${today}.csv`);
      }
    } catch (e: any) {
      console.warn('[handleExportData]', e);
      Dialog.alert(t('auth.errorTitle'), e?.message || 'No se pudieron exportar los datos.', { tone: 'error' });
    } finally {
      setExportingFormat(null);
    }
  };

  const handleLogout = async () => {
    await signOut();
    router.replace('/(auth)/login');
  };

  const handleDeleteAccount = () => {
    // RF6 eliminación de cuenta
    Dialog.alert(
      t('profile.account.deleteTitle'),
      t('profile.account.deleteText'),
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: t('profile.account.deleteButton'),
          style: 'destructive',
          onPress: async () => {
            try {
              await apiClient.delete('/api/users/me');
              await signOut();
              router.replace('/(auth)/login');
            } catch (err: any) {
              Dialog.alert(
                t('auth.errorTitle'),
                err?.response?.data?.detail || err?.response?.data?.message || t('profile.feedback.error'),
                { tone: 'error' }
              );
            }
          },
        },
      ],
      { tone: 'warning', icon: 'trash' }
    );
  };

  const inputBoxDark = isDark && s.inputDark;

  return (
    <View style={[s.page, isDark && s.pageDark]}>
      <SafeAreaView style={[s.safeArea, { paddingTop: insets.top }]}>
        {/* Header — idéntico al Dashboard */}
        <View style={[s.header, isDark && s.headerDark]}>
          <View style={s.headerLeft}>
            <View style={s.logoBox}><Ionicons name="leaf" size={20} color="#fff" /></View>
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
          {/* Tarjeta de usuario — hero con degradado */}
          <LinearGradient
            colors={isDark ? ['#064e3b', '#0f766e', '#115e59'] : ['#047857', '#059669', '#10b981']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[s.heroCard, isDark && s.heroCardDark]}
          >
            <View style={s.heroRow}>
              <TouchableOpacity style={s.avatarWrap} onPress={handlePickAvatar} activeOpacity={0.85}>
                {avatarUri && !avatarBroken ? (
                  <Image
                    source={{ uri: avatarUri }}
                    style={s.avatar}
                    onError={() => setAvatarBroken(true)}
                  />
                ) : (
                  <View style={s.avatar}>
                    <Ionicons name="person-outline" size={40} color="#fff" />
                  </View>
                )}
                <View style={s.avatarBadge}>
                  <Ionicons name="camera-outline" size={13} color="#047857" />
                </View>
              </TouchableOpacity>

              <View style={s.heroInfo}>
                <Text style={s.heroName} numberOfLines={1}>
                  {fullName || t('profile.defaultName')}
                </Text>
                <Text style={s.heroEmail} numberOfLines={1}>
                  {auth.email ?? t('profile.defaultEmail')}
                </Text>
                <View style={s.heroTags}>
                  <View style={s.heroTag}>
                    <Ionicons name="language-outline" size={11} color="#ffffff" />
                    <Text style={s.heroTagText}>{t(`profile.languages.${lang}`)}</Text>
                  </View>
                  <View style={s.heroTag}>
                    <Ionicons name={isDark ? 'moon' : 'sunny'} size={11} color="#ffffff" />
                    <Text style={s.heroTagText}>
                      {isDark ? t('profile.theme.dark') : t('profile.theme.light')}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            <TouchableOpacity style={s.photoBtn} onPress={handlePickAvatar}>
              <Ionicons name="camera-outline" size={15} color="#047857" />
              <Text style={s.photoBtnText}>{t('profile.changePhoto')}</Text>
            </TouchableOpacity>
          </LinearGradient>

          {/* Pestañas segmentadas */}
          <View style={[s.tabsRow, isDark && s.tabsRowDark]}>
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

                {hasPassword && (
                  <View style={s.block}>
                    <Text style={s.fieldLabel}>{t('profile.personal.fields.currentPassword')}</Text>
                    <View style={[s.inputWrap, isDark && s.inputWrapDark]}>
                      <TextInput
                        value={currentPassForProfile}
                        onChangeText={setCurrentPassForProfile}
                        placeholder="********"
                        placeholderTextColor="#9ca3af"
                        secureTextEntry={!showCurrentPassForProfile}
                        style={[s.inputInline, isDark && { color: '#e2e8f0' }]}
                      />
                      <TouchableOpacity onPress={() => setShowCurrentPassForProfile(v => !v)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                        <Ionicons name={showCurrentPassForProfile ? 'eye-off-outline' : 'eye-outline'} size={18} color={isDark ? '#94a3b8' : '#6b7280'} />
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

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
                    <TouchableOpacity
                      style={[s.exportBtn, isDark && s.exportBtnDark, exportingFormat !== null && { opacity: 0.6 }]}
                      disabled={exportingFormat !== null}
                      onPress={() => handleExportData('pdf')}
                    >
                      {exportingFormat === 'pdf' ? (
                        <ActivityIndicator size="small" color={isDark ? '#34D399' : '#059669'} />
                      ) : (
                        <Ionicons name="document-text-outline" size={16} color={isDark ? '#34D399' : '#059669'} />
                      )}
                      <Text style={[s.exportBtnText, isDark && { color: '#34D399' }]}>
                        {exportingFormat === 'pdf' ? 'Exportando...' : t('profile.account.exportOptions.pdf')}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[s.exportBtn, isDark && s.exportBtnDark, exportingFormat !== null && { opacity: 0.6 }]}
                      disabled={exportingFormat !== null}
                      onPress={() => handleExportData('excel')}
                    >
                      {exportingFormat === 'excel' ? (
                        <ActivityIndicator size="small" color={isDark ? '#34D399' : '#059669'} />
                      ) : (
                        <Ionicons name="grid-outline" size={16} color={isDark ? '#34D399' : '#059669'} />
                      )}
                      <Text style={[s.exportBtnText, isDark && { color: '#34D399' }]}>
                        {exportingFormat === 'excel' ? 'Exportando...' : t('profile.account.exportOptions.excel')}
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

              {hasPassword ? (
                <>
                  <View style={s.block}>
                    <Text style={s.fieldLabel}>{t('profile.security.currentPassword')}</Text>
                    <View style={[s.inputWrap, isDark && s.inputWrapDark]}>
                      <TextInput
                        value={currentPassword}
                        onChangeText={setCurrentPassword}
                        placeholder="********"
                        placeholderTextColor="#9ca3af"
                        secureTextEntry={!showCurrentPass}
                        style={[s.inputInline, isDark && { color: '#e2e8f0' }]}
                      />
                      <TouchableOpacity onPress={() => setShowCurrentPass(v => !v)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                        <Ionicons name={showCurrentPass ? 'eye-off-outline' : 'eye-outline'} size={18} color={isDark ? '#94a3b8' : '#6b7280'} />
                      </TouchableOpacity>
                    </View>
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
                </>
              ) : (
                <View style={{
                  padding: 16,
                  borderRadius: 16,
                  backgroundColor: isDark ? 'rgba(59, 130, 246, 0.1)' : '#eff6ff',
                  borderColor: isDark ? 'rgba(59, 130, 246, 0.25)' : '#bfdbfe',
                  borderWidth: 1,
                  marginTop: 14,
                  alignItems: 'center',
                }}>
                  <View style={{
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    backgroundColor: '#fff',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 10,
                    shadowColor: '#000',
                    shadowOpacity: 0.08,
                    shadowRadius: 4,
                    elevation: 2,
                  }}>
                    <Ionicons name="logo-google" size={24} color="#4285F4" />
                  </View>
                  <Text style={{
                    fontWeight: '800',
                    fontSize: 14,
                    color: isDark ? '#93c5fd' : '#1e40af',
                    marginBottom: 6,
                    textAlign: 'center',
                  }}>
                    Cuenta vinculada a Google
                  </Text>
                  <Text style={{
                    fontSize: 12,
                    lineHeight: 18,
                    color: isDark ? '#cbd5e1' : '#475569',
                    textAlign: 'center',
                  }}>
                    Iniciaste sesión mediante Google. Tu contraseña y autenticación son gestionadas de forma centralizada y segura por Google, por lo que no es posible ni necesario cambiarla en EcoRuteando.
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* ===================== PESTAÑA 3 · SOPORTE ===================== */}
          {activeTab === 'support' && (
            <>
              {/* 1. Centro de Ayuda — Preguntas Frecuentes */}
              <View style={[s.card, isDark && s.cardDark]}>
                <CardHeader
                  icon="bulb-outline"
                  color="#f59e0b"
                  title={'Centro de Ayuda y Preguntas Frecuentes'}
                  subtitle="Respuestas inmediatas a las consultas más comunes"
                  isDark={isDark}
                />
                {FAQ_ITEMS.map(faq => {
                  const isOpen = expandedFaq === faq.id;
                  return (
                    <TouchableOpacity
                      key={faq.id}
                      style={[s.faqItem, isDark && s.faqItemDark, isOpen && (isDark ? s.faqItemOpenDark : s.faqItemOpen)]}
                      onPress={() => setExpandedFaq(isOpen ? null : faq.id)}
                      activeOpacity={0.7}
                    >
                      <View style={s.faqHeader}>
                        <Text style={[s.faqQ, isDark && { color: '#e2e8f0' }, isOpen && { color: '#10b981' }]}>{faq.q}</Text>
                        <Ionicons
                          name={isOpen ? 'chevron-up' : 'chevron-down'}
                          size={16}
                          color={isOpen ? '#10b981' : isDark ? '#94a3b8' : '#6b7280'}
                        />
                      </View>
                      {isOpen && (
                        <Text style={[s.faqA, isDark && { color: '#cbd5e1' }]}>{faq.a}</Text>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* 2. Formulario de Soporte Técnico */}
              <View style={[s.card, isDark && s.cardDark]}>
                <CardHeader
                  icon="chatbubbles-outline"
                  color="#a855f7"
                  title={'Formulario de Soporte Técnico'}
                  subtitle="Completa los campos para registrar tu solicitud"
                  isDark={isDark}
                />

                <View style={s.block}>
                  <Text style={s.fieldLabel}>Asunto de la solicitud *</Text>
                  <TextInput
                    value={supportSubject}
                    onChangeText={setSupportSubject}
                    placeholder="Ej: Inconveniente calculando ruta en el centro..."
                    placeholderTextColor="#9ca3af"
                    style={[s.input, isDark && s.inputDark]}
                  />
                </View>

                <View style={s.block}>
                  <Text style={s.fieldLabel}>Tipo de problema *</Text>
                  <View style={s.chipRow}>
                    {PROBLEM_TYPES.map(pt => {
                      const active = supportProblemType === pt.id;
                      return (
                        <TouchableOpacity
                          key={pt.id}
                          style={[s.chip, isDark && s.chipDark, active && s.chipActive]}
                          onPress={() => setSupportProblemType(pt.id)}
                        >
                          <Text style={[s.chipText, isDark && s.chipTextDark, active && s.chipTextActive, { fontSize: 11 }]}>
                            {pt.id === 'routes' ? 'Rutas' : pt.id === 'profile' ? 'Cuenta' : pt.id === 'general' ? 'General' : pt.id === 'suggestion' ? 'Sugerencia' : 'Otro'}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                <View style={s.block}>
                  <Text style={s.fieldLabel}>Descripción de la solicitud *</Text>
                  <TextInput
                    value={supportMessage}
                    onChangeText={setSupportMessage}
                    placeholder="Describe con claridad los pasos que realizaste y lo que sucedió..."
                    placeholderTextColor="#9ca3af"
                    multiline
                    style={[s.textArea, isDark && s.textAreaDark]}
                  />
                </View>

                <TouchableOpacity
                  style={[s.primaryBtn, isDark && s.primaryBtnDark, submittingTicket && { opacity: 0.5 }]}
                  onPress={handleSendSupport}
                  disabled={submittingTicket}
                >
                  <Ionicons name="send-outline" size={17} color={isDark ? '#06281c' : '#fff'} />
                  <Text style={[s.primaryBtnText, isDark && s.primaryBtnTextDark]}>
                    {submittingTicket ? 'Enviando solicitud...' : t('profile.support.button')}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* 3. Mis Solicitudes Enviadas */}
              <View style={[s.card, isDark && s.cardDark]}>
                <View style={s.ticketsHeader}>
                  <CardHeader
                    icon="document-text-outline"
                    color="#06b6d4"
                    title={'Mis Solicitudes Enviadas'}
                    subtitle="Seguimiento del estado de tus solicitudes"
                    isDark={isDark}
                  />
                  <TouchableOpacity onPress={loadMyTickets} disabled={loadingTickets}>
                    <Text style={{ fontSize: 12, fontWeight: '700', color: '#10b981' }}>
                      {loadingTickets ? 'Actualizando...' : 'Refrescar'}
                    </Text>
                  </TouchableOpacity>
                </View>

                {loadingTickets ? (
                  <ActivityIndicator size="small" color="#10b981" style={{ marginVertical: 20 }} />
                ) : myTickets.length === 0 ? (
                  <View style={s.emptyBox}>
                    <Ionicons name="document-text-outline" size={32} color={isDark ? '#475569' : '#9ca3af'} />
                    <Text style={[s.emptyTitle, isDark && { color: '#cbd5e1' }]}>
                      No tienes solicitudes de soporte registradas
                    </Text>
                    <Text style={[s.emptySub, isDark && { color: '#64748b' }]}>
                      Las solicitudes que envíes aparecerán aquí con su estado
                    </Text>
                  </View>
                ) : (
                  myTickets.map((ticket, idx) => {
                    const ticketKey = String(ticket.id ?? idx);
                    const isExpanded = expandedTicketId === ticketKey;
                    const st = String(ticket.status || '').toLowerCase().replace('_', '');
                    const isResolved = st === 'resolved' || st === 'closed';
                    const isInProgress = st === 'inprogress';
                    const badgeBg = isResolved ? '#dcfce7' : isInProgress ? '#fef3c7' : '#fee2e2';
                    const badgeColor = isResolved ? '#166534' : isInProgress ? '#92400e' : '#991b1b';
                    const statusText = isResolved ? 'Resuelta / Respondida' : isInProgress ? 'En proceso' : 'Pendiente';

                    return (
                      <TouchableOpacity
                        key={ticketKey}
                        activeOpacity={0.8}
                        onPress={() => setExpandedTicketId(isExpanded ? null : ticketKey)}
                        style={[s.ticketItem, isDark && s.ticketItemDark]}
                      >
                        <View style={s.ticketRow}>
                          <Text style={[s.ticketSubject, isDark && { color: '#e2e8f0' }]} numberOfLines={1}>
                            {ticket.subject}
                          </Text>
                          <View style={[s.ticketBadge, { backgroundColor: badgeBg }]}>
                            <Text style={{ fontSize: 10, fontWeight: '700', color: badgeColor }}>
                              {statusText}
                            </Text>
                          </View>
                        </View>

                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
                          <Text style={[s.ticketDate, isDark && { color: '#64748b' }]}>
                            {ticket.createdAt ? new Date(ticket.createdAt).toLocaleDateString() : ''}
                          </Text>
                          <Ionicons
                            name={isExpanded ? 'chevron-up' : 'chevron-down'}
                            size={14}
                            color={isDark ? '#64748b' : '#9ca3af'}
                          />
                        </View>

                        {/* Detalle expandible con consulta y respuestas del soporte */}
                        {isExpanded && (
                          <View style={{ marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: isDark ? '#26383D' : '#e5e7eb' }}>
                            <Text style={{ fontSize: 11, fontWeight: '700', textTransform: 'uppercase', color: isDark ? '#94a3b8' : '#6b7280', marginBottom: 4 }}>
                              Tu consulta inicial:
                            </Text>
                            <Text style={{ fontSize: 12, color: isDark ? '#cbd5e1' : '#374151', lineHeight: 17, marginBottom: 10 }}>
                              {ticket.message || 'Sin mensaje adicional'}
                            </Text>

                            {/* Historial de respuestas */}
                            {Array.isArray(ticket.messages) && ticket.messages.length > 0 ? (
                              <View style={{ gap: 8, marginTop: 4 }}>
                                <Text style={{ fontSize: 11, fontWeight: '700', textTransform: 'uppercase', color: isDark ? '#34d399' : '#059669' }}>
                                  Respuestas recibidas:
                                </Text>
                                {ticket.messages.map((m: any, mIdx: number) => (
                                  <View
                                    key={mIdx}
                                    style={{
                                      padding: 10,
                                      borderRadius: 10,
                                      backgroundColor: m.isAdmin
                                        ? isDark ? 'rgba(6, 78, 59, 0.4)' : '#ecfdf5'
                                        : isDark ? 'rgba(30, 41, 59, 0.5)' : '#f3f4f6',
                                      borderWidth: 1,
                                      borderColor: m.isAdmin
                                        ? isDark ? '#065f46' : '#a7f3d0'
                                        : isDark ? '#334155' : '#e5e7eb',
                                    }}
                                  >
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 }}>
                                      <Text style={{ fontSize: 11, fontWeight: '700', color: m.isAdmin ? '#10b981' : isDark ? '#cbd5e1' : '#4b5563' }}>
                                        {m.isAdmin ? '🛡️ Soporte EcoRuteando' : '👤 Tú'}
                                      </Text>
                                      <Text style={{ fontSize: 10, color: isDark ? '#64748b' : '#9ca3af' }}>
                                        {m.createdAt ? new Date(m.createdAt).toLocaleDateString() : ''}
                                      </Text>
                                    </View>
                                    <Text style={{ fontSize: 12, color: isDark ? '#e2e8f0' : '#1f2937', lineHeight: 16 }}>
                                      {m.message}
                                    </Text>
                                  </View>
                                ))}
                              </View>
                            ) : (
                              <Text style={{ fontSize: 11, fontStyle: 'italic', color: isDark ? '#64748b' : '#9ca3af', marginTop: 4 }}>
                                Esperando respuesta oficial del equipo de soporte. Te notificaremos a tu correo registrado cuando haya novedades.
                              </Text>
                            )}
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })
                )}
              </View>
            </>
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

  // ---------- tarjeta de usuario (degradado) ----------
  heroCard: {
    borderRadius: 24, padding: 20,
    shadowColor: '#047857', shadowOpacity: 0.28, shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 }, elevation: 6,
  },
  heroCardDark: { shadowColor: '#0f766e' },
  heroRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  avatarWrap: { width: 84, height: 84 },
  avatar: {
    width: 84, height: 84, borderRadius: 26, backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 3, borderColor: 'rgba(255,255,255,0.85)',
  },
  avatarBadge: {
    position: 'absolute', right: -4, bottom: -4, width: 28, height: 28,
    borderRadius: 14, backgroundColor: '#fff', borderWidth: 2, borderColor: '#059669',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 }, elevation: 3,
  },
  heroInfo: { flex: 1 },
  heroName: { fontSize: 21, fontWeight: '800', color: '#ffffff' },
  heroEmail: { fontSize: 12, color: 'rgba(255,255,255,0.85)', marginTop: 2 },
  heroTags: { flexDirection: 'row', gap: 8, marginTop: 10, flexWrap: 'wrap' },
  heroTag: {
    flexDirection: 'row', gap: 4, alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 10, paddingHorizontal: 8, paddingVertical: 4,
  },
  heroTagDark: { backgroundColor: 'rgba(255,255,255,0.12)' },
  heroTagText: { fontSize: 10, fontWeight: '700', color: '#ffffff' },
  heroTagTextDark: { color: '#ffffff' },
  photoBtn: {
    flexDirection: 'row', gap: 6, alignItems: 'center', justifyContent: 'center',
    marginTop: 16, paddingVertical: 11, borderRadius: 14,
    backgroundColor: '#ffffff',
    shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 }, elevation: 2,
  },
  photoBtnDark: { backgroundColor: 'rgba(255,255,255,0.92)' },
  photoBtnText: { fontSize: 13, fontWeight: '800', color: '#047857' },

  // ---------- pestañas ----------
  tabsRow: {
    flexDirection: 'row', gap: 8, marginTop: 16, marginBottom: 4,
    backgroundColor: '#fff', borderRadius: 16, padding: 4,
    borderWidth: 1, borderColor: '#f3f4f6',
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 }, elevation: 1,
  },
  tabsRowDark: { backgroundColor: '#162329', borderColor: '#26383D' },
  tab: {
    flex: 1, flexDirection: 'row', gap: 6, alignItems: 'center', justifyContent: 'center',
    paddingVertical: 10, paddingHorizontal: 6, borderRadius: 12,
    backgroundColor: 'transparent', borderWidth: 1, borderColor: 'transparent',
  },
  tabDark: { backgroundColor: 'transparent', borderColor: 'transparent' },
  tabActive: {
    backgroundColor: '#059669', borderColor: '#059669',
    shadowColor: '#059669', shadowOpacity: 0.35, shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 }, elevation: 3,
  },
  tabText: { fontSize: 11, fontWeight: '700', color: '#4b5563' },
  tabTextDark: { color: '#94a3b8' },
  tabTextActive: { color: '#fff' },

  // ---------- tarjetas ----------
  card: {
    backgroundColor: '#fff', borderRadius: 20, padding: 18, marginTop: 12,
    borderWidth: 1, borderColor: '#f3f4f6',
    shadowColor: '#0f172a', shadowOpacity: 0.06, shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 }, elevation: 2,
  },
  cardDark: { backgroundColor: '#1f2937', borderColor: '#374151' },
  cardHead: { flexDirection: 'row', gap: 12, alignItems: 'flex-start', marginBottom: 16 },
  cardHeadText: { flex: 1 },
  cardIcon: {
    width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  cardTitle: { fontSize: 16, fontWeight: '800', color: '#1f2937' },
  cardSubtitle: { fontSize: 12, color: '#6b7280', marginTop: 4, lineHeight: 18 },

  // ---------- campos ----------
  fieldRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  fieldCol: { flex: 1 },
  block: { marginTop: 4, marginBottom: 12 },
  fieldLabel: {
    fontSize: 11, fontWeight: '800', color: '#6b7280',
    marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.4,
  },
  input: {
    backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12,
    paddingHorizontal: 12, paddingVertical: 11, fontSize: 14, color: '#111827',
  },
  inputDark: { backgroundColor: 'rgba(11,18,21,0.45)', borderColor: '#26383D', color: '#e2e8f0' },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#e5e7eb',
    borderRadius: 12, paddingHorizontal: 12,
  },
  inputWrapDark: { backgroundColor: 'rgba(11,18,21,0.45)', borderColor: '#26383D' },
  inputInline: { flex: 1, paddingVertical: 11, fontSize: 14, color: '#111827' },
  textArea: {
    backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12,
    paddingHorizontal: 12, paddingVertical: 11, fontSize: 14, color: '#111827',
    minHeight: 96, textAlignVertical: 'top',
  },
  textAreaDark: { backgroundColor: 'rgba(11,18,21,0.45)', borderColor: '#26383D', color: '#e2e8f0' },
  readonlyBox: {
    flexDirection: 'row', gap: 8, alignItems: 'center',
    backgroundColor: '#f0fdf4', borderWidth: 1, borderColor: '#dcfce7',
    borderRadius: 12, paddingHorizontal: 12, paddingVertical: 12,
  },
  readonlyBoxDark: { backgroundColor: 'rgba(11,18,21,0.45)', borderColor: '#26383D' },
  readonlyText: { fontSize: 13, color: '#374151', flex: 1, fontWeight: '600' },

  // ---------- chips ----------
  chipRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  chip: {
    flexDirection: 'row', gap: 5, alignItems: 'center',
    paddingHorizontal: 13, paddingVertical: 9, borderRadius: 999,
    backgroundColor: '#f3f4f6', borderWidth: 1, borderColor: '#e5e7eb',
  },
  chipDark: { backgroundColor: 'rgba(11,18,21,0.4)', borderColor: '#26383D' },
  chipActive: {
    backgroundColor: '#059669', borderColor: '#059669',
    shadowColor: '#059669', shadowOpacity: 0.3, shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 }, elevation: 2,
  },
  chipText: { fontSize: 12, fontWeight: '700', color: '#4b5563' },
  chipTextDark: { color: '#94a3b8' },
  chipTextActive: { color: '#fff' },

  // ---------- botones ----------
  primaryBtn: {
    flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#059669', borderRadius: 14, paddingVertical: 13, marginTop: 8,
    shadowColor: '#059669', shadowOpacity: 0.3, shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 }, elevation: 4,
  },
  primaryBtnDark: { backgroundColor: '#34D399' },
  primaryBtnText: { fontSize: 14, fontWeight: '800', color: '#fff' },
  primaryBtnTextDark: { color: '#06281c' },
  exportBlock: { marginTop: 16 },
  exportBtnRow: { flexDirection: 'row', gap: 8 },
  exportBtn: {
    flex: 1, flexDirection: 'row', gap: 6, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 14, paddingVertical: 11, borderRadius: 12,
    backgroundColor: '#f0fdf4', borderWidth: 1, borderColor: '#dcfce7',
  },
  exportBtnDark: { backgroundColor: 'rgba(11,18,21,0.4)', borderColor: '#26383D' },
  exportBtnText: { fontSize: 12, fontWeight: '800', color: '#059669' },

  // ---------- avisos ----------
  hintRow: { flexDirection: 'row', gap: 6, alignItems: 'flex-start', marginTop: 12 },
  hintText: { fontSize: 11, color: '#6b7280', flex: 1, lineHeight: 16 },

  // ---------- zona de riesgo ----------
  dangerCard: {
    backgroundColor: '#fef2f2', borderRadius: 16, padding: 16, marginTop: 12,
    borderWidth: 1, borderColor: '#fee2e2',
  },
  dangerCardDark: { backgroundColor: 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.28)' },

  // FAQ
  faqItem: { backgroundColor: '#f9fafb', borderRadius: 14, borderWidth: 1, borderColor: '#e5e7eb', overflow: 'hidden', marginBottom: 8 },
  faqItemDark: { backgroundColor: 'rgba(17,28,32,0.6)', borderColor: '#26383D' },
  faqItemOpen: { backgroundColor: 'rgba(16,185,129,0.05)', borderColor: '#a7f3d0' },
  faqItemOpenDark: { backgroundColor: '#111C20', borderColor: 'rgba(16,185,129,0.35)' },
  faqHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14 },
  faqQ: { fontSize: 13, fontWeight: '700', color: '#1f2937', flex: 1, marginRight: 8 },
  faqA: { fontSize: 12, lineHeight: 19, color: '#4b5563', paddingHorizontal: 14, paddingBottom: 14, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.06)', paddingTop: 10 },

  // Tickets
  ticketsHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  ticketItem: { backgroundColor: '#f9fafb', borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb', padding: 12, marginBottom: 8 },
  ticketItemDark: { backgroundColor: 'rgba(17,28,32,0.5)', borderColor: '#26383D' },
  ticketRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  ticketSubject: { fontSize: 13, fontWeight: '600', color: '#1f2937', flex: 1 },
  ticketBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  ticketDate: { fontSize: 11, color: '#9ca3af', marginTop: 4 },

  // Empty state
  emptyBox: { alignItems: 'center', paddingVertical: 28, gap: 6 },
  emptyTitle: { fontSize: 13, fontWeight: '700', color: '#374151' },
  emptySub: { fontSize: 11, color: '#9ca3af', textAlign: 'center', paddingHorizontal: 20 },
  dangerBtn: {
    flexDirection: 'row', gap: 6, alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#ef4444', borderRadius: 12, paddingVertical: 11, marginTop: 4,
  },
  dangerBtnText: { fontSize: 13, fontWeight: '700', color: '#fff' },

  // ---------- footer ----------
  footer: { flexDirection: 'row', gap: 6, alignItems: 'center', justifyContent: 'center', marginTop: 24 },
  footerText: { fontSize: 12, color: '#6b7280' },
});
