package com.corp.devpilot.jenkinsapi.domain.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Jenkins 전체 정보(JSON 중 jobs 배열)에서
 * 각 Job 개요를 담는 DTO
 */

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class JobDto {
    private String name;
    private String url;
    private String color;  // e.g. "blue", "red", "disabled"
}
