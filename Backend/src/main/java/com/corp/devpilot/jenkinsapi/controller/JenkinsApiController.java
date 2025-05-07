package com.corp.devpilot.jenkinsapi.controller;

import java.io.IOException;
import java.util.concurrent.Executors;

import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import com.corp.devpilot.jenkinsapi.domain.dto.JenkinsInfoDto;
import com.corp.devpilot.jenkinsapi.domain.dto.ProgressiveLogDto;
import com.corp.devpilot.jenkinsapi.service.JenkinsApiService;
import com.corp.devpilot.jenkinsapi.service.TokenManager;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/jenkinsapi")
@RequiredArgsConstructor
public class JenkinsApiController {

	private final JenkinsApiService jenkinsApiService;
	private final TokenManager tokenManager;

	@GetMapping("/info")
	public ResponseEntity<JenkinsInfoDto> getInfo() {
		return ResponseEntity.ok(jenkinsApiService.fetchInfo());
	}

	@GetMapping(value = "/stream/{jobName}/{buildNumber}",
		produces = MediaType.TEXT_EVENT_STREAM_VALUE)
	public SseEmitter streamBuildLog(
		@PathVariable String jobName,
		@PathVariable int buildNumber) {
		SseEmitter emitter = new SseEmitter(10000L);
		Executors.newSingleThreadExecutor().submit(() -> {
			long offset = 0L;
			try {
				while (true) {
					ProgressiveLogDto dto = jenkinsApiService.fetchProgressiveLog(jobName, buildNumber, offset);
					// 로그 청크 전송
					emitter.send(dto.getChunk());
					offset = dto.getTextSize();
					if (!dto.isMoreData()) {
						break;
					}
				}
				emitter.complete();
			} catch (IOException ex) {
				emitter.completeWithError(ex);
			}
		});
		return emitter;
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
