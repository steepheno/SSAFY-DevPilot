#!/bin/bash

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_PATH="$HOME/.devpilot/.env"

source "$SCRIPT_DIR/utils.sh"
source "$SCRIPT_DIR/ssh_connection.sh"

if [[ -f "$ENV_PATH" ]]; then
  set -o allexport
  source "$ENV_PATH"
  set +o allexport
else
  echo "❌ 환경 파일이 존재하지 않습니다: $ENV_PATH"
  exit 1
fi

log "🔎 현재 환경 설정:"
log "EC2_HOST=$EC2_HOST"
log "PEM_PATH=$PEM_PATH"
log "JENKINS_PORT=$JENKINS_PORT"
log "JENKINS_PASSWORD=$JENKINS_PASSWORD"

# ========================================================
# 오브젝트 선언 (환경 변수 기반 초기화)
# ========================================================
declare -A SERVER=(
  [pem_path]="$PEM_PATH"
  [host]="$EC2_HOST"
  [jenkins_port]="$JENKINS_PORT"
  [config_dir]="$CONFIG_DIR"
)

# ✅ jq 설치 여부 확인 후 자동 설치
if ! command -v jq &> /dev/null; then
  log "⚠️ 로컬에 jq가 없어 임시 설치를 진행합니다."

  # 설치 경로 지정 (로컬 bin 디렉토리)
  LOCAL_BIN="$HOME/.local/bin"
  mkdir -p "$LOCAL_BIN"
  wget -q -O "$LOCAL_BIN/jq" https://github.com/stedolan/jq/releases/download/jq-1.6/jq-linux64
  chmod +x "$LOCAL_BIN/jq"

  # 현재 세션에 PATH 추가 (스크립트 안에서만 유효)
  export PATH="$LOCAL_BIN:$PATH"

  if command -v jq &> /dev/null; then
    log "✅ jq 설치 완료 (로컬 설치: $LOCAL_BIN/jq)"
  else
    error_exit "❌ jq 설치 실패: 수동 설치가 필요합니다."
  fi
else
  log "✅ jq가 이미 설치되어 있습니다."
fi

# ---------------------------
# 인자 파싱
# ---------------------------
for arg in "$@"; do
  case $arg in
    --git-token=*) GIT_TOKEN="${arg#*=}" ;;
    --git-repo-url=*) GIT_REPO_URL="${arg#*=}" ;;
    --jenkins-url=*) JENKINS_URL="${arg#*=}" ;;          # 예: http://jenkins-host:7070
    --webhook-secret=*) WEBHOOK_SECRET="${arg#*=}" ;;    # 직접 전달 또는 랜덤 생성
    *) echo "⚠️ 알 수 없는 옵션: $arg" ;;
  esac
done

log "GIT_TOKEN=$GIT_TOKEN"
curl -s -H "PRIVATE-TOKEN: $GIT_TOKEN" https://lab.ssafy.com/api/v4/user

: "${GIT_TOKEN:?GIT_TOKEN이 필요합니다.}"
: "${GIT_REPO_URL:?GIT_REPO_URL이 필요합니다.}"
: "${JENKINS_URL:?JENKINS_URL이 필요합니다.}"

# ---------------------------
# Webhook Secret 자동 생성 (필요 시)
# ---------------------------
if [[ -z "$WEBHOOK_SECRET" ]]; then
  WEBHOOK_SECRET=$(uuidgen)
  echo "ℹ️ Webhook Secret 자동 생성: $WEBHOOK_SECRET"
fi

# ---------------------------
# GitLab Project ID 조회
# ---------------------------
REPO_NAME=$(basename "$GIT_REPO_URL" .git)
REPO_OWNER=$(basename "$(dirname "$GIT_REPO_URL")")
PROJECT_ID=$(curl -s --header "PRIVATE-TOKEN: $GIT_TOKEN" \
  "https://lab.ssafy.com/api/v4/projects?search=$REPO_NAME" | jq -r ".[] | select(.path==\"$REPO_NAME\") | .id")

if [[ -z "$PROJECT_ID" ]]; then
  echo "❌ GitLab Project ID 조회 실패"
  exit 1
fi

# ---------------------------
# Webhook 등록
# ---------------------------
HOOK_URL="$JENKINS_URL/gitlab-webhook/"

curl -s -o /dev/null -w "%{http_code}" -X POST "https://lab.ssafy.com/api/v4/projects/$PROJECT_ID/hooks" \
  --header "PRIVATE-TOKEN: $GIT_TOKEN" \
  --data "url=$HOOK_URL" \
  --data "push_events=true" \
  --secret ""
#  --data "token=$WEBHOOK_SECRET"

echo "✅ GitLab Webhook 등록 완료"
echo "➡️  Secret: $WEBHOOK_SECRET"
