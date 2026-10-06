// app/(tabs)/report.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  Image,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { spacing, colors } from '../../src/shared/theme';
import { useAuth } from '../../src/shared/store/AuthContext';
import { useLanguage } from '../../src/shared/store/LanguageContext';
import apiClient from '../../src/shared/services/apiClient';


export default function ReportScreen() {
  const router = useRouter();
  const { auth } = useAuth();
const { t } = useLanguage();
const OBSTACLE_TYPES = [
  {
    key: 'hole',
    label: t('report.obstacles.hole'),
    icon: 'alert-circle-outline',
  },
  {
    key: 'blocked',
    label: t('report.obstacles.blocked'),
    icon: 'ban-outline',
  },
  {
    key: 'flood',
    label: t('report.obstacles.flood'),
    icon: 'water-outline',
  },
  {
    key: 'works',
    label: t('report.obstacles.works'),
    icon: 'construct-outline',
  },
  {
    key: 'traffic',
    label: t('report.obstacles.traffic'),
    icon: 'car-outline',
  },
  {
    key: 'lighting',
    label: t('report.obstacles.lighting'),
    icon: 'moon-outline',
  },
  {
    key: 'other',
    label: t('report.obstacles.other'),
    icon: 'chatbubble-ellipses-outline',
  },
];

  const userEmail = auth.email ?? 'usuario@ecoruteando.com';

  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [showTypeList, setShowTypeList] = useState(false);
  const [location, setLocation] = useState('');
  const [details, setDetails] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);

  const insets = useSafeAreaInsets();

  const handlePickPhoto = async () => {
    setPhotoUri('https://via.placeholder.com/300x180.png?text=Foto+del+obstaculo');
  };

  const handleSend = async () => {
    if (!selectedType || !location.trim()) return;

    const typeObj = OBSTACLE_TYPES.find(item => item.key === selectedType);
    if (!typeObj) return;

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permiso denegado',
          'Se necesita tu ubicación GPS para enviar el reporte.'
        );
        return;
      }

      const pos = await Location.getCurrentPositionAsync({});

      await apiClient.post('/api/obstacle-reports', {
        reportType: typeObj.label,
        description: details.trim() || location.trim(),
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        addressText: location.trim(),
      });

      Alert.alert('Reporte enviado', 'Gracias. El reporte ya está en el mapa con confianza inicial.');
    } catch (e: any) {
      Alert.alert('No se pudo enviar', e?.message ?? 'Error inesperado');
      return;
    }

    setLocation('');
    setDetails('');
    setSelectedType(null);
    setPhotoUri(null);
    setShowTypeList(false);
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)');
    }
  };
const selectedTypeObj = OBSTACLE_TYPES.find(t => t.key === selectedType);

