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
