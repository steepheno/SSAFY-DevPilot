package com.corp.devpilot.jenkinsfile.service;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileWriter;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;

import com.corp.devpilot.global.error.code.ErrorCode;
import com.corp.devpilot.global.error.exception.JenkinsfileException;
import com.corp.devpilot.jenkinsfile.domain.dto.JenkinsfileBranchConfig;
import com.corp.devpilot.jenkinsfile.domain.dto.JenkinsfileRequestDto;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class JenkinsfileService {

	private final TemplateEngine templateEngine;

	@Value("${ec2.remote-base-dir}")
	private String remoteBaseDir;

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

		for (JenkinsfileBranchConfig config : requestDto.getJenkinsfileBranchConfigs()) {
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

		if (requestDto.getJenkinsfileProjectType() == null) {
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

		if (requestDto.getJenkinsfileBranchConfigs() == null || requestDto.getJenkinsfileBranchConfigs().isEmpty()) {
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

	public String saveJenkinsfileToFile(JenkinsfileRequestDto requestDto, String targetDirectory) {
		try {
			validateRequest(requestDto);

			String templateContent = readTemplateFile("templates/jenkinsfile/monorepo-template.txt");
			String jenkinsfileContent = replaceVariables(templateContent, requestDto);

			File directory;
			if (targetDirectory.startsWith("./") || !targetDirectory.startsWith("/")) {
				String projectRoot = new File("").getAbsolutePath();
				directory = new File(projectRoot, targetDirectory.startsWith("./") ?
					targetDirectory.substring(2) : targetDirectory);
			} else {
				directory = new File(targetDirectory);
			}

			if (!directory.exists()) {
				if (!directory.mkdirs()) {
					throw new JenkinsfileException(ErrorCode.JENKINS_DIRECTORY_CREATE_ERROR);
				}
			}

			String fileName = "Jenkinsfile_" + requestDto.getProjectName().replaceAll("[^a-zA-Z0-9]", "_");
			File jenkinsfile = new File(directory, fileName);

			try (FileWriter writer = new FileWriter(jenkinsfile)) {
				writer.write(jenkinsfileContent);
			}

			uploadJenkinsfileToEc2(jenkinsfile.getAbsolutePath(), requestDto);

			return jenkinsfile.getAbsolutePath();
		} catch (IOException e) {
			throw new JenkinsfileException(ErrorCode.JENKINS_TEMPLATE_ERROR);
		} catch (Exception e) {
			throw new JenkinsfileException(ErrorCode.INTERNAL_SERVER_ERROR);
		}
	}

	private void uploadJenkinsfileToEc2(String localPath, JenkinsfileRequestDto requestDto) {
		try {
			String os = System.getProperty("os.name").toLowerCase();
			String scriptPath;

			if (os.contains("win")) {
				scriptPath = "./scripts/window/upload_jenkinsfile.ps1";
			} else {
				scriptPath = "./scripts/linux/upload_jenkinsfile.sh";
			}

			String remoteDir = remoteBaseDir + "/" + requestDto.getProjectName();

			List<String> command = new ArrayList<>();
			if (os.contains("win")) {
				command.add("powershell.exe");
				command.add("-ExecutionPolicy");
				command.add("Bypass");
				command.add("-File");
			} else {
				command.add("bash");
			}

			command.add(scriptPath);
			command.add("--jenkinsfile-path=" + localPath);
			command.add("--remote-dir=" + remoteDir);
			command.add("--job-name=" + requestDto.getProjectName());

			ProcessBuilder pb = new ProcessBuilder(command);
			pb.redirectErrorStream(true);
			Process process = pb.start();

			try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()))) {
				String line;
				while ((line = reader.readLine()) != null) {
					System.out.println("[" + new File(scriptPath).getName() + "] " + line);
				}
			}

			int exitCode = process.waitFor();
			if (exitCode != 0) {
				throw new JenkinsfileException(ErrorCode.JENKINS_FILE_UPLOAD_ERROR);
			}
		} catch (Exception e) {
			throw new JenkinsfileException(ErrorCode.JENKINS_FILE_UPLOAD_ERROR);
		}
	}
}