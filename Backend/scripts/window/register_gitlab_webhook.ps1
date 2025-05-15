param(
  [string]$git_token,
  [string]$git_repo_url,
  [string]$jenkins_url,
  [string]$webhook_secret
)

# 경로 설정
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$homeDir = [Environment]::GetFolderPath("UserProfile")
$envPath = "$homeDir\.devpilot\.env"

# 유틸 로드
. "$ScriptDir\utils.ps1"
. "$ScriptDir\ssh_connection.ps1"

# .env 로드 (. $envPath ❌ => 직접 파싱 ✅)
if (-Not (Test-Path $envPath)) {
  Write-Host "❌ 환경 파일이 존재하지 않습니다: $envPath"
  exit 1
}

Get-Content $envPath | ForEach-Object {
  if ($_ -match '^\s*([^#][^=]+)=(.+)$') {
    $key = $matches[1].Trim()
    $value = $matches[2].Trim()
    Set-Item -Path "Env:$key" -Value $value
  }
}
Write-Host "✅ 환경 변수 로드 완료"

# 필수 인자 검사
if (-Not $git_token) { throw "--git-token은 필수입니다." }
if (-Not $git_repo_url) { throw "--git-repo-url은 필수입니다." }
if (-Not $jenkins_url) { throw "--jenkins-url은 필수입니다." }

# Webhook Secret 생성
if (-Not $webhook_secret) {
  $webhook_secret = [guid]::NewGuid().ToString()
  Write-Host "ℹ️ Webhook Secret 자동 생성: $webhook_secret"
}

# GitLab 프로젝트 정보 추출
$repo_name = [System.IO.Path]::GetFileNameWithoutExtension($git_repo_url)
$repo_owner = ($git_repo_url -split '/')[3]

$search_url = "https://lab.ssafy.com/api/v4/projects?search=$repo_name"
$response = Invoke-RestMethod -Uri $search_url -Headers @{ "PRIVATE-TOKEN" = $git_token } -Method Get
$project_id = ($response | Where-Object { $_.path -eq $repo_name }).id

if (-Not $project_id) {
  throw "❌ GitLab Project ID 조회 실패"
}

# Webhook 등록 요청
$hook_url = "$jenkins_url/gitlab-webhook/"
$hook_body = @{
  url          = $hook_url
  push_events  = $true
  token        = $webhook_secret
} | ConvertTo-Json -Depth 3

$response = Invoke-RestMethod -Uri "https://lab.ssafy.com/api/v4/projects/$project_id/hooks" `
  -Method Post `
  -Headers @{ "PRIVATE-TOKEN" = $git_token; "Content-Type" = "application/json" } `
  -Body $hook_body

Write-Host "✅ GitLab Webhook 등록 완료"
Write-Host "➡️  Secret: $webhook_secret"
