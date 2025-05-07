#!/bin/bash

# Jenkinsfile 업로드 전용 스크립트 (함수 재사용 버전)

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/utils.sh"
source "$SCRIPT_DIR/ssh_connection.sh"

# -----------------------------
# 인자 파싱
# -----------------------------
for arg in "$@"; do
  case $arg in
    --pem-path=*) SERVER[pem_path]="${arg#*=}" ;;
    --host=*) SERVER[host]="${arg#*=}" ;;
    --jenkinsfile-path=*) LOCAL_PATH="${arg#*=}" ;;
    --target-dir=*) TARGET_DIR="${arg#*=}" ;;
    *) echo "⚠️ 알 수 없는 옵션: $arg" ;;
  esac
done

TARGET_DIR="${TARGET_DIR:-/home/ec2-user/jenkinsfiles}"
REMOTE_PATH="$TARGET_DIR/Jenkinsfile"

# -----------------------------
# SSH 연결 확인 및 업로드 실행
# -----------------------------
connect_ssh_server
ssh_exec "mkdir -p $TARGET_DIR"
upload_file "$LOCAL_PATH" "$REMOTE_PATH"
log "✅ Jenkinsfile 업로드 완료 → $REMOTE_PATH"
