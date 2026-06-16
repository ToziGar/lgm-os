/**
 * Modern SVG App Icons for LGM OS
 * DSM 7.3 + Apple macOS style
 */

import type { CSSProperties } from 'react';

interface IconProps {
  size?: number;
  style?: CSSProperties;
}

/* ── File Station ── */
export function IconFileStation({ size = 32, style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" style={style}>
      <rect width="64" height="64" rx="14" fill="url(#fs-bg)"/>
      <defs>
        <linearGradient id="fs-bg" x1="0" y1="0" x2="64" y2="64">
          <stop stopColor="#f59e0b"/>
          <stop offset="1" stopColor="#d97706"/>
        </linearGradient>
      </defs>
      <rect x="10" y="22" width="44" height="30" rx="4" fill="rgba(255,255,255,0.25)"/>
      <path d="M10 26a4 4 0 014-4h13l4 4H10z" fill="rgba(255,255,255,0.4)"/>
      <rect x="16" y="32" width="20" height="2.5" rx="1.2" fill="rgba(255,255,255,0.7)"/>
      <rect x="16" y="38" width="28" height="2.5" rx="1.2" fill="rgba(255,255,255,0.5)"/>
      <rect x="16" y="44" width="16" height="2.5" rx="1.2" fill="rgba(255,255,255,0.4)"/>
    </svg>
  );
}

/* ── Control Panel ── */
export function IconControlPanel({ size = 32, style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" style={style}>
      <rect width="64" height="64" rx="14" fill="url(#cp-bg)"/>
      <defs>
        <linearGradient id="cp-bg" x1="0" y1="0" x2="64" y2="64">
          <stop stopColor="#6366f1"/>
          <stop offset="1" stopColor="#4f46e5"/>
        </linearGradient>
      </defs>
      <circle cx="32" cy="32" r="13" fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="3"/>
      <circle cx="32" cy="32" r="5" fill="rgba(255,255,255,0.9)"/>
      {[0,60,120,180,240,300].map((deg,i) => {
        const r = 22, a = (deg-90)*Math.PI/180;
        return <circle key={i} cx={32+r*Math.cos(a)} cy={32+r*Math.sin(a)} r="2.5" fill="rgba(255,255,255,0.6)"/>;
      })}
    </svg>
  );
}

