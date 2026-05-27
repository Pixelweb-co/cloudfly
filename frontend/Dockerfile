# Etapa 1: Build
FROM node:18-alpine AS builder

WORKDIR /app

# Copiar dependencias y código
COPY package*.json ./
COPY . .

# Instalar dependencias y construir
RUN npm install
RUN npm run build

# Etapa 2: Producción
FROM node:18-alpine

WORKDIR /app

# Crear usuario no root
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copiar sólo lo necesario desde el builder
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/next.config.mjs ./next.config.mjs

USER nextjs

# Variables de entorno
ARG ENV_VARIABLE
ENV ENV_VARIABLE=${ENV_VARIABLE}
ARG NEXT_PUBLIC_ENV_VARIABLE
ENV NEXT_PUBLIC_ENV_VARIABLE=${NEXT_PUBLIC_ENV_VARIABLE}

EXPOSE 3000

# Iniciar servidor Next
CMD ["npx", "next", "start"]
