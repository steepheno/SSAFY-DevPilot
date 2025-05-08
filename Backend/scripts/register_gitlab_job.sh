#!/bin/bash

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# GitLab 파이프라인 등록 스크립트
source "$SCRIPT_DIR/utils.sh"
source "$SCRIPT_DIR/ssh_connection.sh"
source "$SCRIPT_DIR/jenkins_configuration.sh"

# .env에서 환경 변수 로드
ENV_PATH="$HOME/.devpilot/.env"
# shellcheck source=$HOME/.devpilot/.env
if [[ -f "$ENV_PATH" ]]; then
  source "$ENV_PATH"
else
  echo "[오류] 환경 파일이 존재하지 않습니다: $ENV_PATH"
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

# ========================================================
# 남은 인자 파싱 (필요한 것만)
# ========================================================
for arg in "$@"; do
  case $arg in
    --git-token=*) GIT_TOKEN="${arg#*=}" ;;
    --git-credentials-id=*) GIT_CREDENTIALS_ID="${arg#*=}" ;;
    --git-repo-url=*) GIT_REPO_URL="${arg#*=}" ;;
    --jenkins-job-name=*) JENKINS_JOB_NAME="${arg#*=}" ;;
    * ) echo "알 수 없는 옵션: $arg" ;;
  esac
  shift
done

# 필수값 검증
: "${JENKINS_PASSWORD:?JENKINS_PASSWORD가 설정되어 있지 않습니다.}"
: "${GIT_TOKEN:?GIT_TOKEN이 필요합니다.}"
: "${GIT_CREDENTIALS_ID:?GIT_CREDENTIALS_ID가 필요합니다.}"
: "${GIT_REPO_URL:?GIT_REPO_URL이 필요합니다.}"
: "${JENKINS_JOB_NAME:?JENKINS_JOB_NAME이 필요합니다.}"

# SSH 접속
connect_ssh_server

# Jenkins CLI가 사용할 비밀번호 export
export JENKINS_PASSWORD

# uuidgen 필요 시 설치
ensure_uuidgen_installed

# 1. GitLab 자격 증명 등록
register_git_credentials "gitlab" "$GIT_TOKEN" "$GIT_CREDENTIALS_ID"

# 2. Jenkins 멀티브랜치 Job XML 생성 및 등록
generate_job_config "$GIT_REPO_URL" "$GIT_CREDENTIALS_ID" "gitlab" "$JENKINS_JOB_NAME"
create_job_in_jenkins "$JENKINS_JOB_NAME"
