import jenkins.model.*
import com.dabsquared.gitlabjenkins.connection.GitLabConnection
import com.dabsquared.gitlabjenkins.connection.GitLabConnectionConfig

// 인자에서 값 주입
def gitlabUrl = args.length > 0 ? args[0] : "https://lab.ssafy.com"
def credentialsId = args.length > 1 ? args[1] : "gitlab_token"

def connectionName = "gitlab-connection"
def clientBuilderId = "autodetect"  // 대부분 autodetect로 충분합니다

println "[INFO] GitLab URL: ${gitlabUrl}"
println "[INFO] Credentials ID: ${credentialsId}"

// GitLabConnection 설정 객체 불러오기
def descriptor = Jenkins.instance.getDescriptorByType(GitLabConnectionConfig)
def connections = descriptor.getConnections()

// 기존 동일 이름의 연결 제거
connections.removeIf { it.name == connectionName }

// 새로운 GitLabConnection 생성
def newConnection = new GitLabConnection(
        connectionName,
        gitlabUrl,
        credentialsId,
        clientBuilderId,
        false,  // ignoreCertificateErrors
        10,     // connectionTimeout
        10      // readTimeout
)

// 등록
connections.add(newConnection)
descriptor.setConnections(connections)
descriptor.save()

println "[INFO] GitLab Connection 등록 완료: ${connectionName}"
