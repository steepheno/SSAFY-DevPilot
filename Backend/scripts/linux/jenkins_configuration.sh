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
    "bootstrap5-api:5.3.3-2"
    "gitlab-plugin:1.9.8"
    "docker-api:3.5.0-108.v211cdd21c383"
    "docker-compose-build-step:1.0"
    "docker-workflow:611.v16e84da_6d3ff"
    "docker-plugin:1274.vc0203fdf2e74"
    "gitlab-api:5.6.0-100.v83f8f4b_f1129"
    "gitlab-oauth:1.22"
    "gitlab-branch-source:718.v40b_5f0e67cd3"
    "multibranch-scan-webhook-trigger:1.0.11"
    "workflow-aggregator:608.v67378e9d3db_1"
    "workflow-multibranch:806.vb_b_688f609ee9"
    "credentials:1254.vb_a_60f3e5df75"
    "plain-credentials:143.v1b_df8b_d3b_e48"
    "credentials-binding:657.v2b_19db_7d6e6d"
    "sse-gateway:1.28"
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

  if [ -z "$JENKINS_PASSWORD" ]; then
    error_exit "[Jenkins] --jenkins-password 인자가 필요합니다."
  fi

  # 1. 초기 비밀번호 가져오기
  local initial_pw
  initial_pw=$(ssh_exec "sudo cat /var/lib/jenkins/secrets/initialAdminPassword")
  if [ -z "$initial_pw" ]; then
    error_exit "[Jenkins] 초기 비밀번호를 가져올 수 없습니다."
  fi

  # 2. Jenkins CLI 다운로드
  local cli_jar="/tmp/jenkins-cli.jar"
  ssh_exec "wget -q -O $cli_jar http://localhost:${SERVER[jenkins_port]}/jnlpJars/jenkins-cli.jar"

  # 3. 비밀번호 변경용 Groovy 작성
  cat <<EOF > /tmp/change_password.groovy
import jenkins.model.*
import hudson.security.*

def instance = Jenkins.get()
def user = instance.getSecurityRealm().getUser("admin")
user.addProperty(hudson.security.HudsonPrivateSecurityRealm.Details.fromPlainPassword("$JENKINS_PASSWORD"))
instance.save()
println("✅ 비밀번호 변경 완료")
EOF

  upload_file "/tmp/change_password.groovy" "/tmp/change_password.groovy"

  # 4. 초기 비밀번호로 Groovy 실행 (비밀번호 변경)
  ssh_exec "java -jar $cli_jar -s http://localhost:${SERVER[jenkins_port]} -auth admin:$initial_pw groovy = < /tmp/change_password.groovy"

  # 5. 새로운 비밀번호 저장
  ssh_exec "echo '$JENKINS_PASSWORD' | sudo tee ${SERVER[config_dir]}/jenkins_user > /dev/null && sudo chmod 600 ${SERVER[config_dir]}/jenkins_user"
  log "[Jenkins] 사용자 비밀번호 설정 완료."

  # 6. 변경된 비밀번호로 인증 테스트
  if ssh_exec "java -jar $cli_jar -s http://localhost:${SERVER[jenkins_port]} -auth admin:$JENKINS_PASSWORD who-am-i"; then
    log "[Jenkins] 변경된 비밀번호로 CLI 접속 성공 (검증 완료)"
  else
    error_exit "[Jenkins] 비밀번호 변경 후 검증 실패: $JENKINS_PASSWORD"
  fi
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

register_git_credentials() {
  local provider="$1"
  local token="$2"
  local cred_id="$3"

  cat <<EOF > "/tmp/${cred_id}.xml"
<com.cloudbees.plugins.credentials.impl.StringCredentialsImpl>
  <scope>GLOBAL</scope>
  <id>${cred_id}</id>
  <description>${provider} token</description>
  <secret>${token}</secret>
</com.cloudbees.plugins.credentials.impl.StringCredentialsImpl>
EOF

  ssh_exec "wget -q -O /tmp/jenkins-cli.jar http://localhost:${SERVER[jenkins_port]}/jnlpJars/jenkins-cli.jar"

  ssh_exec "cat > /tmp/${cred_id}.xml" < "/tmp/${cred_id}.xml"

  ssh_exec "java -jar /tmp/jenkins-cli.jar -s http://localhost:${SERVER[jenkins_port]} -auth admin:$JENKINS_PASSWORD create-credentials-by-xml system::system::jenkins _ < /tmp/${cred_id}.xml"

  log "[${provider}] 자격 증명 등록 완료: ${cred_id}"
}

generate_job_config() {
  local repo_url="$1"
  local cred_id="$2"
  local provider="$3"
  local project_name="$4"

  cat <<EOF > /tmp/${project_name}-job.xml
<?xml version='1.1' encoding='UTF-8'?>
<org.jenkinsci.plugins.workflow.multibranch.WorkflowMultiBranchProject plugin="workflow-multibranch@2.26">
  <description>${project_name} 멀티브랜치 파이프라인</description>
  <displayName>${project_name}</displayName>
  <sources class="jenkins.branch.MultiBranchProject\$BranchSourceList" plugin="branch-api@2.1046.v0ca_37783ecc5">
    <data>
      <jenkins.branch.BranchSource>
        <source class="$(
          if [[ "$provider" == "gitlab" ]]; then
            echo "io.jenkins.plugins.gitlabbranchsource.GitLabSCMSource"
          elif [[ "$provider" == "github" ]]; then
            echo "org.jenkinsci.plugins.github_branch_source.GitHubSCMSource"
          fi
        )" plugin="$(
          if [[ "$provider" == "gitlab" ]]; then
            echo "gitlab-branch-source@718.v40b_5f0e67cd3"
          elif [[ "$provider" == "github" ]]; then
            echo "github-branch-source@1742.va_95fca_e5a_89c"
          fi
        )">
          <id>$(uuidgen)</id>
          <credentialsId>${cred_id}</credentialsId>
          <repoOwner>$(basename "$(dirname "$repo_url")")</repoOwner>
          <repository>$(basename "$repo_url" .git)</repository>
          <serverUrl>$(
            if [[ "$provider" == "gitlab" ]]; then
              echo "https://gitlab.com"
            elif [[ "$provider" == "github" ]]; then
              echo "https://github.com"
            fi
          )</serverUrl>
        </source>
        <strategy class="jenkins.branch.DefaultBranchPropertyStrategy">
          <properties class="empty-list"/>
        </strategy>
      </jenkins.branch.BranchSource>
    </data>
    <owner class="org.jenkinsci.plugins.workflow.multibranch.WorkflowMultiBranchProject" reference="../../.."/>
  </sources>
  <factory class="org.jenkinsci.plugins.workflow.multibranch.WorkflowBranchProjectFactory">
    <owner class="org.jenkinsci.plugins.workflow.multibranch.WorkflowMultiBranchProject" reference="../.."/>
    <scriptPath>Jenkinsfile</scriptPath>
  </factory>
</org.jenkinsci.plugins.workflow.multibranch.WorkflowMultiBranchProject>
EOF
}

create_job_in_jenkins() {
  local job_name="$1"
  local job_dir="/home/ubuntu/$job_name"
  local config_xml="$job_dir/${job_name}-job.xml"

  # ✅ EC2 내부 파일로 바로 Jenkins job 생성
  ssh_exec "java -jar /tmp/jenkins-cli.jar \
    -s http://localhost:${SERVER[jenkins_port]} \
    -auth admin:$JENKINS_PASSWORD \
    create-job '$job_name' < $config_xml"

  log "[${job_name}] Job 생성 완료"
}
