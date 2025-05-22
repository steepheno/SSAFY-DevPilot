#!/bin/bash

# ========================================================
# jenkins_installation.sh
# 오브젝트 기반 Jenkins 설치/제거 관리 (최신 개선 버전)
# ========================================================

# 젠킨스 설치 여부 확인
check_jenkins_installed() {
  log "----check_jenkins_installed 시작"
  log "[Jenkins] 설치 여부 확인 중..."

  if ssh_exec "[ -f ${SERVER[config_dir]}/jenkins_installed ]"; then
    log "[Jenkins] 이미 설치되어 있음."
    return 0
  else
    log "[Jenkins] 설치되어 있지 않음."
    return 1
  fi
}

check_service_status() {
  log "----check_service_status 시작"
  local service_name="$1"
  local status

  status=$(ssh_exec "systemctl is-active jenkins")

  if [[ "$status" == "active" ]]; then
    return 0
  else
    return 1
  fi
}

# 기존 Jenkins, Java 제거
remove_existing_installations() {
  log "----remove_existing_installations 시작"
  log "[Jenkins] 기존 설치 제거 중..."

  local OS
  OS=$(detect_os)

  if [[ "$OS" == "ubuntu" || "$OS" == "debian" ]]; then
    ssh_exec "sudo apt-get remove --purge -y jenkins java-* openjdk-* default-jdk && sudo apt-get autoremove -y && sudo apt-get clean"

  elif [[ "$OS" == "rhel" || "$OS" == "centos" || "$OS" == "fedora" || "$OS" == "amzn" ]]; then
    local PKG_MGR
    PKG_MGR=$(ssh_exec "command -v dnf || command -v yum")
    ssh_exec "sudo \$($PKG_MGR) remove -y jenkins java-* && sudo \$($PKG_MGR) clean all"

  else
    error_exit "[Jenkins] 지원되지 않는 OS: $OS"
  fi

  log "[Jenkins] 제거 완료."
}

# 자바 및 젠킨스 설치
install_java_jenkins() {
  log "----install_java_jenkins 시작"
  log "[Jenkins] Java + Jenkins 설치 중..."
  local JAVA_VERSION="17"
  local OS
  OS=$(detect_os)

  ensure_directory "${SERVER[config_dir]}"

  if [[ "$OS" == "ubuntu" || "$OS" == "debian" ]]; then
    ssh_exec "sudo apt-get update -y && \
      sudo apt-get install -y openjdk-${JAVA_VERSION}-jdk curl gnupg && \
      curl -fsSL https://pkg.jenkins.io/debian/jenkins.io-2023.key | sudo tee /usr/share/keyrings/jenkins-keyring.asc > /dev/null && \
      echo 'deb [signed-by=/usr/share/keyrings/jenkins-keyring.asc] https://pkg.jenkins.io/debian-stable binary/' | sudo tee /etc/apt/sources.list.d/jenkins.list > /dev/null && \
      sudo apt-get update -y && \
      sudo DEBIAN_FRONTEND=noninteractive apt-get install -y -V jenkins"

  elif [[ "$OS" == "rhel" || "$OS" == "centos" || "$OS" == "fedora" || "$OS" == "amzn" ]]; then
    local PKG_MGR
    PKG_MGR=$(ssh_exec "command -v dnf || command -v yum")
    ssh_exec "sudo \$($PKG_MGR) update -y && \
      sudo \$($PKG_MGR) install -y java-${JAVA_VERSION}-openjdk wget && \
      sudo wget -O /etc/yum.repos.d/jenkins.repo https://pkg.jenkins.io/redhat-stable/jenkins.repo && \
      sudo rpm --import https://pkg.jenkins.io/redhat-stable/jenkins.io.key && \
      sudo \$($PKG_MGR) install -y jenkins"

  else
    error_exit "[Jenkins] 지원되지 않는 OS: $OS"
  fi

  # Systemd 포트 설정 적용
    ssh_exec "sudo mkdir -p /etc/systemd/system/jenkins.service.d"
#    ssh_exec "echo '[Service]' | sudo tee /etc/systemd/system/jenkins.service.d/override.conf > /dev/null"
#    ssh_exec "echo 'ExecStart=' | sudo tee -a /etc/systemd/system/jenkins.service.d/override.conf > /dev/null"
    ssh_exec "sudo bash -c \"cat > /etc/systemd/system/jenkins.service.d/override.conf <<EOF
    [Service]
    ExecStart=
    ExecStart=/usr/bin/java -Djava.net.preferIPv4Stack=true -Djava.awt.headless=true -jar /usr/share/java/jenkins.war --webroot=/var/cache/jenkins/war --httpPort=${SERVER[jenkins_port]} --httpListenAddress=0.0.0.0
    EOF\""

    ssh_exec "sudo systemctl daemon-reexec"
    ssh_exec "sudo systemctl daemon-reload"

    # Jenkins 시작 및 상태 확인
    ssh_exec "sudo systemctl enable jenkins && sudo systemctl start jenkins && echo 'installed' | sudo tee ${SERVER[config_dir]}/jenkins_installed"

  if ! check_service_status jenkins; then
    error_exit "[Jenkins] 서비스가 시작되지 않았습니다."
  fi

  wait_for_jenkins
  log "[Jenkins] 설치 완료."
}

# Docker 및 Docker Compose 설치
install_docker() {
  log "----install_docker 시작"
  log "[Docker] Docker 및 Docker Compose 설치 중..."

  ssh_exec "curl -fsSL https://get.docker.com -o get-docker.sh && sudo sh get-docker.sh"

  # Docker Compose 설치 (v2 기준, compose-plugin 방식)
  ssh_exec "sudo apt-get install -y docker-compose-plugin"

  # Docker 그룹에 jenkins 유저 추가 (필요 시)
  ssh_exec "sudo usermod -aG docker jenkins"

  # 서비스 활성화 및 확인
  ssh_exec "sudo systemctl enable docker && sudo systemctl start docker"

  if ! ssh_exec "sudo docker --version"; then
    error_exit "[Docker] 설치가 실패했거나 docker 명령어가 작동하지 않습니다."
  fi

  if ! ssh_exec "sudo docker compose version"; then
    log "[Docker] compose-plugin이 아닌 별도 바이너리 설치를 시도합니다..."
    ssh_exec "DOCKER_COMPOSE_VERSION=2.27.0 && \
      sudo curl -L \"https://github.com/docker/compose/releases/download/v\$DOCKER_COMPOSE_VERSION/docker-compose-\$(uname -s)-\$(uname -m)\" -o /usr/local/bin/docker-compose && \
      sudo chmod +x /usr/local/bin/docker-compose && \
      sudo ln -s /usr/local/bin/docker-compose /usr/bin/docker-compose"
  fi

  log "[Docker] 설치 및 설정 완료!"
}
