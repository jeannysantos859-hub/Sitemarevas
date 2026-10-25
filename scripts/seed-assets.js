import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
const distUploads = path.join(process.cwd(), 'dist', 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
if (!fs.existsSync(distUploads)) fs.mkdirSync(distUploads, { recursive: true });

const videos = [
  {
    file: 'marevas-up-1792575537532-hfghw0a-web.mp4',
    thumb: 'marevas-up-1792575537532-hfghw0a-thumb.jpg',
    title: 'MAREVAS MKT',
    sub: 'Produccion Audiovisual y Estrategia Digital',
    color: '#064E3B',
    accent: '#DCE5E0'
  },
  {
    file: 'marevas-up-1792577097780-zf8lp5j-web.mp4',
    thumb: 'marevas-up-1792577097780-zf8lp5j-thumb.jpg',
    title: 'MOVIL EUROPA',
    sub: 'Smartphones y Soporte Oficial',
    color: '#0F172A',
    accent: '#38BDF8'
  },
  {
    file: 'marevas-up-1792577371721-e9b1tno-web.mp4',
    thumb: 'marevas-up-1792577371721-e9b1tno-thumb.jpg',
    title: 'ULTRAFORMA',
    sub: 'Valoracion Medica y Armonizacion Facial',
    color: '#1E3A2F',
    accent: '#E2E8F0'
  },
  {
    file: 'marevas-1792570068512-813924672-h264.mp4',
    thumb: 'marevas-1792570068512-813924672-thumb.jpg',
    title: 'BETHANIA PRATAS',
    sub: 'Joyas en Plata 925 en Primer Plano',
    color: '#0F281E',
    accent: '#E5E7EB'
  },
  {
    file: 'marevas-1792570188408-132668484-h264.mp4',
    thumb: 'marevas-1792570188408-132668484-thumb.jpg',
    title: 'BOTTERO',
    sub: 'Trend y Cuero Legitimo 2026',
    color: '#2E1A11',
    accent: '#FDE68A'
  },
  {
    file: 'marevas-1792570337984-158157385-h264.mp4',
    thumb: 'marevas-1792570337984-158157385-thumb.jpg',
    title: 'ULTRAFORMA',
    sub: 'Tratamientos Faciales y Estetica Avanzada',
    color: '#164E63',
    accent: '#A5F3FC'
  }
];

console.log('Generating high-quality, web-compatible vertical video reels...');
for (const v of videos) {
  const outPath = path.join(uploadsDir, v.file);
  const outThumb = path.join(uploadsDir, v.thumb);
  console.log('Creating:', v.file);

  const filter = `color=c=${v.color}:s=1080x1920:d=7,` +
    `drawtext=text='MAREVAS MKT':fontcolor=${v.accent}:fontsize=36:x=(w-text_w)/2:y=220,` +
    `drawtext=text='${v.title}':fontcolor=white:fontsize=64:x=(w-text_w)/2:y=(h-text_h)/2-60,` +
    `drawtext=text='${v.sub}':fontcolor=${v.accent}:fontsize=34:x=(w-text_w)/2:y=(h-text_h)/2+40,` +
    `drawtext=text='Reel Oficial · 1080x1920 HD':fontcolor=${v.accent}:fontsize=26:x=(w-text_w)/2:y=h-240`;

  execSync(`ffmpeg -y -f lavfi -i "${filter}" -f lavfi -i anullsrc=r=44100:cl=stereo -c:v libx264 -pix_fmt yuv420p -profile:v baseline -level 3.1 -preset veryfast -crf 22 -c:a aac -b:a 128k -shortest -movflags +faststart "${outPath}"`);

  // Generate thumbnail
  execSync(`ffmpeg -y -ss 00:00:01 -i "${outPath}" -vframes 1 -q:v 2 "${outThumb}"`);

  // Copy to dist/uploads as well
  fs.copyFileSync(outPath, path.join(distUploads, v.file));
  fs.copyFileSync(outThumb, path.join(distUploads, v.thumb));
}

// Generate the 3 missing photo JPGs
const photos = [
  { file: 'marevas-1792570380501-68912565.jpg', title: 'Bethania Pratas', sub: 'Anillo Solitario Rubi y Diamantes', bg: '#064E3B' },
  { file: 'marevas-1792577001453-91499841.jpg', title: 'Bethania Pratas', sub: 'Anillo Amatista y Pave Plata 925', bg: '#2F5E4E' },
  { file: 'marevas-1792577026471-919394359.jpg', title: 'Bottero', sub: 'Sandalias de Cuero en Podio Curvo', bg: '#1F2937' }
];

console.log('Generating missing photo files...');
for (const p of photos) {
  const pPath = path.join(uploadsDir, p.file);
  const filter = `color=c=${p.bg}:s=1200x1200:d=1,` +
    `drawtext=text='MAREVAS MKT':fontcolor=#DCE5E0:fontsize=36:x=(w-text_w)/2:y=200,` +
    `drawtext=text='${p.title}':fontcolor=white:fontsize=60:x=(w-text_w)/2:y=(h-text_h)/2-50,` +
    `drawtext=text='${p.sub}':fontcolor=#E5E7EB:fontsize=34:x=(w-text_w)/2:y=(h-text_h)/2+40`;

  execSync(`ffmpeg -y -f lavfi -i "${filter}" -vframes 1 -q:v 2 "${pPath}"`);
  fs.copyFileSync(pPath, path.join(distUploads, p.file));
}

console.log('Done! All portfolio videos and images generated successfully!');
