# 베이스 이미지
FROM ubuntu:22.04

# 기본 패키지, JDK 및 dos2unix 설치 (CRLF->LF 변환 도구)
RUN apt-get update \
    && apt-get install -y \
       openjdk-17-jdk \
       dos2unix \
    && rm -rf /var/lib/apt/lists/*

# 작업 디렉토리 생성
WORKDIR /app

# Gradle 래퍼 및 설정 파일 복사
COPY gradlew settings.gradle build.gradle ./
COPY gradle/ gradle/

# 프로젝트 전체 파일 복사
COPY . .

# 실행 권한 부여 및 CRLF 제거
RUN chmod +x gradlew \
    && find . -type f -name '*.sh' -exec dos2unix {} \; \
    && find . -type f -name '*.sh' -exec chmod +x {} \;

# 프로젝트 빌드 (테스트 제외)
RUN ./gradlew --no-daemon clean build -x test

# 컨테이너 내부 포트 노출
EXPOSE 3000

# 애플리케이션 시작 명령
CMD ["java", "-jar", "build/libs/devpilot-0.0.1-SNAPSHOT.jar"]

# 빌드 후 컨테이너 실행 시 호스트 포트 매핑 예시:
# docker run -d -p 3000:3000 --name devpilot <이미지 태그>
