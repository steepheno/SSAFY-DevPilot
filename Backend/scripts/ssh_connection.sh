#!/bin/bash

# ========================================================
# ssh_connection.sh
# 오브젝트 기반 SSH 연결 및 파일 송수신 헬퍼
# ========================================================

# SSH 연결 검증
connect_ssh_server() {
  log "SSH 연결 테스트 중..."

  if ! ssh -i "${SERVER[pem_path]}" -o StrictHostKeyChecking=no -o ConnectTimeout=10 "${SERVER[host]}" "echo 연결 성공" > /dev/null 2>&1; then
    error_exit "SSH 연결 실패: PEM 키 또는 EC2 호스트를 확인해주세요."
  fi

  log "SSH 연결 성공!"
}

# SSH 명령어 실행 (Wrapper)
ssh_exec() {
  local command="$1"
  ssh -i "${SERVER[pem_path]}" "${SERVER[host]}" "$command"
}

# 원격 스크립트 실행
run_remote_script() {
  local local_script="$1"
  if ! ssh -i "${SERVER[pem_path]}" "${SERVER[host]}" "bash -s" < "$local_script"; then
    return 1
  fi
}

# 파일 업로드 (로컬 → 리모트)
upload_file() {
  local local_path="$1"
  local remote_path="$2"

  if ! scp -i "${SERVER[pem_path]}" "$local_path" "${SERVER[host]}:$remote_path"; then
    return 1
  fi
}

# 파일 다운로드 (리모트 → 로컬)
download_file() {
  local remote_path="$1"
  local local_path="$2"

  if ! scp -i "${SERVER[pem_path]}" "${SERVER[host]}:$remote_path" "$local_path"; then
    return 1
  fi
}

# 원격 명령어 결과 가져오기
get_remote_output() {
  local command="$1"
  ssh -i "${SERVER[pem_path]}" "${SERVER[host]}" "$command"
}

# 원격 파일 내용 읽기
get_file_content() {
  local file_path="$1"
  ssh -i "${SERVER[pem_path]}" "${SERVER[host]}" "cat $file_path 2>/dev/null"
}

# PEM 파일 핑거프린트 확인
check_ssh_fingerprint() {
  if ! ssh-keygen -lf "${SERVER[pem_path]}" > /dev/null 2>&1; then
    log "경고: PEM 키 핑거프린트 확인 실패."
    return 1
  fi
}
