package com.corp.devpilot.jenkinsfile.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.corp.devpilot.jenkinsfile.dto.JenkinsResponseDto;
import com.corp.devpilot.jenkinsfile.dto.JenkinsfileRequestDto;
import com.corp.devpilot.jenkinsfile.service.JenkinsfileService;

import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/jenkins")
@RequiredArgsConstructor
@Tag(name = "Jenkinsfile", description = "Jenkinsfile 생성 API")
public class JenkinsController {

	private final JenkinsfileService jenkinsfileService;

	@PostMapping("/generate")
	public ResponseEntity<JenkinsResponseDto> generateJenkinsfile(@RequestBody JenkinsfileRequestDto requestDto) {
		JenkinsResponseDto responseDto = jenkinsfileService.generateJenkinsfile(requestDto);
		return ResponseEntity.ok(responseDto);
	}
}
