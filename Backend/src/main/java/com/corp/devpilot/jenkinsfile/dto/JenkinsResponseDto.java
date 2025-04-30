package com.corp.devpilot.jenkinsfile.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class JenkinsResponseDto {

	private String content;
	private String projectType;
	private long generatedTimestamp;
	private boolean success;
	private String errorMessage;

	public void initialize() {
		this.generatedTimestamp = System.currentTimeMillis();
	}

	public static JenkinsResponseDto success(String content, String projectType) {
		return JenkinsResponseDto.builder()
			.content(content)
			.projectType(projectType)
			.success(true)
			.generatedTimestamp(System.currentTimeMillis())
			.build();
	}

	public static JenkinsResponseDto failure(String errorMessage) {
		return JenkinsResponseDto.builder()
			.success(false)
			.errorMessage(errorMessage)
			.generatedTimestamp(System.currentTimeMillis())
			.build();
	}
}