/* ── Package Center ── */
export function IconPackageCenter({ size = 32, style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" style={style}>
      <rect width="64" height="64" rx="14" fill="url(#pkg-bg)"/>
      <defs>
        <linearGradient id="pkg-bg" x1="0" y1="0" x2="64" y2="64">
          <stop stopColor="#10b981"/>
          <stop offset="1" stopColor="#059669"/>
        </linearGradient>
      </defs>
      <rect x="14" y="24" width="36" height="26" rx="3" fill="rgba(255,255,255,0.25)"/>
      <path d="M14 30l18-10 18 10v6L32 26 14 36z" fill="rgba(255,255,255,0.4)"/>
      <path d="M32 26v24" stroke="rgba(255,255,255,0.6)" strokeWidth="2"/>
      <path d="M14 36l18-10 18 10" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5"/>
      <circle cx="44" cy="44" r="8" fill="#34d399"/>
      <path d="M40.5 44l2.5 2.5 4-4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

/* ── Terminal ── */
export function IconTerminal({ size = 32, style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" style={style}>
      <rect width="64" height="64" rx="14" fill="url(#term-bg)"/>
      <defs>
        <linearGradient id="term-bg" x1="0" y1="0" x2="64" y2="64">
          <stop stopColor="#1e3a5f"/>
          <stop offset="0.5" stopColor="#0d2b4e"/>
          <stop offset="1" stopColor="#051525"/>
        </linearGradient>
      </defs>
      <rect x="10" y="14" width="44" height="36" rx="4" fill="rgba(255,255,255,0.06)" stroke="rgba(100,200,255,0.2)" strokeWidth="1"/>
      <circle cx="18" cy="21" r="2.5" fill="#ff5f57"/>
      <circle cx="25" cy="21" r="2.5" fill="#ffbd2e"/>
      <circle cx="32" cy="21" r="2.5" fill="#28c840"/>
      <path d="M14 28h36" stroke="rgba(255,255,255,0.08)" strokeWidth="1"/>
      <path d="M16 34l5-2.5-5-2.5" stroke="#3fb950" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <rect x="24" y="32" width="10" height="2" rx="1" fill="rgba(100,200,255,0.6)"/>
      <rect x="16" y="39" width="18" height="2" rx="1" fill="rgba(255,255,255,0.2)"/>
    </svg>
  );
}

/* ── Text Editor ── */
export function IconTextEditor({ size = 32, style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" style={style}>
      <rect width="64" height="64" rx="14" fill="url(#ted-bg)"/>
      <defs>
        <linearGradient id="ted-bg" x1="0" y1="0" x2="64" y2="64">
          <stop stopColor="#3b82f6"/>
          <stop offset="1" stopColor="#2563eb"/>
        </linearGradient>
      </defs>
      <rect x="12" y="12" width="40" height="40" rx="4" fill="rgba(255,255,255,0.15)"/>
      <rect x="18" y="20" width="28" height="2.5" rx="1.2" fill="rgba(255,255,255,0.8)"/>
      <rect x="18" y="26" width="22" height="2.5" rx="1.2" fill="rgba(255,255,255,0.6)"/>
      <rect x="18" y="32" width="26" height="2.5" rx="1.2" fill="rgba(255,255,255,0.6)"/>
      <rect x="18" y="38" width="14" height="2.5" rx="1.2" fill="rgba(255,255,255,0.4)"/>
      <rect x="33" y="38" width="2" height="6" rx="1" fill="rgba(255,255,255,0.9)"/>
    </svg>
  );
}

/* ── System Monitor ── */
export function IconSystemInfo({ size = 32, style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" style={style}>
      <rect width="64" height="64" rx="14" fill="url(#si-bg)"/>
      <defs>
        <linearGradient id="si-bg" x1="0" y1="0" x2="64" y2="64">
          <stop stopColor="#ef4444"/>
          <stop offset="1" stopColor="#dc2626"/>
        </linearGradient>
      </defs>
      <polyline points="10,44 18,32 24,38 32,20 40,30 46,24 54,36" fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="32" cy="20" r="3" fill="white"/>
      <rect x="10" y="46" width="44" height="2" rx="1" fill="rgba(255,255,255,0.2)"/>
    </svg>
  );
}

/* ── Calculator ── */
export function IconCalculator({ size = 32, style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" style={style}>
      <rect width="64" height="64" rx="14" fill="url(#calc-bg)"/>
      <defs>
        <linearGradient id="calc-bg" x1="0" y1="0" x2="64" y2="64">
          <stop stopColor="#8b5cf6"/>
          <stop offset="1" stopColor="#7c3aed"/>
        </linearGradient>
      </defs>
      <rect x="14" y="12" width="36" height="40" rx="5" fill="rgba(255,255,255,0.12)"/>
      <rect x="18" y="16" width="28" height="10" rx="3" fill="rgba(255,255,255,0.25)"/>
      <text x="41" y="24" textAnchor="end" fontSize="8" fill="white" fontFamily="monospace">123</text>
      {[[18,32],[29,32],[40,32],[18,40],[29,40],[40,40],[18,48],[29,48]].map(([x,y],i) => (
        <rect key={i} x={x} y={y} width="7" height="5" rx="2" fill="rgba(255,255,255,0.3)"/>
      ))}
      <rect x="40" y="40" width="7" height="13" rx="2" fill="rgba(255,255,255,0.6)"/>
    </svg>
  );
}

/* ── Network Services ── */
export function IconNetworkServices({ size = 32, style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" style={style}>
      <rect width="64" height="64" rx="14" fill="url(#net-bg)"/>
      <defs>
        <linearGradient id="net-bg" x1="0" y1="0" x2="64" y2="64">
          <stop stopColor="#0ea5e9"/>
          <stop offset="1" stopColor="#0284c7"/>
        </linearGradient>
      </defs>
      <circle cx="32" cy="16" r="5" fill="rgba(255,255,255,0.9)"/>
      <circle cx="16" cy="42" r="5" fill="rgba(255,255,255,0.9)"/>
      <circle cx="48" cy="42" r="5" fill="rgba(255,255,255,0.9)"/>
      <line x1="32" y1="21" x2="16" y2="37" stroke="rgba(255,255,255,0.5)" strokeWidth="2"/>
      <line x1="32" y1="21" x2="48" y2="37" stroke="rgba(255,255,255,0.5)" strokeWidth="2"/>
      <line x1="21" y1="42" x2="43" y2="42" stroke="rgba(255,255,255,0.5)" strokeWidth="2"/>
      <circle cx="32" cy="32" r="3" fill="rgba(255,255,255,0.6)"/>
    </svg>
  );
}

/* ── SSH Manager ── */
export function IconSSH({ size = 32, style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" style={style}>
      <rect width="64" height="64" rx="14" fill="url(#ssh-bg)"/>
      <defs>
        <linearGradient id="ssh-bg" x1="0" y1="0" x2="64" y2="64">
          <stop stopColor="#374151"/>
          <stop offset="1" stopColor="#1f2937"/>
        </linearGradient>
      </defs>
      <rect x="12" y="16" width="40" height="28" rx="4" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5"/>
      <circle cx="20" cy="23" r="2" fill="#ff5f57"/>
      <circle cx="26" cy="23" r="2" fill="#ffbd2e"/>
      <circle cx="32" cy="23" r="2" fill="#28c840"/>
      <text x="16" y="35" fontSize="7" fill="#3fb950" fontFamily="monospace">ssh admin@</text>
      <text x="16" y="42" fontSize="7" fill="#3fb950" fontFamily="monospace">192.168.1.100</text>
      <path d="M26 50l6-4 6 4" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" strokeLinecap="round"/>
      <rect x="29" y="50" width="6" height="5" rx="1" fill="rgba(255,255,255,0.3)"/>
    </svg>
  );
}

/* ── Shared Folders ── */
export function IconSharedFolders({ size = 32, style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" style={style}>
      <rect width="64" height="64" rx="14" fill="url(#sf-bg)"/>
      <defs>
        <linearGradient id="sf-bg" x1="0" y1="0" x2="64" y2="64">
          <stop stopColor="#f97316"/>
          <stop offset="1" stopColor="#ea580c"/>
        </linearGradient>
      </defs>
      <rect x="8" y="26" width="38" height="26" rx="4" fill="rgba(255,255,255,0.2)"/>
      <path d="M8 30a4 4 0 014-4h11l4 4H8z" fill="rgba(255,255,255,0.35)"/>
      <circle cx="44" cy="30" r="10" fill="#fb923c" stroke="rgba(255,255,255,0.5)" strokeWidth="2"/>
      <path d="M44 24v12M38 30h12" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
    </svg>
  );
}

/* ── VPN ── */
export function IconVPN({ size = 32, style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" style={style}>
      <rect width="64" height="64" rx="14" fill="url(#vpn-bg)"/>
      <defs>
        <linearGradient id="vpn-bg" x1="0" y1="0" x2="64" y2="64">
          <stop stopColor="#10b981"/>
          <stop offset="1" stopColor="#047857"/>
        </linearGradient>
      </defs>
      <path d="M32 10l18 8v14c0 10-8 18-18 22C22 50 14 42 14 32V18l18-8z" fill="rgba(255,255,255,0.2)" stroke="rgba(255,255,255,0.6)" strokeWidth="2"/>
      <path d="M24 31l5 5 11-11" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

/* ── Task Manager ── */
export function IconTaskManager({ size = 32, style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" style={style}>
      <rect width="64" height="64" rx="14" fill="url(#tm-bg)"/>
      <defs>
        <linearGradient id="tm-bg" x1="0" y1="0" x2="64" y2="64">
          <stop stopColor="#0f2744"/>
          <stop offset="1" stopColor="#071830"/>
        </linearGradient>
      </defs>
      <rect x="10" y="14" width="44" height="36" rx="4" fill="rgba(255,255,255,0.04)" stroke="rgba(100,180,255,0.15)" strokeWidth="1"/>
      <polyline points="14,40 20,30 26,34 32,22 38,28 44,20 50,26" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <polyline points="14,44 20,40 26,42 32,36 38,38 44,32 50,34" fill="none" stroke="#3b82f6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.7"/>
    </svg>
  );
}

/* ── Log Center ── */
export function IconLogCenter({ size = 32, style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" style={style}>
      <rect width="64" height="64" rx="14" fill="url(#lc-bg)"/>
      <defs>
        <linearGradient id="lc-bg" x1="0" y1="0" x2="64" y2="64">
          <stop stopColor="#1e40af"/>
          <stop offset="1" stopColor="#1d4ed8"/>
        </linearGradient>
      </defs>
      <rect x="12" y="12" width="40" height="40" rx="5" fill="rgba(255,255,255,0.08)"/>
      <rect x="18" y="19" width="5" height="5" rx="1.5" fill="rgba(0,184,124,0.9)"/>
      <rect x="18" y="29" width="5" height="5" rx="1.5" fill="rgba(245,158,11,0.9)"/>
      <rect x="18" y="39" width="5" height="5" rx="1.5" fill="rgba(239,68,68,0.9)"/>
      <rect x="27" y="21" width="19" height="2" rx="1" fill="rgba(255,255,255,0.5)"/>
      <rect x="27" y="31" width="15" height="2" rx="1" fill="rgba(255,255,255,0.4)"/>
      <rect x="27" y="41" width="17" height="2" rx="1" fill="rgba(255,255,255,0.35)"/>
    </svg>
  );
}

/* ── User Manager ── */
export function IconUserManager({ size = 32, style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" style={style}>
      <rect width="64" height="64" rx="14" fill="url(#um-bg)"/>
      <defs>
        <linearGradient id="um-bg" x1="0" y1="0" x2="64" y2="64">
          <stop stopColor="#6366f1"/>
          <stop offset="1" stopColor="#4f46e5"/>
        </linearGradient>
      </defs>
      <circle cx="24" cy="22" r="7" fill="rgba(255,255,255,0.85)"/>
      <path d="M10 46c0-8 6-12 14-12s14 4 14 12" fill="rgba(255,255,255,0.6)"/>
      <circle cx="44" cy="20" r="5" fill="rgba(255,255,255,0.5)"/>
      <path d="M34 42c0-5 4-9 10-9s10 4 10 9" fill="rgba(255,255,255,0.35)"/>
    </svg>
  );
}

/* ── Storage Manager ── */
export function IconStorageManager({ size = 32, style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" style={style}>
      <rect width="64" height="64" rx="14" fill="url(#stg-bg)"/>
      <defs>
        <linearGradient id="stg-bg" x1="0" y1="0" x2="64" y2="64">
          <stop stopColor="#1d4ed8"/>
          <stop offset="1" stopColor="#1e40af"/>
        </linearGradient>
      </defs>
      <rect x="10" y="12" width="44" height="12" rx="3" fill="rgba(255,255,255,0.3)" stroke="rgba(255,255,255,0.5)" strokeWidth="1"/>
      <rect x="10" y="26" width="44" height="12" rx="3" fill="rgba(255,255,255,0.2)" stroke="rgba(255,255,255,0.4)" strokeWidth="1"/>
      <rect x="10" y="40" width="44" height="12" rx="3" fill="rgba(255,255,255,0.1)" stroke="rgba(255,255,255,0.3)" strokeWidth="1"/>
      <circle cx="48" cy="18" r="3" fill="#00b87c"/>
      <circle cx="48" cy="32" r="3" fill="#00b87c"/>
      <circle cx="48" cy="46" r="3" fill="#f59e0b"/>
      <rect x="14" y="15.5" width="18" height="5" rx="1.5" fill="rgba(255,255,255,0.5)"/>
      <rect x="14" y="29.5" width="14" height="5" rx="1.5" fill="rgba(255,255,255,0.4)"/>
    </svg>
  );
}

/* ── ZFS Panel ── */
export function IconZFSPanel({ size = 32, style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" style={style}>
      <rect width="64" height="64" rx="14" fill="url(#zfs-bg)"/>
      <defs>
        <linearGradient id="zfs-bg" x1="0" y1="0" x2="64" y2="64">
          <stop stopColor="#0f172a"/>
          <stop offset="1" stopColor="#1e293b"/>
        </linearGradient>
      </defs>
      {/* Pool circles */}
      <circle cx="32" cy="18" r="9" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="2"/>
      <circle cx="18" cy="42" r="9" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2"/>
      <circle cx="46" cy="42" r="9" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2"/>
      {/* Connectors */}
      <line x1="32" y1="27" x2="18" y2="33" stroke="rgba(45,123,255,0.7)" strokeWidth="1.5"/>
      <line x1="32" y1="27" x2="46" y2="33" stroke="rgba(45,123,255,0.7)" strokeWidth="1.5"/>
      {/* Center dot */}
      <circle cx="32" cy="18" r="3" fill="#3b82f6"/>
      <circle cx="18" cy="42" r="3" fill="rgba(255,255,255,0.4)"/>
      <circle cx="46" cy="42" r="3" fill="rgba(255,255,255,0.4)"/>
      {/* ZFS label */}
      <text x="32" y="58" textAnchor="middle" fontSize="7" fontWeight="800" fontFamily="monospace" fill="rgba(255,255,255,0.5)" letterSpacing="1">ZFS</text>
    </svg>
  );
}

/* ── App icon map — accepts id → returns React node ── */
const ICON_MAP: Record<string, (props: IconProps) => JSX.Element> = {
  'file-station':      IconFileStation,
  'control-panel':     IconControlPanel,
  'package-center':    IconPackageCenter,
  'terminal':          IconTerminal,
  'text-editor':       IconTextEditor,
  'system-info':       IconSystemInfo,
  'calculator':        IconCalculator,
  'network-services':  IconNetworkServices,
  'ssh-manager':       IconSSH,
  'shared-folders':    IconSharedFolders,
  'vpn':               IconVPN,
  'vpn-manager':       IconVPN,
  'task-manager':      IconTaskManager,
  'log-center':        IconLogCenter,
  'user-manager':      IconUserManager,
  'storage-manager':   IconStorageManager,
  'zfs-panel':         IconZFSPanel,
};

export function AppIconSVG({ appId, size = 32, style }: { appId: string; size?: number; style?: CSSProperties }) {
  const Comp = ICON_MAP[appId];
  if (Comp) return <Comp size={size} style={style} />;
  return null;
}
