# ========================================================
# register_gitlab_pipeline.ps1
# GitLab based Jenkins pipeline automatic registration script (PowerShell)
# ========================================================
# ========================================================
# Parameter parsing
# ========================================================
param (
    [string]$git_token,
    [string]$git_credentials_id,
    [string]$git_personal_token,
    [string]$git_personal_credentials_id,
    [string]$git_username,
    [string]$git_repo_url,
    [string]$jenkins_job_name
)

# Script path
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$webhook_secret = [guid]::NewGuid().ToString()
$webhook_creds_id = "webhook_token"

. "$ScriptDir\jenkins_configuration.ps1"

# Define all required functions directly
# SSH command execution function
function Invoke-Remote
{
    param (
        [string]$cmd,
        [switch]$Silent,
        [int]$TimeoutSeconds = 10  # 10 seconds timeout default
    )

    if (-not $Silent)
    {
        Write-Host "Running command: $cmd"
    }

    try
    {
        # Temp output file path
        $outputFile = "$env:TEMP\ssh_output_$( Get-Random ).txt"

        # Execute command
        $process = Start-Process -FilePath "ssh" -ArgumentList "-i `"$env:PEM_PATH`" -o StrictHostKeyChecking=no -o ConnectTimeout=5 ubuntu@$env:EC2_HOST `"$cmd`"" -NoNewWindow -PassThru -RedirectStandardOutput $outputFile

        # Wait with timeout
        $processExited = $process.WaitForExit($TimeoutSeconds * 1000)

        if (-not $processExited)
        {
            Write-Host "Command execution timed out ($TimeoutSeconds seconds)."
            Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue
            return "TIMEOUT"
        }

        # Read results
        if (Test-Path $outputFile)
        {
            $output = Get-Content $outputFile -Raw -ErrorAction SilentlyContinue
            Remove-Item $outputFile -Force -ErrorAction SilentlyContinue
            return $output
        }

        return $null
    }
    catch
    {
        Write-Host "SSH command execution error: $_"
        return $null
    }
}

# File upload function
function Upload-File
{
    param (
        [string]$localPath,
        [string]$remotePath,
        [int]$TimeoutSeconds = 15  # 15 seconds timeout
    )

    Write-Host "File upload: $localPath -> $remotePath"

    # Direct scp command execution
    $remoteDestination = "ubuntu@$env:EC2_HOST`:$remotePath"
    $scpCommand = "scp -i `"$env:PEM_PATH`" -o StrictHostKeyChecking=no -o ConnectTimeout=5 `"$localPath`" `"$remoteDestination`""
    Write-Host "Executing command: $scpCommand"

    try
    {
        # Use PowerShell built-in command
        $process = Start-Process -FilePath "scp" -ArgumentList "-i `"$env:PEM_PATH`" -o StrictHostKeyChecking=no -o ConnectTimeout=5 `"$localPath`" `"$remoteDestination`"" -NoNewWindow -PassThru -Wait -ErrorAction Stop

        if ($process.ExitCode -eq 0)
        {
            Write-Host "File upload result: Success"
            Write-Host "File upload successful!"
            return $true
        }
        else
        {
            Write-Host "File upload failed: Exit code $( $process.ExitCode )"
            return $false
        }
    }
    catch
    {
        Write-Host "File upload failed: $_"
        return $false
    }
}

# SSH connection function
function Connect-SSHServer
{
    Write-Host "Attempting SSH connection..."
    Write-Host "PEM: $env:PEM_PATH"
    Write-Host "HOST: $env:EC2_HOST"

    try
    {
        # Simple test command to verify SSH connection
        $testCommand = "echo 'SSH Connection Test'"
        $process = Start-Process -FilePath "ssh" -ArgumentList "-i `"$env:PEM_PATH`" -o StrictHostKeyChecking=no -o ConnectTimeout=5 ubuntu@$env:EC2_HOST `"$testCommand`"" -NoNewWindow -PassThru -RedirectStandardOutput "$env:TEMP\ssh_test_output.txt"

        # Wait 5 seconds
        $processExited = $process.WaitForExit(5000)

        if (-not $processExited)
        {
            Write-Host "SSH connection timeout. Terminating process."
            Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue
            return $false
        }

        if (Test-Path "$env:TEMP\ssh_test_output.txt")
        {
            $output = Get-Content "$env:TEMP\ssh_test_output.txt" -Raw -ErrorAction SilentlyContinue
            Remove-Item "$env:TEMP\ssh_test_output.txt" -Force -ErrorAction SilentlyContinue

            if ($output -match "SSH Connection Test")
            {
                Write-Host "SSH connection successful!"
                return $true
            }
        }

        Write-Host "SSH connection failed: Unexpected response"
        return $false
    }
    catch
    {
        Write-Host "SSH connection error: $_"
        return $false
    }
}

