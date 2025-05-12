# ========================================================
# upload_jenkinsfile.ps1
# Jenkinsfile 업로드 및 Jenkins Job 등록 (PowerShell 버전)
# ========================================================

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$EnvPath = "$HOME/.devpilot/.env"

. "$ScriptDir/utils.ps1"
. "$ScriptDir/ssh_connection.ps1"
. "$ScriptDir/jenkins_pipeline.ps1"

if (Test-Path $EnvPath) {
    Get-Content $EnvPath | ForEach-Object {
        if ($_ -match "^(.*?)=(.*)$") {
            $key, $value = $matches[1], $matches[2]
            Set-Item -Path "env:$key" -Value $value
        }
    }
} else {
    Write-Host "❌ 환경 파일을 찾을 수 없습니다: $EnvPath"
    exit 1
}

$Server = @{
    pem_path     = $env:PEM_PATH
    host         = $env:EC2_HOST
    jenkins_port = $env:JENKINS_PORT
    config_dir   = $env:CONFIG_DIR
}

# 인자 파싱
$LOCAL_PATH = $null
$TARGET_DIR = "/home/ubuntu/jenkinsfiles"
$JOB_NAME = $null

foreach ($arg in $args) {
    if ($arg -like "--jenkinsfile-path=*") {
        $LOCAL_PATH = $arg -replace "--jenkinsfile-path=", ""
    } elseif ($arg -like "--remote-dir=*") {
        $TARGET_DIR = $arg -replace "--remote-dir=", ""
    } elseif ($arg -like "--job-name=*") {
        $JOB_NAME = $arg -replace "--job-name=", ""
    } else {
        Write-Host "⚠️ 알 수 없는 옵션: $arg"
    }
}

if (-not $LOCAL_PATH -or -not $JOB_NAME) {
    throw "--jenkinsfile-path 와 --job-name 인자는 필수입니다."
}

$REMOTE_PATH = "$TARGET_DIR/Jenkinsfile"

# SSH 연결 및 Jenkinsfile 업로드
Connect-SshServer
Invoke-Ssh "mkdir -p $TARGET_DIR"
Upload-File -LocalPath $LOCAL_PATH -RemotePath $REMOTE_PATH
Write-Host "✅ Jenkinsfile 업로드 완료 → $REMOTE_PATH"

# Jenkins Job XML 생성 및 등록 (주석 해제 시 사용)
# Generate-PipelineJobConfig -JobName $JOB_NAME -RemoteDir $TARGET_DIR -JenkinsfilePath $REMOTE_PATH
# $RemoteJobXml = "$TARGET_DIR/$JOB_NAME-job.xml"
# Invoke-Ssh "java -jar /tmp/jenkins-cli.jar -s http://localhost:$($Server.jenkins_port) -auth admin:$env:JENKINS_PASSWORD create-job '$JOB_NAME' < $RemoteJobXml"
# Write-Host "✅ Jenkins Job 등록 완료: $JOB_NAME"