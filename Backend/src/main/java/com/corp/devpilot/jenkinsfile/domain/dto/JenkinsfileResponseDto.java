package com.corp.devpilot.jenkinsfile.domain.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class JenkinsfileResponseDto {

	private String content;
	private String projectType;
	private long generatedTimestamp;
	private boolean success;
	private String errorMessage;

	public void initialize() {
		this.generatedTimestamp = System.currentTimeMillis();
	}

	public static JenkinsfileResponseDto success(String content, String projectType) {
		return JenkinsfileResponseDto.builder()
			.content(content)
			.projectType(projectType)
			.success(true)
			.generatedTimestamp(System.currentTimeMillis())
			.build();
	}

	public static JenkinsfileResponseDto failure(String errorMessage) {
		return JenkinsfileResponseDto.builder()
			.success(false)
			.errorMessage(errorMessage)
			.generatedTimestamp(System.currentTimeMillis())
			.build();
	}
}