# uuidgen installation check function
function Ensure-UUIDGenInstalled
{
    $timestamp = (Get-Date).ToString('yyyy-MM-dd HH:mm:ss')
    Write-Host "[$timestamp] [Required Tools] Checking uuidgen installation..."

    $result = Invoke-Remote "command -v uuidgen" -TimeoutSeconds 5

    if ($result)
    {
        Write-Host "[$timestamp] uuidgen is already installed."
        return $true
    }
    else
    {
        Write-Host "[$timestamp] uuidgen is not installed."
        Write-Host "[$timestamp] Skipping installation and continuing."
        return $true  # Don't treat as error and continue
    }
}

# Pipeline job configuration generation function
function Generate-PipelineJobConfig
{
    param (
        [string]$jobName,
        [string]$remoteDir,
        [string]$jenkinsfilePath,
        [string]$webhookSecret
    )

    Write-Host "Job info - Name: $jobName, Directory: $remoteDir, Jenkinsfile path: $jenkinsfilePath"

    # Variable validation and default values
    if ( [string]::IsNullOrEmpty($jobName))
    {
        throw "Jenkins Job name not specified."
    }

    if ( [string]::IsNullOrEmpty($remoteDir))
    {
        $remoteDir = "/home/ubuntu/$jobName"
        Write-Host "Remote directory path is empty, setting default value: $remoteDir"
    }

    if ( [string]::IsNullOrEmpty($jenkinsfilePath))
    {
        $jenkinsfilePath = "$remoteDir/Jenkinsfile"
        Write-Host "Jenkinsfile path is empty, setting default value: $jenkinsfilePath"
    }

    # Create remote directory
    Invoke-Remote "mkdir -p '$remoteDir'" -TimeoutSeconds 5

    # Pipeline XML file path
    $remoteJobPath = "$remoteDir/${jobName}-job.xml"

    # Read Jenkinsfile content from remote server
    $jenkinsFileContent = Invoke-Remote "cat '$jenkinsfilePath'" -TimeoutSeconds 5

    # Check if Jenkinsfile is empty
    if ( [string]::IsNullOrWhiteSpace($jenkinsFileContent))
    {
        Write-Host "Remote Jenkinsfile is empty or unreadable. Using default pipeline script."
        $jenkinsFileContent = @"
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
    }
    else
    {
        Write-Host "Successfully read remote Jenkinsfile content."
    }

    # Escape XML special characters - use explicit strings rather than actual special characters
#    $escapedContent = $jenkinsFileContent.Replace("&", "&amp;").Replace("<", "&lt;").Replace(">", "&gt;").Replace('"', "&quot;").Replace("'", "&apos;")

    # Create Jenkins Job XML - use remote Jenkinsfile content (with proper escaping)
    $jobXml = @"
<?xml version='1.1' encoding='UTF-8'?>
<flow-definition plugin="workflow-job@2.40">
  <description>${jobName} Pipeline</description>
  <keepDependencies>false</keepDependencies>
  <definition class="org.jenkinsci.plugins.workflow.cps.CpsFlowDefinition" plugin="workflow-cps@2.94">
    <script><![CDATA[
$jenkinsFileContent
]]></script>
    <sandbox>true</sandbox>
  </definition>
  <triggers>
    <com.dabsquared.gitlabjenkins.GitLabPushTrigger plugin="gitlab-plugin@1.9.8">
      <spec></spec>
      <triggerOnPush>true</triggerOnPush>
      <triggerOnMergeRequest>false</triggerOnMergeRequest>
      <triggerOpenMergeRequestOnPush>null</triggerOpenMergeRequestOnPush>
      <triggerOnNoteRequest>false</triggerOnNoteRequest>
      <noteRegex></noteRegex>
      <ciSkip>false</ciSkip>
      <setBuildDescription>true</setBuildDescription>
      <addNoteOnMergeRequest>false</addNoteOnMergeRequest>
      <addCiMessage>false</addCiMessage>
      <addVoteOnMergeRequest>false</addVoteOnMergeRequest>
      <branchFilterType>All</branchFilterType>
      <includeBranches></includeBranches>
      <excludeBranches></excludeBranches>
      <secretToken>$webhookSecret</secretToken>
    </com.dabsquared.gitlabjenkins.GitLabPushTrigger>
  </triggers>
  <disabled>false</disabled>
</flow-definition>
"@

    # Create temporary file
    $tempXmlPath = "$env:TEMP\${jobName}-job.xml"
    $jobXml | Out-File -FilePath $tempXmlPath -Encoding utf8

    # Upload to remote server
    Write-Host "Uploading Jenkins Job XML file: $remoteJobPath"
    try
    {
        # Upload file
        $uploadSuccess = Upload-File -localPath $tempXmlPath -remotePath $remoteJobPath

        if (-not $uploadSuccess)
        {
            throw "File upload failed"
        }

        # Check if file was successfully uploaded
        Write-Host "Checking file existence..."
        try
        {
            # Simple ls command to check file existence
            $checkResult = Invoke-Remote "ls -la '$remoteJobPath'" -TimeoutSeconds 5

            if ($checkResult -and $checkResult -match $jobName)
            {
                Write-Host "Jenkins Job XML creation complete: $remoteJobPath"
            }
            else
            {
                Write-Host "Warning: Unable to verify file existence. Continuing anyway."
            }
        }
        catch
        {
            Write-Host "Warning: Error while checking file existence: $_"
            Write-Host "Continuing anyway."
        }
    }
    catch
    {
        Write-Host "XML file upload failed: $_"
        throw "Jenkins Job XML file upload failed: $_"
    }
    finally
    {
        if (Test-Path $tempXmlPath)
        {
            Remove-Item $tempXmlPath -Force -ErrorAction SilentlyContinue
        }
    }
}

