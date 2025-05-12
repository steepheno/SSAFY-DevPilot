#!/bin/bash

# ========================================================
# jenkins_pipeline.sh
# 오브젝트 기반 Jenkins 파이프라인 EC2 업로드 및 등록 (Spring Boot 연동 전용)
# ========================================================

# Jenkins 파이프라인 생성 (Groovy 파일 EC2로 업로드 후 등록)
create_jenkins_pipeline() {
  local local_groovy_path="$1"  # 로컬 Groovy 파일 경로
  local pipeline_name="$2"      # 생성할 파이프라인 이름

  log "[Jenkins] 파이프라인 생성 준비 중: $pipeline_name"

  local password="$JENKINS_PASSWORD"

  # (1) Groovy 파일을 EC2로 업로드
  upload_file "$local_groovy_path" "/tmp/${pipeline_name}_create_pipeline.groovy"

  # (2) Jenkins CLI를 사용해 파이프라인 등록
  ssh_exec "java -jar jenkins-cli.jar -s http://localhost:${SERVER[jenkins_port]} -auth admin:$password groovy = < /tmp/${pipeline_name}_create_pipeline.groovy"

  # (3) (선택) 업로드한 Groovy 파일 삭제
  ssh_exec "rm -f /tmp/${pipeline_name}_create_pipeline.groovy"

  log "[Jenkins] 파이프라인 생성 완료: $pipeline_name"
}

# EC2 내부에서 Jenkinsfile 경로 기준으로 Job XML을 생성
generate_pipeline_job_config() {
  local job_name="$1"
  local remote_dir="$2"
  local jenkinsfile_path="$3"

  local remote_job_path="${remote_dir}/${job_name}-job.xml"

  ssh_exec "pipeline_script=\$(cat $jenkinsfile_path) && \
    cat <<EOF > $remote_job_path
<?xml version='1.1' encoding='UTF-8'?>
<flow-definition plugin=\"workflow-job@2.40\">
  <description>${job_name} 파이프라인</description>
  <keepDependencies>false</keepDependencies>
  <definition class=\"org.jenkinsci.plugins.workflow.cps.CpsFlowDefinition\" plugin=\"workflow-cps@2.94\">
    <script><![CDATA[\$pipeline_script]]></script>
    <sandbox>true</sandbox>
  </definition>
  <triggers/>
  <disabled>false</disabled>
</flow-definition>
EOF
"
}

# Jenkins 파이프라인 실행
run_jenkins_pipeline() {
  local pipeline_name="$1"
  log "[Jenkins] 파이프라인 실행: $pipeline_name"

  local password="$JENKINS_PASSWORD"

  ssh_exec "curl -X POST http://localhost:${SERVER[jenkins_port]}/job/${pipeline_name}/build --user admin:$password"
}

# Jenkins 빌드 상태 확인
check_build_status() {
  local pipeline_name="$1"
  local build_number="${2:-lastBuild}"

  log "[Jenkins] 빌드 상태 확인: ${pipeline_name} #${build_number}"

  local password="$JENKINS_PASSWORD"

  ssh_exec "curl -s http://localhost:${SERVER[jenkins_port]}/job/${pipeline_name}/${build_number}/api/json --user admin:$password | grep 'result'"
}

# Jenkins 파이프라인 목록 조회
list_jenkins_pipelines() {
  log "[Jenkins] 파이프라인 목록 조회"

  local password="$JENKINS_PASSWORD"

  ssh_exec "curl -s http://localhost:${SERVER[jenkins_port]}/api/json?tree=jobs[name] --user admin:$password | grep 'name'"
}
