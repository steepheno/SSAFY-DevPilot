package com.corp.devpilot.installation.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@Schema(description = "Jenkins 설치 요청 DTO")
public class JenkinsInstallRequestDto {

	@Schema(description = "EC2 PEM 파일 경로", example = "/path/to/key.pem")
	private String pemPath;

	@Schema(description = "EC2 호스트 주소", example = "ec2-user@1.2.3.4")
	private String ec2Host;

	@Schema(description = "Jenkins 포트", defaultValue = "8080")
	private String jenkinsPort = "8080";

	@Schema(description = "Jenkins 관리자 비밀번호", example = "admin1234")
	private String jenkinsPassword;

	@Schema(description = "Jenkins 구성 디렉토리", defaultValue = "/opt/jenkins_config")
	private String configDir = "/opt/jenkins_config";

	@Schema(description = "로컬 프론트엔드 주소", example = "C:/Users/SSAFY/develop/S12P31A301/frontend")
	private String localFrontDir;

	@Schema(description = "로컬 백엔드 주소", example = "C:/Users/SSAFY/develop/S12P31A301/backend")
	private String localBackendDir;
}