import { useState, useRef, useEffect, useCallback } from 'react';
import { Plus, Terminal as TermIcon, Copy, Maximize2, Square } from 'lucide-react';
import { useStorageStore } from '../../store/storageStore';
import { useUserStore }    from '../../store/userStore';
import { useZFSStore }     from '../../store/zfsStore';
import { useSystemStore }  from '../../store/systemStore';
import './Terminal.css';

/* ─── Types ─── */
interface Line {
  type: 'input' | 'output' | 'error' | 'system' | 'warn';
  text: string;
}

/* ─── Config ─── */
const HOSTNAME = 'lgm-nas-01';
const prompt   = (cwd: string, user = 'admin') => `${user}@${HOSTNAME}:${cwd}$ `;

/* ─── Virtual filesystem (enriched with NAS paths) ─── */
const VFS: Record<string, { name: string; type: 'd' | 'f'; size?: number; perm?: string }[]> = {
  '~': [
    { name: 'Documentos',  type: 'd', perm: 'drwxr-xr-x' },
    { name: 'Descargas',   type: 'd', perm: 'drwxr-xr-x' },
    { name: 'Imágenes',    type: 'd', perm: 'drwxr-xr-x' },
    { name: '.ssh',        type: 'd', perm: 'drwx------' },
    { name: '.bashrc',     type: 'f', size: 420, perm: '-rw-r--r--' },
    { name: '.profile',    type: 'f', size: 807, perm: '-rw-r--r--' },
    { name: 'README.md',   type: 'f', size: 1280, perm: '-rw-r--r--' },
  ],
  '/volume1': [
    { name: 'Documentos',  type: 'd', perm: 'drwxrwxr-x' },
    { name: 'Multimedia',  type: 'd', perm: 'drwxrwxr-x' },
    { name: 'Backup',      type: 'd', perm: 'drwx------' },
    { name: 'web',         type: 'd', perm: 'drwxr-xr-x' },
  ],
  '/volume2': [
    { name: 'Multimedia',  type: 'd', perm: 'drwxrwxr-x' },
    { name: 'Backup',      type: 'd', perm: 'drwx------' },
  ],
  '/etc': [
    { name: 'hostname',    type: 'f', size: 13,   perm: '-rw-r--r--' },
    { name: 'hosts',       type: 'f', size: 222,  perm: '-rw-r--r--' },
    { name: 'fstab',       type: 'f', size: 745,  perm: '-rw-r--r--' },
    { name: 'passwd',      type: 'f', size: 1620, perm: '-rw-r--r--' },
    { name: 'smb.conf',    type: 'f', size: 3840, perm: '-rw-r--r--' },
    { name: 'nginx',       type: 'd', perm: 'drwxr-xr-x' },
    { name: 'wireguard',   type: 'd', perm: 'drwx------' },
  ],
  '/etc/wireguard': [
    { name: 'wg0.conf',    type: 'f', size: 512, perm: '-rw-------' },
  ],
  '/var/log': [
    { name: 'syslog',      type: 'f', size: 524288, perm: '-rw-r-----' },
    { name: 'auth.log',    type: 'f', size: 65536,  perm: '-rw-r-----' },
    { name: 'nginx',       type: 'd', perm: 'drwxr-xr-x' },
    { name: 'mariadb.log', type: 'f', size: 10240,  perm: '-rw-r-----' },
  ],
  '~/.ssh': [
    { name: 'authorized_keys', type: 'f', size: 428, perm: '-rw-------' },
    { name: 'id_ed25519',      type: 'f', size: 411, perm: '-rw-------' },
    { name: 'id_ed25519.pub',  type: 'f', size: 109, perm: '-rw-r--r--' },
    { name: 'known_hosts',     type: 'f', size: 867, perm: '-rw-r--r--' },
  ],
};

const FILE_CONTENTS: Record<string, string> = {
  '.bashrc': '# .bashrc — LGM OS\nexport PATH=$PATH:/usr/local/sbin:/usr/local/bin\nexport EDITOR=nano\nalias ll="ls -la --color=auto"\nalias la="ls -A"\nalias l="ls -CF"\nalias update="apt update && apt upgrade -y"\nalias df="df -h"\nalias free="free -h"\nalias ports="ss -tlnp"\nalias zpool-status="zpool status -v"\n\n# NAS aliases\nalias smb-status="systemctl status smbd"\nalias sftp-config="cat /etc/ssh/sshd_config | grep SFTP"',
  '.profile': '# ~/.profile\nif [ -f ~/.bashrc ]; then\n  . ~/.bashrc\nfi\nexport HISTSIZE=10000\nexport HISTFILESIZE=20000\nexport HISTTIMEFORMAT="%F %T "',
  'README.md': '# LGM OS NAS\n\nSistema NAS personalizado basado en Debian GNU/Linux 12.\n\n## Acceso\n- **IP:** 192.168.1.100\n- **Hostname:** lgm-nas-01.local\n- **Web UI:** http://192.168.1.100:3000\n- **SSH:** ssh admin@192.168.1.100\n- **SMB:** \\\\\\\\192.168.1.100\\\n\n## Servicios activos\n- SMB/CIFS (puerto 445)\n- SFTP/SSH (puerto 22)\n- Nginx (puerto 80)\n- MariaDB (puerto 3306)\n\n## Almacenamiento\n- Volumen 1: RAID 1 — 3.8 TB\n- Volumen 2: RAID 1 — 7.3 TB (DEGRADADO)\n- Sistema: SSD 953 GB\n\n## Contacto\nLGM Team — lgm@lgmos.local',
  '/etc/hostname': 'lgm-nas-01',
  '/etc/hosts': '127.0.0.1\tlocalhost\n127.0.1.1\tlgm-nas-01\n192.168.1.100\tlgm-nas-01 lgm-nas-01.local\n\n# IPv6\n::1\tlocalhost ip6-localhost ip6-loopback\nff02::1\tip6-allnodes\nff02::2\tip6-allrouters',
  '/etc/fstab': '# /etc/fstab — LGM OS\n# <device>             <mount>     <type>  <options>           <dump> <pass>\nUUID=a1b2c3d4-...     /           ext4    defaults,noatime    0      1\nUUID=e5f6a7b8-...     /volume1    ext4    defaults,noatime    0      2\nUUID=c9d0e1f2-...     /volume2    ext4    defaults,noatime    0      2\ntmpfs                 /tmp        tmpfs   defaults,size=2G    0      0',
  '/etc/smb.conf': '[global]\n   workgroup = WORKGROUP\n   server string = LGM NAS\n   server role = standalone server\n   security = user\n   min protocol = SMB2\n   max protocol = SMB3\n   signing required = yes\n   encrypt passwords = yes\n\n[Documentos]\n   path = /volume1/Documentos\n   valid users = admin, lgm\n   read only = no\n   create mask = 0664\n\n[Multimedia]\n   path = /volume2/Multimedia\n   valid users = @users\n   read only = no\n   create mask = 0664',
};

