# ========================================================
# jenkins_configuration.ps1
# Jenkins 설정 자동화 PowerShell 버전
# ========================================================

# Load .env file manually
$homeDir = [Environment]::GetFolderPath("UserProfile")
$envFile = "$homeDir\.devpilot\.env"  # 위치는 필요에 따라 조정

if (Test-Path $envFile) {
    Get-Content $envFile | ForEach-Object {
        if ($_ -match '^\s*([^#][^=]+)=(.+)$') {
            $key = $matches[1].Trim()
            $value = $matches[2].Trim()
            Set-Item -Path "Env:$key" -Value $value
        }
    }
    Write-Host "[INFO] .env 환경변수 로드 완료: $envFile"
} else {
    Write-Host "[WARN] .env 파일을 찾을 수 없습니다: $envFile"
}

# Jenkins CLI 경로 및 인증 정보
$JenkinsPort = $env:JENKINS_PORT
$JenkinsPassword = $env:JENKINS_PASSWORD
$CliJarPath = "/tmp/jenkins-cli.jar"

function Invoke-Remote($cmd) {
    ssh -i $env:PEM_PATH -o StrictHostKeyChecking=no "ubuntu@$env:EC2_HOST" $cmd
}

function Upload-File($localPath, $remotePath) {
    $remoteDestination = "ubuntu@$env:EC2_HOST:$remotePath"
    scp -i $env:PEM_PATH -o StrictHostKeyChecking=no $localPath $remoteDestination
}

function Log($msg) {
    Write-Host "[INFO] $msg"
}

function ErrorExit($msg) {
    Write-Error $msg
    exit 1
}

function Install-JenkinsPlugins() {
    Log "[Jenkins] 플러그인 설치 시작..."

    $initial_pw = Invoke-Remote "sudo cat /var/lib/jenkins/secrets/initialAdminPassword"
    if (-not $initial_pw) { ErrorExit "초기 관리자 비밀번호를 가져올 수 없습니다." }

    Invoke-Remote "wget http://localhost:$JenkinsPort/jnlpJars/jenkins-cli.jar -O $CliJarPath"

    $plugins = @(
        "bootstrap5-api:5.3.3-2",
        "gitlab-plugin:1.9.8",
        "docker-api:3.5.0-108.v211cdd21c383",
        "docker-compose-build-step:1.0",
        "docker-workflow:611.v16e84da_6d3ff",
        "docker-plugin:1274.vc0203fdf2e74",
        "gitlab-api:5.6.0-100.v83f8f4b_f1129",
        "gitlab-oauth:1.22",
        "gitlab-branch-source:718.v40b_5f0e67cd3",
        "multibranch-scan-webhook-trigger:1.0.11",
        "workflow-aggregator:608.v67378e9d3db_1",
        "workflow-multibranch:806.vb_b_688f609ee9",
        "credentials:1415.v831096eb_5534",
        "plain-credentials:195.vb_906e9073dee",
        "credentials-binding:687.v619cb_15e923f",
        "configuration-as-code:1967.va_968e15fd05b_",
        "sse-gateway:1.28",
        "nodejs:1.5.1"  # NodeJS 플러그인
    )

    foreach ($plugin in $plugins) {
        Log "설치 중: $plugin"
        Invoke-Remote "java -jar $CliJarPath -s http://localhost:$JenkinsPort -auth admin:$initial_pw install-plugin $plugin"
    }

    Invoke-Remote "sudo systemctl restart jenkins"
    Log "[Jenkins] 플러그인 설치 완료"

    # Jenkins 재시작 후 완전히 로딩될 때까지 대기
    Log "[Jenkins] Jenkins 재시작 중... 서비스가 완전히 로드될 때까지 대기합니다."
    $ready = $false
    $retries = 30
    for ($i = 0; $i -lt $retries; $i++) {
        $status = Invoke-Remote "curl -s -o /dev/null -w '%{http_code}' http://localhost:$JenkinsPort/"
        if ($status -eq "200" -or $status -eq "403") {
            $ready = $true
            Log "[Jenkins] Jenkins가 준비되었습니다."
            break
        }
        Log "[Jenkins] Jenkins가 아직 준비되지 않았습니다... ($i/$retries)"
        Start-Sleep -Seconds 10
    }

    if (-not $ready) {
        ErrorExit "Jenkins가 시간 내에 준비되지 않았습니다."
    }
}

