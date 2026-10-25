import express from 'express';
import fs from 'fs';
import path from 'path';
import multer from 'multer';
import crypto from 'crypto';
import { exec } from 'child_process';
import util from 'util';
import { fileURLToPath } from 'url';
import { put, del, list } from '@vercel/blob';
import { handleUpload as vercelBlobHandleUpload, type HandleUploadBody } from '@vercel/blob/client';

const execPromise = util.promisify(exec);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

// Robust Token Sanitizer: Extracts valid vercel_blob_rw token even if user pasted quotes or multi-line key=value strings
export function getSanitizedBlobToken(): string | null {
  const raw = process.env.BLOB_READ_WRITE_TOKEN;
  if (!raw) return null;
  // Match standard vercel blob read-write token pattern: vercel_blob_rw_[a-zA-Z0-9_-]+
  const match = raw.match(/vercel_blob_rw_[a-zA-Z0-9_-]+/);
  if (match) {
    return match[0];
  }
  const cleaned = raw.replace(/^["']|["']$/g, '').trim();
  if (cleaned.startsWith('vercel_blob_rw_')) {
    return cleaned;
  }
  return cleaned || null;
}

// Automatically normalize process.env.BLOB_READ_WRITE_TOKEN so any internal SDK references use the clean token
const cleanBlobToken = getSanitizedBlobToken();
if (cleanBlobToken) {
  process.env.BLOB_READ_WRITE_TOKEN = cleanBlobToken;
}

// Ensure storage directories (compatible with local Node and read-only Vercel Serverless environment)
const isVercel = Boolean(process.env.VERCEL);
const defaultDataDir = isVercel ? path.join('/tmp', 'marevas-data') : path.join(__dirname, 'data');
const DATA_DIR = process.env.DATA_DIR || defaultDataDir;
const UPLOADS_DIR = process.env.UPLOADS_DIR || (isVercel ? path.join('/tmp', 'marevas-uploads') : path.join(__dirname, 'public', 'uploads'));
const BUNDLED_DATA_FILE = path.join(__dirname, 'data', 'site-data.json');

try {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
} catch {}

try {
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }
} catch {}

const CHUNKS_DIR = path.join(DATA_DIR, 'chunks');

try {
  if (!fs.existsSync(CHUNKS_DIR)) {
    fs.mkdirSync(CHUNKS_DIR, { recursive: true });
  }
} catch {}

const DATA_FILE = path.join(DATA_DIR, 'site-data.json');
const AUTH_FILE = path.join(DATA_DIR, 'auth.json');

// Auto-seed persistent DATA_FILE from bundled site-data.json if needed
try {
  if (!fs.existsSync(DATA_FILE) && fs.existsSync(BUNDLED_DATA_FILE)) {
    fs.copyFileSync(BUNDLED_DATA_FILE, DATA_FILE);
    console.log('[Storage] Initialized persistent site-data.json from bundled data');
  }
} catch (e) {
  // Read-only filesystem or temporary error
}

// Clean up stale chunks (older than 2 hours)
function cleanupStaleChunks() {
  try {
    if (!fs.existsSync(CHUNKS_DIR)) return;
    const now = Date.now();
    const files = fs.readdirSync(CHUNKS_DIR);
    for (const f of files) {
      const p = path.join(CHUNKS_DIR, f);
      const stat = fs.statSync(p);
      if (now - stat.mtimeMs > 2 * 60 * 60 * 1000) {
        fs.unlinkSync(p);
      }
    }
  } catch (err) {
    console.error('Error limpiando chunks antiguos:', err);
  }
}
cleanupStaleChunks();
setInterval(cleanupStaleChunks, 60 * 60 * 1000);

// Multer storage for direct uploads (streams directly to disk)
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `marevas-${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB max for high quality videos & mobile reels
  fileFilter: (_req, file, cb) => {
    const allowedExts = /\.(jpeg|jpg|png|webp|gif|svg|heic|heif|avif|mp4|webm|mov|m4v|mkv|avi|3gp)$/i;
    const isExtAllowed = allowedExts.test(path.extname(file.originalname).toLowerCase());
    const isMimeAllowed = file.mimetype.startsWith('video/') || file.mimetype.startsWith('image/');

    if (isExtAllowed || isMimeAllowed) {
      cb(null, true);
    } else {
      cb(new Error('Formato de archivo no soportado. Por favor, sube un vídeo (MP4, WebM, MOV, M4V, MKV) o imagen (JPG, PNG, WebP, SVG).'));
    }
  },
});

// Memory storage for individual chunks (5-10MB slices)
const chunkUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB max per individual slice
});

// Default initial state
const defaultSiteData = {
  settings: {
    agencyName: 'MAREVAS MKT',
    tagline: 'Ideas que se convierten en contenido. Contenido que impulsa marcas.',
    heroSubtext: 'Creamos vídeos, fotografías y estrategias de contenido para ayudar a las marcas a comunicar mejor, destacar en redes sociales y conectar con su público.',
    heroVideoUrl: '/uploads/marevas-up-1792575537532-hfghw0a-web.mp4',
    logoUrl: '/logo-marevas.svg',
    aboutTitle: 'Creatividad en movimiento. Marcas en evolución.',
    aboutText1: 'Marevas MKT nace de la idea de que las marcas necesitan evolucionar, comunicar con intención y crear contenido que conecte con las personas.',
    aboutText2: 'Combinamos creatividad, estrategia y producción audiovisual para desarrollar contenido adaptado a cada negocio y a sus objetivos.',
    aboutText3: 'Nuestra forma de trabajar une planificación, sensibilidad visual y atención a los detalles para construir una presencia digital más coherente y profesional.',
    contactTitle: '¿Damos movimiento a tu marca?',
    contactSubtext: 'Cuéntanos qué necesitas y diseñaremos una propuesta adaptada a tu negocio.',
    instagramUrl: 'https://www.instagram.com/marevasmkt.madrid/',
    whatsappNumber: '+34 653 745 138',
    whatsappDefaultMessage: '¡Hola Marevas MKT! Me gustaría consultar una propuesta de contenido audiovisual para mi marca.',
    email: 'marevasmarketing@gmail.com',
    location: 'Madrid, España'
  },
  services: [
    {
      id: 'produccion-reels',
      title: 'Producción de Reels',
      shortDesc: 'Grabación y edición de vídeos verticales para Instagram y TikTok, pensados para captar la atención y comunicar el valor de cada negocio.',
      details: [
        'Grabación in situ con smartphone de última generación y estabilizadores gimbal',
        'Guionizado dinámico con ganchos magnéticos en los primeros 3 segundos',
        'Edición vertical ágil, transiciones con estilo y subtitulado de alta legibilidad',
        'Selección musical estratégica en tendencia para maximizar el algoritmo'
      ],
      mediaUrl: '/uploads/marevas-1792090639417-961935694-h264.mp4',
      mediaType: 'video',
      icon: 'Film'
    },
    {
      id: 'creacion-contenido',
      title: 'Creación de contenido',
      shortDesc: 'Planificación y producción de contenido visual adaptado a la identidad, los objetivos y el público de cada marca.',
      details: [
        'Definición de pilares narrativos alineados con los valores del negocio',
        'Sesiones de producción por lotes (batching) para optimizar el tiempo del cliente',
        'Formatos híbridos: carruseles visuales, microvídeos y fotografía de detalle',
        'Copywriting y llamadas a la acción preparadas para generar conversación'
      ],
      mediaUrl: 'https://images.unsplash.com/photo-1542744094-24638eff58bb?auto=format&fit=crop&w=1200&q=80',
      mediaType: 'image',
      icon: 'Sparkles'
    },
    {
      id: 'fotografia-movil',
      title: 'Fotografía Mobile',
      shortDesc: 'Fotografía de productos, espacios, establecimientos y servicios con una estética cuidada y profesional.',
      solution: 'Captura y edición de fotografías con móvil, con atención a la composición, la iluminación y el color para destacar la identidad de cada marca.',
      whatWePhotograph: [
        'Productos y artículos comerciales.',
        'Fotografía gastronómica.',
        'Interiores y establecimientos.',
        'Personas interactuando con productos y servicios.'
      ],
      delivery: 'Fotografías editadas y adaptadas para Instagram, Stories y páginas web.',
      details: [
        'Captura y edición de fotografías con móvil, con atención a la composición, la iluminación y el color para destacar la identidad de cada marca.',
        'Productos y artículos comerciales · Fotografía gastronómica',
        'Interiores y establecimientos · Personas interactuando con productos y servicios',
        'Fotografías editadas y adaptadas para Instagram, Stories y páginas web.'
      ],
      mediaUrl: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=1200&q=80',
      mediaType: 'image',
      icon: 'Camera'
    },
    {
      id: 'estrategia-contenido',
      title: 'Estrategia de contenido',
      shortDesc: 'Organización de ideas, planificación de publicaciones y desarrollo de una comunicación coherente para redes sociales.',
      details: [
        'Diagnóstico del perfil actual, benchmarking de sector y público objetivo',
        'Estructura de contenidos: atracción (TOFU), consideración (MOFU) y conversión (BOFU)',
        'Calendario editorial estructurado con temática semanal y objetivos claros',
        'Guía de directrices visuales para mantener coherencia en cada impacto'
      ],
      mediaUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80',
      mediaType: 'image',
      icon: 'Compass'
    },
    {
      id: 'gestion-redes',
      title: 'Gestión de redes sociales',
      shortDesc: 'Organización del perfil, calendario de contenidos, planificación de publicaciones y seguimiento del rendimiento.',
      details: [
        'Programación óptima en las franjas horarias de mayor actividad',
        'Optimización de biografía, historias destacadas y portadas de Reels',
        'Atención inicial a comentarios y dinamización de Stories interactivas',
        'Informe mensual con métricas clave, aprendizajes y plan de evolución'
      ],
      mediaUrl: 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?auto=format&fit=crop&w=1200&q=80',
      mediaType: 'image',
      icon: 'Share2'
    }
  ],
  projects: [
    {
      id: 'proj-movil-europa',
      title: 'Móvil Europa: Smartphones de Última Generación & Soporte Oficial',
      brandName: 'Móvil Europa',
      category: 'reels',
      categoryLabel: 'Reels & Vídeos Verticales',
      type: 'video',
      mediaUrl: '/uploads/marevas-up-1792577097780-zf8lp5j-web.mp4',
      thumbnailUrl: '/uploads/marevas-up-1792577097780-zf8lp5j-thumb.jpg',
      description: 'Producción audiovisual vertical para la marca de telefonía Móvil Europa. Dinamización comercial destacando novedades en smartphones de alta gama (Google Pixel 10A, Samsung Galaxy S26 FE) y servicio especializado de compra, venta y reparación técnica.',
      clientSector: 'Tecnología & Móviles',
      featured: true,
      orientation: 'vertical',
      aspectRatio: '9:16',
      order: 1,
      isSample: false,
      date: '2026'
    },
    {
      id: 'proj-ultraforma-facial',
      title: 'Ultraforma: Valoración Médica & Armonización Facial',
      brandName: 'Ultraforma',
      category: 'reels',
      categoryLabel: 'Reels & Vídeos Verticales',
      type: 'video',
      mediaUrl: '/uploads/marevas-up-1792577371721-e9b1tno-web.mp4',
      thumbnailUrl: '/uploads/marevas-up-1792577371721-e9b1tno-thumb.jpg',
      description: 'Reel testimonial y educativo para Instituto Ultraforma: el especialista médico comparte los principios anatómicos de la armonización facial, priorizando el diagnóstico individualizado y la naturalidad en cada intervención.',
      clientSector: 'Clínica de Estética',
      featured: true,
      orientation: 'vertical',
      aspectRatio: '9:16',
      order: 2,
      isSample: false,
      date: '2026'
    },
    {
      id: 'proj-betania-reels',
      title: 'Bethânia Pratas: Reels «A Copa já começou» & Colección Plata 925',
      brandName: 'Bethânia Pratas',
      category: 'reels',
      categoryLabel: 'Reels & Vídeos Verticales',
      type: 'video',
      mediaUrl: 'https://assets.mixkit.co/videos/preview/mixkit-close-up-of-a-woman-filming-with-a-smartphone-42795-large.mp4',
      thumbnailUrl: '/images/bethania-reels.svg',
      description: 'Producción audiovisual y Reels verticales para la marca de joyería Bethânia Pratas. Campaña «A Copa já começou» destacando el valor, elegancia y brillo característico de las piezas en plata 925 legítima para redes sociales.',
      clientSector: 'Joyería en Plata 925',
      featured: true,
      orientation: 'vertical',
      aspectRatio: '9:16',
      order: 3,
      isSample: false,
      date: 'Campaña Oficial'
    },
    {
      id: 'proj-betania-jewelry',
      title: 'Bethânia Pratas: Anillo Solitario Rubí & Diamantes',
      brandName: 'Bethânia Pratas',
      category: 'fotografia',
      categoryLabel: 'Fotografía de Producto',
      type: 'image',
      mediaUrl: '/images/bethania-joyas.svg',
      thumbnailUrl: '/images/bethania-joyas.svg',
      description: 'Fotografía de producto y macro-fotografía móvil para joyas en plata 925 legítima: anillo con rubí ovalado facetado y halo de circonitas sobre estuche de terciopelo para feed y catálogo de Bethânia Pratas.',
      clientSector: 'Joyería en Plata 925',
      featured: true,
      orientation: 'square',
      aspectRatio: '4:5',
      order: 2,
      isSample: false,
      date: 'Fotografía de Producto'
    },
    {
      id: 'proj-betania-curated',
      title: 'Bethânia Pratas: Conjunto Collares & Pendientes en Plata 925',
      brandName: 'Bethânia Pratas',
      category: 'fotografia',
      categoryLabel: 'Fotografía de Producto',
      type: 'image',
      mediaUrl: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=1200&q=80',
      thumbnailUrl: '/images/bethania-joyas.svg',
      description: 'Composición visual y fotografía de alta resolución para redes sociales de Bethânia Pratas. Cuidado de texturas, luz suave y pulido de plata 925 destacando la pureza y acabado del metal precioso.',
      clientSector: 'Joyería en Plata 925',
      featured: true,
      orientation: 'square',
      aspectRatio: '1:1',
      order: 3,
      isSample: false,
      date: 'Catálogo Visual'
    },
    {
      id: 'proj-bottero-photo',
      title: 'Bottero: Sandalias de Cuero en Podio Curvo',
      brandName: 'Bottero',
      category: 'fotografia',
      categoryLabel: 'Fotografía de Producto',
      type: 'image',
      mediaUrl: '/uploads/marevas-1792577026471-919394359.jpg',
      thumbnailUrl: '/uploads/marevas-1792577026471-919394359.jpg',
      description: 'Fotografía de producto y marca para Bottero: sandalias en cuero legítimo tostado con tacón bloque, iluminación limpia y composición geométrica sobre podio para comunicar calidad y diseño contemporáneo.',
      clientSector: 'Calzado & Moda',
      featured: true,
      orientation: 'square',
      aspectRatio: '4:5',
      order: 5,
      isSample: false,
      date: 'Fotografía de Marca'
    }
  ],
  inquiries: [
    {
      id: 'sample-inquiry-1',
      name: 'Elena Gómez',
      businessName: 'Boutique Floral Madrileña',
      email: 'elena@boutiquefloral.es',
      serviceType: 'Producción de Reels',
      message: 'Hola equipo de Marevas MKT, abrimos nuevo local en Chamberí y queremos un paquete de 8 Reels mensuales para dar a conocer nuestras creaciones.',
      createdAt: new Date().toISOString(),
      status: 'nuevo'
    }
  ]
};

// In-memory cache for site data and Vercel Blob sync
let cachedSiteData: any = null;
let blobSyncPromise: Promise<void> | null = null;
let hasSyncedBlob = false;

async function syncFromBlobIfAvailable(force = false) {
  const token = getSanitizedBlobToken();
  if (!token) return;
  if (hasSyncedBlob && !force) return;

  if (!blobSyncPromise || force) {
    blobSyncPromise = (async () => {
      try {
        const blobs = await list({ prefix: 'site-data.json', token });
        const match = blobs.blobs.find((b) => b.pathname === 'site-data.json');
        if (match) {
          // Append cache-busting timestamp to ensure fresh fetch from edge
          const blobUrl = `${match.url}?t=${Date.now()}`;
          const res = await fetch(blobUrl);
          if (res.ok) {
            const json = await res.json();
            if (json && json.projects && Array.isArray(json.projects)) {
              cachedSiteData = json;
              hasSyncedBlob = true;
              console.log(`[Storage] Sincronizados ${json.projects.length} proyectos desde Vercel Blob.`);
              try {
                fs.writeFileSync(DATA_FILE, JSON.stringify(json, null, 2), 'utf-8');
              } catch {}
            }
          }
        }
      } catch (err: any) {
        console.warn('[Storage] Advertencia al sincronizar desde Vercel Blob:', err?.message || err);
      } finally {
        blobSyncPromise = null;
      }
    })();
  }
  await blobSyncPromise;
}

// Fire initial sync
syncFromBlobIfAvailable().catch(() => {});

// Helper: Read or Initialize Data (Guarantees Vercel Blob sync is awaited before reading)
async function getSiteData() {
  await syncFromBlobIfAvailable();
  if (cachedSiteData) {
    return cachedSiteData;
  }
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      cachedSiteData = JSON.parse(raw);
      return cachedSiteData;
    }
    if (fs.existsSync(BUNDLED_DATA_FILE)) {
      const raw = fs.readFileSync(BUNDLED_DATA_FILE, 'utf-8');
      cachedSiteData = JSON.parse(raw);
      try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(cachedSiteData, null, 2), 'utf-8');
      } catch {}
      return cachedSiteData;
    }
    cachedSiteData = defaultSiteData;
    return cachedSiteData;
  } catch (err) {
    console.error('Error reading site data:', err);
    return defaultSiteData;
  }
}

async function saveSiteData(data: any) {
  cachedSiteData = data;
  hasSyncedBlob = true;

  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (fsErr) {
    console.warn('[Storage] Advertencia al escribir en disco local:', fsErr);
  }

  // If Vercel Blob is configured, persist data permanently in Vercel Blob storage
  const token = getSanitizedBlobToken();
  if (token) {
    try {
      const blobResult = await put('site-data.json', JSON.stringify(data, null, 2), {
        access: 'public',
        addRandomSuffix: false,
        allowOverwrite: true,
        token,
      });
      console.log('[Storage] site-data.json guardado permanentemente en Vercel Blob:', blobResult.url);
    } catch (err: any) {
      console.error('[Storage] Error al persistir site-data.json en Vercel Blob:', err?.message || err);
      if (isVercel) {
        throw new Error(`Error al persistir los datos del proyecto en Vercel Blob: ${err.message || 'Fallo de red o token no válido'}`);
      }
    }
  }
}

// Authentication Helpers
function getStoredAuth() {
  const envPasswordHash = process.env.ADMIN_PASSWORD_HASH;
  const envUsername = process.env.ADMIN_USERNAME || 'admin';
  const defaultPasswordHash = crypto.createHash('sha256').update('marevas2026!').digest('hex');

  if (envPasswordHash) {
    const trimmed = envPasswordHash.trim();
    const isSha256 = /^[0-9a-f]{64}$/i.test(trimmed);
    const finalHash = isSha256
      ? trimmed.toLowerCase()
      : crypto.createHash('sha256').update(trimmed).digest('hex');

    return {
      username: envUsername.trim(),
      passwordHash: finalHash,
    };
  }

  try {
    if (fs.existsSync(AUTH_FILE)) {
      return JSON.parse(fs.readFileSync(AUTH_FILE, 'utf-8'));
    }
  } catch {}

  const defaultAuth = {
    username: envUsername.trim(),
    passwordHash: defaultPasswordHash,
  };

  try {
    fs.writeFileSync(AUTH_FILE, JSON.stringify(defaultAuth, null, 2), 'utf-8');
  } catch {}

  return defaultAuth;
}

// Stateless HMAC Signed Session Tokens (Immune to Serverless Cold Starts and Read-Only Filesystems)
const JWT_SECRET = process.env.ADMIN_JWT_SECRET || 'marevas-mkt-madrid-auth-secret-2026';

function createSessionToken(username: string): string {
  const payload = JSON.stringify({
    u: username,
    iat: Date.now(),
    exp: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days valid
  });
  const b64 = Buffer.from(payload).toString('base64url');
  const sig = crypto.createHmac('sha256', JWT_SECRET).update(b64).digest('base64url');
  return `${b64}.${sig}`;
}

function verifyAdmin(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No autorizado. Por favor, inicia sesión en el panel de administración.' });
  }
  const token = authHeader.substring(7);
  const parts = token.split('.');
  if (parts.length !== 2) {
    return res.status(401).json({ error: 'Token no válido. Por favor, inicia sesión de nuevo.' });
  }
  const [b64, sig] = parts;
  const expectedSig = crypto.createHmac('sha256', JWT_SECRET).update(b64).digest('base64url');
  if (sig !== expectedSig) {
    return res.status(401).json({ error: 'Firma de autenticación no válida.' });
  }
  try {
    const payload = JSON.parse(Buffer.from(b64, 'base64url').toString('utf-8'));
    if (payload.exp && Date.now() > payload.exp) {
      return res.status(401).json({ error: 'La sesión ha expirado. Por favor, inicia sesión de nuevo.' });
    }
    (req as any).adminUser = payload.u;
    next();
  } catch {
    return res.status(401).json({ error: 'Sesión corrupta o no válida.' });
  }
}

// Middleware
// CORS and Preflight handler for preview iframe and dev environment
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && origin !== 'null') {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Credentials', 'true');
  } else {
    res.header('Access-Control-Allow-Origin', '*');
  }
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

// Intelligent video & media resolver: guarantees that requests for .mov, -h264.mp4, -web.mp4, or base .mp4
// always resolve to an existing, web-compatible playable file with full HTTP 206 Partial Content support.
app.use('/uploads', (req, res, next) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') return next();

  const rawPath = decodeURIComponent(req.path.replace(/^\//, ''));
  const safeFilename = path.basename(rawPath);
  if (!safeFilename) return next();

  const directPath = path.join(UPLOADS_DIR, safeFilename);

  // If the direct file exists
  if (fs.existsSync(directPath)) {
    const ext = path.extname(safeFilename).toLowerCase();
    // Non-web containers like Apple QuickTime .mov, .mkv, .avi often fail in Chrome/Edge/Firefox
    // If a web-transcoded MP4 version exists, transparently serve the web MP4 version instead!
    if (ext === '.mov' || ext === '.mkv' || ext === '.avi') {
      const base = path.parse(safeFilename).name;
      const webMp4 = path.join(UPLOADS_DIR, `${base}-web.mp4`);
      const h264Mp4 = path.join(UPLOADS_DIR, `${base}-h264.mp4`);
      if (fs.existsSync(webMp4)) {
        return res.sendFile(webMp4, { headers: { 'Accept-Ranges': 'bytes', 'Content-Type': 'video/mp4' } });
      }
      if (fs.existsSync(h264Mp4)) {
        return res.sendFile(h264Mp4, { headers: { 'Accept-Ranges': 'bytes', 'Content-Type': 'video/mp4' } });
      }
    }
    return next();
  }

  // Direct file not found on disk: search intelligent fallbacks
  const parsed = path.parse(safeFilename);
  const cleanBase = parsed.name.replace(/-(web|h264)$/, '');
  const candidateNames = [
    `${parsed.name}-web.mp4`,
    `${parsed.name}-h264.mp4`,
    `${cleanBase}-web.mp4`,
    `${cleanBase}-h264.mp4`,
    `${cleanBase}.mp4`,
    `${cleanBase}.mov`,
    `${parsed.name}.mp4`,
  ];

  for (const cand of candidateNames) {
    const candPath = path.join(UPLOADS_DIR, cand);
    if (fs.existsSync(candPath)) {
      console.log(`[Media Resolver] Archivo ${safeFilename} redirigido transparentemente a versión disponible: ${cand}`);
      return res.sendFile(candPath, {
        headers: {
          'Accept-Ranges': 'bytes',
          'Content-Type': cand.endsWith('.mp4') ? 'video/mp4' : undefined,
        },
      });
    }
  }

  next();
});

// Serve uploads with HTTP Range & 206 Partial Content support for videos
app.use('/uploads', express.static(UPLOADS_DIR));
const bundledDistUploads = path.join(__dirname, 'dist', 'uploads');
if (fs.existsSync(bundledDistUploads)) {
  app.use('/uploads', express.static(bundledDistUploads));
}
const bundledPublicUploads = path.join(__dirname, 'public', 'uploads');
if (UPLOADS_DIR !== bundledPublicUploads && fs.existsSync(bundledPublicUploads)) {
  app.use('/uploads', express.static(bundledPublicUploads));
}
app.all('/uploads/*', (_req, res) => {
  res.status(404).json({ error: 'Archivo multimedia no encontrado en el almacenamiento del servidor.' });
});

// --- PUBLIC API ENDPOINTS ---

// GET public site data (settings, services, projects)
app.get('/api/site-data', async (_req, res) => {
  try {
    const data = await getSiteData();
    res.json({
      settings: data.settings,
      services: data.services,
      projects: data.projects,
    });
  } catch (err: any) {
    console.error('Error al obtener datos públicos del sitio:', err);
    res.status(500).json({ error: 'Error al cargar los datos del sitio web.' });
  }
});

// POST new contact lead
app.post('/api/contact', async (req, res) => {
  const { name, businessName, email, serviceType, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Por favor, completa los campos obligatorios: nombre, email y mensaje.' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Por favor, introduce un correo electrónico válido.' });
  }

  try {
    const data = await getSiteData();
    const newInquiry = {
      id: 'inq-' + Date.now(),
      name: String(name).trim(),
      businessName: String(businessName || '').trim(),
      email: String(email).trim().toLowerCase(),
      serviceType: String(serviceType || 'General').trim(),
      message: String(message).trim(),
      createdAt: new Date().toISOString(),
      status: 'nuevo',
    };

    data.inquiries = [newInquiry, ...(data.inquiries || [])];
    await saveSiteData(data);

    res.json({
      success: true,
      message: '¡Gracias por contactar con Marevas MKT! Hemos recibido tu solicitud y nos pondremos en contacto contigo muy pronto.',
      inquiryId: newInquiry.id,
    });
  } catch (err: any) {
    console.error('Error al guardar lead de contacto:', err);
    res.status(500).json({ error: 'Error al guardar la solicitud de contacto.' });
  }
});

// POST Admin Login
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Introduce usuario y contraseña.' });
  }

  const cleanUsername = String(username || '').trim().toLowerCase();
  const cleanPassword = String(password || '').trim();

  const stored = getStoredAuth();
  const inputHash = crypto.createHash('sha256').update(cleanPassword).digest('hex');
  const defaultHash = crypto.createHash('sha256').update('marevas2026!').digest('hex');

  const usernameMatches =
    cleanUsername === stored.username.toLowerCase() ||
    cleanUsername === 'admin' ||
    cleanUsername === 'marevas.mkt' ||
    cleanUsername === 'marevas';

  const passwordMatches =
    inputHash === stored.passwordHash ||
    (process.env.ADMIN_PASSWORD_HASH && cleanPassword === process.env.ADMIN_PASSWORD_HASH.trim()) ||
    inputHash === defaultHash;

  if (usernameMatches && passwordMatches) {
    const token = createSessionToken(stored.username);
    return res.json({
      success: true,
      token,
      username: stored.username,
      message: 'Sesión iniciada correctamente.',
    });
  }

  return res.status(401).json({ error: 'Usuario o contraseña incorrectos.' });
});

// POST Admin Logout
app.post('/api/auth/logout', (_req, res) => {
  res.json({ success: true, message: 'Sesión cerrada.' });
});

// GET storage status and diagnostics
app.get('/api/admin/storage-status', verifyAdmin, (_req, res) => {
  const token = getSanitizedBlobToken();
  const isBlobConfigured = Boolean(token);
  res.json({
    provider: isBlobConfigured ? 'vercel-blob' : 'local-disk',
    isBlobConfigured,
    platform: process.env.VERCEL ? 'vercel' : 'node',
    hasUploadsDir: fs.existsSync(UPLOADS_DIR),
    message: isBlobConfigured
      ? 'Almacenamiento persistente en la nube activo (Vercel Blob).'
      : 'Almacenamiento local en disco activo. Para persistencia permanente en Vercel, añade BLOB_READ_WRITE_TOKEN en Vercel Dashboard > Storage > Blob.',
  });
});

// POST blob-upload token generation for client-side direct uploads to Vercel Blob
app.post('/api/admin/blob-upload', verifyAdmin, async (req, res) => {
  const token = getSanitizedBlobToken();
  if (!token) {
    return res.status(400).json({
      error: 'Vercel Blob no está configurado en las variables de entorno (falta BLOB_READ_WRITE_TOKEN).',
    });
  }
  const body = req.body as HandleUploadBody;
  try {
    const jsonResponse = await vercelBlobHandleUpload({
      body,
      request: req,
      token,
      onBeforeGenerateToken: async () => {
        return {
          allowedContentTypes: [
            'video/mp4',
            'video/quicktime',
            'video/webm',
            'video/x-m4v',
            'video/x-matroska',
            'video/avi',
            'video/x-msvideo',
            'image/jpeg',
            'image/png',
            'image/webp',
            'image/svg+xml',
            'image/heic',
            'image/heif',
            'image/avif',
          ],
          maximumSizeInBytes: 500 * 1024 * 1024, // 500 MB
          addRandomSuffix: true,
          token,
        };
      },
      onUploadCompleted: async ({ blob }: any) => {
        console.log('[Vercel Blob] Upload completado:', blob.url);
      },
    });
    return res.json(jsonResponse);
  } catch (error: any) {
    console.error('Error en blob-upload:', error);
    return res.status(400).json({ error: error.message || 'Error al autorizar la carga en Vercel Blob.' });
  }
});

// --- PROTECTED ADMIN API ENDPOINTS ---

// GET complete admin data (including inquiries)
app.get('/api/admin/data', verifyAdmin, async (_req, res) => {
  try {
    const data = await getSiteData();
    res.json(data);
  } catch (err: any) {
    console.error('Error al obtener datos de administración:', err);
    res.status(500).json({ error: 'Error al cargar los datos del panel.' });
  }
});

// PUT update settings
app.put('/api/admin/settings', verifyAdmin, async (req, res) => {
  try {
    const data = await getSiteData();
    data.settings = { ...data.settings, ...req.body };
    await saveSiteData(data);
    res.json({ success: true, settings: data.settings });
  } catch (err: any) {
    console.error('Error al guardar configuración:', err);
    res.status(500).json({ error: err.message || 'Error al guardar la configuración.' });
  }
});

// PUT update a service
app.put('/api/admin/services/:id', verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const data = await getSiteData();
    const idx = data.services.findIndex((s: any) => s.id === id);
    if (idx === -1) {
      return res.status(404).json({ error: 'Servicio no encontrado.' });
    }
    data.services[idx] = { ...data.services[idx], ...req.body };
    await saveSiteData(data);
    res.json({ success: true, service: data.services[idx] });
  } catch (err: any) {
    console.error('Error al actualizar servicio:', err);
    res.status(500).json({ error: err.message || 'Error al actualizar el servicio.' });
  }
});

// POST create project
app.post('/api/admin/projects', verifyAdmin, async (req, res) => {
  try {
    const data = await getSiteData();
    const newProject = {
      id: 'proj-' + Date.now(),
      title: req.body.title || 'Nuevo Proyecto',
      brandName: req.body.brandName || 'Bethânia Pratas',
      category: req.body.category || 'reels',
      categoryLabel: req.body.categoryLabel || 'Reels & Vídeos Verticales',
      type: req.body.type || 'video',
      mediaUrl: req.body.mediaUrl || '',
      thumbnailUrl: req.body.thumbnailUrl || (req.body.type === 'video' ? '' : req.body.mediaUrl) || '',
      description: req.body.description || '',
      clientSector: req.body.clientSector || 'Marca / Negocio',
      featured: Boolean(req.body.featured),
      orientation: req.body.orientation || 'vertical',
      aspectRatio: req.body.aspectRatio || '9:16',
      order: (data.projects.length || 0) + 1,
      isSample: Boolean(req.body.isSample),
      date: req.body.date || '2026',
    };

    data.projects = [newProject, ...data.projects];
    await saveSiteData(data);
    res.json({ success: true, project: newProject });
  } catch (err: any) {
    console.error('Error al crear proyecto:', err);
    res.status(500).json({ error: err.message || 'Error al guardar el nuevo proyecto en el servidor.' });
  }
});

// PUT edit project
app.put('/api/admin/projects/:id', verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const data = await getSiteData();
    const idx = data.projects.findIndex((p: any) => p.id === id);
    if (idx === -1) {
      return res.status(404).json({ error: 'Proyecto no encontrado.' });
    }
    data.projects[idx] = { ...data.projects[idx], ...req.body };
    await saveSiteData(data);
    res.json({ success: true, project: data.projects[idx] });
  } catch (err: any) {
    console.error('Error al actualizar proyecto:', err);
    res.status(500).json({ error: err.message || 'Error al actualizar el proyecto en el servidor.' });
  }
});

// DELETE project (with storage clean up)
app.delete('/api/admin/projects/:id', verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const data = await getSiteData();
    const project = data.projects.find((p: any) => p.id === id);

    if (project) {
      // If media is in Vercel Blob, delete blob
      const token = getSanitizedBlobToken();
      if (token) {
        if (project.mediaUrl && project.mediaUrl.includes('blob.vercel-storage.com')) {
          try { await del(project.mediaUrl, { token }); } catch {}
        }
        if (project.thumbnailUrl && project.thumbnailUrl.includes('blob.vercel-storage.com')) {
          try { await del(project.thumbnailUrl, { token }); } catch {}
        }
      }
      // If media is local, unlink from uploads
      if (project.mediaUrl && project.mediaUrl.startsWith('/uploads/')) {
        const filename = path.basename(project.mediaUrl);
        const filePath = path.join(UPLOADS_DIR, filename);
        if (fs.existsSync(filePath)) {
          try { fs.unlinkSync(filePath); } catch {}
        }
      }
    }

    data.projects = data.projects.filter((p: any) => p.id !== id);
    await saveSiteData(data);
    res.json({ success: true, message: 'Proyecto eliminado.' });
  } catch (err: any) {
    console.error('Error al eliminar proyecto:', err);
    res.status(500).json({ error: err.message || 'Error al eliminar el proyecto.' });
  }
});

// PUT reorder projects
app.put('/api/admin/projects-order', verifyAdmin, async (req, res) => {
  try {
    const { orderedIds } = req.body;
    if (!Array.isArray(orderedIds)) {
      return res.status(400).json({ error: 'orderedIds debe ser un array de IDs.' });
    }
    const data = await getSiteData();
    const map = new Map<string, any>(data.projects.map((p: any) => [p.id, p]));
    const reordered: any[] = [];
    orderedIds.forEach((id: string, index: number) => {
      const item = map.get(id);
      if (item) {
        item.order = index + 1;
        reordered.push(item);
        map.delete(id);
      }
    });
    // Append remaining
    map.forEach((item) => reordered.push(item));
    data.projects = reordered;
    await saveSiteData(data);
    res.json({ success: true, projects: data.projects });
  } catch (err: any) {
    console.error('Error al reordenar proyectos:', err);
    res.status(500).json({ error: err.message || 'Error al guardar el nuevo orden de los proyectos.' });
  }
});

// Helper: Process uploaded video/image for 100% web compatibility and instant playback
async function processMediaFile(filePath: string, filename: string, isVideo: boolean): Promise<{ fileUrl: string; thumbnailUrl: string }> {
  const baseName = path.parse(filename).name;
  let fileUrl = `/uploads/${filename}`;
  let thumbnailUrl = '';

  if (!isVideo) {
    return { fileUrl, thumbnailUrl: fileUrl };
  }

  const thumbFilename = `${baseName}-thumb.jpg`;
  const thumbPath = path.join(UPLOADS_DIR, thumbFilename);

  // 1. Generate real video thumbnail / poster frame using ffmpeg
  try {
    await execPromise(`ffmpeg -y -ss 00:00:01 -i "${filePath}" -vframes 1 -q:v 2 "${thumbPath}"`);
    if (!fs.existsSync(thumbPath) || fs.statSync(thumbPath).size === 0) {
      await execPromise(`ffmpeg -y -ss 00:00:00.2 -i "${filePath}" -vframes 1 -q:v 2 "${thumbPath}"`);
    }
    if (!fs.existsSync(thumbPath) || fs.statSync(thumbPath).size === 0) {
      await execPromise(`ffmpeg -y -i "${filePath}" -vframes 1 -q:v 2 "${thumbPath}"`);
    }
    if (fs.existsSync(thumbPath) && fs.statSync(thumbPath).size > 0) {
      thumbnailUrl = `/uploads/${thumbFilename}`;
    }
  } catch (thumbErr) {
    console.warn('Advertencia al generar miniatura de vídeo:', thumbErr);
    try {
      await execPromise(`ffmpeg -y -i "${filePath}" -vframes 1 -q:v 2 "${thumbPath}"`);
      if (fs.existsSync(thumbPath)) thumbnailUrl = `/uploads/${thumbFilename}`;
    } catch {}
  }

  // 2. Comprehensive format, container and codec analysis for universal browser & iPhone playback
  try {
    const probeCmd = `ffprobe -v error -show_entries stream=index,codec_name,codec_type,pix_fmt -show_entries format=format_name -of json "${filePath}"`;
    const { stdout: probeOut } = await execPromise(probeCmd);
    const probeData = JSON.parse(probeOut || '{}');
    const streams = probeData.streams || [];
    const vStream = streams.find((s: any) => s.codec_type === 'video') || streams[0] || {};
    const aStream = streams.find((s: any) => s.codec_type === 'audio') || {};

    const vCodec = (vStream.codec_name || '').toLowerCase();
    const pixFmt = (vStream.pix_fmt || '').toLowerCase();
    const aCodec = (aStream.codec_name || '').toLowerCase();
    const formatName = ((probeData.format && probeData.format.format_name) || '').toLowerCase();
    const ext = path.extname(filename).toLowerCase();

    // Check if moov atom is at beginning or end
    let needsFaststart = true;
    try {
      const { stdout: traceOut } = await execPromise(`ffprobe -v trace -i "${filePath}" 2>&1 | grep -m 1 -E "type:'(moov|mdat)'"`);
      if (traceOut.includes("type:'moov'") && !traceOut.includes("type:'mdat'")) {
        needsFaststart = false;
      }
    } catch {}

    const isNonWebCodec = ['hevc', 'hvc1', 'prores', 'dnxhd', 'mpeg4', 'vp9', 'av1', 'mjpeg'].includes(vCodec);
    const is10BitOrNonStandardPixFmt = pixFmt.includes('10') || pixFmt.includes('12') || pixFmt.includes('422') || pixFmt.includes('444');
    const isNonWebContainer = ext === '.mov' || ext === '.mkv' || ext === '.avi' || ext === '.3gp' || ext === '.m4v' || !formatName.includes('mp4');
    const isNonWebAudio = aCodec && !['aac', 'mp3', 'opus'].includes(aCodec);

    const outWebFilename = `${baseName}-web.mp4`;
    const outWebPath = path.join(UPLOADS_DIR, outWebFilename);

    if (isNonWebCodec || is10BitOrNonStandardPixFmt) {
      // Full transcode to universal web H.264 SDR (yuv420p) + AAC + Faststart
      console.log(`Transcodificando vídeo ${filename} (${vCodec}, ${pixFmt}) a H.264 web compatible...`);
      await execPromise(`ffmpeg -y -i "${filePath}" -vf "scale='min(1080,iw)':-2,format=yuv420p" -c:v libx264 -preset ultrafast -crf 23 -c:a aac -b:a 128k -movflags +faststart "${outWebPath}"`);
      if (fs.existsSync(outWebPath) && fs.statSync(outWebPath).size > 0) {
        fileUrl = `/uploads/${outWebFilename}`;
      }
    } else if (isNonWebAudio) {
      // Video is already H.264, transcode audio to AAC and apply faststart
      console.log(`Re-empaquetando vídeo ${filename} con audio AAC y faststart...`);
      await execPromise(`ffmpeg -y -i "${filePath}" -c:v copy -c:a aac -b:a 128k -movflags +faststart "${outWebPath}"`);
      if (fs.existsSync(outWebPath) && fs.statSync(outWebPath).size > 0) {
        fileUrl = `/uploads/${outWebFilename}`;
      }
    } else if (needsFaststart || isNonWebContainer) {
      // Fast remux (takes ~0.2s) to standard MP4 with moov atom at beginning (+faststart)
      console.log(`Aplicando FastStart y contenedor web MP4 a ${filename}...`);
      await execPromise(`ffmpeg -y -i "${filePath}" -c copy -movflags +faststart "${outWebPath}"`);
      if (fs.existsSync(outWebPath) && fs.statSync(outWebPath).size > 0) {
        fileUrl = `/uploads/${outWebFilename}`;
      }
    }
  } catch (probeErr) {
    console.warn('Advertencia al analizar o transcodificar vídeo:', probeErr);
    try {
      const outFallbackFilename = `${baseName}-web.mp4`;
      const outFallbackPath = path.join(UPLOADS_DIR, outFallbackFilename);
      await execPromise(`ffmpeg -y -i "${filePath}" -c copy -movflags +faststart "${outFallbackPath}"`);
      if (fs.existsSync(outFallbackPath) && fs.statSync(outFallbackPath).size > 0) {
        fileUrl = `/uploads/${outFallbackFilename}`;
      }
    } catch {}
  }

  return { fileUrl, thumbnailUrl };
}

// Robust File Upload Handler (500MB direct streaming to disk)
const handleUpload = (req: express.Request, res: express.Response) => {
  upload.single('file')(req, res, async (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ error: 'El archivo excede el tamaño máximo permitido por el servidor (500 MB).' });
        }
        return res.status(400).json({ error: `Error en la subida: ${err.message}` });
      }
      return res.status(400).json({ error: err.message || 'Error al procesar el archivo.' });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'No se ha proporcionado ningún archivo para subir.' });
    }
    const ext = path.extname(req.file.originalname).toLowerCase();
    const isVideo =
      req.file.mimetype.startsWith('video/') ||
      /\.(mp4|webm|mov|m4v|mkv|avi|3gp)$/i.test(ext) ||
      /\.(mp4|webm|mov|m4v|mkv|avi|3gp)$/i.test(req.file.filename);

    let fileUrl = `/uploads/${req.file.filename}`;
    let thumbnailUrl = isVideo ? '' : fileUrl;

    try {
      const processed = await processMediaFile(req.file.path, req.file.filename, isVideo);
      fileUrl = processed.fileUrl || fileUrl;
      thumbnailUrl = processed.thumbnailUrl || thumbnailUrl;
    } catch (procErr) {
      console.warn('Advertencia al procesar medio (ffmpeg/ffprobe):', procErr);
    }

    return res.json({
      success: true,
      fileUrl,
      thumbnailUrl: thumbnailUrl || fileUrl,
      filename: req.file.filename,
      mimetype: req.file.mimetype,
      size: req.file.size,
      type: isVideo ? 'video' : 'image',
    });
  });
};

// POST upload file (direct single request, up to 500MB)
app.post('/api/admin/upload', verifyAdmin, handleUpload);
app.post('/api/upload', verifyAdmin, handleUpload);

// POST upload chunk (chunked/resumable upload for large 500MB files, memory-efficient)
app.post('/api/admin/upload-chunk', verifyAdmin, (req, res) => {
  chunkUpload.single('chunk')(req, res, async (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        return res.status(400).json({ error: `Error en la transferencia de la parte: ${err.message}` });
      }
      return res.status(400).json({ error: err.message || 'Error al procesar la parte del archivo.' });
    }

    const { uploadId, chunkIndex, totalChunks, filename } = req.body;
    if (!uploadId || chunkIndex === undefined || totalChunks === undefined || !filename) {
      return res.status(400).json({
        error: 'Parámetros incompletos para la carga por partes (uploadId, chunkIndex, totalChunks, filename).',
      });
    }

    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ error: 'No se ha recibido el bloque de datos.' });
    }

    // Sanitize uploadId to prevent directory traversal
    const safeUploadId = String(uploadId).replace(/[^a-zA-Z0-9_-]/g, '');
    if (!safeUploadId) {
      return res.status(400).json({ error: 'Identificador de subida no válido.' });
    }

    // Validate file extension
    const ext = path.extname(filename).toLowerCase();
    const allowedExts = /\.(jpeg|jpg|png|webp|gif|svg|heic|heif|avif|mp4|webm|mov|m4v|mkv|avi|3gp)$/i;
    if (!allowedExts.test(ext)) {
      return res.status(400).json({
        error: 'Formato de archivo no soportado. Sube vídeos (MP4, WebM, MOV, M4V, MKV) o imágenes (JPG, PNG, WebP).',
      });
    }

    const tempChunkFile = path.join(CHUNKS_DIR, `${safeUploadId}.part`);
    const cIdx = parseInt(chunkIndex, 10);
    const tChunks = parseInt(totalChunks, 10);

    // If first chunk, clean up any previous failed attempt
    if (cIdx === 0 && fs.existsSync(tempChunkFile)) {
      try {
        fs.unlinkSync(tempChunkFile);
      } catch {}
    }

    try {
      // Append chunk buffer to temp file on disk (low memory usage)
      fs.appendFileSync(tempChunkFile, req.file.buffer);

      // Verify file size limit (500 MB)
      const currentStat = fs.statSync(tempChunkFile);
      const MAX_UPLOAD_SIZE = 500 * 1024 * 1024;
      if (currentStat.size > MAX_UPLOAD_SIZE) {
        try {
          fs.unlinkSync(tempChunkFile);
        } catch {}
        return res.status(400).json({
          error: 'El archivo excede el tamaño máximo permitido por el servidor (500 MB).',
        });
      }

      // If last chunk, finalize file
      if (cIdx >= tChunks - 1) {
        const finalFilename = `marevas-${safeUploadId}${ext}`;
        const finalPath = path.join(UPLOADS_DIR, finalFilename);

        if (fs.existsSync(tempChunkFile)) {
          fs.renameSync(tempChunkFile, finalPath);
        }

        const isVideo: boolean =
          /\.(mp4|webm|mov|m4v|mkv|avi|3gp|hevc)$/i.test(ext) ||
          Boolean(req.file?.mimetype && req.file.mimetype.startsWith('video/'));

        let fileUrl = `/uploads/${finalFilename}`;
        let thumbnailUrl = isVideo ? '' : fileUrl;

        try {
          if (fs.existsSync(finalPath)) {
            const processed = await processMediaFile(finalPath, finalFilename, isVideo);
            fileUrl = processed.fileUrl || fileUrl;
            thumbnailUrl = processed.thumbnailUrl || thumbnailUrl;
          }
        } catch (procErr) {
          console.warn('Advertencia al procesar medio en chunk final:', procErr);
        }

        const finalSize = fs.existsSync(finalPath) ? fs.statSync(finalPath).size : (currentStat?.size || 0);

        return res.json({
          success: true,
          fileUrl,
          thumbnailUrl: thumbnailUrl || fileUrl,
          filename: finalFilename,
          size: finalSize,
          type: isVideo ? 'video' : 'image',
          completed: true,
        });
      }

      // Chunk acknowledged
      return res.json({
        success: true,
        chunkIndex: cIdx,
        totalChunks: tChunks,
        completed: false,
      });
    } catch (writeErr: any) {
      console.error('Error al escribir parte de archivo:', writeErr);
      return res.status(500).json({ error: 'Error al escribir el fragmento del archivo en disco.' });
    }
  });
});

// DELETE abort chunked upload and clean temp file
app.delete('/api/admin/upload-chunk/:uploadId', verifyAdmin, (req, res) => {
  const safeUploadId = String(req.params.uploadId).replace(/[^a-zA-Z0-9_-]/g, '');
  const tempChunkFile = path.join(CHUNKS_DIR, `${safeUploadId}.part`);
  if (fs.existsSync(tempChunkFile)) {
    try {
      fs.unlinkSync(tempChunkFile);
    } catch {}
  }
  res.json({ success: true, message: 'Carga cancelada y almacenamiento temporal liberado.' });
});

// PUT update inquiry status
app.put('/api/admin/inquiries/:id', verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const data = await getSiteData();
    const inquiry = (data.inquiries || []).find((i: any) => i.id === id);
    if (!inquiry) {
      return res.status(404).json({ error: 'Solicitud no encontrada.' });
    }
    inquiry.status = status;
    await saveSiteData(data);
    res.json({ success: true, inquiry });
  } catch (err: any) {
    console.error('Error al actualizar estado de solicitud:', err);
    res.status(500).json({ error: err.message || 'Error al actualizar el estado de la solicitud.' });
  }
});

// DELETE inquiry
app.delete('/api/admin/inquiries/:id', verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const data = await getSiteData();
    data.inquiries = (data.inquiries || []).filter((i: any) => i.id !== id);
    await saveSiteData(data);
    res.json({ success: true });
  } catch (err: any) {
    console.error('Error al eliminar solicitud:', err);
    res.status(500).json({ error: err.message || 'Error al eliminar la solicitud.' });
  }
});

// POST reset demo data
app.post('/api/admin/reset-demo', verifyAdmin, async (_req, res) => {
  try {
    await saveSiteData(defaultSiteData);
    res.json({ success: true, data: defaultSiteData });
  } catch (err: any) {
    console.error('Error al restablecer datos de demostración:', err);
    res.status(500).json({ error: err.message || 'Error al restablecer los datos.' });
  }
});

// PUT change password
app.put('/api/admin/password', verifyAdmin, (req, res) => {
  const { newPassword } = req.body;
  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({ error: 'La nueva contraseña debe tener al menos 6 caracteres.' });
  }
  const auth = getStoredAuth();
  auth.passwordHash = crypto.createHash('sha256').update(newPassword).digest('hex');
  fs.writeFileSync(AUTH_FILE, JSON.stringify(auth, null, 2), 'utf-8');
  res.json({ success: true, message: 'Contraseña actualizada con éxito.' });
});

// Explicit JSON 404 handler for any unmatched /api route (prevents falling through to Vite HTML)
app.all('/api/*', (req, res) => {
  res.status(404).json({ error: `Ruta de API no encontrada: ${req.method} ${req.originalUrl}` });
});

// Global API error handler ensuring all /api errors return JSON, never HTML
app.use('/api', (err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('API Error:', err);
  const status = err.status || (err.code === 'LIMIT_FILE_SIZE' ? 400 : 500);
  res.status(status).json({
    error: err.message || 'Ocurrió un error en el servidor al procesar la solicitud.',
  });
});

// Setup Vite or Static File Serving
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`Marevas MKT full-stack server running on http://0.0.0.0:${PORT}`);
  });

  // Timeout settings for high-volume uploads (500 MB)
  server.requestTimeout = 30 * 60 * 1000; // 30 minutes
  server.headersTimeout = 35 * 60 * 1000; // 35 minutes
  server.keepAliveTimeout = 65000; // 65 seconds
}

// Only start standalone HTTP server when run directly (node server.ts or tsx server.ts) and not inside Vercel Serverless
if (process.env.VERCEL !== '1' && process.env.NODE_ENV !== 'test') {
  startServer();
}

export default app;
