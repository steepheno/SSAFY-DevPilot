package com.corp.devpilot.jenkinsapi.domain.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * CSRF 방지용 Jenkins Crumb 발급 응답 DTO
 */

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CrumbDto {
    private String crumbRequestField;
    private String crumb;
}
