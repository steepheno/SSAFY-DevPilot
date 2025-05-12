#!/bin/bash

# ========================================================
# 메인 오브젝트 초기화 및 설치 스크립트 (main.sh)
# 오브젝트 기반 구조 (Spring Boot 변수 주입 대응)
# ========================================================

# 스크립트 경로
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# 스크립트 로드
source "$SCRIPT_DIR/utils.sh"
source "$SCRIPT_DIR/ssh_connection.sh"
source "$SCRIPT_DIR/jenkins_installation.sh"
source "$SCRIPT_DIR/jenkins_configuration.sh"
source "$SCRIPT_DIR/jenkins_pipeline.sh"
source "$SCRIPT_DIR/docker_helper.sh"

# ========================================================
# 오브젝트 선언
# ========================================================
declare -A SERVER=(
  [pem_path]=""
  [host]=""
  [jenkins_port]="7070"
  [config_dir]="/opt/jenkins_config"
)

# ========================================================
# 인자 파싱 (Spring Boot에서 넘겨주는 값)
# ========================================================
for arg in "$@"; do
  case $arg in
    --pem-path=*)
      SERVER[pem_path]="${arg#*=}"
      ;;
    --ec2-host=*)
      SERVER[host]="${arg#*=}"
      ;;
    --jenkins-port=*)
      SERVER[jenkins_port]="${arg#*=}"
      ;;
    --jenkins-password=*)
      export JENKINS_PASSWORD="${arg#*=}"
      ;;
    --config-dir=*)
      SERVER[config_dir]="${arg#*=}"
      ;;
    *)
      echo "알 수 없는 옵션: $arg"
      ;;
  esac
  shift
done

# ========================================================
# 유틸리티 함수 로드
# ========================================================

log() {
  echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1"
}

error_exit() {
  log "오류: $1"
  exit 1
}

validate_server_info() {
  log "----validate_server_info 시작"
  if [[ -z "${SERVER[pem_path]}" || -z "${SERVER[host]}" ]]; then
    error_exit "PEM 파일 경로와 EC2 호스트 주소가 필요합니다."
  fi
  if [[ ! -f "${SERVER[pem_path]}" ]]; then
    error_exit "PEM 키 파일이 존재하지 않습니다: ${SERVER[pem_path]}"
  fi
  chmod 400 "${SERVER[pem_path]}"
  log "PEM 파일 권한을 400으로 설정했습니다."
}

ensure_uuidgen_installed() {
  log "[필수 도구] uuidgen 설치 여부 확인 중..."

  if ! ssh_exec "command -v uuidgen >/dev/null 2>&1"; then
    log "[필수 도구] uuidgen이 설치되어 있지 않음. 설치 진행..."
    ssh_exec "sudo apt-get update -y && sudo apt-get install -y uuid-runtime"
  else
    log "[필수 도구] uuidgen이 이미 설치되어 있음."
  fi
}


# ========================================================
# 메인 설치 프로세스
# ========================================================

main() {
  log "[메인] Jenkins 설치 자동화 시작"
  log "jenkins port: ${SERVER[jenkins_port]}"

  validate_server_info
  connect_ssh_server

  ensure_uuidgen_installed

#  if check_jenkins_installed; then
  remove_existing_installations
#  fi
  install_java_jenkins

  if ! ssh_exec "docker --version > /dev/null 2>&1"; then
    log "[Docker] 설치되어 있지 않음. 설치를 시작합니다..."
    install_docker
  else
    log "[Docker] 이미 설치되어 있음. 설치 건너뜀."
  fi

  install_jenkins_plugins

  configure_jenkins_user
  setup_security_options

  upload_file "$SCRIPT_DIR/setup_jenkins_system_config.groovy" "/tmp/setup_jenkins_system_config.groovy"
  ssh_exec "java -jar /tmp/jenkins-cli.jar -s http://localhost:${SERVER[jenkins_port]} -auth admin:$JENKINS_PASSWORD groovy = < /tmp/setup_jenkins_system_config.groovy"

  log "[메인] Jenkins 설치 및 설정 완료!"
  log "URL: https://${SERVER[host]}:${SERVER[jenkins_port]}"
}

main
exit 0
