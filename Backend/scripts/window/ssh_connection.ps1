# ========================================================
# ssh_connection.ps1
# 오브젝트 기반 SSH 연결 및 파일 송수신 헬퍼 (PowerShell 버전)
# ========================================================

$SSH_USER = "ubuntu"

function Connect-SshServer
{
    Write-Host "SSH 연결 테스트 중..."
    Write-Host "PEM: $( $Server.pem_path )"
    Write-Host "HOST: $( $Server.host )"

    $sshCmd = "ssh -i `"$( $Server.pem_path )`" -o StrictHostKeyChecking=no -o ConnectTimeout=10 $SSH_USER@$( $Server.host ) echo 연결 성공"
    $result = Invoke-Expression $sshCmd

    if ($LASTEXITCODE -ne 0)
    {
        throw "SSH 연결 실패: PEM 키 또는 EC2 호스트를 확인해주세요."
    }

    Write-Host "SSH 연결 성공!"
}

function Invoke-Ssh
{
    param (
        [string]$Command
    )
    # 경로에 따옴표 추가
    ssh -i "$( $Server.pem_path )" "$SSH_USER@$( $Server.host )" $Command
}

function Invoke-RemoteScript
{
    param (
        [string]$LocalScript
    )
    Get-Content $LocalScript | ssh -i $Server.pem_path "$SSH_USER@$( $Server.host )" "bash -s"
}

function Upload-File
{
    param (
        [string]$LocalPath,
        [string]$RemotePath
    )
    Write-Host "[UPLOAD] 시작: $LocalPath → $( $Server.host ):$RemotePath"

    # 파일 존재 여부 확인
    if (-not (Test-Path $LocalPath))
    {
        Write-Host "❌ 로컬 파일이 존재하지 않습니다: $LocalPath"
        throw "파일이 존재하지 않습니다: $LocalPath"
    }

    # 디렉토리가 있는지 확인하고 없으면 생성
    $remoteDir = Split-Path -Parent $RemotePath
    $mkdirCmd = "ssh -i `"$( $Server.pem_path )`" $SSH_USER@$( $Server.host ) 'mkdir -p `"$remoteDir`"'"
    Write-Host "디렉토리 생성: $mkdirCmd"
    Invoke-Expression $mkdirCmd

    # 파일 업로드
    $remoteDestination = "$SSH_USER@$( $Server.host ):`"$RemotePath`""
    $scpCmd = "scp -v -i `"$( $Server.pem_path )`" -o StrictHostKeyChecking=no `"$LocalPath`" $remoteDestination"
    Write-Host "업로드 명령: $scpCmd"

    $result = Invoke-Expression $scpCmd
    $exitCode = $LASTEXITCODE
    Write-Host "업로드 결과 코드: $exitCode"

    if ($exitCode -ne 0)
    {
        Write-Host "❌ 파일 업로드 실패: $LocalPath → $RemotePath"
        throw "파일 업로드 실패 (Exit: $exitCode): $LocalPath"
    }

    # 파일이 실제로 있는지 확인
    $checkCmd = "ssh -i `"$( $Server.pem_path )`" $SSH_USER@$( $Server.host ) 'ls -la `"$RemotePath`"'"
    $checkResult = Invoke-Expression $checkCmd
    if ($LASTEXITCODE -ne 0)
    {
        Write-Host "⚠️ 파일 업로드 확인 실패: $RemotePath"
    }
    else
    {
        Write-Host "✅ 파일 업로드 확인: $checkResult"
    }

    Write-Host "[UPLOAD] 완료: $LocalPath → $RemotePath"
}

function Download-File
{
    param (
        [string]$RemotePath,
        [string]$LocalPath
    )
    $remoteSource = "$SSH_USER@$( $Server.host ):$RemotePath"
    scp -i $Server.pem_path $remoteSource $LocalPath
}

function Get-RemoteOutput
{
    param (
        [string]$Command
    )
    ssh -i $Server.pem_path "$SSH_USER@$( $Server.host )" $Command
}

function Get-FileContentRemote
{
    param (
        [string]$FilePath
    )
    ssh -i $Server.pem_path "$SSH_USER@$( $Server.host )" "cat $FilePath 2>/dev/null"
}

function Check-SshFingerprint
{
    ssh-keygen -lf $Server.pem_path | Out-Null
    if ($LASTEXITCODE -ne 0)
    {
        Write-Host "⚠️ PEM 키 핑거프린트 확인 실패"
    }
}

function Upload-ProjectFiles
{
    param (
        [string]$BackendDockerfile
    )
    # 미사용 함수 예시
}