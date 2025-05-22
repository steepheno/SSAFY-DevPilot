import com.cloudbees.plugins.credentials.*
import com.cloudbees.plugins.credentials.domains.*
import com.dabsquared.gitlabjenkins.connection.*
import hudson.util.Secret
import jenkins.model.Jenkins

def credentialId = this.args[0]
def apiTokenValue = this.args[1]

def credentials = new GitLabApiTokenImpl(
        CredentialsScope.GLOBAL,
        credentialId,
        'GitLab API Token',
        Secret.fromString(apiTokenValue)
)

SystemCredentialsProvider.getInstance().getStore().addCredentials(Domain.global(), credentials)

println "✅ Credential '${credentialId}' 등록 완료"
