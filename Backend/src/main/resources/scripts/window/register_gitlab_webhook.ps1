param(
    [string]$git_token,
    [string]$git_repo_url,
    [string]$jenkins_url,
    [string]$webhook_secret,
    [string]$jenkins_job_name,
    [string]$credentials_id = "gitlab_personal_token"
)

# 경로 설정
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$homeDir = [Environment]::GetFolderPath("UserProfile")
$envPath = "$homeDir\.devpilot\.env"

# 유틸 로드
. "$ScriptDir\utils.ps1"
. "$ScriptDir\ssh_connection.ps1"

# 인코딩 설정
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

# 기본값 설정
if (-Not $jenkins_url)
{
    $jenkins_url = "http://localhost:8080" # 기본 Jenkins URL
}

# .env 로드 (. $envPath ❌ => 직접 파싱 ✅)
if (-Not (Test-Path $envPath))
{
    Write-Host "ERROR: Environment file not found: $envPath"
    exit 1
}

Get-Content $envPath | ForEach-Object {
    if ($_ -match '^\s*([^#][^=]+)=(.+)$')
    {
        $key = $matches[1].Trim()
        $value = $matches[2].Trim()
        Set-Item -Path "Env:$key" -Value $value
    }
}
Write-Host "INFO: Environment variables loaded"

# 필수 인자 검사
if (-Not $git_token)
{
    throw "ERROR: --git-token is required"
}
if (-Not $git_repo_url)
{
    throw "ERROR: --git-repo-url is required"
}
if (-Not $jenkins_url)
{
    throw "ERROR: --jenkins-url is required"
}

# Webhook Secret 생성
if (-Not $webhook_secret) {
    throw "ERROR: --webhook-secret is required"
}
Write-Host "INFO: Webhook Secret: $webhook_secret"
Write-Host "DEBUG: Starting GitLab webhook registration process"

# GitLab 프로젝트 정보 추출
$repo_name = ($git_repo_url -split '/')[-1]
Write-Host "DEBUG: Repository name: $repo_name"
$repo_owner = ($git_repo_url -split '/')[3]

# GitLab API 호출 준비
$gitlab_api_url = "https://lab.ssafy.com/api/v4"
$search_url = "$gitlab_api_url/projects?search=$repo_name"
Write-Host "DEBUG: GitLab API URL: $gitlab_api_url"
Write-Host "DEBUG: Project search URL: $search_url"
Write-Host "DEBUG: Token length: $( $git_token.Length )"

try
{
    # GitLab Project ID 검색
    $response = Invoke-RestMethod -Uri $search_url -Headers @{ "PRIVATE-TOKEN" = $git_token } -Method Get -ErrorAction Stop
    Write-Host "DEBUG: API response received, projects count: $( $response.Count )"

    # 프로젝트 이름이 정확히 일치하는 항목 찾기
    $matchingProjects = $response | Where-Object { $_.path -eq $repo_name }
    Write-Host "DEBUG: Exact name matching projects count: $( $matchingProjects.Count )"

    # Project ID 설정
    $project_id = ($matchingProjects | Select-Object -First 1).id

    if ($project_id)
    {
        Write-Host "DEBUG: Project ID: $project_id"
    }
    else
    {
        Write-Host "DEBUG: No matching project found. Full response:"
        $response | ForEach-Object {
            Write-Host "  - ID: $( $_.id ), Path: $( $_.path ), Name: $( $_.name )"
        }
        throw "ERROR: GitLab Project ID lookup failed"
    }
}
catch
{
    Write-Host "ERROR: GitLab API call failed: $( $_.Exception.Message )"
    if ($_.Exception.Response)
    {
        $statusCode = $_.Exception.Response.StatusCode.value__
        $statusDescription = $_.Exception.Response.StatusDescription
        Write-Host "ERROR: Status code: $statusCode - $statusDescription"
    }
    throw "ERROR: GitLab API call failed"
}

# Webhook 등록 요청
$hook_url = "$jenkins_url/project/$jenkins_job_name"
Write-Host "DEBUG: Webhook URL: $hook_url"

