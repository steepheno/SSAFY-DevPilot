# ========================================================
# main.ps1
# PowerShell 기반 Jenkins 자동 설치 및 구성 메인 스크립트
# ========================================================

# 파라미터 정의 (스크립트 시작 부분에 위치해야 함)
param (
    [string]$pem_path,
    [string]$ec2_host,
    [string]$jenkins_password,
    [string]$jenkins_port = "8080",
    [string]$config_dir = "/opt/jenkins_config"
)

# 로깅 시간 포맷 개선
function Log($msg)
{
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    Write-Host "[$timestamp] [INFO] $msg"
}

function ErrorExit($msg)
{
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    Write-Error "[$timestamp] [ERROR] $msg"
    exit 1
}

# 스크립트 경로
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Log "스크립트 디렉토리: $ScriptDir"

# 경로 정규화 - 백슬래시와 슬래시 일관성 유지
$normalizedPemPath = $pem_path.Replace("\", "/")
Log "정규화된 PEM 경로: $normalizedPemPath"

# 외부 함수 로드
Log "외부 모듈 로드 시작"
try
{
    . "$ScriptDir\utils.ps1"
    . "$ScriptDir\ssh_connection.ps1"
    . "$ScriptDir\jenkins_installation.ps1"
    . "$ScriptDir\jenkins_configuration.ps1"
    . "$ScriptDir\jenkins_pipeline.ps1"
    . "$ScriptDir\docker_helper.ps1"
    Log "외부 모듈 로드 완료"
}
catch
{
    ErrorExit "외부 모듈 로드 실패: $_"
}

# ========================================================
# 서버 오브젝트 초기화
# ========================================================
$Script:Server = @{
    pem_path = $normalizedPemPath
    host = $ec2_host.Trim()  # 공백 제거
    jenkins_port = $jenkins_port
    config_dir = $config_dir
}

$env:JENKINS_PASSWORD = $jenkins_password

# ========================================================
# 메인 설치 프로세스
# ========================================================
function Main
{
    try
    {
        Log "=== Jenkins 설치 자동화 시작 ==="
        Log "Jenkins port: $( $Server.jenkins_port )"
        Log "Config 디렉토리: $( $Server.config_dir )"

        Log "서버 정보 유효성 검사 시작"
        Validate-ServerInfo
        Log "서버 정보 유효성 검사 완료"

        Log "SSH 설치 확인"
        Ensure-SSHInstalled
        Log "SSH 설치 완료"

        Log "SSH 연결 시작"
        Connect-SSHServer
        Log "SSH 연결 성공"

        Log "필수 도구 설치 확인 시작"
        Ensure-UUIDGenInstalled
        Log "필수 도구 설치 확인 완료"

        # Java와 Jenkins 설치 여부 확인
        Log "Java 및 Jenkins 설치 상태 확인 시작"
        $installedStatus = Check-JavaJenkinsInstalled
        Log "Java 설치됨: $( $installedStatus.JavaInstalled ), 버전: $( $installedStatus.JavaVersion )"
        Log "Jenkins 활성화됨: $( $installedStatus.JenkinsActive )"
        Log "포트 사용 중: $( $installedStatus.JenkinsPortInUse )"
        Log "플러그인 설치됨: $( $installedStatus.PluginsInstalled )"

        if (-not $installedStatus.JavaInstalled)
        {
            Log "[Java] 설치되어 있지 않음. 설치 시작..."
            try
            {
                Install-Java
                Log "[Java] 설치 완료"
            }
            catch
            {
                ErrorExit "[Java] 설치 중 오류 발생: $_"
            }
        }
        else
        {
            Log "[Java] 이미 설치되어 있음. 설치 건너뜀."
        }

        if (-not $installedStatus.JenkinsActive)
        {
            if ($installedStatus.JenkinsPortInUse)
            {
                Log "[Jenkins] $( $Server.jenkins_port ) 포트가 이미 사용 중입니다. 확인 필요."
                # 선택적: 포트 충돌 해결 로직 추가
            }
            else
            {
                Log "[Jenkins] 설치되어 있지 않거나 활성화되지 않음. 설치 시작..."
                try
                {
                    Install-JavaJenkins
                    Log "[Jenkins] 설치 완료"
                }
                catch
                {
                    ErrorExit "[Jenkins] 설치 중 오류 발생: $_"
                }
            }
        }
        else
        {
            Log "[Jenkins] 이미 설치되어 있고 활성화되어 있음. 설치 건너뜀."
        }

        # 환경 변수 설정 (Jenkins가 설치되어 있든 없든 항상 실행)
        Log "[환경 설정] Jenkins 환경 변수 설정 시작..."
        try
        {
            Invoke-Remote "sudo mkdir -p $( $Server.config_dir )"
            Log "디렉토리 생성 완료: $( $Server.config_dir )"

            Invoke-Remote "echo 'JENKINS_HOME=$( $Server.config_dir )' | sudo tee -a /etc/environment"
            Log "JENKINS_HOME 설정 완료"

            Invoke-Remote "echo 'JENKINS_PORT=$( $Server.jenkins_port )' | sudo tee -a /etc/environment"
            Log "JENKINS_PORT 설정 완료"

            Invoke-Remote "source /etc/environment"
            Log "환경 변수 설정 완료"
        }
        catch
        {
            Log "환경 변수 설정 중 오류 발생: $_"
            Log "오류를 무시하고 계속 진행합니다."
        }

        # Docker 설치 여부 확인
        Log "[Docker] 설치 여부 확인 시작"
        $dockerExists = $false
        try
        {
            $dockerOutput = Invoke-Remote "docker --version" -Silent
            $dockerExists = [bool]$dockerOutput
            if ($dockerExists)
            {
                Log "[Docker] 버전 정보: $dockerOutput"
            }
        }
        catch
        {
            Log "[Docker] 버전 확인 중 오류 발생: $_"
        }

        if (-not $dockerExists)
        {
            Log "[Docker] 설치되어 있지 않음. 설치 시작..."
            try
            {
                Install-Docker
                Log "[Docker] 설치 완료"
            }
            catch
            {
                ErrorExit "[Docker] 설치 중 오류 발생: $_"
            }
        }
        else
        {
            Log "[Docker] 이미 설치되어 있음. 건너뜀."
        }

        # Jenkins가 활성화되어 있고 플러그인이 설치되지 않은 경우에만 플러그인 설치 진행
        $jenkinsIsActive = $installedStatus.JenkinsActive
        $pluginsAreInstalled = $installedStatus.PluginsInstalled

        if (-not $jenkinsIsActive)
        {
            try
            {
                $jenkinsStatus = Invoke-Remote "systemctl is-active jenkins 2>&1" -Silent
                $jenkinsIsActive = $jenkinsStatus -eq "active"
                Log "[Jenkins] 현재 상태: $jenkinsStatus"
            }
            catch
            {
                Log "[Jenkins] 상태 확인 중 오류 발생: $_"
            }
        }

        if ($jenkinsIsActive)
        {
            if (-not $pluginsAreInstalled)
            {
                Log "[Jenkins] 플러그인이 설치되어 있지 않음. 플러그인 설치 시작..."

                try
                {
                    Log "[Jenkins] 플러그인 설치 시작"
                    Install-JenkinsPlugins
                    Log "[Jenkins] 플러그인 설치 완료"
                }
                catch
                {
                    Log "[Jenkins] 플러그인 설치 중 오류 발생: $_"
                    Log "오류를 무시하고 계속 진행합니다."
                }

                try
                {
                    Log "[Jenkins] 사용자 구성 시작"
                    Configure-JenkinsUser
                    Log "[Jenkins] 사용자 구성 완료"
                }
                catch
                {
                    Log "[Jenkins] 사용자 구성 중 오류 발생: $_"
                    Log "오류를 무시하고 계속 진행합니다."
                }

                try
                {
                    Log "[Jenkins] JDK 및 NodeJS 도구 설정 시작"
                    Configure-JenkinsTools
                    Log "[Jenkins] JDK 및 NodeJS 도구 설정 완료"
                }
                catch
                {
                    Log "[Jenkins] 도구 설정 중 오류 발생: $_"
                    Log "오류를 무시하고 계속 진행합니다."
                }

                try
                {
                    Log "[Jenkins] 보안 설정 시작"
                    Setup-SecurityOptions
                    Log "[Jenkins] 보안 설정 완료"
                }
                catch
                {
                    Log "[Jenkins] 보안 설정 중 오류 발생: $_"
                    Log "오류를 무시하고 계속 진행합니다."
                }

                # Groovy 설정 업로드 및 실행
                try
                {
                    Log "[Jenkins] Groovy 설정 시작"
                    $groovyPath = "$ScriptDir\setup_jenkins_system_config.groovy"

                    if (Test-Path $groovyPath)
                    {
                        Log "Groovy 스크립트 파일이 존재합니다: $groovyPath"
                        Upload-File -localPath $groovyPath -remotePath "/tmp/setup_jenkins_system_config.groovy"
                        Log "Groovy 스크립트 업로드 완료"

                        $groovyResult = Invoke-Remote "java -jar /tmp/jenkins-cli.jar -s http://localhost:$( $Server.jenkins_port ) -auth admin:$env:JENKINS_PASSWORD groovy = < /tmp/setup_jenkins_system_config.groovy"
                        Log "Groovy 스크립트 실행 결과: $groovyResult"
                    }
                    else
                    {
                        Log "Groovy 스크립트 파일이 존재하지 않습니다: $groovyPath"
                    }

                    Log "[Jenkins] Groovy 설정 완료"
                }
                catch
                {
                    Log "[Jenkins] Groovy 설정 중 오류 발생: $_"
                    Log "오류를 무시하고 계속 진행합니다."
                }
            }
            else
            {
                Log "[Jenkins] 플러그인이 이미 설치되어 있음. 플러그인 설치 및 구성을 건너뜁니다."
            }
        }
        else
        {
            Log "[경고] Jenkins가 활성화되지 않아 플러그인 설치 및 구성을 건너뜁니다."
        }

        Log "=== Jenkins 설치 및 설정 완료! ==="
        Log "URL: http://$( $Server.host ):$( $Server.jenkins_port )"
        return 0
    }
    catch
    {
        ErrorExit "Jenkins 설치 중 오류 발생: $_"
        return 1
    }
}

# 메인 함수 실행
try
{
    $exitCode = Main
    exit $exitCode
}
catch
{
    ErrorExit "스크립트 실행 중 오류 발생: $_"
    exit 1
}