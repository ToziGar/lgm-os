/**
 * Servicio de persistencia en localStorage para LGM OS.
 * Maneja toda la configuración del sistema de forma centralizada.
 */

const DB_PREFIX = 'lgmos-';

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(DB_PREFIX + key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T): void {
  try {
    localStorage.setItem(DB_PREFIX + key, JSON.stringify(value));
  } catch {
    // quota exceeded — silently ignore
  }
}

function remove(key: string): void {
  try {
    localStorage.removeItem(DB_PREFIX + key);
  } catch {
    // ignore
  }
}

/* ─── Types ─── */

export interface StoredUser {
  id: string;
  username: string;
  displayName: string;
  password: string; // hashed
  salt: string;
  email: string;
  isAdmin: boolean;
  status: 'active' | 'inactive' | 'locked';
  groups: string[];
  createdAt: string;
  lastLogin?: string;
  description: string;
  quota: number;       // MB
  usedQuota: number;
  canSMB: boolean;
  canFTP: boolean;
  canSFTP: boolean;
  canSSH: boolean;
}

export interface StoredGroup {
  id: string;
  name: string;
  description: string;
  members: string[];
  permissions: Record<string, string>;
  builtIn: boolean;
}

export interface StoredNetworkInterface {
  id: string;
  name: string;
  type: 'ethernet' | 'wifi' | 'bond' | 'bridge';
  mac: string;
  ip: string;
  netmask: string;
  gateway: string;
  dns1: string;
  dns2: string;
  mtu: number;
  enabled: boolean;
  dhcp: boolean;
  speed: string;
  status: 'connected' | 'disconnected' | 'error';
}

export interface StoredNetworkConfig {
  hostname: string;
  domain: string;
  workgroup: string;
  proxyEnabled: boolean;
  proxyHost: string;
  proxyPort: number;
  proxyBypass: string;
  firewallEnabled: boolean;
  firewallRules: StoredFirewallRule[];
  interfaces: StoredNetworkInterface[];
  bondingPairs: { name: string; slaves: string[]; mode: string }[];
}

export interface StoredFirewallRule {
  id: string;
  name: string;
  protocol: 'tcp' | 'udp' | 'both';
  port: number;
  source: string;
  action: 'allow' | 'deny';
  enabled: boolean;
  description: string;
}

export interface StoredPhysicalDisk {
  id: string;
  model: string;
  serial: string;
  slot: number;
  sizeGB: number;
  usedGB: number;
  status: string;
  temp: number;
  smart: { reallocatedSectors: number; pendingSectors: number; powerOnHours: number; health: number };
  type: 'HDD' | 'SSD' | 'NVMe';
  rpm?: number;
  volumeId?: string;
}

export interface StoredVolume {
  id: string;
  name: string;
  raidType: string;
  fsType: string;
  totalGB: number;
  usedGB: number;
  status: string;
  disks: string[];
  mountPoint: string;
  createdAt: string;
  encrypted: boolean;
  rebuildProgress?: number;
  description: string;
}

export interface StoredSharedFolder {
  id: string;
  name: string;
  volumeId: string;
  path: string;
  description: string;
  encrypted: boolean;
  hidden: boolean;
  protocols: string[];
  permissions: { userId?: string; groupId?: string; access: string }[];
  quotaGB: number;
  usedGB: number;
}

export interface StoredZFSVdev {
  id: string;
  type: string;
  diskIds: string[];
  status: string;
  readErrors: number;
  writeErrors: number;
  checksumErrors: number;
}

export interface StoredZFSPool {
  id: string;
  name: string;
  status: string;
  vdevs: StoredZFSVdev[];
  totalGB: number;
  usedGB: number;
  freeGB: number;
  dedupRatio: number;
  fragmentation: number;
  allocatable: number;
  guid: string;
  createdAt: string;
  feature_async_destroy: boolean;
  feature_encryption: boolean;
  feature_lz4_compress: boolean;
  feature_spacemap_v2: boolean;
  feature_zstd_compress: boolean;
  feature_device_removal: boolean;
  scrubStatus?: string;
  scrubProgress?: number;
  lastScrub?: string;
}