function Configure-JenkinsUser() {
    Log "[Jenkins] 사용자 구성 시작"

    # Jenkins가 완전히 시작될 때까지 대기
    $retries = 30
    $ready = $false
    for ($i = 0; $i -lt $retries; $i++) {
        try {
            $status = Invoke-Remote "curl -s -o /dev/null -w '%{http_code}' http://localhost:$JenkinsPort/login"
            if ($status -eq "200" -or $status -eq "403") {
                $ready = $true
                break
            }
        }
        catch {}

        Log "Jenkins가 아직 준비되지 않았습니다. 10초 후 다시 시도합니다. ($i/$retries)"
        Start-Sleep -Seconds 10
    }

    if (-not $ready) {
        Log "[Jenkins] 시간 초과: Jenkins UI에 접근할 수 없습니다. 수동 설정이 필요할 수 있습니다."
        return
    }

    # 초기 비밀번호 가져오기
    Log "[Jenkins] 초기 비밀번호 확인 중..."
    $initialPassword = Invoke-Remote "sudo cat /var/lib/jenkins/secrets/initialAdminPassword 2>/dev/null || echo ''"

    if (-not $initialPassword) {
        Log "[Jenkins] 초기 비밀번호를 찾을 수 없습니다. 이미 초기 설정이 완료되었거나 파일 위치가 다를 수 있습니다."

        # 대체 방법: 환경 변수로 설정된 비밀번호를 사용해 로그인 시도
        Log "[Jenkins] 제공된 비밀번호로 로그인을 시도합니다..."
        $loginResult = Invoke-Remote "curl -s -I -u admin:$JenkinsPassword http://localhost:$JenkinsPort/api/json"

        if ($loginResult -match "200 OK") {
            Log "[Jenkins] 제공된 비밀번호로 로그인 성공. 추가 설정이 필요하지 않습니다."
            return
        }
        else {
            Log "[Jenkins] 제공된 비밀번호로 로그인 실패. 웹 UI를 통해 초기 설정을 완료해주세요."
            Log "[Jenkins] URL: http://$env:EC2_HOST:$JenkinsPort"
            return
        }
    }

    Log "[Jenkins] 초기 비밀번호 찾음: $initialPassword"

    # 초기 설정 건너뛰기 시도
    Log "[Jenkins] 초기 설정 마법사 건너뛰기 시도..."
    Invoke-Remote "curl -s -X POST -d 'script=jenkins.model.Jenkins.instance.setInstallState(jenkins.install.InstallState.INITIAL_SETUP_COMPLETED)' http://localhost:$JenkinsPort/scriptText --user admin:$initialPassword"

    # 새 관리자 비밀번호 설정
    Log "[Jenkins] 새 관리자 비밀번호 설정 중..."

    # Groovy 스크립트 생성
    Log "[Jenkins] 비밀번호 변경 스크립트 생성..."
    Invoke-Remote @"
cat > /tmp/change_password.groovy << 'EOL'
import jenkins.model.*
import hudson.security.*

def instance = Jenkins.getInstance()
def hudsonRealm = new HudsonPrivateSecurityRealm(false)
hudsonRealm.createAccount('admin', '$JenkinsPassword')
instance.setSecurityRealm(hudsonRealm)
instance.save()
println('Admin user created with new password')
EOL
"@

    # Groovy 스크립트 실행
    Log "[Jenkins] 비밀번호 변경 스크립트 실행..."
    $changeResult = Invoke-Remote "java -jar $CliJarPath -s http://localhost:$JenkinsPort -auth admin:$initialPassword groovy = < /tmp/change_password.groovy"

    if ($changeResult -match "Admin user created") {
        Log "[Jenkins] 관리자 비밀번호 변경 성공: $changeResult"
    }
    else {
        Log "[Jenkins] 관리자 비밀번호 변경 시도 결과: $changeResult"
        Log "[Jenkins] 비밀번호 변경에 실패했을 수 있습니다. 웹 UI를 통해 직접 설정해주세요."
    }

    # 인증 확인
    Log "[Jenkins] 새 비밀번호로 인증 확인 중..."
    $authCheck = Invoke-Remote "curl -s -I -u admin:$JenkinsPassword http://localhost:$JenkinsPort/api/json"

    if ($authCheck -match "200 OK") {
        Log "[Jenkins] 새 관리자 비밀번호로 인증 성공"
    }
    else {
        Log "[Jenkins] 새 관리자 비밀번호로 인증 실패: $authCheck"
        Log "[Jenkins] 웹 UI를 통해 직접 초기 설정을 완료해주세요."
    }

    Log "[Jenkins] 사용자 구성 완료"
}

