/**
 * Utilidades de validación, normalización de URIs Android/iOS, validación de respuesta
 * y control de concurrencia para fotografías de reportes de obstáculos (H-04).
 *
 * Alineado estrictamente con el contrato de EcoRuteandoBackend (ObstacleReportsController):
 * 1. Subida de foto: POST /api/obstacle-reports/photo
 *    - Multipart field: 'file' (sin forzar Content-Type manual sin boundary)
 *    - Tamaño máximo: 5 MB (5 * 1024 * 1024 bytes = 5,242,880 bytes)
 *    - Extensiones permitidas: .jpg, .jpeg, .png, .webp
 *    - Tipos MIME permitidos: image/jpeg, image/png, image/webp
 *    - Respuesta esperada: HTTP 201 Created con { url: "https://...", fileName: "..." }
 * 2. Creación de reporte: POST /api/obstacle-reports
 *    - photoUrl opcional (máx. 500 caracteres, URL HTTP/HTTPS absoluta válida)
 *    - Respuesta esperada: HTTP 201 Created con { reportId: "guid" }
 */

export const REPORT_PHOTO_COMPRESSION_QUALITY = 0.5;
export const MAX_REPORT_PHOTO_BYTES = 5 * 1024 * 1024; // 5 MB exactos (5,242,880 bytes)
export const MAX_PHOTO_URL_LENGTH = 500;

export type SupportedPhotoExtension = 'jpg' | 'jpeg' | 'png' | 'webp';
export type SupportedPhotoMime = 'image/jpeg' | 'image/png' | 'image/webp';

export type PhotoValidationErrorReason =
  | 'EMPTY_URI'
  | 'FILE_NOT_FOUND'
  | 'INVALID_SIZE'
  | 'EXCEEDS_MAX_SIZE'
  | 'UNSUPPORTED_FORMAT';

export interface PhotoSizeValidationResult {
  isValid: boolean;
  error: string | null;
  reason?: PhotoValidationErrorReason;
}

export interface PhotoUploadMetadata {
  uri: string;
  name: string;
  type: SupportedPhotoMime;
  extension: SupportedPhotoExtension;
  sizeBytes: number | null;
}

export interface PhotoUploadValidationResult {
  isValid: boolean;
  metadata: PhotoUploadMetadata | null;
  error: string | null;
  reason?: PhotoValidationErrorReason;
}

export interface UploadedPhotoResponseValidation {
  isValid: boolean;
  url: string | null;
  fileName: string | null;
  error: string | null;
}

const ALLOWED_EXTENSIONS = new Set<string>(['jpg', 'jpeg', 'png', 'webp']);

const EXPLICIT_UNSUPPORTED_EXTENSIONS = new Set<string>([
  'gif',
  'bmp',
  'tiff',
  'tif',
  'svg',
  'heic',
  'heif',
  'avif',
  'ico',
  'raw',
  'mp4',
  'mov',
  'avi',
  'mkv',
  'pdf',
  'doc',
  'docx',
  'txt',
]);

/**
 * Calcula el factor de compresión recomendado según el tamaño original si se conoce.
 * Nota: dado que quality: 0.5 por sí solo no garantiza < 5 MB en imágenes de ultra alta
 * resolución, siempre se ejecuta validateReportPhotoSize sobre el resultado final antes de subir.
 */
export function computeAdaptiveCompressionQuality(originalBytes?: number | null): number {
  if (typeof originalBytes !== 'number' || !Number.isFinite(originalBytes) || originalBytes <= 0) {
    return REPORT_PHOTO_COMPRESSION_QUALITY;
  }
  if (originalBytes > 8 * 1024 * 1024) {
    return 0.25;
  }
  if (originalBytes > 4 * 1024 * 1024) {
    return 0.35;
  }
  return REPORT_PHOTO_COMPRESSION_QUALITY;
}

/**
 * Valida preventivamente la existencia y el tamaño en bytes de la imagen antes de subirla.
 * Rechaza archivos inexistentes (exists === false), vacíos (<= 0 bytes) y mayores a 5 MB.
 */
