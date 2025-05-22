package com.corp.devpilot.global.error.dto;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import com.corp.devpilot.global.error.code.ErrorCode;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@Schema(description = "API 에러 응답")
public class ErrorResponse {
	@Schema(description = "에러 발생 시간", example = "2024-01-23T10:00:00")
	private final LocalDateTime timestamp = LocalDateTime.now();

	@Schema(description = "HTTP 상태 코드", example = "400")
	private final int status;

	@Schema(description = "에러 메시지", example = "유효하지 않은 값입니다.")
	private final String message;

	@Schema(description = "상세 필드 에러 목록")
	private final List<FieldError> errors;

	@Getter
	@Builder
	@Schema(description = "필드 단위 에러 정보")
	public static class FieldError {
		@Schema(description = "에러가 발생한 필드명", example = "email")
		private final String field;

		@Schema(description = "에러가 발생한 값", example = "invalid-email")
		private final String value;

		@Schema(description = "에러 사유", example = "유효하지 않은 값입니다.")
		private final String reason;
	}

	public static ErrorResponse of(ErrorCode errorCode) {
		return ErrorResponse.builder()
			.status(errorCode.getStatus())
			.message(errorCode.getMessage())
			.errors(new ArrayList<>())
			.build();
	}

	public static ErrorResponse of(ErrorCode errorCode, List<FieldError> errors) {
		return ErrorResponse.builder()
			.status(errorCode.getStatus())
			.message(errorCode.getMessage())
			.errors(errors)
			.build();
	}
}