function Configure-JenkinsTools() {
    Log "[Jenkins] JDK 및 NodeJS 도구 설정 시작..."

    # JDK 설정 Groovy 스크립트
    $jdkGroovy = @"
import jenkins.model.*
import hudson.model.*
import hudson.tools.*
import hudson.plugins.jdk_tool.*

def jenkins = Jenkins.getInstance()
def descriptor = jenkins.getDescriptor(JDK.class)
def installations = descriptor.getInstallations()

// 기존 JDK17 설치 확인 및 제거
def jdk17Exists = false
def newInstallations = []
for (inst in installations) {
    if (inst.getName() == "JDK17") {
        jdk17Exists = true
    } else {
        newInstallations.add(inst)
    }
}

// JDK17이 없으면 추가
if (!jdk17Exists) {
    def installer = new JDKInstaller("jdk-17", true)
    def installProps = new InstallSourceProperty([installer])
    def jdk17 = new JDK("JDK17", null, [installProps])
    newInstallations.add(jdk17)

    descriptor.setInstallations(newInstallations.toArray(new JDK[newInstallations.size()]))
    jenkins.save()
    println("JDK17 설정이 추가되었습니다.")
} else {
    println("JDK17 설정이 이미 존재합니다.")
}
"@

    # NodeJS 설정 Groovy 스크립트
    $nodeJSGroovy = @"
import jenkins.model.*
import hudson.tools.*
import jenkins.plugins.nodejs.tools.*

def jenkins = Jenkins.getInstance()
def descriptor = jenkins.getDescriptorByType(NodeJSInstallation.DescriptorImpl.class)
def installations = descriptor.getInstallations()

// 기존 NodeJS 설치 확인 및 제거
def nodeJSExists = false
def newInstallations = []
for (inst in installations) {
    if (inst.getName() == "nodejs") {
        nodeJSExists = true
    } else {
        newInstallations.add(inst)
    }
}

// NodeJS가 없으면 추가
if (!nodeJSExists) {
    def installer = new NodeJSInstaller("16.17.0", "", NodeJSInstaller.NodeJSInstallerId.DEFAULT)
    def installProps = new InstallSourceProperty([installer])
    def nodeJS = new NodeJSInstallation("nodejs", "", [installProps])
    newInstallations.add(nodeJS)

    descriptor.setInstallations(newInstallations.toArray(new NodeJSInstallation[newInstallations.size()]))
    jenkins.save()
    println("NodeJS 설정이 추가되었습니다.")
} else {
    println("NodeJS 설정이 이미 존재합니다.")
}
"@

    # 임시 파일에 저장
    $tempJDKScript = "$env:TEMP\jdk_config.groovy"
    $tempNodeJSScript = "$env:TEMP\nodejs_config.groovy"

    $jdkGroovy | Out-File -FilePath $tempJDKScript -Encoding utf8
    $nodeJSGroovy | Out-File -FilePath $tempNodeJSScript -Encoding utf8

    # 원격 서버로 업로드
    Upload-File -localPath $tempJDKScript -remotePath "/tmp/jdk_config.groovy"
    Upload-File -localPath $tempNodeJSScript -remotePath "/tmp/nodejs_config.groovy"

    # Jenkins CLI를 통해 실행
    $jdkResult = Invoke-Remote "java -jar $CliJarPath -s http://localhost:$JenkinsPort -auth admin:$JenkinsPassword groovy = < /tmp/jdk_config.groovy"
    Log "[Jenkins] JDK 설정 결과: $jdkResult"

    $nodeResult = Invoke-Remote "java -jar $CliJarPath -s http://localhost:$JenkinsPort -auth admin:$JenkinsPassword groovy = < /tmp/nodejs_config.groovy"
    Log "[Jenkins] NodeJS 설정 결과: $nodeResult"

    Log "[Jenkins] 도구 설정 완료"
}

function Setup-SecurityOptions() {
    $groovyScript = @"
import jenkins.model.*
import hudson.security.*

def instance = Jenkins.getInstance()

def strategy = new hudson.security.FullControlOnceLoggedInAuthorizationStrategy()
strategy.setAllowAnonymousRead(false)
instance.setAuthorizationStrategy(strategy)

instance.save()
"@
    $tempFile = "$env:TEMP\setup_security.groovy"
    $groovyScript | Out-File -FilePath $tempFile -Encoding utf8
    Upload-File -localPath $tempFile -remotePath "/tmp/setup_security.groovy"

    Invoke-Remote "java -jar $CliJarPath -s http://localhost:$JenkinsPort -auth admin:$JenkinsPassword groovy = < /tmp/setup_security.groovy"
    Log "보안 설정 완료"
}

