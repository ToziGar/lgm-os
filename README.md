# ⬡ LGM OS

Sistema operativo personalizado estilo **Synology DSM 7.3**, basado en **Debian Linux** con interfaz web completa.

## Características

| Componente | Descripción |
|---|---|
| 🖥️ Escritorio | Fondo personalizable con iconos de apps |
| 📋 Barra de tareas | Lanzador, apps activas, bandeja del sistema, reloj |
| 🚀 LaunchPad | Lanzador de aplicaciones con búsqueda |
| 🪟 Ventanas | Arrastrables, redimensionables y maximizables |
| 📁 File Station | Explorador de archivos con vistas lista/cuadrícula |
| ⚙️ Panel de Control | Red, almacenamiento, usuarios, seguridad, apariencia |
| 📦 Centro de Paquetes | Catálogo de software instalable |
| 💻 Terminal | Shell interactivo con comandos del sistema |
| 📊 Monitor del Sistema | CPU, RAM, disco, red, procesos en tiempo real |
| 📝 Editor de Texto | Editor con pestañas múltiples |
| 🌙 Tema oscuro/claro | Cambio en tiempo real |
| 🔔 Notificaciones | Centro de notificaciones del sistema |

## Usuarios de demo

| Usuario | Contraseña | Rol |
|---|---|---|
| `admin` | `admin` | Administrador |
| `lgm` | `lgm` | Usuario normal |

---

## Desarrollo rápido (UI web)

```bash
cd ui
npm install
npm run dev
# Abre: http://localhost:3000
```

## Producción con Docker

```bash
# Desde la raíz del proyecto
docker build -t lgm-os -f build/Dockerfile .
docker run -p 80:80 lgm-os
# Abre: http://localhost
```

## Instalar en VM/PC con Linux existente

```bash
# Clonar el repositorio
git clone https://github.com/tu-usuario/lgm-os.git
cd lgm-os

# Ejecutar instalador (requiere Debian/Ubuntu con sudo)
sudo bash os/scripts/install.sh

# Reiniciar el sistema
sudo reboot
```

El sistema arrancará automáticamente en **modo kiosk** con Chromium mostrando la interfaz de LGM OS.

## Construir ISO instalable

> Requiere Linux (o WSL2) con `live-build` disponible.

```bash
sudo bash build/build-iso.sh
# ISO generada en: build/output/lgm-os-1.0.0-amd64.iso
```

Graba la ISO con **Balena Etcher**, **Ventoy**, o **Rufus** y arranca desde USB.

---

## Arquitectura

```
lgm-os/
├── ui/                    # React + TypeScript + Vite (interfaz web)
│   └── src/
│       ├── components/    # LoginScreen, Desktop, Taskbar, LaunchPad, Window, Notifications
│       ├── apps/          # FileStation, ControlPanel, PackageCenter, Terminal, SystemInfo, TextEditor
│       ├── store/         # Zustand stores (windowStore, systemStore)
│       └── types/         # TypeScript types
├── os/
│   ├── nginx/             # Configuración nginx
│   ├── systemd/           # Servicios systemd
│   └── scripts/           # Scripts de instalación y arranque
├── build/
│   ├── Dockerfile         # Build Docker multi-stage
│   └── build-iso.sh       # Script para generar ISO Debian Live
└── README.md
```

## Stack tecnológico

- **Frontend**: React 18, TypeScript, Vite
- **Estado**: Zustand
- **Ventanas**: react-rnd (drag & resize)
- **Iconos**: Lucide React
- **Servidor web**: nginx
- **Base OS**: Debian Bookworm (12)
- **Kiosk**: Chromium + Openbox + X11

---

*LGM OS 1.0.0 — Inspirado en Synology DSM 7.3*
