import { useState, useRef, useCallback } from 'react';
import {
  ChevronRight, Folder, File, HardDrive, Home, Trash2,
  Upload, Download, Grid, List, ArrowLeft, ArrowRight,
  RefreshCw, Search, Edit3, Copy, FolderPlus, Info,
  Image, Music, Video, FileText, Archive, Share2, Lock,
  CheckCircle2, X, Play, Pause, SkipBack, SkipForward,
  Volume2, Maximize, ZoomIn, ZoomOut, RotateCw, ChevronLeft, ChevronRight as ChevronRightIcon,
  Film, FileSpreadsheet, BookOpen, Package, ExternalLink,
} from 'lucide-react';
import { useSystemStore } from '../../store/systemStore';
import { useStorageStore } from '../../store/storageStore';
import './FileStation.css';

interface FileItem {
  id: string;
  name: string;
  type: 'file' | 'folder';
  size?: string;
  modified?: string;
  ext?: string;
}

type FS = Record<string, FileItem[]>;

let nextId = 1000;
const mkId = () => `item-${nextId++}`;

const INITIAL_FS: FS = {
  '/': [
    { id: mkId(), name: 'home',       type: 'folder', modified: '16/06/2025' },
    { id: mkId(), name: 'volume1',    type: 'folder', modified: '01/01/2025' },
    { id: mkId(), name: 'volume2',    type: 'folder', modified: '15/03/2025' },
    { id: mkId(), name: 'system',     type: 'folder', modified: '01/01/2025' },
    { id: mkId(), name: 'Documentos', type: 'folder', modified: '15/06/2025' },
    { id: mkId(), name: 'Descargas',  type: 'folder', modified: '14/06/2025' },
    { id: mkId(), name: 'Imágenes',   type: 'folder', modified: '12/06/2025' },
    { id: mkId(), name: 'Música',    type: 'folder', modified: '10/06/2025' },
    { id: mkId(), name: 'Videos',     type: 'folder', modified: '08/06/2025' },
    { id: mkId(), name: 'README.txt', type: 'file', size: '1.2 KB', modified: '16/06/2025', ext: 'txt' },
  ],
  '/home': [
    { id: mkId(), name: 'admin', type: 'folder', modified: '16/06/2025' },
    { id: mkId(), name: 'lgm',   type: 'folder', modified: '16/06/2025' },
  ],
  '/Documentos': [
    { id: mkId(), name: 'Informe_Anual.pdf', type: 'file', size: '2.4 MB', modified: '10/06/2025', ext: 'pdf' },
    { id: mkId(), name: 'Presupuesto.xlsx', type: 'file', size: '340 KB', modified: '08/06/2025', ext: 'xlsx' },
    { id: mkId(), name: 'Notas.txt',        type: 'file', size: '4 KB',   modified: '15/06/2025', ext: 'txt' },
    { id: mkId(), name: 'Proyectos',        type: 'folder', modified: '12/06/2025' },
  ],
  '/Descargas': [
    { id: mkId(), name: 'debian-12.iso', type: 'file', size: '3.7 GB', modified: '01/06/2025', ext: 'iso' },
    { id: mkId(), name: 'setup.exe',     type: 'file', size: '128 MB', modified: '05/06/2025', ext: 'exe' },
    { id: mkId(), name: 'fonts.zip',     type: 'file', size: '12 MB',  modified: '07/06/2025', ext: 'zip' },
  ],
  '/Imágenes': [
    { id: mkId(), name: 'fondo.jpg',       type: 'file', size: '4.1 MB',  modified: '12/06/2025', ext: 'jpg' },
    { id: mkId(), name: 'captura.png',     type: 'file', size: '820 KB',  modified: '14/06/2025', ext: 'png' },
    { id: mkId(), name: 'logo.svg',        type: 'file', size: '18 KB',   modified: '10/06/2025', ext: 'svg' },
    { id: mkId(), name: 'foto_raw.heic',   type: 'file', size: '8.4 MB',  modified: '13/06/2025', ext: 'heic' },
    { id: mkId(), name: 'video_4k.hevc',   type: 'file', size: '2.1 GB',  modified: '11/06/2025', ext: 'hevc' },
    { id: mkId(), name: 'panorama.webp',   type: 'file', size: '1.2 MB',  modified: '09/06/2025', ext: 'webp' },
    { id: mkId(), name: 'Vacaciones',      type: 'folder', modified: '01/06/2025' },
  ],
  '/Música': [
    { id: mkId(), name: 'playlist.mp3',   type: 'file', size: '8.2 MB',  modified: '09/06/2025', ext: 'mp3' },
    { id: mkId(), name: 'rock_mix.mp3',   type: 'file', size: '12 MB',   modified: '09/06/2025', ext: 'mp3' },
    { id: mkId(), name: 'jazz_lossless.flac', type: 'file', size: '44 MB', modified: '07/06/2025', ext: 'flac' },
    { id: mkId(), name: 'podcast_ep12.m4a',  type: 'file', size: '18 MB', modified: '05/06/2025', ext: 'm4a' },
    { id: mkId(), name: 'ambient.ogg',    type: 'file', size: '6.5 MB',  modified: '03/06/2025', ext: 'ogg' },
  ],
  '/Videos': [
    { id: mkId(), name: 'tutorial.mp4',   type: 'file', size: '210 MB',  modified: '11/06/2025', ext: 'mp4' },
    { id: mkId(), name: 'demo.webm',      type: 'file', size: '45 MB',   modified: '13/06/2025', ext: 'webm' },
    { id: mkId(), name: 'grabacion.mov',  type: 'file', size: '380 MB',  modified: '10/06/2025', ext: 'mov' },
    { id: mkId(), name: 'intro_4k.hevc',  type: 'file', size: '1.8 GB',  modified: '08/06/2025', ext: 'hevc' },
    { id: mkId(), name: 'serie_ep01.mkv', type: 'file', size: '800 MB',  modified: '06/06/2025', ext: 'mkv' },
  ],
  // NAS Volumes
  '/volume1': [
    { id: mkId(), name: 'Documentos',  type: 'folder', modified: '15/06/2025' },
    { id: mkId(), name: 'Multimedia',  type: 'folder', modified: '10/06/2025' },
    { id: mkId(), name: 'Backup',      type: 'folder', modified: '01/06/2025' },
    { id: mkId(), name: 'web',         type: 'folder', modified: '20/05/2025' },
    { id: mkId(), name: '@Recycle',    type: 'folder', modified: '14/06/2025' },
  ],
  '/volume1/Documentos': [
    { id: mkId(), name: 'Informe_Anual_2025.pdf',   type: 'file', size: '2.4 MB',  modified: '10/06/2025', ext: 'pdf' },
    { id: mkId(), name: 'Presupuesto_Q2.xlsx',       type: 'file', size: '340 KB',  modified: '08/06/2025', ext: 'xlsx' },
    { id: mkId(), name: 'Presentacion.pptx',         type: 'file', size: '5.2 MB',  modified: '07/06/2025', ext: 'pptx' },
    { id: mkId(), name: 'Contrato.docx',             type: 'file', size: '180 KB',  modified: '06/06/2025', ext: 'docx' },
    { id: mkId(), name: 'Notas_reunion.txt',         type: 'file', size: '4 KB',    modified: '15/06/2025', ext: 'txt' },
    { id: mkId(), name: 'Contrato_proveedor.pdf',   type: 'file', size: '1.8 MB',  modified: '05/06/2025', ext: 'pdf' },
    { id: mkId(), name: 'README.md',                type: 'file', size: '3 KB',    modified: '04/06/2025', ext: 'md' },
    { id: mkId(), name: 'Proyectos',                type: 'folder', modified: '12/06/2025' },
  ],
  '/volume1/Multimedia': [
    { id: mkId(), name: 'Fotos_2025',   type: 'folder', modified: '14/06/2025' },
    { id: mkId(), name: 'Videos',       type: 'folder', modified: '11/06/2025' },
    { id: mkId(), name: 'Música',      type: 'folder', modified: '09/06/2025' },
  ],
  '/volume1/Backup': [
    { id: mkId(), name: 'backup_2025-06-15.tar.gz', type: 'file', size: '42.1 GB', modified: '15/06/2025', ext: 'gz' },
    { id: mkId(), name: 'backup_2025-06-08.tar.gz', type: 'file', size: '41.8 GB', modified: '08/06/2025', ext: 'gz' },
    { id: mkId(), name: 'backup_2025-06-01.tar.gz', type: 'file', size: '40.9 GB', modified: '01/06/2025', ext: 'gz' },
  ],
  '/volume2': [
    { id: mkId(), name: 'Multimedia',  type: 'folder', modified: '13/06/2025' },
    { id: mkId(), name: 'Backup',      type: 'folder', modified: '01/06/2025' },
    { id: mkId(), name: '@Recycle',    type: 'folder', modified: '14/06/2025' },
  ],
  '/volume2/Multimedia': [
    { id: mkId(), name: 'Peliculas',      type: 'folder', modified: '13/06/2025' },
    { id: mkId(), name: 'Series',         type: 'folder', modified: '12/06/2025' },
    { id: mkId(), name: 'Musica_Lossless',type: 'folder', modified: '09/06/2025' },
    { id: mkId(), name: 'Fotos_RAW',      type: 'folder', modified: '14/06/2025' },
  ],
  '/volume2/Multimedia/Peliculas': [
    { id: mkId(), name: 'Inception.mkv',      type: 'file', size: '14.2 GB', modified: '10/06/2025', ext: 'mkv' },
    { id: mkId(), name: 'Interstellar.mkv',   type: 'file', size: '16.8 GB', modified: '08/06/2025', ext: 'mkv' },
    { id: mkId(), name: 'Dune_Parte2.mkv',    type: 'file', size: '12.4 GB', modified: '05/06/2025', ext: 'mkv' },
    { id: mkId(), name: 'Oppenheimer.hevc',   type: 'file', size: '18.2 GB', modified: '03/06/2025', ext: 'hevc' },
    { id: mkId(), name: 'Trailer_4K.mp4',     type: 'file', size: '420 MB',  modified: '01/06/2025', ext: 'mp4' },
  ],
  '/volume2/Multimedia/Fotos_RAW': [
    { id: mkId(), name: 'DSC_0001.heic',   type: 'file', size: '12.4 MB', modified: '14/06/2025', ext: 'heic' },
    { id: mkId(), name: 'DSC_0002.heic',   type: 'file', size: '11.8 MB', modified: '14/06/2025', ext: 'heic' },
    { id: mkId(), name: 'RAW_0001.arw',    type: 'file', size: '24.1 MB', modified: '13/06/2025', ext: 'arw' },
    { id: mkId(), name: 'RAW_0002.arw',    type: 'file', size: '23.8 MB', modified: '13/06/2025', ext: 'arw' },
    { id: mkId(), name: 'foto_edit.jpg',   type: 'file', size: '6.2 MB',  modified: '12/06/2025', ext: 'jpg' },
    { id: mkId(), name: 'panorama.heic',   type: 'file', size: '18.5 MB', modified: '11/06/2025', ext: 'heic' },
  ],
  '/system': [
    { id: mkId(), name: 'boot',   type: 'folder', modified: '01/01/2025' },
    { id: mkId(), name: 'etc',    type: 'folder', modified: '16/06/2025' },
    { id: mkId(), name: 'var',    type: 'folder', modified: '16/06/2025' },
    { id: mkId(), name: 'opt',    type: 'folder', modified: '10/06/2025' },
    { id: mkId(), name: 'home',   type: 'folder', modified: '16/06/2025' },
  ],
};

