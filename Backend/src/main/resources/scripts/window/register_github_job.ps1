# ========================================================
# register_github_pipeline.ps1
# PowerShell 기반 GitHub 파이프라인 등록 스크립트
# ========================================================

# 스크립트 경로
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

# 외부 스크립트 로드
. "$ScriptDir\utils.ps1"
. "$ScriptDir\ssh_connection.ps1"
. "$ScriptDir\jenkins_configuration.ps1"

# ========================================================
# 서버 오브젝트 초기화
# ========================================================
$Server = @{
    pem_path     = $env:PEM_PATH
    host         = $env:EC2_HOST
    jenkins_port = $env:JENKINS_PORT
    config_dir   = "/opt/jenkins_config"
}

# ========================================================
# 인자 파싱
# ========================================================
param (
[string]$git_token,
[string]$git_credentials_id,
[string]$git_repo_url,
[string]$jenkins_job_name
)

# SSH 접속
Connect-SSHServer

# Jenkins 비밀번호 설정
$env:JENKINS_PASSWORD = $env:JENKINS_PASSWORD

# 1. GitHub 자격 증명 등록
Register-GitCredentials -provider "github" -token $git_token -cred_id $git_credentials_id

# 2. Jenkins 멀티브랜치 Job XML 생성 및 등록
Generate-JobConfig -repo_url $git_repo_url -cred_id $git_credentials_id -provider "github" -project_name $jenkins_job_name
Create-JobInJenkins -job_name $jenkins_job_name
