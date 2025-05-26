package com.corp.devpilot.dockerfile.controller;

import java.util.HashMap;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.corp.devpilot.dockerfile.domain.dto.DockerfileRequestDto;
import com.corp.devpilot.dockerfile.service.DockerfileService;

import io.swagger.v3.oas.annotations.Operation;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/docker")
@RequiredArgsConstructor
public class DockerfileController {

	private final DockerfileService dockerfileService;

	@Value("${dockerfile.output.directory:./result/dockerfile}")
	private String outputDirectory;

	@PostMapping(value = "/generate-files")
	@Operation(summary = "Dockerfile 파일 생성", description = "백엔드, 프론트엔드 Dockerfile과 docker-compose 파일을 생성하고 지정된 디렉토리에 저장합니다.")
	public ResponseEntity<Map<String, Object>> generateDockerfilesToFiles(
		@RequestBody DockerfileRequestDto requestDto) {
		Map<String, String> generatedFiles = dockerfileService.saveDockerfilesToFiles(requestDto, outputDirectory);
		Map<String, Object> response = new HashMap<>();
		response.put("message", "Dockerfile 파일들이 성공적으로 생성되었습니다.");
		response.put("files", generatedFiles);

		return ResponseEntity.ok().body(response);
	}
}