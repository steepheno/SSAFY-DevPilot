package com.corp.devpilot.installation.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Schema(description = "Jenkins 설치 요청 DTO")
public class JenkinsInstallRequestDto {

	@Schema(description = "EC2 PEM 파일 경로", example = "/path/to/key.pem")
	private String pemPath;

	@Schema(description = "EC2 호스트 주소", example = "ec2-user@1.2.3.4")
	private String ec2Host;

	@Schema(description = "Jenkins 포트", example = "7070")
	private String jenkinsPort;

	@Schema(description = "Jenkins 관리자 비밀번호", example = "admin1234")
	private String jenkinsPassword;

	@Schema(description = "Jenkins 구성 디렉토리", example = "/opt/jenkins_config")
	private String configDir;
}