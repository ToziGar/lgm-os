import { useState, useRef, useEffect, useCallback } from 'react';
import './Terminal.css';

interface Line {
  type: 'input' | 'output' | 'error' | 'system';
  text: string;
}

const HOSTNAME = 'lgmos';
const getPrompt = (cwd: string) => `admin@${HOSTNAME}:${cwd}$ `;

const VIRTUAL_FS: Record<string, string[]> = {
  '~':           ['Documentos', 'Descargas', 'Imágenes', '.bashrc', 'README.md'],
  '~/Documentos': ['informe.pdf', 'notas.txt', 'Proyectos'],
  '~/Descargas': ['debian-12.iso', 'setup.sh'],
  '~/Imágenes':  ['fondo.jpg', 'captura.png'],
  '~/Proyectos': ['lgm-os', 'web-app', 'scripts'],
};

const FILE_CONTENTS: Record<string, string> = {
  'README.md': '# LGM OS\n\nSistema Operativo personalizado basado en Debian.\n\nVersión: 1.0.0\nAutor: LGM Team',
  '.bashrc':   '# .bashrc — LGM OS\nexport PATH=$PATH:/usr/local/bin\nalias ll="ls -la"\nalias update="apt update && apt upgrade"',
  'notas.txt': 'Notas del sistema:\n- Revisar configuración de red\n- Actualizar paquetes\n- Hacer backup',
};

