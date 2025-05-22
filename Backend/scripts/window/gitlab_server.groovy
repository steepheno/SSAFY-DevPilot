import jenkins.model.*
import io.jenkins.plugins.gitlabserverconfig.servers.GitLabServer
import io.jenkins.plugins.gitlabserverconfig.servers.GitLabServers

// 인자 주입: args[0] = url, args[1] = credentialsId, args[2] = secretToken, args[3] = hookRootUrl
def url = args.length > 0 ? args[0] : "https://lab.ssafy.com"
def credentialsId = args.length > 1 ? args[1] : "gitlab_personal_token"
def secretToken = args.length > 2 ? args[2] : ""
def hookRootUrl = args.length > 3 ? args[3] : ""

def name = "gitlab-server"

// ❌ Webhook 자동 등록 비활성화
def manageWebHooks = false
def manageSystemHooks = false

println "[INFO] GitLab 서버 설정:"
println "  URL: ${url}"
println "  Credentials ID: ${credentialsId}"
println "  Webhook 자동 등록 사용 여부: ${manageWebHooks ? '활성화' : '비활성화'}"
println "  Secret Token Credentials ID: ${secretToken}"

// GitLabServer 인스턴스 생성
def server = new GitLabServer(url, name, credentialsId)

// 수동 설정
server.setManageWebHooks(manageWebHooks)
server.setManageSystemHooks(manageSystemHooks)

// Webhook Secret 설정은 유지 (필요 시)
if (secretToken?.trim()) {
    server.setWebhookSecretCredentialsId(secretToken)
}

// hookRootUrl은 사용하지 않음
server.setHooksRootUrl("")

// 기존 서버 설정 목록 가져와서 갱신
def serversConfig = GitLabServers.get()
def existingServers = new ArrayList<>(serversConfig.getServers())

// 기존 동일 이름 제거
existingServers.removeIf { it.getName() == name }

// 새 서버 추가
existingServers.add(server)

// 저장
serversConfig.setServers(existingServers)
serversConfig.save()

println "[INFO] GitLab 서버 등록 완료: ${name}"
