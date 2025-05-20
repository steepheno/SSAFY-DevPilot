package com.corp.devpilot.integration.dto;

import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GitJobRegisterRequest {

	private String gitToken;            // GitHub/GitLab Personal Access Token
	private String gitCredentialsId;    // Jenkins에 등록할 자격증명 ID
	private String gitPersonalToken;
	private String gitPersonalCredentialsId;
	private String gitUsername;
	private String gitRepoUrl;          // Git 저장소 URL
	private String jenkinsJobName;      // Jenkins Job 이름

}
