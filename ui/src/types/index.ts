export interface WindowState {
  id: string;
  title: string;
  appId: string;
  icon: string;
  x: number;
  y: number;
  width: number;
  height: number;
  minWidth: number;
  minHeight: number;
  isMinimized: boolean;
  isMaximized: boolean;
  isFocused: boolean;
  zIndex: number;
}

export interface AppDefinition {
  id: string;
  name: string;
  icon: string;
  description: string;
  defaultWidth: number;
  defaultHeight: number;
  minWidth?: number;
  minHeight?: number;
  color: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: Date;
  read: boolean;
}

export interface User {
  username: string;
  displayName: string;
  isAdmin: boolean;
}

export type Theme = 'light' | 'dark';

export interface FileItem {
  name: string;
  type: 'file' | 'folder';
  size?: string;
  modified?: string;
}

/* ─── User & Group Management ─── */
export type UserStatus = 'active' | 'inactive' | 'locked';
export type Permission = 'read' | 'write' | 'admin' | 'none';

export interface UserProfile {
  id: string;
  username: string;
  displayName: string;
  email: string;
  isAdmin: boolean;
  status: UserStatus;
  groups: string[];            // group IDs
  createdAt: string;
  lastLogin?: string;
  description?: string;
  quota?: number;              // MB, 0 = unlimited
  usedQuota?: number;          // MB
  canSMB: boolean;
  canFTP: boolean;
  canSFTP: boolean;
  canSSH: boolean;
}

export interface Group {
  id: string;
  name: string;
  description: string;
  members: string[];           // user IDs
  permissions: {
    [folderId: string]: Permission;
  };
  builtIn: boolean;            // system groups cannot be deleted
}

/* ─── Storage Management ─── */
export type DiskStatus = 'healthy' | 'warning' | 'failing' | 'failed' | 'unknown';
export type VolumeStatus = 'normal' | 'degraded' | 'rebuilding' | 'crashed' | 'readonly';
export type RAIDType = 'basic' | 'RAID 0' | 'RAID 1' | 'RAID 5' | 'RAID 6' | 'RAID 10' | 'SHR';
export type FSType = 'ext4' | 'btrfs' | 'xfs' | 'ntfs' | 'fat32' | 'zfs';

/* ─── ZFS types ─── */
export type ZFSPoolStatus  = 'ONLINE' | 'DEGRADED' | 'FAULTED' | 'OFFLINE' | 'UNAVAIL' | 'REMOVED' | 'SUSPENDED';
export type ZFSVdevType    = 'disk' | 'mirror' | 'raidz' | 'raidz2' | 'raidz3' | 'spare' | 'log' | 'cache' | 'special';
export type ZFSCompression = 'off' | 'lz4' | 'zstd' | 'zstd-1' | 'zstd-3' | 'zstd-9' | 'gzip' | 'gzip-1' | 'gzip-9' | 'lzjb' | 'zle';
export type ZFSChecksum    = 'on' | 'off' | 'sha256' | 'sha512' | 'skein' | 'edonr' | 'blake3';
export type ZFSAtime       = 'on' | 'off' | 'relatime';
export type ZFSRecordsize  = '512' | '1K' | '2K' | '4K' | '8K' | '16K' | '32K' | '64K' | '128K' | '256K' | '512K' | '1M';

export interface ZFSVdev {
  id: string;
  type: ZFSVdevType;
  diskIds: string[];           // PhysicalDisk IDs
  status: ZFSPoolStatus;
  readErrors:  number;
  writeErrors: number;
  checksumErrors: number;
}

export interface ZFSPool {
  id: string;
  name: string;                // e.g. "tank", "data", "rpool"
  status: ZFSPoolStatus;
  vdevs: ZFSVdev[];
  totalGB: number;
  usedGB: number;
  freeGB: number;
  dedupRatio: number;          // e.g. 1.23
  fragmentation: number;       // 0-100%
  allocatable: number;         // 0-100%
  guid: string;
  createdAt: string;
  feature_async_destroy: boolean;
  feature_encryption: boolean;
  feature_lz4_compress: boolean;
  feature_spacemap_v2: boolean;
  feature_zstd_compress: boolean;
  feature_device_removal: boolean;
  scrubStatus?: 'idle' | 'scrubbing' | 'scheduled';
  scrubProgress?: number;      // 0-100
  lastScrub?: string;
}

export interface ZFSDataset {
  id: string;
  poolId: string;
  name: string;                // full path e.g. "tank/data/documents"
  type: 'filesystem' | 'volume' | 'snapshot' | 'bookmark';
  mountPoint?: string;         // only for filesystems
  usedGB: number;
  availableGB: number;
  referencedGB: number;
  compression: ZFSCompression;
  checksum: ZFSChecksum;
  atime: ZFSAtime;
  recordsize: ZFSRecordsize;
  quota?: number;              // GB, 0=none
  reservation?: number;        // GB, 0=none
  encryption: boolean;
  encrypted?: boolean;
  keyStatus?: 'available' | 'unavailable';
  sharenfs?: string;           // NFS share config
  sharesmb?: string;           // SMB share config
  dedup: boolean;
  readonly: boolean;
  origin?: string;             // snapshot origin for clones
  clones?: string[];           // dataset IDs that are clones of this snapshot
  createdAt: string;
  description?: string;
}

export interface ZFSSnapshot {
  id: string;
  poolId: string;
  datasetName: string;         // parent dataset full name
  name: string;                // snapshot name e.g. "auto-2025-01-01"
  fullName: string;            // e.g. "tank/data@auto-2025-01-01"
  usedGB: number;
  referencedGB: number;
  createdAt: string;
  description?: string;
  isAutomatic: boolean;
  retentionPolicy?: string;    // e.g. "keep 7 daily"
}

export interface ZFSSchedule {
  id: string;
  poolId: string;
  datasetPattern: string;      // glob, e.g. "tank/**"
  frequency: 'hourly' | 'daily' | 'weekly' | 'monthly';
  keepCount: number;
  enabled: boolean;
  lastRun?: string;
  nextRun?: string;
}

export interface ZFSScrubStatus {
  poolId: string;
  status: 'none' | 'running' | 'completed' | 'canceled';
  progress?: number;
  startedAt?: string;
  duration?: string;
  repaired?: number;
  errors?: number;
}

export interface PhysicalDisk {
  id: string;
  model: string;
  serial: string;
  slot: number;                // bay number
  sizeGB: number;
  usedGB: number;
  status: DiskStatus;
  temp: number;                // Celsius
  smart: {
    reallocatedSectors: number;
    pendingSectors: number;
    powerOnHours: number;
    health: number;            // 0-100%
  };
  type: 'HDD' | 'SSD' | 'NVMe';
  rpm?: number;
  volumeId?: string;           // which volume it belongs to
}

export interface StorageVolume {
  id: string;
  name: string;
  raidType: RAIDType;
  fsType: FSType;
  totalGB: number;
  usedGB: number;
  status: VolumeStatus;
  disks: string[];             // disk IDs
  mountPoint: string;
  createdAt: string;
  encrypted: boolean;
  rebuildProgress?: number;    // 0-100 during rebuild
  description?: string;
}

export interface SharedFolder {
  id: string;
  name: string;
  volumeId: string;
  path: string;
  description: string;
  encrypted: boolean;
  hidden: boolean;
  protocols: ('smb' | 'nfs' | 'ftp' | 'sftp' | 'webdav' | 'rsync')[];
  permissions: { userId?: string; groupId?: string; access: Permission }[];
  quotaGB?: number;
  usedGB?: number;
}
