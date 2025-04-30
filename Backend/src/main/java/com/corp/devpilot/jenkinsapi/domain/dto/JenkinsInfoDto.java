package com.corp.devpilot.jenkinsapi.domain.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

/**
 * Jenkins 최상위 API(/api/json) 응답에서
 * 주로 사용할 필드만 담은 DTO
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class JenkinsInfoDto {
    private String mode;
    private String nodeDescription;
    private List<JobDto> jobs;
}
