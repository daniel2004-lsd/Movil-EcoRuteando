import { Dialog } from '../../shared/components/ui/AppDialog';
import React, { useEffect, useRef, useState } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Platform, ToastAndroid, Image,  } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import { File as ExpoFile } from 'expo-file-system';
import { useLanguage } from '../../shared/store/LanguageContext';
import apiClient from '../../shared/services/apiClient';
import {
  REPORT_PHOTO_COMPRESSION_QUALITY,
  MAX_REPORT_PHOTO_BYTES,
  buildPhotoUploadRequestConfig,
  resolveReportPhotoUploadMeta,
  validateReportPhotoSize,
  validateUploadedPhotoResponse,
  type PhotoUploadMetadata,
} from '../../shared/utils/reportPhotoValidation';

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
  const [photoMeta, setPhotoMeta] = useState<PhotoUploadMetadata | null>(null);
  const [sending, setSending] = useState(false);
  const sendingLockRef = useRef(false);
  // Caché de URL subida exitosamente para evitar recargar la misma fotografía si falla POST /api/obstacle-reports
  const uploadedPhotoCacheRef = useRef<{ sourceUri: string; serverUrl: string } | null>(null);

  const inspectLocalFileStats = (
    uri: string
  ): { exists: boolean | undefined; size: number | null; mimeType: string | null } => {
    try {
      const fileObj = new ExpoFile(uri);
      const isFileScheme = uri.startsWith('file://');
      const exists = typeof fileObj.exists === 'boolean' ? fileObj.exists : undefined;
      if (isFileScheme && exists === false) {
        return { exists: false, size: 0, mimeType: null };
      }
      const size =
        typeof fileObj.size === 'number' && Number.isFinite(fileObj.size)
          ? isFileScheme || fileObj.size > 0
            ? fileObj.size
            : null
          : null;
      const mimeType =
        typeof fileObj.type === 'string' && fileObj.type.trim() ? fileObj.type.trim() : null;
      return { exists, size, mimeType };
    } catch {
      return { exists: undefined, size: null, mimeType: null };
    }
  };

  const applyPickedAsset = (asset: ImagePicker.ImagePickerAsset) => {
    const fallbackStats = inspectLocalFileStats(asset.uri);
    const resolvedSize =
      typeof asset.fileSize === 'number' && Number.isFinite(asset.fileSize)
        ? asset.fileSize
        : fallbackStats.size;
    const resolvedMime = asset.mimeType || fallbackStats.mimeType;

    const sizeValidation = validateReportPhotoSize(resolvedSize, { exists: fallbackStats.exists });
    if (!sizeValidation.isValid) {
      Dialog.alert(
        t('common.errorTitle') || 'Imagen no válida',
        sizeValidation.error || 'El tamaño de la imagen no puede exceder 5 MB.',
        { tone: 'warning' }
      );
      return;
    }

    const metaValidation = resolveReportPhotoUploadMeta({
      uri: asset.uri,
      fileName: asset.fileName,
      mimeType: resolvedMime,
      fileSize: resolvedSize,
      exists: fallbackStats.exists,
    });

    if (!metaValidation.isValid || !metaValidation.metadata) {
      Dialog.alert(
        t('common.errorTitle') || 'Imagen no válida',
        metaValidation.error || 'Formato o tamaño de imagen no permitido (máx. 5 MB, JPG/PNG/WEBP).',
        { tone: 'warning' }
      );
      return;
    }

    uploadedPhotoCacheRef.current = null;
    setPhotoUri(metaValidation.metadata.uri);
    setPhotoMeta(metaValidation.metadata);
  };

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
    if (sending || sendingLockRef.current) return;
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
        quality: REPORT_PHOTO_COMPRESSION_QUALITY,
        allowsEditing: true,
        aspect: [4, 3],
      });
      if (!res.canceled && res.assets?.length) {
        applyPickedAsset(res.assets[0]);
      }
    } catch (e) {
      console.warn('[REPORT] cámara error:', e);
      Dialog.alert(t('common.errorTitle'), t('report.cameraError'), { tone: 'error' });
    }
  };

  const handlePickGallery = async () => {
    if (sending || sendingLockRef.current) return;
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
        quality: REPORT_PHOTO_COMPRESSION_QUALITY,
        allowsEditing: true,
        aspect: [4, 3],
      });
      if (!res.canceled && res.assets?.length) {
        applyPickedAsset(res.assets[0]);
      }
    } catch (e) {
      console.warn('[REPORT] galería error:', e);
      Dialog.alert(t('common.errorTitle'), t('report.galleryError'), { tone: 'error' });
    }
  };

  const handleSend = async () => {
    // Protección síncrona contra doble pulsación en todo el ciclo (subida de foto + creación de reporte)
    if (sending || sendingLockRef.current) return;
    if (!selectedType) {
      Dialog.alert(t('report.chooseTypeTitle'), t('report.chooseTypeMsg'), {
      tone: 'warning',
    });
      return;
    }
    const typeObj = OBSTACLE_TYPES.find(item => item.key === selectedType);
    if (!typeObj) return;

    sendingLockRef.current = true;
    setSending(true);

    const releaseSendingLock = () => {
      sendingLockRef.current = false;
      setSending(false);
    };

    const executeCreateReport = async (photoUrlToSave: string | null) => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Dialog.alert(t('planRoute.permissionDeniedTitle'), t('report.gpsMsg'), { tone: 'warning', icon: 'location' });
        return;
      }
      const pos = await Location.getCurrentPositionAsync({});

      const reportTypeKey = typeObj.key === 'hole' ? 'pothole'
        : typeObj.key === 'blocked' ? 'obstruction'
        : typeObj.key === 'flood' ? 'sewer'
        : typeObj.key;

      await apiClient.post('/api/obstacle-reports', {
        reportType: reportTypeKey,
        description: details.trim() || typeObj.label,
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        addressText: (location.trim() || t('planRoute.myLocation')).slice(0, 300),
        photoUrl: photoUrlToSave,
      });

      if (Platform.OS === 'android') {
        ToastAndroid.show(t('report.sentToast'), ToastAndroid.SHORT);
      } else {
        Dialog.alert(t('report.sentTitle'), t('report.sentMsg'));
      }
      onSubmitted();
    };

    const submitReport = async (photoUrlToSave: string | null) => {
      if (!sendingLockRef.current) {
        sendingLockRef.current = true;
        setSending(true);
      }
      try {
        await executeCreateReport(photoUrlToSave);
      } catch (e: any) {
        Dialog.alert(t('report.sendFailedTitle'), e?.message ?? t('planRoute.unexpectedError'), { tone: 'error' });
      } finally {
        releaseSendingLock();
      }
    };

    try {
      if (!photoUri) {
        await executeCreateReport(null);
        return;
      }

      if (photoUri.startsWith('http://') || photoUri.startsWith('https://')) {
        const remoteValidation = validateUploadedPhotoResponse({ status: 201, data: { url: photoUri } });
        if (!remoteValidation.isValid || !remoteValidation.url) {
          Dialog.alert(
            t('common.errorTitle') || 'URL de imagen inválida',
            remoteValidation.error || 'La URL de la fotografía no es válida.',
            { tone: 'warning' }
          );
          return;
        }
        await executeCreateReport(remoteValidation.url);
        return;
      }

      // Si la fotografía actual ya fue cargada con éxito en un intento previo (ej. falló solo la creación del reporte),
      // reutilizar la URL validada sin volver a subir el archivo.
      if (
        uploadedPhotoCacheRef.current &&
        uploadedPhotoCacheRef.current.sourceUri === photoUri &&
        uploadedPhotoCacheRef.current.serverUrl
      ) {
        await executeCreateReport(uploadedPhotoCacheRef.current.serverUrl);
        return;
      }

      // Validación preventiva de existencia, tamaño (<= 5 MB y > 0 bytes) y resolución de extensión/MIME
      const localStats = inspectLocalFileStats(photoUri);
      const effectiveSize =
        localStats.size !== null
          ? localStats.size
          : typeof photoMeta?.sizeBytes === 'number'
            ? photoMeta.sizeBytes
            : null;

      if (
        localStats.exists === false ||
        (effectiveSize !== null && (effectiveSize <= 0 || effectiveSize > MAX_REPORT_PHOTO_BYTES))
      ) {
        const sizeCheck = validateReportPhotoSize(effectiveSize, { exists: localStats.exists });
        Dialog.alert(
          t('common.errorTitle') || 'Imagen no válida',
          sizeCheck.error || 'El tamaño de la imagen no puede exceder 5 MB.',
          { tone: 'warning' }
        );
        return;
      }

      const uploadValidation = resolveReportPhotoUploadMeta({
        uri: photoUri,
        fileName: photoMeta?.name,
        mimeType: photoMeta?.type || localStats.mimeType,
        fileSize: effectiveSize,
        exists: localStats.exists,
      });

      if (!uploadValidation.isValid || !uploadValidation.metadata) {
        Dialog.alert(
          t('common.errorTitle') || 'Imagen no válida',
          uploadValidation.error || 'Formato o tamaño de imagen no permitido (máx. 5 MB, JPG/PNG/WEBP).',
          { tone: 'warning' }
        );
        return;
      }

      // Subida multipart/form-data de fotografía local delegando el boundary al cliente HTTP
      let validatedServerUrl: string | null = null;
      try {
        const formData = new FormData();
        const { uri, name, type } = uploadValidation.metadata;

        formData.append('file', {
          uri,
          name,
          type,
        } as any);

        const uploadRes = await apiClient.post(
          '/api/obstacle-reports/photo',
          formData,
          buildPhotoUploadRequestConfig()
        );

        const responseValidation = validateUploadedPhotoResponse(uploadRes);
        if (!responseValidation.isValid || !responseValidation.url) {
          throw new Error(responseValidation.error || 'Servidor no retornó una URL HTTP/HTTPS válida de imagen');
        }
        validatedServerUrl = responseValidation.url;
        uploadedPhotoCacheRef.current = {
          sourceUri: photoUri,
          serverUrl: validatedServerUrl,
        };
      } catch (uploadErr) {
        console.warn('[ReportFormSheet] Error al subir foto:', uploadErr);
        Dialog.alert(
          t('common.errorTitle') || 'Fallo de subida de fotografía',
          'No fue posible subir la imagen al servidor. ¿Deseas enviar el reporte sin fotografía o cancelar para reintentar?',
          [
            { text: 'Cancelar', style: 'cancel' },
            {
              text: 'Enviar sin foto',
              onPress: () => {
                if (sendingLockRef.current) return;
                void submitReport(null);
              },
            },
          ],
          { tone: 'warning' }
        );
        return;
      }

      await executeCreateReport(validatedServerUrl);
    } catch (e: any) {
      Dialog.alert(t('report.sendFailedTitle'), e?.message ?? t('planRoute.unexpectedError'), { tone: 'error' });
    } finally {
      releaseSendingLock();
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title} accessibilityRole="header">{t('report.formTitle')}</Text>
        <TouchableOpacity
          onPress={onClose}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel={t('common.close') || 'Cerrar'}
          accessibilityHint="Cierra el formulario de reporte sin guardar"
        >
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
        <View style={styles.grid} accessibilityRole="radiogroup" accessibilityLabel={t('report.chooseTypeTitle') || 'Tipo de incidente'}>
          {OBSTACLE_TYPES.map(item => {
            const active = selectedType === item.key;
            return (
              <TouchableOpacity
                key={item.key}
                style={[styles.typeCard, active && styles.typeCardActive]}
                onPress={() => setSelectedType(item.key)}
                activeOpacity={0.75}
                accessibilityRole="radio"
                accessibilityState={{ selected: active }}
                accessibilityLabel={`${item.label}${active ? ', seleccionado' : ''}`}
                accessibilityHint="Selecciona este tipo de obstáculo para el reporte"
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
            accessibilityLabel={t('report.locationTitle')}
          />
        </View>

        {/* Foto: cámara / galería estilo Google Maps */}
        {photoUri ? (
          <View style={styles.photoRow}>
            <Image source={{ uri: photoUri }} style={styles.photoThumb} accessibilityLabel="Vista previa de la foto adjunta" />
            <Text style={[styles.photoText, { flex: 1 }]}>{t('report.photoAttached')}</Text>
            <TouchableOpacity
              onPress={() => {
                if (sending || sendingLockRef.current) return;
                uploadedPhotoCacheRef.current = null;
                setPhotoUri(null);
                setPhotoMeta(null);
              }}
              disabled={sending}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityRole="button"
              accessibilityLabel="Eliminar fotografía adjunta"
              accessibilityHint="Quita la foto seleccionada del reporte"
            >
              <Ionicons name="close-circle" size={20} color="#9aa0a6" />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.photoRow}>
            <Ionicons name="camera-outline" size={18} color="#16a34a" />
            <TouchableOpacity
              style={styles.photoBtn}
              onPress={handlePickPhoto}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={t('report.cameraBtn')}
              accessibilityHint="Abre la cámara para tomar una foto del obstáculo"
            >
              <Text style={styles.photoText}>{t('report.cameraBtn')}</Text>
            </TouchableOpacity>
            <View style={styles.photoDivider} />
            <TouchableOpacity
              style={styles.photoBtn}
              onPress={handlePickGallery}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={t('report.galleryBtn')}
              accessibilityHint="Abre la galería para elegir una foto existente"
            >
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
          accessibilityLabel={t('report.detailsPlaceholderOpt')}
        />
      </ScrollView>

      <TouchableOpacity
        style={[styles.sendBtn, sending && { opacity: 0.6 }]}
        onPress={handleSend}
        disabled={sending}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel={sending ? t('report.sending') : t('report.send')}
        accessibilityHint="Envía el reporte comunitario con la ubicación y foto seleccionadas"
        accessibilityState={{ disabled: sending }}
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
