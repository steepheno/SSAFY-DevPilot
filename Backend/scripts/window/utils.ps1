# ========================================================
# utils.ps1
# 오브젝트 기반 공통 유틸리티 함수 모음 (PowerShell 버전)
# ========================================================

. "$PSScriptRoot/ssh_connection.ps1"

function Log($message) {
    Write-Host "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] $message"
}

function Error-Exit($message) {
    Log "오류: $message"
    exit 1
}

function Detect-OS {
    Invoke-Ssh @"
    if [ -f /etc/os-release ]; then
      . /etc/os-release
      echo \$ID
    elif [ -f /etc/redhat-release ]; then
      echo 'rhel'
    elif [ -f /etc/debian_version ]; then
      echo 'debian'
    else
      echo 'unknown'
    fi
"@
}

function Check-ServiceStatus($service) {
    $result = Invoke-Ssh "systemctl is-active $service"
    if ($result -eq "active") {
        Log "$service 서비스가 실행 중입니다."
        return $true
    } else {
        Log "$service 서비스가 실행 중이 아닙니다."
        return $false
    }
}

function Ensure-RemoteDirectory($dir) {
    Invoke-Ssh "if [ ! -d '$dir' ]; then sudo mkdir -p '$dir'; fi"
}

function Check-RemoteFileExists($file) {
    $result = Invoke-Ssh "if [ -f $file ]; then echo true; else echo false; fi"
    return ($result -eq "true")
}

function Wait-For($seconds, $message) {
    Log $message
    Start-Sleep -Seconds $seconds
}

function Check-PortOpen($port) {
    $result = Invoke-Ssh "timeout 2 bash -c 'cat < /dev/null > /dev/tcp/localhost/$port' && echo open || echo closed"
    return ($result -eq "open")
}

function Wait-ForJenkins {
    $timeout = 60
    $counter = 0
    Log "젠킨스 서비스 시작 대기 중..."

    while ($counter -lt $timeout) {
        if (Check-PortOpen $Server.jenkins_port) {
            Log "젠킨스 서비스가 정상적으로 시작되었습니다."
            return
        }
        $counter++
        Start-Sleep -Seconds 1
    }

    Error-Exit "젠킨스 서비스가 시간 내에 시작되지 않았습니다."
}
