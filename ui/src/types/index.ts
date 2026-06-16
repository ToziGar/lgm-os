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
export type FSType = 'ext4' | 'btrfs' | 'xfs' | 'ntfs' | 'fat32';

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
