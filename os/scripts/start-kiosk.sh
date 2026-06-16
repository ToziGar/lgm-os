#!/usr/bin/env bash
# =============================================================================
# LGM OS — Iniciar el navegador kiosk manualmente
# Uso: bash start-kiosk.sh
# =============================================================================

set -euo pipefail

DISPLAY="${DISPLAY:-:0}"
URL="${LGMOS_URL:-http://localhost}"

echo "[LGM-OS] Iniciando navegador kiosk en $URL"

# Asegurarse que nginx está corriendo
systemctl is-active --quiet nginx || systemctl start nginx

# Esperar a que nginx responda
for i in {1..10}; do
    curl -sf "$URL" > /dev/null && break
    echo "[LGM-OS] Esperando a nginx... ($i/10)"
    sleep 1
done

# Lanzar Chromium en kiosk mode
DISPLAY="$DISPLAY" chromium-browser \
    --kiosk \
    --no-sandbox \
    --disable-infobars \
    --disable-session-crashed-bubble \
    --disable-restore-on-startup \
    --noerrdialogs \
    --disable-translate \
    --overscroll-history-navigation=0 \
    --disable-pinch \
    --app="$URL" \
    --window-size=1920,1080 \
    --window-position=0,0
