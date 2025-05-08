package com.corp.devpilot.jenkinsapi.domain.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class JenkinsEventDto {
	// 이벤트 종류 (JOB_STARTED, JOB_COMPLETED, PIPELINE_STARTED, PIPELINE_COMPLETED)
	private String eventType;

	// 빌드 또는 파이프라인 이름
	private String name;

	// 빌드 또는 파이프라인 번호 (Build Number 혹은 Pipeline Run ID)
	private int buildNumber;

	// 완료 이벤트의 경우 결과 값 (e.g. SUCCESS, FAILURE)
	private String result;

	// 이벤트 발생 시각 (epoch millis)
	private long timestamp;
}
