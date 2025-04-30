#!/bin/bash

# ========================================================
# jenkins_installation.sh
# 오브젝트 기반 Jenkins 설치/제거 관리 (최신 개선 버전)
# ========================================================

# 젠킨스 설치 여부 확인
check_jenkins_installed() {
  log "[Jenkins] 설치 여부 확인 중..."

  if ssh -i "${SERVER[pem_path]}" "${SERVER[host]}" "[ -f ${SERVER[config_dir]}/jenkins_installed ]"; then
    log "[Jenkins] 이미 설치되어 있음."
    return 0
  else
    log "[Jenkins] 설치되어 있지 않음."
    return 1
  fi
}

# 기존 Jenkins, Java 제거
remove_existing_installations() {
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
      sudo apt-get install -y jenkins"

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

  ssh_exec "sudo systemctl enable jenkins && sudo systemctl start jenkins && echo 'installed' | sudo tee ${SERVER[config_dir]}/jenkins_installed"

  if ! check_service_status jenkins; then
    error_exit "[Jenkins] 서비스가 시작되지 않았습니다."
  fi

  wait_for_jenkins
  log "[Jenkins] 설치 완료."
}
