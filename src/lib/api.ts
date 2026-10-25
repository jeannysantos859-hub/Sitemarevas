import { SiteData, Project, ServiceItem, SiteSettings, ContactInquiry } from '../types';
import { upload as vercelBlobUpload } from '@vercel/blob/client';

export const API_BASE = '';

// Auth token storage key
const TOKEN_KEY = 'marevas_admin_token';

export interface StorageStatus {
  provider: 'vercel-blob' | 'local-disk';
  isBlobConfigured: boolean;
  platform: 'vercel' | 'node';
  hasUploadsDir: boolean;
  message: string;
}

export function getAdminToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setAdminToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearAdminToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

async function safeFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  try {
    return await fetch(input, init);
  } catch (err: any) {
    if (
      err.name === 'TypeError' ||
      (err.message && err.message.toLowerCase().includes('failed to fetch'))
    ) {
      throw new Error(
        'No se pudo conectar con el servidor de Marevas MKT. Comprueba la conexión o reinicia la vista previa.'
      );
    }
    throw err;
  }
}

/**
 * Safely parses response from server, guaranteeing that HTML error pages or non-JSON
 * responses never throw "Unexpected token '<', <html>... is not valid JSON".
 */
async function parseJsonResponse<T = any>(res: Response, defaultErrorMsg: string): Promise<T> {
  const contentType = res.headers.get('content-type') || '';
  let rawText = '';
  try {
    rawText = await res.text();
  } catch {
    throw new Error('Error de conexión con el servidor.');
  }

  let data: any = null;
  const isJsonHeader = contentType.toLowerCase().includes('application/json');
  const looksLikeJson = rawText.trim().startsWith('{') || rawText.trim().startsWith('[');

  if (isJsonHeader || looksLikeJson) {
    try {
      data = JSON.parse(rawText);
    } catch {
      data = null;
    }
  }

  if (!res.ok) {
    if (data && (data.error || data.message)) {
      throw new Error(data.error || data.message);
    }

    if (res.status === 401) {
      clearAdminToken();
      throw new Error('Sesión expirada o no autorizada. Por favor, vuelve a iniciar sesión en el panel.');
    }
    if (res.status === 403) {
      throw new Error('No tienes permisos suficientes para realizar esta acción.');
    }
    if (res.status === 404) {
      throw new Error('La ruta o recurso solicitado no fue encontrado en el servidor.');
    }
    if (res.status === 413) {
      throw new Error('El archivo seleccionado supera el tamaño máximo permitido por el servidor (500 MB).');
    }
    if (res.status >= 500) {
      throw new Error('Ocurrió un error en el servidor. Por favor, inténtalo de nuevo.');
    }

    throw new Error(defaultErrorMsg);
  }

  if (data === null) {
    throw new Error(defaultErrorMsg || 'Respuesta inválida del servidor.');
  }

  return data as T;
}

export async function fetchSiteData(): Promise<SiteData> {
  const res = await safeFetch('/api/site-data');
  return parseJsonResponse<SiteData>(res, 'Error al cargar la información del sitio web');
}

export async function submitContactForm(data: {
  name: string;
  businessName?: string;
  email: string;
  serviceType: string;
  message: string;
}): Promise<{ success: boolean; message: string; inquiryId?: string }> {
  const res = await safeFetch('/api/contact', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return parseJsonResponse(res, 'Error al enviar el formulario de contacto');
}

export async function adminLogin(credentials: {
  username: string;
  password: string;
}): Promise<{ token: string; username: string }> {
  const res = await safeFetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  });
  const json = await parseJsonResponse<{ token: string; username: string }>(res, 'Credenciales de acceso incorrectas');
  setAdminToken(json.token);
  return json;
}

export async function adminLogout(): Promise<void> {
  const token = getAdminToken();
  if (token) {
    try {
      await safeFetch('/api/auth/logout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {
      // ignore
    }
  }
  clearAdminToken();
}

export async function fetchAdminData(): Promise<SiteData> {
  const token = getAdminToken();
  if (!token) throw new Error('No hay sesión activa. Por favor, inicia sesión.');
  const res = await safeFetch('/api/admin/data', {
    headers: { Authorization: `Bearer ${token}` },
  });
  return parseJsonResponse<SiteData>(res, 'Error al obtener los datos de administración');
}

export async function updateAdminSettings(settings: Partial<SiteSettings>): Promise<void> {
  const token = getAdminToken();
  if (!token) throw new Error('Sesión no válida. Inicia sesión en el panel.');
  const res = await safeFetch('/api/admin/settings', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(settings),
  });
  await parseJsonResponse(res, 'Error al guardar la configuración');
}

