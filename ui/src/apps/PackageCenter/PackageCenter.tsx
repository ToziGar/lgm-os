import { useState, useRef, useEffect } from 'react';
import {
  Search, Download, RefreshCw, Star, Play, Square, Trash2,
  Settings, ExternalLink, ChevronDown, ChevronRight, Plus,
  Container, Globe, HardDrive, Cpu, MemoryStick, Tag,
  CheckCircle2, AlertCircle, Clock, ArrowUpRight, X, Info,
} from 'lucide-react';
import { useSystemStore } from '../../store/systemStore';
import './PackageCenter.css';

/* ──────────────────────────────────────────────────────────
   Types
   ────────────────────────────────────────────────────────── */
type ContainerStatus = 'running' | 'stopped' | 'pulling' | 'starting' | 'error' | 'removing';

interface PortMapping { host: number; container: number; proto: 'tcp' | 'udp'; label?: string; }
interface VolumeMount { host: string; container: string; label?: string; }
interface EnvVar      { key: string; value: string; description?: string; required?: boolean; }

interface DockerApp {
  id: string;
  name: string;
  tagline: string;
  description: string;
  icon: string;
  category: string;
  dockerImage: string;
  imageTag: string;
  ports: PortMapping[];
  volumes: VolumeMount[];
  env: EnvVar[];
  webUI?: string;          // path after http://host:PORT
  webUIPort?: number;
  rating: number;
  pulls: string;
  official: boolean;
  restartPolicy: 'always' | 'unless-stopped' | 'on-failure' | 'no';
  size: string;
  minRam?: string;
  requires?: string[];
}

interface RunningContainer {
  id: string;
  appId: string;
  name: string;
  image: string;
  status: ContainerStatus;
  ports: PortMapping[];
  volumes: VolumeMount[];
  env: Record<string, string>;
  created: string;
  uptime?: string;
  cpu?: number;
  mem?: number;
  logs: string[];
  webUIPort?: number;
  webUI?: string;
}

/* ──────────────────────────────────────────────────────────
   App catalogue
   ────────────────────────────────────────────────────────── */
