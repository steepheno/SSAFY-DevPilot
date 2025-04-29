#!/bin/bash

# ========================================================
# docker_helper.sh
# 오브젝트 기반 Docker 설치 및 관리 (최신 개선 버전)
# ========================================================

# EC2에 Docker 설치
install_docker() {
  log "[Docker] EC2에 Docker 설치 중..."

  local OS
  OS=$(detect_os)

  if [[ "$OS" == "ubuntu" || "$OS" == "debian" ]]; then
    ssh_exec "sudo apt-get remove -y docker docker-engine docker.io containerd runc || true"
    ssh_exec "sudo apt-get update -y"
    ssh_exec "sudo apt-get install -y apt-transport-https ca-certificates curl gnupg lsb-release"
    ssh_exec "curl -fsSL https://download.docker.com/linux/$OS/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg"
    ssh_exec "echo \"deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/$OS \$(lsb_release -cs) stable\" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null"
    ssh_exec "sudo apt-get update -y && sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin"

  elif [[ "$OS" == "rhel" || "$OS" == "centos" || "$OS" == "fedora" || "$OS" == "amzn" ]]; then
    ssh_exec "sudo yum remove -y docker docker-client docker-client-latest docker-common docker-latest docker-latest-logrotate docker-logrotate docker-engine || true"
    local PKG_MGR
    PKG_MGR=$(ssh_exec "command -v dnf || command -v yum")
    ssh_exec "sudo \$($PKG_MGR) update -y"
    ssh_exec "sudo \$($PKG_MGR) install -y yum-utils"
    ssh_exec "sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo"
    ssh_exec "sudo \$($PKG_MGR) install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin"

  else
    error_exit "[Docker] 지원되지 않는 운영체제: $OS"
  fi

  ssh_exec "sudo systemctl enable docker && sudo systemctl start docker"
  log "[Docker] Docker 설치 및 서비스 시작 완료."
}

# Docker Compose 설치 (구버전 standalone 설치 방식 - 필요 시)
install_docker_compose() {
  log "[Docker] Standalone Docker Compose 설치 중..."

  local compose_version
  compose_version=$(ssh_exec "curl -s https://api.github.com/repos/docker/compose/releases/latest | grep 'tag_name' | cut -d'\"' -f4")

  ssh_exec "sudo curl -L \"https://github.com/docker/compose/releases/download/${compose_version}/docker-compose-\$(uname -s)-\$(uname -m)\" -o /usr/local/bin/docker-compose"
  ssh_exec "sudo chmod +x /usr/local/bin/docker-compose"

  log "[Docker] Docker Compose (standalone) ${compose_version} 설치 완료."
}

# Docker 버전 확인
check_docker_version() {
  log "[Docker] Docker 버전 확인 중..."
  ssh_exec "docker --version"
}

# Docker Compose 버전 확인
check_docker_compose_version() {
  log "[Docker] Docker Compose 버전 확인 중..."
  if ! ssh_exec "docker compose version"; then
    log "[Docker] Compose v2 플러그인이 설치되지 않은 것 같습니다. standalone 버전 확인 시도합니다."
    ssh_exec "docker-compose --version"
  fi
}

# Docker 레지스트리 로그인
docker_registry_login() {
  local registry="$1"
  local username="$2"

  log "[Docker] 레지스트리 로그인 중: $registry"

  read -s -p "도커 레지스트리 비밀번호 입력: " docker_password
  echo ""

  if ssh_exec "echo '$docker_password' | docker login $registry -u $username --password-stdin"; then
    log "[Docker] 레지스트리 로그인 성공."
  else
    error_exit "[Docker] 레지스트리 로그인 실패."
  fi
}
