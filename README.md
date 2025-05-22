# 🚀 A301 Devpilot 프로젝트

## 📋 1. Gitlab 소스 클론 이후 빌드 및 배포 문서

### 🔧 개발 환경

#### 🧩 시스템 구성 요소
- **프론트엔드**: React+TypeScript 기반 프로젝트
- **백엔드**: Spring Boot REST API 서버
- **AI**: LLM 응답을 위한 FASTAPI, 데이터 저장을 위한 Vector DB

#### 사용 기술 스택 및 버전
- **빌드 도구**:
  - 프론트엔드: Vite 6.3.1
  - 백엔드: Gradle 8.13
- **프레임워크 및 주요 라이브러리**:
  - Spring Boot 3.4.2
  - Shell script
  - Powershell Script
  - Jenkins API
  - React 18.3.1
  - TypeScript 5.7.3

### 🔑 빌드 시 사용되는 환경 변수
#### 백엔드(Spring Boot)
`application.yml`
```
spring:
  application:
    name: devpilot

  thymeleaf:
    cache: false
    prefix: classpath:/templates/
    suffix: .txt
    mode: TEXT

  jackson:
    default-property-inclusion: non_null
    serialization:
      fail-on-empty-beans: false

server:
  port: ${PORT:3000}
  compression:
    enabled: true
  error:
    include-stacktrace: never

  ssh:
    connection-timeout: 30000
    channel-timeout: 60000
    default-port: 22
    known-hosts-file: ${user.home}/.ssh/known_hosts

  jenkins:
    url: https://localhost
    user: admin
    tokenFile: ${user.home}/.devpilot/jenkins_api_token.txt
    default-port: 8080
    cli-download-path: /jnlpJars/jenkins-cli.jar
    admin-scripts-path: classpath:/scripts/jenkins
    default-plugins:
      - git
      - workflow-aggregator
      - pipeline-stage-view
      - docker-workflow
      - credentials-binding
      - ssh-credentials

  jenkinsfile:
    output:
      directory: ./result/jenkinsfile

  dockerfile:
    output:
      directory: ./result/dockerfile

  logging:
    file-path: ${user.home}/.devpilot/logs
    keep-days: 7
    max-size: 100MB

  execution:
    timeout: 300000
    retry-count: 3
    retry-delay: 5000

  temp:
    cleanup-on-exit: true
    directory: ${user.home}/.devpilot/temp

logging:
  level:
    root: INFO
    com.corp.devpilot: DEBUG
    org.springframework.web: INFO
  pattern:
    console: "%d{yyyy-MM-dd HH:mm:ss} [%thread] %-5level %logger{36} - %msg%n"
    file: "%d{yyyy-MM-dd HH:mm:ss} [%thread] %-5level %logger{36} - %msg%n"

springdoc:
  api-docs:
    path: /api-docs
    enabled: true
  packages-to-scan: com.corp.devpilot
  swagger-ui:
    path: /swagger-ui.html
    tags-sorter: alpha
    operations-sorter: alpha
    disable-swagger-default-url: true
    display-request-duration: true
    filter: true
  cache:
    disabled: true
  show-actuator: false
  default-consumes-media-type: application/json
  default-produces-media-type: application/json

scripts:
  linux-main-path: ./scripts/linux/main.sh
  window-main-path: ./scripts/window/main.ps1
  linux-confirm-path: ./scripts/linux/confirm.sh

ec2:
  remote-base-dir: /home/ubuntu

```

#### 프론트엔드 (React + TypeScript)
`.env`
```
# APIs
VITE_API_LOCAL_URL = "http://localhost:3000/api"

# Worker
VITE_API_URL=http://localhost:3000/api
VITE_SSE_URL=http://localhost:3000/sse-gateway/listen/my-client-id
VITE_MODE=dev

# Fast API (챗봇용)
VITE_FAST_API_URL = "http://70.12.130.101:8000/api"
```

### 🚢 빌드 및 배포 방법

#### Jenkins CI/CD 구성
- Jenkins 서버 접근 포트: 8080
- 배포 과정:
  1. Jenkins credentials에서 Gitlab 토큰값 로딩
  2. SSH키를 이용하여 서버 접속
  3. 최신 코드 pull
  4. 기존 컨테이너 중지: `docker-compose down`
  5. 캐시 없이 빌드: `docker-compose build --no-cache`
  6. 컨테이너 실행: `docker-compose up -d`

