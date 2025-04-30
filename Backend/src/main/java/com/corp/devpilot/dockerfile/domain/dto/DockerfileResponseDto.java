package com.corp.devpilot.dockerfile.domain.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DockerfileResponseDto {
	private String backendDockerfile;
	private String frontendDockerfile;
	private String dockerComposeContent;
	private String nginxConfigContent;
	private long generatedTimestamp;
	private boolean success;
	private String errorMessage;

	public static DockerfileResponseDto success(
		String backendDockerfile,
		String frontendDockerfile,
		String dockerComposeContent,
		String nginxConfigContent) {
		return DockerfileResponseDto.builder()
			.backendDockerfile(backendDockerfile)
			.frontendDockerfile(frontendDockerfile)
			.dockerComposeContent(dockerComposeContent)
			.nginxConfigContent(nginxConfigContent)
			.success(true)
			.generatedTimestamp(System.currentTimeMillis())
			.build();
	}

	public static DockerfileResponseDto failure(String errorMessage) {
		return DockerfileResponseDto.builder()
			.success(false)
			.errorMessage(errorMessage)
			.generatedTimestamp(System.currentTimeMillis())
			.build();
	}
}