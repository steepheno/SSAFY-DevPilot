# ========================================================
# jenkins_pipeline.ps1
# Jenkins 파이프라인 PowerShell 버전 (EC2 업로드 및 등록)
# ========================================================

function Invoke-Remote
{
    param (
        [string]$cmd,
        [switch]$Silent
    )

    if (-not $Silent)
    {
        Write-Host "실행 중인 명령: $cmd"
    }

    $result = ssh -i $env:PEM_PATH -o StrictHostKeyChecking=no "ubuntu@$env:EC2_HOST" $cmd
    return $result
}

function Upload-File
{
    param (
        [string]$localPath,
        [string]$remotePath
    )

    Write-Host "파일 업로드: $localPath -> $remotePath"

    # 직접 scp 명령 실행
    $remoteDestination = "ubuntu@$env:EC2_HOST`:$remotePath"
    $scpCommand = "scp -i `"$env:PEM_PATH`" -o StrictHostKeyChecking=no `"$localPath`" `"$remoteDestination`""
    Write-Host "실행 명령: $scpCommand"

    try
    {
        # PowerShell 내장 명령 사용
        $result = & scp -i "$env:PEM_PATH" -o StrictHostKeyChecking=no "$localPath" "$remoteDestination"
        Write-Host "파일 업로드 결과: $result"

        # 실패 시 대체 방법 시도
        if ($LASTEXITCODE -ne 0)
        {
            Write-Host "기본 방법 실패, 대체 방법 시도..."
            $pscp = "pscp.exe"  # PSCP가 PATH에 있는지 확인
            if (Get-Command $pscp -ErrorAction SilentlyContinue)
            {
                $pscpCommand = "$pscp -i `"$env:PEM_PATH`" -batch `"$localPath`" $remoteDestination"
                Write-Host "PSCP 명령: $pscpCommand"
                $result = Invoke-Expression $pscpCommand
                if ($LASTEXITCODE -ne 0)
                {
                    throw "PSCP 파일 업로드 실패: $result"
                }
            }
            else
            {
                # 직접 명령 실행
                $remotePathEscaped = $remotePath.Replace('"', '\"')
                $command = "ssh -i `"$env:PEM_PATH`" -o StrictHostKeyChecking=no ubuntu@$env:EC2_HOST `"cat > $remotePathEscaped`" < `"$localPath`""
                Write-Host "SSH cat 명령: $command"
                $result = Invoke-Expression $command
                if ($LASTEXITCODE -ne 0)
                {
                    throw "SSH cat 파일 업로드 실패: $result"
                }
            }
        }

        Write-Host "파일 업로드 성공!"
    }
    catch
    {
        Write-Host "모든 업로드 방법 실패: $_"
        throw "파일 업로드 실패: $_"
    }
}

