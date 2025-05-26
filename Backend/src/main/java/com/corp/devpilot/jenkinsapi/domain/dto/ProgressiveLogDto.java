package com.corp.devpilot.jenkinsapi.domain.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Jenkins Progressive Text API 호출 결과를 담는 DTO
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ProgressiveLogDto {
	private String chunk;      // 이번 호출로 새로 받은 로그 텍스트
	private long textSize;     // 응답 헤더 X-Text-Size
	private boolean moreData;  // 응답 헤더 X-More-Data
}
