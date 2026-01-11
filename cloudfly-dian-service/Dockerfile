# ============================================================================
# Dockerfile para Microservicio DIAN
# Multi-stage build para optimizar tamaño de imagen
# ============================================================================

# Etapa 1: Build
FROM maven:3.9-eclipse-temurin-17 AS build

WORKDIR /app

# Copiar POMs
COPY pom.xml .
COPY dian-common/pom.xml dian-common/
COPY dian-core/pom.xml dian-core/

# Descargar dependencias (cacheado si no cambian los POMs)
RUN mvn dependency:go-offline -B

# Copiar código fuente
COPY dian-common/src dian-common/src
COPY dian-core/src dian-core/src

# Compilar y empaquetar
RUN mvn clean package -DskipTests -B

# Etapa 2: Runtime
FROM eclipse-temurin:17-jre-alpine

WORKDIR /app

# Instalar curl para health checks
RUN apk add --no-cache curl

# Crear usuario no-root
RUN addgroup -S dian && adduser -S dian -G dian

# Copiar JAR desde build
COPY --from=build /app/dian-core/target/*.jar app.jar

# Cambiar permisos
RUN chown -R dian:dian /app

# Cambiar a usuario no-root
USER dian

# Exponer puerto
EXPOSE 8081

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:8081/actuator/health || exit 1

# JVM options
ENV JAVA_OPTS="-Xms256m -Xmx512m -XX:+UseG1GC -XX:MaxGCPauseMillis=200"

# Ejecutar aplicación
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
