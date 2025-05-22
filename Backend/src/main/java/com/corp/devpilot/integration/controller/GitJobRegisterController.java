package com.corp.devpilot.integration.controller;

import com.corp.devpilot.integration.dto.GitJobRegisterRequest;
import com.corp.devpilot.integration.service.GitJobRegisterService;
import io.swagger.v3.oas.annotations.Operation;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.File;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/git")
@RequiredArgsConstructor
public class GitJobRegisterController {
	private final GitJobRegisterService gitJobRegisterService;

	@Value("${jenkins.github.script-path:./scripts/register_github_job.sh}")
	private String githubScriptPath;

	@Value("${jenkins.gitlab.script-path:./scripts/register_gitlab_job.sh}")
	private String gitlabScriptPath;

	@PostMapping("/register/github")
	@Operation(summary = "GitHub 파이프라인 등록", description = "GitHub 저장소를 Jenkins Job으로 등록합니다.")
	public ResponseEntity<Map<String, Object>> registerGithubJob(@RequestBody GitJobRegisterRequest requestDto) {
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

		gitJobRegisterService.registerJob(requestDto, scriptPath);
		Map<String, Object> response = new HashMap<>();
		response.put("message", "GitHub Job 등록 성공");
		return ResponseEntity.ok(response);
	}

	@PostMapping("/register/gitlab")
	@Operation(summary = "GitLab 파이프라인 등록", description = "GitLab 저장소를 Jenkins Job으로 등록합니다.")
	public ResponseEntity<Map<String, Object>> registerGitlabJob(@RequestBody GitJobRegisterRequest requestDto) {
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

		gitJobRegisterService.registerJob(requestDto, scriptPath);
		Map<String, Object> response = new HashMap<>();
		response.put("message", "GitLab Job 등록 성공");
		return ResponseEntity.ok(response);
	}
}
