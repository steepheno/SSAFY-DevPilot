# ========================================================
# utils.ps1
# 오브젝트 기반 공통 유틸리티 함수 모음 (PowerShell 버전)
# ========================================================

. "$PSScriptRoot/ssh_connection.ps1"

function Log($message)
{
    Write-Host "[$( Get-Date -Format 'yyyy-MM-dd HH:mm:ss' )] $message"
}

function ErrorExit($message)
{
    Write-Error $message
    exit 1
}

function Detect-OS
{
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

function Check-ServiceStatus($service)
{
    $result = Invoke-Ssh "systemctl is-active $service"
    if ($result -eq "active")
    {
        Log "$service 서비스가 실행 중입니다."
        return $true
    }
    else
    {
        Log "$service 서비스가 실행 중이 아닙니다."
        return $false
    }
}

function Ensure-RemoteDirectory($dir)
{
    Invoke-Ssh "if [ ! -d '$dir' ]; then sudo mkdir -p '$dir'; fi"
}

function Check-RemoteFileExists($file)
{
    $result = Invoke-Ssh "if [ -f $file ]; then echo true; else echo false; fi"
    return ($result -eq "true")
}

function Wait-For($seconds, $message)
{
    Log $message
    Start-Sleep -Seconds $seconds
}

function Check-PortOpen($port)
{
    $result = Invoke-Ssh "timeout 2 bash -c 'cat < /dev/null > /dev/tcp/localhost/$port' && echo open || echo closed"
    return ($result -eq "open")
}

function Wait-ForJenkins
{
    $timeout = 60
    $counter = 0
    Log "젠킨스 서비스 시작 대기 중..."

    while ($counter -lt $timeout)
    {
        if (Check-PortOpen $Server.jenkins_port)
        {
            Log "젠킨스 서비스가 정상적으로 시작되었습니다."
            return
        }
        $counter++
        Start-Sleep -Seconds 1
    }

    ErrorExit "젠킨스 서비스가 시간 내에 시작되지 않았습니다."
}

# ========================================================
# 유틸리티 함수 정의
# ========================================================
function Validate-ServerInfo
{
    Log "----Validate-ServerInfo 시작"
    if (-not $Server.pem_path -or -not $Server.host)
    {
        ErrorExit "PEM 파일 경로와 EC2 호스트 주소가 필요합니다."
    }
    if (-not (Test-Path $Server.pem_path))
    {
        ErrorExit "PEM 키 파일이 존재하지 않습니다: $( $Server.pem_path )"
    }

    # 권한 설정 부분 예외 처리
    try
    {
        icacls $Server.pem_path /inheritance:r /grant:r "$env:USERNAME`:R"
        Log "PEM 파일 권한을 제한했습니다."
    }
    catch
    {
        Log "PEM 파일 권한 설정 중 오류 발생: $_"
        Log "권한 설정을 건너뛰고 계속 진행합니다."
    }
}

function Ensure-SSHInstalled
{
    Log "[필수 도구] ssh 설치 여부 확인 중..."
    try
    {
        $sshCheck = Invoke-Expression "where.exe ssh" 2>$null
        if (-not $sshCheck)
        {
            Log "ssh가 설치되어 있지 않음. 설치 시도..."
            # Windows 10 이후 OpenSSH 클라이언트는 Optional Feature로 제공됨
            Add-WindowsCapability -Online -Name OpenSSH.Client~~~~0.0.1.0
            Log "ssh 클라이언트 설치 완료"
        }
        else
        {
            Log "ssh가 이미 설치되어 있음: $sshCheck"
        }
    }
    catch
    {
        Log "ssh 설치 확인 중 오류 발생: $_"
        Log "오류를 무시하고 계속 진행합니다."
    }
}

function Ensure-UUIDGenInstalled
{
    Log "[필수 도구] uuidgen 설치 여부 확인 중..."
    try
    {
        $installed = Invoke-Remote "command -v uuidgen"
        if (-not $installed)
        {
            Log "uuidgen이 설치되어 있지 않음. 설치 진행..."
            Invoke-Remote "sudo apt-get update -y && sudo apt-get install -y uuid-runtime"
            Log "uuidgen 설치 완료"
        }
        else
        {
            Log "uuidgen이 이미 설치되어 있음."
        }
    }
    catch
    {
        Log "uuidgen 확인 중 오류 발생: $_"
        Log "설치를 건너뛰고 계속 진행합니다."
    }
}

# Java 및 Jenkins 설치 여부 확인 함수
function Check-JavaJenkinsInstalled
{
    Log "[확인] Java 설치 여부 확인 중..."
    $javaInstalled = $false
    $javaVersion = ""

    try
    {
        $javaVersionOutput = Invoke-Remote "java -version 2>&1" -Silent
        Log "Java 버전 출력: $javaVersionOutput"
        $javaExists = $javaVersionOutput -match "version"

        if ($javaExists)
        {
            $javaInstalled = $true
            $javaVersion = [regex]::Match($javaVersionOutput, 'version "([^"]+)"').Groups[1].Value
            Log "Java가 설치되어 있습니다. 버전: $javaVersion"
        }
        else
        {
            Log "Java가 설치되어 있지 않습니다."
        }
    }
    catch
    {
        Log "Java 설치 확인 중 오류 발생: $_"
    }

    Log "[확인] Jenkins 설치 여부 확인 중..."
    $jenkinsActive = $false

    try
    {
        $jenkinsStatus = Invoke-Remote "systemctl is-active jenkins 2>&1" -Silent
        Log "Jenkins 상태: $jenkinsStatus"
        $jenkinsActive = $jenkinsStatus -eq "active"

        if ($jenkinsActive)
        {
            Log "Jenkins가 활성화되어 있습니다."
        }
        else
        {
            Log "Jenkins가 활성화되어 있지 않습니다."
        }
    }
    catch
    {
        Log "Jenkins 상태 확인 중 오류 발생: $_"
    }

    $jenkinsPortInUse = $false

    try
    {
        $portCheck = Invoke-Remote "ss -tuln | grep :$( $Server.jenkins_port )" -Silent
        Log "포트 확인 결과: $portCheck"
        $jenkinsPortInUse = [bool]$portCheck

        if ($jenkinsPortInUse)
        {
            Log "포트 $( $Server.jenkins_port )이(가) 이미 사용 중입니다."
        }
        else
        {
            Log "포트 $( $Server.jenkins_port )이(가) 사용 가능합니다."
        }
    }
    catch
    {
        Log "포트 확인 중 오류 발생: $_"
    }

    # Jenkins 플러그인 확인
    $pluginsInstalled = $false

    try
    {
        if ($jenkinsActive)
        {
            $pluginsCheck = Invoke-Remote "ls -la /var/lib/jenkins/plugins/ | wc -l" -Silent
            $pluginsCount = [int]$pluginsCheck
            Log "설치된 플러그인 수: $pluginsCount"

            # 기본적으로 Jenkins에는 몇 개의 플러그인이 포함되어 있으므로
            # 10개 이상이면 사용자가 추가로 설치한 것으로 간주
            $pluginsInstalled = $pluginsCount -gt 10

            if ($pluginsInstalled)
            {
                Log "Jenkins 플러그인이 이미 설치되어 있습니다."
            }
            else
            {
                Log "Jenkins 플러그인이 충분히 설치되지 않았습니다."
            }
        }
    }
    catch
    {
        Log "플러그인 확인 중 오류 발생: $_"
    }

    return @{
        JavaInstalled = $javaInstalled
        JavaVersion = $javaVersion
        JenkinsActive = $jenkinsActive
        JenkinsPortInUse = $jenkinsPortInUse
        PluginsInstalled = $pluginsInstalled
    }
}