function getFileIcon(item: FileItem) {
  if (item.type === 'folder') return <Folder size={15} style={{ color: '#f59e0b', flexShrink: 0 }} />;
  const ext = item.ext?.toLowerCase() ?? '';
  if (['jpg','jpeg','png','gif','svg','webp','heic','heif','bmp','tiff','tif','raw','arw','cr2','nef'].includes(ext))
    return <Image size={15} style={{ color: '#3b82f6', flexShrink: 0 }} />;
  if (['mp3','wav','flac','ogg','m4a','aac','wma','opus','aiff'].includes(ext))
    return <Music size={15} style={{ color: '#a855f7', flexShrink: 0 }} />;
  if (['mp4','avi','mkv','webm','mov','hevc','h265','h264','ts','m2ts','vob','flv','wmv','m4v','3gp'].includes(ext))
    return <Video size={15} style={{ color: '#ef4444', flexShrink: 0 }} />;
  if (['pdf'].includes(ext))
    return <FileText size={15} style={{ color: '#ef4444', flexShrink: 0 }} />;
  if (['doc','docx','odt','rtf'].includes(ext))
    return <FileText size={15} style={{ color: '#2563eb', flexShrink: 0 }} />;
  if (['xls','xlsx','ods','csv'].includes(ext))
    return <FileSpreadsheet size={15} style={{ color: '#16a34a', flexShrink: 0 }} />;
  if (['ppt','pptx','odp'].includes(ext))
    return <BookOpen size={15} style={{ color: '#ea580c', flexShrink: 0 }} />;
  if (['txt','md','sh','py','js','ts','json','yaml','yml','xml','html','css','ini','conf','log'].includes(ext))
    return <FileText size={15} style={{ color: '#6b7280', flexShrink: 0 }} />;
  if (['zip','tar','gz','iso','7z','rar','bz2','xz','dmg'].includes(ext))
    return <Package size={15} style={{ color: '#78716c', flexShrink: 0 }} />;
  return <File size={15} style={{ color: '#6b7280', flexShrink: 0 }} />;
}

function getFileIconLg(item: FileItem) {
  if (item.type === 'folder') return '📁';
  const ext = item.ext?.toLowerCase() ?? '';
  if (['jpg','jpeg','png','gif','svg','webp','heic','heif','bmp'].includes(ext)) return '🖼️';
  if (['raw','arw','cr2','nef','tiff','tif'].includes(ext)) return '📷';
  if (['hevc','h265','h264'].includes(ext)) return '🎬';
  if (['mp3','wav','flac','ogg','m4a','aac','aiff'].includes(ext)) return '🎵';
  if (['mp4','avi','mkv','webm','mov','ts','m4v'].includes(ext)) return '🎥';
  if (['pdf'].includes(ext)) return '📕';
  if (['doc','docx','odt','rtf'].includes(ext)) return '📝';
  if (['xls','xlsx','ods','csv'].includes(ext)) return '📊';
  if (['ppt','pptx','odp'].includes(ext)) return '📋';
  if (['zip','tar','gz','iso','7z','rar','dmg'].includes(ext)) return '📦';
  if (['txt','md'].includes(ext)) return '📄';
  if (['sh','py','js','ts'].includes(ext)) return '⚙️';
  return '📃';
}

interface CtxMenu { x: number; y: number; item: FileItem | null; }
interface UploadFile { name: string; progress: number; done: boolean; }

/* ════════════════════════════════════════════════════
   FILE VIEWER — Image / Video / Audio / PDF / Office / Code
   ════════════════════════════════════════════════════ */
