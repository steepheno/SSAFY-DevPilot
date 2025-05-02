package com.corp.devpilot.jenkinsapi.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.corp.devpilot.jenkinsapi.domain.dto.JenkinsInfoDto;
import com.corp.devpilot.jenkinsapi.service.JenkinsApiService;
import com.corp.devpilot.jenkinsapi.service.TokenManager;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/jenkinsapi")
@RequiredArgsConstructor
public class JenkinsApiController {

	private final JenkinsApiService svc;
	private final TokenManager tokenManager;

	@GetMapping("/info")
	public ResponseEntity<JenkinsInfoDto> getInfo() {
		return ResponseEntity.ok(svc.fetchInfo());
	}

	// api token 테스트 용. 나중에 삭제
	public static class LoginRequest {
		public String initialPassword;
	}

	// api token 테스트 용. 나중에 삭제
	@PostMapping("/login")
	public ResponseEntity<?> login(@RequestBody LoginRequest req) {
		try {
			tokenManager.generateAndSaveToken(req.initialPassword);
			return ResponseEntity.ok().build();
		} catch (Exception e) {
			return ResponseEntity
				.status(401)
				.body("로그인 실패: " + e.getMessage());
		}
	}

}
