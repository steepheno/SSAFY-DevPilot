package com.corp.devpilot.jenkinsfile.controller;

import java.util.HashMap;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.corp.devpilot.jenkinsfile.domain.dto.JenkinsfileRequestDto;
import com.corp.devpilot.jenkinsfile.service.JenkinsfileService;

import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/jenkinsfile")
@RequiredArgsConstructor
@Tag(name = "Jenkinsfile", description = "Jenkinsfile 생성")
public class JenkinsfileController {

	private final JenkinsfileService jenkinsfileService;

	@Value("${jenkinsfile.output.directory:./result/jenkinsfile}")
	// 이 부분 application.yml에서 확인 필요 server 내부로 들어가있어서 인식 안 될 듯
	private String outputDirectory;

	@PostMapping(value = "/generate-file")
	public ResponseEntity<Map<String, String>> generateJenkinsfileToFile(
		@RequestBody JenkinsfileRequestDto requestDto) {
		String filePath = jenkinsfileService.saveJenkinsfileToFile(requestDto, outputDirectory);

		Map<String, String> response = new HashMap<>();
		response.put("message", "Jenkinsfile이 성공적으로 생성되었습니다.");
		response.put("filePath", filePath);
		response.put("projectType", requestDto.getJenkinsfileProjectType().toString());

		return ResponseEntity.ok().body(response);
	}

}