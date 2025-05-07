package com.corp.devpilot.jenkinsapi.service;

import java.util.List;

import javax.net.ssl.SSLException;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.http.client.reactive.ReactorClientHttpConnector;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import com.corp.devpilot.global.error.code.ErrorCode;
import com.corp.devpilot.global.error.exception.JenkinsApiException;
import com.corp.devpilot.jenkinsapi.domain.dto.JenkinsInfoDto;
import com.corp.devpilot.jenkinsapi.domain.dto.ProgressiveLogDto;
import com.corp.devpilot.jenkinsapi.parser.JenkinsParser;

import io.netty.handler.ssl.SslContext;
import io.netty.handler.ssl.SslContextBuilder;
import io.netty.handler.ssl.util.InsecureTrustManagerFactory;
import reactor.core.publisher.Mono;
import reactor.netty.http.client.HttpClient;

@Service
public class JenkinsApiService {

	private final WebClient client;
	private final String user;
	private final TokenManager tokenManager;
	private final String baseUrl;

	public JenkinsApiService(
		TokenManager tokenManager,
		@Value("${server.jenkins.url}") String url,
		@Value("${server.jenkins.user}") String user
	) throws SSLException {

		this.baseUrl = url;
		this.tokenManager = tokenManager;
		this.user = user;

		// 모든 인증서 신뢰(임시용)
		SslContext sslContext = SslContextBuilder.forClient()
			.trustManager(InsecureTrustManagerFactory.INSTANCE)
			.build();

		HttpClient httpClient = HttpClient.create()
			.secure(spec -> spec.sslContext(sslContext));

		this.client = WebClient.builder()
			.baseUrl(url)
			.clientConnector(new ReactorClientHttpConnector(httpClient))
			.build();

		//        this.client = WebClient.builder()
		//                .baseUrl(url)
		//                .defaultHeaders(h -> h.setBasicAuth(user, token))
		//                .build();
	}

	// 토큰 증명용
	private WebClient authorizedClient() {
		String token = tokenManager.getToken().trim();
		if (token.isEmpty()) {
			throw new JenkinsApiException(ErrorCode.JENKINS_EMPTY_TOKEN);
		}
		return this.client.mutate()
			.defaultHeaders(h -> h.setBasicAuth(user, token))
			.build();
	}

	public JenkinsInfoDto fetchInfo() {
		// GET 요청이므로 Crumb 없이 바로 호출
		String body = authorizedClient().get()
			.uri(uri -> uri.path("/api/json")
				.queryParam("pretty", "true")
				.build())
			.retrieve()
			.bodyToMono(String.class)
			.block();

		return JenkinsParser.parseInfo(body);
	}

	/**
	 * offset 지점부터 로그 청크 하나를 가져옵니다.
	 * @param jobName     Jenkins job name
	 * @param buildNumber build 번호
	 * @param offset      이전까지 읽은 바이트 수
	 */
	@SuppressWarnings("checkstyle:WhitespaceAround")
	public ProgressiveLogDto fetchProgressiveLog(
		String jobName, int buildNumber, long offset
	) {
		Mono<ResponseEntity<String>> mono = authorizedClient().get()
			.uri(uri -> uri
				.path("/job/{job}/build}/logText/progressiveText")
				.queryParam("start", offset)
				.build(jobName, buildNumber))
			.retrieve()
			.toEntity(String.class);

		ResponseEntity<String> res = mono.block();
		try {
			assert res != null;
			List<String> sizeHdr = res.getHeaders().get("X-Text-Size");
			List<String> moreHdr = res.getHeaders().get("X-More-Data");

			long newOffset = (sizeHdr != null && !sizeHdr.isEmpty())
				? Long.parseLong(sizeHdr.get(0))
				: offset;
			boolean more = (moreHdr != null && !moreHdr.isEmpty())
				&& Boolean.parseBoolean(moreHdr.get(0));

			// 3) DTO 반환
			return new ProgressiveLogDto(
				res.getBody(),   // 이번에 읽은 로그 청크
				newOffset,      // 다음 호출 때 사용할 오프셋
				more            // 더 읽을 데이터가 남았는지
			);
		} catch (Exception e) {
			throw new JenkinsApiException(ErrorCode.JENKINS_EMPTY_RESPONSE);
		}
	}

}