export function validateReportPhotoSize(
  fileSize: number | null | undefined,
  options?: { exists?: boolean; requireKnownSize?: boolean }
): PhotoSizeValidationResult {
  if (options?.exists === false) {
    return {
      isValid: false,
      error: 'El archivo de imagen seleccionado no existe o no es accesible.',
      reason: 'FILE_NOT_FOUND',
    };
  }

  if (fileSize === null || fileSize === undefined) {
    if (options?.requireKnownSize) {
      return {
        isValid: false,
        error: 'No fue posible verificar el tamaño del archivo de imagen.',
        reason: 'INVALID_SIZE',
      };
    }
    return { isValid: true, error: null };
  }

  if (typeof fileSize !== 'number' || !Number.isFinite(fileSize) || fileSize <= 0) {
    return {
      isValid: false,
      error: 'El archivo de imagen está vacío (0 bytes) o no es válido.',
      reason: 'INVALID_SIZE',
    };
  }

  if (fileSize > MAX_REPORT_PHOTO_BYTES) {
    const sizeMb = (fileSize / (1024 * 1024)).toFixed(2);
    return {
      isValid: false,
      error: `La imagen seleccionada (${sizeMb} MB) supera el límite máximo permitido de 5 MB incluso tras la compresión.`,
      reason: 'EXCEEDS_MAX_SIZE',
    };
  }

  return { isValid: true, error: null };
}

/**
 * Identifica el formato real de la imagen mediante su firma binaria (magic bytes) cuando está disponible,
 * evitando depender únicamente de la extensión de la URI.
 */
