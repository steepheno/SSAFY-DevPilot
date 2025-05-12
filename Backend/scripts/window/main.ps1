# ========================================================
# main.ps1
# PowerShell 기반 Jenkins 자동 설치 및 구성 메인 스크립트
# ========================================================

# 스크립트 경로
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

# 외부 함수 로드
. "$ScriptDir\utils.ps1"
. "$ScriptDir\ssh_connection.ps1"
. "$ScriptDir\jenkins_installation.ps1"
. "$ScriptDir\jenkins_configuration.ps1"
. "$ScriptDir\jenkins_pipeline.ps1"
. "$ScriptDir\docker_helper.ps1"

# ========================================================
# 서버 오브젝트 초기화
# ========================================================
$Server = @{
    pem_path    = ""
    host        = ""
    jenkins_port = 7070
    config_dir  = "/opt/jenkins_config"
}

# ========================================================
# 인자 파싱
# ========================================================
param (
[string]$pem_path,
[string]$ec2_host,
[string]$jenkins_port = "7070",
[string]$jenkins_password,
[string]$config_dir = "/opt/jenkins_config"
)

$Server["pem_path"] = $pem_path
$Server["host"] = $ec2_host
$Server["jenkins_port"] = $jenkins_port
$Server["config_dir"] = $config_dir
$env:JENKINS_PASSWORD = $jenkins_password

# ========================================================
# 유틸리티 함수 정의
# ========================================================
function Validate-ServerInfo {
    Log "----Validate-ServerInfo 시작"
    if (-not $Server.pem_path -or -not $Server.host) {
        ErrorExit "PEM 파일 경로와 EC2 호스트 주소가 필요합니다."
    }
    if (-not (Test-Path $Server.pem_path)) {
        ErrorExit "PEM 키 파일이 존재하지 않습니다: $($Server.pem_path)"
    }
    icacls $Server.pem_path /inheritance:r /grant:r "$env:USERNAME:R"
    Log "PEM 파일 권한을 제한했습니다."
}

function Ensure-UUIDGenInstalled {
    Log "[필수 도구] uuidgen 설치 여부 확인 중..."
    $installed = Invoke-Remote "command -v uuidgen"
    if (-not $installed) {
        Log "uuidgen이 설치되어 있지 않음. 설치 진행..."
        Invoke-Remote "sudo apt-get update -y && sudo apt-get install -y uuid-runtime"
    } else {
        Log "uuidgen이 이미 설치되어 있음."
    }
}

# ========================================================
# 메인 설치 프로세스
# ========================================================
function Main {
    Log "[메인] Jenkins 설치 자동화 시작"
    Log "jenkins port: $($Server.jenkins_port)"

    Validate-ServerInfo
    Connect-SSHServer
    Ensure-UUIDGenInstalled

    # Remove existing Jenkins and Java
    Remove-ExistingInstallations
    Install-JavaJenkins

    # Docker 설치 여부 확인
    $dockerExists = Invoke-Remote "docker --version"
    if (-not $dockerExists) {
        Log "[Docker] 설치되어 있지 않음. 설치 시작..."
        Install-Docker
    } else {
        Log "[Docker] 이미 설치되어 있음. 건너뜀."
    }

    Install-JenkinsPlugins
    Configure-JenkinsUser
    Setup-SecurityOptions

    # Groovy 설정 업로드 및 실행
    Upload-File -localPath "$ScriptDir\setup_jenkins_system_config.groovy" -remotePath "/tmp/setup_jenkins_system_config.groovy"
    Invoke-Remote "java -jar /tmp/jenkins-cli.jar -s http://localhost:$($Server.jenkins_port) -auth admin:$env:JENKINS_PASSWORD groovy = < /tmp/setup_jenkins_system_config.groovy"

    Log "[메인] Jenkins 설치 및 설정 완료!"
    Log "URL: https://$($Server.host):$($Server.jenkins_port)"
}

Main
