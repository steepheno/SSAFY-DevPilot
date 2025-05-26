package com.corp.devpilot.global.error.exception;

import com.corp.devpilot.global.error.code.ErrorCode;

public class DockerfileException extends BusinessException {
	public DockerfileException(ErrorCode errorCode) {
		super(errorCode);
	}
}
