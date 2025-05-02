package com.corp.devpilot.dockerfile.controller;

import java.util.HashMap;
import java.util.Map;

import org.springframework.core.io.ClassPathResource;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.corp.devpilot.dockerfile.domain.dto.DockerfileRequestDto;
import com.corp.devpilot.dockerfile.domain.dto.DockerfileResponseDto;
import com.corp.devpilot.dockerfile.service.DockerfileService;

import io.swagger.v3.oas.annotations.Operation;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/docker")
@RequiredArgsConstructor
public class DockerfileController {

	private final DockerfileService dockerfileService;

	@PostMapping(value = "/generate", produces = "application/json")
	public ResponseEntity<DockerfileResponseDto> generateDockerfiles(@RequestBody DockerfileRequestDto requestDto) {
		DockerfileResponseDto responseDto = dockerfileService.generateDockerfiles(requestDto);
		return ResponseEntity.ok()
			.contentType(MediaType.APPLICATION_JSON)
			.body(responseDto);
	}

}
