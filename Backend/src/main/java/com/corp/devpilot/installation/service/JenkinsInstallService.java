package com.corp.devpilot.installation.service;

import com.corp.devpilot.global.error.code.ErrorCode;
import com.corp.devpilot.global.error.exception.BusinessException;
import com.corp.devpilot.installation.dto.JenkinsInstallRequestDto;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
public class JenkinsInstallService {

	private static final String MAIN_SCRIPT_PATH = "/path/to/main.sh"; // 실제 경로로 변경 필요

	public void installJenkins(JenkinsInstallRequestDto request) {
		List<String> command = new ArrayList<>();
		command.add("bash");
		command.add(MAIN_SCRIPT_PATH);
		command.add("--pem-path=" + request.getPemPath());
		command.add("--ec2-host=" + request.getEc2Host());
		command.add("--jenkins-port=" + request.getJenkinsPort());
		command.add("--jenkins-password=" + request.getJenkinsPassword());
		command.add("--config-dir=" + request.getConfigDir());

		ProcessBuilder processBuilder = new ProcessBuilder(command);
		processBuilder.redirectErrorStream(true);

		try {
			Process process = processBuilder.start();
			try (BufferedReader reader = new BufferedReader(
				new InputStreamReader(process.getInputStream()))) {
				String line;
				while ((line = reader.readLine()) != null) {
					log.info("[main.sh] {}", line);
				}
			}

			int exitCode = process.waitFor();
			if (exitCode != 0) {
				throw new BusinessException(ErrorCode.JENKINS_DEPLOY_ERROR, "main.sh 실행 실패: exitCode = " + exitCode);
			}

		} catch (Exception e) {
			log.error("Jenkins 설치 중 예외 발생", e);
			throw new BusinessException(ErrorCode.INTERNAL_SERVER_ERROR, "main.sh 실행 중 오류가 발생했습니다");
		}
	}
}