export function Terminal() {
  const [lines, setLines] = useState<Line[]>([
    { type: 'system', text: '██╗      ██████╗ ███╗   ███╗  ██████╗ ███████╗' },
    { type: 'system', text: '██║     ██╔════╝ ████╗ ████║ ██╔═══██╗██╔════╝' },
    { type: 'system', text: '██║     ██║  ███╗██╔████╔██║ ██║   ██║███████╗' },
    { type: 'system', text: '██║     ██║   ██║██║╚██╔╝██║ ██║   ██║╚════██║' },
    { type: 'system', text: '███████╗╚██████╔╝██║ ╚═╝ ██║ ╚██████╔╝███████║' },
    { type: 'system', text: '╚══════╝ ╚═════╝ ╚═╝     ╚═╝  ╚═════╝ ╚══════╝' },
    { type: 'system', text: '' },
    { type: 'output', text: 'LGM OS Terminal — Linux 6.1.0-lgm-amd64' },
    { type: 'output', text: 'Escribe "help" para ver los comandos disponibles.' },
    { type: 'output', text: '' },
  ]);
  const [input, setInput] = useState('');
  const [cwd, setCwd] = useState('~');
  const [history, setHistory] = useState<string[]>([]);
  const [histIdx, setHistIdx] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'auto' });
  }, [lines]);

  const addLines = useCallback((newLines: Line[]) => {
    setLines((prev) => [...prev, ...newLines]);
  }, []);

  const execute = useCallback(
    (raw: string): null | Line[] => {
      const parts = raw.trim().split(/\s+/);
      const cmd = parts[0];
      const args = parts.slice(1);

      switch (cmd) {
        case '': return [];

        case 'help':
          return [
            { type: 'output', text: '' },
            { type: 'output', text: 'Comandos disponibles:' },
            { type: 'output', text: '  help                Mostrar ayuda' },
            { type: 'output', text: '  ls [-la]            Listar archivos' },
            { type: 'output', text: '  cd <dir>            Cambiar directorio' },
            { type: 'output', text: '  pwd                 Ruta actual' },
            { type: 'output', text: '  cat <archivo>       Ver contenido' },
            { type: 'output', text: '  mkdir <dir>         Crear carpeta' },
            { type: 'output', text: '  echo <texto>        Imprimir texto' },
            { type: 'output', text: '  whoami              Usuario actual' },
            { type: 'output', text: '  date                Fecha y hora' },
            { type: 'output', text: '  uname [-a]          Info del kernel' },
            { type: 'output', text: '  neofetch            Info del sistema' },
            { type: 'output', text: '  uptime              Tiempo activo' },
            { type: 'output', text: '  free                Memoria disponible' },
            { type: 'output', text: '  df                  Espacio en disco' },
            { type: 'output', text: '  clear               Limpiar pantalla' },
            { type: 'output', text: '' },
          ];

        case 'ls': {
          const items = VIRTUAL_FS[cwd] ?? [];
          const long = args.includes('-la') || args.includes('-l');
          if (long) {
            return [
              { type: 'output', text: `total ${items.length * 4}` },
              ...items.map((i) => ({
                type: 'output' as const,
                text: `drwxr-xr-x  1 admin admin  4096 Jun 16 ${new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })} ${i}`,
              })),
            ];
          }
          return [{ type: 'output', text: items.join('  ') || '(vacío)' }];
        }

        case 'cd': {
          const target = args[0] || '~';
          const newPath = target === '~' ? '~' : target === '..' ? cwd.split('/').slice(0, -1).join('/') || '~' : `${cwd}/${target}`;
          if (VIRTUAL_FS[newPath] !== undefined || target === '~') {
            setCwd(target === '~' ? '~' : newPath);
            return [];
          }
          return [{ type: 'error', text: `bash: cd: ${target}: No existe el directorio` }];
        }

        case 'pwd':
          return [{ type: 'output', text: cwd.replace('~', '/home/admin') }];

        case 'whoami':
          return [{ type: 'output', text: 'admin' }];

        case 'echo':
          return [{ type: 'output', text: args.join(' ') }];

        case 'date':
          return [{ type: 'output', text: new Date().toLocaleString('es-ES', { dateStyle: 'full', timeStyle: 'medium' }) }];

        case 'uname':
          return [{ type: 'output', text: args.includes('-a') ? 'Linux lgmos 6.1.0-lgm-amd64 #1 SMP Debian 6.1.0 x86_64 GNU/Linux' : 'Linux' }];

        case 'uptime':
          return [{ type: 'output', text: ` 14:32:10 up 3 days, 7:12,  1 user,  load average: 0.15, 0.22, 0.18` }];

        case 'free':
          return [
            { type: 'output', text: '               total        usado        libre' },
            { type: 'output', text: 'Mem:        16384000      6214400     10169600' },
            { type: 'output', text: 'Swap:        2048000            0      2048000' },
          ];

        case 'df':
          return [
            { type: 'output', text: 'Filesystem     1K-blocks      Used Available Use% Mounted on' },
            { type: 'output', text: '/dev/sda1      976762584 387145320 589617264  40% /' },
            { type: 'output', text: 'tmpfs            8192000         0   8192000   0% /dev/shm' },
          ];

        case 'cat': {
          if (!args[0]) return [{ type: 'error', text: 'cat: falta operando de archivo' }];
          const content = FILE_CONTENTS[args[0]];
          if (!content) return [{ type: 'error', text: `cat: ${args[0]}: No existe el fichero o el directorio` }];
          return content.split('\n').map((l) => ({ type: 'output' as const, text: l }));
        }

        case 'mkdir':
          if (!args[0]) return [{ type: 'error', text: 'mkdir: falta el operando' }];
          return [{ type: 'output', text: '' }];

        case 'neofetch':
          return [
            { type: 'system', text: '       ⬡  LGM OS 1.0' },
            { type: 'output', text: '  OS:       LGM OS 1.0 (Debian base)' },
            { type: 'output', text: '  Kernel:   Linux 6.1.0-lgm-amd64' },
            { type: 'output', text: '  Uptime:   3 días, 7 horas' },
            { type: 'output', text: '  Shell:    lgmsh 1.0' },
            { type: 'output', text: '  CPU:      Intel Core i7-12700 (8) @ 3.60GHz' },
            { type: 'output', text: '  GPU:      NVIDIA GeForce RTX 3060' },
            { type: 'output', text: '  Memory:   6.05 GiB / 16.00 GiB' },
            { type: 'output', text: '  Disk:     379 GiB / 953 GiB' },
            { type: 'output', text: '' },
          ];

        case 'clear':
          return null;

        default:
          return [{ type: 'error', text: `bash: ${cmd}: orden no encontrada` }];
      }
    },
    [cwd]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cmd = input.trim();
    const inputLine: Line = { type: 'input', text: `${getPrompt(cwd)}${cmd}` };
    const result = execute(cmd);

    if (result === null) {
      setLines([]);
    } else {
      setLines((prev) => [...prev, inputLine, ...result]);
    }

    if (cmd) setHistory((h) => [cmd, ...h].slice(0, 100));
    setInput('');
    setHistIdx(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowUp') {
      const idx = Math.min(histIdx + 1, history.length - 1);
      setHistIdx(idx);
      setInput(history[idx] ?? '');
    } else if (e.key === 'ArrowDown') {
      const idx = Math.max(histIdx - 1, -1);
      setHistIdx(idx);
      setInput(idx === -1 ? '' : history[idx]);
    }
  };

  return (
    <div className="term" onClick={() => inputRef.current?.focus()}>
      <div className="term__output">
        {lines.map((line, i) => (
          <div key={i} className={`term__line term__line--${line.type}`}>
            {line.text}
          </div>
        ))}
        <div ref={endRef} />
      </div>

      <form className="term__input-row" onSubmit={handleSubmit}>
        <span className="term__prompt">{getPrompt(cwd)}</span>
        <input
          ref={inputRef}
          type="text"
          className="term__input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          autoFocus
          spellCheck={false}
          autoComplete="off"
          autoCorrect="off"
        />
      </form>
    </div>
  );
}
