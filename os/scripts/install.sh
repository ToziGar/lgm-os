#!/usr/bin/env bash
# =============================================================================
# LGM OS — Script de instalación en sistema Debian/Ubuntu existente
# Uso: sudo bash install.sh
# =============================================================================

set -euo pipefail

LGMOS_VERSION="1.0.0"
UI_DIST="/opt/lgm-os/ui"
LOG="/var/log/lgm-os-install.log"

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'

log()  { echo -e "${GREEN}[LGM-OS]${NC} $1" | tee -a "$LOG"; }
warn() { echo -e "${YELLOW}[WARN]${NC}  $1"  | tee -a "$LOG"; }
fail() { echo -e "${RED}[ERROR]${NC} $1"     | tee -a "$LOG"; exit 1; }

[[ $EUID -ne 0 ]] && fail "Este script debe ejecutarse como root (sudo bash install.sh)"

log "========================================"
log " LGM OS $LGMOS_VERSION — Instalación"
log "========================================"

# 1. Dependencias del sistema
log "Instalando dependencias del sistema..."
apt-get update -qq
apt-get install -y -qq nginx curl git xorg openbox chromium-browser \
    build-essential || fail "No se pudieron instalar las dependencias"

# 2. Node.js (si no está instalado)
if ! command -v node &>/dev/null; then
    log "Instalando Node.js 20..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
fi

node_ver=$(node -v)
log "Node.js $node_ver detectado"

# 3. Crear usuario kiosk
if ! id "lgmkiosk" &>/dev/null; then
    log "Creando usuario kiosk..."
    useradd -m -s /bin/bash lgmkiosk
    usermod -aG audio,video lgmkiosk
fi

# 4. Build de la UI
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$SCRIPT_DIR/../.."
UI_SRC="$PROJECT_ROOT/ui"

if [[ ! -d "$UI_SRC" ]]; then
    fail "No se encontró el directorio ui/ en $UI_SRC"
fi

log "Construyendo la interfaz web..."
cd "$UI_SRC"
npm install --silent
npm run build

# 5. Instalar UI
log "Instalando UI en $UI_DIST..."
mkdir -p "$UI_DIST"
cp -r dist/* "$UI_DIST/"
chown -R www-data:www-data "$UI_DIST"
chmod -R 755 "$UI_DIST"

# 6. Configurar nginx
log "Configurando nginx..."
cp "$PROJECT_ROOT/os/nginx/lgm-os.conf" /etc/nginx/sites-available/lgm-os
ln -sf /etc/nginx/sites-available/lgm-os /etc/nginx/sites-enabled/lgm-os
rm -f /etc/nginx/sites-enabled/default
nginx -t || fail "Configuración nginx inválida"
systemctl enable nginx
systemctl restart nginx

# 7. Configurar autostart X11 para kiosk
log "Configurando sesión kiosk..."
mkdir -p /home/lgmkiosk/.config/openbox
cat > /home/lgmkiosk/.xinitrc << 'EOF'
#!/bin/sh
exec openbox-session
EOF

cat > /home/lgmkiosk/.config/openbox/autostart << 'EOF'
# Disable screen saver and blanking
xset s off
xset -dpms
xset s noblank

# Start kiosk browser
chromium-browser \
  --kiosk \
  --no-sandbox \
  --disable-infobars \
  --noerrdialogs \
  --app=http://localhost \
  --window-size=1920,1080 &
EOF

chown -R lgmkiosk:lgmkiosk /home/lgmkiosk/.config

# 8. Instalar servicios systemd
log "Instalando servicios systemd..."
cp "$PROJECT_ROOT/os/systemd/lgm-ui.service"    /etc/systemd/system/
cp "$PROJECT_ROOT/os/systemd/lgm-kiosk.service" /etc/systemd/system/
systemctl daemon-reload
systemctl enable lgm-kiosk

# 9. Auto-login para kiosk (opcional)
if [[ -d /etc/systemd/system/getty@tty1.service.d ]]; then
    warn "Directorio getty ya existe, saltando auto-login"
else
    mkdir -p /etc/systemd/system/getty@tty1.service.d
    cat > /etc/systemd/system/getty@tty1.service.d/override.conf << EOF
[Service]
ExecStart=
ExecStart=-/sbin/agetty --autologin lgmkiosk --noclear %I \$TERM
EOF
fi

# .bash_profile para lgmkiosk — inicia X11 automáticamente en tty1
cat > /home/lgmkiosk/.bash_profile << 'EOF'
[[ -z $DISPLAY && $XDG_VTNR -eq 1 ]] && exec startx
EOF
chown lgmkiosk:lgmkiosk /home/lgmkiosk/.bash_profile

log ""
log "========================================"
log "  ✅ LGM OS instalado correctamente"
log "========================================"
log "  Reinicia el sistema para iniciar."
log "  El sistema arrancará en modo kiosk."
log "  URL interna: http://localhost"
log "========================================"
