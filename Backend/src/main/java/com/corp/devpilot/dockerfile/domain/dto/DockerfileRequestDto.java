package com.corp.devpilot.dockerfile.domain.dto;

import com.corp.devpilot.dockerfile.domain.DockerfileFrontendType;

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
public class DockerfileRequestDto {
	private String projectName;
	private String backendDir;
	private String frontendDir;

	private boolean useMaven;
	private String javaVersion;
	private int backendPort;

	private DockerfileFrontendType dockerfileFrontendType;
	private int frontendPort;

	private boolean useNginx;
	private boolean useRedis;
	private boolean useMySQL;

	// MySQL 설정 (MySQL 사용 시에만 필요)
	private String mysqlVersion;
	private String mysqlRootPassword;
	private String mysqlDatabase;
	private String mysqlUser;
	private String mysqlPassword;
}