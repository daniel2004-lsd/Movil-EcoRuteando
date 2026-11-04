import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../../');

async function loadReportPhotoValidationModule() {
  const tsPath = path.join(projectRoot, 'src/shared/utils/reportPhotoValidation.ts');
  const source = fs.readFileSync(tsPath, 'utf8');
  const transpiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ES2022,
      target: ts.ScriptTarget.ES2022,
    },
  });
  const dataUrl = `data:text/javascript;base64,${Buffer.from(transpiled.outputText, 'utf8').toString('base64')}`;
  return import(dataUrl);
}

const reportPhotoModulePromise = loadReportPhotoValidationModule();

test('apiClient: Production URL and customApiUrl purge', () => {
  const apiClientPath = path.join(projectRoot, 'src/shared/services/apiClient.ts');
  const content = fs.readFileSync(apiClientPath, 'utf8');

  // Must define validated production backend URL
  assert.match(content, /https:\/\/ecoruteandobackend\.onrender\.com/);

  // Must support EXPO_PUBLIC_API_URL environment configuration with PRODUCTION_API_URL fallback (H-11)
  assert.match(content, /process\.env\.EXPO_PUBLIC_API_URL\s*\|\|\s*PRODUCTION_API_URL/);

  // Must purge any legacy customApiUrl from SecureStore
  assert.match(content, /deleteItemAsync\(['"]customApiUrl['"]\)/);

  // Must NOT assign config.baseURL = customUrl
  assert.doesNotMatch(content, /config\.baseURL\s*=\s*customUrl/);

  // Must strip Content-Type for FormData so HTTP client generates boundary
  assert.match(content, /isFormDataPayload/);
});

test('ReportFormSheet: Uploads local photos, delegates multipart boundary, validates 201 URL, and caches uploaded photo (H-04 / H-35)', () => {
  const sheetPath = path.join(projectRoot, 'src/components/maps/ReportFormSheet.tsx');
  const content = fs.readFileSync(sheetPath, 'utf8');

  // Must upload local photos via multipart to backend /api/obstacle-reports/photo
  assert.match(content, /\/api\/obstacle-reports\/photo/);
  assert.match(content, /multipart\/form-data/);

  // Must NOT hardcode manual Content-Type: multipart/form-data header in axios call
  assert.doesNotMatch(content, /headers:\s*\{\s*['"]Content-Type['"]\s*:\s*['"]multipart\/form-data['"]\s*\}/);
  assert.match(content, /buildPhotoUploadRequestConfig/);
  assert.match(content, /validateUploadedPhotoResponse/);
  assert.match(content, /uploadedPhotoCacheRef/);

  // Must NOT send translated label as reportType
  assert.doesNotMatch(content, /reportType:\s*typeObj\.label/);

  // Must map and send technical key
  assert.match(content, /reportType:\s*reportTypeKey/);

  // Must use REPORT_PHOTO_COMPRESSION_QUALITY (0.5) and preventive 5 MB validation
  assert.match(content, /REPORT_PHOTO_COMPRESSION_QUALITY/);
  assert.match(content, /MAX_REPORT_PHOTO_BYTES/);
  assert.match(content, /sendingLockRef/);
});

test('H-04 Validación de Tamaño (5 MB), Archivo Vacío e Inexistente, y Compresión Efectiva', async () => {
  const {
    MAX_REPORT_PHOTO_BYTES,
    REPORT_PHOTO_COMPRESSION_QUALITY,
    computeAdaptiveCompressionQuality,
    validateReportPhotoSize,
    resolveReportPhotoUploadMeta,
  } = await reportPhotoModulePromise;

  assert.equal(MAX_REPORT_PHOTO_BYTES, 5 * 1024 * 1024);
  assert.equal(REPORT_PHOTO_COMPRESSION_QUALITY, 0.5);

  // Compresión efectiva y reducción adaptativa de calidad cuando supera 5 MB
  assert.equal(computeAdaptiveCompressionQuality(2 * 1024 * 1024), 0.5);
  const adaptedFor8Mb = computeAdaptiveCompressionQuality(9 * 1024 * 1024);
  assert.ok(adaptedFor8Mb < 0.5 && adaptedFor8Mb >= 0.25, 'Debe reducir calidad adaptativamente cuando supera 5 MB');
  assert.equal(computeAdaptiveCompressionQuality(50 * 1024 * 1024), 0.25, 'No debe bajar del piso mínimo de calidad');

  // Imagen de 1.5 MB -> Válida
  const valid15Mb = resolveReportPhotoUploadMeta({
    uri: 'file:///data/user/0/com.ecoruteando/cache/ImagePicker/photo1.jpg',
    fileSize: Math.floor(1.5 * 1024 * 1024),
    exists: true,
  });
  assert.equal(valid15Mb.isValid, true);

  // Imagen exactamente en el límite de 5 MB (5,242,880 bytes) -> Válida
  const exact5Mb = resolveReportPhotoUploadMeta({
    uri: 'file:///data/user/0/com.ecoruteando/cache/ImagePicker/photo5mb.png',
    fileSize: 5 * 1024 * 1024,
    exists: true,
  });
  assert.equal(exact5Mb.isValid, true);
  assert.equal(exact5Mb.metadata.type, 'image/png');
  assert.equal(exact5Mb.metadata.extension, 'png');

  // Imagen que excede por 1 byte los 5 MB (5,242,881 bytes) -> Rechazada preventivamente
  const over5Mb = resolveReportPhotoUploadMeta({
    uri: 'file:///data/user/0/com.ecoruteando/cache/ImagePicker/huge.jpg',
    fileSize: 5 * 1024 * 1024 + 1,
    exists: true,
  });
  assert.equal(over5Mb.isValid, false);
  assert.equal(over5Mb.reason, 'EXCEEDS_MAX_SIZE');
  assert.match(over5Mb.error, /5 MB/);

  // Imagen que supera el límite después de seleccionarla (ej. 7.2 MB tras picker) -> Rechazada antes de subir
  const overAfterPick = resolveReportPhotoUploadMeta({
    uri: 'content://media/external/images/media/998877',
    mimeType: 'image/jpeg',
    fileSize: Math.floor(7.2 * 1024 * 1024),
    exists: true,
  });
  assert.equal(overAfterPick.isValid, false);
  assert.equal(overAfterPick.reason, 'EXCEEDS_MAX_SIZE');

  // Archivo vacío (0 bytes) y negativo -> Rechazado con INVALID_SIZE
  const emptyCheck = validateReportPhotoSize(0, { exists: true });
  assert.equal(emptyCheck.isValid, false);
  assert.equal(emptyCheck.reason, 'INVALID_SIZE');
  const emptyMeta = resolveReportPhotoUploadMeta({
    uri: 'file:///cache/empty.jpg',
    fileSize: 0,
    exists: true,
  });
  assert.equal(emptyMeta.isValid, false);
  assert.equal(emptyMeta.reason, 'INVALID_SIZE');
  assert.equal(validateReportPhotoSize(-100).isValid, false);

  // Archivo inexistente (exists: false) -> Rechazado con FILE_NOT_FOUND
  const missingFileCheck = validateReportPhotoSize(null, { exists: false });
  assert.equal(missingFileCheck.isValid, false);
  assert.equal(missingFileCheck.reason, 'FILE_NOT_FOUND');
  const missingMeta = resolveReportPhotoUploadMeta({
    uri: 'file:///cache/deleted_photo.jpg',
    fileSize: null,
    exists: false,
  });
  assert.equal(missingMeta.isValid, false);
  assert.equal(missingMeta.reason, 'FILE_NOT_FOUND');
});

test('H-04 Formatos JPEG, PNG, WEBP, firmas binarias (Magic Bytes) y URIs Android (file:// y content:// sin extensión)', async () => {
  const { resolveReportPhotoUploadMeta, detectMimeFromHeaderBytes } = await reportPhotoModulePromise;

  // 1. Detección por firma binaria (Magic Bytes) sin depender de la extensión de la URI
  const jpegMagic = [0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01];
  const pngMagic = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d];
  const webpMagic = [0x52, 0x49, 0x46, 0x46, 0x24, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50];

  assert.deepEqual(detectMimeFromHeaderBytes(jpegMagic), { mime: 'image/jpeg', ext: 'jpg' });
  assert.deepEqual(detectMimeFromHeaderBytes(pngMagic), { mime: 'image/png', ext: 'png' });
  assert.deepEqual(detectMimeFromHeaderBytes(webpMagic), { mime: 'image/webp', ext: 'webp' });
  assert.equal(detectMimeFromHeaderBytes([0x00, 0x01, 0x02, 0x03]), 'UNSUPPORTED');
  assert.equal(detectMimeFromHeaderBytes([0x00, 0x01]), null);

  // URI con extensión engañosa (.jpg) pero contenido binario real PNG -> Prevalece el binario real (image/png y .png)
  const misleadingExtension = resolveReportPhotoUploadMeta({
    uri: 'file:///cache/camera_capture.jpg',
    headerBytes: pngMagic,
    fileSize: 400000,
  });
  assert.equal(misleadingExtension.isValid, true);
  assert.equal(misleadingExtension.metadata.type, 'image/png');
  assert.match(misleadingExtension.metadata.name, /\.png$/);

  // 2. URI file:// sin extensión pero con MIME o firma WEBP
  const fileUriWithoutExt = resolveReportPhotoUploadMeta({
    uri: 'file:///data/user/0/com.ecoruteando/cache/ImagePicker/cropped_image_blob',
    headerBytes: webpMagic,
    fileSize: 512000,
  });
  assert.equal(fileUriWithoutExt.isValid, true);
  assert.equal(fileUriWithoutExt.metadata.type, 'image/webp');
  assert.match(fileUriWithoutExt.metadata.name, /\.webp$/);

  // 3. URI content:// de MediaStore en Android sin extensión en la ruta (JPEG)
  const mediaStoreUri = resolveReportPhotoUploadMeta({
    uri: 'content://media/external/images/media/1000098765',
    fileName: null,
    mimeType: 'image/jpeg',
    fileSize: 850000,
  });
  assert.equal(mediaStoreUri.isValid, true);
  assert.equal(mediaStoreUri.metadata.uri, 'content://media/external/images/media/1000098765');
  assert.match(mediaStoreUri.metadata.name, /\.jpg$/, 'El nombre enviado en FormData debe tener extensión .jpg para Path.GetExtension en el backend');
  assert.equal(mediaStoreUri.metadata.type, 'image/jpeg');

  // 4. URI content:// de DocumentsProvider en Android con dos puntos codificados (%3A) y PNG
  const docProviderUri = resolveReportPhotoUploadMeta({
    uri: 'content://com.android.providers.media.documents/document/image%3A445566',
    fileName: null,
    mimeType: 'image/png',
    fileSize: 420000,
  });
  assert.equal(docProviderUri.isValid, true);
  assert.match(docProviderUri.metadata.name, /\.png$/);
  assert.equal(docProviderUri.metadata.type, 'image/png');

  // 5. URI content:// sin mimeType explícito ni extensión (fallback seguro a .jpg / image/jpeg)
  const bareContentUri = resolveReportPhotoUploadMeta({
    uri: 'content://media/picker/0/com.android.providers.media.photopicker/media/778899',
    fileSize: 350000,
  });
  assert.equal(bareContentUri.isValid, true);
  assert.match(bareContentUri.metadata.name, /\.jpg$/);
  assert.equal(bareContentUri.metadata.type, 'image/jpeg');

  // 6. URI file:// con extensión .WEBP en mayúsculas
  const webpFileUri = resolveReportPhotoUploadMeta({
    uri: 'file:///storage/emulated/0/DCIM/Camera/IMG_20261103.WEBP',
    fileSize: 300000,
  });
  assert.equal(webpFileUri.isValid, true);
  assert.equal(webpFileUri.metadata.name, 'IMG_20261103.webp');
  assert.equal(webpFileUri.metadata.type, 'image/webp');

  // 7. Formato no soportado por el backend (.gif / image/gif) -> Rechazado preventivamente
  const unsupportedGif = resolveReportPhotoUploadMeta({
    uri: 'file:///storage/emulated/0/Download/anim.gif',
    mimeType: 'image/gif',
    fileSize: 100000,
  });
  assert.equal(unsupportedGif.isValid, false);
  assert.equal(unsupportedGif.reason, 'UNSUPPORTED_FORMAT');
});

test('H-04 Configuración Multipart y Validación Estricta de Respuesta 201 (URL HTTP/HTTPS)', async () => {
  const { buildPhotoUploadRequestConfig, validateUploadedPhotoResponse } = await reportPhotoModulePromise;

  // 1. Verificar que buildPhotoUploadRequestConfig no fije Content-Type manual y limpie el header JSON por defecto
  const reqConfig = buildPhotoUploadRequestConfig();
  assert.equal(reqConfig.headers?.['Content-Type'], undefined, 'No debe fijar Content-Type manual sin boundary');
  const fakeHeaders = {
    'Content-Type': 'application/json',
    'content-type': 'multipart/form-data',
    Authorization: 'Bearer token123',
  };
  const fakeFormData = { _parts: [['file', { uri: 'file:///a.jpg', name: 'a.jpg', type: 'image/jpeg' }]] };
  const transformed = reqConfig.transformRequest[0](fakeFormData, fakeHeaders);
  assert.equal(transformed, fakeFormData);
  assert.equal(fakeHeaders['Content-Type'], undefined, 'Debe eliminar Content-Type para que XHR/fetch inyecte boundary');
  assert.equal(fakeHeaders['content-type'], undefined);
  assert.equal(fakeHeaders.Authorization, 'Bearer token123');

  // 2. Respuesta HTTP 201 válida con URL HTTPS
  const valid201 = validateUploadedPhotoResponse({
    status: 201,
    data: {
      url: 'https://ecoruteandobackend.onrender.com/uploads/reports/4f8a9b1c2d3e4f5a6b7c8d9e0f1a2b3c.jpg',
      fileName: '4f8a9b1c2d3e4f5a6b7c8d9e0f1a2b3c.jpg',
    },
  });
  assert.equal(valid201.isValid, true);
  assert.match(valid201.url, /^https:\/\//);

  // 3. HTTP 201 sin URL -> Rechazado (NO debe crear el reporte)
  const missingUrl201 = validateUploadedPhotoResponse({
    status: 201,
    data: { fileName: 'orphan.jpg' },
  });
  assert.equal(missingUrl201.isValid, false);
  assert.match(missingUrl201.error, /URL de imagen/i);

  // 4. HTTP 201 con URL vacía o esquema no permitido (ftp://, javascript:, file://, ruta relativa)
  for (const badUrl of ['', '   ', 'ftp://server.com/photo.jpg', 'javascript:alert(1)', 'file:///local/photo.jpg', '/uploads/reports/rel.jpg']) {
    const res = validateUploadedPhotoResponse({
      status: 201,
      data: { url: badUrl },
    });
    assert.equal(res.isValid, false, `Debe rechazar URL inválida: "${badUrl}"`);
  }

  // 5. URL que excede los 500 caracteres del contrato CreateObstacleReportCommandValidator
  const hugeUrl = 'https://ecoruteandobackend.onrender.com/uploads/reports/' + 'a'.repeat(500) + '.jpg';
  const tooLongRes = validateUploadedPhotoResponse({
    status: 201,
    data: { url: hugeUrl },
  });
  assert.equal(tooLongRes.isValid, false);
  assert.match(tooLongRes.error, /500/);
});

test('H-04 Flujo Integral de Reporte: Errores HTTP 400/500/Red, 201 sin URL, Decisión Explícita sin Foto, Caché ante fallo de Reporte y Liberación de Bloqueo', async () => {
  const {
    resolveReportPhotoUploadMeta,
    validateUploadedPhotoResponse,
    createSubmissionGuard,
  } = await reportPhotoModulePromise;

  const guard = createSubmissionGuard();
  const uploadedPhotoCache = { current: null };
  const apiCalls = [];

  /**
   * Emula fielmente handleSend + submitReport de ReportFormSheet.tsx
   */
  async function executeReportSubmission({
    photoInput,
    uploadBehavior = 'success', // 'success' | 'network_error' | 'http_400' | 'http_500' | 'http_201_no_url' | 'http_201_invalid_scheme'
    reportBehavior = 'success', // 'success' | 'http_500'
    userConfirmsSendWithoutPhoto = false,
  }) {
    if (!guard.tryAcquire()) {
      return { blockedByDoubleTap: true };
    }

    try {
      let photoUrlToSave = null;

      if (photoInput) {
        if (uploadedPhotoCache.current && uploadedPhotoCache.current.sourceUri === photoInput.uri) {
          photoUrlToSave = uploadedPhotoCache.current.serverUrl;
        } else {
          const validation = resolveReportPhotoUploadMeta(photoInput);
          if (!validation.isValid) {
            return { blockedByDoubleTap: false, success: false, abortedReason: validation.reason, error: validation.error };
          }

          try {
            apiCalls.push({ endpoint: '/api/obstacle-reports/photo', meta: validation.metadata });

            if (uploadBehavior === 'network_error') {
              const err = new Error('Network Error');
              err.code = 'ERR_NETWORK';
              throw err;
            }
            if (uploadBehavior === 'http_400') {
              const err = new Error('Request failed with status code 400');
              err.response = { status: 400, data: { detail: 'El archivo supera el tamaño máximo permitido de 5 MB.' } };
              throw err;
            }
            if (uploadBehavior === 'http_500') {
              const err = new Error('Request failed with status code 500');
              err.response = { status: 500, data: { detail: 'Internal Server Error' } };
              throw err;
            }

            let simulatedResponse;
            if (uploadBehavior === 'http_201_no_url') {
              simulatedResponse = { status: 201, data: { fileName: 'abc.jpg' } };
            } else if (uploadBehavior === 'http_201_invalid_scheme') {
              simulatedResponse = { status: 201, data: { url: 'ftp://malicious.example.com/abc.jpg' } };
            } else {
              simulatedResponse = {
                status: 201,
                data: {
                  url: `https://ecoruteandobackend.onrender.com/uploads/reports/guid_${validation.metadata.name}`,
                  fileName: `guid_${validation.metadata.name}`,
                },
              };
            }

            const validatedUpload = validateUploadedPhotoResponse(simulatedResponse);
            if (!validatedUpload.isValid) {
              throw new Error(validatedUpload.error);
            }

            uploadedPhotoCache.current = {
              sourceUri: photoInput.uri,
              serverUrl: validatedUpload.url,
            };
            photoUrlToSave = validatedUpload.url;
          } catch (uploadErr) {
            // Solo envía sin fotografía si el usuario toma la decisión explícita
            if (!userConfirmsSendWithoutPhoto) {
              return {
                blockedByDoubleTap: false,
                success: false,
                abortedOnPhotoError: true,
                error: uploadErr.response?.data?.detail || uploadErr.message,
              };
            }
            photoUrlToSave = null;
          }
        }
      }

      apiCalls.push({
        endpoint: '/api/obstacle-reports',
        payload: {
          reportType: 'pothole',
          description: 'Hueco profundo en ciclorruta',
          latitude: 4.6097,
          longitude: -74.0817,
          addressText: 'Carrera 7, Bogotá',
          photoUrl: photoUrlToSave,
        },
      });

      if (reportBehavior === 'http_500') {
        const err = new Error('Error 500 creando reporte');
        err.response = { status: 500 };
        throw err;
      }

      uploadedPhotoCache.current = null;
      return { blockedByDoubleTap: false, success: true, photoUrl: photoUrlToSave };
    } catch (reportErr) {
      return { blockedByDoubleTap: false, success: false, reportCreationFailed: true, error: reportErr.message };
    } finally {
      guard.release();
    }
  }

  // 1. Doble pulsación bloqueada mientras hay una operación en curso
  assert.equal(guard.tryAcquire(), true);
  const doubleTapAttempt = await executeReportSubmission({ photoInput: null });
  assert.equal(doubleTapAttempt.blockedByDoubleTap, true);
  guard.release();
  assert.equal(guard.isLocked(), false);

  // 2. Error de red, HTTP 400 y HTTP 500 durante subida sin confirmación del usuario -> NO crea reporte y libera bloqueo
  for (const mode of ['network_error', 'http_400', 'http_500', 'http_201_no_url', 'http_201_invalid_scheme']) {
    apiCalls.length = 0;
    const res = await executeReportSubmission({
      photoInput: { uri: `file:///cache/${mode}.jpg`, mimeType: 'image/jpeg', fileSize: 100000 },
      uploadBehavior: mode,
      userConfirmsSendWithoutPhoto: false,
    });
    assert.equal(res.success, false, `Modo ${mode} debe abortar si el usuario no confirma enviar sin foto`);
    assert.equal(apiCalls.filter((c) => c.endpoint === '/api/obstacle-reports').length, 0, `Modo ${mode} NO debe llamar a POST /api/obstacle-reports`);
    assert.equal(guard.isLocked(), false, `El bloqueo debe liberarse en finally tras ${mode}`);
  }

  // 3. Si falla la fotografía y el usuario decide explícitamente "Enviar sin foto" -> Se crea reporte con photoUrl: null
  apiCalls.length = 0;
  const explicitWithoutPhoto = await executeReportSubmission({
    photoInput: { uri: 'file:///cache/fail_but_continue.png', mimeType: 'image/png', fileSize: 120000 },
    uploadBehavior: 'http_500',
    userConfirmsSendWithoutPhoto: true,
  });
  assert.equal(explicitWithoutPhoto.success, true);
  assert.equal(explicitWithoutPhoto.photoUrl, null);
  assert.equal(apiCalls.length, 2);

  // 4. Si la carga de foto tiene éxito (201) pero falla la creación del reporte (POST /api/obstacle-reports),
  // el reintento reutiliza la URL ya subida sin volver a cargar la fotografía
  apiCalls.length = 0;
  uploadedPhotoCache.current = null;
  const photoForRetry = {
    uri: 'content://media/external/images/media/554433',
    mimeType: 'image/jpeg',
    fileSize: 300000,
  };

  const firstAttempt = await executeReportSubmission({
    photoInput: photoForRetry,
    uploadBehavior: 'success',
    reportBehavior: 'http_500',
  });
  assert.equal(firstAttempt.success, false);
  assert.equal(firstAttempt.reportCreationFailed, true);
  assert.equal(guard.isLocked(), false, 'El bloqueo se libera tras fallo al crear el reporte');
  assert.equal(apiCalls.filter((c) => c.endpoint === '/api/obstacle-reports/photo').length, 1);

  // Segundo intento (reintento del usuario tras el fallo del reporte)
  const retryAttempt = await executeReportSubmission({
    photoInput: photoForRetry,
    uploadBehavior: 'success',
    reportBehavior: 'success',
  });
  assert.equal(retryAttempt.success, true);
  assert.match(retryAttempt.photoUrl, /^https:\/\/ecoruteandobackend\.onrender\.com\/uploads\/reports\/.*\.jpg$/);
  assert.equal(
    apiCalls.filter((c) => c.endpoint === '/api/obstacle-reports/photo').length,
    1,
    'No debe volver a subir la fotografía en el reintento si ya había sido cargada con éxito'
  );
  assert.equal(apiCalls.filter((c) => c.endpoint === '/api/obstacle-reports').length, 2);

  // 5. Envío directo sin fotografía seleccionada
  apiCalls.length = 0;
  const noPhotoRes = await executeReportSubmission({ photoInput: null });
  assert.equal(noPhotoRes.success, true);
  assert.equal(noPhotoRes.photoUrl, null);
  assert.equal(apiCalls.length, 1);
  assert.equal(apiCalls[0].endpoint, '/api/obstacle-reports');
});

test('login.tsx: Server configuration modal and button are removed', () => {
  const loginPath = path.join(projectRoot, 'app/(auth)/login.tsx');
  const content = fs.readFileSync(loginPath, 'utf8');

  assert.doesNotMatch(content, /showServerModal/);
  assert.doesNotMatch(content, /serverUrlInput/);
  assert.doesNotMatch(content, /handleTestConnection/);
  assert.doesNotMatch(content, /handleSaveServerUrl/);
  assert.doesNotMatch(content, /Configurar servidor/);
  assert.doesNotMatch(content, /serverBtn/);
});

test('MapEngine.tsx: Base map displays without requiring location permission', () => {
  const mapEnginePath = path.join(projectRoot, 'src/components/maps/MapEngine.tsx');
  const content = fs.readFileSync(mapEnginePath, 'utf8');

  // Must check Location.getForegroundPermissionsAsync
  assert.match(content, /Location\.getForegroundPermissionsAsync/);

  // Must sanitize showsUserLocation based on permission
  assert.match(content, /showsUserLocation:\s*Boolean\(props\.showsUserLocation\s*&&\s*hasLocationPermission\)/);

  // Must have DEFAULT_REGION fallback
  assert.match(content, /DEFAULT_REGION/);
});

test('plan-route.tsx: Does not block users with location permission error on mount', () => {
  const planRoutePath = path.join(projectRoot, 'app/(tabs)/plan-route.tsx');
  const content = fs.readFileSync(planRoutePath, 'utf8');

  // Mount effect calls getCurrentLocation(true) (silent mode)
  assert.match(content, /getCurrentLocation\(true\)/);

  // getCurrentLocation supports silent parameter to avoid alert
  assert.match(content, /const getCurrentLocation = async \(\s*silent\s*=\s*false\s*\)/);
});

test('android/app/build.gradle: Dynamically resolves MAPS_API_KEY from env / .env without hardcoding', () => {
  const gradlePath = path.join(projectRoot, 'android/app/build.gradle');
  const content = fs.readFileSync(gradlePath, 'utf8');

  assert.match(content, /def getGoogleMapsApiKey\(\)/);
  assert.match(content, /MAPS_API_KEY:\s*getGoogleMapsApiKey\(\)/);

  // Must not hardcode AIza... into build.gradle
  assert.doesNotMatch(content, /AIzaSy/);
});