function Register-GitCredentials {
    param (
        [string]$provider,
        [string]$token,
        [string]$cred_id
    )

    $xml = @"
<com.cloudbees.plugins.credentials.impl.StringCredentialsImpl>
  <scope>GLOBAL</scope>
  <id>$cred_id</id>
  <description>$provider token</description>
  <secret>$token</secret>
</com.cloudbees.plugins.credentials.impl.StringCredentialsImpl>
"@
    $tempPath = "$env:TEMP\${cred_id}.xml"
    $xml | Out-File -FilePath $tempPath -Encoding utf8
    Upload-File -localPath $tempPath -remotePath "/tmp/${cred_id}.xml"

    Invoke-Remote "java -jar $CliJarPath -s http://localhost:$JenkinsPort -auth admin:$JenkinsPassword create-credentials-by-xml system::system::jenkins _ < /tmp/${cred_id}.xml"

    Log "$provider 자격 증명 등록 완료: $cred_id"
}

function Generate-JobConfig($repo_url, $cred_id, $provider, $project_name) {
    $owner = [System.IO.Path]::GetFileName([System.IO.Path]::GetDirectoryName($repo_url))
    $repo = [System.IO.Path]::GetFileNameWithoutExtension($repo_url)
    $serverUrl = if ($provider -eq "gitlab") { "https://gitlab.com" } else { "https://github.com" }

    $uuid = [guid]::NewGuid().ToString()
    $pluginClass = if ($provider -eq "gitlab") {
        "io.jenkins.plugins.gitlabbranchsource.GitLabSCMSource"
    } else {
        "org.jenkinsci.plugins.github_branch_source.GitHubSCMSource"
    }

    $pluginName = if ($provider -eq "gitlab") {
        "gitlab-branch-source@718.v40b_5f0e67cd3"
    } else {
        "github-branch-source@1742.va_95fca_e5a_89c"
    }

    $xml = @"
<?xml version='1.1' encoding='UTF-8'?>
<org.jenkinsci.plugins.workflow.multibranch.WorkflowMultiBranchProject plugin="workflow-multibranch@2.26">
  <description>${project_name} 멀티브랜치 파이프라인</description>
  <displayName>${project_name}</displayName>
  <sources class="jenkins.branch.MultiBranchProject\\$BranchSourceList" plugin="branch-api@2.1046.v0ca_37783ecc5">
    <data>
      <jenkins.branch.BranchSource>
        <source class="$pluginClass" plugin="$pluginName">
          <id>$uuid</id>
          <credentialsId>$cred_id</credentialsId>
          <repoOwner>$owner</repoOwner>
          <repository>$repo</repository>
          <serverUrl>$serverUrl</serverUrl>
        </source>
        <strategy class="jenkins.branch.DefaultBranchPropertyStrategy">
          <properties class="empty-list"/>
        </strategy>
      </jenkins.branch.BranchSource>
    </data>
    <owner class="org.jenkinsci.plugins.workflow.multibranch.WorkflowMultiBranchProject" reference="../../.."/>
  </sources>
  <factory class="org.jenkinsci.plugins.workflow.multibranch.WorkflowBranchProjectFactory">
    <owner class="org.jenkinsci.plugins.workflow.multibranch.WorkflowMultiBranchProject" reference="../.."/>
    <scriptPath>Jenkinsfile</scriptPath>
  </factory>
</org.jenkinsci.plugins.workflow.multibranch.WorkflowMultiBranchProject>
"@
    $path = "$env:TEMP\${project_name}-job.xml"
    $xml | Out-File -FilePath $path -Encoding utf8
    Upload-File -localPath $path -remotePath "/home/ubuntu/$project_name/${project_name}-job.xml"
}

function Create-JobInJenkins($job_name) {
    $job_dir = "/home/ubuntu/$job_name"
    $config_xml = "$job_dir/${job_name}-job.xml"
    Invoke-Remote "java -jar $CliJarPath -s http://localhost:$JenkinsPort -auth admin:$JenkinsPassword create-job '$job_name' < $config_xml"
    Log "$job_name Job 생성 완료"
}