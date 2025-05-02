package com.corp.devpilot.dockerfile.service;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileWriter;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
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

			return generatedFilePaths;
		} catch (IOException e) {
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
		result = result.replace("##BACKEND_DIR##", dockerfileRequestDto.getBackendDir());
		result = result.replace("##PROJECT_NAME##", dockerfileRequestDto.getProjectName());

		return result;
	}

	private String generateFrontendDockerfile(DockerfileRequestDto dockerfileRequestDto) throws IOException {
		String templatePath;

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
		result = result.replace("##FRONTEND_DIR##", dockerfileRequestDto.getFrontendDir());

		return result;
	}

	private String generateDockerCompose(DockerfileRequestDto dockerfileRequestDto) throws IOException {
		String templatePath = "templates/dockerfile/docker-compose.txt";
		String template = readTemplateFile(templatePath);

		String result = template;
		result = result.replace("##PROJECT_NAME##", dockerfileRequestDto.getProjectName());
		result = result.replace("##BACKEND_PORT##", String.valueOf(dockerfileRequestDto.getBackendPort()));
		result = result.replace("##FRONTEND_PORT##", String.valueOf(dockerfileRequestDto.getFrontendPort()));

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

			additionalServices.append(nginxTemplate).append("\n\n");
		}

		result = result.replace("##ADDITIONAL_SERVICES##", additionalServices.toString());

		return result;
	}

	private String generateNginxContent(DockerfileRequestDto dockerfileRequestDto) throws IOException {
		String templatePath = "templates/dockerfile/etc/nginx.conf.txt";
		String template = readTemplateFile(templatePath);

		String result = template;
		result = result.replace("##FRONTEND_PORT##", String.valueOf(dockerfileRequestDto.getFrontendPort()));
		result = result.replace("##BACKEND_PORT##", String.valueOf(dockerfileRequestDto.getBackendPort()));

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
}