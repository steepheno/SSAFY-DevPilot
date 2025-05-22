package com.corp.devpilot.global.error.exception;

import com.corp.devpilot.global.error.code.ErrorCode;

public class JenkinsApiException extends BusinessException {
	public JenkinsApiException(ErrorCode errorCode) {
		super(errorCode);
	}
}