const DOCKER_APPS: DockerApp[] = [
  {
    id: 'nginx',
    name: 'Nginx',
    tagline: 'Servidor web y proxy inverso de alto rendimiento',
    description: 'Nginx es un servidor web, proxy inverso y balanceador de carga usado por millones de sitios. Incluye soporte HTTPS, HTTP/2 y configuración por archivo.',
    icon: '🌐', category: 'Servidores', dockerImage: 'nginx', imageTag: 'latest',
    ports: [{ host: 8080, container: 80, proto: 'tcp', label: 'HTTP' }, { host: 8443, container: 443, proto: 'tcp', label: 'HTTPS' }],
    volumes: [{ host: '/volume1/nginx/html', container: '/usr/share/nginx/html', label: 'Web Root' }, { host: '/volume1/nginx/conf', container: '/etc/nginx/conf.d', label: 'Config' }],
    env: [{ key: 'NGINX_HOST', value: 'localhost', description: 'Nombre del servidor' }],
    webUI: '/', webUIPort: 8080, rating: 5, pulls: '1B+', official: true,
    restartPolicy: 'unless-stopped', size: '187 MB',
  },
  {
    id: 'mariadb',
    name: 'MariaDB',
    tagline: 'Base de datos relacional compatible con MySQL',
    description: 'MariaDB es un sistema de gestión de bases de datos relacionales de código abierto, fork de MySQL. Totalmente compatible y con mayor rendimiento.',
    icon: '🗄️', category: 'Bases de datos', dockerImage: 'mariadb', imageTag: '11',
    ports: [{ host: 3306, container: 3306, proto: 'tcp', label: 'MySQL/MariaDB' }],
    volumes: [{ host: '/volume1/mariadb/data', container: '/var/lib/mysql', label: 'Datos' }],
    env: [
      { key: 'MARIADB_ROOT_PASSWORD', value: '', description: 'Contraseña de root', required: true },
      { key: 'MARIADB_DATABASE', value: 'lgmos', description: 'Base de datos inicial' },
      { key: 'MARIADB_USER', value: 'admin', description: 'Usuario de BD' },
      { key: 'MARIADB_PASSWORD', value: '', description: 'Contraseña de usuario', required: true },
    ],
    rating: 5, pulls: '500M+', official: true, restartPolicy: 'unless-stopped', size: '404 MB',
  },
  {
    id: 'portainer',
    name: 'Portainer',
    tagline: 'Interfaz gráfica para gestionar Docker',
    description: 'Portainer es la forma más sencilla de gestionar contenedores Docker. Interfaz web completa para imágenes, contenedores, redes, volúmenes y stacks.',
    icon: '⚓', category: 'Herramientas', dockerImage: 'portainer/portainer-ce', imageTag: 'latest',
    ports: [{ host: 9000, container: 9000, proto: 'tcp', label: 'Web UI' }, { host: 9443, container: 9443, proto: 'tcp', label: 'HTTPS' }],
    volumes: [{ host: '/var/run/docker.sock', container: '/var/run/docker.sock', label: 'Docker Socket' }, { host: '/volume1/portainer', container: '/data', label: 'Datos' }],
    env: [],
    webUI: '/', webUIPort: 9000, rating: 5, pulls: '100M+', official: false,
    restartPolicy: 'always', size: '280 MB',
  },
  {
    id: 'nextcloud',
    name: 'Nextcloud',
    tagline: 'Nube privada con archivos, calendarios y más',
    description: 'Nextcloud es una plataforma de colaboración y nube privada. Comparte archivos, sincroniza calendarios, gestiona contactos y mucho más desde tu propio servidor.',
    icon: '☁️', category: 'Productividad', dockerImage: 'nextcloud', imageTag: 'stable',
    ports: [{ host: 8081, container: 80, proto: 'tcp', label: 'Web UI' }],
    volumes: [{ host: '/volume1/nextcloud/data', container: '/var/www/html/data', label: 'Datos' }, { host: '/volume1/nextcloud/config', container: '/var/www/html/config', label: 'Config' }],
    env: [
      { key: 'NEXTCLOUD_ADMIN_USER', value: 'admin', description: 'Usuario administrador' },
      { key: 'NEXTCLOUD_ADMIN_PASSWORD', value: '', description: 'Contraseña admin', required: true },
      { key: 'NEXTCLOUD_TRUSTED_DOMAINS', value: '192.168.1.100', description: 'Dominios permitidos' },
    ],
    webUI: '/', webUIPort: 8081, rating: 5, pulls: '100M+', official: true,
    restartPolicy: 'unless-stopped', size: '960 MB', minRam: '512 MB',
  },
  {
    id: 'plex',
    name: 'Plex Media Server',
    tagline: 'Servidor multimedia para películas y música',
    description: 'Plex organiza y transmite tus películas, series, música y fotos a cualquier dispositivo. Soporte para subtítulos, transcodificación y acceso remoto.',
    icon: '🎬', category: 'Multimedia', dockerImage: 'plexinc/pms-docker', imageTag: 'latest',
    ports: [{ host: 32400, container: 32400, proto: 'tcp', label: 'Web/API' }],
    volumes: [{ host: '/volume1/plex/config', container: '/config', label: 'Config' }, { host: '/volume2/Multimedia', container: '/media', label: 'Multimedia' }],
    env: [
      { key: 'PLEX_CLAIM', value: '', description: 'Token de reclamación (plex.tv/claim)' },
      { key: 'PLEX_UID', value: '1000', description: 'UID del proceso' },
      { key: 'PLEX_GID', value: '1000', description: 'GID del proceso' },
      { key: 'TZ', value: 'Europe/Madrid', description: 'Zona horaria' },
    ],
    webUI: '/web', webUIPort: 32400, rating: 4, pulls: '50M+', official: false,
    restartPolicy: 'unless-stopped', size: '1.2 GB', minRam: '2 GB',
  },
  {
    id: 'gitea',
    name: 'Gitea',
    tagline: 'Plataforma Git autoalojada ligera',
    description: 'Gitea es un servicio de Git autoalojado similar a GitHub. Gestiona repositorios, issues, pull requests, CI/CD y wikis con consumo mínimo de recursos.',
    icon: '🍵', category: 'Desarrollo', dockerImage: 'gitea/gitea', imageTag: '1.21',
    ports: [{ host: 3000, container: 3000, proto: 'tcp', label: 'Web UI' }, { host: 222, container: 22, proto: 'tcp', label: 'SSH Git' }],
    volumes: [{ host: '/volume1/gitea', container: '/data', label: 'Datos' }],
    env: [
      { key: 'GITEA__database__DB_TYPE', value: 'sqlite3', description: 'Tipo de BD' },
      { key: 'GITEA__server__DOMAIN', value: '192.168.1.100', description: 'Dominio del servidor' },
      { key: 'TZ', value: 'Europe/Madrid', description: 'Zona horaria' },
    ],
    webUI: '/', webUIPort: 3000, rating: 4, pulls: '50M+', official: false,
    restartPolicy: 'unless-stopped', size: '280 MB',
  },
  {
    id: 'pihole',
    name: 'Pi-hole',
    tagline: 'Bloqueador de anuncios a nivel de red DNS',
    description: 'Pi-hole actúa como servidor DNS en tu red y bloquea anuncios, rastreadores y malware antes de que lleguen a tus dispositivos. Sin instalar nada en cada equipo.',
    icon: '🕳️', category: 'Red', dockerImage: 'pihole/pihole', imageTag: 'latest',
    ports: [{ host: 53, container: 53, proto: 'tcp', label: 'DNS TCP' }, { host: 53, container: 53, proto: 'udp', label: 'DNS UDP' }, { host: 8082, container: 80, proto: 'tcp', label: 'Admin UI' }],
    volumes: [{ host: '/volume1/pihole/etc', container: '/etc/pihole', label: 'Config' }, { host: '/volume1/pihole/dnsmasq', container: '/etc/dnsmasq.d', label: 'DNS Config' }],
    env: [
      { key: 'WEBPASSWORD', value: '', description: 'Contraseña del panel web', required: true },
      { key: 'TZ', value: 'Europe/Madrid', description: 'Zona horaria' },
      { key: 'PIHOLE_DNS_', value: '8.8.8.8;8.8.4.4', description: 'DNS upstream' },
    ],
    webUI: '/admin', webUIPort: 8082, rating: 5, pulls: '50M+', official: false,
    restartPolicy: 'unless-stopped', size: '310 MB',
  },
  {
    id: 'redis',
    name: 'Redis',
    tagline: 'Almacén de datos en memoria ultrarrápido',
    description: 'Redis es una base de datos en memoria de código abierto usada como caché, broker de mensajes y cola de tareas. Compatible con estructuras de datos avanzadas.',
    icon: '🔴', category: 'Bases de datos', dockerImage: 'redis', imageTag: '7-alpine',
    ports: [{ host: 6379, container: 6379, proto: 'tcp', label: 'Redis' }],
    volumes: [{ host: '/volume1/redis/data', container: '/data', label: 'Datos' }],
    env: [{ key: 'REDIS_PASSWORD', value: '', description: 'Contraseña (opcional)' }],
    rating: 5, pulls: '1B+', official: true, restartPolicy: 'unless-stopped', size: '35 MB',
  },
  {
    id: 'wireguard',
    name: 'WireGuard Easy',
    tagline: 'Servidor VPN WireGuard con panel web',
    description: 'Despliegue WireGuard VPN con una interfaz web para gestionar clientes fácilmente. Genera configs QR y gestiona conexiones desde el navegador.',
    icon: '🔐', category: 'Red', dockerImage: 'weejewel/wg-easy', imageTag: 'latest',
    ports: [{ host: 51820, container: 51820, proto: 'udp', label: 'WireGuard' }, { host: 51821, container: 51821, proto: 'tcp', label: 'Web UI' }],
    volumes: [{ host: '/volume1/wg-easy', container: '/etc/wireguard', label: 'Config' }],
    env: [
      { key: 'WG_HOST', value: '0.0.0.0', description: 'IP pública o dominio del servidor', required: true },
      { key: 'PASSWORD', value: '', description: 'Contraseña del panel web', required: true },
      { key: 'WG_PORT', value: '51820', description: 'Puerto UDP de WireGuard' },
      { key: 'WG_DEFAULT_ADDRESS', value: '10.8.0.x', description: 'Rango de IPs de clientes' },
    ],
    webUI: '/', webUIPort: 51821, rating: 5, pulls: '20M+', official: false,
    restartPolicy: 'always', size: '85 MB',
  },
  {
    id: 'jellyfin',
    name: 'Jellyfin',
    tagline: 'Servidor multimedia libre, sin cuenta requerida',
    description: 'Jellyfin es la alternativa libre a Plex y Emby. Transmite películas, series, música y podcasts sin suscripción. Incluye cliente web y apps nativas.',
    icon: '🎵', category: 'Multimedia', dockerImage: 'jellyfin/jellyfin', imageTag: 'latest',
    ports: [{ host: 8096, container: 8096, proto: 'tcp', label: 'Web UI' }, { host: 8920, container: 8920, proto: 'tcp', label: 'HTTPS' }],
    volumes: [{ host: '/volume1/jellyfin/config', container: '/config', label: 'Config' }, { host: '/volume2/Multimedia', container: '/media', label: 'Multimedia' }],
    env: [{ key: 'TZ', value: 'Europe/Madrid', description: 'Zona horaria' }, { key: 'JELLYFIN_PublishedServerUrl', value: 'http://192.168.1.100:8096', description: 'URL pública' }],
    webUI: '/', webUIPort: 8096, rating: 5, pulls: '50M+', official: true,
    restartPolicy: 'unless-stopped', size: '420 MB',
  },
  {
    id: 'vaultwarden',
    name: 'Vaultwarden',
    tagline: 'Servidor Bitwarden alternativo ligero',
    description: 'Vaultwarden es una implementación compatible con Bitwarden en Rust. Gestiona contraseñas en tu propio servidor sin depender de servicios externos.',
    icon: '🔑', category: 'Seguridad', dockerImage: 'vaultwarden/server', imageTag: 'latest',
    ports: [{ host: 8083, container: 80, proto: 'tcp', label: 'Web UI' }],
    volumes: [{ host: '/volume1/vaultwarden/data', container: '/data', label: 'Datos' }],
    env: [
      { key: 'ADMIN_TOKEN', value: '', description: 'Token admin (genera uno seguro)', required: true },
      { key: 'DOMAIN', value: 'https://192.168.1.100:8083', description: 'URL completa del servicio' },
      { key: 'SIGNUPS_ALLOWED', value: 'false', description: 'Permitir registros' },
    ],
    webUI: '/', webUIPort: 8083, rating: 5, pulls: '30M+', official: false,
    restartPolicy: 'unless-stopped', size: '46 MB',
  },
  {
    id: 'prometheus',
    name: 'Prometheus',
    tagline: 'Sistema de monitorización y alertas',
    description: 'Prometheus recopila métricas de tus servicios y las almacena en una base de datos de series temporales. Úsalo con Grafana para paneles visuales.',
    icon: '📈', category: 'Monitorización', dockerImage: 'prom/prometheus', imageTag: 'latest',
    ports: [{ host: 9090, container: 9090, proto: 'tcp', label: 'Web UI' }],
    volumes: [{ host: '/volume1/prometheus/config', container: '/etc/prometheus', label: 'Config' }, { host: '/volume1/prometheus/data', container: '/prometheus', label: 'Datos' }],
    env: [],
    webUI: '/', webUIPort: 9090, rating: 4, pulls: '500M+', official: true,
    restartPolicy: 'unless-stopped', size: '220 MB',
  },
  {
    id: 'grafana',
    name: 'Grafana',
    tagline: 'Paneles de monitorización y visualización',
    description: 'Grafana es la plataforma de análisis y visualización más popular. Crea dashboards hermosos conectando Prometheus, InfluxDB, MySQL y decenas de fuentes de datos.',
    icon: '📊', category: 'Monitorización', dockerImage: 'grafana/grafana', imageTag: 'latest',
    ports: [{ host: 3001, container: 3000, proto: 'tcp', label: 'Web UI' }],
    volumes: [{ host: '/volume1/grafana/data', container: '/var/lib/grafana', label: 'Datos' }],
    env: [
      { key: 'GF_SECURITY_ADMIN_USER', value: 'admin', description: 'Usuario admin' },
      { key: 'GF_SECURITY_ADMIN_PASSWORD', value: '', description: 'Contraseña admin', required: true },
    ],
    webUI: '/', webUIPort: 3001, rating: 5, pulls: '500M+', official: true,
    restartPolicy: 'unless-stopped', size: '430 MB', requires: ['prometheus'],
  },
  {
    id: 'homeassistant',
    name: 'Home Assistant',
    tagline: 'Plataforma de automatización del hogar',
    description: 'Home Assistant es el hub de automatización del hogar más completo. Integra más de 3000 dispositivos, crea automatizaciones y dashboards visuales sin suscripción.',
    icon: '🏠', category: 'Smart Home', dockerImage: 'homeassistant/home-assistant', imageTag: 'stable',
    ports: [{ host: 8123, container: 8123, proto: 'tcp', label: 'Web UI' }],
    volumes: [{ host: '/volume1/homeassistant/config', container: '/config', label: 'Config' }],
    env: [{ key: 'TZ', value: 'Europe/Madrid', description: 'Zona horaria' }],
    webUI: '/', webUIPort: 8123, rating: 5, pulls: '100M+', official: true,
    restartPolicy: 'unless-stopped', size: '1.1 GB', minRam: '1 GB',
  },
  {
    id: 'uptime-kuma',
    name: 'Uptime Kuma',
    tagline: 'Monitor de disponibilidad de servicios',
    description: 'Uptime Kuma monitoriza el estado de tus servicios web, TCP y DNS con notificaciones por Telegram, email, Slack y más. Panel web bonito e intuitivo.',
    icon: '🟢', category: 'Monitorización', dockerImage: 'louislam/uptime-kuma', imageTag: '1',
    ports: [{ host: 3002, container: 3001, proto: 'tcp', label: 'Web UI' }],
    volumes: [{ host: '/volume1/uptime-kuma/data', container: '/app/data', label: 'Datos' }],
    env: [],
    webUI: '/', webUIPort: 3002, rating: 5, pulls: '20M+', official: false,
    restartPolicy: 'unless-stopped', size: '1.6 GB',
  },
];