# Load .env file
$homeDir = [Environment]::GetFolderPath("UserProfile")
$envPath = "$homeDir\.devpilot\.env"
if (Test-Path $envPath)
{
    Get-Content $envPath | ForEach-Object {
        if ($_ -match '^\s*([^#][^=]+)=(.+)$')
        {
            $key = $matches[1].Trim()
            $value = $matches[2].Trim()
            Set-Item -Path "Env:$key" -Value $value
        }
    }
    Write-Host "[Environment Variables] .env file loaded: $envPath"
}
else
{
    Write-Host "[Error] Environment file does not exist: $envPath"
    exit 1
}

# Parameter validation
if (-not $env:JENKINS_PASSWORD)
{
    throw "JENKINS_PASSWORD is not set."
}
if (-not $git_token)
{
    throw "--git-token is required."
}
if (-not $git_credentials_id)
{
    throw "--git-credentials-id is required."
}
if (-not $git_repo_url)
{
    throw "--git-repo-url is required."
}

# Set Jenkins Job name
if (-not $jenkins_job_name)
{
    # Try to extract name from Git repository URL
    $jenkins_job_name = $git_repo_url -replace '.*[:/]([^/]+/[^/]+)\.git$', '$1' -replace '/', '-'
    Write-Host "Jenkins Job name is empty, setting from Git repository name: $jenkins_job_name"

    # If still empty, set a default value
    if (-not $jenkins_job_name -or $jenkins_job_name -eq $git_repo_url)
    {
        $jenkins_job_name = "jenkins-job-$( Get-Date -Format 'yyyyMMdd-HHmmss' )"
        Write-Host "Could not extract Git repository name, setting automatically generated name: $jenkins_job_name"
    }
}

Write-Host "Final Jenkins Job name: $jenkins_job_name"

# ========================================================
# Server configuration (based on environment variables)
# ========================================================
$Server = @{
    pem_path = $env:PEM_PATH
    host = $env:EC2_HOST
    jenkins_port = $env:JENKINS_PORT
    config_dir = $env:CONFIG_DIR
}

# SSH connection
Connect-SSHServer