const IMAGE_EXTS  = ['jpg','jpeg','png','gif','svg','webp','heic','heif','bmp','tiff','tif'];
const VIDEO_EXTS  = ['mp4','webm','mkv','avi','mov','hevc','h265','h264','ts','m2ts','flv','m4v','3gp'];
const AUDIO_EXTS  = ['mp3','wav','flac','ogg','m4a','aac','wma','opus','aiff'];
const DOC_EXTS    = ['pdf','doc','docx','odt','rtf'];
const SHEET_EXTS  = ['xls','xlsx','ods','csv'];
const SLIDE_EXTS  = ['ppt','pptx','odp'];
const CODE_EXTS   = ['txt','md','sh','py','js','ts','json','yaml','yml','xml','html','css','conf','ini','log'];
const ARCHIVE_EXTS= ['zip','tar','gz','bz2','xz','iso','7z','rar','dmg'];
const RAW_EXTS    = ['raw','arw','cr2','cr3','nef','dng','orf','rw2'];

type ViewerMode = 'image' | 'video' | 'audio' | 'pdf' | 'office' | 'code' | 'archive' | 'unsupported';

function getViewerMode(ext: string): ViewerMode {
  const e = ext.toLowerCase();
  if (IMAGE_EXTS.includes(e) || RAW_EXTS.includes(e)) return 'image';
  if (VIDEO_EXTS.includes(e))   return 'video';
  if (AUDIO_EXTS.includes(e))   return 'audio';
  if (e === 'pdf')               return 'pdf';
  if (DOC_EXTS.includes(e) || SHEET_EXTS.includes(e) || SLIDE_EXTS.includes(e)) return 'office';
  if (CODE_EXTS.includes(e))    return 'code';
  if (ARCHIVE_EXTS.includes(e)) return 'archive';
  return 'unsupported';
}

/* Simulated content for text files */
const TEXT_CONTENT: Record<string, string> = {
  'txt': '# Notas de reunión — 15 Jun 2025\n\nAsistentes: Admin, LGM Team\n\n## Puntos tratados\n1. Revisión del estado del proyecto LGM OS\n2. Planificación del próximo sprint\n3. Revisión de infraestructura NAS\n\n## Decisiones\n- Migrar a RAID 6 en el Volumen 2\n- Actualizar firmware de los discos Seagate\n\n## Próximos pasos\n- [ ] Reemplazar disco d4 (sectores defectuosos)\n- [ ] Configurar backup automático a nube\n- [ ] Revisar logs de acceso SMB',
  'md':  '# LGM OS — README\n\nSistema NAS basado en Debian GNU/Linux 12.\n\n## Características\n- Interfaz web DSM-style\n- Soporte RAID 1/5/6/10\n- ZFS nativo\n- Docker App Store\n- VPN WireGuard integrada\n\n## Inicio rápido\n```bash\nssh admin@192.168.1.100\nsudo systemctl status lgm-ui\n```\n\n## Contacto\nlgm@lgmos.local',
  'sh':  '#!/bin/bash\n# Script de backup automático\n# LGM OS — Backup Manager v1.0\n\nSRC="/volume1/Documentos"\nDST="/volume2/Backup"\nDATE=$(date +%Y-%m-%d)\nFILE="backup_${DATE}.tar.gz"\n\necho "Iniciando backup: $FILE"\ntar -czf "$DST/$FILE" "$SRC"\n\nif [ $? -eq 0 ]; then\n  echo "Backup completado: $FILE"\n  ls -lh "$DST/$FILE"\nelse\n  echo "ERROR: Fallo en el backup"\n  exit 1\nfi',
  'json': '{\n  "system": "LGM OS",\n  "version": "1.0.0",\n  "hostname": "lgm-nas-01",\n  "ip": "192.168.1.100",\n  "volumes": [\n    { "id": "vol1", "name": "Volumen 1", "type": "RAID1", "size": "3.8T" },\n    { "id": "vol2", "name": "Volumen 2", "type": "RAID1", "size": "7.3T" }\n  ],\n  "services": ["smbd","nginx","sshd","wg-quick"],\n  "docker": { "containers": 2, "images": 3 }\n}',
  'conf': '# /etc/samba/smb.conf\n[global]\n  workgroup = WORKGROUP\n  server string = LGM NAS\n  security = user\n  encrypt passwords = yes\n  min protocol = SMB2\n\n[Documentos]\n  path = /volume1/Documentos\n  valid users = admin, lgm\n  read only = no\n  create mask = 0664',
  'log':  '[2025-06-16 08:00:01] INFO  System startup complete\n[2025-06-16 08:00:02] INFO  nginx started on :80\n[2025-06-16 08:00:03] INFO  smbd started on :445\n[2025-06-16 08:00:04] INFO  sshd started on :22\n[2025-06-16 14:20:15] INFO  SSH login: admin from 192.168.1.200\n[2025-06-16 14:32:48] WARN  Disk d4 temperature: 55°C (threshold: 50°C)\n[2025-06-16 14:33:01] INFO  SMB connection from 192.168.1.200\n[2025-06-16 15:10:22] ERROR SMART reallocated sectors on d4: 3',
};

/* Fake gradient covers for images (DSM style) */
const IMG_COVERS: Record<string, string> = {
  'jpg':  'linear-gradient(135deg,#1a1a2e 0%,#16213e 40%,#0f3460 100%)',
  'jpeg': 'linear-gradient(135deg,#0f3460 0%,#533483 50%,#e94560 100%)',
  'png':  'linear-gradient(135deg,#0d7377 0%,#14ffec 50%,#0d7377 100%)',
  'webp': 'linear-gradient(135deg,#134e5e 0%,#71b280 100%)',
  'heic': 'linear-gradient(135deg,#1a1a2e 0%,#4a4e69 40%,#9a8c98 100%)',
  'heif': 'linear-gradient(135deg,#1a1a2e 0%,#4a4e69 40%,#9a8c98 100%)',
  'svg':  'linear-gradient(135deg,#2980b9 0%,#6dd5fa 50%,#ffffff 100%)',
  'gif':  'linear-gradient(135deg,#f7971e 0%,#ffd200 100%)',
  'bmp':  'linear-gradient(135deg,#373b44 0%,#4286f4 100%)',
  'raw':  'linear-gradient(135deg,#232526 0%,#414345 100%)',
  'arw':  'linear-gradient(135deg,#232526 0%,#414345 100%)',
  'cr2':  'linear-gradient(135deg,#232526 0%,#414345 100%)',
  'tiff': 'linear-gradient(135deg,#283048 0%,#859398 100%)',
};

const IMG_ICONS: Record<string, string> = {
  'jpg':'📷','jpeg':'📷','png':'🖼️','webp':'🖼️','svg':'🎨',
  'gif':'🎞️','heic':'📷','heif':'📷','bmp':'🖼️','raw':'📷','arw':'📷','cr2':'📷','tiff':'🖼️',
};

