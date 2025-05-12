# ========================================================
# jenkins_installation.ps1
# Jenkins 설치 및 제거 PowerShell 버전
# ========================================================

function Log($msg) {
    Write-Host "[INFO] $msg"
}

function ErrorExit($msg) {
    Write-Error $msg
    exit 1
}

function Invoke-Remote($cmd) {
    ssh -i $env:PEM_PATH -o StrictHostKeyChecking=no "ubuntu@$env:EC2_HOST" $cmd
}

function Check-JenkinsInstalled {
    Log "[Jenkins] 설치 여부 확인 중..."
    Invoke-Remote "[ -f /opt/jenkins_config/jenkins_installed ]"
}

function Check-ServiceStatus {
    $status = Invoke-Remote "systemctl is-active jenkins"
    return $status -eq "active"
}

function Remove-ExistingInstallations {
    Log "[Jenkins] 기존 설치 제거 중..."
    $os = Invoke-Remote "source /etc/os-release && echo \$ID"

    if ($os -match 'ubuntu|debian') {
        Invoke-Remote "sudo apt-get remove --purge -y jenkins java-* openjdk-* default-jdk && sudo apt-get autoremove -y && sudo apt-get clean"
    } elseif ($os -match 'rhel|centos|fedora|amzn') {
        $pkg = Invoke-Remote "command -v dnf || command -v yum"
        Invoke-Remote "sudo $pkg remove -y jenkins java-* && sudo $pkg clean all"
    } else {
        ErrorExit "[Jenkins] 지원되지 않는 OS: $os"
    }
    Log "[Jenkins] 제거 완료"
}

function Install-JavaJenkins {
    Log "[Jenkins] Java + Jenkins 설치 중..."
    $javaVersion = 17
    $os = Invoke-Remote "source /etc/os-release && echo \$ID"

    Invoke-Remote "mkdir -p /opt/jenkins_config"

    if ($os -match 'ubuntu|debian') {
        Invoke-Remote "sudo apt-get update -y && \
          sudo apt-get install -y openjdk-${javaVersion}-jdk curl gnupg && \
          curl -fsSL https://pkg.jenkins.io/debian/jenkins.io-2023.key | sudo tee /usr/share/keyrings/jenkins-keyring.asc > /dev/null && \
          echo 'deb [signed-by=/usr/share/keyrings/jenkins-keyring.asc] https://pkg.jenkins.io/debian-stable binary/' | sudo tee /etc/apt/sources.list.d/jenkins.list > /dev/null && \
          sudo apt-get update -y && \
          sudo DEBIAN_FRONTEND=noninteractive apt-get install -y -V jenkins"
    } elseif ($os -match 'rhel|centos|fedora|amzn') {
        $pkg = Invoke-Remote "command -v dnf || command -v yum"
        Invoke-Remote "sudo $pkg update -y && \
          sudo $pkg install -y java-${javaVersion}-openjdk wget && \
          sudo wget -O /etc/yum.repos.d/jenkins.repo https://pkg.jenkins.io/redhat-stable/jenkins.repo && \
          sudo rpm --import https://pkg.jenkins.io/redhat-stable/jenkins.io.key && \
          sudo $pkg install -y jenkins"
    } else {
        ErrorExit "[Jenkins] 지원되지 않는 OS: $os"
    }

    Invoke-Remote "sudo mkdir -p /etc/systemd/system/jenkins.service.d"
    Invoke-Remote "sudo bash -c \"cat > /etc/systemd/system/jenkins.service.d/override.conf <<EOF
    [Service]
    ExecStart=
    ExecStart=/usr/bin/java -Djava.net.preferIPv4Stack=true -Djava.awt.headless=true -jar /usr/share/java/jenkins.war --webroot=/var/cache/jenkins/war --httpPort=$env:JENKINS_PORT --httpListenAddress=0.0.0.0
    EOF\""

    Invoke-Remote "sudo systemctl daemon-reexec && sudo systemctl daemon-reload"
    Invoke-Remote "sudo systemctl enable jenkins && sudo systemctl start jenkins && echo 'installed' | sudo tee /opt/jenkins_config/jenkins_installed"

    if (-not (Check-ServiceStatus)) {
        ErrorExit "[Jenkins] 서비스가 시작되지 않았습니다."
    }

    Log "[Jenkins] 설치 완료"
}

function Install-Docker {
    Log "[Docker] Docker 및 Compose 설치 중..."
    Invoke-Remote "curl -fsSL https://get.docker.com -o get-docker.sh && sudo sh get-docker.sh"
    Invoke-Remote "sudo apt-get install -y docker-compose-plugin"
    Invoke-Remote "sudo usermod -aG docker jenkins"
    Invoke-Remote "sudo systemctl enable docker && sudo systemctl start docker"

    if (-not (Invoke-Remote "docker --version")) {
        ErrorExit "[Docker] docker 명령어가 작동하지 않음"
    }

    if (-not (Invoke-Remote "docker compose version")) {
        Log "[Docker] 별도 compose 바이너리 설치 시도..."
        Invoke-Remote "DOCKER_COMPOSE_VERSION=2.27.0 && \
          sudo curl -L \"https://github.com/docker/compose/releases/download/v\$DOCKER_COMPOSE_VERSION/docker-compose-\$(uname -s)-\$(uname -m)\" -o /usr/local/bin/docker-compose && \
          sudo chmod +x /usr/local/bin/docker-compose && \
          sudo ln -s /usr/local/bin/docker-compose /usr/bin/docker-compose"
    }

    Log "[Docker] 설치 완료"
}