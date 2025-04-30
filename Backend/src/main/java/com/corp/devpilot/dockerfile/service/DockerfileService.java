package com.corp.devpilot.dockerfile.service;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.stream.Collectors;

import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import com.corp.devpilot.dockerfile.domain.dto.DockerfileRequestDto;
import com.corp.devpilot.dockerfile.domain.dto.DockerfileResponseDto;
import com.corp.devpilot.global.error.code.ErrorCode;
import com.corp.devpilot.global.error.exception.DockerfileException;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class DockerfileService {

	public DockerfileResponseDto generateDockerfiles(DockerfileRequestDto dockerfileRequestDto) {
		try {
			validateRequest(dockerfileRequestDto);

			String backendDockerfile = generateBackendDockerfile(dockerfileRequestDto);
			String frontendDockerfile = generateFrontendDockerfile(dockerfileRequestDto);
			String dockerCompose = generateDockerCompose(dockerfileRequestDto);
			String nginxConfigContent = dockerfileRequestDto.isUseNginx() ? generateNginxContent(dockerfileRequestDto) : null;

			return DockerfileResponseDto.success(
				backendDockerfile,
				frontendDockerfile,
				dockerCompose,
				nginxConfigContent
			);
		} catch (IOException e) {
			throw new DockerfileException(ErrorCode.DOCKER_TEMPLATE_ERROR);
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
			mysqlTemplate = mysqlTemplate.replace("##MYSQL_ROOT_PASSWORD##", dockerfileRequestDto.getMysqlRootPassword());
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
			nginxTemplate = nginxTemplate.replace("##FRONTEND_PORT##", String.valueOf(dockerfileRequestDto.getFrontendPort()));
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

	private void validateRequest(DockerfileRequestDto requestDto) {
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

		if (requestDto.getBackendPort() <= 0 || requestDto.getFrontendPort() <= 0) {
			throw new DockerfileException(ErrorCode.DOCKER_INVALID_PORT);
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

}