/* Archive contents simulation */
const ARCHIVE_CONTENTS: Record<string, { name: string; size: string; type: string }[]> = {
  'zip':  [{ name: 'readme.txt', size: '2 KB', type: 'text' }, { name: 'install.sh', size: '4 KB', type: 'script' }, { name: 'config/', size: '—', type: 'folder' }, { name: 'assets/', size: '—', type: 'folder' }],
  'gz':   [{ name: 'backup/', size: '—', type: 'folder' }, { name: 'backup/data.sql', size: '420 MB', type: 'database' }, { name: 'backup/files/', size: '—', type: 'folder' }],
  'iso':  [{ name: 'boot/', size: '—', type: 'folder' }, { name: 'pool/', size: '—', type: 'folder' }, { name: 'isolinux/', size: '—', type: 'folder' }, { name: 'README.txt', size: '1 KB', type: 'text' }],
  '7z':   [{ name: 'proyecto/', size: '—', type: 'folder' }, { name: 'proyecto/src/', size: '—', type: 'folder' }, { name: 'proyecto/docs/', size: '—', type: 'folder' }],
  'tar':  [{ name: 'etc/', size: '—', type: 'folder' }, { name: 'var/', size: '—', type: 'folder' }, { name: 'home/', size: '—', type: 'folder' }],
};

