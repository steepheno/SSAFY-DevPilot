# ========================================================
# jenkins_configuration.ps1
# Jenkins 설정 자동화 PowerShell 버전
# ========================================================

# Jenkins CLI 경로 및 인증 정보
$JenkinsPort = $env:JENKINS_PORT
$JenkinsPassword = $env:JENKINS_PASSWORD
$CliJarPath = "/tmp/jenkins-cli.jar"

function Invoke-Remote($cmd) {
    ssh -i $env:PEM_PATH -o StrictHostKeyChecking=no "ubuntu@$env:EC2_HOST" $cmd
}

function Upload-File($localPath, $remotePath) {
    scp -i $env:PEM_PATH -o StrictHostKeyChecking=no $localPath "ubuntu@$env:EC2_HOST:$remotePath"
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
        "credentials:1254.vb_a_60f3e5df75",
        "plain-credentials:143.v1b_df8b_d3b_e48",
        "credentials-binding:657.v2b_19db_7d6e6d",
        "sse-gateway:1.28"
    )

    foreach ($plugin in $plugins) {
        Log "설치 중: $plugin"
        Invoke-Remote "java -jar $CliJarPath -s http://localhost:$JenkinsPort -auth admin:$initial_pw install-plugin $plugin"
    }

    Invoke-Remote "sudo systemctl restart jenkins"
    Log "[Jenkins] 플러그인 설치 완료"
}

function Configure-JenkinsUser() {
    if (-not $JenkinsPassword) { ErrorExit "--jenkins-password 인자가 필요합니다." }

    $initial_pw = Invoke-Remote "sudo cat /var/lib/jenkins/secrets/initialAdminPassword"

    $groovyScript = @"
import jenkins.model.*
import hudson.security.*

def instance = Jenkins.get()
def user = instance.getSecurityRealm().getUser("admin")
user.addProperty(hudson.security.HudsonPrivateSecurityRealm.Details.fromPlainPassword("$JenkinsPassword"))
instance.save()
println("✅ 비밀번호 변경 완료")
"@

    $tempFile = "$env:TEMP\change_password.groovy"
    $groovyScript | Out-File -FilePath $tempFile -Encoding utf8
    Upload-File -localPath $tempFile -remotePath "/tmp/change_password.groovy"

    Invoke-Remote "java -jar $CliJarPath -s http://localhost:$JenkinsPort -auth admin:$initial_pw groovy = < /tmp/change_password.groovy"

    Invoke-Remote "echo '$JenkinsPassword' | sudo tee /opt/jenkins_config/jenkins_user > /dev/null && sudo chmod 600 /opt/jenkins_config/jenkins_user"
    Log "[Jenkins] 사용자 비밀번호 설정 완료"

    Invoke-Remote "java -jar $CliJarPath -s http://localhost:$JenkinsPort -auth admin:$JenkinsPassword who-am-i"
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

function Register-GitCredentials($provider, $token, $cred_id) {
    $xml = """
<com.cloudbees.plugins.credentials.impl.StringCredentialsImpl>
  <scope>GLOBAL</scope>
  <id>$cred_id</id>
  <description>$provider token</description>
  <secret>$token</secret>
</com.cloudbees.plugins.credentials.impl.StringCredentialsImpl>
"""
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