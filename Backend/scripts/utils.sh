#!/bin/bash

# ========================================================
# utils.sh
# 오브젝트 기반 공통 유틸리티 함수 모음
# ========================================================

# 공통 로깅 함수
log() {
  echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1"
}

# 공통 에러 처리 함수
error_exit() {
  log "오류: $1"
  exit 1
}

# 운영체제 확인 함수 (서버 오브젝트 필요)
detect_os() {
  local pem="${SERVER[pem_path]}"
  local host="${SERVER[host]}"

  ssh -i "$pem" "$host" "
    if [ -f /etc/os-release ]; then
      . /etc/os-release
      echo \$ID
    elif [ -f /etc/redhat-release ]; then
      echo 'rhel'
    elif [ -f /etc/debian_version ]; then
      echo 'debian'
    else
      echo 'unknown'
    fi
  "
}

# 명령어 성공 여부 확인
check_command_status() {
  if [ $? -ne 0 ]; then
    error_exit "$1"
  fi
}

# 특정 서비스가 활성화되어 있는지 확인
check_service_status() {
  local service=$1
  ssh -i "${SERVER[pem_path]}" "${SERVER[host]}" "
    systemctl is-active $service > /dev/null 2>&1
  "

  if [ $? -eq 0 ]; then
    log "$service 서비스가 실행 중입니다."
    return 0
  else
    log "$service 서비스가 실행 중이 아닙니다."
    return 1
  fi
}

# 디렉토리 존재 확인 및 없으면 생성
ensure_directory() {
  local dir=$1
  ssh -i "${SERVER[pem_path]}" "${SERVER[host]}" "
    if [ ! -d '$dir' ]; then
      sudo mkdir -p '$dir'
    fi
  "
}

# 파일 존재 확인
check_file_exists() {
  local file=$1
  ssh -i "${SERVER[pem_path]}" "${SERVER[host]}" "[ -f $file ]"
  return $?
}

# 대기 함수 (지정 시간만큼 대기)
wait_for() {
  local seconds=$1
  local message=$2

  log "$message"
  sleep $seconds
}

# 포트 오픈 여부 확인
check_port_open() {
  local port=$1
  ssh -i "${SERVER[pem_path]}" "${SERVER[host]}" "
    timeout 2 bash -c 'cat < /dev/null > /dev/tcp/localhost/$port'
  "

  if [ $? -eq 0 ]; then
    log "포트 $port가 열려 있습니다."
    return 0
  else
    log "포트 $port가 닫혀 있습니다."
    return 1
  fi
}

# 젠킨스 서비스가 시작될 때까지 대기
wait_for_jenkins() {
  local timeout=60
  local counter=0

  log "젠킨스 서비스 시작 대기 중..."

  while [ $counter -lt $timeout ]; do
    check_port_open "${SERVER[jenkins_port]}"

    if [ $? -eq 0 ]; then
      log "젠킨스 서비스가 정상적으로 시작되었습니다."
      return 0
    fi

    counter=$((counter + 1))
    sleep 1
  done

  error_exit "젠킨스 서비스가 시간 내에 시작되지 않았습니다."
}