function FileViewer({
  item, siblings, cwd, onClose, onNavigate,
}: {
  item: FileItem;
  siblings: FileItem[];
  cwd: string;
  onClose: () => void;
  onNavigate: (item: FileItem) => void;
}) {
  const ext  = item.ext?.toLowerCase() ?? '';
  const mode = getViewerMode(ext);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(80);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);

  const idx = siblings.findIndex(s => s.id === item.id);
  const hasPrev = idx > 0;
  const hasNext = idx < siblings.length - 1;

  // Fake progress when playing
  const togglePlay = () => {
    setIsPlaying(p => !p);
    if (!isPlaying && progress >= 100) setProgress(0);
  };

  const mediaColor = mode === 'video'
    ? 'rgba(15,15,25,0.97)'
    : mode === 'audio'
    ? 'rgba(18,10,30,0.97)'
    : 'rgba(10,10,18,0.97)';

  /* Format duration based on file size (fake but plausible) */
  const sizeNum = parseFloat(item.size?.replace(/[^0-9.]/g,'') ?? '0');
  const unit = item.size?.includes('GB') ? 'GB' : item.size?.includes('MB') ? 'MB' : 'KB';
  const durSec = unit === 'GB' ? sizeNum * 60 : unit === 'MB' ? sizeNum * 0.3 : 10;
  const durMin  = Math.floor(durSec / 60);
  const durSecs = Math.floor(durSec % 60);
  const durStr  = `${durMin}:${String(durSecs).padStart(2,'0')}`;
  const progSec = Math.floor((progress / 100) * durSec);
  const progStr = `${Math.floor(progSec/60)}:${String(progSec%60).padStart(2,'0')}`;

  return (
    <div className="fv__overlay" onClick={onClose}>
      <div className="fv__window" style={{ background: mediaColor }} onClick={e => e.stopPropagation()}>

        {/* ─── Title bar ─── */}
        <div className="fv__bar">
          <div className="fv__bar-left">
            {getFileIcon(item)}
            <span className="fv__title">{item.name}</span>
            {item.size && <span className="fv__size">{item.size}</span>}
          </div>
          <div className="fv__bar-actions">
            {mode === 'image' && <>
              <button className="fv__tbtn" onClick={() => setZoom(z => Math.max(0.25, z - 0.25))} title="Reducir"><ZoomOut size={14}/></button>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', minWidth: 32, textAlign: 'center' }}>{Math.round(zoom*100)}%</span>
              <button className="fv__tbtn" onClick={() => setZoom(z => Math.min(4, z + 0.25))} title="Ampliar"><ZoomIn size={14}/></button>
              <button className="fv__tbtn" onClick={() => setRotation(r => (r + 90) % 360)} title="Rotar"><RotateCw size={14}/></button>
              <button className="fv__tbtn" onClick={() => { setZoom(1); setRotation(0); }} title="Restablecer">1:1</button>
            </>}
            <button className="fv__tbtn" title="Descargar" onClick={() => {}}><Download size={14}/></button>
            <button className="fv__tbtn fv__tbtn--close" onClick={onClose}><X size={14}/></button>
          </div>
        </div>

        {/* ─── Navigation arrows ─── */}
        {hasPrev && (
          <button className="fv__nav fv__nav--prev" onClick={() => onNavigate(siblings[idx - 1])}>
            <ChevronLeft size={20}/>
          </button>
        )}
        {hasNext && (
          <button className="fv__nav fv__nav--next" onClick={() => onNavigate(siblings[idx + 1])}>
            <ChevronRightIcon size={20}/>
          </button>
        )}

        {/* ─── Content area ─── */}
        <div className="fv__content">

          {/* IMAGE */}
          {mode === 'image' && (
            <div className="fv__img-wrap" style={{ transform: `scale(${zoom}) rotate(${rotation}deg)` }}>
              <div className="fv__img-fake" style={{
                background: IMG_COVERS[ext] ?? 'linear-gradient(135deg,#1a1a2e 0%,#4a4e69 100%)',
              }}>
                <span className="fv__img-icon">{IMG_ICONS[ext] ?? '🖼️'}</span>
                <span className="fv__img-label">{item.name}</span>
                {['raw','arw','cr2','cr3','nef','heic','heif'].includes(ext) && (
                  <span className="fv__img-badge">
                    {ext.toUpperCase()}{ext === 'heic' ? ' · Apple' : ' · RAW'}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* VIDEO */}
          {mode === 'video' && (
            <div className="fv__video-wrap">
              <div className="fv__video-screen">
                {isPlaying ? (
                  <div className="fv__video-playing">
                    <Film size={40} style={{ color: 'rgba(255,255,255,0.3)' }}/>
                    <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginTop: 8 }}>
                      Reproduciendo · {item.name}
                    </span>
                  </div>
                ) : (
                  <>
                    <div className="fv__video-thumb" style={{
                      background: 'linear-gradient(135deg,#0f0c29,#302b63,#24243e)',
                    }}>
                      <Film size={52} style={{ color: 'rgba(255,255,255,0.4)' }}/>
                    </div>
                    <button className="fv__play-big" onClick={togglePlay}>
                      <Play size={28} fill="white" style={{ marginLeft: 4 }}/>
                    </button>
                  </>
                )}
              </div>
              {/* Controls */}
              <div className="fv__controls">
                <button className="fv__ctrl-btn" onClick={() => setProgress(0)}><SkipBack size={16}/></button>
                <button className="fv__ctrl-btn fv__ctrl-btn--main" onClick={togglePlay}>
                  {isPlaying ? <Pause size={18} fill="white"/> : <Play size={18} fill="white" style={{marginLeft:2}}/>}
                </button>
                <button className="fv__ctrl-btn" onClick={() => setProgress(100)}><SkipForward size={16}/></button>
                <span className="fv__time">{progStr}</span>
                <div className="fv__progress" onClick={e => {
                  const r = e.currentTarget.getBoundingClientRect();
                  setProgress(((e.clientX - r.left) / r.width) * 100);
                }}>
                  <div className="fv__progress-fill" style={{ width: `${progress}%` }}/>
                </div>
                <span className="fv__time">{durStr}</span>
                <Volume2 size={14} style={{ color: 'rgba(255,255,255,0.5)', flexShrink: 0 }}/>
                <input type="range" className="fv__volume" min={0} max={100} value={volume}
                  onChange={e => setVolume(Number(e.target.value))}/>
              </div>
              {/* Codec info */}
              <div className="fv__media-info">
                <span>{ext.toUpperCase()}</span>
                {['hevc','h265'].includes(ext) && <span className="fv__codec-badge">HEVC H.265</span>}
                {['mkv','mp4'].includes(ext) && <span className="fv__codec-badge">H.264/AVC</span>}
                <span>· {item.size}</span>
              </div>
            </div>
          )}

          {/* AUDIO */}
          {mode === 'audio' && (
            <div className="fv__audio-wrap">
              <div className="fv__audio-cover" style={{
                background: ext === 'flac'
                  ? 'linear-gradient(135deg,#1a1a2e,#16213e,#0f3460)'
                  : ext === 'mp3'
                  ? 'linear-gradient(135deg,#4776e6,#8e54e9)'
                  : ext === 'ogg'
                  ? 'linear-gradient(135deg,#11998e,#38ef7d)'
                  : 'linear-gradient(135deg,#614385,#516395)',
              }}>
                <Music size={52} style={{ color: 'rgba(255,255,255,0.6)' }}/>
                {ext === 'flac' && <span className="fv__lossless-badge">LOSSLESS</span>}
                {['flac','aiff','wav'].includes(ext) && <span className="fv__codec-badge" style={{position:'relative',top:'auto',right:'auto',marginTop:8}}>Sin pérdida</span>}
              </div>
              <div className="fv__audio-meta">
                <div className="fv__audio-title">{item.name.replace(`.${ext}`, '')}</div>
                <div className="fv__audio-sub">{ext.toUpperCase()} · {item.size}</div>
              </div>
              <div className="fv__controls fv__controls--audio">
                <button className="fv__ctrl-btn" onClick={() => setProgress(0)}><SkipBack size={16}/></button>
                <button className="fv__ctrl-btn fv__ctrl-btn--main" onClick={togglePlay}>
                  {isPlaying ? <Pause size={18} fill="white"/> : <Play size={18} fill="white" style={{marginLeft:2}}/>}
                </button>
                <button className="fv__ctrl-btn" onClick={() => setProgress(100)}><SkipForward size={16}/></button>
                <span className="fv__time">{progStr}</span>
                <div className="fv__progress" onClick={e => {
                  const r = e.currentTarget.getBoundingClientRect();
                  setProgress(((e.clientX - r.left) / r.width) * 100);
                }}>
                  <div className="fv__progress-fill" style={{ width: `${progress}%` }}/>
                </div>
                <span className="fv__time">{durStr}</span>
                <Volume2 size={14} style={{ color: 'rgba(255,255,255,0.5)', flexShrink: 0 }}/>
                <input type="range" className="fv__volume" min={0} max={100} value={volume}
                  onChange={e => setVolume(Number(e.target.value))}/>
              </div>
            </div>
          )}

          {/* PDF */}
          {mode === 'pdf' && (
            <div className="fv__pdf-wrap">
              <div className="fv__pdf-page">
                <div className="fv__pdf-header">
                  <div className="fv__pdf-logo">📕</div>
                  <div>
                    <div className="fv__pdf-title">{item.name.replace('.pdf','')}</div>
                    <div className="fv__pdf-sub">Documento PDF · {item.size}</div>
                  </div>
                </div>
                <div className="fv__pdf-body">
                  <div className="fv__pdf-line fv__pdf-line--h1"/>
                  <div className="fv__pdf-line fv__pdf-line--h2"/>
                  {[...Array(8)].map((_,i) => (
                    <div key={i} className="fv__pdf-line" style={{ width: `${70 + Math.random()*28}%` }}/>
                  ))}
                  <div className="fv__pdf-line fv__pdf-line--h2" style={{ marginTop: 20 }}/>
                  {[...Array(5)].map((_,i) => (
                    <div key={i} className="fv__pdf-line" style={{ width: `${60 + Math.random()*35}%` }}/>
                  ))}
                  <div className="fv__pdf-table">
                    {[...Array(3)].map((_,r) => (
                      <div key={r} className="fv__pdf-row">
                        {[...Array(4)].map((_,c) => <div key={c} className="fv__pdf-cell"/>)}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="fv__pdf-footer">
                  <span>LGM OS Document System</span>
                  <span>Página 1 de 8</span>
                </div>
              </div>
              <div className="fv__pdf-controls">
                <button className="fv__tbtn">◀ Anterior</button>
                <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>Página 1 / 8</span>
                <button className="fv__tbtn">Siguiente ▶</button>
              </div>
            </div>
          )}

          {/* OFFICE (Word / Excel / PowerPoint) */}
          {mode === 'office' && (
            <div className="fv__office-wrap">
              {SHEET_EXTS.includes(ext) ? (
                /* SPREADSHEET */
                <div className="fv__sheet">
                  <div className="fv__sheet-header">
                    <span style={{ fontSize: 24 }}>📊</span>
                    <div>
                      <div className="fv__pdf-title">{item.name}</div>
                      <div className="fv__pdf-sub">Hoja de cálculo · {ext.toUpperCase()} · {item.size}</div>
                    </div>
                  </div>
                  <div className="fv__sheet-table">
                    <div className="fv__sheet-head">
                      {['A','B','C','D','E','F'].map(c => <div key={c} className="fv__sheet-th">{c}</div>)}
                    </div>
                    {[...Array(8)].map((_,r) => (
                      <div key={r} className="fv__sheet-row">
                        <div className="fv__sheet-num">{r+1}</div>
                        {[...Array(6)].map((_,c) => (
                          <div key={c} className="fv__sheet-cell">
                            {r === 0 ? ['Concepto','Q1','Q2','Q3','Q4','Total'][c]
                             : r === 1 ? ['Ingresos','124.500','138.200','142.800','156.300','561.800'][c]
                             : r === 2 ? ['Gastos','98.200','102.400','99.800','105.100','405.500'][c]
                             : r === 3 ? ['Beneficio','26.300','35.800','43.000','51.200','156.300'][c]
                             : ''}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              ) : SLIDE_EXTS.includes(ext) ? (
                /* PRESENTATION */
                <div className="fv__slides">
                  <div className="fv__slide-main">
                    <div className="fv__slide-bg" style={{ background: 'linear-gradient(135deg,#1a1a2e,#16213e)' }}>
                      <div className="fv__slide-title">{item.name.replace(`.${ext}`,'')}</div>
                      <div className="fv__slide-sub">Presentación LGM OS · 2025</div>
                    </div>
                  </div>
                  <div className="fv__slide-strip">
                    {['#1a1a2e','#0f3460','#533483','#e94560','#16213e'].map((bg,i) => (
                      <div key={i} className={`fv__slide-thumb ${i===0?'fv__slide-thumb--active':''}`}
                        style={{ background: `linear-gradient(135deg,${bg},${bg}88)` }}>
                        <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.6)' }}>{i+1}</span>
                      </div>
                    ))}
                  </div>
                  <div className="fv__pdf-controls">
                    <button className="fv__tbtn">◀ Anterior</button>
                    <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>Diapositiva 1 / 12</span>
                    <button className="fv__tbtn">Siguiente ▶</button>
                  </div>
                </div>
              ) : (
                /* WORD DOC */
                <div className="fv__pdf-wrap">
                  <div className="fv__pdf-page">
                    <div className="fv__pdf-header">
                      <div className="fv__pdf-logo">📝</div>
                      <div>
                        <div className="fv__pdf-title">{item.name}</div>
                        <div className="fv__pdf-sub">Documento {ext.toUpperCase()} · {item.size}</div>
                      </div>
                    </div>
                    <div className="fv__pdf-body">
                      <div className="fv__pdf-line fv__pdf-line--h1"/>
                      {[...Array(12)].map((_,i) => (
                        <div key={i} className="fv__pdf-line" style={{ width: `${65 + Math.random()*30}%` }}/>
                      ))}
                    </div>
                    <div className="fv__pdf-footer">
                      <span>LGM OS · {ext.toUpperCase()}</span>
                      <span>Página 1 de 3</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* CODE / TEXT */}
          {mode === 'code' && (
            <div className="fv__code-wrap">
              <div className="fv__code-header">
                <span className="fv__code-badge">{ext.toUpperCase()}</span>
                <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>{item.name} · {item.size}</span>
              </div>
              <pre className="fv__code">
                {TEXT_CONTENT[ext] ?? TEXT_CONTENT['txt']}
              </pre>
            </div>
          )}

          {/* ARCHIVE */}
          {mode === 'archive' && (
            <div className="fv__archive-wrap">
              <div className="fv__archive-header">
                <span style={{ fontSize: 28 }}>📦</span>
                <div>
                  <div className="fv__pdf-title">{item.name}</div>
                  <div className="fv__pdf-sub">{ext.toUpperCase()} · {item.size}</div>
                </div>
              </div>
              <div className="fv__archive-list">
                <div className="fv__archive-head">
                  <span>Nombre</span><span>Tipo</span><span>Tamaño</span>
                </div>
                {(ARCHIVE_CONTENTS[ext] ?? ARCHIVE_CONTENTS['zip']).map((f, i) => (
                  <div key={i} className="fv__archive-row">
                    <span>{f.type === 'folder' ? '📁 ' : '📄 '}{f.name}</span>
                    <span style={{ color: 'rgba(255,255,255,0.4)' }}>{f.type}</span>
                    <span style={{ color: 'rgba(255,255,255,0.4)' }}>{f.size}</span>
                  </div>
                ))}
              </div>
              <div className="fv__pdf-controls">
                <button className="fv__tbtn" style={{ background: 'rgba(45,123,255,0.3)', border: '1px solid rgba(45,123,255,0.5)' }}>
                  Extraer todo
                </button>
              </div>
            </div>
          )}

          {/* UNSUPPORTED */}
          {mode === 'unsupported' && (
            <div className="fv__unsupported">
              <File size={48} style={{ color: 'rgba(255,255,255,0.3)' }}/>
              <div className="fv__unsupported-title">Vista previa no disponible</div>
              <div className="fv__unsupported-sub">
                El formato .{ext.toUpperCase()} no tiene previsualización integrada.
              </div>
              <button className="fv__tbtn" style={{ marginTop: 16 }}>
                <Download size={14}/> Descargar archivo
              </button>
            </div>
          )}
        </div>

        {/* ─── Bottom info bar ─── */}
        <div className="fv__info-bar">
          <span>{cwd}/{item.name}</span>
          <span>Modificado: {item.modified ?? '—'}</span>
          {siblings.length > 1 && (
            <span style={{ marginLeft: 'auto' }}>{idx + 1} / {siblings.length}</span>
          )}
        </div>
      </div>
    </div>
  );
}

export function FileStation() {
  const { addNotification } = useSystemStore();
  const { volumes, folders: sharedFolders } = useStorageStore();
  const [fs, setFs] = useState<FS>(INITIAL_FS);
  const [cwd, setCwd] = useState('/');
  const [history, setHistory] = useState(['/']);
  const [histIdx, setHistIdx] = useState(0);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [selected, setSelected] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [ctxMenu, setCtxMenu] = useState<CtxMenu | null>(null);
  const [renameId, setRenameId] = useState<string | null>(null);
  const [renameVal, setRenameVal] = useState('');
  const [showProps, setShowProps] = useState(false);
  const [uploads, setUploads] = useState<UploadFile[]>([]);
  const [viewer, setViewer] = useState<{ item: FileItem; siblings: FileItem[] } | null>(null);
  const renameRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const items = (fs[cwd] ?? []).filter((i) =>
    !search || i.name.toLowerCase().includes(search.toLowerCase())
  );

  const navigate = (path: string) => {
    const newHistory = [...history.slice(0, histIdx + 1), path];
    setHistory(newHistory);
    setHistIdx(newHistory.length - 1);
    setCwd(path);
    setSelected(null);
    setSearch('');
    setCtxMenu(null);
  };

  const goBack    = () => { if (histIdx > 0) { setHistIdx(i => i - 1); setCwd(history[histIdx - 1]); } };
  const goForward = () => { if (histIdx < history.length - 1) { setHistIdx(i => i + 1); setCwd(history[histIdx + 1]); } };

  const handleOpen = (item: FileItem) => {
    if (item.type === 'folder') {
      const path = `${cwd === '/' ? '' : cwd}/${item.name}`;
      navigate(fs[path] !== undefined ? path : cwd);
    } else {
      // Open viewer for any file type
      const siblings = (fs[cwd] ?? []).filter(i => i.type === 'file');
      setViewer({ item, siblings });
    }
  };

  // Context menu
  const openCtx = (e: React.MouseEvent, item: FileItem | null) => {
    e.preventDefault();
    e.stopPropagation();
    setCtxMenu({ x: e.clientX, y: e.clientY, item });
  };
  const closeCtx = () => setCtxMenu(null);

  // New folder
  const createFolder = () => {
    const base = 'Nueva carpeta';
    let name = base;
    let i = 1;
    const current = fs[cwd] ?? [];
    while (current.some((f) => f.name === name)) { name = `${base} (${i++})`; }
    setFs((prev) => ({ ...prev, [cwd]: [...(prev[cwd] ?? []), { id: mkId(), name, type: 'folder', modified: new Date().toLocaleDateString('es-ES') }] }));
    addNotification('Carpeta creada', `"${name}" creada en ${cwd}`, 'success');
    closeCtx();
  };

  // New file
  const createFile = (ext = 'txt') => {
    const base = `nuevo_archivo.${ext}`;
    let name = base;
    let i = 1;
    const current = fs[cwd] ?? [];
    while (current.some((f) => f.name === name)) { name = `nuevo_archivo_${i++}.${ext}`; }
    setFs((prev) => ({ ...prev, [cwd]: [...(prev[cwd] ?? []), { id: mkId(), name, type: 'file', size: '0 KB', modified: new Date().toLocaleDateString('es-ES'), ext }] }));
    addNotification('Archivo creado', `"${name}" creado`, 'success');
    closeCtx();
  };

  // Rename
  const startRename = (item: FileItem) => {
    setRenameId(item.id);
    setRenameVal(item.name);
    closeCtx();
    setTimeout(() => renameRef.current?.select(), 50);
  };

  const commitRename = useCallback(() => {
    if (!renameId || !renameVal.trim()) { setRenameId(null); return; }
    setFs((prev) => ({
      ...prev,
      [cwd]: (prev[cwd] ?? []).map((f) =>
        f.id === renameId ? { ...f, name: renameVal.trim() } : f
      ),
    }));
    setRenameId(null);
  }, [renameId, renameVal, cwd]);

  // Delete
  const deleteItem = (item: FileItem) => {
    setFs((prev) => ({ ...prev, [cwd]: (prev[cwd] ?? []).filter((f) => f.id !== item.id) }));
    addNotification('Eliminado', `"${item.name}" ha sido eliminado`, 'warning');
    setSelected(null);
    closeCtx();
  };

  // Copy name
  const copyName = (item: FileItem) => {
    navigator.clipboard.writeText(item.name).catch(() => {});
    addNotification('Copiado', `"${item.name}" copiado al portapapeles`, 'info');
    closeCtx();
  };

  // Upload simulation
  const simulateUpload = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const newUploads: UploadFile[] = Array.from(files).map(f => ({ name: f.name, progress: 0, done: false }));
    setUploads(prev => [...prev, ...newUploads]);
    newUploads.forEach((u, idx) => {
      const interval = setInterval(() => {
        setUploads(prev => prev.map(up => {
          if (up.name !== u.name) return up;
          const next = Math.min(up.progress + Math.random() * 18 + 5, 100);
          if (next >= 100) {
            clearInterval(interval);
            // Add to FS
            setFs(prev2 => ({
              ...prev2,
              [cwd]: [...(prev2[cwd] ?? []), {
                id: mkId(), name: up.name, type: 'file',
                size: `${(Math.random() * 10 + 0.5).toFixed(1)} MB`,
                modified: new Date().toLocaleDateString('es-ES'),
                ext: up.name.split('.').pop(),
              }],
            }));
            setTimeout(() => setUploads(prev3 => prev3.filter(x => x.name !== up.name)), 1500);
            return { ...up, progress: 100, done: true };
          }
          return { ...up, progress: next };
        }));
      }, 120);
    });
    addNotification('Subida', `Subiendo ${files.length} archivo(s)…`, 'info');
    closeCtx();
  };

  const sidebarItems = [
    { label: 'Inicio',     icon: <Home size={14} />,     path: '/' },
    { label: 'Documentos', icon: <FileText size={14} />, path: '/Documentos' },
    { label: 'Descargas',  icon: <Download size={14} />, path: '/Descargas' },
    { label: 'Imágenes',   icon: <Image size={14} />,   path: '/Imágenes' },
    { label: 'Música',    icon: <Music size={14} />,   path: '/Música' },
    { label: 'Videos',     icon: <Video size={14} />,    path: '/Videos' },
    { label: 'Papelera',   icon: <Trash2 size={14} />,   path: '/papelera' },
  ];

  const selItem = items.find((i) => i.id === selected);

  return (
    <div className="fs" onClick={closeCtx}>
      {/* Hidden file input for upload */}
      <input ref={fileInputRef} type="file" multiple style={{ display: 'none' }}
        onChange={e => simulateUpload(e.target.files)} />

      {/* Sidebar */}
      <aside className="fs__sidebar">
        <div className="fs__sidebar-section">
          <span className="fs__sidebar-title">FAVORITOS</span>
          {sidebarItems.map((s) => (
            <button
              key={s.path}
              className={`fs__sidebar-item ${cwd === s.path ? 'fs__sidebar-item--active' : ''}`}
              onClick={() => navigate(s.path)}
            >
              {s.icon}
              {s.label}
            </button>
          ))}
        </div>
        <div className="fs__sidebar-section">
          <span className="fs__sidebar-title">DISPOSITIVOS</span>
          {volumes.map(vol => {
            const pct = Math.round((vol.usedGB / vol.totalGB) * 100);
            const path = vol.mountPoint.replace('/volume', '/volume').replace('/system', '/system');
            const normPath = vol.mountPoint === '/volume1' ? '/volume1' : vol.mountPoint === '/volume2' ? '/volume2' : '/system';
            return (
              <button key={vol.id}
                className={`fs__sidebar-item fs__sidebar-vol ${cwd === normPath ? 'fs__sidebar-item--active' : ''}`}
                onClick={() => navigate(normPath)}
              >
                <HardDrive size={13} style={{ flexShrink: 0, color: vol.status === 'degraded' ? '#f59e0b' : undefined }} />
                <span className="fs__sidebar-vol-info">
                  <span className="fs__sidebar-vol-name">{vol.name}</span>
                  <span className="fs__sidebar-vol-bar">
                    <span className="fs__sidebar-vol-fill" style={{ width: `${pct}%`, background: vol.status === 'degraded' ? '#f59e0b' : pct > 80 ? '#ef4444' : 'var(--color-primary)' }} />
                  </span>
                  <span className="fs__sidebar-vol-meta">{vol.usedGB}G / {vol.totalGB}G</span>
                </span>
                {vol.status === 'degraded' && <span title="DEGRADADO" style={{ color: '#f59e0b', fontSize: 10 }}>⚠</span>}
              </button>
            );
          })}
        </div>
        {sharedFolders.length > 0 && (
          <div className="fs__sidebar-section">
            <span className="fs__sidebar-title">COMPARTIDAS</span>
            {sharedFolders.map((sf: import('../../types').SharedFolder) => (
              <button key={sf.id}
                className={`fs__sidebar-item ${cwd === sf.path ? 'fs__sidebar-item--active' : ''}`}
                onClick={() => {
                  const vol = volumes.find(v => v.id === sf.volumeId);
                  const base = vol?.mountPoint === '/volume1' ? '/volume1' : vol?.mountPoint === '/volume2' ? '/volume2' : '/';
                  navigate(`${base}/${sf.name}`);
                }}
              >
                <Share2 size={13} style={{ flexShrink: 0 }} />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sf.name}</span>
                {sf.encrypted && <Lock size={10} style={{ marginLeft: 'auto', flexShrink: 0, color: 'var(--text-muted)' }} />}
              </button>
            ))}
          </div>
        )}
      </aside>

      {/* Main area */}
      <div className="fs__main">
        {/* Toolbar */}
        <div className="fs__toolbar">
          <button className="fs__btn" onClick={goBack} disabled={histIdx === 0} title="Atrás">
            <ArrowLeft size={14} />
          </button>
          <button className="fs__btn" onClick={goForward} disabled={histIdx >= history.length - 1} title="Adelante">
            <ArrowRight size={14} />
          </button>
          <button className="fs__btn" title="Actualizar" onClick={() => setSearch('')}>
            <RefreshCw size={13} />
          </button>

          {/* Breadcrumb */}
          <div className="fs__breadcrumb">
            {cwd === '/' ? (
              <span className="fs__bread-item">Inicio</span>
            ) : cwd.split('/').filter(Boolean).map((seg, i, arr) => {
              const path = '/' + arr.slice(0, i + 1).join('/');
              return (
                <span key={path} className="flex items-center gap-1">
                  <ChevronRight size={11} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                  <button className="fs__bread-item" onClick={() => navigate(path)}>{seg}</button>
                </span>
              );
            })}
          </div>

          <div className="fs__toolbar-right">
            {/* Search */}
            <div className="fs__search-wrap">
              <Search size={12} className="fs__search-icon" />
              <input
                className="fs__search"
                placeholder="Buscar..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <button className="fs__btn" title="Subir archivo" onClick={() => fileInputRef.current?.click()}>
              <Upload size={13} /> Subir
            </button>
            <button className="fs__btn fs__btn--primary" onClick={createFolder} title="Nueva carpeta">
              <FolderPlus size={13} /> Nueva carpeta
            </button>
            <div className="fs__view-toggle">
              <button
                className={`fs__btn ${viewMode === 'list' ? 'fs__btn--active' : ''}`}
                onClick={() => setViewMode('list')} title="Lista"
              >
                <List size={13} />
              </button>
              <button
                className={`fs__btn ${viewMode === 'grid' ? 'fs__btn--active' : ''}`}
                onClick={() => setViewMode('grid')} title="Cuadrícula"
              >
                <Grid size={13} />
              </button>
            </div>
          </div>
        </div>

        {/* File area */}
        {viewMode === 'list' ? (
          <div className="fs__list" onContextMenu={(e) => openCtx(e, null)}>
            <div className="fs__list-header">
              <span>Nombre</span>
              <span>Tamaño</span>
              <span>Modificado</span>
            </div>
            {items.map((item) => (
              <div
                key={item.id}
                className={`fs__list-row ${selected === item.id ? 'fs__list-row--selected' : ''}`}
                onClick={(e) => { e.stopPropagation(); setSelected(item.id); }}
                onDoubleClick={() => handleOpen(item)}
                onContextMenu={(e) => openCtx(e, item)}
              >
                <span className="fs__list-name">
                  {getFileIcon(item)}
                  {renameId === item.id ? (
                    <input
                      ref={renameRef}
                      className="fs__rename-input"
                      value={renameVal}
                      onChange={(e) => setRenameVal(e.target.value)}
                      onBlur={commitRename}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') commitRename();
                        if (e.key === 'Escape') setRenameId(null);
                        e.stopPropagation();
                      }}
                      onClick={(e) => e.stopPropagation()}
                      autoFocus
                    />
                  ) : (
                    <span className="fs__list-name-text">{item.name}</span>
                  )}
                </span>
                <span className="fs__list-size">{item.size ?? '—'}</span>
                <span className="fs__list-date">{item.modified ?? '—'}</span>
              </div>
            ))}
            {items.length === 0 && (
              <div className="fs__empty">
                {search ? `Sin resultados para "${search}"` : 'Carpeta vacía'}
              </div>
            )}
          </div>
        ) : (
          <div className="fs__grid" onContextMenu={(e) => openCtx(e, null)}>
            {items.map((item) => (
              <div
                key={item.id}
                className={`fs__grid-item ${selected === item.id ? 'fs__grid-item--selected' : ''}`}
                onClick={(e) => { e.stopPropagation(); setSelected(item.id); }}
                onDoubleClick={() => handleOpen(item)}
                onContextMenu={(e) => openCtx(e, item)}
              >
                <span className="fs__grid-icon">{getFileIconLg(item)}</span>
                {renameId === item.id ? (
                  <input
                    ref={renameRef}
                    className="fs__rename-input"
                    value={renameVal}
                    onChange={(e) => setRenameVal(e.target.value)}
                    onBlur={commitRename}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') commitRename();
                      if (e.key === 'Escape') setRenameId(null);
                      e.stopPropagation();
                    }}
                    onClick={(e) => e.stopPropagation()}
                    autoFocus
                  />
                ) : (
                  <span className="fs__grid-name">{item.name}</span>
                )}
              </div>
            ))}
            {items.length === 0 && (
              <div className="fs__empty" style={{ gridColumn: '1 / -1' }}>
                {search ? `Sin resultados para "${search}"` : 'Carpeta vacía'}
              </div>
            )}
          </div>
        )}

        {/* Status bar */}
        <div className="fs__statusbar">
          <span>
            {selItem
              ? `Seleccionado: ${selItem.name}${selItem.size ? ` · ${selItem.size}` : ''}`
              : `${items.length} elemento${items.length !== 1 ? 's' : ''}`
            }
          </span>
          {search && <span className="fs__statusbar-filter">🔍 Filtrando: "{search}"</span>}
        </div>
      </div>

      {/* Context menu */}
      {ctxMenu && (
        <div
          className="fs__ctx"
          style={{
            left: Math.min(ctxMenu.x, window.innerWidth - 200),
            top: Math.min(ctxMenu.y, window.innerHeight - 250),
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {ctxMenu.item ? (
            <>
              <div className="fs__ctx-header">
                {getFileIcon(ctxMenu.item)}
                <span className="fs__ctx-name">{ctxMenu.item.name}</span>
              </div>
              <div className="fs__ctx-sep" />
              {ctxMenu.item.type === 'folder' && (
                <button className="fs__ctx-item" onClick={() => { handleOpen(ctxMenu.item!); closeCtx(); }}>
                  <Folder size={13} /> Abrir
                </button>
              )}
              <button className="fs__ctx-item" onClick={() => startRename(ctxMenu.item!)}>
                <Edit3 size={13} /> Renombrar
              </button>
              <button className="fs__ctx-item" onClick={() => copyName(ctxMenu.item!)}>
                <Copy size={13} /> Copiar nombre
              </button>
              <button className="fs__ctx-item" onClick={() => { addNotification('Descarga', `Descargando ${ctxMenu.item!.name}...`, 'info'); closeCtx(); }}>
                <Download size={13} /> Descargar
              </button>
              <div className="fs__ctx-sep" />
              <button className="fs__ctx-item" onClick={() => { setSelected(ctxMenu.item!.id); setShowProps(true); closeCtx(); }}>  
                <Info size={13} /> Propiedades
              </button>
              <div className="fs__ctx-sep" />
              <button className="fs__ctx-item fs__ctx-item--danger" onClick={() => deleteItem(ctxMenu.item!)}>
                <Trash2 size={13} /> Eliminar
              </button>
            </>
          ) : (
            <>
              <button className="fs__ctx-item" onClick={createFolder}>
                <FolderPlus size={13} /> Nueva carpeta
              </button>
              <button className="fs__ctx-item" onClick={() => createFile('txt')}>
                <FileText size={13} /> Nuevo archivo de texto
              </button>
              <button className="fs__ctx-item" onClick={() => createFile('sh')}>
                <FileText size={13} /> Nuevo script (.sh)
              </button>
              <button className="fs__ctx-item" onClick={() => { fileInputRef.current?.click(); closeCtx(); }}>
                <Upload size={13} /> Subir archivo
              </button>
              <div className="fs__ctx-sep" />
              <button className="fs__ctx-item" onClick={() => setSearch('')}>
                <RefreshCw size={13} /> Actualizar
              </button>
            </>
          )}
        </div>
      )}

      {/* Properties Modal */}
      {showProps && selItem && (
        <div className="fs__modal-overlay" onClick={() => setShowProps(false)}>
          <div className="fs__modal" onClick={e => e.stopPropagation()}>
            <div className="fs__modal-header">
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {getFileIcon(selItem)}
                <strong>{selItem.name}</strong>
              </span>
              <button className="fs__modal-close" onClick={() => setShowProps(false)}><X size={14}/></button>
            </div>
            <div className="fs__modal-body">
              <div className="fs__prop-row"><span>Tipo</span><span>{selItem.type === 'folder' ? 'Carpeta' : `Archivo ${selItem.ext ? `.${selItem.ext.toUpperCase()}` : ''}`}</span></div>
              <div className="fs__prop-row"><span>Ubicación</span><span>{cwd}</span></div>
              {selItem.size && <div className="fs__prop-row"><span>Tamaño</span><span>{selItem.size}</span></div>}
              {selItem.modified && <div className="fs__prop-row"><span>Modificado</span><span>{selItem.modified}</span></div>}
              <div className="fs__prop-row"><span>Permisos</span><span>rwxr-xr-x</span></div>
              <div className="fs__prop-row"><span>Propietario</span><span>admin</span></div>
            </div>
            <div className="fs__modal-footer">
              <button className="fs__btn fs__btn--primary" onClick={() => setShowProps(false)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}

      {/* Upload progress */}
      {uploads.length > 0 && (
        <div className="fs__upload-toast">
          {uploads.map(u => (
            <div key={u.name} className="fs__upload-item">
              <div className="fs__upload-name">
                {u.done ? <CheckCircle2 size={12} style={{ color: '#3fb950' }}/> : <Upload size={12} style={{ color: 'var(--color-primary)' }}/>}
                <span>{u.name}</span>
              </div>
              <div className="fs__upload-bar">
                <div className="fs__upload-fill" style={{ width: `${u.progress}%`, background: u.done ? '#3fb950' : 'var(--color-primary)' }}/>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── File Viewer ── */}
      {viewer && (
        <FileViewer
          item={viewer.item}
          siblings={viewer.siblings}
          cwd={cwd}
          onClose={() => setViewer(null)}
          onNavigate={(item) => setViewer({ item, siblings: viewer.siblings })}
        />
      )}
    </div>
  );
}