export function detectMimeFromHeaderBytes(
  headerBytes?: Uint8Array | number[] | null
): { mime: SupportedPhotoMime; ext: SupportedPhotoExtension } | 'UNSUPPORTED' | null {
  if (!headerBytes || headerBytes.length < 4) {
    return null;
  }
  const b0 = headerBytes[0];
  const b1 = headerBytes[1];
  const b2 = headerBytes[2];
  const b3 = headerBytes[3];

  // JPEG: FF D8 FF
  if (b0 === 0xff && b1 === 0xd8 && b2 === 0xff) {
    return { mime: 'image/jpeg', ext: 'jpg' };
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (b0 === 0x89 && b1 === 0x50 && b2 === 0x4e && b3 === 0x47) {
    return { mime: 'image/png', ext: 'png' };
  }

  // WEBP: "RIFF" (52 49 46 46) + bytes 8..11 "WEBP" (57 45 42 50)
  if (
    headerBytes.length >= 12 &&
    b0 === 0x52 &&
    b1 === 0x49 &&
    b2 === 0x46 &&
    b3 === 0x46 &&
    headerBytes[8] === 0x57 &&
    headerBytes[9] === 0x45 &&
    headerBytes[10] === 0x42 &&
    headerBytes[11] === 0x50
  ) {
    return { mime: 'image/webp', ext: 'webp' };
  }

  // Otros formatos conocidos no soportados (GIF, BMP, PDF, etc.)
  return 'UNSUPPORTED';
}

function extractExtensionCandidate(value: string | null | undefined): string | null {
  if (!value || typeof value !== 'string') return null;
  const withoutQuery = value.split('?')[0].split('#')[0];
  let decoded = withoutQuery;
  try {
    decoded = decodeURIComponent(withoutQuery);
  } catch {
    decoded = withoutQuery;
  }
  const lastSegment = decoded.split('/').pop() || '';
  const match = /\.([a-zA-Z0-9]+)$/.exec(lastSegment);
  return match ? match[1].toLowerCase() : null;
}

function mapMimeToExtension(mime: string | null | undefined): SupportedPhotoExtension | null {
  if (!mime || typeof mime !== 'string') return null;
  const clean = mime.trim().toLowerCase().split(';')[0];
  if (clean === 'image/jpeg' || clean === 'image/jpg') return 'jpg';
  if (clean === 'image/png') return 'png';
  if (clean === 'image/webp') return 'webp';
  return null;
}

function mapExtensionToMime(ext: SupportedPhotoExtension): SupportedPhotoMime {
  if (ext === 'png') return 'image/png';
  if (ext === 'webp') return 'image/webp';
  return 'image/jpeg';
}

function detectMimeInAndroidContentUri(uri: string): SupportedPhotoExtension | null {
  let decoded = uri;
  try {
    decoded = decodeURIComponent(uri);
  } catch {
    decoded = uri;
  }
  const lower = decoded.toLowerCase();
  if (lower.includes('image/webp')) return 'webp';
  if (lower.includes('image/png')) return 'png';
  if (lower.includes('image/jpeg') || lower.includes('image/jpg')) return 'jpg';
  return null;
}

function sanitizeBaseFileName(rawSegment: string | null | undefined): string {
  if (!rawSegment || typeof rawSegment !== 'string') return 'report_photo';
  const withoutQuery = rawSegment.split('?')[0].split('#')[0];
  let decoded = withoutQuery;
  try {
    decoded = decodeURIComponent(withoutQuery);
  } catch {
    decoded = withoutQuery;
  }
  const leaf = decoded.split('/').pop() || '';
  const withoutExt = leaf.replace(/\.[^.]+$/, '');
  const sanitized = withoutExt
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
  if (!sanitized || sanitized.length < 2) {
    return 'report_photo';
  }
  return sanitized.slice(0, 60);
}

/**
 * Resuelve y valida los metadatos de subida multipart (uri, name, type) para URIs
 * locales (file://) y proveedores de contenido de Android (content://).
 *
 * No depende exclusivamente de la extensión de la URI: prioriza magic bytes (si existen)
 * y el tipo MIME real reportado por el sistema operativo / ImagePicker / ContentResolver.
 */
export function resolveReportPhotoUploadMeta(input: {
  uri: string | null | undefined;
  fileName?: string | null;
  mimeType?: string | null;
  fileSize?: number | null;
  exists?: boolean;
  headerBytes?: Uint8Array | number[] | null;
}): PhotoUploadValidationResult {
  const rawUri = typeof input?.uri === 'string' ? input.uri.trim() : '';
  if (!rawUri) {
    return {
      isValid: false,
      metadata: null,
      error: 'El archivo de imagen es obligatorio.',
      reason: 'EMPTY_URI',
    };
  }

  // 1. Validación de existencia y tamaño (<= 5 MB y > 0 bytes)
  const sizeCheck = validateReportPhotoSize(input.fileSize, { exists: input.exists });
  if (!sizeCheck.isValid) {
    return {
      isValid: false,
      metadata: null,
      error: sizeCheck.error,
      reason: sizeCheck.reason || 'INVALID_SIZE',
    };
  }

  // 2. Inspección de magic bytes si están disponibles
  const headerDetection = detectMimeFromHeaderBytes(input.headerBytes);
  if (headerDetection === 'UNSUPPORTED') {
    return {
      isValid: false,
      metadata: null,
      error: 'El contenido binario del archivo no corresponde a un formato soportado (JPG, PNG, WEBP).',
      reason: 'UNSUPPORTED_FORMAT',
    };
  }

  // 3. Validar tipo MIME explícito reportado por el selector o sistema de archivos
  const cleanMime =
    typeof input.mimeType === 'string' ? input.mimeType.trim().toLowerCase().split(';')[0] : '';
  const mimeMappedExt = mapMimeToExtension(cleanMime);

  if (cleanMime && cleanMime !== 'application/octet-stream' && !mimeMappedExt) {
    return {
      isValid: false,
      metadata: null,
      error: 'Formato de imagen no soportado. Formatos válidos: JPG, PNG, WEBP.',
      reason: 'UNSUPPORTED_FORMAT',
    };
  }

  // 4. Inspeccionar extensión desde fileName explícito o desde la URI
  const fileNameExt = extractExtensionCandidate(input.fileName);
  const uriExt = extractExtensionCandidate(rawUri);

  if (fileNameExt && !ALLOWED_EXTENSIONS.has(fileNameExt) && !mimeMappedExt && !headerDetection) {
    return {
      isValid: false,
      metadata: null,
      error: 'Formato de imagen no soportado. Formatos válidos: JPG, PNG, WEBP.',
      reason: 'UNSUPPORTED_FORMAT',
    };
  }

  if (uriExt && EXPLICIT_UNSUPPORTED_EXTENSIONS.has(uriExt) && !mimeMappedExt && !headerDetection) {
    return {
      isValid: false,
      metadata: null,
      error: 'Formato de imagen no soportado. Formatos válidos: JPG, PNG, WEBP.',
      reason: 'UNSUPPORTED_FORMAT',
    };
  }

  // 5. Determinar extensión y MIME priorizando la evidencia de contenido/MIME sobre la URI
  let resolvedExt: SupportedPhotoExtension = 'jpg';
  const contentUriMimeExt = rawUri.startsWith('content://')
    ? detectMimeInAndroidContentUri(rawUri)
    : null;

  if (headerDetection) {
    resolvedExt = headerDetection.ext;
  } else if (mimeMappedExt) {
    // Si el MIME es image/jpeg y el nombre original ya especificaba .jpeg, preservar .jpeg
    if (
      mimeMappedExt === 'jpg' &&
      (fileNameExt === 'jpeg' || uriExt === 'jpeg')
    ) {
      resolvedExt = 'jpeg';
    } else {
      resolvedExt = mimeMappedExt;
    }
  } else if (contentUriMimeExt) {
    resolvedExt = contentUriMimeExt;
  } else if (fileNameExt && ALLOWED_EXTENSIONS.has(fileNameExt)) {
    resolvedExt = fileNameExt as SupportedPhotoExtension;
  } else if (uriExt && ALLOWED_EXTENSIONS.has(uriExt)) {
    resolvedExt = uriExt as SupportedPhotoExtension;
  } else {
    resolvedExt = 'jpg';
  }

  const resolvedMime = mapExtensionToMime(resolvedExt);
  const baseName = sanitizeBaseFileName(input.fileName || rawUri);
  const normalizedName = `${baseName}.${resolvedExt}`;

  return {
    isValid: true,
    metadata: {
      uri: rawUri,
      name: normalizedName,
      type: resolvedMime,
      extension: resolvedExt,
      sizeBytes: typeof input.fileSize === 'number' ? input.fileSize : null,
    },
    error: null,
  };
}

/**
 * Construye la configuración de petición HTTP para subida de FormData sin fijar manualmente
 * 'Content-Type: multipart/form-data' (lo cual impediría a XHR/fetch inyectar el boundary).
 */
export function buildPhotoUploadRequestConfig() {
  return {
    headers: {
      'Content-Type': undefined as unknown as string,
    },
    transformRequest: [
      (data: unknown, headers?: Record<string, any>) => {
        if (headers) {
          if (typeof headers.delete === 'function') {
            headers.delete('Content-Type');
            headers.delete('content-type');
          }
          delete headers['Content-Type'];
          delete headers['content-type'];
        }
        return data;
      },
    ],
  };
}

/**
 * Valida la respuesta de POST /api/obstacle-reports/photo:
 * - Verifica código de estado exitoso (201 Created, o 200 OK en adaptadores compatibles).
 * - Verifica que data.url exista, no supere 500 caracteres y tenga esquema HTTP o HTTPS válido.
 */
export function validateUploadedPhotoResponse(response: {
  status?: number;
  data?: { url?: unknown; fileName?: unknown } | null;
} | null | undefined): UploadedPhotoResponseValidation {
  if (!response || typeof response !== 'object') {
    return {
      isValid: false,
      url: null,
      fileName: null,
      error: 'Respuesta vacía del servidor al subir la fotografía.',
    };
  }

  if (
    response.status !== undefined &&
    response.status !== 201 &&
    response.status !== 200
  ) {
    return {
      isValid: false,
      url: null,
      fileName: null,
      error: `El servidor respondió con estado inesperado (${response.status}) al subir la fotografía.`,
    };
  }

  const rawUrl = response.data?.url;
  if (typeof rawUrl !== 'string' || !rawUrl.trim()) {
    return {
      isValid: false,
      url: null,
      fileName: null,
      error: 'El servidor declaró exitosa la carga pero no devolvió una URL de imagen.',
    };
  }

  const trimmedUrl = rawUrl.trim();
  if (trimmedUrl.length > MAX_PHOTO_URL_LENGTH) {
    return {
      isValid: false,
      url: null,
      fileName: null,
      error: 'La URL de la fotografía devuelta por el servidor excede el límite de 500 caracteres.',
    };
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(trimmedUrl);
  } catch {
    return {
      isValid: false,
      url: null,
      fileName: null,
      error: 'La URL de la fotografía devuelta por el servidor no tiene un formato válido.',
    };
  }

  const protocol = parsedUrl.protocol.toLowerCase();
  if ((protocol !== 'http:' && protocol !== 'https:') || !parsedUrl.hostname) {
    return {
      isValid: false,
      url: null,
      fileName: null,
      error: 'La URL de la fotografía devuelta por el servidor debe utilizar el esquema http:// o https://.',
    };
  }

  const fileName =
    typeof response.data?.fileName === 'string' && response.data.fileName.trim()
      ? response.data.fileName.trim()
      : null;

  return {
    isValid: true,
    url: trimmedUrl,
    fileName,
    error: null,
  };
}

/**
 * Crea un candado síncrono de ejecución para bloquear dobles pulsaciones (double-tap)
 * durante flujos asíncronos compuestos (subida de foto + creación de reporte).
 */
export function createSubmissionGuard() {
  let locked = false;
  return {
    isLocked(): boolean {
      return locked;
    },
    tryAcquire(): boolean {
      if (locked) return false;
      locked = true;
      return true;
    },
    release(): void {
      locked = false;
    },
  };
}
