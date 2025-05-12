# ========================================================
# ssh_connection.ps1
# 오브젝트 기반 SSH 연결 및 파일 송수신 헬퍼 (PowerShell 버전)
# ========================================================

$SSH_USER = "ubuntu"

function Connect-SshServer {
    Write-Host "SSH 연결 테스트 중..."
    Write-Host "PEM: $($Server.pem_path)"
    Write-Host "HOST: $($Server.host)"

    $sshCmd = "ssh -i `"$($Server.pem_path)`" -o StrictHostKeyChecking=no -o ConnectTimeout=10 $SSH_USER@$($Server.host) echo 연결 성공"
    $result = Invoke-Expression $sshCmd

    if ($LASTEXITCODE -ne 0) {
        throw "SSH 연결 실패: PEM 키 또는 EC2 호스트를 확인해주세요."
    }

    Write-Host "SSH 연결 성공!"
}

function Invoke-Ssh {
    param (
        [string]$Command
    )
    ssh -i $Server.pem_path "$SSH_USER@$($Server.host)" $Command
}

function Invoke-RemoteScript {
    param (
        [string]$LocalScript
    )
    Get-Content $LocalScript | ssh -i $Server.pem_path "$SSH_USER@$($Server.host)" "bash -s"
}

function Upload-File {
    param (
        [string]$LocalPath,
        [string]$RemotePath
    )
    Write-Host "[UPLOAD] $LocalPath → $($Server.host):$RemotePath"
    scp -i $Server.pem_path -o StrictHostKeyChecking=no $LocalPath "$SSH_USER@$($Server.host):$RemotePath"
    if ($LASTEXITCODE -ne 0) {
        throw "📦 파일 업로드 실패: $LocalPath"
    }
}

function Download-File {
    param (
        [string]$RemotePath,
        [string]$LocalPath
    )
    scp -i $Server.pem_path "$SSH_USER@$($Server.host):$RemotePath" $LocalPath
}

function Get-RemoteOutput {
    param (
        [string]$Command
    )
    ssh -i $Server.pem_path "$SSH_USER@$($Server.host)" $Command
}

function Get-FileContentRemote {
    param (
        [string]$FilePath
    )
    ssh -i $Server.pem_path "$SSH_USER@$($Server.host)" "cat $FilePath 2>/dev/null"
}

function Check-SshFingerprint {
    ssh-keygen -lf $Server.pem_path | Out-Null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "⚠️ PEM 키 핑거프린트 확인 실패"
    }
}

function Upload-ProjectFiles {
    param (
        [string]$BackendDockerfile
    )
    # 미사용 함수 예시
}
