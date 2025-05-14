# ========================================================
# jenkins_pipeline.ps1
# Jenkins 파이프라인 PowerShell 버전 (EC2 업로드 및 등록)
# ========================================================

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

function Create-JenkinsPipeline($localGroovyPath, $pipelineName) {
    Log "[Jenkins] 파이프라인 생성 준비 중: $pipelineName"
    $password = $env:JENKINS_PASSWORD

    $remoteGroovyPath = "/tmp/${pipelineName}_create_pipeline.groovy"
    Upload-File -localPath $localGroovyPath -remotePath $remoteGroovyPath

    Invoke-Remote "java -jar jenkins-cli.jar -s http://localhost:$($env:JENKINS_PORT) -auth admin:$password groovy = < $remoteGroovyPath"
    Invoke-Remote "rm -f $remoteGroovyPath"

    Log "[Jenkins] 파이프라인 생성 완료: $pipelineName"
}

function Generate-PipelineJobConfig($jobName, $remoteDir, $jenkinsfilePath) {
    $remoteJobPath = "$remoteDir/${jobName}-job.xml"

    # bash 스크립트 대신 직접 XML 생성 및 업로드
    $scriptContent = Get-Content $jenkinsfilePath -Raw
    $escapedScriptContent = [System.Security.SecurityElement]::Escape($scriptContent)

    $xml = @"
<?xml version='1.1' encoding='UTF-8'?>
<flow-definition plugin="workflow-job@2.40">
  <description>$jobName 파이프라인</description>
  <keepDependencies>false</keepDependencies>
  <definition class="org.jenkinsci.plugins.workflow.cps.CpsFlowDefinition" plugin="workflow-cps@2.94">
    <script>$escapedScriptContent</script>
    <sandbox>true</sandbox>
  </definition>
  <triggers/>
  <disabled>false</disabled>
</flow-definition>
"@

    $tempXmlPath = "$env:TEMP\${jobName}-job.xml"
    $xml | Out-File -FilePath $tempXmlPath -Encoding utf8
    Upload-File -localPath $tempXmlPath -remotePath $remoteJobPath
}

function Run-JenkinsPipeline($pipelineName) {
    Log "[Jenkins] 파이프라인 실행: $pipelineName"
    $password = $env:JENKINS_PASSWORD
    Invoke-Remote "curl -X POST http://localhost:$($env:JENKINS_PORT)/job/$pipelineName/build --user admin:$password"
}

function Check-BuildStatus($pipelineName, $buildNumber = "lastBuild") {
    Log "[Jenkins] 빌드 상태 확인: $pipelineName #$buildNumber"
    $password = $env:JENKINS_PASSWORD
    Invoke-Remote "curl -s http://localhost:$($env:JENKINS_PORT)/job/$pipelineName/$buildNumber/api/json --user admin:$password | grep 'result'"
}

function List-JenkinsPipelines() {
    Log "[Jenkins] 파이프라인 목록 조회"
    $password = $env:JENKINS_PASSWORD
    Invoke-Remote "curl -s http://localhost:$($env:JENKINS_PORT)/api/json?tree=jobs[name] --user admin:$password | grep 'name'"
}