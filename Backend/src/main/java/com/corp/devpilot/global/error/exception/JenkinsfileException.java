package com.corp.devpilot.global.error.exception;

import com.corp.devpilot.global.error.code.ErrorCode;

public class JenkinsfileException extends BusinessException {

	public JenkinsfileException(ErrorCode errorCode) {
		super(errorCode);
	}

}