export async function updateAdminService(service: ServiceItem): Promise<void> {
  const token = getAdminToken();
  if (!token) throw new Error('Sesión no válida. Inicia sesión en el panel.');
  const res = await safeFetch(`/api/admin/services/${service.id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(service),
  });
  await parseJsonResponse(res, 'Error al actualizar el servicio');
}

export async function saveAdminProject(project: Partial<Project>): Promise<Project> {
  const token = getAdminToken();
  if (!token) throw new Error('Sesión no válida. Por favor, inicia sesión en el panel.');
  const isNew = !project.id || project.id.startsWith('temp-');
  const url = isNew ? '/api/admin/projects' : `/api/admin/projects/${project.id}`;
  const method = isNew ? 'POST' : 'PUT';

  const res = await safeFetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(project),
  });
  const json = await parseJsonResponse<{ success: boolean; project: Project }>(res, 'Error al guardar el proyecto en el portafolio');
  return json.project;
}

export async function reorderAdminProjects(orderedIds: string[]): Promise<Project[]> {
  const token = getAdminToken();
  if (!token) throw new Error('Sesión no válida.');
  const res = await safeFetch('/api/admin/projects-order', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ orderedIds }),
  });
  const json = await parseJsonResponse<{ success: boolean; projects: Project[] }>(res, 'Error al reordenar los proyectos');
  return json.projects;
}

export async function deleteAdminProject(id: string): Promise<void> {
  const token = getAdminToken();
  if (!token) throw new Error('Sesión no válida.');
  const res = await safeFetch(`/api/admin/projects/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  await parseJsonResponse(res, 'Error al eliminar el proyecto');
}

export async function updateInquiryStatus(id: string, status: ContactInquiry['status']): Promise<void> {
  const token = getAdminToken();
  if (!token) throw new Error('Sesión no válida.');
  const res = await safeFetch(`/api/admin/inquiries/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ status }),
  });
  await parseJsonResponse(res, 'Error al actualizar estado de solicitud');
}

export async function deleteAdminInquiry(id: string): Promise<void> {
  const token = getAdminToken();
  if (!token) throw new Error('Sesión no válida.');
  const res = await safeFetch(`/api/admin/inquiries/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  await parseJsonResponse(res, 'Error al eliminar la solicitud');
}

export interface UploadProgress {
  percent: number;
  loaded: number;
  total: number;
  stage?: 'uploading' | 'processing' | 'completed';
  statusMessage?: string;
}

export interface UploadResult {
  fileUrl: string;
  thumbnailUrl?: string;
  type: 'video' | 'image';
  filename?: string;
  size?: number;
}

// Direct upload via XHR for smaller files (<15MB) with real-time progress
function uploadFileDirect(
  file: File,
  token: string,
  onProgress?: (progress: UploadProgress) => void
): Promise<UploadResult> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/admin/upload', true);
    xhr.setRequestHeader('Authorization', `Bearer ${token}`);

    if (xhr.upload && onProgress) {
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = Math.min(99, Math.round((event.loaded / event.total) * 100));
          onProgress({
            percent,
            loaded: event.loaded,
            total: event.total,
            stage: 'uploading',
            statusMessage: `Subiendo archivo: ${percent}%`,
          });
        }
      };
      xhr.upload.onload = () => {
        onProgress({
          percent: 100,
          loaded: file.size,
          total: file.size,
          stage: 'processing',
          statusMessage: 'Subida al 100%. Optimizando formato y generando miniatura...',
        });
      };
    }

    xhr.onload = () => {
      let json: any = {};
      try {
        json = JSON.parse(xhr.responseText);
      } catch {
        return reject(new Error('El servidor devolvió una respuesta no válida.'));
      }

      if (xhr.status >= 200 && xhr.status < 300 && json.success) {
        if (onProgress) {
          onProgress({
            percent: 100,
            loaded: file.size,
            total: file.size,
            stage: 'completed',
            statusMessage: '¡Vídeo procesado y listo para reproducir!',
          });
        }
        return resolve({
          fileUrl: json.fileUrl,
          thumbnailUrl: json.thumbnailUrl,
          type: json.type || 'video',
          filename: json.filename,
          size: json.size,
        });
      }

      const errMsg = json.error || `Error ${xhr.status}: No se pudo completar la subida.`;
      reject(new Error(errMsg));
    };

    xhr.onerror = () => {
      reject(new Error('Error de conexión al subir el archivo al servidor.'));
    };

    const formData = new FormData();
    formData.append('file', file);
    xhr.send(formData);
  });
}

