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
		result = result.replace("[(${gitCredentialsId})]", requestDto.getGitCredentialsId() + "_auth");
		result = result.replace("[(${javaVersion})]", requestDto.getJavaVersion());
		result = result.replace("[(${frontendDir})]", requestDto.getFrontendDir());
		result = result.replace("[(${backendDir})]", requestDto.getBackendDir());

		// 브랜치 이름 처리 개선
		result = result.replace("##BRANCH_NAME##", "${params.BRANCH_NAME}");
		result = result.replace("[(${BRANCH_NAME_VAR})]", "${params.BRANCH_NAME}");

		// 함수 호출 수정
		result = result.replace("findBranchConfig('${BRANCH_NAME}')", "findBranchConfig(\"${env.CURRENT_BRANCH}\")");
		result = result.replace("findBranchConfig(\"${BRANCH_NAME}\")", "findBranchConfig(\"${env.CURRENT_BRANCH}\")");

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
			boolean isWindows = os.contains("win");

			// 로깅 추가
			System.out.println("운영체제: " + os);
			System.out.println("Windows 환경: " + isWindows);

			// 상대 경로 사용
			String projectRoot = new File("").getAbsolutePath();
			String scriptPath = isWindows ?
				projectRoot + "/scripts/window/upload_jenkinsfile.ps1" :
				projectRoot + "/scripts/linux/upload_jenkinsfile.sh";

			// 스크립트 존재 여부 확인
			File scriptFile = new File(scriptPath);
			if (!scriptFile.exists()) {
				System.err.println("❌ 스크립트 파일이 존재하지 않습니다: " + scriptPath);
				throw new RuntimeException("스크립트 파일이 존재하지 않습니다: " + scriptPath);
			}
			System.out.println("✅ 스크립트 파일 확인: " + scriptPath);

			String remoteDir = remoteBaseDir + "/" + requestDto.getProjectName();

			List<String> command = new ArrayList<>();
			if (isWindows) {
				command.add("powershell");
				command.add("-ExecutionPolicy");
				command.add("Bypass");
				command.add("-File");
				command.add(scriptPath);
			} else {
				command.add("bash");
				command.add(scriptPath);
			}

			command.add("--jenkinsfile-path=" + localPath);
			command.add("--remote-dir=" + remoteDir);
			command.add("--job-name=" + requestDto.getProjectName());

			// 명령어 로깅
			System.out.println("실행할 명령어: " + String.join(" ", command));

			ProcessBuilder pb = new ProcessBuilder(command);
			pb.redirectErrorStream(true);
			Process process = pb.start();

			StringBuilder output = new StringBuilder();
			try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()))) {
				String line;
				while ((line = reader.readLine()) != null) {
					System.out.println("[upload_jenkinsfile] " + line);
					output.append(line).append("\n");
				}
			}

			int exitCode = process.waitFor();
			System.out.println("스크립트 종료 코드: " + exitCode);
			if (exitCode != 0) {
				System.err.println("❌ Jenkinsfile 업로드 실패. 출력: \n" + output.toString());
				throw new JenkinsfileException(ErrorCode.JENKINS_FILE_UPLOAD_ERROR);
			}

			System.out.println("✅ Jenkinsfile 업로드 완료");

		} catch (IOException | InterruptedException e) {
			e.printStackTrace(); // 상세 에러 정보 출력
			throw new JenkinsfileException(ErrorCode.JENKINS_FILE_UPLOAD_ERROR);
		} catch (Exception e) {
			e.printStackTrace();
			throw new JenkinsfileException(ErrorCode.JENKINS_FILE_UPLOAD_ERROR);
		}
	}
}