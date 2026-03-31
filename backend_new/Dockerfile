# Etapa 1: Construcción de la aplicación
FROM maven:3.9.4-eclipse-temurin-17 AS builder

# Establecer directorio de trabajo
WORKDIR /app

# Copiar archivos de configuración y dependencias
COPY pom.xml ./
COPY src ./src

# Construir la aplicación
RUN mvn clean package -DskipTests

# Etapa 2: Imagen ligera para ejecutar la aplicación
FROM eclipse-temurin:17-jdk-alpine

# Establecer directorio de trabajo
WORKDIR /app

# Copiar el archivo JAR generado desde la etapa de construcción
COPY --from=builder /app/target/*.jar app.jar

# Exponer el puerto donde se ejecutará la aplicación
EXPOSE 8080

# Comando para ejecutar la aplicación
ENTRYPOINT ["java", "-jar", "app.jar"]
