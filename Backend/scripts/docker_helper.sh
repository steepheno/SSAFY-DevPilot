#!/bin/bash

# ========================================================
# jenkins_pipeline.sh
# 오브젝트 기반 Jenkins 파이프라인 EC2 업로드 및 등록 (Spring Boot 연동 전용)
# ========================================================

# Jenkins 파이프라인 생성 (Groovy 스크립트 파일을 EC2로 업로드 후 실행)
create_jenkins_pipeline() {
  local local_groovy_path="$1" # 로컬 Groovy 파일 경로
  local pipeline_name="$2"     # 생성할 파이프라인 이름

  log "[Jenkins] 파이프라인 생성 준비 중: $pipeline_name"

  local password="$JENKINS_PASSWORD"

  # Groovy 파일을 EC2 /tmp 디렉토리에 업로드
  upload_file "$local_groovy_path" "/tmp/${pipeline_name}_create_pipeline.groovy"

  # 업로드된 Groovy 스크립트를 이용해 Jenkins에 파이프라인 생성
  ssh_exec "java -jar jenkins-cli.jar -s http://localhost:${SERVER[jenkins_port]} -auth admin:$password groovy = < /tmp/${pipeline_name}_create_pipeline.groovy"

  # (선택) 사용 후 Groovy 파일 삭제
  ssh_exec "rm -f /tmp/${pipeline_name}_create_pipeline.groovy"

  log "[Jenkins] 파이프라인 생성 완료: $pipeline_name"
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

# Docker 레지스트리 로그인
# registry, username, password는 모두 인자로 전달
# ex) docker_registry_login "docker.io" "myuser" "mypassword"
docker_registry_login() {
  local registry="$1"
  local username="$2"
  local password="$3"

  log "[Docker] 레지스트리 로그인 중: $registry"

  if ssh_exec "echo '$password' | docker login $registry -u $username --password-stdin"; then
    log "[Docker] 레지스트리 로그인 성공."
  else
    error_exit "[Docker] 레지스트리 로그인 실패."
  fi
}