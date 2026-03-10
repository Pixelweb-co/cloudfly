# Etapa 1: Build
FROM node:18-alpine AS builder

WORKDIR /app

# Copiar dependencias y código
COPY package*.json ./
# Ignorar node_modules locales si existen
COPY . .

# Instalar dependencias
RUN npm install

# Aceptar variables de entorno para el build de Next.js
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_BASE_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_BASE_URL=$NEXT_PUBLIC_BASE_URL

# Construir aplicación
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

USER nextjs

EXPOSE 3000

# Iniciar servidor Next
CMD ["npx", "next", "start"]
