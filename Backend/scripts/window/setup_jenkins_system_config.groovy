import jenkins.model.*
import hudson.model.*

// 시스템 메시지 설정
Jenkins.instance.setSystemMessage("DevPilot 자동 설치 완료 환경입니다.")

// Quiet Period 설정 (빌드 시작 전 대기 시간)
Jenkins.instance.setQuietPeriod(3)

// 빌드 실행 수 제한
Jenkins.instance.setNumExecutors(2)

// 저장소 설정 변경 후 저장
Jenkins.instance.save()
