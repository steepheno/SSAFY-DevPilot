package com.corp.devpilot.integration.service;

import com.corp.devpilot.global.error.exception.JenkinsfileException;
import com.corp.devpilot.integration.dto.GitJobRegisterRequest;
import com.corp.devpilot.global.error.code.ErrorCode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class GitJobRegisterService {

	public void registerJob(GitJobRegisterRequest request, String scriptPath) {
		ProcessBuilder processBuilder = buildProcess(request, scriptPath);
		processBuilder.redirectErrorStream(true);

		try {
			Process process = processBuilder.start();
			try (BufferedReader reader = new BufferedReader(
				new InputStreamReader(process.getInputStream()))) {
				String line;
				while ((line = reader.readLine()) != null) {
					log.info("[Shell] {}", line);
				}
			}

			int exitCode = process.waitFor();
			if (exitCode != 0) {
				throw new JenkinsfileException(ErrorCode.JENKINS_JOB_CREATION_FAILED);
			}

		} catch (Exception e) {
			log.error("Jenkins Job 등록 중 오류 발생", e);
			throw new JenkinsfileException(ErrorCode.INTERNAL_SERVER_ERROR);
		}
	}

	private ProcessBuilder buildProcess(GitJobRegisterRequest request, String scriptPath) {
		List<String> command = new ArrayList<>();

		String os = System.getProperty("os.name").toLowerCase();
		boolean isWindows = os.contains("win");

		if (isWindows) {
			command.add("powershell.exe");
			command.add("-ExecutionPolicy");
			command.add("Bypass");
			command.add("-File");
		} else {
			command.add("bash");
		}

		command.add(scriptPath);

		command.add("-git_token");
		command.add(request.getGitToken());

		command.add("-git_credentials_id");
		command.add(request.getGitCredentialsId());

		command.add("-git_personal_token");
		command.add(request.getGitPersonalToken());

		command.add("-git_personal_credentials_id");
		command.add(request.getGitPersonalCredentialsId());

		command.add("-git_username");
		command.add(request.getGitUsername());

		command.add("-git_repo_url");
		command.add(request.getGitRepoUrl());

		command.add("-jenkins_job_name");
		command.add(request.getJenkinsJobName());

		ProcessBuilder processBuilder = new ProcessBuilder(command);
		processBuilder.redirectErrorStream(true);
		return processBuilder;
	}


}