// Memory-efficient chunked upload for large files up to 500MB
async function uploadFileInChunks(
  file: File,
  token: string,
  onProgress?: (progress: UploadProgress) => void
): Promise<UploadResult> {
  const CHUNK_SIZE = 8 * 1024 * 1024; // 8MB slices (prevents memory spikes)
  const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
  const uploadId = 'up-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9);

  let finalResult: UploadResult | null = null;

  for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
    const isLastChunk = chunkIndex === totalChunks - 1;
    const start = chunkIndex * CHUNK_SIZE;
    const end = Math.min(start + CHUNK_SIZE, file.size);
    // file.slice creates a zero-copy lightweight blob slice
    const chunkBlob = file.slice(start, end);

    const formData = new FormData();
    formData.append('uploadId', uploadId);
    formData.append('chunkIndex', String(chunkIndex));
    formData.append('totalChunks', String(totalChunks));
    formData.append('filename', file.name);
    formData.append('chunk', chunkBlob, file.name);

    if (isLastChunk && onProgress) {
      onProgress({
        percent: 99,
        loaded: end,
        total: file.size,
        stage: 'processing',
        statusMessage: 'Transferencia finalizada (99%). Optimizando vídeo (H.264 + FastStart)...',
      });
    }

    let attempts = 0;
    let success = false;

    while (attempts < 2 && !success) {
      attempts++;
      try {
        const res = await safeFetch('/api/admin/upload-chunk', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });

        const json = await parseJsonResponse<any>(res, 'Error al subir parte del archivo');
        if (json.success) {
          success = true;
          if (json.completed) {
            finalResult = {
              fileUrl: json.fileUrl,
              thumbnailUrl: json.thumbnailUrl,
              type: json.type || 'video',
              filename: json.filename,
              size: json.size,
            };
          }
        } else {
          throw new Error(json.error || 'Error en la parte del archivo.');
        }
      } catch (err: any) {
        if (attempts >= 2) throw err;
        await new Promise((r) => setTimeout(r, 600));
      }
    }

    if (onProgress && !isLastChunk) {
      const currentLoaded = end;
      const percent = Math.min(98, Math.round((currentLoaded / file.size) * 100));
      onProgress({
        percent,
        loaded: currentLoaded,
        total: file.size,
        stage: 'uploading',
        statusMessage: `Subiendo: ${percent}% (${(currentLoaded / (1024 * 1024)).toFixed(1)} MB de ${(file.size / (1024 * 1024)).toFixed(1)} MB)`,
      });
    }
  }

  if (!finalResult) {
    throw new Error('La carga por partes no devolvió el archivo finalizado.');
  }

  if (onProgress) {
    onProgress({
      percent: 100,
      loaded: file.size,
      total: file.size,
      stage: 'completed',
      statusMessage: '¡Vídeo optimizado y listo para reproducir!',
    });
  }

  return finalResult;
}

let cachedStorageStatus: { status: StorageStatus; timestamp: number } | null = null;

