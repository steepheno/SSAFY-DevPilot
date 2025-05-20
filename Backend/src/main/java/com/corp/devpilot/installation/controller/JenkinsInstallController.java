package com.corp.devpilot.installation.controller;

import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.corp.devpilot.installation.dto.JenkinsInstallRequestDto;
import com.corp.devpilot.installation.dto.StatusResponse;
import com.corp.devpilot.installation.service.JenkinsInstallService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/initial-setting")
@RequiredArgsConstructor
@Tag(name = "Jenkins 설치", description = "Jenkins 자동 설치 실행")
public class JenkinsInstallController {

	private final JenkinsInstallService jenkinsInstallService;

	@PostMapping("/install")
	@Operation(summary = "Jenkins 자동 설치 실행", description = "main.sh 스크립트를 실행해 EC2에 Jenkins를 설치합니다.")
	public ResponseEntity<Map<String, Object>> install(@RequestBody JenkinsInstallRequestDto requestDto) {
		jenkinsInstallService.installJenkins(requestDto);
		return ResponseEntity.ok(Map.of("message", "Jenkins 설치 스크립트 실행 완료"));
	}

	@PostMapping("/test")
	public boolean test(@RequestBody JenkinsInstallRequestDto requestDto) {
		jenkinsInstallService.confirmJenkins(requestDto);
		return true;
	}

	@GetMapping("/status")
	public ResponseEntity<StatusResponse> checkInstallStatus() {
		return ResponseEntity.ok(jenkinsInstallService.checkJenkins());
	}
}
