package com.corp.devpilot.jenkinsapi.controller;

import com.corp.devpilot.jenkinsapi.domain.dto.JenkinsInfoDto;
import com.corp.devpilot.jenkinsapi.service.JenkinsApiService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class JenkinsApiController {

    private final JenkinsApiService svc;

    public JenkinsApiController(JenkinsApiService svc) {
        this.svc = svc;
    }

    @GetMapping("/api/jenkins/info")
    public ResponseEntity<JenkinsInfoDto> getInfo() {
        return ResponseEntity.ok(svc.fetchInfo());
    }
}
