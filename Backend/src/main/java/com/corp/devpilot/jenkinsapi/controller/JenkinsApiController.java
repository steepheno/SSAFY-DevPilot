package com.corp.devpilot.jenkinsapi.controller;

import java.util.List;

import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.codec.ServerSentEvent;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import com.corp.devpilot.jenkinsapi.domain.dto.BuildDetailDto;
import com.corp.devpilot.jenkinsapi.domain.dto.BuildSummaryDto;
import com.corp.devpilot.jenkinsapi.domain.dto.JenkinsInfoDto;
import com.corp.devpilot.jenkinsapi.service.JenkinsApiService;
import com.corp.devpilot.jenkinsapi.service.JenkinsEventService;
import com.corp.devpilot.jenkinsapi.service.TokenManager;

import lombok.RequiredArgsConstructor;
import reactor.core.publisher.Flux;

@RestController
@RequestMapping("/api/jenkinsapi")
@RequiredArgsConstructor
public class JenkinsApiController {

	private final JenkinsApiService jenkinsApiService;
	private final TokenManager tokenManager;
	private final JenkinsEventService jenkinsEventService;

	/**
	 * Jenkins 기본 정보 불러오기
	 */
	@GetMapping("/info")
	public ResponseEntity<JenkinsInfoDto> getInfo() {
		return ResponseEntity.ok(jenkinsApiService.fetchInfo());
	}

	/**
	 * Job lastBuild 불러오기
	 */
	@GetMapping("{jobName}/lastBuild")
	public ResponseEntity<Integer> getLastBuild(@PathVariable String jobName) {
		return ResponseEntity.ok(jenkinsApiService.lastBuild(jobName));
	}

	/**
	 * Jenkins build log 실시간 스트리밍 (SSE)
	 */
	@GetMapping(value = "/stream/{jobName}/{buildNumber}",
		produces = MediaType.TEXT_EVENT_STREAM_VALUE)
	public Flux<ServerSentEvent<String>> streamLog(
		@PathVariable String jobName,
		@PathVariable int buildNumber
	) {
		return jenkinsEventService.streamLog(jobName, buildNumber);
	}

	/**
	 * Jenkins 이벤트(job & pipeline) 실시간 스트리밍 (SSE)
	 */
	@GetMapping(value = "/events/stream/{clientId}",
		produces = MediaType.TEXT_EVENT_STREAM_VALUE)
	public SseEmitter streamEvents(@PathVariable String clientId) {
		return jenkinsEventService.streamBuildAndPipelineEvents(clientId);
	}

	@GetMapping("/job/{jobName}")
	public ResponseEntity<List<BuildSummaryDto>> getSummaries(@PathVariable String jobName) {
		return ResponseEntity.ok(jenkinsApiService.fetchBuildSummaries(jobName));
	}

	@GetMapping("/job/{jobName}/{buildNumber}")
	public ResponseEntity<BuildDetailDto> getDetail(
		@PathVariable String jobName,
		@PathVariable int buildNumber
	) {
		return ResponseEntity.ok(jenkinsApiService.fetchBuildDetail(jobName, buildNumber));
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