# Ensure uuidgen is installed
Ensure-UUIDGenInstalled

$remoteGroovyDir = "/tmp/jenkins_groovy"

# === GitLab API Token Credential 등록 ===
$gitlabApiTokenGroovy = "$ScriptDir\gitlab_api_token.groovy"
$gitlabPersonalTokenGroovy = "$ScriptDir\gitlab_personal_token.groovy"
$gitlabAuthTokenGroovy = "$ScriptDir\username_password.groovy"
$envFileGroovy = "$ScriptDir\register_env_file.groovy"

$remoteApiTokenGroovy = "$remoteGroovyDir/gitlab_api_token.groovy"
$remotePersonalTokenGroovy = "$remoteGroovyDir/gitlab_personal_token.groovy"
$remoteAuthTokenGroovy = "$remoteGroovyDir/username_password.groovy"
$remoteEnvFileGroovy = "$remoteGroovyDir/register_env_file.groovy"

Upload-File -localPath $gitlabApiTokenGroovy -remotePath $remoteApiTokenGroovy
Upload-File -localPath $gitlabPersonalTokenGroovy -remotePath $remotePersonalTokenGroovy
Upload-File -localPath $gitlabAuthTokenGroovy -remotePath $remoteAuthTokenGroovy
Upload-File -localPath $envFileGroovy -remotePath $remoteEnvFileGroovy

$gitlabApiTokenCmd = "java -jar /tmp/jenkins-cli.jar -s http://localhost:$($Server.jenkins_port) -auth admin:$env:JENKINS_PASSWORD groovy = < $remoteApiTokenGroovy $git_credentials_id $git_token"
Invoke-Remote $gitlabApiTokenCmd

$git_personal_desc = "gitlab_personal_token"
$gitlabPersonalTokenCmd = "java -jar /tmp/jenkins-cli.jar -s http://localhost:$($Server.jenkins_port) -auth admin:$env:JENKINS_PASSWORD groovy = < $remotePersonalTokenGroovy $git_personal_credentials_id $git_personal_token $git_personal_desc"
Invoke-Remote $gitlabPersonalTokenCmd

$webhook_description = "webhook_token"
$gitlabWebhookTokenCmd = "java -jar /tmp/jenkins-cli.jar -s http://localhost:$($Server.jenkins_port) -auth admin:$env:JENKINS_PASSWORD groovy = < $remotePersonalTokenGroovy $webhook_creds_id $webhook_secret $webhook_description"
Invoke-Remote $gitlabWebhookTokenCmd

$auth_description = "gitlab_auth"
$gitlabAuthTokenCmd = "java -jar /tmp/jenkins-cli.jar -s http://localhost:$($Server.jenkins_port) -auth admin:$env:JENKINS_PASSWORD groovy = < $remoteAuthTokenGroovy $($git_personal_credentials_id)_auth $git_username $git_personal_token"
Invoke-Remote $gitlabAuthTokenCmd

$env_file_id = "env_file"
$env_file_path = "/var/lib/jenkins/workspace/$jenkins_job_name/.env"
$env_file_description = "Frontend .env file for VITE config"
$envFileCmd = "java -jar /tmp/jenkins-cli.jar -s http://localhost:$($Server.jenkins_port) -auth admin:$env:JENKINS_PASSWORD groovy = < $remoteEnvFileGroovy $env_file_id $env_file_path $env_file_description"
Invoke-Remote $envFileCmd

# 업로드할 Groovy 스크립트 경로 지정
$connectionGroovyPath = "$ScriptDir\gitlab_connection.groovy"
$serverGroovyPath = "$ScriptDir\gitlab_server.groovy"

# EC2 상 위치
$remoteConnectionGroovy = "$remoteGroovyDir/gitlab_connection.groovy"
$remoteServerGroovy = "$remoteGroovyDir/gitlab_server.groovy"

# 원격 디렉토리 생성
Invoke-Remote "mkdir -p $remoteGroovyDir"

# 파일 업로드
Upload-File -localPath $connectionGroovyPath -remotePath $remoteConnectionGroovy
Upload-File -localPath $serverGroovyPath -remotePath $remoteServerGroovy