const CATEGORIES = ['Todos', 'Activos', 'Servidores', 'Bases de datos', 'Multimedia', 'Productividad', 'Desarrollo', 'Red', 'Seguridad', 'Monitorización', 'Smart Home', 'Herramientas'];

/* ──────────────────────────────────────────────────────────
   Helpers
   ────────────────────────────────────────────────────────── */
function dockerRunCommand(app: DockerApp, envValues: Record<string, string>): string {
  const lines: string[] = [`docker run -d \\`, `  --name ${app.id} \\`, `  --restart ${app.restartPolicy} \\`];
  app.ports.forEach(p => lines.push(`  -p ${p.host}:${p.container}/${p.proto} \\`));
  app.volumes.forEach(v => lines.push(`  -v ${v.host}:${v.container} \\`));
  app.env.forEach(e => { const val = envValues[e.key] ?? e.value; if (val) lines.push(`  -e ${e.key}="${val}" \\`); });
  lines.push(`  ${app.dockerImage}:${app.imageTag}`);
  return lines.join('\n').replace(/\\\n  ([^\-])/g, '\\\n  $1');
}

function composeContent(app: DockerApp, envValues: Record<string, string>): string {
  let yaml = `version: '3.8'\nservices:\n  ${app.id}:\n    image: ${app.dockerImage}:${app.imageTag}\n    container_name: ${app.id}\n    restart: ${app.restartPolicy}\n`;
  if (app.ports.length) { yaml += `    ports:\n`; app.ports.forEach(p => { yaml += `      - "${p.host}:${p.container}/${p.proto}"\n`; }); }
  if (app.volumes.length) { yaml += `    volumes:\n`; app.volumes.forEach(v => { yaml += `      - ${v.host}:${v.container}\n`; }); }
  const envEntries = app.env.filter(e => (envValues[e.key] ?? e.value));
  if (envEntries.length) { yaml += `    environment:\n`; envEntries.forEach(e => { yaml += `      - ${e.key}=${envValues[e.key] ?? e.value}\n`; }); }
  return yaml;
}

