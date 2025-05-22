package com.corp.devpilot.global.error.code;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public enum ErrorCode {
	// Common
	INVALID_INPUT_VALUE(400, "잘못된 입력값입니다"),
	INTERNAL_SERVER_ERROR(500, "서버 오류가 발생했습니다"),
	UNAUTHORIZED(401, "인증되지 않은 접근입니다"),
	FORBIDDEN(403, "권한이 없습니다"),
	INVALID_ENUM_VALUE(400, "잘못된 상태값입니다"),

	// Jenkinsfile 관련
	JENKINS_INVALID_PROJECT_NAME(400, "유효하지 않은 프로젝트 이름입니다"),
	JENKINS_INVALID_GIT_URL(400, "유효하지 않은 Git 저장소 URL입니다"),
	JENKINS_INVALID_CREDENTIAL_ID(400, "유효하지 않은 Git 자격 증명 ID입니다"),
	JENKINS_INVALID_BRANCH_CONFIG(400, "유효하지 않은 브랜치 설정입니다"),
	JENKINS_INVALID_JAVA_VERSION(400, "유효하지 않은 Java 버전입니다"),
	JENKINS_INVALID_DIRECTORY(400, "유효하지 않은 디렉토리 경로입니다"),
	JENKINS_TEMPLATE_ERROR(500, "Jenkinsfile 템플릿 처리 중 오류가 발생했습니다"),
	JENKINS_DEPLOY_ERROR(500, "Jenkinsfile 배포 중 오류가 발생했습니다"),
	JENKINS_FILE_UPLOAD_ERROR(500, "파일 업로드 중 오류가 발생했습니다"),
	JENKINS_EMPTY_FILE(400, "빈 파일이 업로드되었습니다"),
	JENKINS_DIRECTORY_CREATE_ERROR(400, "디렉토리 생성에 실패했습니다."),
	JENKINS_JOB_CREATION_FAILED(400, "유효하지 않은 값입니다."),
	JENKINS_FILE_NOT_FOUND(400, "Jenkinsfile을 찾을 수 없습니다."),
	JENKINS_SCRIPT_NOT_FOUND(500, "업로드 스크립트를 찾을 수 없습니다."),

	// Dockerfile 관련
	DOCKER_TEMPLATE_ERROR(500, "Docker 템플릿 파일 처리 중 오류가 발생했습니다."),
	DOCKER_INVALID_PROJECT_NAME(400, "유효하지 않은 프로젝트 이름입니다."),
	DOCKER_INVALID_DIRECTORY(400, "유효하지 않은 디렉토리 경로입니다."),
	DOCKER_INVALID_JAVA_VERSION(400, "유효하지 않은 Java 버전입니다."),
	DOCKER_INVALID_PORT(400, "유효하지 않은 포트 설정입니다."),
	DOCKER_INVALID_MYSQL_CONFIG(400, "MySQL 설정이 완전하지 않습니다."),
	DOCKER_DIRECTORY_CREATE_ERROR(400, "디렉토리 생성에 실패했습니다."),

	// JenkinsApi 관련
	JENKINS_EMPTY_CRUMB(500, "유효하지 않은 crumb 입니다."),
	JENKINS_EMPTY_COOKIE(500, "유효하지 않은 Jenkins Cookie 입니다."),
	JENKINS_INVALID_TOKEN_FILE(500, "유효하지 않은 token file 입니다."),
	JENKINS_EMPTY_TOKEN(500, "토큰 발급이 이루어지지 않았습니다."),
	JENKINS_EMPTY_RESPONSE(500, "JENKINS 응답이 돌아오지 않습니다.."),
	JENKINS_API_UNSUCCESSFULL(400, "JenkinsApi 연결에 실패했습니다");

	private final int status;
	private final String message;
}