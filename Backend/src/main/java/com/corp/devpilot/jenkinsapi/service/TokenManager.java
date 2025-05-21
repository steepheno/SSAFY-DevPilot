package com.corp.devpilot.jenkinsapi.service;

import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.StandardOpenOption;
import java.util.Properties;

import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.client.reactive.ReactorClientHttpConnector;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;

import com.corp.devpilot.global.error.code.ErrorCode;
import com.corp.devpilot.global.error.exception.JenkinsApiException;
import com.corp.devpilot.jenkinsapi.domain.dto.CrumbDto;
import com.corp.devpilot.jenkinsapi.parser.JenkinsParser;

import io.netty.handler.ssl.SslContext;
import io.netty.handler.ssl.SslContextBuilder;
import io.netty.handler.ssl.util.InsecureTrustManagerFactory;
import reactor.netty.http.client.HttpClient;

@Component
public class TokenManager {

	private WebClient webClientForAuth;
	private final String user;
	private final String tokenFilePath;
	private final String envPath;

	public TokenManager(
		@Value("${server.jenkins.user}") String user,
		@Value("${server.jenkins.tokenFile}") String tokenFilePath,
		@Value("${user.home}/.devpilot/.env") String envPath
	) {
		this.user = user;
		this.tokenFilePath = tokenFilePath;
		this.envPath = envPath;
	}

	public void isClient() throws JenkinsApiException {
		if (webClientForAuth == null) {
			try {
				Properties props = new Properties();
				props.load(new FileInputStream(envPath));

				SslContext sslContext = SslContextBuilder.forClient()
					.trustManager(InsecureTrustManagerFactory.INSTANCE)
					.build();

				HttpClient httpClient = HttpClient.create()
					.secure(spec -> spec.sslContext(sslContext));

				this.webClientForAuth = WebClient.builder()
					.baseUrl("http://" + props.getProperty("EC2_HOST") + ":" + props.getProperty("JENKINS_PORT"))
					.clientConnector(new ReactorClientHttpConnector(httpClient))
					.build();

				System.out.println(props.getProperty("EC2_HOST") + " " + props.getProperty("JENKINS_PORT"));

				//        this.client = WebClient.builder()
				//                .baseUrl(url)
				//                .defaultHeaders(h -> h.setBasicAuth(user, token))
				//                .build();
			} catch (Exception e) {
				throw new JenkinsApiException(ErrorCode.JENKINS_INVALID_TOKEN_FILE);
			}
		}
	}

	/** 파일에 저장된 토큰을 읽어 반환 (없으면 빈 문자열) */
	public String getToken() {
		isClient();
		try {
			File tokenFile = new File(tokenFilePath);
			if (!tokenFile.exists()) {
				return "";
			}
			return Files.readString(tokenFile.toPath(), StandardCharsets.UTF_8).trim();
		} catch (Exception e) {
			throw new JenkinsApiException(ErrorCode.JENKINS_INVALID_TOKEN_FILE);
		}
	}

	/**
	 * 사용자가 입력한 초기 비밀번호(initialPassword)로
	 * Crumb→토큰 발급→tokenFile 에 덮어쓰기
	 */
	public void generateAndSaveToken(String initialPassword) throws IOException, NullPointerException {
		// 1) Crumb 발급
		// 1) Crumb 발급 (+ set-cookie 헤더 얻기)
		isClient();
		ResponseEntity<String> crumbEntity = webClientForAuth.mutate()
			.defaultHeaders(h -> h.setBasicAuth(user, initialPassword))
			.build()
			.get()
			.uri("/crumbIssuer/api/json")
			.retrieve()
			.toEntity(String.class)
			.block();

		if (crumbEntity == null
			|| crumbEntity.getBody() == null) {
			throw new JenkinsApiException(ErrorCode.JENKINS_EMPTY_CRUMB);
		}

		if (!crumbEntity.getStatusCode().is2xxSuccessful()) {
			throw new JenkinsApiException(ErrorCode.JENKINS_API_UNSUCCESSFULL);
		}

		CrumbDto crumb = JenkinsParser.parseCrumb(crumbEntity.getBody());

		// 2) JSESSIONID 값만 추출
		// crumbEntity.getHeaders().getFirst("Set-Cookie") 예: "JSESSIONID=abc123; Path=/; HttpOnly"
		String setCookie = crumbEntity.getHeaders().getFirst(HttpHeaders.SET_COOKIE);
		if (setCookie == null) {
			throw new JenkinsApiException(ErrorCode.JENKINS_EMPTY_COOKIE);
		}
		// 세미콜론 앞부분만 가져와 "JSESSIONID=abc123"
		String jsessionPair = setCookie.split(";", 2)[0];

		// 3) 토큰명 생성
		String tokenName = "token-" + System.currentTimeMillis();

		// 4) POST 요청에 쿠키 값 전달
		ResponseEntity<String> tokenEntity = webClientForAuth.mutate()
			.defaultHeaders(h -> {
				h.setBasicAuth(user, initialPassword);
				h.set(crumb.getCrumbRequestField(), crumb.getCrumb());
			})
			.build()
			.post()
			.uri("/me/descriptorByName/jenkins.security.ApiTokenProperty/generateNewToken/api/json")
			.header(HttpHeaders.COOKIE, jsessionPair)               // <— 여기서 직접 Cookie 헤더 설정
			.contentType(MediaType.APPLICATION_FORM_URLENCODED)
			.body(BodyInserters.fromFormData("newTokenName", tokenName))
			.retrieve()
			.toEntity(String.class)
			.block();

		// 5) tokenValue 파싱 & 저장 (기존대로)
		if (tokenEntity == null || !tokenEntity.getStatusCode().is2xxSuccessful() || tokenEntity.getBody() == null) {
			throw new JenkinsApiException(ErrorCode.JENKINS_EMPTY_TOKEN);
		}
		String response = tokenEntity.getBody();
		String tokenValue = new JSONObject(response)
			.getJSONObject("data")
			.getString("tokenValue");

		File tokenFile = new File(tokenFilePath);
		File parentDir = tokenFile.getParentFile();
		if (parentDir != null && !parentDir.exists()) {
			boolean created = parentDir.mkdirs();
			if (!created) {
				throw new JenkinsApiException(ErrorCode.JENKINS_DIRECTORY_CREATE_ERROR);
			}
		}

		Files.writeString(tokenFile.toPath(),
			tokenValue,
			StandardOpenOption.CREATE,
			StandardOpenOption.TRUNCATE_EXISTING);
	}

}
