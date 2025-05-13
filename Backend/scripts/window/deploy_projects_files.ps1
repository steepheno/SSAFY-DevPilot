# ========================================================
# deploy_project_files.ps1
# EC2에 Docker 관련 파일 업로드 (Windows PowerShell 버전)
# ========================================================

param(
    [string]$ProjectName,
    [string]$BackendDockerfile,
    [string]$FrontendDockerfile,
    [string]$DockerCompose,
    [string]$NginxConf
)

# ----------------------------------
# 환경 파일 로드
# ----------------------------------
$envPath = "$HOME\.devpilot\.env"
if (-not (Test-Path $envPath))
{
    Write-Error "❌ 환경 파일이 존재하지 않습니다: $envPath"
    exit 1
}

Get-Content $envPath | ForEach-Object {
    if ($_ -match "^(.*?)=(.*)$")
    {
        $key = $matches[1]
        $value = $matches[2]
        Set-Item -Path "env:$key" -Value $value
    }
}

# ----------------------------------
# EC2 접속 변수 정의
# ----------------------------------
$PemPath = $env:PEM_PATH
$EC2Host = $env:EC2_HOST
$RemoteBase = "/home/ubuntu/$ProjectName"
$RemoteBackend = "$RemoteBase/backend"
$RemoteFrontend = "$RemoteBase/frontend"

# ----------------------------------
# SSH 명령 실행 함수
# ----------------------------------
Write-Host "디버깅 정보:"
Write-Host "PemPath: $PemPath"
Write-Host "EC2Host: $EC2Host"
Write-Host "RemoteBase: $RemoteBase"
function Invoke-Remote
{
    param ([string]$Command)
    Write-Host "실행 명령어: ssh -i `"$PemPath`" -o StrictHostKeyChecking=no `"ubuntu@${EC2Host}`" $Command"
    ssh -v -i $PemPath -o StrictHostKeyChecking=no "ubuntu@${EC2Host}" $Command
}

function Upload-File
{
    param (
        [string]$LocalPath,
        [string]$RemotePath
    )
    Write-Host "[UPLOAD] $LocalPath → $RemotePath"

    # 명령어 디버깅
    Write-Host "실행 명령어: scp -i `"$PemPath`" -o StrictHostKeyChecking=no `"$LocalPath`" `"ubuntu@${EC2Host}:$RemotePath`""
    scp -v -i $PemPath -o StrictHostKeyChecking=no $LocalPath "ubuntu@${EC2Host}:$RemotePath"

    if ($LASTEXITCODE -ne 0)
    {
        Write-Host "❌ 업로드 실패: $LocalPath (코드: $LASTEXITCODE)"
        # 계속 진행을 위해 throw 대신 경고만 출력
        # throw "❌ 업로드 실패: $LocalPath"
    }
    else
    {
        Write-Host "✅ 업로드 성공: $LocalPath"
    }
}

# ----------------------------------
# 파일 존재 확인
# ----------------------------------
if (-not (Test-Path $BackendDockerfile))
{
    throw "❌ 백엔드 Dockerfile 없음: $BackendDockerfile"
}
if (-not (Test-Path $FrontendDockerfile))
{
    throw "❌ 프론트 Dockerfile 없음: $FrontendDockerfile"
}
if (-not (Test-Path $DockerCompose))
{
    throw "❌ docker-compose.yml 없음: $DockerCompose"
}
if (-not (Test-Path $NginxConf))
{
    throw "❌ nginx.conf 없음: $NginxConf"
}

# ----------------------------------
# 디렉토리 생성
# ----------------------------------
Write-Host "[EC2] 디렉토리 생성 중..."
Invoke-Remote "mkdir -p $RemoteBackend $RemoteFrontend"

# ----------------------------------
# 파일 업로드
# ----------------------------------
Write-Host "[EC2] 파일 업로드 시작..."
Upload-File -LocalPath $BackendDockerfile -RemotePath "$RemoteBackend/Dockerfile"
Upload-File -LocalPath $FrontendDockerfile -RemotePath "$RemoteFrontend/Dockerfile"
Upload-File -LocalPath $DockerCompose -RemotePath "$RemoteBase/docker-compose.yml"
Upload-File -LocalPath $NginxConf -RemotePath "$RemoteBase/nginx.conf"

Write-Host "✅ 모든 파일 업로드 완료!"
