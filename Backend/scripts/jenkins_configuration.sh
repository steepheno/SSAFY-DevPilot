#!/bin/bash

# ========================================================
# jenkins_configuration.sh
# 오브젝트 기반 Jenkins 설정 및 사용자 구성 (자동화 버전)
# ========================================================

# Jenkins 플러그인 설치 (CLI 방식)
install_jenkins_plugins() {
  log "[Jenkins] 플러그인 설치 시작..."
  wait_for_jenkins

  local initial_pw
  initial_pw=$(ssh_exec "sudo cat /var/lib/jenkins/secrets/initialAdminPassword")
  if [ -z "$initial_pw" ]; then
    error_exit "[Jenkins] 초기 관리자 비밀번호를 가져올 수 없습니다."
  fi

  local cli_jar="/tmp/jenkins-cli.jar"
  ssh_exec "wget http://localhost:${SERVER[jenkins_port]}/jnlpJars/jenkins-cli.jar -O $cli_jar"

  local plugins=(
    # 필요한 플러그인 리스트를 여기에 추가
  )

  for plugin in "${plugins[@]}"; do
    log "[Jenkins] 플러그인 설치 중: $plugin"
    ssh_exec "java -jar $cli_jar -s http://localhost:${SERVER[jenkins_port]} -auth admin:$initial_pw install-plugin $plugin"
  done

  ssh_exec "sudo systemctl restart jenkins"
  wait_for_jenkins
  log "[Jenkins] 플러그인 설치 완료."
}

# Jenkins 사용자 구성 (CLI로 비밀번호 변경)
configure_jenkins_user() {
  log "[Jenkins] 사용자 설정 중..."

  if ssh_exec "[ -f ${SERVER[config_dir]}/jenkins_user ]"; then
    export JENKINS_PASSWORD=$(ssh_exec "cat ${SERVER[config_dir]}/jenkins_user")
    log "[Jenkins] 기존 사용자 비밀번호 사용."
    return
  fi

  if [ -z "$JENKINS_PASSWORD" ]; then
    error_exit "[Jenkins] --jenkins-password 인자가 필요합니다."
  fi

  local initial_pw
  initial_pw=$(ssh_exec "sudo cat /var/lib/jenkins/secrets/initialAdminPassword")
  if [ -z "$initial_pw" ]; then
    error_exit "[Jenkins] 초기 비밀번호를 가져올 수 없습니다."
  fi

  local cli_jar="/tmp/jenkins-cli.jar"
  ssh_exec "wget -q -O $cli_jar http://localhost:${SERVER[jenkins_port]}/jnlpJars/jenkins-cli.jar"

  # 비밀번호 변경용 Groovy 스크립트 작성
  cat <<EOF > /tmp/change_password.groovy
import jenkins.model.*
import hudson.security.*

def instance = Jenkins.getInstance()
def user = instance.getSecurityRealm().getUser("admin")
user.addProperty(hudson.security.HudsonPrivateSecurityRealm.Details.fromPlainPassword("$JENKINS_PASSWORD"))
instance.save()
EOF

  upload_file "/tmp/change_password.groovy" "/tmp/change_password.groovy"
  ssh_exec "java -jar $cli_jar -s http://localhost:${SERVER[jenkins_port]} -auth admin:$initial_pw groovy = < /tmp/change_password.groovy"

  ssh_exec "echo '$JENKINS_PASSWORD' | sudo tee ${SERVER[config_dir]}/jenkins_user > /dev/null && sudo chmod 600 ${SERVER[config_dir]}/jenkins_user"
  log "[Jenkins] 사용자 비밀번호 설정 완료."
}

# Jenkins 보안 설정 (CLI로 설정)
setup_security_options() {
  log "[Jenkins] 보안 설정 구성 중..."

  if [ -z "$JENKINS_PASSWORD" ]; then
    error_exit "[Jenkins] --jenkins-password 인자가 필요합니다."
  fi

  local cli_jar="/tmp/jenkins-cli.jar"

  # 보안 설정용 Groovy 스크립트 작성
  cat <<'EOF' > /tmp/setup_security.groovy
import jenkins.model.*
import hudson.security.*

def instance = Jenkins.getInstance()

def strategy = new hudson.security.FullControlOnceLoggedInAuthorizationStrategy()
strategy.setAllowAnonymousRead(false)
instance.setAuthorizationStrategy(strategy)

instance.save()
EOF

  upload_file "/tmp/setup_security.groovy" "/tmp/setup_security.groovy"
  ssh_exec "java -jar $cli_jar -s http://localhost:${SERVER[jenkins_port]} -auth admin:$JENKINS_PASSWORD groovy = < /tmp/setup_security.groovy"

  log "[Jenkins] 보안 설정 완료."
}
