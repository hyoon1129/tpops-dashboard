# ── Stage 1: Build ───────────────────────────────────────────────────────────
FROM eclipse-temurin:17-jdk AS builder
WORKDIR /app

COPY gradlew ./
COPY gradle/ gradle/
COPY build.gradle settings.gradle ./
RUN ./gradlew dependencies --no-daemon -q 2>/dev/null || true

COPY src/ src/
RUN ./gradlew bootJar --no-daemon -x test

# ── Stage 2: Runtime ─────────────────────────────────────────────────────────
FROM eclipse-temurin:17-jre
WORKDIR /app

ENV TZ=Asia/Seoul
ENV JAVA_OPTS=""

COPY --from=builder /app/build/libs/*.jar app.jar

EXPOSE 8080
ENTRYPOINT ["sh", "-c", "exec java ${JAVA_OPTS} -Djava.security.egd=file:/dev/./urandom -jar /app/app.jar"]
