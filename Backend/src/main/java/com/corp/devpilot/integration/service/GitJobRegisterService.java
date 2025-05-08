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
		command.add("bash");
		command.add(scriptPath);
		command.add("--git-token=" + request.getGitToken());
		command.add("--git-credentials-id=" + request.getGitCredentialsId());
		command.add("--git-repo-url=" + request.getGitRepoUrl());
		command.add("--jenkins-job-name=" + request.getJenkinsJobName());

		ProcessBuilder processBuilder = new ProcessBuilder(command);
		processBuilder.redirectErrorStream(true);
		return processBuilder;
	}

}