export async function fetchStorageStatus(): Promise<StorageStatus> {
  const token = getAdminToken();
  if (!token) {
    return {
      provider: 'local-disk',
      isBlobConfigured: false,
      platform: 'node',
      hasUploadsDir: true,
      message: 'Modo local de desarrollo activo en Google AI Studio.',
    };
  }

  if (cachedStorageStatus && Date.now() - cachedStorageStatus.timestamp < 30000) {
    return cachedStorageStatus.status;
  }

  try {
    const res = await safeFetch('/api/admin/storage-status', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const status = await parseJsonResponse<StorageStatus>(res, 'Error al consultar estado del almacenamiento');
    cachedStorageStatus = { status, timestamp: Date.now() };
    return status;
  } catch {
    return {
      provider: 'local-disk',
      isBlobConfigured: false,
      platform: 'node',
      hasUploadsDir: true,
      message: 'Almacenamiento local en disco activo.',
    };
  }
}

export async function uploadFile(
  file: File,
  onProgress?: (progress: UploadProgress) => void
): Promise<UploadResult> {
  const token = getAdminToken();
  if (!token) throw new Error('Sesión no válida. Por favor, inicia sesión en el panel antes de subir archivos.');

  // Check supported formats
  const allowedExts = /\.(jpeg|jpg|png|webp|gif|svg|heic|heif|avif|mp4|webm|mov|m4v|mkv|avi|3gp|hevc|ts)$/i;
  const isExtAllowed = allowedExts.test(file.name);
  const isMimeAllowed = Boolean(file.type && (file.type.startsWith('video/') || file.type.startsWith('image/')));

  if (!isExtAllowed && !isMimeAllowed) {
    throw new Error(
      `El formato de "${file.name}" no es compatible. Por favor, sube un vídeo (MP4, MOV de iPhone, WebM, M4V, MKV) o imagen (JPG, PNG, WebP) de hasta 500 MB.`
    );
  }

  const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500 MB
  if (file.size > MAX_FILE_SIZE) {
    const sizeInMB = (file.size / (1024 * 1024)).toFixed(1);
    throw new Error(
      `El archivo seleccionado supera el tamaño máximo permitido por el servidor (500 MB). Tamaño actual: ${sizeInMB} MB. Por favor, comprime el vídeo o utiliza un enlace externo.`
    );
  }

  // 1. Direct Cloud Upload ONLY if Vercel Blob is configured (bypasses Vercel Serverless 4.5MB limit, 100% persistent)
  try {
    const status = await fetchStorageStatus();
    if (status.isBlobConfigured) {
      if (onProgress) {
        onProgress({
          percent: 5,
          loaded: 0,
          total: file.size,
          stage: 'uploading',
          statusMessage: 'Iniciando carga directa al almacenamiento permanente Vercel Blob...',
        });
      }

      const isVideo =
        file.type.startsWith('video/') ||
        /\.(mp4|webm|mov|m4v|mkv|avi|3gp|hevc)$/i.test(file.name);

      const safeBaseName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const blobClientPathname = `uploads/marevas-${Date.now()}-${safeBaseName}`;

      const blob = await vercelBlobUpload(blobClientPathname, file, {
        access: 'public',
        handleUploadUrl: '/api/admin/blob-upload',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        onUploadProgress: (p) => {
          if (onProgress) {
            const pct = Math.min(99, Math.round(p.percentage));
            onProgress({
              percent: pct,
              loaded: p.loaded,
              total: p.total,
              stage: 'uploading',
              statusMessage: `Subiendo a Vercel Blob: ${pct}% (${(p.loaded / (1024 * 1024)).toFixed(1)} MB de ${(p.total / (1024 * 1024)).toFixed(1)} MB)`,
            });
          }
        },
      });

      if (onProgress) {
        onProgress({
          percent: 100,
          loaded: file.size,
          total: file.size,
          stage: 'completed',
          statusMessage: '¡Archivo guardado permanentemente en la nube!',
        });
      }

      return {
        fileUrl: blob.url,
        thumbnailUrl: isVideo ? '' : blob.url,
        type: isVideo ? 'video' : 'image',
        filename: blob.pathname,
        size: file.size,
      };
    }
  } catch (blobErr: any) {
    console.warn('[Storage] Vercel Blob no configurado o no disponible en este entorno, usando almacenamiento local:', blobErr);
  }

  // 2. Fallback to Local Express Server Upload (for local preview, Cloud Run, VPS)
  const CHUNK_THRESHOLD = 15 * 1024 * 1024;
  if (file.size > CHUNK_THRESHOLD) {
    return uploadFileInChunks(file, token, onProgress);
  }

  return uploadFileDirect(file, token, onProgress);
}

export async function resetDemoData(): Promise<SiteData> {
  const token = getAdminToken();
  if (!token) throw new Error('Sesión no válida.');
  const res = await safeFetch('/api/admin/reset-demo', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
  const json = await parseJsonResponse<{ success: boolean; data: SiteData }>(res, 'Error al reiniciar los datos de demostración');
  return json.data;
}

export async function changeAdminPassword(newPassword: string): Promise<void> {
  const token = getAdminToken();
  if (!token) throw new Error('Sesión no válida.');
  const res = await safeFetch('/api/admin/password', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ newPassword }),
  });
  await parseJsonResponse(res, 'Error al cambiar la contraseña');
}
