#!/usr/bin/env bash
# =============================================================================
# LGM OS — Construir ISO instalable (Debian Live)
# Requiere: live-build, debootstrap (solo en Linux/WSL2/Docker)
# Uso: sudo bash build-iso.sh
# =============================================================================

set -euo pipefail

OUTPUT_DIR="$(pwd)/output"
WORK_DIR="$(pwd)/work"

echo "======================================"
echo "  LGM OS — Construcción de ISO"
echo "======================================"

# Verificar herramientas
command -v lb      &>/dev/null || { echo "Instalando live-build..."; apt-get install -y live-build; }
command -v debootstrap &>/dev/null || { apt-get install -y debootstrap; }

rm -rf "$WORK_DIR"
mkdir -p "$WORK_DIR" "$OUTPUT_DIR"
cd "$WORK_DIR"

# Inicializar live-build
lb config \
    --mode debian \
    --system live \
    --distribution bookworm \
    --architectures amd64 \
    --binary-images iso-hybrid \
    --bootloaders grub-efi,syslinux \
    --debian-installer false \
    --archive-areas "main contrib non-free non-free-firmware" \
    --apt-options "--yes --option Acquire::Check-Valid-Until=false"

# Paquetes a incluir
cat > config/package-lists/lgmos.list.chroot << 'EOF'
nginx
curl
wget
git
xorg
openbox
chromium
fonts-liberation
fonts-noto
fonts-noto-color-emoji
ca-certificates
sudo
bash-completion
vim-tiny
htop
net-tools
iputils-ping
EOF

# Hook: copiar la UI y configurar todo
mkdir -p config/hooks/live
cat > config/hooks/live/01-lgmos-setup.hook.chroot << 'HOOK'
#!/bin/bash
set -e

# Crear usuario kiosk
useradd -m -s /bin/bash lgmkiosk
echo "lgmkiosk:lgmos" | chpasswd
usermod -aG audio,video,sudo lgmkiosk

# Crear usuario admin
useradd -m -s /bin/bash admin
echo "admin:admin" | chpasswd
usermod -aG sudo admin

# Copiar UI si existe
if [[ -d /tmp/lgmos-ui ]]; then
    mkdir -p /opt/lgm-os/ui
    cp -r /tmp/lgmos-ui/* /opt/lgm-os/ui/
    chown -R www-data:www-data /opt/lgm-os/ui
fi

# Configurar nginx
cat > /etc/nginx/sites-available/lgm-os << 'NGINX'
server {
    listen 80 default_server;
    root /opt/lgm-os/ui;
    index index.html;
    location / { try_files $uri $uri/ /index.html; }
}
NGINX
ln -sf /etc/nginx/sites-available/lgm-os /etc/nginx/sites-enabled/lgm-os
rm -f /etc/nginx/sites-enabled/default

# Habilitar nginx al inicio
systemctl enable nginx

# Configurar openbox + kiosk
mkdir -p /home/lgmkiosk/.config/openbox
cat > /home/lgmkiosk/.config/openbox/autostart << 'OB'
xset s off
xset -dpms
xset s noblank
sleep 3
chromium --kiosk --no-sandbox --noerrdialogs --app=http://localhost &
OB
chown -R lgmkiosk:lgmkiosk /home/lgmkiosk

cat > /home/lgmkiosk/.bash_profile << 'BP'
[[ -z $DISPLAY && $XDG_VTNR -eq 1 ]] && exec startx
BP
chown lgmkiosk:lgmkiosk /home/lgmkiosk/.bash_profile

# Auto-login en tty1
mkdir -p /etc/systemd/system/getty@tty1.service.d
cat > /etc/systemd/system/getty@tty1.service.d/override.conf << 'GETTY'
[Service]
ExecStart=
ExecStart=-/sbin/agetty --autologin lgmkiosk --noclear %I $TERM
GETTY
HOOK

chmod +x config/hooks/live/01-lgmos-setup.hook.chroot

# Construir la ISO
echo "Construyendo ISO (puede tardar 15-30 minutos)..."
lb build 2>&1 | tee "$OUTPUT_DIR/build.log"

# Mover ISO resultante
ISO_FILE=$(find . -name "*.iso" | head -1)
if [[ -n "$ISO_FILE" ]]; then
    cp "$ISO_FILE" "$OUTPUT_DIR/lgm-os-1.0.0-amd64.iso"
    echo ""
    echo "======================================"
    echo "  ✅ ISO creada exitosamente:"
    echo "  $OUTPUT_DIR/lgm-os-1.0.0-amd64.iso"
    echo "======================================"
else
    echo "❌ No se encontró la ISO generada. Revisa $OUTPUT_DIR/build.log"
    exit 1
fi