# Webhook 설정 JSON 생성
$hook_body = @{
    url = "$hook_url"
    push_events = "$true"
    token = "$webhook_secret"
    enable_ssl_verification = "$false"
} | ConvertTo-Json -Depth 3

Write-Host "DEBUG: Webhook configuration JSON:"
Write-Host $hook_body

try
{
    # Webhook API 호출
    $webhook_api_url = "$gitlab_api_url/projects/$project_id/hooks"
    Write-Host "DEBUG: Webhook API URL: $webhook_api_url"

    $webhook_response = Invoke-RestMethod -Uri $webhook_api_url `
      -Method Post `
      -Headers @{
        "PRIVATE-TOKEN" = $git_token
        "Content-Type" = "application/json"
    } `
      -Body $hook_body `
      -ErrorAction Stop

    Write-Host "DEBUG: Webhook registration response: $( $webhook_response | ConvertTo-Json -Depth 3 )"
    Write-Host "SUCCESS: GitLab Webhook registration complete (ID: $( $webhook_response.id ))"
    Write-Host "INFO: Secret: $webhook_secret"
    Write-Host "INFO: URL: $hook_url"
}
catch
{
    Write-Host "ERROR: Webhook registration failed: $( $_.Exception.Message )"
    if ($_.Exception.Response)
    {
        $statusCode = $_.Exception.Response.StatusCode.value__
        $statusDescription = $_.Exception.Response.StatusDescription
        Write-Host "ERROR: Status code: $statusCode - $statusDescription"

        try
        {
            $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
            $responseBody = $reader.ReadToEnd()
            Write-Host "ERROR: Response body: $responseBody"
            $reader.Close()
        }
        catch
        {
            Write-Host "ERROR: Could not read response body"
        }
    }
}

