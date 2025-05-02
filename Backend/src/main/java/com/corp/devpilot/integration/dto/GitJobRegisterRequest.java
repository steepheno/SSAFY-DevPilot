package com.corp.devpilot.integration.dto;

import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GitJobRegisterRequest {

	private String pemPath;             // EC2 접속용 PEM 파일 경로
	private String ec2Host;             // EC2 퍼블릭 DNS 또는 IP
	private String jenkinsPort;         // Jenkins 포트
	private String jenkinsPassword;     // Jenkins 관리자 비밀번호

	private String gitToken;            // GitHub/GitLab Personal Access Token
	private String gitCredentialsId;    // Jenkins에 등록할 자격증명 ID
	private String gitRepoUrl;          // Git 저장소 URL
	private String gitBranch;           // 빌드할 브랜치
	private String jenkinsJobName;      // Jenkins Job 이름
}
