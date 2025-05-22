#!/bin/bash

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Github 파이프라인 등록 스크립트
source "$SCRIPT_DIR/utils.sh"
source "$SCRIPT_DIR/ssh_connection.sh"
source "$SCRIPT_DIR/jenkins_configuration.sh"

# ========================================================
# 오브젝트 선언
# ========================================================
declare -A SERVER=(
  [pem_path]=""
  [host]=""
  [jenkins_port]="7070"
  [config_dir]="/opt/jenkins_config"
)

# 인자 파싱
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

# SSH 접속
connect_ssh_server

export JENKINS_PASSWORD

# 1. GitHub 자격 증명 등록
register_git_credentials "github" "$GIT_TOKEN" "$GIT_CREDENTIALS_ID"

# 2. Jenkins 멀티브랜치 Job XML 생성 및 등록
generate_job_config "$GIT_REPO_URL" "$GIT_CREDENTIALS_ID" "gitlab" "$JENKINS_JOB_NAME"
create_job_in_jenkins "$JENKINS_JOB_NAME"