function Generate-PipelineJobConfig
{
    param (
        [string]$jobName,
        [string]$remoteDir,
        [string]$jenkinsfilePath
    )

    Write-Host "Job 정보 - 이름: $jobName, 디렉토리: $remoteDir, Jenkinsfile 경로: $jenkinsfilePath"

    # 변수 확인 및 기본값 설정
    if ( [string]::IsNullOrEmpty($jobName))
    {
        throw "Jenkins Job 이름이 지정되지 않았습니다."
    }

    if ( [string]::IsNullOrEmpty($remoteDir))
    {
        $remoteDir = "/home/ubuntu/$jobName"
        Write-Host "원격 디렉토리 경로가 비어있어 기본값으로 설정합니다: $remoteDir"
    }

    if ( [string]::IsNullOrEmpty($jenkinsfilePath))
    {
        $jenkinsfilePath = "$remoteDir/Jenkinsfile"
        Write-Host "Jenkinsfile 경로가 비어있어 기본값으로 설정합니다: $jenkinsfilePath"
    }

    # 원격 디렉토리 생성
    Invoke-Remote "mkdir -p '$remoteDir'"

    # 파이프라인 XML 파일 경로
    $remoteJobPath = "$remoteDir/${jobName}-job.xml"

    # 기본 파이프라인 스크립트 - 특수문자 처리 주의
    $defaultPipelineScript = @"
pipeline {
    agent any
    stages {
        stage('Build') {
            steps {
                echo 'Building...'
            }
        }
        stage('Test') {
            steps {
                echo 'Testing...'
            }
        }
        stage('Deploy') {
            steps {
                echo 'Deploying...'
            }
        }
    }
}
"@

    # XML 특수문자 이스케이핑
    $escapedScript = [System.Web.HttpUtility]::HtmlEncode($defaultPipelineScript)

    # Jenkins Job XML 생성 - 태그 닫힘 확인
    $jobXml = @"
<?xml version='1.1' encoding='UTF-8'?>
<flow-definition plugin="workflow-job@2.40">
  <description>$jobName Pipeline</description>
  <keepDependencies>false</keepDependencies>
  <definition class="org.jenkinsci.plugins.workflow.cps.CpsFlowDefinition" plugin="workflow-cps@2.94">
    <script>$escapedScript</script>
    <sandbox>true</sandbox>
  </definition>
  <triggers/>
  <disabled>false</disabled>
</flow-definition>
"@

    # 임시 파일 생성
    $tempXmlPath = "$env:TEMP\${jobName}-job.xml"
    $jobXml | Out-File -FilePath $tempXmlPath -Encoding utf8

    # 원격 서버에 업로드
    Write-Host "Jenkins Job XML 파일 업로드 중: $remoteJobPath"
    try
    {
        # 원격 디렉토리가 확실히 존재하는지 확인
        Invoke-Remote "mkdir -p '$remoteDir'"

        # 파일 업로드
        Upload-File -localPath $tempXmlPath -remotePath $remoteJobPath

        # 파일이 성공적으로 업로드되었는지 확인
        $checkFile = Invoke-Remote "test -f '$remoteJobPath' && echo 'exists' || echo 'not_exists'"

        if ($checkFile -match "exists")
        {
            Write-Host "✅ Jenkins Job XML 생성 완료: $remoteJobPath"
        }
        else
        {
            throw "파일이 업로드되었지만 원격 서버에서 찾을 수 없습니다: $remoteJobPath"
        }
    }
    catch
    {
        Write-Host "❌ XML 파일 업로드 실패: $_"
        throw "Jenkins Job XML 파일 업로드 실패: $_"
    }
    finally
    {
        if (Test-Path $tempXmlPath)
        {
            Remove-Item $tempXmlPath -Force
        }
    }
}

function Create-JenkinsPipeline
{
    param (
        [string]$localGroovyPath,
        [string]$pipelineName
    )

    Write-Host "[Jenkins] 파이프라인 생성 준비 중: $pipelineName"
    $password = $env:JENKINS_PASSWORD

    $remoteGroovyPath = "/tmp/${pipelineName}_create_pipeline.groovy"
    Upload-File -localPath $localGroovyPath -remotePath $remoteGroovyPath

    Invoke-Remote "java -jar jenkins-cli.jar -s http://localhost:$( $env:JENKINS_PORT ) -auth admin:$password groovy = < $remoteGroovyPath"
    Invoke-Remote "rm -f $remoteGroovyPath"

    Write-Host "[Jenkins] 파이프라인 생성 완료: $pipelineName"
}

function Run-JenkinsPipeline
{
    param (
        [string]$pipelineName
    )

    Write-Host "[Jenkins] 파이프라인 실행: $pipelineName"
    $password = $env:JENKINS_PASSWORD
    Invoke-Remote "curl -X POST http://localhost:$( $env:JENKINS_PORT )/job/$pipelineName/build --user admin:$password"
}

function Check-BuildStatus
{
    param (
        [string]$pipelineName,
        [string]$buildNumber = "lastBuild"
    )

    Write-Host "[Jenkins] 빌드 상태 확인: $pipelineName #$buildNumber"
    $password = $env:JENKINS_PASSWORD
    Invoke-Remote "curl -s http://localhost:$( $env:JENKINS_PORT )/job/$pipelineName/$buildNumber/api/json --user admin:$password | grep 'result'"
}

function List-JenkinsPipelines
{
    Write-Host "[Jenkins] 파이프라인 목록 조회"
    $password = $env:JENKINS_PASSWORD
    Invoke-Remote "curl -s http://localhost:$( $env:JENKINS_PORT )/api/json?tree=jobs[name] --user admin:$password | grep 'name'"
}