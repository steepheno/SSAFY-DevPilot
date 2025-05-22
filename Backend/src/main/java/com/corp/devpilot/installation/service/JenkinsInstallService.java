package com.corp.devpilot.installation.service;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileReader;
import java.io.FileWriter;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.corp.devpilot.global.error.code.ErrorCode;
import com.corp.devpilot.global.error.exception.BusinessException;
import com.corp.devpilot.installation.dto.JenkinsInstallRequestDto;
import com.corp.devpilot.installation.dto.StatusResponse;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class JenkinsInstallService {

	@Value("${scripts.linux-main-path}")
	private String linuxMainScriptPath;

	@Value("${scripts.window-main-path}")
	private String windowsMainScriptPath;

	@Value("${ec2.remote-base-dir}")
	private String HOME_PATH;

	@Value("${scripts.linux-confirm-path}")
	private String linuxConfirmPath;

	public void installJenkins(JenkinsInstallRequestDto request) {
		log.info("Jenkins 설치 프로세스 시작");
		saveEnvVariables(request);
		log.info("환경 변수 저장 완료");

		String os = System.getProperty("os.name").toLowerCase();
		String scriptPath = os.contains("win") ? windowsMainScriptPath : linuxMainScriptPath;
		log.info("스크립트 경로: {}", scriptPath);

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
		command.add("-pem_path");
		command.add(request.getPemPath());
		command.add("-ec2_host");
		command.add(request.getEc2Host());
		command.add("-jenkins_password");
		command.add(request.getJenkinsPassword());
		command.add("-jenkins_port");
		command.add(request.getJenkinsPort());
		command.add("-config_dir");
		command.add(request.getConfigDir());

		ProcessBuilder processBuilder = new ProcessBuilder(command);
		processBuilder.redirectErrorStream(true);

		log.info("실행할 명령어: {}", String.join(" ", command));

		try {
			log.info("Jenkins 설치 스크립트 실행 시작");
			Process process = processBuilder.start();

			try (BufferedReader reader = new BufferedReader(
				new InputStreamReader(process.getInputStream()))) {
				String line;
				while ((line = reader.readLine()) != null) {
					log.info("[main script] {}", line);
				}
			}

			int exitCode = process.waitFor();
			log.info("Jenkins 설치 스크립트 종료: exitCode={}", exitCode);

			if (exitCode != 0) {
				throw new BusinessException(ErrorCode.JENKINS_DEPLOY_ERROR,
					"main script 실행 실패: exitCode = " + exitCode);
			}

		} catch (Exception e) {
			log.error("Jenkins 설치 중 예외 발생", e);
			throw new BusinessException(ErrorCode.INTERNAL_SERVER_ERROR, "main script 실행 중 오류가 발생했습니다");
		}

		log.info("Jenkins 설치 프로세스 완료");
	}

	public void saveEnvVariables(JenkinsInstallRequestDto request) {
		File envFile = new File(System.getProperty("user.home") + "/.devpilot/.env");
		File parent = envFile.getParentFile();
		if (!parent.exists())
			parent.mkdirs();

		// 값 전처리
		String pemPath = request.getPemPath().replace("\\", "/");  // 백슬래시를 슬래시로 변환
		String ec2Host = request.getEc2Host().trim();  // 앞뒤 공백 제거

		try (FileWriter writer = new FileWriter(envFile, false)) {
			writer.write("PEM_PATH=" + pemPath + "\n");
			writer.write("EC2_HOST=" + ec2Host + "\n");
			writer.write("JENKINS_PORT=" + request.getJenkinsPort() + "\n");
			writer.write("JENKINS_PASSWORD=" + request.getJenkinsPassword() + "\n");
			writer.write("CONFIG_DIR=" + request.getConfigDir() + "\n");
			writer.write("LOCAL_FRONT_DIR=" + request.getLocalFrontDir() + "\n");
			writer.write("LOCAL_BACK_DIR=" + request.getLocalBackendDir()+ "\n");

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

	public void confirmJenkins(JenkinsInstallRequestDto request) {
		saveEnvVariables(request);

		List<String> command = new ArrayList<>();
		command.add("bash");

		command.add(linuxConfirmPath);
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
					log.info("[confirm script] {}", line);
				}
			}

			int exitCode = process.waitFor();
			if (exitCode != 0) {
				throw new BusinessException(ErrorCode.JENKINS_DEPLOY_ERROR,
					"main script 실행 실패: exitCode = " + exitCode);
			}

		} catch (Exception e) {
			log.error("Jenkins 설치 중 예외 발생", e);
			throw new BusinessException(ErrorCode.INTERNAL_SERVER_ERROR, "main script 실행 중 오류가 발생했습니다");
		}
	}

	public StatusResponse checkJenkins() {
		String envPath = System.getProperty("user.home") + "/.devpilot/.env";  // 필요시 경로 수정
		try {
			Map<String, String> envMap = loadEnv(envPath);
			if (!envMap.containsKey("PEM_PATH") ||
				!envMap.containsKey("EC2_HOST") ||
				!envMap.containsKey("JENKINS_PORT") ||
				!envMap.containsKey("JENKINS_PASSWORD") ||
				!envMap.containsKey("CONFIG_DIR")
			) {
				return new StatusResponse(false);
			}
			return new StatusResponse(true);
		} catch (Exception e) {
			return new StatusResponse(false);
		}
	}

	private Map<String, String> loadEnv(String envFilePath) throws IOException {
		Map<String, String> envMap = new HashMap<>();
		List<String> lines = Files.readAllLines(Paths.get(envFilePath));
		for (String line : lines) {
			if (!line.trim().isEmpty() && !line.startsWith("#")) {
				String[] parts = line.split("=", 2);
				if (parts.length == 2) {
					envMap.put(parts[0].trim(), parts[1].trim());
				}
			}
		}
		return envMap;
	}

}