### ⚠️ 배포 시 특이사항

#### 인프라 
1. port가 열려 있어야 함
  - 22(ssh) 
  - 80(http) 
  - 443(https)
  - 8080(Jenkins)

2. SSL 설정
   * /nginx/ssl/fullchain.pem
   * /nginx/ssl/privkey.pem

#### AI


### 📦 프로젝트 종속성
#### 백엔드 종속성
상기 작성한 application.yml 참고

#### 프론트 종속성
`package.json`
```
{
  "name": "DevPilot",
  "private": true,
  "version": "0.0.1",
  "main": "src/client/main.cjs",
  "type": "module",
  "scripts": {
    "dev": "vite --mode dev",
    "prebuild": "npm run dep-cruise-if-installed",
    "dep-cruise:check": "npm ls dependency-cruiser >/dev/null 2>&1",
    "dep-cruise:gen": "npx --no-install depcruise src --config .dependency-cruiser.cjs --output-type dot | dot -T svg > dependency-graph.svg",
    "dep-cruise-if-installed": "npm run dep-cruise:check && npm run dep-cruise:gen || echo '⚠️ skipping dep-cruiser'",
    "build": "tsc -b && vite build",
    "electron:dev": "npm run dev & electron .",
    "electron:build": "npm run build && npx @electron/packager . DevPilot --platform=win32 --arch=x64 --out=release --overwrite",
    "lint": "eslint .",
    "preview": "vite preview"
  },
  "dependencies": {
    "@radix-ui/react-checkbox": "^1.2.3",
    "@tanstack/react-query": "^5.76.1",
    "@tanstack/react-query-devtools": "^5.76.1",
    "axios": "^1.9.0",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "emblor": "^1.4.8",
    "lottie-react": "^2.4.1",
    "lucide-react": "^0.503.0",
    "path": "^0.12.7",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router": "^7.6.0",
    "react-router-dom": "^7.5.3",
    "tailwind-merge": "^3.2.0",
    "tailwindcss-animate": "^1.0.7",
    "zustand": "^5.0.4"
  },
  "devDependencies": {
    "@electron/packager": "^18.3.6",
    "@eslint/js": "^9.22.0",
    "@types/react": "^18.3.1",
    "@types/react-dom": "^18.3.1",
    "@vitejs/plugin-react": "^4.3.4",
    "autoprefixer": "^10.4.21",
    "dependency-cruiser": "^16.10.2",
    "electron": "^36.2.0",
    "eslint": "^9.22.0",
    "eslint-plugin-react-hooks": "^5.2.0",
    "eslint-plugin-react-refresh": "^0.4.19",
    "globals": "^16.0.0",
    "msw": "^2.8.2",
    "postcss": "^8.5.3",
    "prettier": "^3.5.3",
    "prettier-plugin-tailwindcss": "^0.6.11",
    "tailwindcss": "^3.4.17",
    "typescript": "~5.7.2",
    "typescript-eslint": "^8.26.1",
    "vite": "^6.3.1",
    "vite-plugin-svgr": "^4.3.0"
  },
  "msw": {
    "workerDirectory": [
      ".public",
      "public"
    ]
  },
  "build": {
    "appId": "com.example.app",
    "asarUnpack": [
      "backend/**/*.jar"
    ],
    "extraResources": [
      {
        "from": "../../S12P31A301-BE/Backend/build/libs/devpilot-0.0.1-SNAPSHOT.jar",
        "to": "backend",
        "filter": [
          "*.jar"
        ]
      }
    ],
    "files": [
      "dist/**/*",
      "node_modules/**/*",
      "main.js",
      "backend/*.jar"
    ],
    "directories": {
      "buildResources": "assets"
    },
    "win": {
      "target": [
        "nsis",
        "zip"
      ]
    },
    "mac": {
      "target": [
        "dmg",
        "zip"
      ]
    }
  }
}
```

## 🔌 2. 프로젝트에서 사용하는 외부 서비스 정보


## 💾 3. DB 초기화 및 데이터 관리
### 🗄️ 초기 데이터 생성


### 📝 주요 계정 및 프로퍼티 파일
