package com.corp.devpilot.jenkinsfile.service;

import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;

import com.corp.devpilot.global.error.code.ErrorCode;
import com.corp.devpilot.global.error.exception.JenkinsfileException;
import com.corp.devpilot.jenkinsfile.domain.dto.BranchConfig;
import com.corp.devpilot.jenkinsfile.domain.dto.JenkinsResponseDto;
import com.corp.devpilot.jenkinsfile.domain.dto.JenkinsfileRequestDto;

import lombok.RequiredArgsConstructor;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class JenkinsfileService {

	private final TemplateEngine templateEngine;

	public JenkinsResponseDto generateJenkinsfile(JenkinsfileRequestDto requestDto) {
		try {
			validateRequest(requestDto);

			String templateContent = readTemplateFile("templates/jenkinsfile/monorepo-template.txt");

			String jenkinsfileContent = replaceVariables(templateContent, requestDto);

			return JenkinsResponseDto.success(jenkinsfileContent, requestDto.getProjectType().toString());
		} catch (IOException e) {
			throw new JenkinsfileException(ErrorCode.JENKINS_TEMPLATE_ERROR);
		} catch (Exception e) {
			throw new JenkinsfileException(ErrorCode.INTERNAL_SERVER_ERROR);
		}
	}

	private String readTemplateFile(String path) throws IOException {
		try (BufferedReader reader = new BufferedReader(
			new InputStreamReader(new ClassPathResource(path).getInputStream(), StandardCharsets.UTF_8))) {
			return reader.lines().collect(Collectors.joining("\n"));
		}
	}

	private String replaceVariables(String template, JenkinsfileRequestDto requestDto) {
		String result = template;

		result = result.replace("[(${projectName})]", requestDto.getProjectName());
		result = result.replace("[(${gitRepositoryUrl})]", requestDto.getGitRepositoryUrl());
		result = result.replace("[(${gitCredentialsId})]", requestDto.getGitCredentialsId());
		result = result.replace("[(${javaVersion})]", requestDto.getJavaVersion());
		result = result.replace("[(${frontendDir})]", requestDto.getFrontendDir());
		result = result.replace("[(${backendDir})]", requestDto.getBackendDir());

		result = result.replace("##BRANCH_NAME##", "${BRANCH_NAME}");
		result = result.replace("[(${BRANCH_NAME_VAR})]", "${BRANCH_NAME}");

		if (requestDto.isMattermostNotification()) {
			result = result.replace("[# th:if=\"${mattermostNotification}\"]", "");
			result = result.replace("[/]", "");
			result = result.replace("[(${mattermostWebhookUrl})]", requestDto.getMattermostWebhookUrl());
			result = result.replace("[(${mattermostChannel})]", requestDto.getMattermostChannel());
		} else {
			result = removeMattermostSection(result);
		}

		result = replaceBranchConfigs(result, requestDto);

		return result;
	}

	private String removeMattermostSection(String template) {
		int startIdx = template.indexOf("[# th:if=\"${mattermostNotification}\"]");
		int endIdx = template.indexOf("[/]", startIdx);

		if (startIdx >= 0 && endIdx >= 0) {
			return template.substring(0, startIdx) + template.substring(endIdx + 3);
		}

		return template;
	}

	private String replaceBranchConfigs(String template, JenkinsfileRequestDto requestDto) {
		StringBuilder branchConfigsStr = new StringBuilder();

		for (BranchConfig config : requestDto.getBranchConfigs()) {
			branchConfigsStr.append("        [branchName: '")
				.append(config.getBranchName())
				.append("', buildEnabled: ")
				.append(config.isBuildEnabled())
				.append(", testEnabled: ")
				.append(config.isTestEnabled())
				.append(", deployEnabled: ")
				.append(config.isDeployEnabled())
				.append("],\n");
		}

		if (branchConfigsStr.length() > 0) {
			branchConfigsStr.setLength(branchConfigsStr.length() - 2);
		}

		return template.replace("##BRANCH_CONFIGS##", branchConfigsStr.toString());
	}

	private void validateRequest(JenkinsfileRequestDto requestDto) {
		if (requestDto == null) {
			throw new JenkinsfileException(ErrorCode.INVALID_INPUT_VALUE);
		}

		if (requestDto.getProjectType() == null) {
			throw new JenkinsfileException(ErrorCode.INVALID_ENUM_VALUE);
		}

		if (requestDto.getProjectName() == null || requestDto.getProjectName().isEmpty()) {
			throw new JenkinsfileException(ErrorCode.JENKINS_INVALID_PROJECT_NAME);
		}

		if (requestDto.getGitRepositoryUrl() == null || requestDto.getGitRepositoryUrl().isEmpty()) {
			throw new JenkinsfileException(ErrorCode.JENKINS_INVALID_GIT_URL);
		}

		if (requestDto.getGitCredentialsId() == null || requestDto.getGitCredentialsId().isEmpty()) {
			throw new JenkinsfileException(ErrorCode.JENKINS_INVALID_CREDENTIAL_ID);
		}

		if (requestDto.getBranchConfigs() == null || requestDto.getBranchConfigs().isEmpty()) {
			throw new JenkinsfileException(ErrorCode.JENKINS_INVALID_BRANCH_CONFIG);
		}

		if (requestDto.getJavaVersion() == null || requestDto.getJavaVersion().isEmpty()) {
			throw new JenkinsfileException(ErrorCode.JENKINS_INVALID_JAVA_VERSION);
		}

		if (requestDto.getFrontendDir() == null || requestDto.getFrontendDir().isEmpty()) {
			throw new JenkinsfileException(ErrorCode.JENKINS_INVALID_DIRECTORY);
		}

		if (requestDto.getBackendDir() == null || requestDto.getBackendDir().isEmpty()) {
			throw new JenkinsfileException(ErrorCode.JENKINS_INVALID_DIRECTORY);
		}
	}
}