#!/bin/bash

# Jenkinsfile 업로드 전용 스크립트 (함수 재사용 버전)

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_PATH="$HOME/.devpilot/.env"

# shellcheck source=$HOME/.devpilot/.env
if [[ -f "$ENV_PATH" ]]; then
  source "$ENV_PATH"
else
  echo "❌ 환경 파일을 찾을 수 없습니다: $ENV_PATH"
  exit 1
fi

# ========================================================
# 오브젝트 선언 (환경 변수 기반 초기화)
# ========================================================
declare -A SERVER=(
  [pem_path]="$PEM_PATH"
  [host]="$EC2_HOST"
  [jenkins_port]="$JENKINS_PORT"
  [config_dir]="$CONFIG_DIR"
)

source "$SCRIPT_DIR/utils.sh"
source "$SCRIPT_DIR/ssh_connection.sh"
source "$SCRIPT_DIR/jenkins_pipeline.sh"

# -----------------------------
# 인자 파싱
# -----------------------------
for arg in "$@"; do
  case $arg in
    --jenkinsfile-path=*) LOCAL_PATH="${arg#*=}" ;;
    --remote-dir=*) TARGET_DIR="${arg#*=}" ;;
    --job-name=*) JOB_NAME="${arg#*=}" ;;
    *) echo "⚠️ 알 수 없는 옵션: $arg" ;;
  esac
done

TARGET_DIR="${TARGET_DIR:-/home/ubuntu/jenkinsfiles}"
REMOTE_PATH="$TARGET_DIR/Jenkinsfile"

# -----------------------------
# SSH 연결 확인 및 업로드 실행
# -----------------------------
connect_ssh_server
ssh_exec "mkdir -p $TARGET_DIR"
upload_file "$LOCAL_PATH" "$REMOTE_PATH"
log "✅ Jenkinsfile 업로드 완료 → $REMOTE_PATH"

# -----------------------------
# Job XML 생성 및 Jenkins에 등록
# -----------------------------
#generate_pipeline_job_config "$JOB_NAME" "$(basename "$TARGET_DIR")"
#
#ssh_exec "java -jar /tmp/jenkins-cli.jar \
#  -s http://localhost:${SERVER[jenkins_port]} \
#  -auth admin:$JENKINS_PASSWORD \
#  create-job '$JOB_NAME' < /tmp/${JOB_NAME}-job.xml"
#
#log "✅ Jenkins Job 등록 완료: $JOB_NAME"