export interface StoredZFSDataset {
  id: string;
  poolId: string;
  name: string;
  type: string;
  mountPoint?: string;
  usedGB: number;
  availableGB: number;
  referencedGB: number;
  compression: string;
  checksum: string;
  atime: string;
  recordsize: string;
  quota: number;
  reservation: number;
  encryption: boolean;
  encrypted: boolean;
  keyStatus: string;
  sharenfs: string;
  sharesmb: string;
  dedup: boolean;
  readonly: boolean;
  origin: string;
  clones: string[];
  createdAt: string;
  description: string;
}

export interface StoredZFSSnapshot {
  id: string;
  poolId: string;
  datasetName: string;
  name: string;
  fullName: string;
  usedGB: number;
  referencedGB: number;
  createdAt: string;
  description: string;
  isAutomatic: boolean;
  retentionPolicy: string;
}

export interface StoredZFSSchedule {
  id: string;
  poolId: string;
  datasetPattern: string;
  frequency: string;
  keepCount: number;
  enabled: boolean;
  lastRun: string;
  nextRun: string;
}

export interface StoredSSHConfig {
  enabled: boolean;
  port: number;
  permitRootLogin: boolean;
  passwordAuth: boolean;
  pubkeyAuth: boolean;
  allowUsers: string;
  allowGroups: string;
  maxSessions: number;
  tcpForwarding: boolean;
  x11Forwarding: boolean;
  banner: string;
  authorizedKeys: { id: string; name: string; key: string; type: string; createdAt: string }[];
  activeSessions: { id: string; user: string; ip: string; loginAt: string; idle: string }[];
}

export interface StoredVPNConfig {
  serverEnabled: boolean;
  serverType: 'openvpn' | 'wireguard' | 'ipsec';
  serverPort: number;
  serverProtocol: 'udp' | 'tcp';
  serverSubnet: string;
  serverDNS: string;
  clients: { id: string; name: string; type: string; server: string; port: number; protocol: string; status: 'connected' | 'disconnected' | 'connecting'; connectedSince?: string; dataUp: string; dataDown: string }[];
  ovpnConfig: string;
  wgConfig: string;
}

export interface StoredTaskEntry {
  id: string;
  name: string;
  type: 'script' | 'rsync' | 'snapshot' | 'scrub' | 'smart' | 'custom';
  command: string;
  schedule: string;
  enabled: boolean;
  lastRun?: string;
  lastStatus?: 'success' | 'failed' | 'running';
  nextRun?: string;
  description: string;
  notifyOnFailure: boolean;
  runAsUser: string;
}

export interface StoredLogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warning' | 'error' | 'debug';
  service: string;
  message: string;
  details?: string;
}

export interface SystemConfig {
  initialized: boolean;
  version: string;
  adminCreated: boolean;
  hostname: string;
}

/* ─── DB Operations ─── */

