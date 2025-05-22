import com.cloudbees.plugins.credentials.*
import com.cloudbees.plugins.credentials.domains.*
import com.cloudbees.plugins.credentials.impl.*
import hudson.util.Secret
import com.cloudbees.plugins.credentials.CredentialsScope
import org.jenkinsci.plugins.plaincredentials.impl.FileCredentialsImpl

import java.nio.file.Files
import java.nio.file.Paths
import java.nio.file.Path
import java.nio.charset.StandardCharsets

// 외부 인자에서 Credential ID, .env 파일 경로, 설명 받음
def credentialId = this.args[0]
def envFilePath = this.args[1]
def description = this.args.size() > 2 ? this.args[2] : ".env file credential"

// .env 파일 읽어서 바이트 배열로 변환
Path path = Paths.get(envFilePath)
byte[] contentBytes = Files.readAllBytes(path)

// 파일 크리덴셜 생성 (파일명은 임의 설정)
def credentials = new FileCredentialsImpl(
        CredentialsScope.GLOBAL,
        credentialId,
        description,
        "env", // 저장될 파일명
        contentBytes
)

// 전역 도메인에 추가
def store = SystemCredentialsProvider.getInstance().getStore()
store.addCredentials(Domain.global(), credentials)

println "✅ .env 파일 Credential 등록 완료: ID = ${credentialId}, 파일 경로 = ${envFilePath}"
