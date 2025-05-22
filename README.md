# 🚀 A301 Devpilot 프로젝트

## 📋 1. Gitlab 소스 클론 이후 빌드 및 배포 문서

### 🔧 개발 환경

#### 🧩 시스템 구성 요소
- **프론트엔드**: React+TypeScript 기반 프로젝트
- **백엔드**: Spring Boot REST API 서버
- **AI**: LLM 응답을 위한 FASTAPI, 데이터 저장을 위해 젠킨스 공식 문서를 크롤링하여 Vector DB에 저장

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

### 📦 프로젝트 종속성
#### 1) 백엔드 종속성
상기 작성한 application.yml 참고

#### 2) 프론트 종속성
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

#### 3) AI 종속성
'requirements.txt'
```
accelerate==1.6.0
aiohttp==3.10.11
aiosignal==1.3.2
alembic==1.15.1
annotated-types==0.7.0
anthropic==0.49.0
anyio==4.9.0
appdirs==1.4.4
argon2-cffi==23.1.0
arrow==1.3.0
astor==0.8.1
asttokens==3.0.0
async-lru==2.0.5
attrs==25.3.0
babel==2.17.0
backoff==2.2.1
beautifulsoup4==4.13.3
bitsandbytes==0.45.5
cachetools==5.5.2
certifi==2020.6.20
cffi==1.15.0
cloudpickle==3.1.1
colorama==0.4.4
comm==0.2.2
cryptography==44.0.2
cupy-cuda12x==13.4.1
dataclasses-json==0.6.7
datasets==3.5.1
debugpy==1.8.13
decorator==5.2.1
deepeval==2.8.9
defusedxml==0.7.1
dill==0.3.8
diskcache==5.6.3
dnspython==2.7.0
docstring_parser==0.16
einops==0.8.1
email_validator==2.2.0
evaluate==0.4.3
execnet==2.1.1
executing==2.2.0
fastapi==0.115.12
fastjsonschema==2.21.1
fastrlock==0.8.3
filelock==3.18.0
filetype==1.2.0
fire==0.7.0
fqdn==1.5.1
frozendict==2.0.0
frozenlist==1.6.0
fsspec==2025.3.0
google-auth==2.40.1
grpcio==1.71.0
h11==0.16.0
httpcore==1.0.9
httptools==0.6.4
httpx==0.28.1
huggingface-hub==0.30.2
idna==2.10
importlib_metadata==8.0.0
ipykernel==6.29.5
ipython==9.0.2
ipywidgets==8.1.5
jedi==0.19.2
Jinja2==3.1.6
joblib==1.5.0
json5==0.10.0
jsonschema==4.23.0
jupyterlab==4.3.6
langchain==0.3.25
langchain-community==0.3.23
langchain-core==0.3.59
langchain-google-genai==2.1.4
langchain-huggingface==0.1.2
langchain-openai==0.3.16
langchain-pinecone==0.2.5
langchain-tests==0.3.19
langchain-text-splitters==0.3.8
langsmith==0.3.40
loguru==0.7.3
markdown-it-py==3.0.0
MarkupSafe==3.0.2
marshmallow==3.26.1
matplotlib-inline==0.1.7
mistune==3.1.2
numpy==2.2.5
pandas==2.2.3
pinecone==6.0.2
pinecone-client==2.0.0
protobuf==4.25.7
psutil==5.9.8
pydantic==2.10.6
pytest==8.3.5
ray==2.46.0
requests==2.28.1
rich==13.9.4
safetensors==0.5.3
scikit-learn==1.6.1
scipy==1.15.2
selenium==4.31.0
sentence-transformers==4.1.0
sentry-sdk==2.28.0
setuptools==74.1.2
sqlalchemy==2.0.39
starlette==0.46.2
sympy==1.13.1
tenacity==9.0.0
tiktoken==0.9.0
tokenizers==0.21.1
torch==2.6.0
torchaudio==2.6.0
torchvision==0.21.0
tqdm==4.65.0
transformers==4.51.3
trio==0.30.0
uvicorn==0.34.2
vllm==0.8.5.post1
watchfiles==1.0.5
wheel==0.44.0
zipp==3.21.0
```

## 🔌 2. 프로젝트에서 사용하는 외부 서비스 정보
### pinecone (Vector DB)
- 대규모 벡터 데이터를 빠르고 효율적으로 검색할 수 있도록 지원하는 클라우드 기반 벡터 데이터베이스
