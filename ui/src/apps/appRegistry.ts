import type { AppDefinition } from '../types';

export const APPS: AppDefinition[] = [
  {
    id: 'file-station',
    name: 'File Station',
    icon: '📁',
    description: 'Administrador de archivos del sistema',
    defaultWidth: 920,
    defaultHeight: 620,
    minWidth: 640,
    minHeight: 420,
    color: '#f59e0b',
  },
  {
    id: 'control-panel',
    name: 'Panel de Control',
    icon: '⚙️',
    description: 'Configuración completa del sistema',
    defaultWidth: 980,
    defaultHeight: 660,
    minWidth: 760,
    minHeight: 520,
    color: '#6366f1',
  },
  {
    id: 'package-center',
    name: 'Centro de Paquetes',
    icon: '📦',
    description: 'Instalar y gestionar aplicaciones',
    defaultWidth: 880,
    defaultHeight: 620,
    minWidth: 640,
    minHeight: 420,
    color: '#10b981',
  },
  {
    id: 'terminal',
    name: 'Terminal',
    icon: '💻',
    description: 'Consola del sistema',
    defaultWidth: 720,
    defaultHeight: 460,
    minWidth: 400,
    minHeight: 300,
    color: '#1e3a5f',
  },
  {
    id: 'text-editor',
    name: 'Editor de Texto',
    icon: '📝',
    description: 'Editor de archivos de texto',
    defaultWidth: 760,
    defaultHeight: 560,
    minWidth: 420,
    minHeight: 320,
    color: '#3b82f6',
  },
  {
    id: 'calculator',
    name: 'Calculadora',
    icon: '🧮',
    description: 'Calculadora científica',
    defaultWidth: 300,
    defaultHeight: 460,
    minWidth: 260,
    minHeight: 400,
    color: '#8b5cf6',
  },
];

export const getApp = (id: string): AppDefinition | undefined =>
  APPS.find((a) => a.id === id);

