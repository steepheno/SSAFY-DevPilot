package com.corp.devpilot.jenkinsapi.domain.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BuildSummaryDto {
	private int number;
	private String result;
	private long timestamp;
	private long duration;
}