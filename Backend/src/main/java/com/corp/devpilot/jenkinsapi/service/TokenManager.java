package com.corp.devpilot.jenkinsapi.service;

import java.io.File;
import java.io.IOException;
import java.net.CookieManager;
import java.net.CookiePolicy;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.StandardOpenOption;

import javax.net.ssl.SSLException;

import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.client.reactive.ReactorClientHttpConnector;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;

import com.corp.devpilot.jenkinsapi.domain.dto.CrumbDto;
import com.corp.devpilot.jenkinsapi.parser.JenkinsParser;

import io.netty.handler.ssl.SslContext;
import io.netty.handler.ssl.SslContextBuilder;
import io.netty.handler.ssl.util.InsecureTrustManagerFactory;
import reactor.netty.http.client.HttpClient;

@Component
public class TokenManager {

	private final WebClient webClientForAuth;
	private final String user;
	private final File tokenFile;

	public TokenManager(
		@Value("${server.jenkins.url}") String url,
		@Value("${server.jenkins.user}") String user,
		@Value("${server.jenkins.tokenFile}") String tokenFilePath
	) throws SSLException {
		this.user = user;
		this.tokenFile = new File(tokenFilePath);

		SslContext sslContext = SslContextBuilder.forClient()
			.trustManager(InsecureTrustManagerFactory.INSTANCE)
			.build();

		CookieManager cookieManager = new CookieManager();
		cookieManager.setCookiePolicy(CookiePolicy.ACCEPT_ALL);

		HttpClient httpClient = HttpClient.create()
			.secure(spec -> spec.sslContext(sslContext));

		this.webClientForAuth = WebClient.builder()
			.baseUrl(url)
			.clientConnector(new ReactorClientHttpConnector(httpClient))
			.build();
	}

	/** 파일에 저장된 토큰을 읽어 반환 (없으면 빈 문자열) */
	public String getToken() {
		try {
			if (!tokenFile.exists()) {
				return "";
			}
			return Files.readString(tokenFile.toPath(), StandardCharsets.UTF_8).trim();
		} catch (Exception e) {
			throw new IllegalStateException("Cannot read token file", e);
		}
	}

	/**
	 * 사용자가 입력한 초기 비밀번호(initialPassword)로
	 * Crumb→토큰 발급→tokenFile 에 덮어쓰기
	 */
	@SuppressWarnings("checkstyle:OperatorWrap")
	public void generateAndSaveToken(String initialPassword) throws IOException, NullPointerException {
		// 1) Crumb 발급
		// 1) Crumb 발급 (+ set-cookie 헤더 얻기)
		ResponseEntity<String> crumbEntity = webClientForAuth.mutate()
			.defaultHeaders(h -> h.setBasicAuth(user, initialPassword))
			.build()
			.get()
			.uri("/crumbIssuer/api/json")
			.retrieve()
			.toEntity(String.class)
			.block();

		if (crumbEntity == null
			|| !crumbEntity.getStatusCode().is2xxSuccessful()
			|| crumbEntity.getBody() == null) {
			throw new IllegalStateException(
				"Failed to fetch crumb: status="
					+ (crumbEntity == null ? "null" : crumbEntity.getStatusCode())
					+ ", body=" + (crumbEntity == null
					? "null" : crumbEntity.getBody())
			);
		}

		CrumbDto crumb = JenkinsParser.parseCrumb(crumbEntity.getBody());

		// 2) JSESSIONID 값만 추출
		// crumbEntity.getHeaders().getFirst("Set-Cookie") 예: "JSESSIONID=abc123; Path=/; HttpOnly"
		String setCookie = crumbEntity.getHeaders().getFirst(HttpHeaders.SET_COOKIE);
		if (setCookie == null) {
			throw new IllegalStateException("No JSESSIONID in crumb response");
		}
		// 세미콜론 앞부분만 가져와 "JSESSIONID=abc123"
		String jsessionPair = setCookie.split(";", 2)[0];

		// 3) 토큰명 생성
		String tokenName = "token-" + System.currentTimeMillis();

		// 4) POST 요청에 쿠키 값만 전달
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
		String response = tokenEntity.getBody();
		String tokenValue = new JSONObject(response)
			.getJSONObject("data")
			.getString("tokenValue");

		File parentDir = tokenFile.getParentFile();
		if (parentDir != null && !parentDir.exists()) {
			boolean created = parentDir.mkdirs();
			if (!created) {
				throw new IllegalStateException("Failed to create directory: " + parentDir.getAbsolutePath());
			}
		}

		Files.writeString(tokenFile.toPath(),
			tokenValue,
			StandardOpenOption.CREATE,
			StandardOpenOption.TRUNCATE_EXISTING);
	}

}
