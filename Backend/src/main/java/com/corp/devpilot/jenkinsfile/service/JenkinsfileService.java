package com.corp.devpilot.jenkinsfile.service;

import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;
import org.thymeleaf.exceptions.TemplateEngineException;

import com.corp.devpilot.global.error.code.ErrorCode;
import com.corp.devpilot.global.error.exception.JenkinsfileException;
import com.corp.devpilot.jenkinsfile.dto.JenkinsResponseDto;
import com.corp.devpilot.jenkinsfile.dto.JenkinsfileRequestDto;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class JenkinsfileService {

	private final TemplateEngine templateEngine;

	public JenkinsResponseDto generateJenkinsfile(JenkinsfileRequestDto requestDto) {
		try {
			validateRequest(requestDto);

			Context context = createTemplateContext(requestDto);

			String templatePath = "jenkinsfile/monorepo-template";

			String jenkinsfileContent = processTemplate(templatePath, context);

			return JenkinsResponseDto.success(jenkinsfileContent, requestDto.getProjectType().toString());

		} catch (TemplateEngineException e) {
			throw new JenkinsfileException(ErrorCode.JENKINS_TEMPLATE_ERROR);
		} catch (Exception e) {
			throw new JenkinsfileException(ErrorCode.INTERNAL_SERVER_ERROR);
		}
	}

	private Context createTemplateContext(JenkinsfileRequestDto requestDto) {
		Context context = new Context();

		context.setVariable("projectName", requestDto.getProjectName());
		context.setVariable("gitRepositoryUrl", requestDto.getGitRepositoryUrl());
		context.setVariable("gitCredentialsId", requestDto.getGitCredentialsId());
		context.setVariable("branchConfigs", requestDto.getBranchConfigs());
		context.setVariable("javaVersion", requestDto.getJavaVersion());
		context.setVariable("frontendDir", requestDto.getFrontendDir());
		context.setVariable("backendDir", requestDto.getBackendDir());

		context.setVariable("mattermostNotification", requestDto.isMattermostNotification());
		if (requestDto.isMattermostNotification()) {
			context.setVariable("mattermostWebhookUrl", requestDto.getMattermostWebhookUrl());
			context.setVariable("mattermostChannel", requestDto.getMattermostChannel());
		}

		return context;
	}

	private String processTemplate(String templatePath, Context context) {
		try {
			return templateEngine.process(templatePath, context);
		} catch (TemplateEngineException e) {
			log.error("템플릿 처리 중 오류 발생: {}", e.getMessage(), e);
			throw new JenkinsfileException(ErrorCode.JENKINS_TEMPLATE_ERROR);
		}
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