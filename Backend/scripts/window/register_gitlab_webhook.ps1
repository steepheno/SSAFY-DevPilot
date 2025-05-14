# ========================================================
# register_gitlab_webhook.ps1
# GitLab Webhook 등록 스크립트 (PowerShell 버전)
# ========================================================

param(
  [string]$git_token,
  [string]$git_repo_url,
  [string]$jenkins_url,
  [string]$webhook_secret
)

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$envPath = "$HOME/.devpilot/.env"

. "$ScriptDir\utils.ps1"
. "$ScriptDir\ssh_connection.ps1"

if (-Not (Test-Path $envPath)) {
  Write-Host "❌ 환경 파일이 존재하지 않습니다: $envPath"
  exit 1
}
. $envPath

Write-Host "🔎 현재 환경 설정:"
Write-Host "EC2_HOST=$env:EC2_HOST"
Write-Host "PEM_PATH=$env:PEM_PATH"
Write-Host "JENKINS_PORT=$env:JENKINS_PORT"
Write-Host "JENKINS_PASSWORD=$env:JENKINS_PASSWORD"

$Server = @{
  pem_path     = $env:PEM_PATH
  host         = $env:EC2_HOST
  jenkins_port = $env:JENKINS_PORT
  config_dir   = $env:CONFIG_DIR
}

# jq 유무 확인 및 임시 설치
if (-Not (Get-Command jq -ErrorAction SilentlyContinue)) {
  Write-Host "⚠️ jq 명령어가 없어 로컬 설치를 진행합니다..."
  $localBin = "$HOME/.local/bin"
  New-Item -ItemType Directory -Path $localBin -Force | Out-Null
  Invoke-WebRequest -Uri "https://github.com/stedolan/jq/releases/download/jq-1.6/jq-win64.exe" -OutFile "$localBin\jq.exe"
  $env:PATH = "$localBin;$env:PATH"
  if (-Not (Get-Command jq -ErrorAction SilentlyContinue)) {
    throw "❌ jq 설치 실패: 수동 설치 필요"
  }
  Write-Host "✅ jq 설치 완료"
} else {
  Write-Host "✅ jq가 이미 설치되어 있습니다."
}

if (-Not $git_token) { throw "--git-token은 필수입니다." }
if (-Not $git_repo_url) { throw "--git-repo-url은 필수입니다." }
if (-Not $jenkins_url) { throw "--jenkins-url은 필수입니다." }

if (-Not $webhook_secret) {
  $webhook_secret = [guid]::NewGuid().ToString()
  Write-Host "ℹ️ Webhook Secret 자동 생성: $webhook_secret"
}

$repo_name = [System.IO.Path]::GetFileNameWithoutExtension($git_repo_url)
$repo_owner = ($git_repo_url -split '/')[3]

$search_url = "https://lab.ssafy.com/api/v4/projects?search=$repo_name"
$response = Invoke-RestMethod -Uri $search_url -Headers @{"PRIVATE-TOKEN" = $git_token} -Method Get
$project_id = ($response | Where-Object { $_.path -eq $repo_name }).id

if (-Not $project_id) {
  throw "❌ GitLab Project ID 조회 실패"
}

$hook_url = "$jenkins_url/gitlab-webhook/"
$hook_body = @{
  url = $hook_url
  push_events = 'true'
  token = $webhook_secret
}

# ========================================================
# Crumb 값 로드 및 GitLab Webhook 등록 요청에 포함
# ========================================================

# Crumb 파일 경로 정의
$crumbPath = Join-Path -Path (Split-Path $envPath) -ChildPath "jenkins_api_token.txt"

if (-Not (Test-Path $crumbPath)) {
  throw "❌ Crumb 토큰 파일이 존재하지 않습니다: $crumbPath"
}

# Crumb 값 로드
$jenkins_crumb = Get-Content $crumbPath -Raw
Write-Host "🔐 Crumb 로드 완료: $jenkins_crumb"

Invoke-RestMethod -Uri "https://lab.ssafy.com/api/v4/projects/$project_id/hooks" `
  -Method Post `
  -Headers @{"PRIVATE-TOKEN" = $jenkins_crumb} `
  -Body $hook_body

Write-Host "✅ GitLab Webhook 등록 완료"
Write-Host "➡️  Secret: $webhook_secret"