# === Groovy 실행 ===
# GitLab Connection (args: gitlabUrl, credentialsId)
$gitlabUrl = "https://lab.ssafy.com"  # 또는 외부에서 전달받은 값 사용
$gitlabCredsId = $git_credentials_id  # 파라미터 그대로 사용
$connectionGroovyCmd = "java -jar /tmp/jenkins-cli.jar -s http://localhost:$($Server.jenkins_port) -auth admin:$env:JENKINS_PASSWORD groovy = < $remoteConnectionGroovy $gitlabUrl $gitlabCredsId $webhook_creds_id"
Invoke-Remote $connectionGroovyCmd

# GitLab Server (args: url, credentialsId, secretToken, hookRootUrl)
$webhookSecretId = "gitlab_webhook_secret"  # 실제 Credential ID
$gitlabPersCredsId = $git_personal_credentials_id
$hookRootUrl = "http://$( $Server.host ):$( $Server.jenkins_port )"  # Jenkins 접근 경로
# Groovy 실행 - GitLab 서버 등록
$serverGroovyCmd = "java -jar /tmp/jenkins-cli.jar -s http://localhost:$($Server.jenkins_port) -auth admin:$env:JENKINS_PASSWORD groovy = < $remoteServerGroovy $gitlabUrl $gitlabPersCredsId $webhookSecretId $hookRootUrl"
Invoke-Remote $serverGroovyCmd

# Create and register Jenkins Job XML
$project_dir = "/home/ubuntu/$jenkins_job_name"
$jenkinsfile_path = "$project_dir/Jenkinsfile"

# Pass parameters explicitly
Generate-PipelineJobConfig -jobName $jenkins_job_name -remoteDir $project_dir -jenkinsfilePath $jenkinsfile_path -webhookSecret $webhook_secret

# Create or update Jenkins Job based on existence
$jobExistsCheck = Invoke-Remote "java -jar /tmp/jenkins-cli.jar -s http://localhost:$( $Server.jenkins_port ) -auth admin:$env:JENKINS_PASSWORD get-job '$jenkins_job_name'" -Silent -TimeoutSeconds 5

if ($jobExistsCheck -and $jobExistsCheck -notmatch "ERROR: No such job")
{
    Write-Host "Job already exists, using update-job instead."
    $updateCmd = "java -jar /tmp/jenkins-cli.jar -s http://localhost:$( $Server.jenkins_port ) -auth admin:$env:JENKINS_PASSWORD update-job '$jenkins_job_name' < $project_dir/${jenkins_job_name}-job.xml"
    $updateResult = Invoke-Remote $updateCmd -TimeoutSeconds 15

    if ($updateResult -and $updateResult -match "ERROR")
    {
        Write-Host "Warning: Error occurred during job update: $updateResult"
    }
    else
    {
        Write-Host "Job update successful!"
    }
}
else
{
    $createJobCmd = "java -jar /tmp/jenkins-cli.jar -s http://localhost:$( $Server.jenkins_port ) -auth admin:$env:JENKINS_PASSWORD create-job '$jenkins_job_name' < $project_dir/${jenkins_job_name}-job.xml"
    Write-Host "Job creation command: $createJobCmd"

    $createJobResult = Invoke-Remote $createJobCmd -TimeoutSeconds 15

    if ($createJobResult -and $createJobResult -match "ERROR")
    {
        Write-Host "Warning: Error occurred during job creation: $createJobResult"
    }
    else
    {
        Write-Host "Job creation successful!"
    }
}

Write-Host "Jenkins Job registration complete! Moving to GitLab Webhook registration."
Write-Host "[DEBUG] gitlab token: ${git_token}"

# Handle webhook registration separately or simplify
try {
    & "$ScriptDir\register_gitlab_webhook.ps1" `
      -git_token "$git_token" `
      -git_repo_url "$git_repo_url" `
      -jenkins_url "http://$( $Server.host ):$( $Server.jenkins_port )" `
      -webhook_secret "$( $webhook_secret )" `
      -jenkins_job_name "$jenkins_job_name" `
      -credentials_id "$git_personal_credentials_id" `
      -ErrorAction SilentlyContinue
}
catch
{
    Write-Host "Warning: Error occurred during GitLab Webhook registration: $_"
    Write-Host "Jenkins Job registration is complete."
}

# Success message
Write-Host "All processes completed."