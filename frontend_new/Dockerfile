# Etapa 1: Build
FROM node:18-alpine AS builder

WORKDIR /app

# Instalar dependencias necesarias para algunos paquetes nativos
RUN apk add --no-cache libc6-compat

# Copiar configuración de dependencias
COPY package*.json ./
COPY pnpm-lock.yaml* ./
COPY .npmrc* ./

# Instalar TODAS las dependencias (necesarias para el build)
RUN npm install

# Copiar el resto del código
COPY . .

# Aceptar variables de entorno para el build de Next.js
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_BASE_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_BASE_URL=$NEXT_PUBLIC_BASE_URL
ENV NEXT_TELEMETRY_DISABLED 1

# Construir aplicación (esto generará .next/standalone si next.config.mjs tiene output: 'standalone')
RUN npm run build

# Etapa 2: Producción
FROM node:18-alpine AS runner

WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# Crear usuario no root
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copiar assets estáticos
COPY --from=builder /app/public ./public

# Crear carpeta .next y dar permisos
RUN mkdir .next && chown nextjs:nodejs .next

# Copiar archivos standalone (muy ligeros, solo lo necesario)
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

# Iniciar servidor Next.js usando el server.js generado
CMD ["node", "server.js"]
