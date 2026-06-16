FROM debian:bookworm-slim AS builder

WORKDIR /build

# Instalar dependencias de Node.js
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl ca-certificates \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y --no-install-recommends nodejs \
    && rm -rf /var/lib/apt/lists/*

# Copiar e instalar dependencias
COPY ui/package.json ui/package-lock.json* ./
RUN npm ci --silent

# Copiar fuentes y compilar
COPY ui/ .
RUN npm run build

# ============================================================
# Imagen de producción
# ============================================================
FROM nginx:1.25-alpine AS production

# Copiar UI compilada
COPY --from=builder /build/dist /usr/share/nginx/html

# Copiar configuración nginx
COPY os/nginx/lgm-os.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

LABEL org.opencontainers.image.title="LGM OS"
LABEL org.opencontainers.image.version="1.0.0"
LABEL org.opencontainers.image.description="LGM OS — Web-based OS interface"

CMD ["nginx", "-g", "daemon off;"]
