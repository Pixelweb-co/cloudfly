# Dockerfile optimized for VPS connectivity issues (One-stage Maven build)
FROM maven:3.9.4-eclipse-temurin-17
WORKDIR /app

# Cache dependencies
COPY pom.xml .
RUN mvn dependency:go-offline -B || true

# Copy source and build
COPY src ./src
RUN mvn clean package -DskipTests -B

# Execute JAR directly from target
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "target/backend-new-0.0.1-SNAPSHOT.jar"]
