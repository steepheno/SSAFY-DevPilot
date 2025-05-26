package com.corp.devpilot.dockerfile.service;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileWriter;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import com.corp.devpilot.dockerfile.domain.dto.DockerfileRequestDto;
import com.corp.devpilot.global.error.code.ErrorCode;
import com.corp.devpilot.global.error.exception.DockerfileException;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class DockerfileService {

	public Map<String, String> saveDockerfilesToFiles(DockerfileRequestDto requestDto, String baseDirectory) {
		try {
			validateAndSetDefaults(requestDto);

			Map<String, String> generatedFilePaths = new HashMap<>();

			File baseDir = createDirectoryPath(baseDirectory);

			File backendDir = createSubdirectory(baseDir, "backend");
			File frontendDir = createSubdirectory(baseDir, "frontend");
			File etcDir = createSubdirectory(baseDir, "etc");

			String backendDockerfile = generateBackendDockerfile(requestDto);
			String backendFilename =
				requestDto.isUseMaven() ? "spring-maven-dockerfile.txt" : "spring-gradle-dockerfile.txt";
			String backendFilePath = saveFileContent(backendDir, backendFilename, backendDockerfile);
			generatedFilePaths.put("backendDockerfile", backendFilePath);

			String frontendDockerfile = generateFrontendDockerfile(requestDto);
			String frontendFilename =
				requestDto.getDockerfileFrontendType().toString().toLowerCase() + "-dockerfile.txt";
			String frontendFilePath = saveFileContent(frontendDir, frontendFilename, frontendDockerfile);
			generatedFilePaths.put("frontendDockerfile", frontendFilePath);

			String dockerCompose = generateDockerCompose(requestDto);
			String dockerComposeFilePath = saveFileContent(baseDir, "docker-compose.txt", dockerCompose);
			generatedFilePaths.put("dockerCompose", dockerComposeFilePath);

			if (requestDto.isUseNginx()) {
				String nginxConfig = generateNginxContent(requestDto);
				String nginxConfigFilePath = saveFileContent(etcDir, "nginx.conf.txt", nginxConfig);
				generatedFilePaths.put("nginxConfig", nginxConfigFilePath);

				String nginxServiceTemplate = readTemplateFile("templates/dockerfile/etc/nginx-service.txt");
				nginxServiceTemplate = nginxServiceTemplate.replace("##FRONTEND_PORT##",
					String.valueOf(requestDto.getFrontendPort()));
				nginxServiceTemplate = nginxServiceTemplate.replace("##PROJECT_NAME##", requestDto.getProjectName());

				String nginxServiceFilePath = saveFileContent(etcDir, "nginx-service.txt", nginxServiceTemplate);
				generatedFilePaths.put("nginxService", nginxServiceFilePath);
			}

			if (requestDto.isUseMySQL()) {
				String mysqlTemplate = readTemplateFile("templates/dockerfile/etc/mysql-service.txt");
				mysqlTemplate = mysqlTemplate.replace("##MYSQL_VERSION##", requestDto.getMysqlVersion());
				mysqlTemplate = mysqlTemplate.replace("##MYSQL_ROOT_PASSWORD##", requestDto.getMysqlRootPassword());
				mysqlTemplate = mysqlTemplate.replace("##MYSQL_DATABASE##", requestDto.getMysqlDatabase());
				mysqlTemplate = mysqlTemplate.replace("##MYSQL_USER##", requestDto.getMysqlUser());
				mysqlTemplate = mysqlTemplate.replace("##MYSQL_PASSWORD##", requestDto.getMysqlPassword());
				mysqlTemplate = mysqlTemplate.replace("##PROJECT_NAME##", requestDto.getProjectName());

				String mysqlServiceFilePath = saveFileContent(etcDir, "mysql-service.txt", mysqlTemplate);
				generatedFilePaths.put("mysqlService", mysqlServiceFilePath);
			}

			if (requestDto.isUseRedis()) {
				String redisTemplate = readTemplateFile("templates/dockerfile/etc/redis-service.txt");
				redisTemplate = redisTemplate.replace("##PROJECT_NAME##", requestDto.getProjectName());

				String redisServiceFilePath = saveFileContent(etcDir, "redis-service.txt", redisTemplate);
				generatedFilePaths.put("redisService", redisServiceFilePath);
			}

			uploadFiles(requestDto, generatedFilePaths);

			return generatedFilePaths;
		} catch (IOException e) {
			System.err.println("❌ IOException 발생: " + e.getMessage());
			e.printStackTrace(); // 이 줄이 핵심입니다!
			throw new DockerfileException(ErrorCode.DOCKER_TEMPLATE_ERROR);
		} catch (DockerfileException e) {
			throw e;
		} catch (Exception e) {
			throw new DockerfileException(ErrorCode.INTERNAL_SERVER_ERROR);
		}
	}

	private String generateBackendDockerfile(DockerfileRequestDto dockerfileRequestDto) throws IOException {
		String templatePath;

		if (dockerfileRequestDto.isUseMaven()) {
			templatePath = "templates/dockerfile/backend/spring-maven-dockerfile.txt";
		} else {
			templatePath = "templates/dockerfile/backend/spring-gradle-dockerfile.txt";
		}

		String template = readTemplateFile(templatePath);

		String result = template;
		result = result.replace("##JAVA_VERSION##", dockerfileRequestDto.getJavaVersion());
		result = result.replace("##BACKEND_PORT##", String.valueOf(dockerfileRequestDto.getBackendPort()));
		result = result.replace("##BACKEND_DIR##", "../" + dockerfileRequestDto.getBackendDir());
		result = result.replace("##PROJECT_NAME##", dockerfileRequestDto.getProjectName());

		return result;
	}

	private String generateFrontendDockerfile(DockerfileRequestDto dockerfileRequestDto) throws IOException {
		String templatePath;
		String envPath = System.getProperty("user.home") + "/.devpilot/.env";  // 필요시 경로 수정
		Map<String, String> envMap = loadEnv(envPath);
		String localFrontEnvPath = envMap.getOrDefault("LOCAL_FRONT_DIR", System.getProperty("user.home")) + "/.env";
		String argEnvBlock = generateArgAndEnvBlock(localFrontEnvPath);

		switch (dockerfileRequestDto.getDockerfileFrontendType()) {
			case REACT:
				templatePath = "templates/dockerfile/frontend/react-dockerfile.txt";
				break;
			case VUE:
				templatePath = "templates/dockerfile/frontend/vue-dockerfile.txt";
				break;
			case NEXTJS:
				templatePath = "templates/dockerfile/frontend/nextjs-dockerfile.txt";
				break;
			default:
				throw new DockerfileException(ErrorCode.INVALID_ENUM_VALUE);
		}

		String template = readTemplateFile(templatePath);

		String result = template;
		result = result.replace("##FRONTEND_PORT##", String.valueOf(dockerfileRequestDto.getFrontendPort()));
		result = result.replace("##FRONTEND_DIR##", "../" + dockerfileRequestDto.getFrontendDir());
		result = result.replace("##ARGUMENTS##", argEnvBlock);

		return result;
	}

	private String generateDockerCompose(DockerfileRequestDto dockerfileRequestDto) throws IOException {
		String templatePath = "templates/dockerfile/docker-compose.txt";
		String template = readTemplateFile(templatePath);

		String envPath = System.getProperty("user.home") + "/.devpilot/.env";  // 필요시 경로 수정
		Map<String, String> envMap = loadEnv(envPath);
		String ec2Host = envMap.getOrDefault("EC2_HOST", "localhost");
		String localFrontDir = envMap.getOrDefault("LOCAL_FRONT_DIR", System.getProperty("user.home")) + "/.env";
		String argsBlock = generateBuildArgsFromEnvKeys(localFrontDir);

		String result = template;
		result = result.replace("##PROJECT_NAME##", dockerfileRequestDto.getProjectName());
		result = result.replace("##BACKEND_PORT##", String.valueOf(dockerfileRequestDto.getBackendPort()));
		result = result.replace("##FRONTEND_PORT##", String.valueOf(dockerfileRequestDto.getFrontendPort()));
		result = result.replace("##ARGUMENTS##", argsBlock);

		StringBuilder additionalServices = new StringBuilder();

		if (dockerfileRequestDto.isUseMySQL()) {
			String mysqlTemplate = readTemplateFile("templates/dockerfile/etc/mysql-service.txt");
			mysqlTemplate = mysqlTemplate.replace("##MYSQL_VERSION##", dockerfileRequestDto.getMysqlVersion());
			mysqlTemplate = mysqlTemplate.replace("##MYSQL_ROOT_PASSWORD##",
				dockerfileRequestDto.getMysqlRootPassword());
			mysqlTemplate = mysqlTemplate.replace("##MYSQL_DATABASE##", dockerfileRequestDto.getMysqlDatabase());
			mysqlTemplate = mysqlTemplate.replace("##MYSQL_USER##", dockerfileRequestDto.getMysqlUser());
			mysqlTemplate = mysqlTemplate.replace("##MYSQL_PASSWORD##", dockerfileRequestDto.getMysqlPassword());
			mysqlTemplate = mysqlTemplate.replace("##PROJECT_NAME##", dockerfileRequestDto.getProjectName());

			additionalServices.append(mysqlTemplate).append("\n\n");
		}

		if (dockerfileRequestDto.isUseRedis()) {
			String redisTemplate = readTemplateFile("templates/dockerfile/etc/redis-service.txt");
			redisTemplate = redisTemplate.replace("##PROJECT_NAME##", dockerfileRequestDto.getProjectName());
			additionalServices.append(redisTemplate).append("\n\n");
		}

		if (dockerfileRequestDto.isUseNginx()) {
			String nginxTemplate = readTemplateFile("templates/dockerfile/etc/nginx-service.txt");
			nginxTemplate = nginxTemplate.replace("##FRONTEND_PORT##",
				String.valueOf(dockerfileRequestDto.getFrontendPort()));
			nginxTemplate = nginxTemplate.replace("##PROJECT_NAME##", dockerfileRequestDto.getProjectName());
			nginxTemplate = nginxTemplate.replace("##PROJECT_DOMAIN##", ec2Host);

			additionalServices.append(nginxTemplate).append("\n\n");
		}

		result = result.replace("##ADDITIONAL_SERVICES##", additionalServices.toString());

		return result;
	}

	private String generateNginxContent(DockerfileRequestDto dockerfileRequestDto) throws IOException {
		String templatePath = "templates/dockerfile/etc/nginx.conf.txt";
		String template = readTemplateFile(templatePath);

		String envPath = System.getProperty("user.home") + "/.devpilot/.env";  // 필요시 경로 수정
		Map<String, String> envMap = loadEnv(envPath);
		String ec2Host = envMap.getOrDefault("EC2_HOST", "localhost");

		String result = template;
		result = result.replace("##BACKEND_PORT##", String.valueOf(dockerfileRequestDto.getBackendPort()));
		result = result.replace("##SERVER_DOMAIN##", ec2Host);
		result = result.replace("##FRONTEND_NAME##", dockerfileRequestDto.getProjectName() + "-frontend");
		result = result.replace("##BACKEND_NAME##", dockerfileRequestDto.getProjectName() + "-backend");

		return result;
	}

	private String readTemplateFile(String path) throws IOException {
		try (BufferedReader reader = new BufferedReader(
			new InputStreamReader(new ClassPathResource(path).getInputStream(), StandardCharsets.UTF_8))) {
			return reader.lines().collect(Collectors.joining("\n"));
		}
	}

	private void validateAndSetDefaults(DockerfileRequestDto requestDto) {
		if (requestDto == null) {
			throw new DockerfileException(ErrorCode.INVALID_INPUT_VALUE);
		}

		if (requestDto.getProjectName() == null || requestDto.getProjectName().isEmpty()) {
			throw new DockerfileException(ErrorCode.DOCKER_INVALID_PROJECT_NAME);
		}

		if (requestDto.getBackendDir() == null || requestDto.getBackendDir().isEmpty()) {
			throw new DockerfileException(ErrorCode.DOCKER_INVALID_DIRECTORY);
		}

		if (requestDto.getFrontendDir() == null || requestDto.getFrontendDir().isEmpty()) {
			throw new DockerfileException(ErrorCode.DOCKER_INVALID_DIRECTORY);
		}

		if (requestDto.getJavaVersion() == null || requestDto.getJavaVersion().isEmpty()) {
			throw new DockerfileException(ErrorCode.DOCKER_INVALID_JAVA_VERSION);
		}

		if (requestDto.getDockerfileFrontendType() == null) {
			throw new DockerfileException(ErrorCode.INVALID_ENUM_VALUE);
		}

		if (requestDto.getBackendPort() <= 0) {
			requestDto.setBackendPort(8080);
		}

		if (requestDto.getFrontendPort() <= 0) {
			requestDto.setFrontendPort(3000);
		}

		if (requestDto.isUseMySQL()) {
			if (requestDto.getMysqlVersion() == null || requestDto.getMysqlVersion().isEmpty() ||
				requestDto.getMysqlRootPassword() == null || requestDto.getMysqlRootPassword().isEmpty() ||
				requestDto.getMysqlDatabase() == null || requestDto.getMysqlDatabase().isEmpty() ||
				requestDto.getMysqlUser() == null || requestDto.getMysqlUser().isEmpty() ||
				requestDto.getMysqlPassword() == null || requestDto.getMysqlPassword().isEmpty()) {
				throw new DockerfileException(ErrorCode.DOCKER_INVALID_MYSQL_CONFIG);
			}
		}
	}

	private File createDirectoryPath(String directory) {
		File dir;
		if (directory.startsWith("./") || !directory.startsWith("/")) {
			String projectRoot = new File("").getAbsolutePath();
			dir = new File(projectRoot, directory.startsWith("./") ?
				directory.substring(2) : directory);
		} else {
			dir = new File(directory);
		}

		if (!dir.exists() && !dir.mkdirs()) {
			throw new DockerfileException(ErrorCode.DOCKER_DIRECTORY_CREATE_ERROR);
		}

		return dir;
	}

	private File createSubdirectory(File parentDir, String subdirName) {
		File subdir = new File(parentDir, subdirName);
		if (!subdir.exists() && !subdir.mkdirs()) {
			throw new DockerfileException(ErrorCode.DOCKER_DIRECTORY_CREATE_ERROR);
		}
		return subdir;
	}

	private String saveFileContent(File directory, String filename, String content) throws IOException {
		File file = new File(directory, filename);
		try (FileWriter writer = new FileWriter(file)) {
			writer.write(content);
		}
		return file.getAbsolutePath();
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

	private String generateBuildArgsFromEnvKeys(String envFilePath) throws IOException {
		Map<String, String> envMap = loadEnv(envFilePath);
		StringBuilder builder = new StringBuilder();
		for (String key : envMap.keySet()) {
			builder.append("        ").append(key).append(": ${").append(key).append("}\n");
		}
		return builder.toString();
	}

	private String generateArgAndEnvBlock(String envFilePath) throws IOException {
		Map<String, String> envMap = loadEnv(envFilePath);
		StringBuilder block = new StringBuilder();

		for (String key : envMap.keySet()) {
			if (!key.startsWith("VITE_")) continue; // 필요한 경우 필터링
			block.append("ARG ").append(key).append("\n");
		}
		block.append("\n");
		for (String key : envMap.keySet()) {
			if (!key.startsWith("VITE_")) continue;
			block.append("ENV ").append(key).append("=$").append(key).append("\n");
		}
		return block.toString();
	}

	public void uploadFiles(DockerfileRequestDto requestDto, Map<String, String> generatedPaths) {
		try {
			String os = System.getProperty("os.name").toLowerCase();
			boolean isWindows = os.contains("win");

			// 로깅 추가
			System.out.println("운영체제: " + os);
			System.out.println("Windows 환경: " + isWindows);

			// 상대 경로 사용
			String projectRoot = new File("").getAbsolutePath();
			String uploadScript = isWindows ? projectRoot + "/scripts/window/deploy_projects_files.ps1"
				: projectRoot + "/scripts/linux/deploy_project_files.sh";

			String envPath = System.getProperty("user.home") + "/.devpilot/.env";
			Map<String, String> envMap = loadEnv(envPath);
			String localBackDir = envMap.getOrDefault("LOCAL_BACK_DIR", "") + "/.env";

			// 스크립트 존재 여부 확인
			File scriptFile = new File(uploadScript);
			if (!scriptFile.exists()) {
				System.err.println("❌ 스크립트 파일이 존재하지 않습니다: " + uploadScript);
				throw new RuntimeException("스크립트 파일이 존재하지 않습니다: " + uploadScript);
			}
			System.out.println("✅ 스크립트 파일 확인: " + uploadScript);

			// 명령어 구성
			List<String> command = new ArrayList<>();
			if (isWindows) {
				command.add("powershell");
				command.add("-ExecutionPolicy");
				command.add("Bypass");
				command.add("-File");
				command.add(uploadScript);

				// PowerShell 매개변수 추가
				command.add("-ProjectName");
				command.add(requestDto.getProjectName());

				command.add("-BackendDockerfile");
				command.add(generatedPaths.get("backendDockerfile"));

				command.add("-FrontendDockerfile");
				command.add(generatedPaths.get("frontendDockerfile"));

				command.add("-DockerCompose");
				command.add(generatedPaths.get("dockerCompose"));

				if (generatedPaths.containsKey("nginxConfig")) {
					command.add("-NginxConf");
					command.add(generatedPaths.get("nginxConfig"));
				} else {
					// nginx.conf가 없는 경우 빈 파일 생성해서 전달
					File tempNginxConf = File.createTempFile("nginx", ".conf");
					command.add("-NginxConf");
					command.add(tempNginxConf.getAbsolutePath());
				}

				if (!localBackDir.isEmpty()) {
					File backendEnvFile = new File(localBackDir);
					if (backendEnvFile.exists()) {
						command.add("-BackendEnv");
						command.add(backendEnvFile.getAbsolutePath());
						System.out.println("✅ backend .env 파일 확인 및 전달: " + backendEnvFile.getAbsolutePath());
					} else {
						// 존재하지 않을 경우 빈 파일 생성
						File emptyEnv = File.createTempFile("empty-backend", ".env");
						command.add("-BackendEnv");
						command.add(emptyEnv.getAbsolutePath());
						System.out.println("⚠️ backend .env 파일 없음, 빈 파일 전달");
					}
				} else {
					// localBackDir 값 자체가 비어 있을 경우에도 처리
					File emptyEnv = File.createTempFile("empty-backend", ".env");
					command.add("-BackendEnvPath");
					command.add(emptyEnv.getAbsolutePath());
					System.out.println("⚠️ LOCAL_BACK_DIR이 설정되지 않음, 빈 .env 파일 전달");
				}
			} else {
				// Linux 환경 명령어 구성 (필요한 경우)
				command.add("bash");
				command.add(uploadScript);
				// 매개변수 추가...
			}

			// 명령어 로깅
			System.out.println("실행할 명령어: " + String.join(" ", command));

			ProcessBuilder pb = new ProcessBuilder(command);
			pb.redirectErrorStream(true);

			Process process = pb.start();
			StringBuilder output = new StringBuilder();
			try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()))) {
				String line;
				while ((line = reader.readLine()) != null) {
					System.out.println("[deploy_project_files] " + line);
					output.append(line).append("\n");
				}
			}

			int exitCode = process.waitFor();
			System.out.println("스크립트 종료 코드: " + exitCode);
			if (exitCode != 0) {
				System.err.println("❌ Dockerfile 업로드 실패. 출력: \n" + output.toString());
				throw new RuntimeException("❌ Dockerfile 업로드 실패: exitCode = " + exitCode + "\n" + output.toString());
			}

			System.out.println("✅ Dockerfile 및 설정 파일 업로드 완료");

		} catch (IOException | InterruptedException e) {
			e.printStackTrace(); // 상세 에러 정보 출력
			throw new RuntimeException("❌ 스크립트 실행 중 오류 발생: " + e.getMessage(), e);
		}
	}

}