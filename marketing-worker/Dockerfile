FROM maven:3.9.4-eclipse-temurin-17
WORKDIR /app

# Cache dependencies
COPY pom.xml .
RUN mvn dependency:go-offline -B || true

# Copy source and build
COPY src ./src
RUN mvn clean package -DskipTests -B

# Execute JAR
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "target/worker-0.0.1-SNAPSHOT.jar"]