export const db = {
  /* ─── System ─── */
  getConfig: () => read<SystemConfig>('config', {
    initialized: false,
    version: '1.0.0',
    adminCreated: false,
    hostname: 'LGM-NAS-01',
  }),
  setConfig: (c: Partial<SystemConfig>) => write('config', { ...db.getConfig(), ...c }),

  /* ─── Users ─── */
  getUsers: () => read<StoredUser[]>('users', []),
  setUsers: (users: StoredUser[]) => write('users', users),
  addUser: (user: StoredUser) => { const u = db.getUsers(); u.push(user); db.setUsers(u); },
  updateUser: (id: string, patch: Partial<StoredUser>) => {
    const users = db.getUsers();
    const idx = users.findIndex(u => u.id === id);
    if (idx !== -1) { users[idx] = { ...users[idx], ...patch }; db.setUsers(users); return users[idx]; }
    return null;
  },
  deleteUser: (id: string) => { db.setUsers(db.getUsers().filter(u => u.id !== id)); },
  findUserByUsername: (username: string) => db.getUsers().find(u => u.username === username),

  /* ─── Groups ─── */
  getGroups: () => read<StoredGroup[]>('groups', [
    { id: 'administrators', name: 'administrators', description: 'Administradores del sistema', members: [], permissions: {}, builtIn: true },
    { id: 'users', name: 'users', description: 'Usuarios del sistema', members: [], permissions: {}, builtIn: true },
    { id: 'guests', name: 'guests', description: 'Invitados', members: [], permissions: {}, builtIn: true },
  ]),
  setGroups: (groups: StoredGroup[]) => write('groups', groups),
  addGroup: (group: StoredGroup) => { const g = db.getGroups(); g.push(group); db.setGroups(g); },
  updateGroup: (id: string, patch: Partial<StoredGroup>) => {
    const groups = db.getGroups();
    const idx = groups.findIndex(g => g.id === id);
    if (idx !== -1) { groups[idx] = { ...groups[idx], ...patch }; db.setGroups(groups); return groups[idx]; }
    return null;
  },
  deleteGroup: (id: string) => { db.setGroups(db.getGroups().filter(g => g.id !== id)); },

  /* ─── Network ─── */
  getNetworkConfig: () => read<StoredNetworkConfig>('network', {
    hostname: 'LGM-NAS-01',
    domain: 'local',
    workgroup: 'WORKGROUP',
    proxyEnabled: false,
    proxyHost: '',
    proxyPort: 8080,
    proxyBypass: 'localhost,127.0.0.1,192.168.*',
    firewallEnabled: false,
    firewallRules: [
      { id: 'fw-1', name: 'HTTPS Web', protocol: 'tcp', port: 443, source: 'any', action: 'allow', enabled: true, description: 'Acceso HTTPS a la interfaz' },
      { id: 'fw-2', name: 'SSH', protocol: 'tcp', port: 22, source: '192.168.1.0/24', action: 'allow', enabled: true, description: 'Acceso SSH desde LAN' },
      { id: 'fw-3', name: 'SMB', protocol: 'tcp', port: 445, source: '192.168.1.0/24', action: 'allow', enabled: true, description: 'Compartición de archivos SMB' },
    ],
    interfaces: [
      { id: 'eth0', name: 'eth0', type: 'ethernet', mac: '00:1A:2B:3C:4D:5E', ip: '192.168.1.100', netmask: '255.255.255.0', gateway: '192.168.1.1', dns1: '8.8.8.8', dns2: '1.1.1.1', mtu: 1500, enabled: true, dhcp: false, speed: '1000 Mbps', status: 'connected' },
      { id: 'eth1', name: 'eth1', type: 'ethernet', mac: '00:1A:2B:3C:4D:5F', ip: '', netmask: '', gateway: '', dns1: '', dns2: '', mtu: 1500, enabled: false, dhcp: true, speed: '1000 Mbps', status: 'disconnected' },
    ],
    bondingPairs: [],
  }),
  setNetworkConfig: (c: StoredNetworkConfig) => write('network', c),

  /* ─── Storage ─── */
  getDisks: () => read<StoredPhysicalDisk[]>('disks', [
    { id: 'disk-1', model: 'WD Red Plus 4TB', serial: 'WD-WX42D1234567', slot: 1, sizeGB: 4000, usedGB: 2100, status: 'healthy', temp: 38, smart: { reallocatedSectors: 0, pendingSectors: 0, powerOnHours: 8760, health: 100 }, type: 'HDD', rpm: 5400 },
    { id: 'disk-2', model: 'WD Red Plus 4TB', serial: 'WD-WX42D7654321', slot: 2, sizeGB: 4000, usedGB: 2100, status: 'healthy', temp: 40, smart: { reallocatedSectors: 0, pendingSectors: 0, powerOnHours: 8760, health: 100 }, type: 'HDD', rpm: 5400 },
    { id: 'disk-3', model: 'Seagate IronWolf 8TB', serial: 'ST8000VN004-ABC123', slot: 3, sizeGB: 8000, usedGB: 5000, status: 'healthy', temp: 42, smart: { reallocatedSectors: 3, pendingSectors: 0, powerOnHours: 12000, health: 95 }, type: 'HDD', rpm: 7200 },
    { id: 'disk-4', model: 'Seagate IronWolf 8TB', serial: 'ST8000VN004-DEF456', slot: 4, sizeGB: 8000, usedGB: 5000, status: 'warning', temp: 48, smart: { reallocatedSectors: 12, pendingSectors: 2, powerOnHours: 12000, health: 82 }, type: 'HDD', rpm: 7200 },
  ]),
  setDisks: (d: StoredPhysicalDisk[]) => write('disks', d),
  getVolumes: () => read<StoredVolume[]>('volumes', [
    { id: 'vol-1', name: 'Volume 1', raidType: 'RAID 1', fsType: 'btrfs', totalGB: 4000, usedGB: 2100, status: 'normal', disks: ['disk-1', 'disk-2'], mountPoint: '/volume1', createdAt: '2025-01-15T10:00:00Z', encrypted: false, description: 'Volumen principal' },
    { id: 'vol-2', name: 'Volume 2', raidType: 'RAID 1', fsType: 'ext4', totalGB: 8000, usedGB: 5000, status: 'degraded', disks: ['disk-3', 'disk-4'], mountPoint: '/volume2', createdAt: '2025-03-20T14:30:00Z', encrypted: false, description: 'Volumen de datos' },
  ]),
  setVolumes: (v: StoredVolume[]) => write('volumes', v),
  getSharedFolders: () => read<StoredSharedFolder[]>('sharedFolders', [
    { id: 'sf-1', name: 'Documentos', volumeId: 'vol-1', path: '/volume1/Documentos', description: 'Documentos compartidos', encrypted: false, hidden: false, protocols: ['smb', 'nfs'], permissions: [{ groupId: 'users', access: 'write' }], quotaGB: 0, usedGB: 150 },
    { id: 'sf-2', name: 'Multimedia', volumeId: 'vol-2', path: '/volume2/Multimedia', description: 'Fotos, música y vídeos', encrypted: false, hidden: false, protocols: ['smb', 'webdav'], permissions: [{ groupId: 'users', access: 'read' }], quotaGB: 500, usedGB: 320 },
    { id: 'sf-3', name: 'Backups', volumeId: 'vol-2', path: '/volume2/Backups', description: 'Copias de seguridad', encrypted: true, hidden: false, protocols: ['smb', 'rsync'], permissions: [{ groupId: 'administrators', access: 'admin' }], quotaGB: 0, usedGB: 890 },
  ]),
  setSharedFolders: (f: StoredSharedFolder[]) => write('sharedFolders', f),

  /* ─── ZFS ─── */
  getZFSPools: () => read<StoredZFSPool[]>('zfsPools', [
    {
      id: 'pool-1', name: 'tank', status: 'ONLINE',
      vdevs: [{ id: 'vd-1', type: 'mirror', diskIds: ['disk-1', 'disk-2'], status: 'ONLINE', readErrors: 0, writeErrors: 0, checksumErrors: 0 }],
      totalGB: 4000, usedGB: 2100, freeGB: 1900, dedupRatio: 1.00, fragmentation: 12, allocatable: 85,
      guid: '12345678901234567890', createdAt: '2025-01-15T10:00:00Z',
      feature_async_destroy: true, feature_encryption: true, feature_lz4_compress: true,
      feature_spacemap_v2: true, feature_zstd_compress: true, feature_device_removal: false,
      scrubStatus: 'idle', lastScrub: '2025-06-10T03:00:00Z',
    },
  ]),
  setZFSPools: (p: StoredZFSPool[]) => write('zfsPools', p),
  getZFSDatasets: () => read<StoredZFSDataset[]>('zfsDatasets', [
    { id: 'ds-1', poolId: 'pool-1', name: 'tank/data', type: 'filesystem', mountPoint: '/tank/data', usedGB: 1500, availableGB: 1900, referencedGB: 1500, compression: 'lz4', checksum: 'on', atime: 'on', recordsize: '128K', quota: 0, reservation: 0, encryption: false, encrypted: false, keyStatus: 'available', sharenfs: 'on', sharesmb: 'on', dedup: false, readonly: false, origin: '', clones: [], createdAt: '2025-01-15T10:05:00Z', description: 'Datos generales' },
    { id: 'ds-2', poolId: 'pool-1', name: 'tank/data/documents', type: 'filesystem', mountPoint: '/tank/data/documents', usedGB: 300, availableGB: 1900, referencedGB: 300, compression: 'zstd', checksum: 'sha256', atime: 'relatime', recordsize: '64K', quota: 500, reservation: 0, encryption: true, encrypted: true, keyStatus: 'available', sharenfs: 'off', sharesmb: 'off', dedup: false, readonly: false, origin: '', clones: [], createdAt: '2025-01-15T10:10:00Z', description: 'Documentos importantes' },
    { id: 'ds-3', poolId: 'pool-1', name: 'tank/vms', type: 'volume', usedGB: 200, availableGB: 1900, referencedGB: 200, compression: 'lz4', checksum: 'on', atime: 'off', recordsize: '8K', quota: 300, reservation: 0, encryption: false, encrypted: false, keyStatus: 'available', sharenfs: 'off', sharesmb: 'off', dedup: false, readonly: false, origin: '', clones: [], createdAt: '2025-02-01T08:00:00Z', description: 'Discos de máquinas virtuales' },
  ]),
  setZFSDatasets: (d: StoredZFSDataset[]) => write('zfsDatasets', d),
  getZFSSnapshots: () => read<StoredZFSSnapshot[]>('zfsSnapshots', [
    { id: 'snap-1', poolId: 'pool-1', datasetName: 'tank/data', name: 'daily-2025-06-16', fullName: 'tank/data@daily-2025-06-16', usedGB: 0.5, referencedGB: 1490, createdAt: '2025-06-16T00:00:00Z', description: 'Snapshot diario automático', isAutomatic: true, retentionPolicy: 'keep 7 daily' },
  ]),
  setZFSSnapshots: (s: StoredZFSSnapshot[]) => write('zfsSnapshots', s),
  getZFSSchedules: () => read<StoredZFSSchedule[]>('zfsSchedules', [
    { id: 'sched-1', poolId: 'pool-1', datasetPattern: 'tank/**', frequency: 'daily', keepCount: 7, enabled: true, lastRun: '2025-06-16T00:00:00Z', nextRun: '2025-06-17T00:00:00Z' },
    { id: 'sched-2', poolId: 'pool-1', datasetPattern: 'tank/data/documents', frequency: 'hourly', keepCount: 24, enabled: true, lastRun: '2025-06-16T20:00:00Z', nextRun: '2025-06-16T21:00:00Z' },
  ]),
  setZFSSchedules: (s: StoredZFSSchedule[]) => write('zfsSchedules', s),

  /* ─── SSH ─── */
  getSSHConfig: () => read<StoredSSHConfig>('ssh', {
    enabled: false,
    port: 22,
    permitRootLogin: false,
    passwordAuth: true,
    pubkeyAuth: true,
    allowUsers: '',
    allowGroups: '',
    maxSessions: 10,
    tcpForwarding: false,
    x11Forwarding: false,
    banner: 'Bienvenido a LGM OS',
    authorizedKeys: [
      { id: 'key-1', name: 'Mi PC de escritorio', key: 'ssh-ed25519 AAAAC3NzaC1lZDI1NTE5...', type: 'ed25519', createdAt: '2025-01-20T15:00:00Z' },
    ],
    activeSessions: [
      { id: 'sess-1', user: 'admin', ip: '192.168.1.50', loginAt: '2025-06-16T19:45:00Z', idle: '5m' },
    ],
  }),
  setSSHConfig: (c: StoredSSHConfig) => write('ssh', c),

  /* ─── VPN ─── */
  getVPNConfig: () => read<StoredVPNConfig>('vpn', {
    serverEnabled: false,
    serverType: 'openvpn',
    serverPort: 1194,
    serverProtocol: 'udp',
    serverSubnet: '10.8.0.0/24',
    serverDNS: '8.8.8.8',
    clients: [
      { id: 'vpn-cli-1', name: 'Casa VPN', type: 'openvpn', server: 'vpn.mi-dominio.com', port: 1194, protocol: 'udp', status: 'connected', connectedSince: '2025-06-15T08:00:00Z', dataUp: '2.3 GB', dataDown: '15.7 GB' },
      { id: 'vpn-cli-2', name: 'Oficina WG', type: 'wireguard', server: '10.0.0.1', port: 51820, protocol: 'udp', status: 'disconnected', dataUp: '0 B', dataDown: '0 B' },
    ],
    ovpnConfig: '# Configuración OpenVPN Server\nport 1194\nproto udp\ndev tun\nserver 10.8.0.0 255.255.255.0',
    wgConfig: '# Configuración WireGuard\n[Interface]\nPrivateKey = ...\nAddress = 10.0.0.1/24',
  }),
  setVPNConfig: (c: StoredVPNConfig) => write('vpn', c),

  /* ─── Tasks ─── */
  getTasks: () => read<StoredTaskEntry[]>('tasks', [
    { id: 'task-1', name: 'Snapshot diario ZFS', type: 'snapshot', command: 'zfs snapshot tank/data@daily', schedule: '0 0 * * *', enabled: true, lastRun: '2025-06-16T00:00:00Z', lastStatus: 'success', nextRun: '2025-06-17T00:00:00Z', description: 'Crea snapshot diario del dataset tank/data', notifyOnFailure: true, runAsUser: 'root' },
    { id: 'task-2', name: 'Scrub semanal', type: 'scrub', command: 'zpool scrub tank', schedule: '0 3 * * 0', enabled: true, lastRun: '2025-06-15T03:00:00Z', lastStatus: 'success', nextRun: '2025-06-22T03:00:00Z', description: 'Scrub semanal del pool tank', notifyOnFailure: true, runAsUser: 'root' },
    { id: 'task-3', name: 'Backup config', type: 'script', command: '/opt/lgm-os/scripts/backup-config.sh', schedule: '0 2 * * *', enabled: false, description: 'Backup de configuración del sistema', notifyOnFailure: true, runAsUser: 'root' },
  ]),
  setTasks: (t: StoredTaskEntry[]) => write('tasks', t),
  addTask: (task: StoredTaskEntry) => { const t = db.getTasks(); t.push(task); db.setTasks(t); },
  updateTask: (id: string, patch: Partial<StoredTaskEntry>) => {
    const tasks = db.getTasks();
    const idx = tasks.findIndex(t => t.id === id);
    if (idx !== -1) { tasks[idx] = { ...tasks[idx], ...patch }; db.setTasks(tasks); return tasks[idx]; }
    return null;
  },
  deleteTask: (id: string) => { db.setTasks(db.getTasks().filter(t => t.id !== id)); },

  /* ─── Logs ─── */
  getLogs: () => read<StoredLogEntry[]>('logs', [
    { id: 'log-1', timestamp: '2025-06-16T20:30:00Z', level: 'info', service: 'system', message: 'Sistema iniciado correctamente' },
    { id: 'log-2', timestamp: '2025-06-16T20:25:00Z', level: 'info', service: 'nginx', message: 'Servidor web iniciado en puerto 80' },
    { id: 'log-3', timestamp: '2025-06-16T19:45:00Z', level: 'info', service: 'ssh', message: 'Sesión SSH aceptada para usuario admin desde 192.168.1.50' },
    { id: 'log-4', timestamp: '2025-06-16T18:00:00Z', level: 'warning', service: 'storage', message: 'Disco disk-4: sectores reasignados aumentando (12), SMART health 82%' },
    { id: 'log-5', timestamp: '2025-06-16T12:00:00Z', level: 'info', service: 'zfs', message: 'Snapshot diario completado: tank/data@daily-2025-06-16' },
    { id: 'log-6', timestamp: '2025-06-16T08:00:00Z', level: 'info', service: 'vpn', message: 'Cliente VPN "Casa VPN" conectado correctamente' },
    { id: 'log-7', timestamp: '2025-06-15T15:30:00Z', level: 'error', service: 'network', message: 'Interfaz eth1: enlace caído, sin cable detectado' },
    { id: 'log-8', timestamp: '2025-06-15T03:00:00Z', level: 'info', service: 'zfs', message: 'Scrub completado en pool tank: 0 errores, 2.1 TB verificados' },
  ]),
  setLogs: (l: StoredLogEntry[]) => write('logs', l.slice(0, 500)),
  addLog: (entry: StoredLogEntry) => {
    const logs = [entry, ...db.getLogs()].slice(0, 500);
    db.setLogs(logs);
  },
  clearLogs: () => write('logs', []),

  /* ─── Utility ─── */
  resetAll: () => {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(DB_PREFIX)) keys.push(key);
    }
    keys.forEach(k => localStorage.removeItem(k));
  },
};

/* ─── Hash helpers (same as systemStore) ─── */
function djb2Hash(str: string): string {
  let h = 5381;
  for (let i = 0; i < str.length; i++) { h = (h * 33) ^ str.charCodeAt(i); h = h >>> 0; }
  return h.toString(16).padStart(8, '0');
}

export function hashPassword(password: string, salt: string): string {
  let h = salt + password;
  for (let i = 0; i < 1000; i++) h = djb2Hash(h + salt);
  return h;
}

export function generateSalt(): string {
  return djb2Hash(Date.now().toString() + Math.random().toString());
}