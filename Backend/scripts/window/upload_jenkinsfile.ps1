# ========================================================
# upload_jenkinsfile.ps1
# Jenkinsfile 업로드 및 Jenkins Job 등록 (PowerShell 버전)
# ========================================================

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$EnvPath = "$HOME/.devpilot/.env"

# utils.ps1 및 ssh_connection.ps1 파일 로드 (경로가 정확한지 확인)
. "$ScriptDir/utils.ps1"
. "$ScriptDir/ssh_connection.ps1"
. "$ScriptDir/jenkins_pipeline.ps1"

if (Test-Path $EnvPath)
{
    Get-Content $EnvPath | ForEach-Object {
        if ($_ -match "^(.*?)=(.*)$")
        {
            $key, $value = $matches[1], $matches[2]
            Set-Item -Path "env:$key" -Value $value.Trim()  # Trim() 추가하여 공백 제거
        }
    }
}
else
{
    Write-Host "❌ 환경 파일을 찾을 수 없습니다: $EnvPath"
    exit 1
}

$Server = @{
    pem_path = $env:PEM_PATH
    host = $env:EC2_HOST.Trim()  # 공백 제거
    jenkins_port = $env:JENKINS_PORT
    config_dir = $env:CONFIG_DIR
}

Write-Host "환경 변수 확인:"
Write-Host "PEM_PATH: $( $Server.pem_path )"
Write-Host "EC2_HOST: $( $Server.host )"

# 인자 파싱
$LOCAL_PATH = $null
$TARGET_DIR = "/home/ubuntu/jenkinsfiles"
$JOB_NAME = $null

foreach ($arg in $args)
{
    if ($arg -like "--jenkinsfile-path=*")
    {
        $LOCAL_PATH = $arg -replace "--jenkinsfile-path=", ""
    }
    elseif ($arg -like "--remote-dir=*")
    {
        $TARGET_DIR = $arg -replace "--remote-dir=", ""
    }
    elseif ($arg -like "--job-name=*")
    {
        $JOB_NAME = $arg -replace "--job-name=", ""
    }
    else
    {
        Write-Host "⚠️ 알 수 없는 옵션: $arg"
    }
}

if (-not $LOCAL_PATH -or -not $JOB_NAME)
{
    throw "--jenkinsfile-path 와 --job-name 인자는 필수입니다."
}

# 로컬 파일 존재 확인
if (-not (Test-Path $LOCAL_PATH))
{
    Write-Host "❌ 로컬 파일이 존재하지 않습니다: $LOCAL_PATH"
    exit 1
}

$REMOTE_PATH = "$TARGET_DIR/Jenkinsfile"

# SSH 연결 및 Jenkinsfile 업로드
Write-Host "SSH 연결 테스트 중..."
Write-Host "PEM: $( $Server.pem_path )"
Write-Host "HOST: $( $Server.host )"

$sshCmd = "ssh -i `"$( $Server.pem_path )`" -o StrictHostKeyChecking=no -o ConnectTimeout=10 ubuntu@$( $Server.host ) echo 연결 성공"
$result = Invoke-Expression $sshCmd

if ($LASTEXITCODE -ne 0)
{
    Write-Host "❌ SSH 연결 실패: $LASTEXITCODE"
    exit 1
}
else
{
    Write-Host "SSH 연결 성공!"
}

# 원격 디렉토리 생성
$mkdirCmd = "ssh -i `"$( $Server.pem_path )`" -o StrictHostKeyChecking=no ubuntu@$( $Server.host ) `"mkdir -p $TARGET_DIR`""
Invoke-Expression $mkdirCmd

if ($LASTEXITCODE -ne 0)
{
    Write-Host "❌ 원격 디렉토리 생성 실패: $TARGET_DIR"
    exit 1
}

# 파일 업로드
Write-Host "로컬 파일 정보: $( Get-Item $LOCAL_PATH | Select-Object FullName, Length )"
$scpCmd = "scp -i `"$( $Server.pem_path )`" -o StrictHostKeyChecking=no `"$LOCAL_PATH`" ubuntu@$( $Server.host ):$REMOTE_PATH"
Write-Host "실행 명령어: $scpCmd"
Invoke-Expression $scpCmd

if ($LASTEXITCODE -ne 0)
{
    Write-Host "❌ Jenkinsfile 업로드 실패: $LOCAL_PATH → $REMOTE_PATH (코드: $LASTEXITCODE)"
    exit 1
}
else
{
    Write-Host "✅ Jenkinsfile 업로드 완료 → $REMOTE_PATH"
}

# Jenkins Job XML 생성 및 등록 (주석 해제 시 사용)
# Generate-PipelineJobConfig -JobName $JOB_NAME -RemoteDir $TARGET_DIR -JenkinsfilePath $REMOTE_PATH
# $RemoteJobXml = "$TARGET_DIR/$JOB_NAME-job.xml"
# Invoke-Ssh "java -jar /tmp/jenkins-cli.jar -s http://localhost:$($Server.jenkins_port) -auth admin:$env:JENKINS_PASSWORD create-job '$JOB_NAME' < $RemoteJobXml"
# Write-Host "✅ Jenkins Job 등록 완료: $JOB_NAME"