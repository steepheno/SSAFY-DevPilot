package com.corp.devpilot.jenkinsapi.domain.dto;

import java.util.List;
import java.util.Map;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BuildDetailDto {
	private int number;
	private String result;
	private long timestamp;
	private long duration;
	private String fullDisplayName;
	private List<Map<String, Object>> parameters;
}