function generateDeployLogs(app: DockerApp): string[] {
  return [
    `[Docker] Pulling ${app.dockerImage}:${app.imageTag}...`,
    `[Docker] ${app.imageTag}: Pulling from ${app.dockerImage}`,
    `[Docker] Digest: sha256:${Math.random().toString(16).slice(2, 18)}...`,
    `[Docker] Status: Downloaded newer image for ${app.dockerImage}:${app.imageTag}`,
    `[Docker] Creating container "${app.id}"...`,
    ...app.volumes.map(v => `[Docker] Mounting volume: ${v.host} → ${v.container}`),
    ...app.ports.map(p => `[Docker] Binding port: ${p.host}:${p.container}/${p.proto}`),
    `[Docker] Starting container "${app.id}"...`,
    `[Docker] Container "${app.id}" started successfully!`,
    `[Docker] Status: running  ID: ${Math.random().toString(16).slice(2, 14)}`,
    ...(app.webUI ? [`[Docker] Web UI available at: http://192.168.1.100:${app.webUIPort}${app.webUI}`] : []),
  ];
}

/* ──────────────────────────────────────────────────────────
   Deploy Wizard
   ────────────────────────────────────────────────────────── */
function DeployWizard({ app, onClose, onDeploy }: { app: DockerApp; onClose: () => void; onDeploy: (envValues: Record<string, string>, ports: PortMapping[], volumes: VolumeMount[]) => void }) {
  const [step, setStep]       = useState(0);
  const [envValues, setEnvValues] = useState<Record<string,string>>(
    Object.fromEntries(app.env.map(e => [e.key, e.value]))
  );
  const [ports, setPorts]     = useState<PortMapping[]>(app.ports.map(p => ({ ...p })));
  const [volumes, setVolumes] = useState<VolumeMount[]>(app.volumes.map(v => ({ ...v })));
  const [viewCompose, setViewCompose] = useState(false);

  const missingRequired = app.env.filter(e => e.required && !(envValues[e.key]?.trim()));

  const STEPS = ['Información', 'Puertos y volúmenes', 'Variables de entorno', 'Revisar'];

  return (
    <div className="pkg__wizard">
      <div className="pkg__wizard-header">
        <span className="pkg__wizard-icon">{app.icon}</span>
        <div>
          <h3>{app.name}</h3>
          <span className="pkg__wizard-image">{app.dockerImage}:{app.imageTag}</span>
        </div>
        <button className="pkg__wizard-close" onClick={onClose}><X size={16}/></button>
      </div>

      {/* Steps */}
      <div className="pkg__wizard-steps">
        {STEPS.map((s, i) => (
          <div key={i} className={`pkg__wizard-step ${i === step ? 'pkg__wizard-step--active' : ''} ${i < step ? 'pkg__wizard-step--done' : ''}`}>
            <div className="pkg__wizard-step-num">{i < step ? '✓' : i+1}</div>
            <span>{s}</span>
          </div>
        ))}
      </div>

      <div className="pkg__wizard-body">
        {/* Step 0: Info */}
        {step === 0 && (
          <div className="pkg__wizard-info">
            <p className="pkg__wizard-desc">{app.description}</p>
            <div className="pkg__wizard-meta-grid">
              <div className="pkg__wizard-meta-item"><Tag size={13}/><span>Imagen</span><code>{app.dockerImage}:{app.imageTag}</code></div>
              <div className="pkg__wizard-meta-item"><HardDrive size={13}/><span>Tamaño</span><strong>{app.size}</strong></div>
              {app.minRam && <div className="pkg__wizard-meta-item"><MemoryStick size={13}/><span>RAM mín.</span><strong>{app.minRam}</strong></div>}
              <div className="pkg__wizard-meta-item"><RefreshCw size={13}/><span>Reinicio</span><strong>{app.restartPolicy}</strong></div>
              {app.requires && <div className="pkg__wizard-meta-item"><Info size={13}/><span>Requiere</span><strong>{app.requires.join(', ')}</strong></div>}
            </div>
            {app.webUI && (
              <div className="pkg__wizard-webui">
                <Globe size={13}/>
                <span>Interfaz web en: <code>http://192.168.1.100:{app.webUIPort}{app.webUI}</code></span>
              </div>
            )}
          </div>
        )}

        {/* Step 1: Ports & Volumes */}
        {step === 1 && (
          <div className="pkg__wizard-ports-vols">
            <div className="pkg__wizard-section-title"><Globe size={13}/> Puertos</div>
            {ports.map((p, i) => (
              <div key={i} className="pkg__wizard-row">
                <div className="pkg__wizard-col">
                  <label>Host</label>
                  <input className="pkg__wizard-input" type="number" value={p.host}
                    onChange={e => setPorts(prev => prev.map((x,j) => j===i ? {...x, host: parseInt(e.target.value)||p.host} : x))}/>
                </div>
                <span className="pkg__wizard-arrow">→</span>
                <div className="pkg__wizard-col">
                  <label>Contenedor</label>
                  <input className="pkg__wizard-input" value={p.container} readOnly style={{ opacity: 0.6 }}/>
                </div>
                <span className="pkg__wizard-proto">{p.proto.toUpperCase()}</span>
                {p.label && <span className="pkg__wizard-label-tag">{p.label}</span>}
              </div>
            ))}

            <div className="pkg__wizard-section-title" style={{ marginTop: 14 }}><HardDrive size={13}/> Volúmenes</div>
            {volumes.map((v, i) => (
              <div key={i} className="pkg__wizard-row">
                <div className="pkg__wizard-col pkg__wizard-col--wide">
                  <label>Host (NAS)</label>
                  <input className="pkg__wizard-input" value={v.host}
                    onChange={e => setVolumes(prev => prev.map((x,j) => j===i ? {...x, host: e.target.value} : x))}/>
                </div>
                <span className="pkg__wizard-arrow">→</span>
                <div className="pkg__wizard-col pkg__wizard-col--wide">
                  <label>Contenedor</label>
                  <input className="pkg__wizard-input" value={v.container} readOnly style={{ opacity: 0.6 }}/>
                </div>
                {v.label && <span className="pkg__wizard-label-tag">{v.label}</span>}
              </div>
            ))}
          </div>
        )}

        {/* Step 2: Env vars */}
        {step === 2 && (
          <div className="pkg__wizard-env">
            {app.env.length === 0 ? (
              <div className="pkg__wizard-empty">Esta aplicación no requiere variables de entorno</div>
            ) : app.env.map(e => (
              <div key={e.key} className="pkg__wizard-env-row">
                <div className="pkg__wizard-env-key">
                  <code>{e.key}</code>
                  {e.required && <span className="pkg__wizard-required">requerido</span>}
                </div>
                {e.description && <p className="pkg__wizard-env-desc">{e.description}</p>}
                <input
                  className={`pkg__wizard-input ${e.required && !envValues[e.key]?.trim() ? 'pkg__wizard-input--error' : ''}`}
                  type={e.key.toLowerCase().includes('password') || e.key.toLowerCase().includes('token') ? 'password' : 'text'}
                  value={envValues[e.key] ?? ''}
                  placeholder={e.value || (e.required ? '⚠ Requerido' : 'Opcional')}
                  onChange={ev => setEnvValues(prev => ({ ...prev, [e.key]: ev.target.value }))}
                />
              </div>
            ))}
          </div>
        )}

        {/* Step 3: Review */}
        {step === 3 && (
          <div className="pkg__wizard-review">
            <div className="pkg__wizard-review-tabs">
              <button className={!viewCompose ? 'active' : ''} onClick={() => setViewCompose(false)}>docker run</button>
              <button className={viewCompose ? 'active' : ''} onClick={() => setViewCompose(true)}>docker-compose</button>
            </div>
            <pre className="pkg__wizard-cmd">
              {viewCompose ? composeContent(app, envValues) : dockerRunCommand(app, envValues)}
            </pre>
            {missingRequired.length > 0 && (
              <div className="pkg__wizard-missing">
                <AlertCircle size={14}/> Variables requeridas sin valor: {missingRequired.map(e => e.key).join(', ')}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="pkg__wizard-footer">
        {step > 0 && <button className="pkg__wbtn" onClick={() => setStep(s => s-1)}>← Atrás</button>}
        <div style={{ flex:1 }}/>
        {step < 3
          ? <button className="pkg__wbtn pkg__wbtn--primary" onClick={() => setStep(s => s+1)}>Siguiente →</button>
          : <button
              className="pkg__wbtn pkg__wbtn--deploy"
              disabled={missingRequired.length > 0}
              onClick={() => onDeploy(envValues, ports, volumes)}
            >
              <Play size={13}/> Desplegar contenedor
            </button>
        }
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────
   Container detail panel
   ────────────────────────────────────────────────────────── */
function ContainerDetail({ container, app, onClose, onStop, onStart, onRemove }: {
  container: RunningContainer; app: DockerApp | undefined;
  onClose: () => void; onStop: () => void; onStart: () => void; onRemove: () => void;
}) {
  const logsEndRef = useRef<HTMLDivElement>(null);
  useEffect(() => { logsEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [container.logs]);

  const copyCmd = () => navigator.clipboard.writeText(`docker logs ${container.name}`).catch(() => {});

  return (
    <div className="pkg__detail">
      <div className="pkg__detail-header">
        <span className="pkg__detail-icon">{app?.icon ?? '🐳'}</span>
        <div>
          <h4>{container.name}</h4>
          <span className="pkg__detail-image">{container.image}</span>
        </div>
        <button className="pkg__detail-close" onClick={onClose}>✕</button>
      </div>

      {/* Status bar */}
      <div className={`pkg__detail-status pkg__detail-status--${container.status}`}>
        <span className="pkg__detail-status-dot"/>
        <span>{container.status}</span>
        {container.uptime && <span className="pkg__detail-uptime">• {container.uptime}</span>}
        {container.cpu !== undefined && <span className="pkg__detail-perf">CPU {container.cpu}%</span>}
        {container.mem !== undefined && <span className="pkg__detail-perf">RAM {container.mem} MB</span>}
      </div>

      {/* Actions */}
      <div className="pkg__detail-actions">
        {container.status === 'running'
          ? <button className="pkg__daction pkg__daction--stop" onClick={onStop}><Square size={13}/> Detener</button>
          : <button className="pkg__daction pkg__daction--start" onClick={onStart}><Play size={13}/> Iniciar</button>
        }
        {container.webUI && container.status === 'running' && (
          <a className="pkg__daction pkg__daction--web" href={`http://192.168.1.100:${container.webUIPort}${container.webUI}`} target="_blank" rel="noopener noreferrer">
            <Globe size={13}/> Abrir Web UI
          </a>
        )}
        <button className="pkg__daction pkg__daction--remove" onClick={onRemove}><Trash2 size={13}/> Eliminar</button>
      </div>

      {/* Ports */}
      {container.ports.length > 0 && (
        <div className="pkg__detail-section">
          <div className="pkg__detail-section-title">Puertos</div>
          {container.ports.map((p, i) => (
            <div key={i} className="pkg__detail-port-row">
              <Globe size={12} style={{ color: 'var(--text-muted)' }}/>
              <code>:{p.host}</code>
              <span>→</span>
              <code>:{p.container}/{p.proto}</code>
              {p.label && <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>{p.label}</span>}
            </div>
          ))}
        </div>
      )}

      {/* Logs */}
      <div className="pkg__detail-section pkg__detail-section--logs">
        <div className="pkg__detail-section-title">
          Registros del contenedor
          <button className="pkg__detail-copy" onClick={copyCmd} title="Copiar comando docker logs">📋 Copiar</button>
        </div>
        <div className="pkg__detail-logs">
          {container.logs.map((line, i) => (
            <div key={i} className={`pkg__detail-log-line ${line.includes('Error') || line.includes('error') ? 'pkg__detail-log-line--error' : ''} ${line.includes('successfully') || line.includes('started') ? 'pkg__detail-log-line--ok' : ''}`}>
              {line}
            </div>
          ))}
          <div ref={logsEndRef}/>
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────
   Main component
   ────────────────────────────────────────────────────────── */
type ViewTab = 'store' | 'containers';

export function PackageCenter() {
  const { addNotification } = useSystemStore();
  const [viewTab, setViewTab] = useState<ViewTab>('store');
  const [search, setSearch]   = useState('');
  const [category, setCategory] = useState('Todos');
  const [containers, setContainers] = useState<RunningContainer[]>([
    { id: 'c-nginx', appId: 'nginx', name: 'nginx', image: 'nginx:latest', status: 'running',
      ports: [{ host: 8080, container: 80, proto: 'tcp', label: 'HTTP' }],
      volumes: [{ host: '/volume1/nginx/html', container: '/usr/share/nginx/html' }],
      env: {}, created: '01/01/2025', uptime: '3d 7h 12m', cpu: 0.2, mem: 18,
      webUIPort: 8080, webUI: '/',
      logs: ['[Docker] nginx:latest started', '[Docker] Worker processes: 8', '[Docker] Listening on :80'] },
    { id: 'c-mariadb', appId: 'mariadb', name: 'mariadb', image: 'mariadb:11', status: 'running',
      ports: [{ host: 3306, container: 3306, proto: 'tcp', label: 'MySQL' }],
      volumes: [{ host: '/volume1/mariadb/data', container: '/var/lib/mysql' }],
      env: {}, created: '01/01/2025', uptime: '3d 7h 12m', cpu: 1.4, mem: 425,
      logs: ['[Docker] mariadb:11 started', '[Docker] InnoDB initialized', '[Docker] Ready for connections on :3306'] },
  ]);
  const [wizardApp,   setWizardApp]   = useState<DockerApp | null>(null);
  const [selectedId,  setSelectedId]  = useState<string | null>(null);
  const [deploying,   setDeploying]   = useState<string | null>(null);

  const runningIds = new Set(containers.map(c => c.appId));

  const filtered = DOCKER_APPS.filter(app => {
    const matchSearch = !search ||
      app.name.toLowerCase().includes(search.toLowerCase()) ||
      app.tagline.toLowerCase().includes(search.toLowerCase()) ||
      app.dockerImage.toLowerCase().includes(search.toLowerCase());
    const matchCat = category === 'Todos' || (category === 'Activos' ? runningIds.has(app.id) : app.category === category);
    return matchSearch && matchCat;
  });

  const selectedContainer = containers.find(c => c.id === selectedId);
  const selectedApp = selectedContainer ? DOCKER_APPS.find(a => a.id === selectedContainer.appId) : undefined;

  /* ── Deploy ── */
  const deploy = async (app: DockerApp, envValues: Record<string,string>, ports: PortMapping[], volumes: VolumeMount[]) => {
    setWizardApp(null);
    setDeploying(app.id);
    const cid = `c-${app.id}`;

    const newContainer: RunningContainer = {
      id: cid, appId: app.id, name: app.id,
      image: `${app.dockerImage}:${app.imageTag}`,
      status: 'pulling', ports, volumes, env: envValues,
      created: new Date().toLocaleDateString('es-ES'),
      webUIPort: app.webUIPort, webUI: app.webUI,
      logs: [],
    };
    setContainers(prev => [...prev, newContainer]);
    setSelectedId(cid);
    setViewTab('containers');

    const logLines = generateDeployLogs(app);
    for (const line of logLines) {
      await new Promise(r => setTimeout(r, 200 + Math.random() * 300));
      setContainers(prev => prev.map(c => c.id === cid ? {
        ...c,
        status: line.includes('started successfully') ? 'running' : line.includes('Starting') ? 'starting' : 'pulling',
        logs: [...c.logs, line],
      } : c));
    }

    setContainers(prev => prev.map(c => c.id === cid ? {
      ...c, status: 'running', uptime: '0m 1s', cpu: Math.round(Math.random() * 5 * 10) / 10, mem: Math.round(30 + Math.random() * 200),
    } : c));
    setDeploying(null);
    addNotification(`${app.name} desplegado`, `Contenedor activo en puerto ${ports[0]?.host ?? '?'}`, 'success');
  };

  const stopContainer = (id: string) => {
    setContainers(prev => prev.map(c => c.id === id ? { ...c, status: 'stopped', uptime: undefined, cpu: undefined, mem: undefined } : c));
    addNotification('Contenedor detenido', containers.find(c=>c.id===id)?.name ?? '', 'info');
  };

  const startContainer = (id: string) => {
    setContainers(prev => prev.map(c => c.id === id ? { ...c, status: 'starting' } : c));
    setTimeout(() => {
      setContainers(prev => prev.map(c => c.id === id ? { ...c, status: 'running', uptime: '0m 1s', cpu: 0.5, mem: 50 } : c));
    }, 1200);
  };

  const removeContainer = (id: string) => {
    const name = containers.find(c=>c.id===id)?.name ?? '';
    setContainers(prev => prev.map(c => c.id === id ? { ...c, status: 'removing' } : c));
    setTimeout(() => {
      setContainers(prev => prev.filter(c => c.id !== id));
      if (selectedId === id) setSelectedId(null);
      addNotification('Contenedor eliminado', name, 'warning');
    }, 800);
  };

  const catCounts: Record<string, number> = {};
  DOCKER_APPS.forEach(a => { catCounts[a.category] = (catCounts[a.category] || 0) + 1; });

  return (
    <div className="pkg">
      {/* Top bar */}
      <div className="pkg__topbar">
        <div className="pkg__view-tabs">
          <button className={`pkg__view-tab ${viewTab === 'store' ? 'pkg__view-tab--active' : ''}`} onClick={() => setViewTab('store')}>
            <Download size={13}/> Tienda ({DOCKER_APPS.length})
          </button>
          <button className={`pkg__view-tab ${viewTab === 'containers' ? 'pkg__view-tab--active' : ''}`} onClick={() => setViewTab('containers')}>
            <Container size={13}/> Contenedores ({containers.length})
            {containers.filter(c => c.status === 'running').length > 0 && (
              <span className="pkg__running-dot"/>
            )}
          </button>
        </div>

        {viewTab === 'store' && (
          <div className="pkg__search-wrap">
            <Search size={13} className="pkg__search-icon"/>
            <input type="text" className="pkg__search" placeholder="Buscar en el catálogo..."
              value={search} onChange={e => setSearch(e.target.value)}/>
          </div>
        )}

        <button className="pkg__refresh" title="Actualizar catálogo" onClick={() => addNotification('Catálogo', 'Catálogo de Docker Hub actualizado', 'success')}>
          <RefreshCw size={14}/>
        </button>
      </div>

      {/* Store view */}
      {viewTab === 'store' && (
        <div className="pkg__layout">
          <aside className="pkg__sidebar">
            {CATEGORIES.map(cat => (
              <button key={cat} className={`pkg__cat-btn ${category === cat ? 'pkg__cat-btn--active' : ''}`} onClick={() => setCategory(cat)}>
                {cat}
                <span className="pkg__cat-count">
                  {cat === 'Todos' ? DOCKER_APPS.length : cat === 'Activos' ? runningIds.size : catCounts[cat] ?? 0}
                </span>
              </button>
            ))}
          </aside>

          <div className="pkg__main">
            <div className="pkg__grid">
              {filtered.map(app => {
                const isRunning = runningIds.has(app.id);
                const isDeploying = deploying === app.id;
                return (
                  <div key={app.id} className={`pkg__card ${isRunning ? 'pkg__card--installed' : ''}`}>
                    <div className="pkg__card-top">
                      <span className="pkg__card-icon">{app.icon}</span>
                      <div className="pkg__card-meta">
                        <span className="pkg__card-name">{app.name}</span>
                        <span className="pkg__card-version">{app.dockerImage}:{app.imageTag}</span>
                        <div className="pkg__stars">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star key={i} size={10} fill={i < app.rating ? '#f59e0b' : 'none'} stroke={i < app.rating ? '#f59e0b' : 'currentColor'} style={{ color: '#d1d5db' }}/>
                          ))}
                        </div>
                      </div>
                      <div className="pkg__card-badges">
                        {app.official && <span className="pkg__official-badge">Oficial</span>}
                        {isRunning && <CheckCircle2 size={15} style={{ color: '#00b87c' }}/>}
                      </div>
                    </div>

                    <p className="pkg__card-desc">{app.tagline}</p>

                    {/* Port preview */}
                    <div className="pkg__card-ports">
                      {app.ports.slice(0, 3).map((p, i) => (
                        <span key={i} className="pkg__port-chip">:{p.host}</span>
                      ))}
                      {app.webUI && <span className="pkg__webui-chip"><Globe size={10}/> Web UI</span>}
                    </div>

                    <div className="pkg__card-footer">
                      <span className="pkg__card-cat">{app.category}</span>
                      <span className="pkg__card-size">{app.pulls} pulls</span>
                      {isRunning ? (
                        <button className="pkg__btn pkg__btn--manage"
                          onClick={() => { setSelectedId(`c-${app.id}`); setViewTab('containers'); }}>
                          <Settings size={11}/> Gestionar
                        </button>
                      ) : (
                        <button className="pkg__btn pkg__btn--install"
                          onClick={() => setWizardApp(app)}
                          disabled={isDeploying}>
                          {isDeploying ? <><span className="pkg__spinner"/> Desplegando…</> : <><Play size={11}/> Desplegar</>}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
              {filtered.length === 0 && <div className="pkg__empty">Sin resultados para "{search}"</div>}
            </div>
          </div>
        </div>
      )}

      {/* Containers view */}
      {viewTab === 'containers' && (
        <div className="pkg__containers-layout">
          <div className="pkg__container-list">
            {containers.length === 0 && (
              <div className="pkg__empty-containers">
                <Container size={36} style={{ color: 'var(--text-muted)', marginBottom: 10 }}/>
                <p>No hay contenedores activos</p>
                <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Ve a la Tienda y despliega tu primera app</p>
                <button className="pkg__btn pkg__btn--install" style={{ marginTop: 12 }} onClick={() => setViewTab('store')}>
                  <Download size={12}/> Ir a la Tienda
                </button>
              </div>
            )}
            {containers.map(c => {
              const app = DOCKER_APPS.find(a => a.id === c.appId);
              return (
                <div key={c.id}
                  className={`pkg__container-row ${selectedId === c.id ? 'pkg__container-row--sel' : ''} pkg__container-row--${c.status}`}
                  onClick={() => setSelectedId(c.id === selectedId ? null : c.id)}
                >
                  <span className="pkg__container-icon">{app?.icon ?? '🐳'}</span>
                  <div className="pkg__container-info">
                    <span className="pkg__container-name">{c.name}</span>
                    <span className="pkg__container-image">{c.image}</span>
                  </div>
                  <div className="pkg__container-right">
                    <span className={`pkg__container-status pkg__container-status--${c.status}`}>
                      {c.status === 'running' && <span className="pkg__running-dot"/>}
                      {c.status === 'pulling' && <RefreshCw size={10} className="pkg__spin"/>}
                      {c.status === 'starting' && <Clock size={10}/>}
                      {c.status === 'error' && <AlertCircle size={10}/>}
                      {c.status}
                    </span>
                    {c.uptime && <span className="pkg__container-uptime">{c.uptime}</span>}
                    {c.ports[0] && (
                      <span className="pkg__container-port">:{c.ports[0].host}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {selectedContainer ? (
            <ContainerDetail
              container={selectedContainer}
              app={selectedApp}
              onClose={() => setSelectedId(null)}
              onStop={() => stopContainer(selectedContainer.id)}
              onStart={() => startContainer(selectedContainer.id)}
              onRemove={() => removeContainer(selectedContainer.id)}
            />
          ) : (
            <div className="pkg__detail-empty">
              <Container size={32} style={{ color: 'var(--text-muted)' }}/>
              <p>Selecciona un contenedor para ver detalles</p>
            </div>
          )}
        </div>
      )}

      {/* Deploy Wizard overlay */}
      {wizardApp && (
        <>
          <div className="pkg__overlay" onClick={() => setWizardApp(null)}/>
          <div className="pkg__wizard-wrap">
            <DeployWizard
              app={wizardApp}
              onClose={() => setWizardApp(null)}
              onDeploy={(env, ports, vols) => deploy(wizardApp, env, ports, vols)}
            />
          </div>
        </>
      )}
    </div>
  );
}
