import { Dialog } from '../../shared/components/ui/AppDialog';
import React, { useEffect, useState } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Platform, ToastAndroid, Image,  } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import { useLanguage } from '../../shared/store/LanguageContext';
import apiClient from '../../shared/services/apiClient';

interface Props {
  onClose: () => void;
  onSubmitted: () => void;
}

/**
 * HU-22 / CU22 + HU-16 / CU07: reporte de obstáculos estilo Google Maps.
 * Hoja flotante sobre el mapa (sin salir de la ruta): tipo, ubicación y foto.
 */
export function ReportFormSheet({ onClose, onSubmitted }: Props) {
  const { t } = useLanguage();
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [location, setLocation] = useState('');
  const [details, setDetails] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const OBSTACLE_TYPES = [
    { key: 'hole', label: t('report.obstacles.hole'), icon: 'alert-circle-outline' },
    { key: 'blocked', label: t('report.obstacles.blocked'), icon: 'ban-outline' },
    { key: 'flood', label: t('report.obstacles.flood'), icon: 'water-outline' },
    { key: 'works', label: t('report.obstacles.works'), icon: 'construct-outline' },
    { key: 'traffic', label: t('report.obstacles.traffic'), icon: 'car-outline' },
    { key: 'lighting', label: t('report.obstacles.lighting'), icon: 'moon-outline' },
    { key: 'other', label: t('report.obstacles.other'), icon: 'chatbubble-ellipses-outline' },
  ];

  // Prefill de la ubicación con reverse geocoding (como Google Maps).
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setLocation(t('planRoute.myLocation'));
          return;
        }
        const pos = await Location.getCurrentPositionAsync({});
        const [place] = await Location.reverseGeocodeAsync({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        });
        if (place) {
          const parts = [
            place.street,
            place.district,
            place.city,
          ].filter(Boolean);
          setLocation(parts.length ? parts.join(', ') : t('planRoute.myLocation'));
        } else {
          setLocation(t('planRoute.myLocation'));
        }
      } catch {
        setLocation(t('planRoute.myLocation'));
      }
    })();
  }, []);

  const handlePickPhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Dialog.alert(
          t('report.cameraPermTitle'),
          t('report.cameraPermMsg')
        , { tone: 'warning', icon: 'camera' });
        return;
      }
      const res = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        quality: 0.4,
        allowsEditing: true,
        aspect: [4, 3],
      });
      if (!res.canceled && res.assets?.length) {
        setPhotoUri(res.assets[0].uri);
      }
    } catch (e) {
      console.warn('[REPORT] cámara error:', e);
      Dialog.alert(t('common.errorTitle'), t('report.cameraError'), { tone: 'error' });
    }
  };

  const handlePickGallery = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Dialog.alert(
          t('report.galleryPermTitle'),
          t('report.galleryPermMsg')
        , { tone: 'warning', icon: 'images' });
        return;
      }
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.4,
        allowsEditing: true,
        aspect: [4, 3],
      });
      if (!res.canceled && res.assets?.length) {
        setPhotoUri(res.assets[0].uri);
      }
    } catch (e) {
      console.warn('[REPORT] galería error:', e);
      Dialog.alert(t('common.errorTitle'), t('report.galleryError'), { tone: 'error' });
    }
  };

  const handleSend = async () => {
    if (sending) return;
    if (!selectedType) {
      Dialog.alert(t('report.chooseTypeTitle'), t('report.chooseTypeMsg'), {
      tone: 'warning',
    });
      return;
    }
    const typeObj = OBSTACLE_TYPES.find(item => item.key === selectedType);
    if (!typeObj) return;

    setSending(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Dialog.alert(t('planRoute.permissionDeniedTitle'), t('report.gpsMsg'), { tone: 'warning', icon: 'location' });
        return;
      }
      const pos = await Location.getCurrentPositionAsync({});

      await apiClient.post('/api/obstacle-reports', {
        reportType: typeObj.label,
        description: details.trim() || typeObj.label,
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        addressText: (location.trim() || t('planRoute.myLocation')).slice(0, 300),
        photoUrl: photoUri,
      });

      if (Platform.OS === 'android') {
        ToastAndroid.show(t('report.sentToast'), ToastAndroid.SHORT);
      } else {
        Dialog.alert(t('report.sentTitle'), t('report.sentMsg'));
      }
      onSubmitted();
    } catch (e: any) {
      Dialog.alert(t('report.sendFailedTitle'), e?.message ?? t('planRoute.unexpectedError'), { tone: 'error' });
    } finally {
      setSending(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('report.formTitle')}</Text>
        <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="close" size={22} color="#5f6368" />
        </TouchableOpacity>
      </View>
      <Text style={styles.subtitle}>{t('report.formSubtitle')}</Text>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Tipos de reporte */}
        <View style={styles.grid}>
          {OBSTACLE_TYPES.map(item => {
            const active = selectedType === item.key;
            return (
              <TouchableOpacity
                key={item.key}
                style={[styles.typeCard, active && styles.typeCardActive]}
                onPress={() => setSelectedType(item.key)}
                activeOpacity={0.75}
              >
                <Ionicons
                  name={item.icon as any}
                  size={20}
                  color={active ? '#16a34a' : '#5f6368'}
                />
                <Text style={[styles.typeLabel, active && styles.typeLabelActive]} numberOfLines={2}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Ubicación */}
        <View style={styles.fieldRow}>
          <Ionicons name="location-outline" size={18} color="#16a34a" />
          <TextInput
            style={styles.fieldInput}
            value={location}
            onChangeText={setLocation}
            placeholder={t('report.locationTitle')}
            placeholderTextColor="#9aa0a6"
            returnKeyType="done"
          />
        </View>

        {/* Foto: cámara / galería estilo Google Maps */}
        {photoUri ? (
          <View style={styles.photoRow}>
            <Image source={{ uri: photoUri }} style={styles.photoThumb} />
            <Text style={[styles.photoText, { flex: 1 }]}>{t('report.photoAttached')}</Text>
            <TouchableOpacity
              onPress={() => setPhotoUri(null)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="close-circle" size={20} color="#9aa0a6" />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.photoRow}>
            <Ionicons name="camera-outline" size={18} color="#16a34a" />
            <TouchableOpacity style={styles.photoBtn} onPress={handlePickPhoto} activeOpacity={0.7}>
              <Text style={styles.photoText}>{t('report.cameraBtn')}</Text>
            </TouchableOpacity>
            <View style={styles.photoDivider} />
            <TouchableOpacity style={styles.photoBtn} onPress={handlePickGallery} activeOpacity={0.7}>
              <Text style={styles.photoText}>{t('report.galleryBtn')}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Detalles */}
        <TextInput
          style={styles.detailsInput}
          value={details}
          onChangeText={setDetails}
          placeholder={t('report.detailsPlaceholderOpt')}
          placeholderTextColor="#9aa0a6"
          multiline
          maxLength={500}
        />
      </ScrollView>

      <TouchableOpacity
        style={[styles.sendBtn, sending && { opacity: 0.6 }]}
        onPress={handleSend}
        disabled={sending}
        activeOpacity={0.85}
      >
        <Text style={styles.sendBtnText}>{sending ? t('report.sending') : t('report.send')}</Text>
        <Ionicons name="send" size={18} color="#ffffff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingTop: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#202124',
  },
  subtitle: {
    fontSize: 13,
    color: '#5f6368',
    marginTop: 2,
    marginBottom: 10,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeCard: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e8eaed',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 10,
  },
  typeCardActive: {
    backgroundColor: '#e6f4ea',
    borderColor: '#16a34a',
  },
  typeLabel: {
    flex: 1,
    fontSize: 13,
    color: '#3c4043',
    fontWeight: '500',
  },
  typeLabelActive: {
    color: '#16a34a',
    fontWeight: '700',
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e8eaed',
    paddingHorizontal: 12,
    marginTop: 14,
    height: 46,
  },
  fieldInput: {
    flex: 1,
    fontSize: 14,
    color: '#202124',
    paddingVertical: 0,
  },
  photoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e8eaed',
    paddingHorizontal: 12,
    marginTop: 10,
    height: 46,
  },
  photoText: {
    fontSize: 14,
    color: '#3c4043',
  },
  photoBtn: {
    flex: 1,
    paddingVertical: 4,
  },
  photoDivider: {
    width: 1,
    height: 22,
    backgroundColor: '#e8eaed',
    marginHorizontal: 8,
  },
  photoThumb: {
    width: 44,
    height: 34,
    borderRadius: 6,
    backgroundColor: '#e8eaed',
  },
  detailsInput: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e8eaed',
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 10,
    marginTop: 10,
    fontSize: 14,
    color: '#202124',
    minHeight: 72,
    textAlignVertical: 'top',
  },
  sendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#16a34a',
    borderRadius: 28,
    height: 52,
    marginTop: 6,
    marginBottom: 8,
  },
  sendBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
});