# EC2에서 GitLab 자격 증명 설정 및 웹훅 설정
try
{
    # SSH 연결 설정 정보 출력
    $sshConfig = @{
        "PEM" = $env:SSH_PEM_PATH
        "HOST" = $env:SSH_HOST
        "USER" = $env:SSH_USER
        "PORT" = $env:SSH_PORT
    }
    Write-Host "INFO: SSH connection settings:"
    $sshConfig.GetEnumerator() | ForEach-Object { Write-Host "  $( $_.Key ): $( $_.Value )" }

    # SSH 연결 테스트
    Write-Host "INFO: Attempting SSH connection..."

    try
    {
        $sshTest = Connect-SSHServer
        Write-Host "DEBUG: SSH connection test result: $sshTest"

        if ($sshTest -eq $true)
        {
            Write-Host "SUCCESS: EC2 SSH connection successful. Starting GitLab credentials and webhook setup."

            # Jenkins 관리자 암호
            $jenkins_admin_password = $env:JENKINS_PASSWORD
            if (-Not $jenkins_admin_password)
            {
                Write-Host "WARNING: JENKINS_PASSWORD not found in environment variables. Using default value."
                $jenkins_admin_password = "admin1234"  # 로그에서 확인한 기본값
            }

            # 쉘 스크립트 생성
            $shellScript = @'
#!/bin/bash

# Configuration variables
GITLAB_TOKEN="{0}"
GITLAB_REPO_URL="{1}"
JENKINS_URL="{2}"
WEBHOOK_SECRET="{3}"
PROJECT_ID="{4}"
CREDENTIALS_ID="{5}"
JENKINS_USER="admin"
JENKINS_PASSWORD="{6}"

echo "===== Starting GitLab credentials and webhook setup ====="

# Create working directory
WORK_DIR="/tmp/jenkins-gitlab-setup"
mkdir -p $WORK_DIR
cd $WORK_DIR

# Download Jenkins CLI
if [ ! -f jenkins-cli.jar ]; then
  echo "Downloading Jenkins CLI..."
  wget -q "$JENKINS_URL/jnlpJars/jenkins-cli.jar" -O jenkins-cli.jar
fi

# 1. Add GitLab credentials using Groovy script
echo "Setting up GitLab credentials..."
cat > create_credentials.groovy << EOL
import jenkins.model.Jenkins
import com.cloudbees.plugins.credentials.domains.Domain
import com.cloudbees.plugins.credentials.SystemCredentialsProvider
import com.cloudbees.plugins.credentials.CredentialsScope
import com.cloudbees.plugins.credentials.impl.UsernamePasswordCredentialsImpl

// Get system credentials provider
def system_creds = SystemCredentialsProvider.getInstance()

// Check/create GitLab domain
def domain = new Domain("gitlab", "GitLab API Token Credentials", null)
system_creds.addDomain(domain)

// Create GitLab credentials
def creds = new UsernamePasswordCredentialsImpl(
    CredentialsScope.GLOBAL,
    "$CREDENTIALS_ID",
    "GitLab access token for CI/CD",
    "oauth2",
    "$GITLAB_TOKEN"
)

// Remove existing credentials with same ID
def existingCreds = system_creds.getCredentials().find { it.id == "$CREDENTIALS_ID" }
if (existingCreds) {
    system_creds.getCredentials().remove(existingCreds)
    println("Removed existing credentials: $CREDENTIALS_ID")
}

// Add new credentials
system_creds.getCredentials().add(creds)
system_creds.save()
println("GitLab API Token credentials created: $CREDENTIALS_ID")
EOL

java -jar jenkins-cli.jar -s "$JENKINS_URL" -auth "$JENKINS_USER:$JENKINS_PASSWORD" \
  groovy = < create_credentials.groovy

echo "GitLab credentials setup complete: $CREDENTIALS_ID"

# 2. Check GitLab plugin installation
echo "Checking GitLab plugin..."
GITLAB_PLUGIN=$(java -jar jenkins-cli.jar -s "$JENKINS_URL" -auth "$JENKINS_USER:$JENKINS_PASSWORD" list-plugins | grep gitlab-plugin || echo "")

if [ -z "$GITLAB_PLUGIN" ]; then
  echo "GitLab plugin needs to be installed - installing..."
  java -jar jenkins-cli.jar -s "$JENKINS_URL" -auth "$JENKINS_USER:$JENKINS_PASSWORD" install-plugin gitlab-plugin -restart

  echo "Jenkins restarting... waiting 60 seconds"
  sleep 60
else
  echo "GitLab plugin is already installed: $GITLAB_PLUGIN"
fi

# 3. Configure GitLab plugin using Groovy script
echo "Configuring GitLab plugin..."
cat > setup_gitlab_connection.groovy << EOL
import com.dabsquared.gitlabjenkins.connection.GitLabConnection
import com.dabsquared.gitlabjenkins.GitLabPushTrigger.DescriptorImpl
import jenkins.model.Jenkins
import com.dabsquared.gitlabjenkins.GitLabPushTrigger
import com.dabsquared.gitlabjenkins.connection.GitLabConnectionConfig
import hudson.util.Secret

// 1. GitLab Connection (API Access) configuration
def gitLabConnectionConfig = Jenkins.instance.getDescriptorByType(GitLabConnectionConfig.class)
if (gitLabConnectionConfig != null) {
    // Enable authentication for '/project' end-point
    gitLabConnectionConfig.setUseAuthToken(true)

    def connections = gitLabConnectionConfig.getConnections()

    // Remove existing connections
    if (connections != null) {
      connections.removeAll { true }
    } else {
      connections = []
    }

    // Add new connection
    def conn = new GitLabConnection(
        "GitLab", // Connection name
        "https://lab.ssafy.com", // GitLab URL
        "$CREDENTIALS_ID", // Credentials ID
        true, // Ignore certificate errors
        10, // Connection timeout
        10  // Read timeout
    )

    gitLabConnectionConfig.addConnection(conn)
    gitLabConnectionConfig.save()
    println("GitLab Connection (API Access) configuration complete")
    println("- Connection name: GitLab")
    println("- GitLab host URL: https://lab.ssafy.com")
    println("- Credentials ID: $CREDENTIALS_ID")

    // Test connection
    try {
        def client = conn.getClient()
        def user = client.getCurrentUser()
        println("GitLab Connection test success: " + user.getName() + " (" + user.getUsername() + ")")
    } catch (Exception e) {
        println("GitLab Connection test failed: " + e.getMessage())
        // Continue even if test fails
    }
} else {
    println("GitLab Connection configuration failed: GitLabConnectionConfig not found")
}

// 2. GitLab Servers (WebHook, SystemHook) configuration
def gitLabDesc = Jenkins.instance.getDescriptorByType(GitLabPushTrigger.DescriptorImpl.class)
if (gitLabDesc != null) {
    // Webhook settings
    gitLabDesc.setEnableWebHook(true)
    gitLabDesc.setEnableCiSkip(true)
    gitLabDesc.setEnableGitlabBuildNow(true)
    gitLabDesc.setAllowAllUsersToTriggerBuilds(true)
    gitLabDesc.setSecretToken(Secret.fromString("$WEBHOOK_SECRET"))

    // Save settings
    gitLabDesc.save()
    println("GitLab Servers (WebHook) configuration complete")
} else {
    println("GitLab Servers configuration failed: DescriptorImpl not found")
}

println("GitLab connection and webhook setup complete")
EOL

java -jar jenkins-cli.jar -s "$JENKINS_URL" -auth "$JENKINS_USER:$JENKINS_PASSWORD" \
  groovy = < setup_gitlab_connection.groovy

# 4. Check and modify crumbIssuer settings
echo "Checking Jenkins CSRF settings..."
CONFIG_FILE="/var/lib/jenkins/config.xml"
CRUMB_ISSUE_FOUND=$(sudo grep -a "<crumbIssuer" $CONFIG_FILE || echo "")

if [ -n "$CRUMB_ISSUE_FOUND" ]; then
  echo "crumbIssuer setting found, disabling ClientIP validation..."
  # Backup file
  sudo cp $CONFIG_FILE ${CONFIG_FILE}.bak

  # Change excludeClientIPFromCrumb to true
  sudo sed -i 's/<excludeClientIPFromCrumb>false<\/excludeClientIPFromCrumb>/<excludeClientIPFromCrumb>true<\/excludeClientIPFromCrumb>/' $CONFIG_FILE
  sudo systemctl restart jenkins
  echo "Jenkins restarting... waiting 60 seconds"
  sleep 60
else
  echo "crumbIssuer setting not found. Trying alternative method."

  # Modify CSRF settings using Groovy script
  cat > modify_csrf.groovy << EOL
import jenkins.model.Jenkins
import hudson.security.csrf.DefaultCrumbIssuer

def jenkins = Jenkins.instance
def issuer = jenkins.getCrumbIssuer()

if (issuer instanceof DefaultCrumbIssuer) {
    issuer.excludeClientIPFromCrumb = true
    jenkins.save()
    println("CSRF settings updated: ClientIP validation disabled")
} else {
    println("DefaultCrumbIssuer not found")
}
EOL

  java -jar jenkins-cli.jar -s "$JENKINS_URL" -auth "$JENKINS_USER:$JENKINS_PASSWORD" \
    groovy = < modify_csrf.groovy
fi

# 5. Configure GitLab webhook
echo "Setting up GitLab webhook..."
REPO_NAME=$(basename $GITLAB_REPO_URL .git)

# Delete existing webhooks
echo "Checking and deleting existing webhooks..."
EXISTING_HOOKS=$(curl -s --header "PRIVATE-TOKEN: $GITLAB_TOKEN" "https://lab.ssafy.com/api/v4/projects/$PROJECT_ID/hooks")
HOOK_IDS=$(echo $EXISTING_HOOKS | grep -oP '"id":\s*\K[0-9]+')

for HOOK_ID in $HOOK_IDS; do
  echo "Deleting existing webhook: $HOOK_ID"
  curl -s --request DELETE --header "PRIVATE-TOKEN: $GITLAB_TOKEN" "https://lab.ssafy.com/api/v4/projects/$PROJECT_ID/hooks/$HOOK_ID"
done

# Determine API endpoint
if [ -n "$GITLAB_PLUGIN" ]; then
  # If GitLab plugin is installed, use build_now endpoint
  WEBHOOK_ENDPOINT="$JENKINS_URL/gitlab/build_now"
  echo "GitLab plugin is installed - using build_now endpoint"
else
  # If plugin not installed, use default webhook endpoint
  WEBHOOK_ENDPOINT="$JENKINS_URL/gitlab-webhook/"
  echo "GitLab plugin not installed - using default webhook endpoint"
fi

echo "Webhook URL: $WEBHOOK_ENDPOINT"

# Register new webhook
echo "Registering webhook..."
RESPONSE=$(curl -s --request POST \
  --header "PRIVATE-TOKEN: $GITLAB_TOKEN" \
  --header "Content-Type: application/json" \
  --data "{\"url\":\"$WEBHOOK_ENDPOINT\",\"push_events\":true,\"token\":\"$WEBHOOK_SECRET\",\"enable_ssl_verification\":false}" \
  "https://lab.ssafy.com/api/v4/projects/$PROJECT_ID/hooks")

if [[ $RESPONSE == *"id"* ]]; then
  HOOK_ID=$(echo $RESPONSE | grep -oP '"id":\s*\K[0-9]+' | head -1)
  echo "SUCCESS: GitLab webhook registration complete! ID: $HOOK_ID"

  # Test webhook
  echo "Testing webhook..."
  TEST_RESPONSE=$(curl -s --request POST \
    --header "PRIVATE-TOKEN: $GITLAB_TOKEN" \
    "https://lab.ssafy.com/api/v4/projects/$PROJECT_ID/hooks/$HOOK_ID/test")

  echo "Test result: $TEST_RESPONSE"
else
  echo "ERROR: GitLab webhook registration failed"
  echo "Response: $RESPONSE"
fi

# 6. Verify settings
echo "Verifying GitLab settings..."
cat > verify_gitlab_settings.groovy << EOL
import com.dabsquared.gitlabjenkins.connection.GitLabConnectionConfig
import com.dabsquared.gitlabjenkins.GitLabPushTrigger
import jenkins.model.Jenkins
import com.cloudbees.plugins.credentials.SystemCredentialsProvider
import com.cloudbees.plugins.credentials.impl.UsernamePasswordCredentialsImpl

// Check credentials
println("\n========== GitLab Credentials Check ==========")
def credentialsFound = false
def credProvider = SystemCredentialsProvider.getInstance()
credProvider.getDomainCredentials().each { domainCreds ->
    domainCreds.credentials.each { cred ->
        if (cred.id == "$CREDENTIALS_ID") {
            println("✅ Credentials found: $CREDENTIALS_ID")
            println("- Description: " + cred.getDescription())
            println("- Type: " + cred.getClass().getSimpleName())
            if (cred instanceof UsernamePasswordCredentialsImpl) {
                println("- Username: " + cred.getUsername())
                println("- Password: " + (cred.getPassword() ? "Set" : "Not set"))
            }
            credentialsFound = true
        }
    }
}
if (!credentialsFound) {
    println("❌ Credentials not found: $CREDENTIALS_ID")
}

// Check GitLab Connection settings
def gitLabConnectionConfig = Jenkins.instance.getDescriptorByType(GitLabConnectionConfig.class)
if (gitLabConnectionConfig != null) {
    def connections = gitLabConnectionConfig.getConnections()
    if (connections != null && !connections.isEmpty()) {
        println("\n========== GitLab Connection Settings Check ==========")
        println("'/project' end-point authentication enabled: " + gitLabConnectionConfig.isUseAuthToken())

        connections.each { conn ->
            println("✅ Connection configuration found:")
            println("- Connection name: " + conn.getName())
            println("- GitLab URL: " + conn.getUrl())
            println("- Credentials ID: " + conn.getApiTokenId())
            println("- Ignore certificate validation: " + conn.isIgnoreCertificateErrors())

            // Test connection
            println("\n💡 Testing GitLab Connection...")
            try {
                def client = conn.getClient()
                def user = client.getCurrentUser()
                println("✅ Test successful! GitLab user: " + user.getName() + " (" + user.getUsername() + ")")
            } catch (Exception e) {
                println("❌ Test failed: " + e.getMessage())
                e.printStackTrace()
            }
        }
    } else {
        println("❌ GitLab Connection not configured")
    }
} else {
    println("❌ GitLabConnectionConfig not found")
}

// Check GitLab Webhook settings
def gitLabDesc = Jenkins.instance.getDescriptorByType(GitLabPushTrigger.DescriptorImpl.class)
if (gitLabDesc != null) {
    println("\n========== GitLab Webhook Settings Check ==========")
    println("Webhook enabled: " + gitLabDesc.isEnableWebHook())
    println("Build Now enabled: " + gitLabDesc.isEnableGitlabBuildNow())
    println("CI Skip enabled: " + gitLabDesc.isEnableCiSkip())
    println("Allow all users to trigger builds: " + gitLabDesc.isAllowAllUsersToTriggerBuilds())
    println("Secret Token: " + (gitLabDesc.getSecretToken() ? "Set" : "Not set"))
} else {
    println("❌ GitLabPushTrigger.DescriptorImpl not found")
}
EOL

java -jar jenkins-cli.jar -s "$JENKINS_URL" -auth "$JENKINS_USER:$JENKINS_PASSWORD" \
  groovy = < verify_gitlab_settings.groovy

# Cleanup
cd /tmp
rm -rf $WORK_DIR

echo "===== GitLab credentials and webhook setup complete ====="
exit 0
'@

            # 변수 값 대체
            $shellScript = $shellScript -f $git_token, $git_repo_url, $jenkins_url, $webhook_secret, $project_id, $credentials_id, $jenkins_admin_password

            # 스크립트 내용을 EC2에 업로드
            $tempScriptPath = "$env:TEMP\setup_gitlab_credentials_webhook.sh"
            $shellScript | Out-File -FilePath $tempScriptPath -Encoding utf8

            # 파일 존재 여부 확인
            if (Test-Path $tempScriptPath)
            {
                $fileInfo = Get-Item $tempScriptPath
                Write-Host "INFO: Local script file created - Size: $( $fileInfo.Length ) bytes"
                Write-Host "INFO: Script path: $tempScriptPath"
            }
            else
            {
                Write-Host "ERROR: Failed to create local script file: $tempScriptPath"
                throw "Script file creation failed"
            }

            # SSH로 스크립트 업로드
            Write-Host "INFO: Uploading script to EC2..."
            $remoteScriptPath = "/tmp/setup_gitlab_credentials_webhook.sh"

            $uploadResult = Upload-File -localPath $tempScriptPath -remotePath $remoteScriptPath
            Write-Host "DEBUG: Upload result: $uploadResult"

            if ($uploadResult -eq $true)
            {
                # 원격 파일 확인
                $checkResult = Invoke-Remote "ls -la $remoteScriptPath"
                Write-Host "INFO: Remote file check: $checkResult"

                # 실행 권한 부여
                Write-Host "INFO: Setting execute permission..."
                $chmodResult = Invoke-Remote "chmod +x $remoteScriptPath"
                Write-Host "DEBUG: chmod result: $chmodResult"

                # 스크립트 실행
                Write-Host "INFO: Executing script..."
                $scriptResult = Invoke-Remote "$remoteScriptPath"
                Write-Host "INFO: Script execution result:"
                Write-Host $scriptResult
            }
            else
            {
                Write-Host "ERROR: Failed to upload script to EC2. Skipping EC2 configuration."
            }

            # 임시 파일 정리
            if (Test-Path $tempScriptPath)
            {
                Remove-Item $tempScriptPath -Force
                Write-Host "INFO: Local temporary script file cleaned up."
            }
        }
        else
        {
            Write-Host "ERROR: SSH connection test failed. Expected result: True, Actual result: $sshTest"
            throw "SSH connection failed"
        }
    }
    catch [System.Exception]
    {
        Write-Host "ERROR: SSH connection exception: $( $_.Exception.Message )"
        Write-Host "ERROR: SSH connection failed. Skipping EC2 configuration."
    }
}
catch
{
    Write-Host "ERROR: EC2 configuration error: $( $_.Exception.Message )"
    Write-Host "INFO: Local webhook registration was completed."
}

Write-Host "SUCCESS: GitLab Webhook registration process completed."