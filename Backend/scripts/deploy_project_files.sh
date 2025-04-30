#!/bin/bash

# ========================================================
# deploy_project_files.sh
# EC2에 Docker 환경 파일만 업로드하는 스크립트
# ========================================================

# -----------------------------
# 인자 파싱
# -----------------------------
for arg in "$@"; do
  case $arg in
    --project-name=*) PROJECT_NAME="${arg#*=}" ;;
    --backend-dockerfile=*) BACKEND_FILE="${arg#*=}" ;;
    --frontend-dockerfile=*) FRONTEND_FILE="${arg#*=}" ;;
    --docker-compose=*) COMPOSE_FILE="${arg#*=}" ;;
    --nginx-conf=*) NGINX_FILE="${arg#*=}" ;;
    *) echo "⚠️ 알 수 없는 옵션: $arg" ;;
  esac
done

# -----------------------------
# 경로 설정
# -----------------------------
REMOTE_DIR="/home/ec2-user/${PROJECT_NAME}"
REMOTE_BACKEND="$REMOTE_DIR/backend"
REMOTE_FRONTEND="$REMOTE_DIR/frontend"
REMOTE_NGINX="$REMOTE_DIR/nginx"

# -----------------------------
# EC2 디렉토리 생성 (없으면 생성)
# -----------------------------
log "[EC2] 프로젝트 디렉토리 확인 및 생성 중..."
ssh_exec "mkdir -p $REMOTE_BACKEND $REMOTE_FRONTEND $REMOTE_NGINX"

# -----------------------------
# 파일 유효성 검사
# -----------------------------
[[ -f "$BACKEND_FILE" ]] || { error_exit "❌ 백엔드 Dockerfile 없음: $BACKEND_FILE"; }
[[ -f "$FRONTEND_FILE" ]] || { error_exit "❌ 프론트 Dockerfile 없음: $FRONTEND_FILE"; }
[[ -f "$COMPOSE_FILE" ]] || { error_exit "❌ docker-compose.yml 없음: $COMPOSE_FILE"; }
[[ -f "$NGINX_FILE" ]] || { error_exit "❌ nginx.conf 없음: $NGINX_FILE"; }

# -----------------------------
# 파일 업로드
# -----------------------------
log "[EC2] 파일 업로드 시작..."

upload_file "$BACKEND_FILE" "$REMOTE_BACKEND/Dockerfile"
upload_file "$FRONTEND_FILE" "$REMOTE_FRONTEND/Dockerfile"
upload_file "$COMPOSE_FILE" "$REMOTE_DIR/docker-compose.yml"
upload_file "$NGINX_FILE" "$REMOTE_NGINX/nginx.conf"

log "✅ 파일 업로드 완료: $REMOTE_DIR"
