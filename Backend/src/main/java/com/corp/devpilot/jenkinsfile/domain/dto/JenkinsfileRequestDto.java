package com.corp.devpilot.jenkinsfile.domain.dto;

import java.util.List;

import com.corp.devpilot.jenkinsfile.domain.JenkinsfileProjectType;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class JenkinsfileRequestDto {

	private JenkinsfileProjectType jenkinsfileProjectType;
	private String projectName;
	private String gitRepositoryUrl;
	private String gitCredentialsId;
	private List<JenkinsfileBranchConfig> jenkinsfileBranchConfigs;

	private String JavaVersion;

	private String frontendDir;
	private String backendDir;

	private boolean mattermostNotification;
	private String mattermostWebhookUrl;
	private String mattermostChannel;
}