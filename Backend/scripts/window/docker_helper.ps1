# ========================================================
# docker_helper.ps1
# Docker 관리 및 레지스트리 로그인 PowerShell 스크립트
# ========================================================

param (
    [string]$PipelineName,
    [string]$GroovyFilePath = "",
    [string]$BuildNumber = "lastBuild",
    [switch]$Create,
    [switch]$Run,
    [switch]$Status,
    [switch]$List,
    [string]$DockerRegistry = "",
    [string]$DockerUser = "",
    [string]$DockerPassword = ""
)

# Load environment
$envPath = "$HOME\.devpilot\.env"
if (-not (Test-Path $envPath))
{
    throw "❌ .env 파일이 없습니다: $envPath"
}
Get-Content $envPath | ForEach-Object {
    if ($_ -match "^(.*?)=(.*)$")
    {
        $key = $matches[1]
        $value = $matches[2]
        Set-Item -Path "env:$key" -Value $value
    }
}

# EC2 접속 변수
$PemPath = $env:PEM_PATH
$EC2Host = $env:EC2_HOST
$JenkinsPort = $env:JENKINS_PORT
$JenkinsPassword = $env:JENKINS_PASSWORD

function Invoke-Remote($command)
{
    ssh -i $PemPath -o StrictHostKeyChecking=no "ubuntu@$EC2Host" $command
}

function Upload-File($localPath, $remotePath)
{
    $remoteDestination = "ubuntu@${EC2Host}:${remotePath}"
    scp -i $PemPath -o StrictHostKeyChecking=no $localPath $remoteDestination
    if ($LASTEXITCODE -ne 0)
    {
        throw "❌ 파일 업로드 실패: $localPath"
    }
}

function Log($msg)
{
    Write-Host "[INFO] $msg"
}

function Create-Pipeline()
{
    Log "파이프라인 생성 준비 중: $PipelineName"

    $remotePath = "/tmp/${PipelineName}_create_pipeline.groovy"
    Upload-File -localPath $GroovyFilePath -remotePath $remotePath

    Invoke-Remote "java -jar jenkins-cli.jar -s http://localhost:$JenkinsPort -auth admin:$JenkinsPassword groovy = < $remotePath"
    Invoke-Remote "rm -f $remotePath"

    Log "파이프라인 생성 완료: $PipelineName"
}

function Run-Pipeline()
{
    Log "파이프라인 실행: $PipelineName"
    Invoke-Remote "curl -X POST http://localhost:$JenkinsPort/job/$PipelineName/build --user admin:$JenkinsPassword"
}

function Check-BuildStatus()
{
    Log "빌드 상태 확인: $PipelineName #$BuildNumber"
    Invoke-Remote "curl -s http://localhost:$JenkinsPort/job/$PipelineName/$BuildNumber/api/json --user admin:$JenkinsPassword | grep result"
}

function List-Pipelines()
{
    Log "파이프라인 목록 조회"
    Invoke-Remote "curl -s http://localhost:$JenkinsPort/api/json?tree=jobs[name] --user admin:$JenkinsPassword | grep name"
}

function Docker-RegistryLogin()
{
    Log "Docker 레지스트리 로그인 중: $DockerRegistry"
    Invoke-Remote "echo '$DockerPassword' | docker login $DockerRegistry -u $DockerUser --password-stdin"
    if ($LASTEXITCODE -eq 0)
    {
        Log "Docker 레지스트리 로그인 성공."
    }
    else
    {
        throw "Docker 레지스트리 로그인 실패."
    }
}

# 실행 분기
if ($Create)
{
    if (-not $GroovyFilePath)
    {
        throw "Groovy 파일 경로가 필요합니다."
    }
    Create-Pipeline
}
elseif ($Run)
{
    Run-Pipeline
}
elseif ($Status)
{
    Check-BuildStatus
}
elseif ($List)
{
    List-Pipelines
}
elseif ($DockerRegistry -and $DockerUser -and $DockerPassword)
{
    Docker-RegistryLogin
}
else
{
    Write-Host "⚠️ 사용 방법: "
    Write-Host "  -Create -PipelineName xxx -GroovyFilePath xxx"
    Write-Host "  -Run -PipelineName xxx"
    Write-Host "  -Status -PipelineName xxx [-BuildNumber N]"
    Write-Host "  -List"
    Write-Host "  -DockerRegistry docker.io -DockerUser xxx -DockerPassword yyy"
}