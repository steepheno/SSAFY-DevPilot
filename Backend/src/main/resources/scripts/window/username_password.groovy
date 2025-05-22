import com.cloudbees.plugins.credentials.*
import com.cloudbees.plugins.credentials.common.*
import com.cloudbees.plugins.credentials.impl.*
import com.cloudbees.plugins.credentials.domains.*
import hudson.util.Secret
import jenkins.model.*

// 매개변수: args[0] = ID, args[1] = username, args[2] = password
def credentialId = this.args[0]
def username = this.args[1]
def password = this.args[2]

// Credentials 객체 생성
def credentials = new UsernamePasswordCredentialsImpl(
        CredentialsScope.GLOBAL,
        credentialId,
        "GitLab Username with Token",
        username,
        password
)

// 등록
def store = Jenkins.instance.getExtensionList('com.cloudbees.plugins.credentials.SystemCredentialsProvider')[0].getStore()
store.addCredentials(Domain.global(), credentials)

println "✅ Username/Password Credential '${credentialId}' 등록 완료"