return (
  <LinearGradient
    colors={['#1a3d2b', '#2c5f3f', '#4a8f65']}
    style={s.bg}
    start={{ x: 0.1, y: 0 }}
    end={{ x: 0.9, y: 1 }}
  >
    <SafeAreaView
      style={[
        s.safeArea,
        {
          paddingTop: insets.top,
        },
      ]}
    >
      <View style={s.circle1} />
      <View style={s.circle2} />
      <View style={s.circle3} />

      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={s.wrapper}>
          <View style={s.card}>
            {/* Header */}
            <View style={s.headerRow}>
              <TouchableOpacity
                style={s.backBtn}
                onPress={() => router.back()}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons
                  name="arrow-back"
                  size={18}
                  color={colors.ecoMain}
                />
                <Text style={s.backText}>
                  {t('common.back')}
                </Text>
              </TouchableOpacity>

              <View style={s.headerTextBlock}>
                <Text style={s.title}>
                  {t('report.title')}
                </Text>

                <Text style={s.subtitle}>
                  {userEmail}
                </Text>
              </View>
            </View>

            <Text style={s.helperText}>
              {t('report.helperText')}
            </Text>

            {/* Select de tipo de obstáculo */}
            <Text style={s.sectionTitle}>
              {t('report.obstacleType')}
            </Text>

            <TouchableOpacity
              style={s.selectTrigger}
              onPress={() => setShowTypeList(prev => !prev)}
            >
              <View style={s.selectLeft}>
                {selectedTypeObj ? (
                  <>
                    <Ionicons
                      name={selectedTypeObj.icon as any}
                      size={18}
                      color="#047857"
                    />

                    <Text style={s.selectText}>
                      {selectedTypeObj.label}
                    </Text>
                  </>
                ) : (
                  <Text style={s.selectPlaceholder}>
                    {t('report.selectObstacle')}
                  </Text>
                )}
              </View>

              <Ionicons
                name={
                  showTypeList
                    ? 'chevron-up-outline'
                    : 'chevron-down-outline'
                }
                size={16}
                color="#4b5563"
              />
            </TouchableOpacity>

            {showTypeList && (
              <View style={s.selectList}>
                {OBSTACLE_TYPES.map(item => (
                  <TouchableOpacity
                    key={item.key}
                    style={[
                      s.selectItem,
                      selectedType === item.key &&
                        s.selectItemSelected,
                    ]}
                    onPress={() => {
                      setSelectedType(item.key);
                      setShowTypeList(false);
                    }}
                  >
                    <View style={s.selectItemLeft}>
                      <Ionicons
                        name={item.icon as any}
                        size={18}
                        color={
                          selectedType === item.key
                            ? '#ffffff'
                            : '#047857'
                        }
                      />

                      <Text
                        style={[
                          s.selectItemText,
                          selectedType === item.key &&
                            s.selectItemTextSelected,
                        ]}
                      >
                        {item.label}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Ubicación */}
            <Text style={s.sectionTitle}>
              {t('report.locationTitle')}
            </Text>

            <TextInput
              placeholder={t('report.locationPlaceholder')}
              placeholderTextColor="rgba(148,163,184,0.9)"
              value={location}
              onChangeText={setLocation}
              style={s.input}
            />

            {/* Foto */}
            <Text style={s.sectionTitle}>
              {t('report.photoTitle')}
            </Text>

            <Text style={s.photoHelp}>
              {t('report.photoHelp')}
            </Text>

            <View style={s.photoRow}>
              <TouchableOpacity
                style={s.photoBtn}
                onPress={handlePickPhoto}
              >
                <Ionicons
                  name={
                    photoUri
                      ? 'images-outline'
                      : 'camera-outline'
                  }
                  size={18}
                  color="#047857"
                />

                <Text style={s.photoBtnText}>
                  {photoUri
                    ? t('report.changePhoto')
                    : t('report.takePhoto')}
                </Text>
              </TouchableOpacity>

              {photoUri && (
                <View style={s.photoPreviewWrapper}>
                  <Image
                    source={{ uri: photoUri }}
                    style={s.photoPreview}
                    resizeMode="cover"
                  />
                </View>
              )}
            </View>

            {/* Detalles */}
            <Text style={s.sectionTitle}>
              {t('report.detailsTitle')}
            </Text>

            <TextInput
              placeholder={t('report.detailsPlaceholder')}
              placeholderTextColor="rgba(148,163,184,0.9)"
              value={details}
              onChangeText={setDetails}
              multiline
              numberOfLines={4}
              style={[s.input, s.textarea]}
            />

            {/* Enviar */}
            <TouchableOpacity
              style={[
                s.sendBtn,
                (!selectedType || !location.trim()) &&
                  s.sendBtnDisabled,
              ]}
              onPress={handleSend}
              disabled={!selectedType || !location.trim()}
            >
              <Text style={s.sendBtnText}>
                {t('report.send')}
              </Text>

              <Ionicons
                name="send-outline"
                size={16}
                color="#ffffff"
              />
            </TouchableOpacity>

            <Text style={s.footerNote}>
              {t('report.footerNote')}
            </Text>
          </View>
        </View>
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
  circle1: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(94,168,122,0.18)',
    top: -80,
    right: -60,
  },
  circle2: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(44,95,63,0.25)',
    bottom: -60,
    left: -60,
  },
  circle3: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(168,217,188,0.18)',
    top: 220,
    left: 10,
  },
  scroll: {
    flexGrow: 1,
    paddingTop: spacing.sm,      // menos padding arriba
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.md,
  },
  wrapper: {
    width: '100%',
    maxWidth: 900,
    alignSelf: 'center',
  },
  card: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.97)',
    borderRadius: 24,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)',
  },

  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    justifyContent: 'space-between',
    gap: spacing.md,
    marginTop: -4, // lo sube un poquito para que no se vea tan abajo
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  backText: {
    fontFamily: 'Times New Roman',
    fontSize: 13,
    color: colors.ecoMain,
  },
  headerTextBlock: {
    flex: 1,
  },
  title: {
    fontFamily: 'Times New Roman',
    fontSize: 22,
    color: colors.ecoDark,
    textAlign: 'right',
  },
  subtitle: {
    fontFamily: 'Times New Roman',
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'right',
  },
  helperText: {
    fontFamily: 'Times New Roman',
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: spacing.md,
  },

  sectionTitle: {
    fontFamily: 'Times New Roman',
    fontSize: 13,
    color: colors.ecoDark,
    marginTop: spacing.sm,
    marginBottom: 4,
  },

  selectTrigger: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(209,213,219,0.9)',
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    backgroundColor: 'rgba(249,250,251,0.98)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  selectLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  selectPlaceholder: {
    fontFamily: 'Times New Roman',
    fontSize: 13,
    color: 'rgba(148,163,184,0.9)',
  },
  selectText: {
    fontFamily: 'Times New Roman',
    fontSize: 13,
    color: '#111827',
  },
  selectList: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(209,213,219,0.9)',
    backgroundColor: '#f9fafb',
    marginBottom: spacing.sm,
    overflow: 'hidden',
  },
  selectItem: {
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
  },
  selectItemSelected: {
    backgroundColor: '#047857',
  },
  selectItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  selectItemText: {
    fontFamily: 'Times New Roman',
    fontSize: 13,
    color: '#111827',
  },
  selectItemTextSelected: {
    color: '#ffffff',
  },

  input: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(209,213,219,0.9)',
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    fontFamily: 'Times New Roman',
    fontSize: 13,
    color: '#111827',
    backgroundColor: 'rgba(249,250,251,0.98)',
  },
  textarea: {
    minHeight: 90,
    textAlignVertical: 'top',
  },

  photoHelp: {
    fontFamily: 'Times New Roman',
    fontSize: 11,
    color: colors.textMuted,
    marginBottom: 4,
  },
  photoRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  photoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#a7f3d0',
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  photoBtnText: {
    fontFamily: 'Times New Roman',
    fontSize: 12,
    color: '#047857',
  },
  photoPreviewWrapper: {
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(209,213,219,0.9)',
    backgroundColor: '#020617',
  },
  photoPreview: {
    width: 150,
    height: 90,
  },

  sendBtn: {
    marginTop: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 999,
    backgroundColor: colors.ecoMain,
    paddingVertical: 8,
  },
  sendBtnDisabled: {
    backgroundColor: 'rgba(16,185,129,0.4)',
  },
  sendBtnText: {
    fontFamily: 'Times New Roman',
    fontSize: 13,
    color: '#ffffff',
  },
  footerNote: {
    marginTop: spacing.sm,
    fontFamily: 'Times New Roman',
    fontSize: 11,
    color: colors.textMuted,
  },
});