# ========================================================
# register_gitlab_pipeline.ps1
# GitLab 기반 Jenkins 멀티브랜치 파이프라인 자동 등록 스크립트 (PowerShell)
# ========================================================
# ========================================================
# 인자 파싱
# ========================================================
param (
    [string]$git_token,
    [string]$git_credentials_id,
    [string]$git_repo_url,
    [string]$jenkins_job_name
)

# 스크립트 경로
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

# 외부 스크립트 로드
. "$ScriptDir\utils.ps1"
. "$ScriptDir\ssh_connection.ps1"
. "$ScriptDir\jenkins_configuration.ps1"
. "$ScriptDir\jenkins_pipeline.ps1"

# .env 파일 로드
$homeDir = [Environment]::GetFolderPath("UserProfile")
$envPath = "$homeDir\.devpilot\.env"
if (Test-Path $envPath) {
    Get-Content $envPath | ForEach-Object {
        if ($_ -match '^\s*([^#][^=]+)=(.+)$') {
            $key = $matches[1].Trim()
            $value = $matches[2].Trim()
            Set-Item -Path "Env:$key" -Value $value
        }
    }
    Write-Host "[환경 변수] .env 파일 로드 완료: $envPath"
} else {
    Write-Host "[오류] 환경 파일이 존재하지 않습니다: $envPath"
    exit 1
}

if (-not $env:JENKINS_PASSWORD) { throw "JENKINS_PASSWORD가 설정되어 있지 않습니다." }
if (-not $git_token) { throw "--git-token은 필수입니다." }
if (-not $git_credentials_id) { throw "--git-credentials-id는 필수입니다." }
if (-not $git_repo_url) { throw "--git-repo-url은 필수입니다." }
if (-not $jenkins_job_name) { throw "--jenkins-job-name은 필수입니다." }

# ========================================================
# 서버 설정 (환경 변수 기반 초기화)
# ========================================================
$Server = @{
    pem_path     = $env:PEM_PATH
    host         = $env:EC2_HOST
    jenkins_port = $env:JENKINS_PORT
    config_dir   = $env:CONFIG_DIR
}

# SSH 연결
Connect-SSHServer

# uuidgen 설치 보장
Ensure-UUIDGenInstalled

# GitLab 자격 증명 등록
Register-GitCredentials -provider "gitlab" -token $git_token -cred_id $git_credentials_id

# Jenkins Job XML 생성 및 등록
$project_dir = "/home/ubuntu/$jenkins_job_name"
$jenkinsfile_path = "$project_dir/Jenkinsfile"
Generate-PipelineJobConfig -job_name $jenkins_job_name -remote_dir $project_dir -jenkinsfile_path $jenkinsfile_path

# Jenkins Job 존재 여부에 따라 create 또는 update
if (Invoke-Remote "java -jar /tmp/jenkins-cli.jar -s http://localhost:$($Server.jenkins_port) -auth admin:$env:JENKINS_PASSWORD get-job '$jenkins_job_name'" -Silent) {
    Write-Host "ℹ️ Job이 이미 존재하여 update-job으로 대체합니다."
    Invoke-Remote "java -jar /tmp/jenkins-cli.jar -s http://localhost:$($Server.jenkins_port) -auth admin:$env:JENKINS_PASSWORD update-job '$jenkins_job_name' < $project_dir/${jenkins_job_name}-job.xml"
} else {
    Invoke-Remote "java -jar /tmp/jenkins-cli.jar -s http://localhost:$($Server.jenkins_port) -auth admin:$env:JENKINS_PASSWORD create-job '$jenkins_job_name' < $project_dir/${jenkins_job_name}-job.xml"
}

# GitLab Webhook 등록
$webhook_secret = [guid]::NewGuid().ToString()
& "$ScriptDir\register_gitlab_webhook.ps1" `
  --git-token="$git_token" `
  --git-repo-url="$git_repo_url" `
  --jenkins-url="http://$($Server.host):$($Server.jenkins_port)" `
  --webhook-secret="$webhook_secret"
