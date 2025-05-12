#!/bin/bash

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_PATH="$HOME/.devpilot/.env"

if [[ -f "$ENV_PATH" ]]; then
  source "$ENV_PATH"
else
  echo "❌ 환경 파일이 존재하지 않습니다: $ENV_PATH"
  exit 1
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
  "https://gitlab.com/api/v4/projects?search=$REPO_NAME" | jq -r ".[] | select(.path==\"$REPO_NAME\") | .id")

if [[ -z "$PROJECT_ID" ]]; then
  echo "❌ GitLab Project ID 조회 실패"
  exit 1
fi

# ---------------------------
# Webhook 등록
# ---------------------------
HOOK_URL="$JENKINS_URL/gitlab-webhook/"

curl -s -o /dev/null -w "%{http_code}" -X POST "https://gitlab.com/api/v4/projects/$PROJECT_ID/hooks" \
  --header "PRIVATE-TOKEN: $GIT_TOKEN" \
  --data "url=$HOOK_URL" \
  --data "push_events=true" \
#  --data "token=$WEBHOOK_SECRET"

echo "✅ GitLab Webhook 등록 완료"
echo "➡️  Secret: $WEBHOOK_SECRET"
