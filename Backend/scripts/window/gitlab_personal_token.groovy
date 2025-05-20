import com.cloudbees.plugins.credentials.*
import com.cloudbees.plugins.credentials.domains.*
import com.cloudbees.plugins.credentials.impl.*
import hudson.util.Secret
import com.cloudbees.plugins.credentials.CredentialsScope
import org.jenkinsci.plugins.plaincredentials.impl.StringCredentialsImpl

// 외부 인자에서 Credential ID와 Token 값을 받음
def credentialId = this.args[0]
def secretValue = this.args[1]
def description = this.args.size() > 2 ? this.args[2] : "Secret Text Credential created via script"

// Credential 객체 생성
def credentials = new StringCredentialsImpl(
        CredentialsScope.GLOBAL,
        credentialId,
        description,
        Secret.fromString(secretValue)
)

// 전역 도메인에 추가
def store = SystemCredentialsProvider.getInstance().getStore()
store.addCredentials(Domain.global(), credentials)

println "✅ Secret Text Credential 등록 완료: ID = ${credentialId}"
