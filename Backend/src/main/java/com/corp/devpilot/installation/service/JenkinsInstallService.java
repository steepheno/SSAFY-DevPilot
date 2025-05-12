package com.corp.devpilot.installation.service;

import com.corp.devpilot.global.error.code.ErrorCode;
import com.corp.devpilot.global.error.exception.BusinessException;
import com.corp.devpilot.installation.dto.JenkinsInstallRequestDto;

import lombok.extern.slf4j.Slf4j;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileReader;
import java.io.FileWriter;
import java.io.IOException;
import java.io.InputStreamReader;
import java.util.ArrayList;
import java.util.List;
import java.util.Properties;

@Slf4j
@Service
public class JenkinsInstallService {

	@Value("${scripts.linux-main-path}")
	private String linuxMainScriptPath;

	@Value("${scripts.window-main-path}")
	private String windowsMainScriptPath;

	@Value("${ec2.remote-base-dir}")
	private String HOME_PATH;

	public void installJenkins(JenkinsInstallRequestDto request) {
		saveEnvVariables(request);

		String os = System.getProperty("os.name").toLowerCase();
		String scriptPath = os.contains("win") ? windowsMainScriptPath : linuxMainScriptPath;

		List<String> command = new ArrayList<>();
		if (os.contains("win")) {
			command.add("powershell");
			command.add("-ExecutionPolicy");
			command.add("Bypass");
			command.add("-File");
		} else {
			command.add("bash");
		}

		command.add(scriptPath);
		command.add("--pem-path=" + request.getPemPath());
		command.add("--ec2-host=" + request.getEc2Host());
		command.add("--jenkins-port=" + request.getJenkinsPort());
		command.add("--jenkins-password=" + request.getJenkinsPassword());
		command.add("--config-dir=" + HOME_PATH + request.getConfigDir());

		ProcessBuilder processBuilder = new ProcessBuilder(command);
		processBuilder.redirectErrorStream(true);

		try {
			Process process = processBuilder.start();
			try (BufferedReader reader = new BufferedReader(
				new InputStreamReader(process.getInputStream()))) {
				String line;
				while ((line = reader.readLine()) != null) {
					log.info("[main script] {}", line);
				}
			}

			int exitCode = process.waitFor();
			if (exitCode != 0) {
				throw new BusinessException(ErrorCode.JENKINS_DEPLOY_ERROR, "main script 실행 실패: exitCode = " + exitCode);
			}

		} catch (Exception e) {
			log.error("Jenkins 설치 중 예외 발생", e);
			throw new BusinessException(ErrorCode.INTERNAL_SERVER_ERROR, "main script 실행 중 오류가 발생했습니다");
		}
	}

	public void saveEnvVariables(JenkinsInstallRequestDto request) {
		File envFile = new File(System.getProperty("user.home") + "/.devpilot/.env");
		File parent = envFile.getParentFile();
		if (!parent.exists()) parent.mkdirs();

		Properties props = new Properties();

		// 기존 내용 로드
		if (envFile.exists()) {
			try (BufferedReader reader = new BufferedReader(new FileReader(envFile))) {
				props.load(reader);
			} catch (IOException e) {
				throw new BusinessException(ErrorCode.INTERNAL_SERVER_ERROR, ".env 파일 읽기 실패");
			}
		}

		// 값 설정 또는 덮어쓰기
		props.setProperty("PEM_PATH", request.getPemPath());
		props.setProperty("EC2_HOST", request.getEc2Host());
		props.setProperty("JENKINS_PORT", String.valueOf(request.getJenkinsPort()));
		props.setProperty("JENKINS_PASSWORD", request.getJenkinsPassword());
		props.setProperty("CONFIG_DIR", request.getConfigDir());

		// 전체 저장
		try (FileWriter writer = new FileWriter(envFile, false)) {
			props.store(writer, null);
			log.info(".env 파일에 설치 관련 정보 저장 완료: {}", envFile.getAbsolutePath());
		} catch (IOException e) {
			throw new BusinessException(ErrorCode.INTERNAL_SERVER_ERROR, ".env 저장 실패");
		}
	}

	public String loadPemPathFromEnv() {
		File envFile = new File(System.getProperty("user.home") + "/.devpilot/.env");

		if (!envFile.exists()) {
			throw new BusinessException(ErrorCode.INVALID_INPUT_VALUE, "PEM 파일 경로가 설정되어 있지 않습니다.");
		}

		try (BufferedReader reader = new BufferedReader(new FileReader(envFile))) {
			return reader.lines()
				.filter(line -> line.startsWith("PEM_PATH="))
				.map(line -> line.replace("PEM_PATH=", "").trim())
				.findFirst()
				.orElseThrow(() -> new BusinessException(ErrorCode.INVALID_INPUT_VALUE, "PEM 경로 없음"));
		} catch (IOException e) {
			throw new BusinessException(ErrorCode.INTERNAL_SERVER_ERROR, "PEM 경로 불러오기 실패");
		}
	}

}