/* ─── Command engine ─── */
function buildEngine(
  storageStore: ReturnType<typeof useStorageStore.getState>,
  userStore: ReturnType<typeof useUserStore.getState>,
  zfsStore: ReturnType<typeof useZFSStore.getState>,
) {
  return function execute(raw: string, cwd: string): { lines: Line[]; newCwd?: string; clear?: boolean } {
    const trimmed = raw.trim();
    if (!trimmed) return { lines: [] };

    // Handle pipes: cmd1 | cmd2 (simple — just run cmd1 and pass)
    const [main] = trimmed.split('|').map(s => s.trim());
    const parts = main.split(/\s+/);
    const cmd   = parts[0].toLowerCase();
    const args  = parts.slice(1);

    const out = (text: string): Line => ({ type: 'output', text });
    const err = (text: string): Line => ({ type: 'error',  text });
    const sys = (text: string): Line => ({ type: 'system', text });
    const wrn = (text: string): Line => ({ type: 'warn',   text });

    const cwdAbs = cwd === '~' ? '/home/admin' : cwd;
    const ls = (path = cwd) => VFS[path] ?? VFS[cwd] ?? [];

    switch (cmd) {
      /* ── Navigation ── */
      case 'clear': return { lines: [], clear: true };

      case 'pwd': return { lines: [out(cwdAbs)] };

      case 'cd': {
        const target = args[0] ?? '~';
        if (target === '-') return { lines: [out(cwd)], newCwd: cwd };
        const raw = target === '~' ? '~' : target.startsWith('/') ? target : `${cwd}/${target}`.replace('~/', '/home/admin/');
        const norm = raw.replace(/\/+/g, '/').replace(/\/$/, '') || '/';
        if (VFS[raw] !== undefined || raw === '~' || raw === '/home/admin') {
          return { lines: [], newCwd: raw === '/home/admin' ? '~' : raw };
        }
        return { lines: [err(`bash: cd: ${target}: No such file or directory`)] };
      }

      case 'ls': {
        const longFmt = args.some(a => a.includes('l'));
        const all     = args.some(a => a.includes('a'));
        const path    = args.find(a => !a.startsWith('-')) ?? cwd;
        const items   = ls(path);
        if (!items.length && !VFS[path]) return { lines: [err(`ls: cannot access '${path}': No such file or directory`)] };
        const now = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
        if (longFmt) {
          const rows = [out(`total ${items.length * 4}`)];
          const list = all ? items : items.filter(i => !i.name.startsWith('.'));
          list.forEach(i => rows.push(out(`${i.perm ?? (i.type==='d'?'drwxr-xr-x':'-rw-r--r--')}  1 admin admin ${String(i.size ?? 4096).padStart(6)} ${now} ${i.type==='d' ? `\x1b[34m${i.name}\x1b[0m` : i.name}`)));
          return { lines: rows };
        }
        const list = all ? items : items.filter(i => !i.name.startsWith('.'));
        const names = list.map(i => i.type==='d' ? `${i.name}/` : i.name).join('  ');
        return { lines: [out(names || '(empty)')] };
      }

      case 'cat': {
        if (!args[0]) return { lines: [err('cat: missing file operand')] };
        const key = args[0].startsWith('/') ? args[0] : args[0];
        const content = FILE_CONTENTS[key] ?? FILE_CONTENTS[`${cwdAbs}/${args[0]}`];
        if (!content) return { lines: [err(`cat: ${args[0]}: No such file or directory`)] };
        return { lines: content.split('\n').map(l => out(l)) };
      }

      case 'echo': return { lines: [out(args.join(' ').replace(/^['"]|['"]$/g, ''))] };

      case 'touch': {
        if (!args[0]) return { lines: [err('touch: missing file operand')] };
        return { lines: [out('')] };
      }

      case 'mkdir': {
        if (!args[0]) return { lines: [err('mkdir: missing operand')] };
        return { lines: [out('')] };
      }

      case 'rm': return { lines: args[0] ? [out('')] : [err('rm: missing operand')] };

      /* ── System info ── */
      case 'whoami': return { lines: [out('admin')] };
      case 'id':     return { lines: [out('uid=1000(admin) gid=1000(admin) groups=1000(admin),27(sudo),4(adm),1001(docker)') ]};
      case 'hostname':return { lines: [out(args.includes('-f') ? 'lgm-nas-01.local' : 'lgm-nas-01')] };

      case 'uname':
        return { lines: [out(
          args.includes('-a')
            ? 'Linux lgm-nas-01 6.1.0-lgm-amd64 #1 SMP PREEMPT_DYNAMIC Debian 6.1.0 (2025-01-01) x86_64 GNU/Linux'
            : args.includes('-r') ? '6.1.0-lgm-amd64'
            : args.includes('-n') ? 'lgm-nas-01'
            : 'Linux'
        )] };

      case 'date': return { lines: [out(new Date().toString())] };

      case 'uptime': {
        const now = new Date();
        return { lines: [out(` ${now.toLocaleTimeString('es-ES', {hour:'2-digit',minute:'2-digit'})} up 3 days,  7:12,  1 user,  load average: 0.12, 0.18, 0.14`)] };
      }

      case 'free': {
        const human = args.includes('-h') || args.includes('--human');
        if (human) return { lines: [
          out('               total        used        free      shared  buff/cache   available'),
          out('Mem:            16Gi       6.2Gi       7.8Gi       142Mi       2.0Gi       9.6Gi'),
          out('Swap:          2.0Gi          0B       2.0Gi'),
        ]};
        return { lines: [
          out('               total        used        free      shared  buff/cache   available'),
          out('Mem:        16776704     6448128     8192000      145408     2048000    10082304'),
          out('Swap:        2097152           0     2097152'),
        ]};
      }

      case 'df': {
        const h = args.includes('-h');
        const vols = storageStore.volumes;
        const rows: Line[] = [out('Filesystem             Size  Used Avail Use% Mounted on')];
        vols.forEach(v => {
          const pct  = Math.round((v.usedGB / v.totalGB) * 100);
          const free = v.totalGB - v.usedGB;
          if (h) rows.push(out(`/dev/sd${v.id.slice(-1)}1         ${v.totalGB}G  ${v.usedGB}G  ${free}G  ${pct}% ${v.mountPoint}`));
          else   rows.push(out(`/dev/sd${v.id.slice(-1)}1   ${(v.totalGB*1024*1024).toString().padStart(10)}  ${(v.usedGB*1024*1024).toString().padStart(10)}  ${(free*1024*1024).toString().padStart(10)}  ${pct}% ${v.mountPoint}`));
        });
        rows.push(out(`tmpfs                  8.0G     0  8.0G   0% /dev/shm`));
        return { lines: rows };
      }

      case 'du': {
        const path = args.find(a => !a.startsWith('-')) ?? cwd;
        return { lines: [out(`4.2G\t${path}`)] };
      }

      case 'lsblk': {
        const disks = storageStore.disks.filter(d => d.sizeGB > 0);
        const rows: Line[] = [out('NAME   MAJ:MIN RM   SIZE RO TYPE  MOUNTPOINT')];
        disks.forEach((d, i) => {
          const letter = String.fromCharCode(97 + i);
          rows.push(out(`sd${letter}      8:${i*16}  0  ${(d.sizeGB/1024).toFixed(1)}T  0 disk`));
          rows.push(out(`└─sd${letter}1    8:${i*16+1}  0  ${(d.sizeGB/1024).toFixed(1)}T  0 part  ${d.volumeId ? storageStore.volumes.find(v=>v.id===d.volumeId)?.mountPoint ?? '' : ''}`));
        });
        return { lines: rows };
      }

      case 'mount': {
        const vols = storageStore.volumes;
        const rows = vols.map(v => out(`/dev/sd${v.id.slice(-1)}1 on ${v.mountPoint} type ${v.fsType} (rw,noatime,relatime)`));
        rows.push(out('tmpfs on /tmp type tmpfs (rw,nosuid,nodev)'));
        rows.push(out('tmpfs on /dev/shm type tmpfs (rw,nosuid,nodev)'));
        return { lines: rows };
      }

      /* ── ZFS commands ── */
      case 'zpool': {
        const sub = args[0];
        if (!sub || sub === 'status') {
          const poolName = args.find(a => !a.startsWith('-') && a !== 'status');
          const pools = poolName ? zfsStore.pools.filter(p => p.name === poolName) : zfsStore.pools;
          const rows: Line[] = [];
          pools.forEach(p => {
            rows.push(sys(`  pool: ${p.name}`));
            rows.push(out(` state: ${p.status}`));
            rows.push(out(`  scan: ${p.lastScrub ? `scrub repaired 0B on ${p.lastScrub}` : 'none requested'}`));
            rows.push(out('config:'));
            rows.push(out(`\t${p.name}\t\t\t${p.status}`));
            p.vdevs.forEach(v => {
              rows.push(out(`\t  ${v.type}\t\t\t${v.status}`));
              v.diskIds.forEach((id, i) => {
                const disk = storageStore.disks.find(d => d.id === id);
                rows.push(out(`\t    ${disk ? `sd${id.slice(-1)}` : id}\t\t\t${v.status}${v.checksumErrors > 0 ? `\t${v.checksumErrors} checksum errors` : ''}`));
              });
            });
            rows.push(out(`\nerrors: ${p.status === 'ONLINE' ? 'No known data errors' : 'DEGRADED — replace disk immediately'}`));
          });
          return { lines: rows };
        }
        if (sub === 'list') {
          const rows = [out('NAME       SIZE  ALLOC   FREE  CKPOINT  EXPANDSZ   FRAG    CAP  DEDUP    HEALTH  ALTROOT')];
          zfsStore.pools.forEach(p => {
            rows.push(out(`${p.name.padEnd(10)} ${(p.totalGB/1024).toFixed(1)}T  ${(p.usedGB/1024).toFixed(1)}T  ${(p.freeGB/1024).toFixed(1)}T        -         -     ${p.fragmentation}%  ${Math.round(p.usedGB/p.totalGB*100)}%  ${p.dedupRatio.toFixed(2)}x  ${p.status}       -`));
          });
          return { lines: rows };
        }
        if (sub === 'scrub') {
          const name = args[1];
          if (name) zfsStore.startScrub(zfsStore.pools.find(p=>p.name===name)?.id ?? '');
          return { lines: [out(`Scrub iniciado en ${name ?? 'todos los pools'}`)] };
        }
        return { lines: [out(`zpool: uso: zpool <status|list|scrub> [pool]`)] };
      }

      case 'zfs': {
        const sub = args[0];
        if (!sub || sub === 'list') {
          const ds = zfsStore.datasets.filter(d => d.type === 'filesystem');
          const rows = [out('NAME                             USED  AVAIL  REFER  MOUNTPOINT')];
          ds.slice(0, 12).forEach(d => {
            rows.push(out(`${d.name.padEnd(32)} ${d.usedGB.toFixed(1)}G  ${d.availableGB.toFixed(0)}G  ${d.referencedGB.toFixed(1)}G  ${d.mountPoint ?? 'none'}`));
          });
          return { lines: rows };
        }
        if (sub === 'get' && args[1] && args[2]) {
          const prop = args[1];
          const dsName = args[2];
          const ds = zfsStore.datasets.find(d => d.name === dsName);
          if (!ds) return { lines: [err(`zfs: dataset '${dsName}' does not exist`)] };
          const val: Record<string, string> = {
            compression: ds.compression,
            checksum: ds.checksum,
            atime: ds.atime,
            recordsize: ds.recordsize,
            encryption: ds.encryption ? 'aes-256-gcm' : 'off',
            used: `${ds.usedGB.toFixed(1)}G`,
            available: `${ds.availableGB.toFixed(0)}G`,
          };
          return { lines: [
            out('NAME                             PROPERTY     VALUE                    SOURCE'),
            out(`${dsName.padEnd(32)} ${prop.padEnd(12)} ${(val[prop] ?? '-').padEnd(24)} local`),
          ]};
        }
        if (sub === 'snapshot') {
          const full = args[1];
          if (!full?.includes('@')) return { lines: [err('zfs: invalid snapshot name')] };
          const [dsName, snapName] = full.split('@');
          const ds = zfsStore.datasets.find(d => d.name === dsName);
          if (!ds) return { lines: [err(`cannot open '${dsName}': dataset does not exist`)] };
          zfsStore.createSnapshot(dsName, ds.poolId, snapName);
          return { lines: [out('')] };
        }
        return { lines: [out(`zfs: uso: zfs <list|get|snapshot> [dataset]`)] };
      }

      /* ── Network ── */
      case 'ip': {
        if (args[0] === 'a' || args[0] === 'addr') return { lines: [
          out('1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536'),
          out('    inet 127.0.0.1/8 scope host lo'),
          out('2: eth0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc pfifo_fast state UP'),
          out('    link/ether a4:bb:6d:1c:00:ff brd ff:ff:ff:ff:ff:ff'),
          out('    inet 192.168.1.100/24 brd 192.168.1.255 scope global eth0'),
          out('    inet6 fe80::a6bb:6dff:fe1c:ff/64 scope link'),
        ]};
        if (args[0] === 'r' || args[0] === 'route') return { lines: [
          out('default via 192.168.1.1 dev eth0 proto dhcp src 192.168.1.100 metric 100'),
          out('192.168.1.0/24 dev eth0 proto kernel scope link src 192.168.1.100'),
        ]};
        return { lines: [out(`ip: uso: ip {addr|route|link}`)] };
      }

      case 'ping': {
        if (!args[0]) return { lines: [err('ping: usage error: Destination address required')] };
        const host = args[0];
        const ms = [Math.round(0.5+Math.random()*2), Math.round(0.5+Math.random()*2), Math.round(0.5+Math.random()*2)];
        return { lines: [
          out(`PING ${host} (192.168.1.1) 56(84) bytes of data.`),
          out(`64 bytes from ${host}: icmp_seq=1 ttl=64 time=${ms[0]}.${Math.floor(Math.random()*9)} ms`),
          out(`64 bytes from ${host}: icmp_seq=2 ttl=64 time=${ms[1]}.${Math.floor(Math.random()*9)} ms`),
          out(`64 bytes from ${host}: icmp_seq=3 ttl=64 time=${ms[2]}.${Math.floor(Math.random()*9)} ms`),
          out(''),
          out(`--- ${host} ping statistics ---`),
          out(`3 packets transmitted, 3 received, 0% packet loss`),
          out(`rtt min/avg/max/mdev = ${Math.min(...ms)}.1/${((ms[0]+ms[1]+ms[2])/3).toFixed(1)}/${Math.max(...ms)}.8/0.5 ms`),
        ]};
      }

      case 'ss': case 'netstat': {
        return { lines: [
          out('Netid  State   Recv-Q  Send-Q  Local Address:Port   Peer Address:Port'),
          out('tcp    LISTEN  0       128     0.0.0.0:22            0.0.0.0:*          sshd'),
          out('tcp    LISTEN  0       128     0.0.0.0:80            0.0.0.0:*          nginx'),
          out('tcp    LISTEN  0       128     0.0.0.0:443           0.0.0.0:*          nginx'),
          out('tcp    LISTEN  0       80      0.0.0.0:3306          0.0.0.0:*          mariadbd'),
          out('tcp    LISTEN  0       128     0.0.0.0:445           0.0.0.0:*          smbd'),
          out('tcp    LISTEN  0       128     0.0.0.0:3000          0.0.0.0:*          node'),
          out('udp    UNCONN  0       0       0.0.0.0:51820         0.0.0.0:*          wg-quick'),
        ]};
      }

      /* ── Process management ── */
      case 'ps': {
        const aux = args.includes('aux') || args.includes('-aux');
        const header = aux
          ? 'USER       PID %CPU %MEM    VSZ   RSS TTY    STAT START   TIME COMMAND'
          : '  PID TTY          TIME CMD';
        const procs = [
          aux ? 'root         1  0.0  0.1 168584 17408 ?      Ss   06:00   0:04 /sbin/init' : '    1 ?        00:00:04 systemd',
          aux ? 'root       680  0.0  0.0  15888  5120 ?      Ss   06:00   0:00 /usr/sbin/sshd -D' : '  680 ?        00:00:00 sshd',
          aux ? 'www-data   901  0.2  0.1  55820 18432 ?      S    06:00   0:12 nginx: worker' : '  901 ?        00:00:12 nginx',
          aux ? 'mysql     1050  1.4  2.6 1854320 432128 ?    Sl   06:00   1:48 mariadbd' : ' 1050 ?        00:01:48 mariadbd',
          aux ? 'root      1200  0.1  0.1  65312 19456 ?      Ss   06:00   0:08 smbd --foreground' : ' 1200 ?        00:00:08 smbd',
          aux ? 'admin     1350  2.1  3.8 954320 618496 ?     Sl   06:00   2:14 node /opt/lgm' : ' 1350 ?        00:02:14 node',
          aux ? 'root      2200  0.3  0.2  88432 32768 ?      Sl   06:00   0:22 zed' : ' 2200 ?        00:00:22 zed',
          aux ? 'admin     3200  0.0  0.0  23432  5120 pts/0  Ss   14:20   0:00 bash' : ' 3200 pts/0    00:00:00 bash',
        ];
        return { lines: [out(header), ...procs.map(out)] };
      }

      case 'top': case 'htop':
        return { lines: [
          out(`top - ${new Date().toLocaleTimeString('es-ES')} up 3 days,  7:12,  1 user,  load average: 0.12, 0.18, 0.14`),
          out('Tasks:  98 total,   1 running,  97 sleeping,   0 stopped,   0 zombie'),
          out('%Cpu(s):  2.4 us,  0.8 sy,  0.0 ni, 96.2 id,  0.4 wa,  0.0 hi,  0.2 si'),
          out('MiB Mem :  16384.0 total,   7936.0 free,   6348.0 used,   2100.0 buff/cache'),
          out('MiB Swap:   2048.0 total,   2048.0 free,      0.0 used.   9852.0 avail Mem'),
          out(''),
          out('  PID USER     PR  NI    VIRT    RES    SHR S  %CPU  %MEM     TIME+ COMMAND'),
          out(' 1050 mysql    20   0 1854320 432128  12288 S   1.4   2.6   1:48.23 mariadbd'),
          out(' 1350 admin    20   0  954320 618496  32768 S   2.1   3.8   2:14.07 node'),
          out('  901 www-data 20   0   55820  18432   8192 S   0.2   0.1   0:12.44 nginx'),
          out(' 2200 root     20   0   88432  32768   8192 S   0.3   0.2   0:22.18 zed'),
          out(' 1200 root     20   0   65312  19456   9216 S   0.1   0.1   0:08.91 smbd'),
        ]};

      case 'kill': {
        if (!args[0]) return { lines: [err('kill: usage: kill [-s sigspec] pid')] };
        const pid = parseInt(args.includes('-9') ? args[1] : args[0]);
        if (isNaN(pid)) return { lines: [err(`kill: ${args[0]}: arguments must be process or job IDs`)] };
        return { lines: [out('')] };
      }

      /* ── Services (systemctl) ── */
      case 'systemctl': {
        const sub = args[0];
        const svc = args[1];
        if (sub === 'status') {
          const statuses: Record<string, string[]> = {
            nginx:   ['● nginx.service - A high performance web server',`   Active: active (running) since Mon 2025-01-01 06:00:01; 3 days ago`, '  Process: 900 ExecStart=/usr/sbin/nginx -g daemon off;', ' Main PID: 901 (nginx)', '   CGroup: /system.slice/nginx.service', '           └─901 nginx: worker process'],
            smbd:    ['● smbd.service - Samba SMB/CIFS server',`   Active: active (running) since Mon 2025-01-01 06:00:02; 3 days ago`, ' Main PID: 1200 (smbd)', '   Status: "smbd: ready to serve connections..."'],
            mariadb: ['● mariadb.service - MariaDB 10.11 database server',`   Active: active (running) since Mon 2025-01-01 06:00:03; 3 days ago`, ' Main PID: 1050 (mariadbd)', '   Status: "Taking your SQL requests now..."'],
            ssh:     ['● ssh.service - OpenBSD Secure Shell server',`   Active: active (running) since Mon 2025-01-01 06:00:00; 3 days ago`, ' Main PID: 680 (sshd)'],
          };
          const name = svc?.replace('.service','');
          if (name && statuses[name]) return { lines: statuses[name].map(sys) };
          return { lines: [err(`Unit ${svc ?? ''}: not found`)] };
        }
        if (['start','stop','restart','reload','enable','disable'].includes(sub ?? '')) {
          return { lines: [out('')] };
        }
        if (sub === 'list-units' || sub === 'list') {
          return { lines: [
            sys('  UNIT                         LOAD   ACTIVE SUB     DESCRIPTION'),
            out('  nginx.service                loaded active running A high performance web server'),
            out('  smbd.service                 loaded active running Samba SMB Daemon'),
            out('  mariadb.service              loaded active running MariaDB 10.11'),
            out('  ssh.service                  loaded active running OpenBSD Secure Shell'),
            out('  wg-quick@wg0.service         loaded active running WireGuard via wg-quick'),
            out('  cron.service                 loaded active running Regular background program'),
            out('  avahi-daemon.service         loaded active running Avahi mDNS/DNS-SD Stack'),
          ]};
        }
        return { lines: [out(`systemctl: uso: systemctl {start|stop|restart|status|list-units} [unit]`)] };
      }

      /* ── Package management ── */
      case 'apt': case 'apt-get': {
        const sub = args[0];
        if (sub === 'update')  return { lines: [out('Leyendo lista de paquetes... Hecho'), out('Construyendo árbol de dependencias... Hecho'), out('Leyendo la información de estado... Hecho'), out('2 packages can be upgraded. Run \'apt list --upgradable\' for more info.')] };
        if (sub === 'upgrade') return { lines: [out('Reading package lists... Done'), out('Building dependency tree... Done'), wrn('2 upgraded, 0 newly installed, 0 to remove and 0 not upgraded.')] };
        if (sub === 'list')    return { lines: [out('Listing... Done'), out('curl/stable,now 7.88.1-10 amd64 [installed]'), out('git/stable,now 2.39.2 amd64 [installed]'), out('nginx/stable,now 1.22.1 amd64 [installed,automatic]')] };
        if (sub === 'install' && args[1]) return { lines: [out(`Reading package lists... Done`), out(`The following NEW packages will be installed: ${args[1]}`), out(`0 upgraded, 1 newly installed, 0 to remove and 2 not upgraded.`), out(`Unpacking ${args[1]} ...`), out(`Setting up ${args[1]} ...`)] };
        return { lines: [out(`apt: uso: apt {update|upgrade|install|remove|list} [package]`)] };
      }

      /* ── Users ── */
      case 'who': case 'w':
        return { lines: [
          out(` ${new Date().toLocaleTimeString('es-ES')}, 1 user, load: 0.12, 0.18, 0.14`),
          out('USER     TTY   LOGIN@   IDLE  JCPU   PCPU WHAT'),
          out('admin    pts/0 14:20    0.00s  0.08s  0.00s -bash'),
        ]};

      case 'last':
        return { lines: [
          out('admin    pts/0        192.168.1.200   Mon Jun 16 14:20   still logged in'),
          out('admin    pts/0        192.168.1.200   Mon Jun 15 09:12 - 12:45  (03:32)'),
          out('admin    pts/0        192.168.1.200   Sun Jun 14 16:55 - 18:02  (01:07)'),
          out(''),
          out('wtmp begins Mon Jun 01 00:00:01 2025'),
        ]};

      case 'useradd': case 'userdel': case 'passwd':
        return { lines: [out(`${cmd}: use Panel de Control → Usuarios para gestionar cuentas`)] };

      /* ── Docker ── */
      case 'docker': {
        const sub = args[0];
        if (sub === 'ps') return { lines: [
          out('CONTAINER ID   IMAGE                        COMMAND                  CREATED       STATUS       PORTS                    NAMES'),
          out('a1b2c3d4e5f6   nginx:latest                 "/docker-entrypoint.…"   3 days ago    Up 3 days    0.0.0.0:8080->80/tcp     nginx'),
          out('b2c3d4e5f6a7   mariadb:11                   "docker-entrypoint.s…"   3 days ago    Up 3 days    0.0.0.0:3306->3306/tcp   mariadb'),
        ]};
        if (sub === 'images') return { lines: [
          out('REPOSITORY                    TAG       IMAGE ID       CREATED        SIZE'),
          out('nginx                         latest    a1b2c3d4e5f6   2 weeks ago    187MB'),
          out('mariadb                       11        b2c3d4e5f6a7   3 weeks ago    404MB'),
          out('portainer/portainer-ce        latest    c3d4e5f6a7b8   1 month ago    280MB'),
        ]};
        if (sub === 'stats') return { lines: [
          out('CONTAINER ID   NAME        CPU %     MEM USAGE / LIMIT     MEM %     NET I/O          BLOCK I/O'),
          out('a1b2c3d4e5f6   nginx       0.2%      18MiB / 16GiB         0.11%     1.2MB / 840kB    0B / 0B'),
          out('b2c3d4e5f6a7   mariadb     1.4%      425MiB / 16GiB        2.60%     245kB / 128kB    12GB / 8GB'),
        ]};
        if (sub === 'logs' && args[1]) return { lines: [
          sys(`[docker] Logs for ${args[1]}`),
          out(`2025-06-16 14:20:01 INFO  ${args[1]} started`),
          out(`2025-06-16 14:21:15 INFO  Connection accepted from 192.168.1.200`),
          out(`2025-06-16 14:35:42 INFO  Healthy`),
        ]};
        return { lines: [out('Usage: docker {ps|images|stats|logs|run|stop|rm} [...]')] };
      }

      /* ── Wireguard ── */
      case 'wg': {
        if (!args[0] || args[0] === 'show') return { lines: [
          sys('interface: wg0'),
          out('  public key: AbCdEfGhIjKlMnOpQrStUvWxYz0123456789='),
          out('  private key: (hidden)'),
          out('  listening port: 51820'),
          out(''),
          sys('peer: def456ABC...'),
          out('  endpoint: 192.168.1.200:54321'),
          out('  allowed ips: 10.8.0.2/32'),
          out('  latest handshake: 2 minutes, 14 seconds ago'),
          out('  transfer: 142 MiB received, 38 MiB sent'),
        ]};
        return { lines: [out('wg: uso: wg show [interface]')] };
      }

      /* ── Misc ── */
      case 'history': {
        return { lines: [] }; // handled outside
      }

      case 'env': return { lines: [
        out('PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin'),
        out('HOME=/home/admin'),
        out('USER=admin'),
        out('SHELL=/bin/bash'),
        out('TERM=xterm-256color'),
        out('LANG=es_ES.UTF-8'),
        out('HOSTNAME=lgm-nas-01'),
        out('EDITOR=nano'),
      ]};

      case 'alias': return { lines: [
        out("alias ll='ls -la --color=auto'"),
        out("alias la='ls -A'"),
        out("alias update='apt update && apt upgrade -y'"),
        out("alias df='df -h'"),
        out("alias free='free -h'"),
        out("alias ports='ss -tlnp'"),
      ]};

      case 'neofetch':
        return { lines: [
          sys(' _____ ___ ___'),
          sys('|_   _/ __| __|'),
          sys('  | || (_ | _|'),
          sys('  |_| \\___|___| NAS'),
          sys(''),
          sys('lgm-nas-01@lgm-nas-01'),
          out('─────────────────────────'),
          out('OS:       LGM OS 1.0 (Debian GNU/Linux 12)'),
          out('Kernel:   Linux 6.1.0-lgm-amd64 #1 SMP'),
          out('Uptime:   3 days, 7 hours, 12 mins'),
          out('Packages: 842 (dpkg)'),
          out('Shell:    bash 5.2.15'),
          out('CPU:      Intel Core i7-12700 (8) @ 2.10GHz'),
          out('Memory:   6.21 GiB / 16.00 GiB'),
          out('Storage:  3.8T (RAID1) + 7.3T (RAID1) + 953G'),
          out('IP:       192.168.1.100'),
          out('Hostname: lgm-nas-01.local'),
          out(''),
        ]};

      case 'help': return { lines: [
        out(''),
        sys('LGM OS Shell — comandos disponibles:'),
        out(''),
        sys('  Navegación:'),
        out('    ls [-la] [path]   cd <dir>   pwd   cat <file>   mkdir   rm   touch'),
        out(''),
        sys('  Sistema:'),
        out('    uname [-a|-r]   hostname [-f]   uptime   date   env   alias   id   whoami'),
        out('    free [-h]   df [-h]   du [path]   lsblk   mount   ps [aux]   top   kill'),
        out(''),
        sys('  Servicios:'),
        out('    systemctl {status|start|stop|restart} <unit>   systemctl list-units'),
        out('    apt {update|upgrade|install} [pkg]'),
        out(''),
        sys('  Red:'),
        out('    ip {addr|route}   ss   ping <host>   wg show'),
        out(''),
        sys('  Docker:'),
        out('    docker {ps|images|stats|logs} [name]'),
        out(''),
        sys('  ZFS:'),
        out('    zpool {status|list|scrub} [pool]   zfs {list|get|snapshot} [dataset]'),
        out(''),
        sys('  Usuarios y logs:'),
        out('    who   w   last   neofetch   history   clear'),
        out(''),
      ]};

      default: {
        // Try running as shell command simulation
        if (trimmed.startsWith('sudo ')) {
          const inner = execute(trimmed.slice(5), cwd);
          return inner;
        }
        return { lines: [err(`bash: ${cmd}: command not found`)] };
      }
    }
  };
}

/* ─── Auto-complete ─── */
const ALL_COMMANDS = ['ls','cd','pwd','cat','mkdir','rm','touch','echo','uname','hostname','uptime','date',
  'free','df','du','lsblk','mount','ps','top','htop','kill','systemctl','apt','apt-get','ip','ss','netstat',
  'ping','wg','docker','zpool','zfs','who','w','last','whoami','id','env','alias','neofetch','help','clear',
  'history','sudo','nano','vim','grep','find','tail','head','sort','awk','sed','curl','wget','ssh','scp','rsync'];

function autoComplete(input: string, cwd: string): string {
  const parts = input.split(' ');
  if (parts.length === 1) {
    const match = ALL_COMMANDS.find(c => c.startsWith(input));
    return match ?? input;
  }
  return input;
}

/* ─── Tab (single terminal session) ─── */
interface TermTab {
  id: string;
  title: string;
  lines: Line[];
  history: string[];
  histIdx: number;
  cwd: string;
  input: string;
}

function mkTab(id: string): TermTab {
  return {
    id, title: `bash ${id.slice(-1)}`, cwd: '~', input: '', histIdx: -1, history: [],
    lines: [
      { type: 'system', text: 'LGM OS 1.0 (Debian GNU/Linux 12 bookworm)' },
      { type: 'output', text: `Linux lgm-nas-01 6.1.0-lgm-amd64 #1 SMP x86_64` },
      { type: 'output', text: `Último acceso: ${new Date().toLocaleString('es-ES')} desde 192.168.1.200` },
      { type: 'output', text: '' },
      { type: 'output', text: 'Escribe "help" para ver todos los comandos disponibles.' },
      { type: 'output', text: '' },
    ],
  };
}

let _tabId = 1;
const genTabId = () => String(_tabId++);

/* ─── Main Terminal component ─── */
export function Terminal() {
  const storageStore = useStorageStore();
  const userStore    = useUserStore();
  const zfsStore     = useZFSStore();

  const engine = useCallback(
    buildEngine(storageStore, userStore, zfsStore),
    []
  );

  const [tabs, setTabs]       = useState<TermTab[]>([mkTab(genTabId())]);
  const [activeId, setActiveId] = useState(tabs[0].id);
  const [fullscreen, setFullscreen] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const endRef   = useRef<HTMLDivElement>(null);

  const active = tabs.find(t => t.id === activeId) ?? tabs[0];

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'auto' }); }, [active.lines]);
  useEffect(() => { inputRef.current?.focus(); }, [activeId]);

  const updateTab = (id: string, patch: Partial<TermTab>) =>
    setTabs(prev => prev.map(t => t.id === id ? { ...t, ...patch } : t));

  const addTab = () => {
    const tab = mkTab(genTabId());
    setTabs(prev => [...prev, tab]);
    setActiveId(tab.id);
  };

  const closeTab = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (tabs.length === 1) return;
    const remaining = tabs.filter(t => t.id !== id);
    setTabs(remaining);
    if (activeId === id) setActiveId(remaining[remaining.length - 1].id);
  };

  const copyOutput = () => {
    const text = active.lines.map(l => l.text).join('\n');
    navigator.clipboard.writeText(text).catch(() => {});
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cmd = active.input.trim();
    const inputLine: Line = { type: 'input', text: `${prompt(active.cwd)}${cmd}` };

    if (!cmd) { updateTab(activeId, { lines: [...active.lines, inputLine], input: '', histIdx: -1 }); return; }

    // history command special case
    if (cmd === 'history') {
      const histLines: Line[] = active.history.map((h, i) => ({ type: 'output' as const, text: `${String(active.history.length - i).padStart(4)}  ${h}` }));
      updateTab(activeId, { lines: [...active.lines, inputLine, ...histLines], input: '', histIdx: -1, history: [cmd, ...active.history].slice(0, 500) });
      return;
    }

    const result = engine(cmd, active.cwd);
    const newHistory = [cmd, ...active.history].slice(0, 500);

    if (result.clear) {
      updateTab(activeId, { lines: [], input: '', histIdx: -1, history: newHistory });
    } else {
      updateTab(activeId, {
        lines: [...active.lines, inputLine, ...result.lines],
        cwd: result.newCwd ?? active.cwd,
        input: '',
        histIdx: -1,
        history: newHistory,
        title: `bash — ${result.newCwd ?? active.cwd}`,
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      const idx = Math.min(active.histIdx + 1, active.history.length - 1);
      updateTab(activeId, { histIdx: idx, input: active.history[idx] ?? '' });
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const idx = Math.max(active.histIdx - 1, -1);
      updateTab(activeId, { histIdx: idx, input: idx === -1 ? '' : active.history[idx] });
    } else if (e.key === 'Tab') {
      e.preventDefault();
      const completed = autoComplete(active.input, active.cwd);
      updateTab(activeId, { input: completed });
    } else if (e.key === 'c' && e.ctrlKey) {
      updateTab(activeId, {
        lines: [...active.lines, { type: 'input', text: `${prompt(active.cwd)}${active.input}^C` }],
        input: '',
        histIdx: -1,
      });
    } else if (e.key === 'l' && e.ctrlKey) {
      e.preventDefault();
      updateTab(activeId, { lines: [] });
    }
  };

  return (
    <div className={`term${fullscreen ? ' term--fullscreen' : ''}`}
      onClick={() => inputRef.current?.focus()}>

      {/* Tab bar */}
      <div className="term__tabs">
        {tabs.map(t => (
          <button
            key={t.id}
            className={`term__tab${t.id === activeId ? ' term__tab--active' : ''}`}
            onClick={() => setActiveId(t.id)}
          >
            <TermIcon size={11} />
            <span>{t.title}</span>
            {tabs.length > 1 && (
              <span className="term__tab-close" onClick={(e) => closeTab(t.id, e)}>×</span>
            )}
          </button>
        ))}
        <button className="term__tab-add" onClick={addTab} title="Nueva pestaña"><Plus size={12} /></button>
        <div style={{ flex: 1 }} />
        <button className="term__toolbar-btn" onClick={copyOutput} title="Copiar salida"><Copy size={12} /></button>
        <button className="term__toolbar-btn" onClick={() => setFullscreen(v => !v)} title="Pantalla completa">
          {fullscreen ? <Square size={12} /> : <Maximize2 size={12} />}
        </button>
      </div>

      {/* Output */}
      <div className="term__output">
        {active.lines.map((line, i) => (
          <div key={i} className={`term__line term__line--${line.type}`}>{line.text}</div>
        ))}
        <div ref={endRef} />
      </div>

      {/* Input */}
      <form className="term__input-row" onSubmit={handleSubmit}>
        <span className="term__prompt">{prompt(active.cwd)}</span>
        <input
          ref={inputRef}
          type="text"
          className="term__input"
          value={active.input}
          onChange={e => updateTab(activeId, { input: e.target.value })}
          onKeyDown={handleKeyDown}
          autoFocus
          spellCheck={false}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          aria-label="terminal input"
        />
      </form>
    </div>
  );
}
