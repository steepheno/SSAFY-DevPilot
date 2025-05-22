FROM ubuntu:22.04

# 기본 패키지 및 JDK 설치
RUN apt-get update \
    && apt-get install -y \
       openjdk-17-jdk \
       dos2unix \
    && rm -rf /var/lib/apt/lists/*

# 작업 디렉토리 생성
WORKDIR /app

# Gradle 파일 복사
COPY gradlew settings.gradle build.gradle ./
COPY gradle/ gradle/

# 소스 코드 복사
COPY . .

# 실행 권한 부여
RUN chmod +x gradlew \
    && find . -type f -name '*.sh' -exec dos2unix {} \; \
    && find . -type f -name '*.sh' -exec chmod +x {} \;

# 프로젝트 빌드
RUN ./gradlew --no-daemon clean build -x test

# 포트 설정
EXPOSE 3000

# JAR 파일 실행
CMD ["java", "-jar", "build/libs/devpilot-0.0.1-SNAPSHOT.jar"]